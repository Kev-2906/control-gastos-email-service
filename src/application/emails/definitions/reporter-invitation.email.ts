import { z } from 'zod';
import { EmailDefinition } from '../email-definition';
import { formatDate } from '../format-date.helper';

const reporterInvitationSchema = z.object({
  organizationName: z.string().min(1),
  departmentName: z.string().min(1),
  inviterName: z.string().min(1),
  acceptUrl: z.url(),
  expiresAt: z.iso.datetime(),
});

export const reporterInvitationEmail: EmailDefinition<z.infer<typeof reporterInvitationSchema>> = {
  template: 'reporter-invitation',
  dataSchema: reporterInvitationSchema,
  subject: ({ organizationName }) => `${organizationName} te invita a reportar tus gastos`,
  variables: (
    recipientName,
    { organizationName, departmentName, inviterName, acceptUrl, expiresAt },
  ) => ({
    recipientName,
    organizationName,
    departmentName,
    inviterName,
    acceptUrl,
    expiration: formatDate(expiresAt),
  }),
};
