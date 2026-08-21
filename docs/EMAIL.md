# Email & Notifications (Phase 20)

## Scope

Transactional email only:

- Password reset (wired)
- Account invite / academic notifications — deferred

In-app notification center remains Coming Soon (header bell is a placeholder).

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `MAIL_TRANSPORT` | `console` | `console` \| `smtp` \| `memory` |
| `MAIL_FROM` | Shine Al Furqan \<noreply@…\> | From header |
| `MAIL_LOG_RESET_LINKS` | `true` | Console transport may log reset URL in **non-production only** |
| `SMTP_HOST` / `PORT` / `SECURE` / `USER` / `PASS` | — | Required when `MAIL_TRANSPORT=smtp` |

Tests force `MAIL_TRANSPORT=memory` (Vitest env).

## Behavior

1. `POST /auth/forgot-password` always returns the same generic message.
2. If the user exists and is active, a hashed reset token is stored and an email is sent via `sendMail`.
3. **Production never logs the reset token/URL.** Console transport only logs links when `NODE_ENV !== 'production'` and `MAIL_LOG_RESET_LINKS` is true.
4. Send failures are logged without the URL; the API still returns the generic success message (no account enumeration).

## Templates

`server/src/services/mail/templates.ts` — `buildPasswordResetEmail` (text + HTML).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No email in mailbox | `MAIL_TRANSPORT` still `console`? Switch to `smtp` + credentials |
| SMTP auth errors | Host/port/secure/user/pass; provider app passwords |
| Tests fail on outbox | Ensure Vitest `MAIL_TRANSPORT=memory` and `clearMailOutbox` between cases |
