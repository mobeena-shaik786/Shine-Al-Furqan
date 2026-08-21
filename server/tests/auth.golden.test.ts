import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

const admin = TEST_USERS.find((u) => u.role === 'admin')!;

describe('Golden auth flows', () => {
  beforeAll(async () => {
    await setupTestDb();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('successful login returns accessToken and user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: TEST_PASSWORDS.admin,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: admin.email.toLowerCase(),
      role: 'admin',
    });
    expect(res.body.user.password).toBeUndefined();
  });

  it('failed login with wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: 'WrongPassword_999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /me restores session with Bearer token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: TEST_PASSWORDS.admin,
    });
    const token = login.body.accessToken as string;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      email: admin.email.toLowerCase(),
      role: 'admin',
    });
  });

  it('GET /me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
