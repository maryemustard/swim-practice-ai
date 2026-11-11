import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseCues, youTubeEmbedUrl, CATEGORIES, STAGES } from "@/lib/skills";
import { addTeamDrillAction, deleteDrillAction, addSkillAction, deleteSkillAction } from "./actions";

export default async function DrillsPage({ searchParams }: PageProps<"/drills">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "general";

  const [skills, drills] = await Promise.all([
    prisma.skill.findMany({ where: { category }, orderBy: [{ stage: "asc" }, { order: "asc" }] }),
    prisma.drillEntry.findMany({ where: { groupId: null }, orderBy: { name: "asc" } }),
  ]);

  const byStage = new Map<string | null, typeof skills>();
  for (const s of skills) {
    const key = s.stage;
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(s);
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl font-semibold text-ink">The standard</h1>
        <p className="text-ink-soft mt-1 max-w-2xl">
          One shared progression every group&apos;s practices draw from — so a drill or technique cue means
          the same thing whether it&apos;s taught in Dawgs 1 or Senior 1.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 font-mono text-[13px]">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/drills?category=${c.value}`}
            className={
              c.value === category
                ? "bg-pool-600 text-white px-3.5 py-1.5 rounded-full"
                : "bg-surface border border-line text-ink-mute px-3.5 py-1.5 rounded-full hover:border-pool-600 hover:text-pool-700 transition-colors"
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

      {category === "general" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
          {skills.length === 0 && (
            <p className="text-ink-mute sm:col-span-2">No general skills defined yet — add the first one below.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {STAGES.map((stage) => (
            <div key={stage.value} className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-medium text-ink mb-3">{stage.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(byStage.get(stage.value) ?? []).map((s) => (
                  <SkillCard key={s.id} skill={s} />
                ))}
                {(byStage.get(stage.value) ?? []).length === 0 && (
                  <p className="text-ink-mute text-sm sm:col-span-2">
                    No {CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()} cues for this stage yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-medium text-ink mb-1">Add to the standard</h2>
        <p className="text-xs text-ink-mute mb-3">
          Type cues under a label, one per line starting with &quot;- &quot;. A new line with no &quot;- &quot;
          starts the next group — e.g. &quot;Starting position&quot; then its bullets, then &quot;The
          dive&quot; and its bullets.
        </p>
        <form action={addSkillAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              required
              placeholder="Skill name — e.g. Dives"
              className="border border-line rounded px-3 py-1.5 text-sm flex-1 min-w-[180px]"
            />
            <select name="category" defaultValue={category} className="border border-line rounded px-3 py-1.5 text-sm">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select name="stage" defaultValue="" className="border border-line rounded px-3 py-1.5 text-sm">
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              name="videoUrl"
              placeholder="Video URL (optional)"
              className="border border-line rounded px-3 py-1.5 text-sm flex-1 min-w-[160px]"
            />
          </div>
          <textarea
            name="cues"
            required
            rows={6}
            placeholder={"Starting position\n- Legs shoulder-width apart, one foot forward, one back\n- Hands gripping the edge of the block, tense\n\nThe dive\n- Push off strong\n- Arms in streamline, head down, feet up and together"}
            className="border border-line rounded px-3 py-2 text-sm font-mono"
          />
          <button
            type="submit"
            className="self-start bg-pool-600 text-white text-sm rounded-full px-4 py-1.5 hover:bg-pool-700 transition-colors"
          >
            Add
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium text-ink">Plain drill glossary</h2>
        </div>
        <p className="text-xs text-ink-mute mb-3">
          Simpler name + definition pairs, still team-wide — use this for quick entries that don&apos;t need
          the full cue-group structure above.
        </p>
        <form action={addTeamDrillAction} className="flex flex-wrap gap-3 items-end mb-4">
          <input
            name="name"
            required
            placeholder="Drill name"
            className="border border-line rounded px-3 py-1.5 text-sm w-56"
          />
          <input name="definition" required placeholder="What it is" className="border border-line rounded px-3 py-1.5 text-sm flex-1" />
          <button type="submit" className="bg-surface border border-line text-ink text-sm rounded-full px-4 py-1.5 hover:border-pool-600 transition-colors">
            Add
          </button>
        </form>
        <div className="flex flex-col gap-2 text-sm">
          {drills.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 border-b border-line last:border-0 pb-2 last:pb-0">
              <p>
                <span className="font-medium text-ink">{d.name}:</span>{" "}
                <span className="text-ink-soft">{d.definition}</span>
              </p>
              <form action={deleteDrillAction}>
                <input type="hidden" name="drillId" value={d.id} />
                <button type="submit" className="text-xs text-coral-600 hover:text-coral-700 shrink-0">
                  Remove
                </button>
              </form>
            </div>
          ))}
          {drills.length === 0 && <p className="text-ink-mute">None yet.</p>}
        </div>
      </section>
    </div>
  );
}

function SkillCard({
  skill,
}: {
  skill: { id: string; name: string; videoUrl: string | null; cues: string };
}) {
  const groups = parseCues(skill.cues);
  const embedUrl = skill.videoUrl ? youTubeEmbedUrl(skill.videoUrl) : null;

  return (
    <div className="rounded-xl border border-line bg-ground p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-ink text-[14.5px]">{skill.name}</h3>
        <div className="flex items-center gap-2">
          {skill.videoUrl && !embedUrl && (
            <a
              href={skill.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-pool-700 bg-pool-50 rounded px-1.5 py-0.5"
            >
              ▶ clip
            </a>
          )}
          <form action={deleteSkillAction}>
            <input type="hidden" name="skillId" value={skill.id} />
            <button type="submit" className="text-xs text-coral-600 hover:text-coral-700">
              Remove
            </button>
          </form>
        </div>
      </div>
      {embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-black/80">
          <iframe
            src={embedUrl}
            title={`${skill.name} clip`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && (
              <p className="font-mono text-[10.5px] tracking-wide uppercase text-pool-700 mb-1">{g.label}</p>
            )}
            <ul className="list-disc pl-4 text-[13px] text-ink leading-relaxed">
              {g.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
