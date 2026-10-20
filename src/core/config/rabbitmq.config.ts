import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  host: process.env.RABBITMQ_HOST,
  port: Number(process.env.RABBITMQ_PORT ?? 5672),
  user: process.env.RABBITMQ_USER,
  password: process.env.RABBITMQ_PASSWORD,
}));
