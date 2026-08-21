import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

type Role = 'admin' | 'coordinator' | 'ustad' | 'student';

const ENDPOINTS: Array<{ path: string; allow: Role[] }> = [
  { path: '/api/admin/dashboard', allow: ['admin'] },
  { path: '/api/coordinator/dashboard', allow: ['admin', 'coordinator'] },
  { path: '/api/ustad/dashboard', allow: ['admin', 'coordinator', 'ustad'] },
  { path: '/api/student/dashboard', allow: ['student'] },
];

const ALL_ROLES: Role[] = ['admin', 'coordinator', 'ustad', 'student'];

async function loginAs(role: Role): Promise<string> {
  const user = TEST_USERS.find((u) => u.role === role)!;
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: TEST_PASSWORDS[role] });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

describe('Golden RBAC flows', () => {
  const tokens: Partial<Record<Role, string>> = {};

  beforeAll(async () => {
    await setupTestDb();
    for (const role of ALL_ROLES) {
      tokens[role] = await loginAs(role);
    }
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('role matrix covers allow and deny for every dashboard endpoint', async () => {
    for (const endpoint of ENDPOINTS) {
      for (const role of ALL_ROLES) {
        const res = await request(app)
          .get(endpoint.path)
          .set('Authorization', `Bearer ${tokens[role]}`);

        if (endpoint.allow.includes(role)) {
          expect(res.status, `${role} → ${endpoint.path} should allow`).toBe(200);
          expect(res.body.success).toBe(true);
        } else {
          expect(res.status, `${role} → ${endpoint.path} should deny`).toBe(403);
          expect(res.body.success).toBe(false);
        }
      }
    }
  });

  it('admin dashboard payload identifies admin role', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.admin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });
});
