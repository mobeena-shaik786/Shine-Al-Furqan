import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Golden production ops (Phase 21)', () => {
  it('seed CLI refuses when NODE_ENV=production', () => {
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'src/seeds/index.ts'],
      {
        cwd: serverRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          JWT_SECRET: 'test_jwt_secret_min_32_characters_xx',
          MONGODB_URI: 'mongodb://127.0.0.1:27017/shine-al-furqan-seed-refuse',
          MONGO_URI: 'mongodb://127.0.0.1:27017/shine-al-furqan-seed-refuse',
          CLIENT_URL: 'https://app.example.com',
          COOKIE_SECURE: 'true',
          SEED_ON_START: 'false',
          MAIL_TRANSPORT: 'smtp',
          SMTP_HOST: 'smtp.example.com',
        },
      },
    );

    expect(result.status).toBe(1);
    const out = `${result.stderr ?? ''}${result.stdout ?? ''}`;
    expect(out).toMatch(/Refusing to seed/i);
    expect(out).toMatch(/NODE_ENV=production/);
  });
});
