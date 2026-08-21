import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  /** Access token TTL (DEFAULT engineering: 15m). Alias: JWT_EXPIRES_IN */
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  /** Refresh token TTL (DEFAULT engineering: 7d) */
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SEED_ON_START: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  /** Absolute or relative path for local disk uploads (dev/demo). Not for multi-node prod. */
  UPLOAD_ROOT: z.string().min(1).default('./uploads'),
  /** Max upload size in bytes (DEFAULT 10 MiB). */
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  /** console | smtp | memory — memory forced in tests via vitest env. */
  MAIL_TRANSPORT: z.enum(['console', 'smtp', 'memory']).default('console'),
  MAIL_FROM: z.string().default('Shine Al Furqan <noreply@shinealfurqan.local>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  /** Log reset URLs only for console transport in non-production. Never in production. */
  MAIL_LOG_RESET_LINKS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

function normalizeEnv() {
  const mongo = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongo) process.env.MONGODB_URI = mongo;

  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (jwtSecret) process.env.JWT_SECRET = jwtSecret;

  const accessExpires =
    process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN;
  if (process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN) {
    process.env.JWT_ACCESS_EXPIRES_IN =
      process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN;
  }

  const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN;
  if (refreshExpires) process.env.JWT_REFRESH_EXPIRES_IN = refreshExpires;

  void accessExpires;
}

normalizeEnv();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  console.error(
    '❌ Refusing to start: set required env vars (see server/.env.example). JWT_SECRET must be at least 32 characters. No secret fallbacks are used.',
  );
  process.exit(1);
}

export const env = parsed.data;

/** @deprecated Prefer env.JWT_ACCESS_EXPIRES_IN */
export const JWT_EXPIRES_IN_COMPAT = env.JWT_ACCESS_EXPIRES_IN;
