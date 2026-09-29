export type MonthDay = { date: Date; inMonth: boolean; key: string };

/**
 * "YYYY-MM-DD" (from a <input type="date">) -> local midnight, not UTC midnight.
 * `new Date("2027-03-14")` parses as UTC, which lands on the 13th in any
 * timezone behind UTC — always parse date-only form input through this.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** YYYY-MM-DD in local time, not UTC — avoids off-by-one issues near midnight. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseMonthParam(month?: string): { year: number; monthIndex: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export function monthParam(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Full weeks covering the month, padded with adjacent-month days so the grid is always complete. */
export function buildMonthGrid(year: number, monthIndex: number): MonthDay[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  const days: MonthDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === monthIndex, key: dateKey(d) });
  }
  return days;
}
