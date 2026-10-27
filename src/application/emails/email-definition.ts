import { z } from 'zod';

export interface EmailDefinition<TData> {
  template: string;
  dataSchema: z.ZodType<TData>;
  subject(data: TData): string;
  variables(recipientName: string, data: TData): Record<string, string>;
}
