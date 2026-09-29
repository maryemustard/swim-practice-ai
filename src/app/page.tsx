import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [groupCount, swimmerCount, practiceCount, upcomingMeets] = await Promise.all([
    prisma.group.count(),
    prisma.swimmer.count(),
    prisma.practice.count(),
    prisma.goalMeet.findMany({
      where: { date: { gte: new Date() } },
      include: { group: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center py-6">
        <h1 className="text-3xl font-semibold text-teal-900">🌊 Swim Practice AI</h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">
          Practices generated in your coaches&apos; own voice, personalized to every swimmer&apos;s pace —
          built from the practices and times you already have.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/groups"
          className="rounded-xl border border-teal-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all"
        >
          <h2 className="font-medium text-lg text-teal-900">Groups</h2>
          <p className="text-sm text-slate-600 mt-1">
            Rosters, times, style examples, and goal meets — {groupCount} group{groupCount === 1 ? "" : "s"},{" "}
            {swimmerCount} swimmer{swimmerCount === 1 ? "" : "s"} on file.
          </p>
        </Link>
        <Link
          href="/practices"
          className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
        >
          <h2 className="font-medium text-lg text-orange-900">Practice Log</h2>
          <p className="text-sm text-slate-600 mt-1">
            Every generated practice across all groups — {practiceCount} so far.
          </p>
        </Link>
      </div>

      {upcomingMeets.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium mb-3">Upcoming goal meets</h2>
          <div className="flex flex-col gap-2">
            {upcomingMeets.map((m) => (
              <Link
                key={m.id}
                href={`/groups/${m.groupId}`}
                className="flex items-baseline justify-between text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0 hover:text-teal-700"
              >
                <span>
                  {m.name} — <span className="text-slate-500">{m.group.name}</span>
                </span>
                <span className="text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
