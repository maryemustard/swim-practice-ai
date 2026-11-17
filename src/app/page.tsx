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
      <div
        className="rounded-2xl px-8 pt-8 pb-6 shadow-lg shadow-pool-900/15"
        style={{
          background:
            "radial-gradient(900px 300px at 15% -20%, color-mix(in srgb, var(--color-pool-600) 35%, transparent), transparent), var(--color-deep)",
        }}
      >
        <p className="font-mono text-xs tracking-[0.12em] text-pool-100 uppercase mb-2">One standard, every group</p>
        <h1 className="text-[36px] font-semibold text-white tracking-tight text-balance">Wavelength</h1>
        <p className="text-pool-100 mt-3 max-w-xl text-[15.5px] leading-relaxed">
          Practices generated in your coaches&apos; own voice, personalized to every swimmer&apos;s pace, built
          on a drill standard every group teaches the same way.
        </p>

        <div className="flex items-center gap-6 mt-7 pt-5 border-t border-white/10 font-mono text-sm tabular-nums">
          <div>
            <span className="text-white text-base font-medium">{groupCount}</span>{" "}
            <span className="text-pool-100/80">group{groupCount === 1 ? "" : "s"}</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <div>
            <span className="text-white text-base font-medium">{swimmerCount}</span>{" "}
            <span className="text-pool-100/80">swimmer{swimmerCount === 1 ? "" : "s"}</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <div>
            <span className="text-white text-base font-medium">{practiceCount}</span>{" "}
            <span className="text-pool-100/80">practice{practiceCount === 1 ? "" : "s"} generated</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/groups"
          className="group rounded-xl border-t-4 border-t-pool-600 border-x border-b border-line bg-surface p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h2 className="font-medium text-ink group-hover:text-pool-700 transition-colors">Groups</h2>
          <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
            Rosters, times, style examples, and goal meets — {groupCount} group{groupCount === 1 ? "" : "s"},{" "}
            {swimmerCount} swimmer{swimmerCount === 1 ? "" : "s"} on file.
          </p>
        </Link>
        <Link
          href="/practices"
          className="group rounded-xl border-t-4 border-t-amber-600 border-x border-b border-line bg-surface p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h2 className="font-medium text-ink group-hover:text-amber-700 transition-colors">Practice log</h2>
          <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
            Every generated practice across all groups — {practiceCount} so far.
          </p>
        </Link>
        <Link
          href="/drills"
          className="group rounded-xl bg-deep p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <p className="font-mono text-[10px] tracking-[0.12em] text-amber-600 uppercase mb-1.5">Core feature</p>
          <h2 className="font-medium text-white">Standard</h2>
          <p className="text-sm text-pool-100 mt-1.5 leading-relaxed">
            The shared drill and technique progression every group&apos;s practices draw from.
          </p>
        </Link>
      </div>

      {upcomingMeets.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-5 shadow-sm">
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
                <span className="font-mono text-ink-mute text-xs tabular-nums">{formatDate(m.date)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
