/** Dates for the demos, worked out from today so the page never shows a stale Friday. */
export const LOCALE = 'en-US';
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

/** The next `weekday` (0 is Sunday) at least `ahead` days from `from`, at local midnight. */
export function nextWeekday(weekday: number, ahead: number, from = new Date()): Date {
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + ahead);
  while (day.getDay() !== weekday) day.setDate(day.getDate() + 1);
  return day;
}

export function at(day: Date, hours: number, minutes = 0): Date {
  const out = new Date(day);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

export function addDays(day: Date, days: number): Date {
  const out = new Date(day);
  out.setDate(out.getDate() + days);
  return out;
}

const time = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });
const dayTime = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const longDay = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' });
const shortDay = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' });
const shortWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
const clock = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** The same shapes the app uses: "7:00 PM", "6:30 – 7:30 PM", "Fri, Nov 6, 7:00 PM". */
export const fmt = {
  time: (d: Date) => time.format(d),
  range: (a: Date, b: Date) => time.formatRange(a, b),
  dayTime: (d: Date) => dayTime.format(d),
  span: (a: Date, b: Date) => dayTime.formatRange(a, b),
  long: (d: Date) => longDay.format(d),
  short: (d: Date) => shortDay.format(d),
  shortWeekday: (d: Date) => shortWeekday.format(d),
  weekday: (d: Date) => weekday.format(d),
  clock: (d: Date) => clock.format(d),
};

/** "In 9 days", "Tomorrow", "In 2 weeks": urgency in words, from the date alone. */
export function soonWords(target: Date, now = new Date()): string {
  const days = Math.round((new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 14) return `In ${days} days`;
  return `In ${Math.round(days / 7)} weeks`;
}

/** The demo week: a dinner on Thursday, a class on Friday, a flight the Saturday after next. */
export const WORLD = (() => {
  const today = new Date();
  const thursday = nextWeekday(4, 2, today);
  const friday = addDays(thursday, 1);
  const flight = addDays(friday, 8);
  const receipt = addDays(today, -2);
  return { today, thursday, friday, flight, receipt };
})();
