import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, TEST_PASSWORDS, TEST_USERS } from './helpers/testDb';

/** Minimal valid PDF magic. */
const PDF_BUF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
/** 1×1 PNG */
const PNG_BUF = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const EXE_BUF = Buffer.from('MZ' + 'A'.repeat(64));

async function loginAs(role: 'admin' | 'student' | 'ustad') {
  const user = TEST_USERS.find((item) => item.role === role)!;
  return (
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORDS[role] })
  ).body.accessToken as string;
}

describe('Golden learning resource uploads', () => {
  let admin: string;
  let student: string;
  let lessonId: string;
  let courseId: string;
  let resourceId: string;
  const uploadRoot = path.resolve('./uploads-test');

  beforeAll(async () => {
    await setupTestDb();
    admin = await loginAs('admin');
    student = await loginAs('student');
    const ustadId = String((await User.findOne({ role: 'ustad' }))!._id);
    const studentId = String((await User.findOne({ role: 'student' }))!._id);

    const course = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Upload course', code: 'UP-101', instructorIds: [ustadId] });
    courseId = course.body.data._id;
    await request(app)
      .patch(`/api/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'published' });
    const module = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'M1', order: 1 });
    const lesson = await request(app)
      .post(`/api/modules/${module.body.data._id}/lessons`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Materials', lessonType: 'pdf', order: 1, status: 'published' });
    lessonId = lesson.body.data._id;
    await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${admin}`)
      .send({ studentId, courseId });
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
    try {
      fs.rmSync(uploadRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('accepts allowed PDF and rejects disallowed executable', async () => {
    const ok = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', PDF_BUF, { filename: 'notes.pdf', contentType: 'application/pdf' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.originalFilename).toBe('notes.pdf');
    expect(ok.body.data.mimeType).toBe('application/pdf');
    expect(ok.body.data.storedKey).toBeUndefined();
    resourceId = ok.body.data._id;

    const png = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', PNG_BUF, { filename: 'dot.png', contentType: 'image/png' });
    expect(png.status).toBe(201);

    const bad = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', EXE_BUF, { filename: 'evil.exe', contentType: 'application/octet-stream' });
    expect(bad.status).toBe(400);
  });

  it('rejects oversized upload and path-traversal filenames', async () => {
    const huge = Buffer.alloc(1_048_577, 0x25); // > 1 MiB test limit; not valid PDF — expect 400 either way
    huge.write('%PDF', 0);
    const over = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', huge, { filename: 'big.pdf', contentType: 'application/pdf' });
    expect(over.status).toBe(400);

    const traverse = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin}`)
      .attach('file', PDF_BUF, {
        filename: '..\\..\\windows\\system32\\evil.pdf',
        contentType: 'application/pdf',
      });
    expect(traverse.status).toBe(201);
    expect(traverse.body.data.originalFilename).toBe('evil.pdf');
    expect(traverse.body.data.originalFilename).not.toMatch(/\.\./);
  });

  it('enforces auth on download and soft-deletes files', async () => {
    expect(
      (await request(app).get(`/api/resources/${resourceId}/download`)).status,
    ).toBe(401);

    const enrolled = await request(app)
      .get(`/api/resources/${resourceId}/download`)
      .set('Authorization', `Bearer ${student}`);
    expect(enrolled.status).toBe(200);
    expect(enrolled.headers['content-type']).toMatch(/pdf/);

    const del = await request(app)
      .delete(`/api/resources/${resourceId}`)
      .set('Authorization', `Bearer ${admin}`);
    expect(del.status).toBe(200);
    expect(del.body.data.status).toBe('deleted');

    const gone = await request(app)
      .get(`/api/resources/${resourceId}/download`)
      .set('Authorization', `Bearer ${admin}`);
    expect(gone.status).toBe(404);
  });

  it('denies student upload', async () => {
    const res = await request(app)
      .post(`/api/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${student}`)
      .attach('file', PDF_BUF, { filename: 'hack.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(403);
  });
});
