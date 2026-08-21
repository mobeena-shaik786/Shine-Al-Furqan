import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

type Role = 'admin' | 'student' | 'ustad';
async function loginAs(role: Role) {
  const user = TEST_USERS.find((item) => item.role === role)!;
  return (await request(app).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORDS[role] })).body.accessToken as string;
}

describe('Golden academic APIs', () => {
  let admin: string; let student: string; let ustadId: string; let courseId: string; let moduleId: string; let lessonId: string;
  beforeAll(async () => {
    await setupTestDb();
    admin = await loginAs('admin'); student = await loginAs('student');
    ustadId = String((await User.findOne({ role: 'ustad' }))!._id);
  }, 60_000);
  afterAll(teardownTestDb);

  it('creates and publishes a course, rejecting invalid instructors and students', async () => {
    const create = await request(app).post('/api/courses').set('Authorization', `Bearer ${admin}`).send({ title: 'Tajweed', code: 'TJ-101', instructorIds: [ustadId] });
    expect(create.status).toBe(201); courseId = create.body.data._id;
    expect((await request(app).patch(`/api/courses/${courseId}/status`).set('Authorization', `Bearer ${admin}`).send({ status: 'published' })).status).toBe(200);
    expect((await request(app).post('/api/courses').set('Authorization', `Bearer ${student}`).send({ title: 'No', code: 'NO' })).status).toBe(403);
    expect((await request(app).post('/api/courses').set('Authorization', `Bearer ${admin}`).send({ title: 'Bad', code: 'BAD', instructorIds: [String((await User.findOne({ role: 'student' }))!._id)] })).status).toBe(400);
  });

  it('orders content and hides draft lessons from students', async () => {
    const module = await request(app).post(`/api/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin}`).send({ title: 'Rules', order: 1 });
    expect(module.status).toBe(201); moduleId = module.body.data._id;
    const lesson = await request(app).post(`/api/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin}`).send({ title: 'Draft', order: 1 });
    lessonId = lesson.body.data._id;
    expect((await request(app).get(`/api/courses/${courseId}/lessons`).set('Authorization', `Bearer ${student}`)).status).toBe(403);
    await request(app).patch(`/api/lessons/${lessonId}`).set('Authorization', `Bearer ${admin}`).send({ status: 'published' });
    expect((await request(app).post(`/api/lessons/${lessonId}/progress`).set('Authorization', `Bearer ${student}`).send({ completed: true })).status).toBe(403);
    const studentId = String((await User.findOne({ role: 'student' }))!._id);
    await request(app).post('/api/enrollments').set('Authorization', `Bearer ${admin}`).send({ studentId, courseId });
    const visible = await request(app).get(`/api/courses/${courseId}/lessons`).set('Authorization', `Bearer ${student}`);
    expect(visible.body.data).toHaveLength(1);
    expect(visible.body.data[0].order).toBe(1);
  });

  it('enforces unique enrollment and calculates completed progress', async () => {
    const studentId = String((await User.findOne({ role: 'student' }))!._id);
    expect((await request(app).post('/api/enrollments').set('Authorization', `Bearer ${admin}`).send({ studentId, courseId })).status).toBe(409);
    expect((await request(app).post(`/api/lessons/${lessonId}/progress`).set('Authorization', `Bearer ${student}`).send({ completed: true })).status).toBe(200);
    const progress = await request(app).get(`/api/courses/${courseId}/progress`).set('Authorization', `Bearer ${student}`);
    expect(progress.body.data).toMatchObject({ completedCount: 1, totalPublishedLessons: 1, percent: 100 });
  });
});
