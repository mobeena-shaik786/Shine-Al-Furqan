import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

async function loginAs(role: 'admin' | 'student') {
  const user = TEST_USERS.find((item) => item.role === role)!;
  return (await request(app).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORDS[role] })).body.accessToken as string;
}

describe('Golden quiz and attendance APIs', () => {
  let admin: string; let student: string; let studentId: string; let courseId: string; let lessonId: string; let quizId: string; let batchId: string;
  beforeAll(async () => {
    await setupTestDb(); admin = await loginAs('admin'); student = await loginAs('student');
    const ustadId = String((await User.findOne({ role: 'ustad' }))!._id); studentId = String((await User.findOne({ role: 'student' }))!._id);
    const course = await request(app).post('/api/courses').set('Authorization', `Bearer ${admin}`).send({ title: 'Quiz course', code: 'QUIZ-101', instructorIds: [ustadId] }); courseId = course.body.data._id;
    await request(app).patch(`/api/courses/${courseId}/status`).set('Authorization', `Bearer ${admin}`).send({ status: 'published' });
    const module = await request(app).post(`/api/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin}`).send({ title: 'Module', order: 1 });
    const lesson = await request(app).post(`/api/modules/${module.body.data._id}/lessons`).set('Authorization', `Bearer ${admin}`).send({ title: 'Knowledge check', lessonType: 'quiz', order: 1, status: 'published' }); lessonId = lesson.body.data._id;
    await request(app).post('/api/enrollments').set('Authorization', `Bearer ${admin}`).send({ studentId, courseId });
    const batch = await request(app).post('/api/batches').set('Authorization', `Bearer ${admin}`).send({ name: 'Morning', courseId, instructorIds: [ustadId] }); batchId = batch.body.data._id;
  }, 60_000);
  afterAll(teardownTestDb);

  it('creates, protects, and grades a quiz', async () => {
    expect((await request(app).post('/api/quizzes').set('Authorization', `Bearer ${student}`).send({ lessonId })).status).toBe(403);
    const created = await request(app).post(`/api/lessons/${lessonId}/quiz`).set('Authorization', `Bearer ${admin}`).send({ title: 'Check', passThresholdPercent: 60 }); expect(created.status).toBe(201); quizId = created.body.data._id;
    const q1 = await request(app).post(`/api/quizzes/${quizId}/questions`).set('Authorization', `Bearer ${admin}`).send({ prompt: 'One?', options: [{ optionId: 'a', text: 'A' }, { optionId: 'b', text: 'B' }], correctOptionId: 'a', order: 1 });
    const q2 = await request(app).post(`/api/quizzes/${quizId}/questions`).set('Authorization', `Bearer ${admin}`).send({ prompt: 'Two?', options: [{ optionId: 'a', text: 'A' }, { optionId: 'b', text: 'B' }], correctOptionId: 'b', order: 2 });
    const visible = await request(app).get(`/api/quizzes/${quizId}`).set('Authorization', `Bearer ${student}`); expect(visible.body.data.questions[0].correctOptionId).toBeUndefined();
    const passed = await request(app).post(`/api/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${student}`).send({ answers: [{ questionId: q1.body.data._id, optionId: 'a' }, { questionId: q2.body.data._id, optionId: 'b' }] }); expect(passed.body.data).toMatchObject({ score: 2, percent: 100, passed: true });
    const failed = await request(app).post(`/api/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${student}`).send({ answers: [{ questionId: q1.body.data._id, optionId: 'b' }, { questionId: q2.body.data._id, optionId: 'a' }] }); expect(failed.body.data).toMatchObject({ score: 0, passed: false });
  });

  it('records attendance and scopes student reads', async () => {
    const created = await request(app).post('/api/attendance/sessions').set('Authorization', `Bearer ${admin}`).send({ batchId, sessionDate: '2026-08-07' }); expect(created.status).toBe(201);
    expect((await request(app).post('/api/attendance/sessions').set('Authorization', `Bearer ${admin}`).send({ batchId, sessionDate: '2026-08-07' })).status).toBe(409);
    const marked = await request(app).put(`/api/attendance/sessions/${created.body.data._id}/records`).set('Authorization', `Bearer ${admin}`).send({ records: [{ studentId, status: 'present' }] }); expect(marked.status).toBe(200);
    const studentView = await request(app).get(`/api/attendance/sessions/${created.body.data._id}`).set('Authorization', `Bearer ${student}`); expect(studentView.body.data.records).toMatchObject([{ studentId, status: 'present' }]);
  });
});
