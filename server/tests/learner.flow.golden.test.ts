import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

/**
 * Critical learner journey (Phase 18): admin builds course → enrolls student →
 * student completes lesson → progress updates → quiz scored.
 */
describe('Golden E2E learner flow', () => {
  let adminToken: string;
  let studentToken: string;
  let ustadId: string;
  let studentId: string;
  let courseId: string;
  let lessonId: string;
  let quizId: string;

  beforeAll(async () => {
    await setupTestDb();
    adminToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USERS[0].email, password: TEST_PASSWORDS.admin })
    ).body.accessToken;
    studentToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USERS[1].email, password: TEST_PASSWORDS.student })
    ).body.accessToken;
    ustadId = String((await User.findOne({ role: 'ustad' }))!._id);
    studentId = String((await User.findOne({ role: 'student' }))!._id);
  }, 60_000);

  afterAll(teardownTestDb);

  it('runs admin → enroll → learn → quiz end-to-end', async () => {
    const course = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Learner Flow', code: 'FLOW-101', instructorIds: [ustadId] });
    expect(course.status).toBe(201);
    courseId = course.body.data._id;

    await request(app)
      .patch(`/api/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published' });

    const module = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Week 1', order: 1 });
    expect(module.status).toBe(201);

    const textLesson = await request(app)
      .post(`/api/modules/${module.body.data._id}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Intro',
        lessonType: 'text',
        order: 1,
        status: 'published',
        content: 'Bismillah',
      });
    expect(textLesson.status).toBe(201);
    lessonId = textLesson.body.data._id;

    const quizLesson = await request(app)
      .post(`/api/modules/${module.body.data._id}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Check', lessonType: 'quiz', order: 2, status: 'published' });
    expect(quizLesson.status).toBe(201);

    const enroll = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId, courseId });
    expect(enroll.status).toBe(201);

    const before = await request(app)
      .get(`/api/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(before.status).toBe(200);
    expect(before.body.data.percent).toBe(0);

    const complete = await request(app)
      .post(`/api/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ completed: true });
    expect(complete.status).toBe(200);

    const after = await request(app)
      .get(`/api/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(after.status).toBe(200);
    expect(after.body.data.percent).toBeGreaterThan(0);

    const quiz = await request(app)
      .post(`/api/lessons/${quizLesson.body.data._id}/quiz`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Flow quiz', passThresholdPercent: 50 });
    expect(quiz.status).toBe(201);
    quizId = quiz.body.data._id;

    const q = await request(app)
      .post(`/api/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        prompt: '1+1?',
        options: [
          { optionId: 'a', text: '2' },
          { optionId: 'b', text: '3' },
        ],
        correctOptionId: 'a',
        order: 1,
      });
    expect(q.status).toBe(201);

    const attempt = await request(app)
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: [{ questionId: q.body.data._id, optionId: 'a' }] });
    expect(attempt.status).toBe(201);
    expect(attempt.body.data).toMatchObject({ score: 1, percent: 100, passed: true });

    const dash = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(dash.status).toBe(200);
    expect(dash.body.data.metrics.activeEnrollments).toBeGreaterThanOrEqual(1);
    expect(dash.body.data.courses.some((c: { courseId: string }) => c.courseId === courseId)).toBe(
      true,
    );
  });
});
