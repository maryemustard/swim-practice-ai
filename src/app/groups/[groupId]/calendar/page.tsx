import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MonthCalendar, type CalendarEvent } from "@/components/MonthCalendar";
import { dateKey, monthParam, parseMonthParam } from "@/lib/calendarMonth";

const SOURCE_COLORS: Record<string, string> = {
  claude: "bg-teal-100 text-teal-700",
  template: "bg-slate-100 text-slate-600",
  manual: "bg-orange-100 text-orange-700",
};

export default async function GroupCalendarPage({
  params,
  searchParams,
}: PageProps<"/groups/[groupId]/calendar">) {
  const { groupId } = await params;
  const { month } = await searchParams;
  const monthStr = typeof month === "string" ? month : undefined;
  const { year, monthIndex } = parseMonthParam(monthStr);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  const practices = await prisma.practice.findMany({
    where: { groupId },
    orderBy: { date: "asc" },
  });

  const eventsByDay: Record<string, CalendarEvent[]> = {};
  for (const p of practices) {
    const key = dateKey(new Date(p.date));
    (eventsByDay[key] ??= []).push({
      label: p.focus ?? p.source,
      colorClass: SOURCE_COLORS[p.source] ?? SOURCE_COLORS.template,
    });
  }

  const prevMonth = monthIndex === 0 ? { y: year - 1, m: 11 } : { y: year, m: monthIndex - 1 };
  const nextMonth = monthIndex === 11 ? { y: year + 1, m: 0 } : { y: year, m: monthIndex + 1 };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-900">{group.name} — Calendar</h1>
          <p className="text-slate-600 mt-1">
            Click any day to see what&apos;s scheduled, paste in your own practice, or have AI fill it in.
          </p>
        </div>
        <Link href={`/groups/${groupId}`} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to group
        </Link>
      </div>

      <div className="flex gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> AI generated
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Entered manually
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Template
        </span>
      </div>

      <MonthCalendar
        year={year}
        monthIndex={monthIndex}
        events={eventsByDay}
        dayHref={(key) => `/groups/${groupId}/calendar/${key}`}
        prevHref={`/groups/${groupId}/calendar?month=${monthParam(prevMonth.y, prevMonth.m)}`}
        nextHref={`/groups/${groupId}/calendar?month=${monthParam(nextMonth.y, nextMonth.m)}`}
      />
    </div>
  );
}
