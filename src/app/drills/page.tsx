import { prisma } from "@/lib/prisma";
import { addTeamDrillAction, deleteDrillAction } from "./actions";

export default async function DrillsPage() {
  const drills = await prisma.drillEntry.findMany({
    where: { groupId: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-teal-900">Team drill glossary</h1>
        <p className="text-slate-600 mt-1">
          One shared standard every group&apos;s practices draw from — so &quot;streamline&quot; or
          &quot;catch-up drill&quot; means the same thing whether it&apos;s Dawgs 1 or Senior 1. A group can
          still add its own drills on top of this list from that group&apos;s own page.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Add a team-wide drill</h2>
        <form action={addTeamDrillAction} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Drill name</label>
            <input
              name="name"
              required
              placeholder="Streamline off the wall"
              className="border border-slate-300 rounded px-3 py-1.5 text-sm w-56"
            />
          </div>
          <div className="flex flex-col gap-1 grow">
            <label className="text-xs text-slate-500">What it is / what it&apos;s for</label>
            <input name="definition" required className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <button
            type="submit"
            className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors"
          >
            Add
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">The standard ({drills.length})</h2>
        <div className="flex flex-col gap-2 text-sm">
          {drills.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
              <p>
                <span className="font-medium">{d.name}:</span> <span className="text-slate-600">{d.definition}</span>
              </p>
              <form action={deleteDrillAction}>
                <input type="hidden" name="drillId" value={d.id} />
                <button type="submit" className="text-xs text-red-500 hover:text-red-700 shrink-0">
                  Remove
                </button>
              </form>
            </div>
          ))}
          {drills.length === 0 && (
            <p className="text-slate-500">
              No team-wide drills yet — this is the gap Jonathan and the other coaches described. Add the
              first one above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
