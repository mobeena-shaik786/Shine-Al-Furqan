import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Golden env fail-fast', () => {
  it('refuses to load env in production without JWT_SECRET', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '-e',
        "import './src/config/env.ts'",
      ],
      {
        cwd: serverRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          // Explicitly clear secrets so dotenv cannot fill them via "already set" empty override behavior
          JWT_SECRET: '',
          JWT_ACCESS_SECRET: '',
          MONGODB_URI: 'mongodb://127.0.0.1:27017/shine-al-furqan-failfast',
          MONGO_URI: '',
          // Prevent accidental seed side effects if something else imports
          SEED_ON_START: 'false',
        },
      },
    );

    expect(result.status).not.toBe(0);
    const stderr = `${result.stderr ?? ''}${result.stdout ?? ''}`;
    expect(stderr.toLowerCase()).toMatch(/invalid environment|jwt_secret|refusing to start/);
    // Never assert or echo actual secret values
    expect(stderr).not.toMatch(/test_jwt_secret_min_32/);
  });
});
