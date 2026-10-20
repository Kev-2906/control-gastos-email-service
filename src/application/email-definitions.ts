import { z } from 'zod';

export interface EmailDefinition<TData> {
  dataSchema: z.ZodType<TData>;
  subject(data: TData): string;
  variables(recipientName: string, data: TData): Record<string, string>;
}

function formatDate(isoDate: string): string {
  const date = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoDate));
  return `${date} (hora del centro de México)`;
}

const departmentManagerInvitationSchema = z.object({
  organizationName: z.string().min(1),
  departmentName: z.string().min(1),
  acceptUrl: z.url(),
  expiresAt: z.iso.datetime(),
});

const departmentManagerInvitation: EmailDefinition<
  z.infer<typeof departmentManagerInvitationSchema>
> = {
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

export const EMAIL_DEFINITIONS: Record<string, EmailDefinition<any>> = {
  'department-manager-invitation': departmentManagerInvitation,
};
