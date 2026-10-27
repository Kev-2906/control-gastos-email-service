import { z } from 'zod';
import { EmailDefinition } from '../email-definition';
import { formatDate } from '../format-date.helper';

const departmentManagerInvitationSchema = z.object({
  organizationName: z.string().min(1),
  departmentName: z.string().min(1),
  acceptUrl: z.url(),
  expiresAt: z.iso.datetime(),
});

export const departmentManagerInvitationEmail: EmailDefinition<
  z.infer<typeof departmentManagerInvitationSchema>
> = {
  template: 'department-manager-invitation',
  dataSchema: departmentManagerInvitationSchema,
  subject: ({ organizationName }) => `${organizationName} te invita al Portal de Gastos`,
  variables: (recipientName, { organizationName, departmentName, acceptUrl, expiresAt }) => ({
    recipientName,
    organizationName,
    departmentName,
    acceptUrl,
    expiration: formatDate(expiresAt),
  }),
};
