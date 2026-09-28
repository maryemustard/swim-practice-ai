import Anthropic from "@anthropic-ai/sdk";
import {
  SetType,
  SwimmerInterval,
  assignIntervalGroups,
  formatSeconds,
  repsPerGroup,
  targetInterval,
  targetTimeForRepeat,
} from "./paceEngine";

// A single portion of the practice where swimmers hold their own personalized
// pace (a real main set) rather than swimming together as a group.
export type PaceSetSpec = {
  key: string; // matches a [[PACE:key]] placeholder in the practice text
  label: string;
  distance: number; // yards per rep, used to compute each swimmer's target
  setType: SetType;
  // Rep count as written in the text, for the fastest (A) group. Other
  // groups do fewer reps of the same distance so the set takes about the
  // same total time for everyone, rather than the same reps on more rest.
  reps: number;
};

export type GeneratedPractice = {
  focus: string;
  text: string; // the practice, written in the coach's own voice/notation, with [[PACE:key]] placeholders
  paceSets: PaceSetSpec[];
  source: "template" | "claude";
};

export type GroupForGeneration = {
  name: string;
  ageRange: string | null;
  targetStandard: string | null;
  styleExamples: { title: string; content: string }[];
  drills: { name: string; definition: string }[];
  swimmers: {
    id: string;
    name: string;
    times: { event: string; kind: string; seconds: number }[];
  }[];
};

export type ResolvedPaceSet = PaceSetSpec & {
  intervals: SwimmerInterval[];
  groupReps: Record<"A" | "B" | "C", number>;
};

export type ResolvedPractice = {
  focus: string;
  text: string; // placeholders replaced with a compact inline pace summary
  paceSets: ResolvedPaceSet[]; // full per-swimmer breakdown, for a detail table
  source: "template" | "claude";
};

// --- Reference event used to compute pace, in priority order ---
const REFERENCE_EVENTS: { event: string; distance: number }[] = [
  { event: "100 Free", distance: 100 },
  { event: "200 Free", distance: 200 },
  { event: "50 Free", distance: 50 },
];

function referenceTimeFor(swimmer: GroupForGeneration["swimmers"][number]) {
  for (const ref of REFERENCE_EVENTS) {
    const t = swimmer.times.find((x) => x.event === ref.event && x.kind === "current");
    if (t) return { seconds: t.seconds, distance: ref.distance };
  }
  const any = swimmer.times.find((x) => x.kind === "current");
  return any ? { seconds: any.seconds, distance: 100 } : null;
}

// --- Deterministic fallback used when no ANTHROPIC_API_KEY is configured ---
function templatePractice(focus: string): GeneratedPractice {
  const focusKey = focus.toLowerCase();
  const mainType: SetType = focusKey.includes("sprint")
    ? "sprint"
    : focusKey.includes("threshold")
      ? "threshold"
      : focusKey.includes("im")
        ? "im"
        : "aerobic";
  const reps = mainType === "sprint" ? 8 : 6;
  const distance = mainType === "sprint" ? 50 : 100;
  const stroke = mainType === "im" ? "IM" : "Free";

  const text = `Warmup: 400 free/choice easy
Kick: 6x50 kick on :15 rest
Main: ${reps}x${distance} ${stroke} [[PACE:main]] — focus: ${focus}
Drill: 4x50 catchup drill on :15
Cooldown: 200 easy`;

  return {
    focus,
    text,
    paceSets: [{ key: "main", label: `${reps}x${distance} ${stroke}`, distance, setType: mainType, reps }],
    source: "template",
  };
}

// --- Claude-generated practice, matching the group's own style examples ---
async function claudePractice(group: GroupForGeneration, focus: string): Promise<GeneratedPractice | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const styleText = group.styleExamples
    .map((s) => `### ${s.title}\n${s.content}`)
    .join("\n\n");
  const drillText = group.drills.map((d) => `- ${d.name}: ${d.definition}`).join("\n");

  const prompt = `You write swim practices for a specific coach and group. Write the practice EXACTLY the way this coach writes theirs — same notation, same structure (e.g. "Then go X times through" blocks if they use that), same abbreviations and drill names, same level of terseness. Do not reformat it into a generic list — copy their voice.

GROUP: ${group.name}${group.ageRange ? ` (ages ${group.ageRange})` : ""}
TARGET STANDARD: ${group.targetStandard ?? "not specified"}
TODAY'S FOCUS: ${focus}

PAST PRACTICES FROM THIS COACH (match this style exactly):
${styleText || "(none provided yet — write a reasonable generic practice for this focus)"}

THIS COACH'S DRILL VOCABULARY:
${drillText || "(none provided yet)"}

Some parts of a practice are swum together as a group (warmup, pre-set, usually cooldown, often kick/drill) — write those with a normal fixed interval, same as the coach would. But for each part where swimmers should hold their OWN personalized pace (a real main set), do NOT invent one interval for everyone — instead write a placeholder token in the text like [[PACE:main1]] where the interval would go, and describe that set in the accompanying JSON so we can compute each swimmer's real interval and substitute it in.

For those personalized main sets, this team's coaches scale the WORK, not just the rest: a slower group does fewer reps of the same distance so the whole set takes about the same total time as the faster group, rather than everyone doing the same reps with slower swimmers just getting more rest. Write the rep count in the text as if for the fastest group, and report that same number as "reps" in the JSON — the actual per-group rep counts (fewer for slower groups, same total time) get computed and substituted in along with the pace.

Respond in EXACTLY this format, nothing else:

PRACTICE:
<the full practice text, in the coach's own voice, with [[PACE:key]] placeholders for personalized sets>

INTERVALS_JSON:
<a JSON array, one entry per placeholder used above: {"key": string (matches a placeholder), "label": string (short description of the set), "distance": number (yards per single rep), "setType": one of "sprint"|"threshold"|"aerobic"|"im", "reps": number (rep count as written, for the fastest group)}>`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (msg.stop_reason === "max_tokens") {
    console.warn("[generatePractice] response was truncated at max_tokens — practice may be incomplete");
  }

  const practiceMatch = text.match(/PRACTICE:\s*([\s\S]*?)\s*INTERVALS_JSON:/);
  if (!practiceMatch) {
    console.error(
      `[generatePractice] could not find PRACTICE: section (stop_reason=${msg.stop_reason}) in Claude output:\n`,
      text
    );
    return null;
  }

  // The JSON block may come back wrapped in a ```json fence despite instructions not to.
  const jsonMatch = text.match(/INTERVALS_JSON:\s*(?:```(?:json)?\s*)?(\[[\s\S]*\])\s*(?:```)?\s*$/);
  if (!jsonMatch) {
    console.warn("[generatePractice] no INTERVALS_JSON found, using practice text with no pace sets:\n", text);
    return { focus, text: practiceMatch[1].trim(), paceSets: [], source: "claude" };
  }

  try {
    const paceSets = JSON.parse(jsonMatch[1]) as PaceSetSpec[];
    return { focus, text: practiceMatch[1].trim(), paceSets, source: "claude" };
  } catch (err) {
    console.error("[generatePractice] failed to parse INTERVALS_JSON:", err, "\nraw:", jsonMatch[1]);
    return { focus, text: practiceMatch[1].trim(), paceSets: [], source: "claude" };
  }
}

export async function generatePractice(
  group: GroupForGeneration,
  focus: string
): Promise<GeneratedPractice> {
  const claudeResult = await claudePractice(group, focus).catch((err) => {
    console.error("[generatePractice] Claude call failed, falling back to template:", err);
    return null;
  });
  return claudeResult ?? templatePractice(focus);
}

function inlineSummary(intervals: SwimmerInterval[], groupReps: Record<"A" | "B" | "C", number>): string {
  const groups: Record<"A" | "B" | "C", number[]> = { A: [], B: [], C: [] };
  for (const iv of intervals) groups[iv.group].push(iv.interval);

  const parts = (["A", "B", "C"] as const)
    .filter((g) => groups[g].length > 0)
    .map((g) => {
      const vals = groups[g];
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const range = lo === hi ? formatSeconds(lo) : `${formatSeconds(lo)}-${formatSeconds(hi)}`;
      return `${g}: ${groupReps[g]}x on ${range}`;
    });
  return parts.length > 0 ? `(${parts.join(" · ")}, same total time)` : "(no times on file)";
}

/**
 * Compute every swimmer's target/interval for each personalized pace set,
 * and substitute a compact inline summary into the practice text so it reads
 * naturally in the coach's own voice with real numbers dropped in.
 */
export function resolvePractice(group: GroupForGeneration, practice: GeneratedPractice): ResolvedPractice {
  const resolvedSets: ResolvedPaceSet[] = [];
  let text = practice.text;

  for (const spec of practice.paceSets) {
    const swimmerTargets = group.swimmers
      .map((s) => {
        const ref = referenceTimeFor(s);
        if (!ref) return null;
        const targetTime = targetTimeForRepeat(ref.seconds, ref.distance, spec.distance, spec.setType);
        const interval = targetInterval(targetTime, 10);
        return { id: s.id, name: s.name, targetTime, interval };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const intervals = assignIntervalGroups(swimmerTargets);
    const groupReps = repsPerGroup(intervals, spec.reps);
    resolvedSets.push({ ...spec, intervals, groupReps });

    const placeholder = `[[PACE:${spec.key}]]`;
    text = text.split(placeholder).join(inlineSummary(intervals, groupReps));
  }

  return { focus: practice.focus, text, paceSets: resolvedSets, source: practice.source };
}
