import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

async function loginAs(role: 'admin' | 'coordinator' | 'ustad' | 'student') {
  const user = TEST_USERS.find((item) => item.role === role)!;
  return (
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORDS[role] })
  ).body.accessToken as string;
}

describe('Golden dashboard aggregates', () => {
  let admin: string;
  let coordinator: string;
  let ustad: string;
  let student: string;
  let ustadId: string;
  let studentId: string;
  let courseId: string;
  let batchId: string;

  beforeAll(async () => {
    await setupTestDb();
    admin = await loginAs('admin');
    coordinator = await loginAs('coordinator');
    ustad = await loginAs('ustad');
    student = await loginAs('student');
    ustadId = String((await User.findOne({ role: 'ustad' }))!._id);
    studentId = String((await User.findOne({ role: 'student' }))!._id);
  }, 60_000);

  afterAll(teardownTestDb);

  it('baseline admin counts match seeded users only', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.metrics).toMatchObject({
      activeStudents: 1,
      activeUstads: 1,
      activeCoordinators: 1,
      publishedCourses: 0,
      activeBatches: 0,
      activeEnrollments: 0,
      quizAttemptsLast7Days: 0,
      lessonsCompletedLast7Days: 0,
    });
    expect(res.body.data.capacity).toMatchObject({
      totalSeats: 0,
      usedSeats: 0,
      availableSeats: 0,
      utilizationPercent: 0,
    });
    expect(res.body.data.attendance.totalRecords).toBe(0);
    expect(res.body.data.recentEnrollments).toEqual([]);
  });

  it('aggregates update after known course, batch, enrollment, and attendance', async () => {
    const course = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Dashboard Course', code: 'DASH-101', instructorIds: [ustadId] });
    expect(course.status).toBe(201);
    courseId = course.body.data._id;

    await request(app)
      .patch(`/api/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'published' });

    const batch = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: 'Dash Cohort',
        courseId,
        instructorIds: [ustadId],
        capacity: 10,
        status: 'active',
      });
    expect(batch.status).toBe(201);
    batchId = batch.body.data._id;

    const enrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${admin}`)
      .send({ studentId, courseId, batchId });
    expect(enrollment.status).toBe(201);

    const session = await request(app)
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${admin}`)
      .send({ batchId, sessionDate: '2026-08-15' });
    expect(session.status).toBe(201);

    await request(app)
      .put(`/api/attendance/sessions/${session.body.data._id}/records`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ records: [{ studentId, status: 'present' }] });

    const adminDash = await request(app)
      .get('/api/admin/dashboard')
      .query({ month: '2026-08' })
      .set('Authorization', `Bearer ${admin}`);

    expect(adminDash.body.data.metrics).toMatchObject({
      activeStudents: 1,
      activeUstads: 1,
      publishedCourses: 1,
      activeBatches: 1,
      activeEnrollments: 1,
    });
    expect(adminDash.body.data.capacity).toMatchObject({
      totalSeats: 10,
      usedSeats: 1,
      availableSeats: 9,
      utilizationPercent: 10,
      batchCount: 1,
    });
    expect(adminDash.body.data.attendance).toMatchObject({
      month: '2026-08',
      present: 1,
      absent: 0,
      totalRecords: 1,
      rate: 100,
    });
    expect(adminDash.body.data.recentEnrollments).toHaveLength(1);
    expect(adminDash.body.data.recentEnrollments[0]).toMatchObject({
      studentName: 'Test Student',
      course: 'Dashboard Course',
      status: 'active',
    });

    const coordDash = await request(app)
      .get('/api/coordinator/dashboard')
      .query({ month: '2026-08' })
      .set('Authorization', `Bearer ${coordinator}`);
    expect(coordDash.body.data.role).toBe('coordinator');
    expect(coordDash.body.data.metrics.activeEnrollments).toBe(1);

    const ustadDash = await request(app)
      .get('/api/ustad/dashboard')
      .query({ month: '2026-08' })
      .set('Authorization', `Bearer ${ustad}`);
    expect(ustadDash.body.data.role).toBe('ustad');
    expect(ustadDash.body.data.metrics).toMatchObject({
      assignedCourses: 1,
      publishedAssignedCourses: 1,
      assignedStudents: 1,
      activeEnrollments: 1,
    });
    expect(ustadDash.body.data.attendance.rate).toBe(100);

    const studentDash = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${student}`);
    expect(studentDash.body.data.role).toBe('student');
    expect(studentDash.body.data.metrics.activeEnrollments).toBe(1);
    expect(studentDash.body.data.courses).toHaveLength(1);
    expect(studentDash.body.data.courses[0].title).toBe('Dashboard Course');
    expect(studentDash.body.data.resumeCourse?.courseId).toBe(courseId);
    expect(studentDash.body.data.recentAttendance[0]).toMatchObject({
      status: 'present',
      sessionDate: '2026-08-15',
    });
  });
});
