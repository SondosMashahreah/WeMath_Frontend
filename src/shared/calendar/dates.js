export const MIN_MONTH = '1900-01', MAX_MONTH = '2199-12';
export const monthValid = value => /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value || '');
export function todayInJerusalem(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key).value).join('-');
}
export function dateObject(value) { return new Date(`${value}T12:00:00Z`); }
export function dateLabel(value, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) { return new Intl.DateTimeFormat('ar-PS', { ...options, timeZone: 'UTC' }).format(dateObject(value)); }
export function dayValid(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(dateObject(value).valueOf()) && dateObject(value).toISOString().slice(0, 10) === value; }
export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number), date = new Date(Date.UTC(year, number - 1 + delta, 1));
  const result = date.toISOString().slice(0, 7);
  return result < MIN_MONTH ? MIN_MONTH : result > MAX_MONTH ? MAX_MONTH : result;
}
export function monthDays(month) {
  const first = dateObject(`${month}-01`), start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setUTCDate(start.getUTCDate() + i); return d.toISOString().slice(0, 10); });
}
export function calendarFilters(params, today = todayInJerusalem()) {
  const month = monthValid(params.get('month')) ? params.get('month') : today.slice(0, 7);
  const day = dayValid(params.get('day')) && params.get('day').startsWith(month) ? params.get('day') : '';
  let mode = ['month', 'day', 'past', 'upcoming', 'undated'].includes(params.get('view')) ? params.get('view') : 'month';
  if (mode === 'day' && !day) mode = 'month';
  const page = /^\d+$/.test(params.get('page') || '') ? Math.min(100000, Math.max(1, Number(params.get('page')))) : 1;
  return { month, day, mode, page, q: (params.get('q') || '').slice(0, 100), status: ['draft', 'review', 'published', 'archived'].includes(params.get('status')) ? params.get('status') : '' };
}
