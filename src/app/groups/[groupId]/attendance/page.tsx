import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatDate";
import { yardsForSwimmer, type ResolvedPaceSet } from "@/lib/generatePractice";

export default async function AttendancePage({ params }: PageProps<"/groups/[groupId]/attendance">) {
  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { swimmers: { orderBy: { name: "asc" } } },
  });
  if (!group) notFound();

  const practices = await prisma.practice.findMany({
    where: { groupId, attendance: { some: {} } },
    orderBy: { date: "asc" },
    include: { attendance: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-900">{group.name} — Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">
            {practices.length} practice{practices.length === 1 ? "" : "s"} recorded
          </p>
        </div>
        <Link href={`/groups/${group.id}`} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to group
        </Link>
      </div>

      {practices.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No attendance taken yet — open a practice and mark who was there.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 px-3 sticky left-0 bg-white">Swimmer</th>
                {practices.map((p) => (
                  <th key={p.id} className="py-2 px-3 text-center whitespace-nowrap font-normal">
                    <Link href={`/practices/${p.id}`} className="hover:text-teal-700">
                      {formatDate(p.date)}
                      {p.timeOfDay && <div className="text-[10px] text-slate-400 font-normal">{p.timeOfDay}</div>}
                    </Link>
                  </th>
                ))}
                <th className="py-2 px-3 text-center">%</th>
                <th className="py-2 px-3 text-center">Yards</th>
              </tr>
            </thead>
            <tbody>
              {group.swimmers.map((s) => {
                let presentCount = 0;
                let recordedCount = 0;
                let yards = 0;
                const cells = practices.map((p) => {
                  const a = p.attendance.find((x) => x.swimmerId === s.id);
                  if (a) {
                    recordedCount += 1;
                    if (a.present) {
                      presentCount += 1;
                      const paceSets: ResolvedPaceSet[] = p.intervals ? JSON.parse(p.intervals) : [];
                      yards += yardsForSwimmer(paceSets, s.id);
                    }
                  }
                  return a;
                });
                const pct = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : null;
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 font-medium sticky left-0 bg-white">{s.name}</td>
                    {cells.map((a, i) => (
                      <td key={i} className="py-2 px-3 text-center">
                        {!a ? (
                          <span className="text-slate-300">—</span>
                        ) : a.present ? (
                          <span className="text-teal-600 font-medium">✓</span>
                        ) : (
                          <span className="text-red-500 font-medium">✕</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center text-slate-600">{pct === null ? "—" : `${pct}%`}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{yards.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
