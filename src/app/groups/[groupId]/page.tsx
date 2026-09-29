import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRaceTime } from "@/lib/time";
import { generatePracticeAction } from "./actions";

export default async function GroupPage({ params }: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      swimmers: { include: { times: true }, orderBy: { name: "asc" } },
      styleExamples: { orderBy: { createdAt: "desc" } },
      goalMeets: { orderBy: { date: "asc" } },
      drills: { orderBy: { name: "asc" } },
      practices: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!group) notFound();

  const goalMeet = group.goalMeets[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-900">{group.name}</h1>
          {group.ageRange && <p className="text-slate-500 text-sm">Ages {group.ageRange}</p>}
          {group.targetStandard && <p className="text-slate-700 mt-1">{group.targetStandard}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${group.id}/edit`}
            className="text-sm border border-slate-300 text-slate-700 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            Edit group
          </Link>
          <Link
            href={`/groups/${group.id}/calendar`}
            className="text-sm border border-cyan-300 text-cyan-700 rounded-full px-3 py-1.5 hover:bg-cyan-50 transition-colors"
          >
            📅 Calendar
          </Link>
          <Link
            href={`/groups/${group.id}/ask`}
            className="text-sm border border-orange-300 text-orange-700 rounded-full px-3 py-1.5 hover:bg-orange-50 transition-colors"
          >
            💬 Ask about this group
          </Link>
          <Link
            href={`/groups/${group.id}/upload`}
            className="text-sm border border-teal-300 text-teal-700 rounded-full px-3 py-1.5 hover:bg-teal-50 transition-colors"
          >
            Upload data
          </Link>
        </div>
      </div>

      {goalMeet && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-medium">Goal meet: {goalMeet.name}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {new Date(goalMeet.date).toLocaleDateString()} · {goalMeet.taperWeeks}-week taper
          </p>
          {goalMeet.attendanceNotes && (
            <p className="text-sm text-slate-600 mt-2">{goalMeet.attendanceNotes}</p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Roster & times</h2>
          <span className="text-xs text-slate-500">{group.swimmers.length} swimmers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-1.5 pr-4">Swimmer</th>
                <th className="py-1.5 pr-4">Gender</th>
                <th className="py-1.5 pr-4">Current</th>
                <th className="py-1.5 pr-4">Goal</th>
              </tr>
            </thead>
            <tbody>
              {group.swimmers.map((s) => {
                const current = s.times.filter((t) => t.kind === "current");
                const goal = s.times.filter((t) => t.kind === "goal");
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-4 font-medium">{s.name}</td>
                    <td className="py-1.5 pr-4 text-slate-600">{s.gender ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-slate-600">
                      {current.map((t) => `${t.event}: ${formatRaceTime(t.seconds)}`).join(", ") || "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-slate-600">
                      {goal.map((t) => `${t.event}: ${formatRaceTime(t.seconds)}`).join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
              {group.swimmers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-500">
                    No swimmers yet — add times on the Upload page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Style examples</h2>
        <div className="flex flex-col gap-3">
          {group.styleExamples.map((ex) => (
            <details key={ex.id} className="border border-slate-100 rounded p-3">
              <summary className="text-sm font-medium cursor-pointer">{ex.title}</summary>
              <pre className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{ex.content}</pre>
            </details>
          ))}
          {group.styleExamples.length === 0 && (
            <p className="text-slate-500 text-sm">
              No style examples yet — add a couple of past practices on the Upload page so generated
              practices match this group&apos;s usual structure.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Drill glossary</h2>
        <div className="flex flex-col gap-2 text-sm">
          {group.drills.map((d) => (
            <p key={d.id}>
              <span className="font-medium">{d.name}:</span> <span className="text-slate-600">{d.definition}</span>
            </p>
          ))}
          {group.drills.length === 0 && <p className="text-slate-500">No drills defined yet.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
        <h2 className="font-medium mb-3 text-teal-900">🏊 Generate a practice</h2>
        <form action={generatePracticeAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Today&apos;s focus</label>
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

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Recent practices for this group</h2>
          <Link href="/practices" className="text-sm text-slate-600 hover:text-slate-900">
            View full log →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {group.practices.map((p) => (
            <Link
              key={p.id}
              href={`/practices/${p.id}`}
              className="text-sm border border-slate-200 bg-white rounded px-3 py-2 hover:border-slate-400"
            >
              {new Date(p.createdAt).toLocaleString()} — {p.focus} ({p.source})
            </Link>
          ))}
          {group.practices.length === 0 && (
            <p className="text-slate-500 text-sm">No practices generated yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
