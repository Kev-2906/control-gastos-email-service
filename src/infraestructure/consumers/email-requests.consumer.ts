import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PermanentEmailError } from '../../application/errors/permanent-email.error';
import { SendRequestedEmailUseCase } from '../../application/use-cases/send-requested-email.use-case';
import {
  DEAD_LETTER_EXCHANGE,
  EMAIL_ROUTING_PATTERN,
  EMAILS_QUEUE,
  MAX_DELIVERIES,
  NOTIFICATIONS_EXCHANGE,
  SEND_REQUESTED_EMAIL_UC,
} from '../../constants';

interface IncomingAmqpMessage {
  fields: { routingKey: string };
  properties: { messageId?: string; headers?: Record<string, unknown> };
}

const BASE_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;

@Injectable()
export class EmailRequestsConsumer {
  private readonly logger = new Logger(EmailRequestsConsumer.name);

  constructor(
    @Inject(SEND_REQUESTED_EMAIL_UC)
    private readonly sendRequestedEmail: SendRequestedEmailUseCase,
  ) {}

  @RabbitSubscribe({
    exchange: NOTIFICATIONS_EXCHANGE,
    routingKey: EMAIL_ROUTING_PATTERN,
    queue: EMAILS_QUEUE,
    queueOptions: {
      durable: true,
      deadLetterExchange: DEAD_LETTER_EXCHANGE,
      arguments: {
        'x-queue-type': 'quorum',
        'x-delivery-limit': MAX_DELIVERIES - 1,
      },
    },
  })
  async handle(message: unknown, amqpMessage: IncomingAmqpMessage): Promise<Nack | void> {
    const messageId = String(amqpMessage.properties.messageId ?? 'without-id');
    const type = amqpMessage.fields.routingKey;
    const deliveryCount = Number(amqpMessage.properties.headers?.['x-delivery-count'] ?? 0);

    try {
      await this.sendRequestedEmail.execute(message);
      this.logger.log(`Sent ${type} (${messageId})`);
    } catch (error) {
      if (error instanceof PermanentEmailError) {
        this.logger.error(`Discarded ${type} (${messageId}): ${error.message}`);
        return new Nack(false);
      }

      // Último intento: no tiene caso esperar, va a la cola de muertos
      if (deliveryCount + 1 >= MAX_DELIVERIES) {
        this.logger.error(`Gave up ${type} (${messageId}) after ${MAX_DELIVERIES} attempts`);
        return new Nack(false);
      }

      // Error pasajero (Mailgun o la red): espera creciente y se reencola
      const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** deliveryCount, MAX_RETRY_DELAY_MS);
      this.logger.warn(
        `Failed ${type} (${messageId}), attempt ${deliveryCount + 1}/${MAX_DELIVERIES}; retrying in ${delay / 1000} s`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return new Nack(true);
    }
  }
}
