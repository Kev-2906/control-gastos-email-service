import { departmentManagerInvitationEmail } from './definitions/department-manager-invitation.email';
import { passwordResetEmail } from './definitions/password-reset.email';
import { reporterInvitationEmail } from './definitions/reporter-invitation.email';
import { EmailDefinition } from './email-definition';

const DEFINITIONS: EmailDefinition<any>[] = [
  departmentManagerInvitationEmail,
  reporterInvitationEmail,
  passwordResetEmail,
];

export const EMAIL_DEFINITIONS: Record<string, EmailDefinition<any>> = Object.fromEntries(
  DEFINITIONS.map((definition) => [definition.template, definition]),
);
