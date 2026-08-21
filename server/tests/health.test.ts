import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb } from './helpers/testDb';
import { assertProductionSafety } from '../src/config/productionGuards';
import { env } from '../src/config/env';

describe('API health & production guards', () => {
  beforeAll(setupTestDb, 60_000);
  afterAll(teardownTestDb);

  it('returns healthy status with mongodb up when connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      ready: true,
      checks: { mongodb: 'up' },
    });
  });

  it('exposes /api/health alias', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.checks.mongodb).toBe('up');
  });

  it('assertProductionSafety is a no-op outside production', () => {
    expect(env.NODE_ENV).not.toBe('production');
    expect(() => assertProductionSafety()).not.toThrow();
  });
});
