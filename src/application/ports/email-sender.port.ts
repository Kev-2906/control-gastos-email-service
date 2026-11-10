export interface OutgoingEmail {
  to: { email: string; name: string };
  subject: string;
  template: string;
  variables: Record<string, unknown>;
}

export interface EmailSenderPort {
  send(email: OutgoingEmail): Promise<void>;
}
