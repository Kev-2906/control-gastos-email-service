import { EMAIL_DEFINITIONS } from '../email-definitions';
import { emailRequestSchema } from '../email-request.schema';
import { PermanentEmailError } from '../errors/permanent-email.error';
import { EmailSenderPort } from '../ports/email-sender.port';

export class SendRequestedEmailUseCase {
  constructor(private readonly emailSender: EmailSenderPort) {}

  async execute(message: unknown): Promise<void> {
    const request = emailRequestSchema.safeParse(message);
    if (!request.success) throw new PermanentEmailError('Malformed email request');

    const { type, to, data } = request.data;

    const template = type.slice('email.'.length);
    const definition = EMAIL_DEFINITIONS[template];
    if (!definition) throw new PermanentEmailError(`Unknown email template: ${template}`);

    const emailData = definition.dataSchema.safeParse(data);
    if (!emailData.success) throw new PermanentEmailError(`Invalid data for template: ${template}`);

    await this.emailSender.send({
      to,
      subject: definition.subject(emailData.data),
      template,
      variables: definition.variables(to.name, emailData.data),
    });
  }
}
