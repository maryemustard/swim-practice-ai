import { prisma } from "@/lib/prisma";
import { MonthCalendar, type CalendarEvent } from "@/components/MonthCalendar";
import { dateKey, monthParam, parseMonthParam } from "@/lib/calendarMonth";
import { addTeamEventAction, deleteTeamEventAction } from "./actions";

const TYPE_COLORS: Record<string, string> = {
  meet: "bg-teal-100 text-teal-700",
  time_trial: "bg-orange-100 text-orange-700",
  other: "bg-slate-100 text-slate-600",
};

export default async function TeamCalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const monthStr = typeof params.month === "string" ? params.month : undefined;
  const defaultDate = typeof params.date === "string" ? params.date : "";
  const { year, monthIndex } = parseMonthParam(monthStr);

  const events = await prisma.teamEvent.findMany({ orderBy: { date: "asc" } });

  const eventsByDay: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const key = dateKey(new Date(e.date));
    (eventsByDay[key] ??= []).push({
      label: e.name,
      colorClass: TYPE_COLORS[e.type] ?? TYPE_COLORS.other,
    });
  }

  const prevMonth = monthIndex === 0 ? { y: year - 1, m: 11 } : { y: year, m: monthIndex - 1 };
  const nextMonth = monthIndex === 11 ? { y: year + 1, m: 0 } : { y: year, m: monthIndex + 1 };

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-teal-900">Team Calendar</h1>
        <p className="text-slate-600 mt-1">
          Big meets, time trials, and anything else that applies across the whole team. Each group has its
          own practice calendar too.
        </p>
      </div>

      <MonthCalendar
        year={year}
        monthIndex={monthIndex}
        events={eventsByDay}
        dayHref={(key) => `/calendar?month=${monthParam(year, monthIndex)}&date=${key}`}
        prevHref={`/calendar?month=${monthParam(prevMonth.y, prevMonth.m)}`}
        nextHref={`/calendar?month=${monthParam(nextMonth.y, nextMonth.m)}`}
      />

      <section className="rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 p-5">
        <h2 className="font-medium mb-3">Add an event</h2>
        <form action={addTeamEventAction} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Name</label>
            <input name="name" required placeholder="Northeast Divisionals" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-56" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Date</label>
            <input name="date" type="date" required defaultValue={defaultDate} className="border border-slate-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Type</label>
            <select name="type" defaultValue="meet" className="border border-slate-300 rounded px-3 py-1.5 text-sm">
              <option value="meet">Meet</option>
              <option value="time_trial">Time trial</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 grow">
            <label className="text-xs text-slate-500">Notes</label>
            <input name="notes" placeholder="Optional" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <button type="submit" className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors">
            Add
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Upcoming</h2>
        <div className="flex flex-col gap-2">
          {upcoming.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between text-sm border border-slate-200 bg-white rounded-lg px-3 py-2"
            >
              <div>
                <span className={`text-xs rounded px-1.5 py-0.5 mr-2 ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other}`}>
                  {e.type.replace("_", " ")}
                </span>
                <span className="font-medium">{e.name}</span>
                <span className="text-slate-500 ml-2">{new Date(e.date).toLocaleDateString()}</span>
                {e.notes && <span className="text-slate-500 ml-2">— {e.notes}</span>}
              </div>
              <form action={deleteTeamEventAction}>
                <input type="hidden" name="eventId" value={e.id} />
                <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-slate-500 text-sm">No upcoming events.</p>}
        </div>
      </section>
    </div>
  );
}
