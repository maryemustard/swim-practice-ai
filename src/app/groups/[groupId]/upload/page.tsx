import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  addDrillAction,
  addGoalMeetAction,
  addStyleExampleAction,
  addSwimmerTimeAction,
  uploadTimesCsvAction,
} from "../actions";

export default async function UploadPage({ params }: PageProps<"/groups/[groupId]/upload">) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Upload data — {group.name}</h1>
        <p className="text-slate-600 mt-1">
          Everything here feeds the practice generator: roster times set each swimmer&apos;s pace, style
          examples set the coach&apos;s structure, the goal meet sets the target.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-2">Roster times — CSV upload</h2>
        <p className="text-sm text-slate-600 mb-3">
          Columns: <code className="bg-slate-100 px-1 rounded">name, event, kind, seconds</code> —{" "}
          <code className="bg-slate-100 px-1 rounded">kind</code> is <code>current</code> or{" "}
          <code>goal</code>. Matches a SportsEngine Team Manager custom Excel export saved as CSV, or any
          spreadsheet with those columns.
        </p>
        <pre className="text-xs bg-slate-50 border border-slate-100 rounded p-2 mb-3 text-slate-500">
{`name,event,kind,seconds
Ava Chen,100 Free,current,58.4
Ava Chen,100 Free,goal,55.0`}
        </pre>
        <form action={uploadTimesCsvAction} className="flex items-center gap-3">
          <input type="hidden" name="groupId" value={group.id} />
          <input type="file" name="file" accept=".csv" required className="text-sm" />
          <button type="submit" className="bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Upload CSV
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Add a single time by hand</h2>
        <form action={addSwimmerTimeAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Swimmer name</label>
            <input name="name" required className="border border-slate-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Event</label>
            <input name="event" required placeholder="100 Free" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Kind</label>
            <select name="kind" className="border border-slate-300 rounded px-3 py-1.5 text-sm">
              <option value="current">current</option>
              <option value="goal">goal</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Seconds</label>
            <input name="seconds" type="number" step="0.01" required className="border border-slate-300 rounded px-3 py-1.5 text-sm w-24" />
          </div>
          <button type="submit" className="bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Add
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Add a style-example practice</h2>
        <p className="text-sm text-slate-600 mb-3">
          Paste a real past practice for this group. 2+ examples give the generator a real feel for how
          this coach structures a session.
        </p>
        <form action={addStyleExampleAction} className="flex flex-col gap-3">
          <input type="hidden" name="groupId" value={group.id} />
          <input name="title" required placeholder="e.g. Aerobic base — week of 9/8" className="border border-slate-300 rounded px-3 py-1.5 text-sm" />
          <textarea name="content" required rows={6} placeholder="Warmup: ...&#10;Main set: ...&#10;Cooldown: ..." className="border border-slate-300 rounded px-3 py-1.5 text-sm font-mono" />
          <button type="submit" className="self-start bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Save style example
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Goal meet</h2>
        <form action={addGoalMeetAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Meet name</label>
            <input name="name" required placeholder="Northeast Divisionals" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-56" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Date</label>
            <input name="date" type="date" required className="border border-slate-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Taper (weeks)</label>
            <input name="taperWeeks" type="number" defaultValue={2} className="border border-slate-300 rounded px-3 py-1.5 text-sm w-20" />
          </div>
          <div className="flex flex-col gap-1 grow">
            <label className="text-xs text-slate-500">Attendance expectations</label>
            <input name="attendanceNotes" placeholder="e.g. 4x/week -> low 30s, 6x/week -> high 20s" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <button type="submit" className="bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium mb-3">Drill glossary</h2>
        <form action={addDrillAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Drill name</label>
            <input name="name" required placeholder="Catchup drill" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48" />
          </div>
          <div className="flex flex-col gap-1 grow">
            <label className="text-xs text-slate-500">What it is / what it's for</label>
            <input name="definition" required className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <button type="submit" className="bg-slate-900 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
