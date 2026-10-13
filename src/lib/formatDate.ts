// The server runs in UTC; coaches are in Eastern time. Every date/time shown
// in the app should be in Eastern regardless of where Next.js renders it.
const TIME_ZONE = "America/New_York";

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleDateString(undefined, { timeZone: TIME_ZONE, ...opts });
}

export function formatDateTime(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleString(undefined, { timeZone: TIME_ZONE, ...opts });
}
