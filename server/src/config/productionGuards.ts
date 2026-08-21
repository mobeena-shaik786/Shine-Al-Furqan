import { env } from './env';

/**
 * Hard production safety checks. Call from process entrypoint (`server.ts`) only —
 * not when importing `app` for tests.
 */
export function assertProductionSafety(): void {
  if (env.NODE_ENV !== 'production') return;

  const errors: string[] = [];

  if (!env.COOKIE_SECURE) {
    errors.push('COOKIE_SECURE must be true in production (HTTPS refresh cookies)');
  }

  if (/localhost|127\.0\.0\.1/i.test(env.CLIENT_URL)) {
    errors.push('CLIENT_URL must be the public HTTPS SPA origin (not localhost)');
  }

  if (env.SEED_ON_START) {
    errors.push('SEED_ON_START must be false in production');
  }

  if (env.MAIL_TRANSPORT === 'console' || env.MAIL_TRANSPORT === 'memory') {
    errors.push('MAIL_TRANSPORT must be smtp in production');
  }

  if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
    errors.push('SMTP_HOST is required when MAIL_TRANSPORT=smtp');
  }

  if (errors.length > 0) {
    console.error('❌ Production safety checks failed:');
    for (const err of errors) console.error(`   - ${err}`);
    console.error('See docs/DEPLOY.md for the production environment checklist.');
    process.exit(1);
  }
}
