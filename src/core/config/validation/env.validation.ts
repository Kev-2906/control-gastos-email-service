import { z } from 'zod';

export const schema = z.object({
  RABBITMQ_HOST: z.string().trim().min(1, 'RABBITMQ_HOST is required'),
  RABBITMQ_PORT: z.coerce
    .number()
    .int('RABBITMQ_PORT must be an integer')
    .min(1, 'RABBITMQ_PORT must be a valid port')
    .max(65535, 'RABBITMQ_PORT must be a valid port')
    .default(5672),
  RABBITMQ_USER: z.string().trim().min(1, 'RABBITMQ_USER is required'),
  RABBITMQ_PASSWORD: z.string().trim().min(1, 'RABBITMQ_PASSWORD is required'),
  // Remitente; con un dominio sandbox debe ser una dirección de ese dominio
  EMAIL_FROM: z.string().trim().min(1, 'EMAIL_FROM is required'),
  MAILGUN_API_KEY: z.string().trim().min(1, 'MAILGUN_API_KEY is required'),
  MAILGUN_DOMAIN: z.string().trim().min(1, 'MAILGUN_DOMAIN is required'),
  // Region del dominio en Mailgun: https://api.mailgun.net (US) o https://api.eu.mailgun.net (EU)
  MAILGUN_URL: z.url('MAILGUN_URL must be a valid URL').default('https://api.mailgun.net'),
});
