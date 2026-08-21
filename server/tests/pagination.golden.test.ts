import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

async function loginAdmin() {
  return (
    await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USERS[0].email, password: TEST_PASSWORDS.admin })
  ).body.accessToken as string;
}

describe('Golden pagination & performance bounds', () => {
  let admin: string;

  beforeAll(async () => {
    await setupTestDb();
    admin = await loginAdmin();
  }, 60_000);

  afterAll(teardownTestDb);

  it('batches and enrollments return meta with bounded pages', async () => {
    const batches = await request(app)
      .get('/api/batches')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${admin}`);
    expect(batches.status).toBe(200);
    expect(Array.isArray(batches.body.data)).toBe(true);
    expect(batches.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(typeof batches.body.meta.total).toBe('number');

    const enrollments = await request(app)
      .get('/api/enrollments')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${admin}`);
    expect(enrollments.status).toBe(200);
    expect(enrollments.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('rejects oversize limit', async () => {
    const res = await request(app)
      .get('/api/batches')
      .query({ limit: 500 })
      .set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('attendance lists include pagination meta', async () => {
    const sessions = await request(app)
      .get('/api/attendance/sessions')
      .query({ page: 1, limit: 20 })
      .set('Authorization', `Bearer ${admin}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.meta).toMatchObject({ page: 1, limit: 20 });
  });
});
