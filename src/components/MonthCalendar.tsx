import Link from "next/link";
import { buildMonthGrid, monthLabel } from "@/lib/calendarMonth";

export type CalendarEvent = { label: string; colorClass: string };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({
  year,
  monthIndex,
  events,
  dayHref,
  prevHref,
  nextHref,
}: {
  year: number;
  monthIndex: number;
  events: Record<string, CalendarEvent[]>;
  dayHref: (dateKey: string) => string;
  prevHref: string;
  nextHref: string;
}) {
  const days = buildMonthGrid(year, monthIndex);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-teal-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Link href={prevHref} className="text-sm text-slate-500 hover:text-teal-700 px-2">
          ← Prev
        </Link>
        <h2 className="font-medium text-teal-900">{monthLabel(year, monthIndex)}</h2>
        <Link href={nextHref} className="text-sm text-slate-500 hover:text-teal-700 px-2">
          Next →
        </Link>
      </div>
      <div className="grid grid-cols-7 text-xs text-slate-500 border-b border-slate-100">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-2 py-1.5 text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events[day.key] ?? [];
          const isToday = day.key === todayKey;
          return (
            <Link
              key={day.key}
              href={dayHref(day.key)}
              className={`min-h-24 border-b border-r border-slate-100 p-1.5 flex flex-col gap-1 hover:bg-teal-50/60 transition-colors ${
                day.inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
              }`}
            >
              <span
                className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-teal-600 text-white" : ""
                }`}
              >
                {day.date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e, i) => (
                  <span
                    key={i}
                    className={`text-[10px] leading-tight rounded px-1 py-0.5 truncate ${e.colorClass}`}
                  >
                    {e.label}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
