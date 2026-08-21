import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

type Role = 'admin' | 'coordinator' | 'ustad' | 'student';

async function loginAs(role: Role): Promise<string> {
  const user = TEST_USERS.find((u) => u.role === role)!;
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: TEST_PASSWORDS[role] });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

describe('Golden user management APIs', () => {
  let adminToken: string;
  let coordinatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    await setupTestDb();
    adminToken = await loginAs('admin');
    coordinatorToken = await loginAs('coordinator');
    studentToken = await loginAs('student');
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('lists admins with pagination meta for admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ role: 'admin', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((u: { role: string }) => u.role === 'admin')).toBe(true);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.stats.total).toBeGreaterThanOrEqual(1);
  });

  it('creates an admin user and rejects duplicate email', async () => {
    const email = `phase5.admin.${Date.now()}@example.com`;
    const create = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Phase5 Admin',
        email,
        password: 'SecurePass1',
        role: 'admin',
      });

    expect(create.status).toBe(201);
    expect(create.body.data.email).toBe(email);
    expect(create.body.data.role).toBe('admin');
    expect(create.body.data.isActive).toBe(true);
    expect(create.body.data.password).toBeUndefined();

    const dup = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dup',
        email,
        password: 'SecurePass1',
        role: 'admin',
      });
    expect(dup.status).toBe(409);
  });

  it('coordinator can manage students but not admins', async () => {
    const studentEmail = `phase5.student.${Date.now()}@example.com`;
    const createStudent = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        name: 'Phase5 Student',
        email: studentEmail,
        password: 'SecurePass1',
        role: 'student',
      });
    expect(createStudent.status).toBe(201);

    const createAdmin = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        name: 'Blocked Admin',
        email: `blocked.admin.${Date.now()}@example.com`,
        password: 'SecurePass1',
        role: 'admin',
      });
    expect(createAdmin.status).toBe(403);

    const listAdmins = await request(app)
      .get('/api/users')
      .query({ role: 'admin' })
      .set('Authorization', `Bearer ${coordinatorToken}`);
    expect(listAdmins.status).toBe(403);
  });

  it('student cannot access user APIs', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('updates user and toggles status; blocks self-deactivation', async () => {
    const email = `phase5.edit.${Date.now()}@example.com`;
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Editable User',
        email,
        password: 'SecurePass1',
        role: 'ustad',
      });
    const id = created.body.data._id as string;

    const patched = await request(app)
      .patch(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Editable User Updated' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.name).toBe('Editable User Updated');

    const deactivated = await request(app)
      .patch(`/api/users/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.isActive).toBe(false);

    const adminUser = TEST_USERS.find((u) => u.role === 'admin')!;
    const me = await request(app)
      .get('/api/users')
      .query({ role: 'admin', search: adminUser.email })
      .set('Authorization', `Bearer ${adminToken}`);
    const self = me.body.data.find((u: { email: string }) => u.email === adminUser.email);
    expect(self).toBeTruthy();

    const selfDeactivate = await request(app)
      .patch(`/api/users/${self._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(selfDeactivate.status).toBe(400);
  });

  it('rejects weak passwords on create', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Weak',
        email: `weak.${Date.now()}@example.com`,
        password: 'short',
        role: 'student',
      });
    expect(res.status).toBe(400);
  });
});
