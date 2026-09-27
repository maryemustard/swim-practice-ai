import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PracticesLogPage() {
  const practices = await prisma.practice.findMany({
    include: { group: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Practice log</h1>
        <p className="text-slate-600 mt-1">Every practice generated so far, across all groups.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Group</th>
              <th className="py-2 px-4">Focus</th>
              <th className="py-2 px-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {practices.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-2 px-4">
                  <Link href={`/practices/${p.id}`} className="block">
                    {new Date(p.createdAt).toLocaleString()}
                  </Link>
                </td>
                <td className="py-2 px-4">{p.group.name}</td>
                <td className="py-2 px-4">{p.focus}</td>
                <td className="py-2 px-4">
                  <span
                    className={`text-xs rounded px-1.5 py-0.5 ${
                      p.source === "claude" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.source}
                  </span>
                </td>
              </tr>
            ))}
            {practices.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-slate-500">
                  No practices generated yet — go to a group page and generate one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
