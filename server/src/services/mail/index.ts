import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import {
  clearMailOutbox,
  ConsoleMailTransport,
  mailOutbox,
  MemoryMailTransport,
  type MailMessage,
  type MailTransport,
  type MailSendResult,
} from './transport';

export { clearMailOutbox, mailOutbox };

let transport: MailTransport | null = null;

export function getMailTransport(): MailTransport {
  if (transport) return transport;

  if (env.MAIL_TRANSPORT === 'memory' || env.NODE_ENV === 'test') {
    transport = new MemoryMailTransport();
    return transport;
  }

  if (env.MAIL_TRANSPORT === 'smtp' && env.SMTP_HOST) {
    const smtp = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });

    transport = {
      async send(message: MailMessage): Promise<MailSendResult> {
        const info = await smtp.sendMail({
          from: env.MAIL_FROM,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
        return {
          messageId: String(info.messageId || ''),
          accepted: (info.accepted || []).map(String),
        };
      },
    };
    return transport;
  }

  transport = new ConsoleMailTransport(
    env.NODE_ENV !== 'production' && env.MAIL_LOG_RESET_LINKS,
  );
  return transport;
}

/** Test helper */
export function resetMailTransportForTests(): void {
  transport = null;
}

export async function sendMail(message: MailMessage): Promise<MailSendResult> {
  return getMailTransport().send(message);
}
