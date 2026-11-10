import { z } from 'zod';
import { EmailDefinition } from '../email-definition';

const UPDATE_TYPES = [
  'expense_sent',
  'expense_submitted',
  'expense_correction_requested',
  'expense_approved',
  'expense_posted',
  'expense_in_payment',
  'expense_paid',
  'expense_refused',
] as const;

const STATUSES = [
  'draft',
  'submitted',
  'approved',
  'posted',
  'in_payment',
  'paid',
  'refused',
] as const;

type UpdateType = (typeof UPDATE_TYPES)[number];
type Status = (typeof STATUSES)[number];
type PaymentMode = 'own_account' | 'company_account';

const WITHOUT_DESCRIPTION = 'sin descripción';

const TITLES: Record<UpdateType, (description: string, paymentMode: PaymentMode) => string> = {
  expense_sent: (description) => `Tu gasto «${description}» se envió a aprobación`,
  expense_submitted: (description) => `Tu gasto «${description}» volvió a revisión`,
  expense_correction_requested: (description) => `Te pidieron corregir tu gasto «${description}»`,
  expense_approved: (description) => `Tu gasto «${description}» fue aprobado`,
  expense_posted: (description) => `Tu gasto «${description}» se contabilizó`,
  expense_in_payment: (description) => `El reembolso de tu gasto «${description}» está en proceso`,
  expense_paid: (description, paymentMode) =>
    paymentMode === 'own_account'
      ? `Te reembolsaron tu gasto «${description}»`
      : `Tu gasto «${description}» quedó pagado por la empresa`,
  expense_refused: (description) => `Tu gasto «${description}» fue rechazado`,
};

const STATUS_LABELS: Record<Status, (paymentMode: PaymentMode) => string> = {
  draft: () => 'En corrección',
  submitted: () => 'En revisión',
  approved: () => 'Aprobado',
  posted: () => 'Contabilizado',
  in_payment: () => 'En proceso de pago',
  paid: (paymentMode) => (paymentMode === 'own_account' ? 'Reembolsado' : 'Pagado por la empresa'),
  refused: () => 'Rechazado',
};

const STATUS_COLORS: Record<Status, string> = {
  draft: '#b45309',
  submitted: '#1d4ed8',
  approved: '#15803d',
  posted: '#0f766e',
  in_payment: '#0e7490',
  paid: '#166534',
  refused: '#b91c1c',
};

const expenseUpdateSchema = z.object({
  type: z.enum(UPDATE_TYPES),
  status: z.enum(STATUSES),
  expenseDescription: z.string().nullable(),
  total: z.number().nullable(),
  currency: z.string().length(3).nullable(),
  paymentMode: z.enum(['own_account', 'company_account']),
  expenseUrl: z.url(),
});

const expenseUpdatesSchema = z.object({
  updates: z.array(expenseUpdateSchema).min(1),
});

type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;

function titleOf({ type, expenseDescription, paymentMode }: ExpenseUpdate): string {
  return TITLES[type](expenseDescription || WITHOUT_DESCRIPTION, paymentMode);
}

function amountOf({ total, currency }: ExpenseUpdate): string | null {
  if (total === null || currency === null) return null;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(total);
}

export const expenseUpdatesEmail: EmailDefinition<z.infer<typeof expenseUpdatesSchema>> = {
  template: 'expense-updates',
  dataSchema: expenseUpdatesSchema,
  subject: ({ updates }) =>
    updates.length === 1 ? titleOf(updates[0]) : `${updates.length} de tus gastos tienen novedades`,
  variables: (recipientName, { updates }) => ({
    recipientName,
    count: String(updates.length),
    single: updates.length === 1,
    updates: updates.map((update) => ({
      title: titleOf(update),
      status: STATUS_LABELS[update.status](update.paymentMode),
      statusColor: STATUS_COLORS[update.status],
      amount: amountOf(update),
      expenseUrl: update.expenseUrl,
    })),
  }),
};
