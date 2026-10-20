export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');
export const SEND_REQUESTED_EMAIL_UC = Symbol('SEND_REQUESTED_EMAIL_UC');

// RABBIT
export const NOTIFICATIONS_EXCHANGE = 'portal.notifications';
export const EMAIL_ROUTING_PATTERN = 'email.#';
export const EMAILS_QUEUE = 'email-service.emails';
export const DEAD_LETTER_EXCHANGE = 'email-service.dead-letter';
export const DEAD_LETTER_QUEUE = 'email-service.emails.dead';
export const MAX_DELIVERIES = 5;
