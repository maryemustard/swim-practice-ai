import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRaceTime } from "@/lib/time";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { addPreferenceAction, clearPreferencesAction, generatePracticeAction, removePreferenceAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function GroupPage({ params, searchParams }: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  const { saved } = await searchParams;

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
            {formatDate(goalMeet.date)} · {goalMeet.taperWeeks}-week taper
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium">Style examples</h2>
          <Link
            href={`/groups/${group.id}/upload`}
            className="text-xs text-teal-700 hover:text-teal-900 whitespace-nowrap"
          >
            + Upload a practice
          </Link>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Past practices this coach actually wrote — these teach the AI their voice. They&apos;re
          reference material, not scheduled on any specific day.
        </p>
        <div className="flex flex-col gap-3">
          {group.styleExamples.map((ex) => (
            <details key={ex.id} className="border border-slate-100 rounded p-3">
              <summary className="text-sm font-medium cursor-pointer">{ex.title}</summary>
              <pre className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{ex.content}</pre>
            </details>
          ))}
          {group.styleExamples.length === 0 && (
            <p className="text-slate-500 text-sm">
              No style examples yet — click &quot;Upload a practice&quot; above and paste in a couple of
              past practices so generated ones match this group&apos;s usual structure.
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

      <section id="train" className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
        <h2 className="font-semibold mb-1 text-indigo-900 text-base">🎓 Train the generator</h2>
        <p className="text-xs text-slate-600 mb-3">
          Tell it one thing to fix or remember, hit train, and it&apos;s absorbed — applied to every practice
          generated for {group.name} from now on. No need to keep it visible; it&apos;s just working in the
          background after this.
        </p>
        {saved === "preferences" ? (
          <p className="text-sm text-green-800 bg-green-100 border border-green-300 rounded-lg px-3 py-2 mb-3">
            ✓ Got it.
          </p>
        ) : null}
        <form action={addPreferenceAction} className="flex gap-2">
          <input type="hidden" name="groupId" value={group.id} />
          <input
            name="instruction"
            placeholder={`e.g. "never use backstroke drills in a breaststroke set"`}
            className="flex-1 border border-indigo-200 bg-white rounded px-3 py-2 text-sm"
          />
          <SubmitButton
            pendingText="Training…"
            className="bg-indigo-700 text-white text-sm font-medium rounded-full px-4 py-1.5 hover:bg-indigo-800 transition-colors whitespace-nowrap"
          >
            Train it
          </SubmitButton>
        </form>
        {group.preferences && (
          <details className="mt-3">
            <summary className="text-xs text-indigo-700 hover:text-indigo-900 cursor-pointer w-fit">
              What has it learned so far?
            </summary>
            <ul className="flex flex-col gap-1 mt-2">
              {group.preferences
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-2 text-xs text-slate-600 bg-white/70 border border-indigo-100 rounded px-2 py-1.5"
                  >
                    <span className="flex-1">{line.replace(/^- /, "")}</span>
                    <form action={removePreferenceAction}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="index" value={i} />
                      <button
                        type="submit"
                        title="Remove this instruction"
                        className="text-red-500 hover:text-red-700 leading-none shrink-0"
                      >
                        ✕
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
            <form action={clearPreferencesAction} className="mt-2">
              <input type="hidden" name="groupId" value={group.id} />
              <button type="submit" className="text-xs text-red-600 hover:text-red-800 underline">
                Clear all instructions
              </button>
            </form>
          </details>
        )}
      </section>

      <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
        <h2 className="font-medium mb-1 text-teal-900">🏊 Generate a practice for today</h2>
        <p className="text-xs text-slate-500 mb-3">
          This generates for today&apos;s date. Planning ahead?{" "}
          <Link href={`/groups/${group.id}/calendar`} className="text-teal-700 hover:text-teal-900 underline">
            Use the Calendar
          </Link>{" "}
          to generate or paste in a practice for a specific future day. Generating calls Claude and takes
          10-20 seconds — the button will say &quot;Generating…&quot; and disable itself until it&apos;s done,
          so it&apos;s safe to wait instead of clicking again.
        </p>
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
          <SubmitButton
            pendingText="Generating…"
            className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors"
          >
            Generate practice
          </SubmitButton>
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
              {formatDateTime(p.createdAt)} — {p.focus} ({p.source})
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

export const dynamic = "force-dynamic";
