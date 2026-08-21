import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { clearMailOutbox, mailOutbox, resetMailTransportForTests } from '../src/services/mail';
import { setupTestDb, teardownTestDb, TEST_USERS } from './helpers/testDb';

describe('Golden mail / password reset delivery', () => {
  beforeAll(setupTestDb, 60_000);
  afterAll(teardownTestDb);

  beforeEach(() => {
    resetMailTransportForTests();
    clearMailOutbox();
  });

  it('queues a reset email without exposing the token in the API response', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_USERS[0].email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/instructions have been sent/i);
    expect(JSON.stringify(res.body)).not.toMatch(/token=/);

    expect(mailOutbox).toHaveLength(1);
    expect(mailOutbox[0].to).toBe(TEST_USERS[0].email);
    expect(mailOutbox[0].subject).toMatch(/reset/i);
    expect(mailOutbox[0].text).toContain('/reset-password?token=');
    expect(mailOutbox[0].html).toContain('Reset your password');
  });

  it('returns the same message for unknown emails and does not queue mail', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/instructions have been sent/i);
    expect(mailOutbox).toHaveLength(0);
  });
});
