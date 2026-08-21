import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

const PDF_BUF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function loginAs(role: keyof typeof TEST_PASSWORDS) {
  const user = TEST_USERS.find((item) => item.role === role)!;
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: TEST_PASSWORDS[role] });
  return res.body.accessToken as string;
}

describe('Golden security abuse (Phase 22)', () => {
  let admin: string;
  let student: string;
  let ustad: string;
  let coordinator: string;
  let foreignCourseId: string;
  let foreignLessonId: string;
  let foreignResourceId: string;
  let foreignBatchId: string;
  let enrollmentId: string;

  beforeAll(async () => {
    await setupTestDb();
    admin = await loginAs('admin');
    student = await loginAs('student');
    ustad = await loginAs('ustad');
    coordinator = await loginAs('coordinator');

    const studentId = String((await User.findOne({ role: 'student' }))!._id);
    // Second ustad so seeded ustad is NOT an instructor on this course
    const otherUstad = await User.create({
      name: 'Other Ustad',
      email: 'other-ustad@example.com',
      password: TEST_PASSWORDS.ustad,
      role: 'ustad',
      isActive: true,
    });

    const course = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        title: 'Foreign course',
        code: 'SEC-901',
        instructorIds: [String(otherUstad._id)],
      });
    foreignCourseId = course.body.data._id;
    await request(app)
      .patch(`/api/courses/${foreignCourseId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'published' });

    const module = await request(app)
      .post(`/api/courses/${foreignCourseId}/modules`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'M1', order: 1 });
    const lesson = await request(app)
      .post(`/api/modules/${module.body.data._id}/lessons`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Secret PDF', lessonType: 'pdf', order: 1, status: 'published' });
    foreignLessonId = lesson.body.data._id;

    const uploaded = await request(app)
      .post(`/api/lessons/${foreignLessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', PDF_BUF, { filename: 'secret.pdf', contentType: 'application/pdf' });
    foreignResourceId = uploaded.body.data._id;

    const batch = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: 'Foreign batch',
        courseId: foreignCourseId,
        instructorIds: [String(otherUstad._id)],
      });
    foreignBatchId = batch.body.data._id;

    const enrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${admin}`)
      .send({ studentId, courseId: foreignCourseId, batchId: foreignBatchId });
    enrollmentId = enrollment.body.data._id;

    await request(app)
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${admin}`)
      .send({ batchId: foreignBatchId, sessionDate: '2026-08-01' });
  }, 90_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('rejects NoSQL-style login payloads via validation', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'anything' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body).not.toHaveProperty('accessToken');
  });

  it('applies rate-limit headers on sensitive auth routes', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPass1!' });
    expect(login.headers['ratelimit-limit'] || login.headers['x-ratelimit-limit']).toBeTruthy();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'NewPass1!NewPass1!' });
    expect(reset.headers['ratelimit-limit'] || reset.headers['x-ratelimit-limit']).toBeTruthy();

    const refresh = await request(app).post('/api/auth/refresh');
    expect(refresh.headers['ratelimit-limit'] || refresh.headers['x-ratelimit-limit']).toBeTruthy();
  });

  it('blocks unassigned ustad from foreign resource download and batch access', async () => {
    const download = await request(app)
      .get(`/api/resources/${foreignResourceId}/download`)
      .set('Authorization', `Bearer ${ustad}`);
    expect(download.status).toBe(403);

    const batchGet = await request(app)
      .get(`/api/batches/${foreignBatchId}`)
      .set('Authorization', `Bearer ${ustad}`);
    expect(batchGet.status).toBe(403);

    const batches = await request(app)
      .get('/api/batches')
      .set('Authorization', `Bearer ${ustad}`);
    expect(batches.status).toBe(200);
    const ids = (batches.body.data as Array<{ _id: string }>).map((b) => b._id);
    expect(ids).not.toContain(foreignBatchId);

    const sessions = await request(app)
      .get('/api/attendance/sessions')
      .set('Authorization', `Bearer ${ustad}`);
    expect(sessions.status).toBe(200);
    expect(
      (sessions.body.data as Array<{ batchId: string }>).every((s) => s.batchId !== foreignBatchId),
    ).toBe(true);
  });

  it('prevents student self-complete of enrollment; allows staff complete', async () => {
    const denied = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/status`)
      .set('Authorization', `Bearer ${student}`)
      .send({ status: 'completed' });
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/status`)
      .set('Authorization', `Bearer ${coordinator}`)
      .send({ status: 'completed' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('completed');
  });

  it('does not return password fields on login or /me', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_USERS.find((u) => u.role === 'admin')!.email,
        password: TEST_PASSWORDS.admin,
      });
    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty('password');
    expect(login.body.user).not.toHaveProperty('passwordHash');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.body.data).not.toHaveProperty('password');
  });

  it('rejects oversized JSON bodies', async () => {
    const huge = 'x'.repeat(1_100_000);
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.com', password: huge }));
    expect(res.status).toBe(413);
  });
});
