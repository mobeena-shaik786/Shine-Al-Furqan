import { env } from '../../config/env';

export function buildPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = 'Reset your Shine Al Furqan password';
  const text = [
    `Assalamu Alaikum ${input.name},`,
    '',
    'We received a request to reset your Shine Al Furqan LMS password.',
    `Open this link within 1 hour to choose a new password:`,
    input.resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    '— Shine Al Furqan',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; color: #1E2531; line-height: 1.5;">
  <p>Assalamu Alaikum ${escapeHtml(input.name)},</p>
  <p>We received a request to reset your <strong>Shine Al Furqan</strong> LMS password.</p>
  <p><a href="${escapeAttr(input.resetUrl)}" style="color:#B01828;font-weight:600;">Reset your password</a></p>
  <p style="color:#758188;font-size:14px;">This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
  <p style="color:#758188;font-size:12px;">Sent for ${escapeHtml(env.CLIENT_URL)}</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
