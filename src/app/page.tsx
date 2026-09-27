import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createGroupAction } from "./actions";

export default async function HomePage() {
  const groups = await prisma.group.findMany({
    include: { swimmers: true, practices: true, goalMeets: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Groups</h1>
        <p className="text-slate-600 mt-1">
          Each group has its own style examples, roster, and target standard — practices are generated to match.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${g.id}`}
            className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium text-lg">{g.name}</h2>
              {g.ageRange && <span className="text-xs text-slate-500">ages {g.ageRange}</span>}
            </div>
            {g.targetStandard && (
              <p className="text-sm text-slate-600 mt-2">{g.targetStandard}</p>
            )}
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span>{g.swimmers.length} swimmers</span>
              <span>{g.practices.length} practices generated</span>
              {g.goalMeets[0] && <span>Goal meet: {g.goalMeets[0].name}</span>}
            </div>
          </Link>
        ))}
        {groups.length === 0 && (
          <p className="text-slate-500 text-sm">No groups yet — add one below to get started.</p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 p-5">
        <h2 className="font-medium mb-3">Add a group</h2>
        <form action={createGroupAction} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Name</label>
            <input name="name" required placeholder="e.g. Senior Flex" className="border border-slate-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Age range</label>
            <input name="ageRange" placeholder="e.g. 14-18" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-28" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Target standard</label>
            <input name="targetStandard" placeholder="e.g. 100 free pacing on 1:20" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-72" />
          </div>
          <button type="submit" className="bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Add group
          </button>
        </form>
      </div>
    </div>
  );
}
