import { z } from 'zod';
import { EmailDefinition } from '../email-definition';
import { formatDate } from '../format-date.helper';

const passwordResetSchema = z.object({
  resetUrl: z.url(),
  expiresAt: z.iso.datetime(),
  expiresInMinutes: z.number().int().positive(),
});

export const passwordResetEmail: EmailDefinition<z.infer<typeof passwordResetSchema>> = {
  template: 'password-reset',
  dataSchema: passwordResetSchema,
  subject: () => 'Restablece tu contraseña del Portal de Gastos',
  variables: (recipientName, { resetUrl, expiresAt, expiresInMinutes }) => ({
    recipientName,
    resetUrl,
    expiration: formatDate(expiresAt),
    expiresInMinutes: String(expiresInMinutes),
  }),
};
