import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import * as authService from '../src/services/auth.service';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

const admin = TEST_USERS.find((u) => u.role === 'admin')!;
const student = TEST_USERS.find((u) => u.role === 'student')!;

function cookieFrom(res: request.Response): string[] {
  const raw = res.headers['set-cookie'];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

describe('Golden auth lifecycle', () => {
  beforeAll(async () => {
    await setupTestDb();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('login sets refresh cookie and refresh issues new access token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: TEST_PASSWORDS.admin,
    });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toEqual(expect.any(String));
    const cookies = cookieFrom(login);
    expect(cookies.some((c) => c.startsWith('saf_refresh_token='))).toBe(true);

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
  });

  it('logout then refresh is denied', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: student.email,
      password: TEST_PASSWORDS.student,
    });
    const cookies = cookieFrom(login);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookies);
    expect(logout.status).toBe(200);

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
    expect(refreshed.status).toBe(401);
  });

  it('forgot-password returns the same message for existing and unknown emails', async () => {
    const existing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: admin.email });
    const missing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody-exists@example.com' });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.body.message).toBe(missing.body.message);
  });

  it('reset-password works once then rejects reuse', async () => {
    const token = await authService.createPasswordResetTokenForTests(admin.email);
    const newPassword = 'AdminReset9x';

    const ok = await request(app).post('/api/auth/reset-password').send({
      token,
      password: newPassword,
    });
    expect(ok.status).toBe(200);

    const reuse = await request(app).post('/api/auth/reset-password').send({
      token,
      password: 'AnotherPass9x',
    });
    expect(reuse.status).toBe(400);

    const login = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: newPassword,
    });
    expect(login.status).toBe(200);

    // restore for later tests in this file / parallel suites share DB only within this file
    await authService.changePassword(
      String(login.body.user._id),
      { currentPassword: newPassword, newPassword: TEST_PASSWORDS.admin },
    );
  });

  it('change-password rejects wrong current password and accepts valid change', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: student.email,
      password: TEST_PASSWORDS.student,
    });
    const token = login.body.accessToken as string;

    const wrong = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass99', newPassword: 'StudentNew9x' });
    expect(wrong.status).toBe(400);

    const ok = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: TEST_PASSWORDS.student,
        newPassword: 'StudentNew9x',
      });
    expect(ok.status).toBe(200);

    const withNew = await request(app).post('/api/auth/login').send({
      email: student.email,
      password: 'StudentNew9x',
    });
    expect(withNew.status).toBe(200);

    await authService.changePassword(String(withNew.body.user._id), {
      currentPassword: 'StudentNew9x',
      newPassword: TEST_PASSWORDS.student,
    });
  });
});
