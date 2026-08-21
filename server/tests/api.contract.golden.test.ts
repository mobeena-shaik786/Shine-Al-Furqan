import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

describe('Golden API contract (Phase 15)', () => {
  beforeAll(setupTestDb, 60_000);
  afterAll(teardownTestDb);

  it('success envelope includes requestId and X-Request-Id header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(typeof res.body.requestId).toBe('string');
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });

  it('error envelope includes code, message, and requestId', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      code: 'UNAUTHORIZED',
    });
    expect(typeof res.body.message).toBe('string');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('invalid ObjectId returns 400 INVALID_ID', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USERS[0].email, password: TEST_PASSWORDS.admin });
    const token = login.body.accessToken as string;

    const res = await request(app)
      .get('/api/users/not-a-valid-object-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'INVALID_ID' });
  });

  it('Zod validation failures use VALIDATION_ERROR', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USERS[0].email, password: TEST_PASSWORDS.admin });
    const token = login.body.accessToken as string;

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x', email: 'bad', password: 'short', role: 'student' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
