import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CoachChat } from "@/components/CoachChat";

export default async function AskGroupPage({ params }: PageProps<"/groups/[groupId]/ask">) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-900">Ask about {group.name}</h1>
          <p className="text-slate-600 mt-1">
            Answers are grounded in this group&apos;s uploaded roster, times, goal meet, drills, and recent
            practices — nothing else.
          </p>
        </div>
        <Link href={`/groups/${group.id}`} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to group
        </Link>
      </div>

      {!process.env.ANTHROPIC_API_KEY && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          No ANTHROPIC_API_KEY set — add one to .env to enable this.
        </p>
      )}

      <CoachChat groupId={group.id} />
    </div>
  );
}
