export interface OutgoingEmail {
  to: { email: string; name: string };
  subject: string;
  // Nombre de la plantilla guardada en el proveedor (Mailgun)
  template: string;
  // Valores para los {{campos}} de la plantilla
  variables: Record<string, string>;
}

export interface EmailSenderPort {
  send(email: OutgoingEmail): Promise<void>;
}
