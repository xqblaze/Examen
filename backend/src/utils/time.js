export const DUTY_INTERVALS = {
  I0800_1200: { label: '08:00–12:00', start: '08:00', end: '12:00' },
  I1200_1600: { label: '12:00–16:00', start: '12:00', end: '16:00' },
  I1600_2000: { label: '16:00–20:00', start: '16:00', end: '20:00' }
};

export function normalizeDateOnly(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function intervalToDateTimesUtc(dateOnlyUtc, intervalKey) {
  const i = DUTY_INTERVALS[intervalKey];
  if (!i) return null;
  const [sh, sm] = i.start.split(':').map(Number);
  const [eh, em] = i.end.split(':').map(Number);
  const start = new Date(Date.UTC(dateOnlyUtc.getUTCFullYear(), dateOnlyUtc.getUTCMonth(), dateOnlyUtc.getUTCDate(), sh, sm, 0, 0));
  const end = new Date(Date.UTC(dateOnlyUtc.getUTCFullYear(), dateOnlyUtc.getUTCMonth(), dateOnlyUtc.getUTCDate(), eh, em, 0, 0));
  return { start, end, label: i.label };
}

