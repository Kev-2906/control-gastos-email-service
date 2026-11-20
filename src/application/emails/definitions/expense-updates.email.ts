import { z } from 'zod';
import { EmailDefinition } from '../email-definition';

const EXPENSE_UPDATE_TYPES = [
  'expense_sent',
  'expense_submitted',
  'expense_correction_requested',
  'expense_approved',
  'expense_posted',
  'expense_in_payment',
  'expense_paid',
  'expense_refused',
  'expense_send_failed',
  'expense_send_delayed',
  'expense_send_stuck',
  'expense_commented',
] as const;

const GENERAL_UPDATE_TYPES = [
  'odoo_connection_invalid',
  'expense_submissions_stuck',
  'odoo_action_blocked',
  'odoo_connection_still_invalid',
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

type UpdateType = (typeof EXPENSE_UPDATE_TYPES)[number] | (typeof GENERAL_UPDATE_TYPES)[number];
type UpdatesScope = 'expense' | 'expenses' | 'portal';
type Status = (typeof STATUSES)[number];

const WITHOUT_DESCRIPTION = 'sin descripción';
const RETRIES_EXHAUSTED_CODE = 'ODOO_RETRIES_EXHAUSTED';
const COMPANY_ACCOUNT = 'company_account';

const HEADINGS: Record<UpdatesScope, string> = {
  expense: 'Novedades de tu gasto',
  expenses: 'Novedades de tus gastos',
  portal: 'Novedades del Portal de Gastos',
};

const BLOCKED_ACTIONS_FOR_ACTOR: Record<string, string> = {
  status_refresh: 'actualizar tus gastos desde Odoo',
  expense_submit: 'enviar tu gasto a Odoo',
  odoo_employees: 'consultar los empleados de Odoo',
  reporter_invitation: 'enviar la invitación',
  initial_sync: 'reintentar la sincronización con Odoo',
  catalog_refresh: 'actualizar los catálogos de Odoo',
  expense_comment: 'publicar tu comentario en Odoo',
  expense_comment_change: 'editar o eliminar tu comentario en Odoo',
};

const BLOCKED_ACTIONS_FOR_ADMIN: Record<string, string> = {
  status_refresh: 'actualizar sus gastos desde Odoo',
  expense_submit: 'enviar un gasto',
  odoo_employees: 'consultar los empleados de Odoo',
  reporter_invitation: 'invitar a un reportante',
  initial_sync: 'reintentar la sincronización',
  catalog_refresh: 'actualizar los catálogos',
  expense_comment: 'comentar un gasto',
  expense_comment_change: 'editar o eliminar un comentario',
};

const expenseUpdateSchema = z.object({
  type: z.enum([...EXPENSE_UPDATE_TYPES, ...GENERAL_UPDATE_TYPES]),
  expenseId: z.string().nullish(),
  status: z.enum(STATUSES).nullish(),
  expenseDescription: z.string().nullish(),
  total: z.number().nullish(),
  currency: z.string().length(3).nullish(),
  paymentMode: z.enum(['own_account', 'company_account']).nullish(),
  errorCode: z.string().nullish(),
  count: z.number().int().positive().nullish(),
  reporters: z.number().int().positive().nullish(),
  connectionName: z.string().nullish(),
  removedReceipts: z.array(z.string()).nullish(),
  actorName: z.string().nullish(),
  action: z.string().nullish(),
  hasNewComments: z.boolean().nullish(),
  url: z.url(),
});

const expenseUpdatesSchema = z.object({
  updates: z.array(expenseUpdateSchema).min(1),
});

type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;

const plural = (count: number, singular: string, many: string): string =>
  count === 1 ? singular : many;

const TITLES: Record<UpdateType, (update: ExpenseUpdate, description: string) => string> = {
  expense_sent: ({ status }, description) =>
    status === 'approved'
      ? `Tu gasto «${description}» llegó a Odoo y quedó aprobado`
      : `Tu gasto «${description}» se envió a aprobación`,
  expense_submitted: (_, description) => `Tu gasto «${description}» volvió a revisión`,
  expense_correction_requested: (_, description) =>
    `Te pidieron corregir tu gasto «${description}»`,
  expense_approved: (_, description) => `Tu gasto «${description}» fue aprobado`,
  expense_posted: (_, description) => `Tu gasto «${description}» se contabilizó`,
  expense_in_payment: (_, description) =>
    `El reembolso de tu gasto «${description}» está en proceso`,
  expense_paid: ({ paymentMode }, description) =>
    paymentMode === COMPANY_ACCOUNT
      ? `Tu gasto «${description}» quedó pagado por la empresa`
      : `Te reembolsaron tu gasto «${description}»`,
  expense_refused: (_, description) => `Tu gasto «${description}» fue rechazado`,
  expense_send_failed: (_, description) => `No pudimos enviar tu gasto «${description}»`,
  expense_send_delayed: ({ count }) =>
    count
      ? 'Gastos sin poder enviar por problemas técnicos'
      : 'Gasto sin poder enviar por problemas técnicos',
  expense_send_stuck: ({ count }) =>
    count && count > 1 ? 'Gastos con retraso en el envío' : 'Gasto con retraso en el envío',
  odoo_connection_invalid: () => 'La conexión con Odoo dejó de funcionar',
  expense_submissions_stuck: () => 'Envíos atorados sin llegar a Odoo',
  odoo_action_blocked: ({ action }) =>
    `No pudimos ${BLOCKED_ACTIONS_FOR_ACTOR[action ?? ''] ?? 'completar tu acción en Odoo'}`,
  odoo_connection_still_invalid: () => 'La conexión con Odoo sigue sin funcionar',
  expense_commented: (_, description) => `Tu gasto «${description}» tiene comentarios nuevos`,
};

const DETAILS: Record<UpdateType, (update: ExpenseUpdate, description: string) => string> = {
  expense_sent: ({ status }) => {
    if (status === 'approved') {
      return 'Odoo lo aprobó en cuanto llegó. El siguiente paso es que contabilidad lo registre; te avisaremos cuando avance.';
    }
    return status === 'submitted' || !status
      ? 'Tu gasto ya está en Odoo, esperando la revisión de tu aprobador. Te avisaremos cuando lo apruebe, lo rechace o te pida corregirlo.'
      : 'Tu gasto ya está en Odoo. Te avisaremos cada vez que cambie de estado.';
  },
  expense_submitted: () =>
    'Tu aprobador lo regresó a revisión en Odoo. Te avisaremos cuando tome una decisión.',
  expense_correction_requested: () =>
    'Tu aprobador lo regresó a borrador para que lo corrijas. Ábrelo en el portal, haz los cambios que te pidieron y vuelve a enviarlo.',
  expense_approved: () =>
    'Tu aprobador lo aprobó. El siguiente paso es que contabilidad lo registre; te avisaremos cuando avance.',
  expense_posted: ({ paymentMode }) =>
    paymentMode === COMPANY_ACCOUNT
      ? 'Contabilidad ya lo registró en Odoo.'
      : 'Contabilidad ya lo registró. El siguiente paso es el pago de tu reembolso; te avisaremos cuando esté en proceso.',
  expense_in_payment: () =>
    'Contabilidad ya registró el pago de tu reembolso. Te avisaremos cuando quede confirmado.',
  expense_paid: ({ paymentMode }) =>
    paymentMode === COMPANY_ACCOUNT
      ? 'La empresa lo pagó directamente, así que no hay reembolso que esperar. Este gasto ya terminó su proceso.'
      : 'El reembolso quedó pagado. Este gasto ya terminó su proceso.',
  expense_refused: () =>
    'Tu aprobador lo rechazó en Odoo. Un gasto rechazado ya no se puede corregir ni volver a enviar; si tienes dudas, consúltalo con tu aprobador.',
  expense_send_failed: ({ errorCode }) =>
    errorCode === RETRIES_EXHAUSTED_CODE
      ? 'Intentamos enviarlo a Odoo durante 3 días sin lograr comunicarnos. El gasto regresó a borrador: revísalo y vuelve a enviarlo. Si vuelve a pasar, avísale a tu administrador.'
      : 'Odoo no aceptó tu gasto y regresó a borrador para que lo corrijas. Abre el gasto para ver el motivo, corrígelo y vuelve a enviarlo.',
  expense_send_delayed: ({ count }, description) => {
    if (!count) {
      return `Tu gasto «${description}» quedó registrado en el portal, pero no se pudo enviar a Odoo porque la conexión de tu empresa con Odoo dejó de funcionar. No tienes que hacer nada: ya avisamos al administrador y se enviará solo en cuanto la arregle.`;
    }
    return count === 1
      ? 'Tienes 1 gasto que ya enviaste desde el portal, pero todavía no llega a Odoo porque la conexión de tu empresa con Odoo dejó de funcionar. No tienes que hacer nada: ya avisamos al administrador y, en cuanto la arregle, tu gasto se enviará solo. Mientras tanto lo verás como «Enviando a Odoo».'
      : `Tienes ${count} gastos que ya enviaste desde el portal, pero todavía no llegan a Odoo porque la conexión de tu empresa con Odoo dejó de funcionar. No tienes que hacer nada: ya avisamos al administrador y, en cuanto la arregle, tus gastos se enviarán solos. Mientras tanto los verás como «Enviando a Odoo».`;
  },
  expense_send_stuck: ({ count }) =>
    count && count > 1
      ? `${count} de tus gastos aún no llegan a Odoo por un problema técnico del portal. No tienes que hacer nada: ya avisamos al administrador para que los reintente.`
      : 'Uno de tus gastos aún no llega a Odoo por un problema técnico del portal. No tienes que hacer nada: ya avisamos al administrador para que lo reintente.',
  odoo_connection_invalid: ({ connectionName }) =>
    `Odoo ya no acepta la API Key de la conexión «${connectionName ?? ''}»: probablemente se revocó o venció. Mientras no la actualices, los gastos que envíen los reportantes se quedarán esperando, y ellos ya recibieron un aviso. Genera una API Key nueva en Odoo y actualízala en la conexión del portal; los gastos pendientes se enviarán solos.`,
  expense_submissions_stuck: ({ count, reporters }) =>
    `${count ?? 0} ${plural(count ?? 0, 'gasto', 'gastos')} de ${reporters ?? 0} ${plural(reporters ?? 0, 'reportante', 'reportantes')} no ${plural(count ?? 0, 'ha', 'han')} llegado a Odoo: no se ${plural(count ?? 0, 'pudo', 'pudieron')} poner en la cola de envío o ${plural(count ?? 0, 'lleva', 'llevan')} más de 2 horas sin avanzar. Revisa la lista de envíos del portal y reintenta los que aparezcan como atorados. Los reportantes ya recibieron un aviso.`,
  odoo_action_blocked: () =>
    'La conexión de tu empresa con Odoo dejó de funcionar, así que por ahora el portal no puede comunicarse con Odoo. Ya avisamos al administrador; vuelve a intentarlo cuando la actualice.',
  odoo_connection_still_invalid: ({ actorName, action, connectionName }) =>
    `${actorName || 'Alguien'} intentó ${BLOCKED_ACTIONS_FOR_ADMIN[action ?? ''] ?? 'usar el portal'}, pero la API Key de la conexión «${connectionName ?? ''}» sigue sin servir. Mientras no la actualices, el portal no puede comunicarse con Odoo: los gastos que se envíen se quedan esperando y nadie puede actualizar sus estados. Genera una API Key nueva en Odoo y actualízala en la conexión del portal; lo pendiente se enviará solo.`,
  expense_commented: () =>
    'Escribieron en tu gasto desde Odoo. Ábrelo en el portal para leerlos y responder.',
};

const ACTION_LABELS: Partial<Record<UpdateType, string>> = {
  odoo_connection_invalid: 'Actualizar la conexión',
  odoo_connection_still_invalid: 'Actualizar la conexión',
  expense_send_stuck: 'Ver mis gastos',
  expense_submissions_stuck: 'Ver los envíos',
  odoo_action_blocked: 'Ir al portal',
  expense_commented: 'Ver los comentarios',
};

const STATUS_LABELS: Record<Status, (update: ExpenseUpdate) => string> = {
  draft: ({ type }) => (type === 'expense_send_failed' ? 'Por corregir' : 'En corrección'),
  submitted: ({ type }) => (type === 'expense_send_delayed' ? 'Envío pendiente' : 'En revisión'),
  approved: () => 'Aprobado',
  posted: () => 'Contabilizado',
  in_payment: () => 'En proceso de pago',
  paid: ({ paymentMode }) =>
    paymentMode === COMPANY_ACCOUNT ? 'Pagado por la empresa' : 'Reembolsado',
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

function titleOf(update: ExpenseUpdate): string {
  return TITLES[update.type](update, update.expenseDescription || WITHOUT_DESCRIPTION);
}

function detailOf(update: ExpenseUpdate): string {
  const detail = DETAILS[update.type](update, update.expenseDescription || WITHOUT_DESCRIPTION);
  return `${detail}${removedReceiptsOf(update)}${newCommentsOf(update)}`;
}

function removedReceiptsOf({ type, removedReceipts }: ExpenseUpdate): string {
  if (!removedReceipts?.length) return '';
  const removed =
    removedReceipts.length === 1
      ? `El aprobador quitó el comprobante «${removedReceipts[0]}»`
      : `El aprobador quitó ${removedReceipts.length} comprobantes: ${removedReceipts.map((name) => `«${name}»`).join(', ')}`;
  return type === 'expense_correction_requested'
    ? ` ${removed}; sube el correcto antes de volver a enviarlo.`
    : ` ${removed}.`;
}

function newCommentsOf({ type, hasNewComments }: ExpenseUpdate): string {
  if (!hasNewComments || type === 'expense_commented') return '';
  return ' Además, tiene comentarios nuevos; ábrelo en el portal para leerlos.';
}

function amountOf({ total, currency }: ExpenseUpdate): string | null {
  if (total === null || total === undefined || !currency) return null;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(total);
}

function actionLabelOf(update: ExpenseUpdate): string {
  if (ACTION_LABELS[update.type]) return ACTION_LABELS[update.type]!;
  return update.type === 'expense_send_delayed' && update.count ? 'Ver mis gastos' : 'Ver el gasto';
}

function scopeOf(updates: ExpenseUpdate[]): UpdatesScope {
  if (!updates.every((update) => update.expenseId)) return 'portal';
  return new Set(updates.map((update) => update.expenseId)).size === 1 ? 'expense' : 'expenses';
}

function subjectOf(updates: ExpenseUpdate[]): string {
  if (updates.length === 1) return titleOf(updates[0]);
  const scope = scopeOf(updates);
  return scope === 'expense'
    ? `${HEADINGS.expense} «${updates[0].expenseDescription || WITHOUT_DESCRIPTION}»`
    : HEADINGS[scope];
}

export const expenseUpdatesEmail: EmailDefinition<z.infer<typeof expenseUpdatesSchema>> = {
  template: 'expense-updates',
  dataSchema: expenseUpdatesSchema,
  subject: ({ updates }) => subjectOf(updates),
  variables: (recipientName, { updates }) => ({
    recipientName,
    heading: HEADINGS[scopeOf(updates)],
    updates: updates.map((update) => ({
      title: titleOf(update),
      detail: detailOf(update),
      status: update.status ? STATUS_LABELS[update.status](update) : null,
      statusColor: update.status ? STATUS_COLORS[update.status] : null,
      amount: amountOf(update),
      url: update.url,
      actionLabel: actionLabelOf(update),
    })),
  }),
};
