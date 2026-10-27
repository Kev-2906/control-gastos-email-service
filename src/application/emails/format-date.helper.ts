export function formatDate(isoDate: string): string {
  const date = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoDate));
  return `${date} (hora del centro de México)`;
}
