/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_min_32_chars_xxxxx',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/shine-al-furqan-test',
      CLIENT_URL: 'http://localhost:5173',
      SEED_ON_START: 'false',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      COOKIE_SECURE: 'false',
      UPLOAD_ROOT: './uploads-test',
      UPLOAD_MAX_BYTES: '1048576',
      MAIL_TRANSPORT: 'memory',
      MAIL_FROM: 'test@shinealfurqan.local',
      MAIL_LOG_RESET_LINKS: 'false',
    },
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
