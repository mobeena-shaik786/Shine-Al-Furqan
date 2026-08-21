export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailSendResult = {
  messageId: string;
  accepted: string[];
};

export interface MailTransport {
  send(message: MailMessage): Promise<MailSendResult>;
}

/** In-memory outbox for tests and console transport inspection. */
export const mailOutbox: MailMessage[] = [];

export function clearMailOutbox(): void {
  mailOutbox.length = 0;
}

export class MemoryMailTransport implements MailTransport {
  async send(message: MailMessage): Promise<MailSendResult> {
    mailOutbox.push(message);
    return { messageId: `memory-${mailOutbox.length}`, accepted: [message.to] };
  }
}

export class ConsoleMailTransport implements MailTransport {
  constructor(private readonly logResetLinks: boolean) {}

  async send(message: MailMessage): Promise<MailSendResult> {
    mailOutbox.push(message);
    console.log(`📧 Mail queued → ${message.to} · ${message.subject}`);
    if (this.logResetLinks) {
      const match = message.text.match(/https?:\/\/\S+/);
      if (match) console.log(`🔐 Password reset link (non-production only): ${match[0]}`);
    }
    return { messageId: `console-${Date.now()}`, accepted: [message.to] };
  }
}
