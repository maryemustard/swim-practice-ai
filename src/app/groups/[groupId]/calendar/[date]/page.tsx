import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addManualPracticeAction, generatePracticeAction } from "../../actions";

export default async function CalendarDayPage({
  params,
}: PageProps<"/groups/[groupId]/calendar/[date]">) {
  const { groupId, date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const existing = await prisma.practice.findMany({
    where: { groupId, date: { gte: dayStart, lte: dayEnd } },
    orderBy: { createdAt: "asc" },
  });

  const prettyDate = dayStart.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-900">{prettyDate}</h1>
          <p className="text-slate-600 mt-1">{group.name}</p>
        </div>
        <Link href={`/groups/${groupId}/calendar`} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to calendar
        </Link>
      </div>

      {existing.length > 0 && (
        <section className="flex flex-col gap-2">
          {existing.map((p) => (
            <Link
              key={p.id}
              href={`/practices/${p.id}`}
              className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 hover:border-teal-300 transition-colors"
            >
              {p.focus ?? "(no focus set)"} — <span className="text-slate-500">{p.source}</span>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
        <h2 className="font-medium mb-3 text-teal-900">🏊 Generate with AI</h2>
        <form action={generatePracticeAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={date} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Focus</label>
            <input
              name="focus"
              placeholder="e.g. sprint, threshold, aerobic base, IM"
              className="border border-slate-300 rounded px-3 py-1.5 text-sm w-72"
              defaultValue="aerobic base"
            />
          </div>
          <button type="submit" className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors">
            Generate practice
          </button>
        </form>
        {!process.env.ANTHROPIC_API_KEY && (
          <p className="text-xs text-slate-500 mt-2">
            No ANTHROPIC_API_KEY set — generating from the built-in template instead of Claude.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-orange-200 bg-white p-5">
        <h2 className="font-medium mb-1 text-orange-900">✍️ Enter a practice manually</h2>
        <p className="text-sm text-slate-600 mb-3">
          Already wrote this one out yourself? Paste it in as-is — no AI, no computed intervals, just saved
          to the calendar for this day.
        </p>
        <form action={addManualPracticeAction} className="flex flex-col gap-3">
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={date} />
          <input
            name="focus"
            placeholder="Focus (optional) — e.g. threshold"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <textarea
            name="content"
            required
            rows={8}
            placeholder="Warmup: ...&#10;Main set: ...&#10;Cooldown: ..."
            className="border border-slate-300 rounded px-3 py-1.5 text-sm font-mono"
          />
          <button
            type="submit"
            className="self-start bg-orange-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-orange-700 transition-colors"
          >
            Save to this day
          </button>
        </form>
      </section>
    </div>
  );
}
