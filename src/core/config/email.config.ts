import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  from: process.env.EMAIL_FROM ?? '',
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY ?? '',
    domain: process.env.MAILGUN_DOMAIN ?? '',
    url: process.env.MAILGUN_URL ?? 'https://api.mailgun.net',
  },
}));
