import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteGroupAction, updateGroupAction } from "@/app/actions";

export default async function EditGroupPage({ params }: PageProps<"/groups/[groupId]/edit">) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-teal-900">Edit {group.name}</h1>
        <p className="text-slate-600 mt-1">
          Change this group&apos;s name, age range, or target standard.
        </p>
      </div>

      <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-sm">
        <form action={updateGroupAction} className="flex flex-col gap-3 max-w-md">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Name</label>
            <input
              name="name"
              required
              defaultValue={group.name}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Age range</label>
            <input
              name="ageRange"
              defaultValue={group.ageRange ?? ""}
              placeholder="e.g. 14-18"
              className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Target standard</label>
            <input
              name="targetStandard"
              defaultValue={group.targetStandard ?? ""}
              placeholder="e.g. 100 free pacing on 1:20"
              className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              className="bg-teal-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-teal-700 transition-colors"
            >
              Save changes
            </button>
            <Link href={`/groups/${group.id}`} className="text-sm text-slate-600 hover:text-slate-900">
              Cancel
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-red-100 bg-red-50/50 p-5">
        <h2 className="font-medium text-red-900 text-sm">Delete this group</h2>
        <p className="text-xs text-red-700 mt-1">
          Removes the group along with its swimmers, times, style examples, goal meets, drills, and
          generated practices. This can&apos;t be undone.
        </p>
        <form action={deleteGroupAction} className="mt-3">
          <input type="hidden" name="groupId" value={group.id} />
          <button type="submit" className="text-sm text-red-700 border border-red-300 rounded-full px-4 py-1.5 hover:bg-red-100 transition-colors">
            Delete {group.name}
          </button>
        </form>
      </section>
    </div>
  );
}
