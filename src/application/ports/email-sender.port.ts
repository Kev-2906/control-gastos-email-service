export interface OutgoingEmail {
  to: { email: string; name: string };
  subject: string;
  template: string;
  variables: Record<string, string>;
}

export interface EmailSenderPort {
  send(email: OutgoingEmail): Promise<void>;
}
