import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatDate";

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
      <div className="bg-deep rounded-2xl px-8 py-7">
        <p className="font-mono text-xs tracking-wide text-pool-100 uppercase mb-1">One standard, every group</p>
        <h1 className="text-[28px] font-semibold text-white">Wavelength</h1>
        <p className="text-pool-100 mt-2 max-w-xl text-[15px] leading-relaxed">
          Practices generated in your coaches&apos; own voice, personalized to every swimmer&apos;s pace, built
          on a drill standard every group teaches the same way.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/groups"
          className="rounded-xl border border-line bg-surface p-5 hover:border-pool-600 transition-colors"
        >
          <h2 className="font-medium text-ink">Groups</h2>
          <p className="text-sm text-ink-soft mt-1">
            Rosters, times, style examples, and goal meets — {groupCount} group{groupCount === 1 ? "" : "s"},{" "}
            {swimmerCount} swimmer{swimmerCount === 1 ? "" : "s"} on file.
          </p>
        </Link>
        <Link
          href="/practices"
          className="rounded-xl border border-line bg-surface p-5 hover:border-pool-600 transition-colors"
        >
          <h2 className="font-medium text-ink">Practice log</h2>
          <p className="text-sm text-ink-soft mt-1">
            Every generated practice across all groups — {practiceCount} so far.
          </p>
        </Link>
        <Link
          href="/drills"
          className="rounded-xl border border-line bg-surface p-5 hover:border-amber-600 transition-colors"
        >
          <h2 className="font-medium text-ink">Standard</h2>
          <p className="text-sm text-ink-soft mt-1">
            The shared drill and technique progression every group&apos;s practices draw from.
          </p>
        </Link>
      </div>

      {upcomingMeets.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-medium text-ink mb-3">Upcoming goal meets</h2>
          <div className="flex flex-col gap-2">
            {upcomingMeets.map((m) => (
              <Link
                key={m.id}
                href={`/groups/${m.groupId}`}
                className="flex items-baseline justify-between text-sm border-b border-line last:border-0 pb-2 last:pb-0 hover:text-pool-700"
              >
                <span>
                  {m.name} — <span className="text-ink-mute">{m.group.name}</span>
                </span>
                <span className="font-mono text-ink-mute text-xs">{formatDate(m.date)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
