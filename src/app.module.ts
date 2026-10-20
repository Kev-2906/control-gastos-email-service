import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { EmailSenderPort } from './application/ports/email-sender.port';
import { SendRequestedEmailUseCase } from './application/use-cases/send-requested-email.use-case';
import emailConfig from './core/config/email.config';
import { schema } from './core/config/validation/env.validation';
import rabbitmqConfig from './core/config/rabbitmq.config';
import {
  DEAD_LETTER_EXCHANGE,
  DEAD_LETTER_QUEUE,
  EMAIL_SENDER_PORT,
  NOTIFICATIONS_EXCHANGE,
  SEND_REQUESTED_EMAIL_UC,
} from './constants';
import { MailgunEmailSenderAdapter } from './infraestructure/adapters/mailgun-email-sender.adapter';
import { EmailRequestsConsumer } from './infraestructure/consumers/email-requests.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
      load: [rabbitmqConfig, emailConfig],
      validate: (config) => schema.parse(config),
    }),
    RabbitMQModule.forRootAsync({
      inject: [rabbitmqConfig.KEY],
      useFactory: (config: ConfigType<typeof rabbitmqConfig>) => ({
        uri: {
          hostname: config.host,
          port: config.port,
          username: config.user,
          password: config.password,
        },
        exchanges: [
          { name: NOTIFICATIONS_EXCHANGE, type: 'topic', options: { durable: true } },
          { name: DEAD_LETTER_EXCHANGE, type: 'topic', options: { durable: true } },
        ],
        queues: [
          {
            name: DEAD_LETTER_QUEUE,
            exchange: DEAD_LETTER_EXCHANGE,
            routingKey: '#',
            options: { durable: true, arguments: { 'x-queue-type': 'quorum' } },
          },
        ],
        // Un correo a la vez: el reintento con espera no bloquea a otros mensajes ya tomados
        prefetchCount: 1,
      }),
    }),
  ],
  providers: [
    {
      provide: EMAIL_SENDER_PORT,
      inject: [emailConfig.KEY],
      useFactory: (config: ConfigType<typeof emailConfig>): EmailSenderPort =>
        new MailgunEmailSenderAdapter({ ...config.mailgun, from: config.from }),
    },
    {
      provide: SEND_REQUESTED_EMAIL_UC,
      inject: [EMAIL_SENDER_PORT],
      useFactory: (emailSender: EmailSenderPort) => new SendRequestedEmailUseCase(emailSender),
    },
    EmailRequestsConsumer,
  ],
})
export class AppModule {}
