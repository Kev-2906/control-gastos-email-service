import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { PermanentEmailError } from '../../application/errors/permanent-email.error';
import { EmailSenderPort, OutgoingEmail } from '../../application/ports/email-sender.port';

export interface MailgunSettings {
  apiKey: string;
  domain: string;
  url: string;
  from: string;
}

export class MailgunEmailSenderAdapter implements EmailSenderPort {
  private readonly client: ReturnType<Mailgun['client']>;

  constructor(private readonly settings: MailgunSettings) {
    this.client = new Mailgun(FormData).client({
      username: 'api',
      key: settings.apiKey,
      url: settings.url,
    });
  }

  async send({ to, subject, template, variables }: OutgoingEmail): Promise<void> {
    try {
      await this.client.messages.create(this.settings.domain, {
        from: this.settings.from,
        to: [`${to.name} <${to.email}>`],
        subject,
        template,
        't:variables': JSON.stringify(variables),
        't:text': 'yes',
      });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw new PermanentEmailError(`Mailgun rejected the email (HTTP ${status})`);
      }
      throw error;
    }
  }
}
