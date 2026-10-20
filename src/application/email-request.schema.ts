import { z } from 'zod';

export const emailRequestSchema = z.object({
  messageId: z.uuid(),
  type: z.string().regex(/^email\.[a-z0-9-]+$/, 'type must be email.<template>'),
  createdAt: z.iso.datetime(),
  to: z.object({
    email: z.email(),
    name: z.string().min(1),
  }),
  data: z.unknown(),
});

export type EmailRequest = z.infer<typeof emailRequestSchema>;
