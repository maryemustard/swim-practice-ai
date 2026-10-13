import Anthropic from "@anthropic-ai/sdk";
import {
  GroupSetResult,
  IntervalGroup,
  SetType,
  SwimmerInterval,
  assignIntervalGroups,
  bestSetForTarget,
  formatSeconds,
  median,
  targetInterval,
  targetTimeForRepeat,
} from "./paceEngine";

const REST_SECONDS = 10;

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
  groupSets: Partial<Record<IntervalGroup, GroupSetResult>>;
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

/**
 * Coaches who annotate practices with cumulative time in parentheses — "(8)",
 * "(28)", "(84)" — give us a free signal for how long their practices
 * actually run. Take the largest such number in each example (its final
 * total) and average across examples; null if no example uses the convention.
 */
function estimateTargetMinutes(styleExamples: { content: string }[]): number | null {
  const totals: number[] = [];
  for (const ex of styleExamples) {
    const matches = [...ex.content.matchAll(/\((\d{1,3})\)/g)].map((m) => Number(m[1]));
    if (matches.length > 0) totals.push(Math.max(...matches));
  }
  if (totals.length === 0) return null;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
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
  const targetMinutes = estimateTargetMinutes(group.styleExamples);

  const prompt = `You write swim practices for a specific coach and group. Write the practice EXACTLY the way this coach writes theirs — same notation, same structure (e.g. "Then go X times through" blocks if they use that), same abbreviations, same level of terseness. Do not reformat it into a generic list — copy their voice.

IMPORTANT — drills are specific to the stroke they're normally done in (e.g. "teacup drill", "kick switch", and "single arm" are backstroke drills; they are not breaststroke, fly, or free drills). If today's focus uses a different stroke than one of the example practices below, copy that example's STRUCTURE, NOTATION, and VOICE, but do NOT carry over its stroke-specific drill names onto a different stroke. Only use a drill name if it's actually correct for the stroke you're writing it for — pull from this coach's drill vocabulary below when it has an entry for that stroke, or fall back to a generic, stroke-agnostic cue (catch-up, scull, closed-fist, high elbow) rather than guessing or reusing a drill from the wrong stroke.

GROUP: ${group.name}${group.ageRange ? ` (ages ${group.ageRange})` : ""}
TARGET STANDARD: ${group.targetStandard ?? "not specified"}
TODAY'S FOCUS: ${focus}

PAST PRACTICES FROM THIS COACH (match this style exactly):
${styleText || "(none provided yet — write a reasonable generic practice for this focus)"}

THIS COACH'S DRILL VOCABULARY:
${drillText || "(none provided yet)"}

Some parts of a practice are swum together as a group (warmup, pre-set, usually cooldown, often kick/drill) — write those with a normal fixed interval, same as the coach would. But for each part where swimmers should hold their OWN personalized pace (a real main set), do NOT invent one interval for everyone — instead write a placeholder token in the text like [[PACE:main1]] where the interval would go, and describe that set in the accompanying JSON so we can compute each swimmer's real interval and substitute it in.

For those personalized main sets, write it the way this coach actually does: every group does the SAME number of reps (write that rep count, for the fastest group, as "reps" in the JSON) — the slower group's distance per rep gets shortened instead, computed and substituted in automatically so both groups land on close to the same total time. You don't need to work out the shortened distance yourself; just write the set for the fastest group normally and let the placeholder carry the rest.

Make the main set carry real weight in the practice — matching the volume this coach's own examples actually use for a main set, not a token handful of reps.
${
  targetMinutes
    ? `\nThis coach's own practices run about ${targetMinutes} minutes total (based on the cumulative-time numbers in parentheses in their examples above). Match that total length — do not stop short after one or two sets. If you use the same running-total-in-parentheses convention they do, keep it correct and strictly increasing to the end, consistent with a ${targetMinutes}-minute practice.`
    : ""
}

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

function inlineSummary(intervals: SwimmerInterval[], groupSets: Partial<Record<IntervalGroup, GroupSetResult>>): string {
  const groups: Record<IntervalGroup, number[]> = { A: [], B: [] };
  for (const iv of intervals) groups[iv.group].push(iv.interval);

  const parts = (["A", "B"] as const)
    .filter((g) => groups[g].length > 0 && groupSets[g])
    .map((g) => {
      const vals = groups[g];
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const range = lo === hi ? formatSeconds(lo) : `${formatSeconds(lo)}-${formatSeconds(hi)}`;
      const { reps, distance, totalSeconds } = groupSets[g]!;
      return `${g}: ${reps}x${distance} on ${range} (~${formatSeconds(totalSeconds)} total)`;
    });
  return parts.length > 0 ? `(${parts.join(" · ")})` : "(no times on file)";
}

/**
 * Compute every swimmer's target/interval for each personalized pace set,
 * and substitute a compact inline summary into the practice text so it reads
 * naturally in the coach's own voice with real numbers dropped in.
 *
 * Every group swims the SAME rep count (the whole point of this scaling —
 * everyone finishes together). The lever for a slower group is DISTANCE per
 * rep, searched in 25-yard steps to land as close as possible to the fastest
 * group's total time, same as how the real coach this was built from scales
 * a set by hand ("B group 75/100/75" against an "A" written as 100s).
 */
export function resolvePractice(group: GroupForGeneration, practice: GeneratedPractice): ResolvedPractice {
  const resolvedSets: ResolvedPaceSet[] = [];
  let text = practice.text;

  for (const spec of practice.paceSets) {
    const swimmersWithRef = group.swimmers
      .map((s) => {
        const ref = referenceTimeFor(s);
        return ref ? { id: s.id, name: s.name, ref } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Group membership is decided at the written (A) distance, by raw ability.
    const atWrittenDistance = swimmersWithRef.map((s) => {
      const targetTime = targetTimeForRepeat(s.ref.seconds, s.ref.distance, spec.distance, spec.setType);
      return { id: s.id, name: s.name, targetTime, interval: targetInterval(targetTime, REST_SECONDS) };
    });
    const groupOf = new Map(assignIntervalGroups(atWrittenDistance).map((g) => [g.swimmerId, g.group]));

    const aRefs = swimmersWithRef.filter((s) => groupOf.get(s.id) === "A");
    const bRefs = swimmersWithRef.filter((s) => groupOf.get(s.id) === "B");

    const buildIntervals = (
      refs: typeof swimmersWithRef,
      distance: number,
      g: IntervalGroup
    ): SwimmerInterval[] =>
      refs.map((s) => {
        const targetTime = targetTimeForRepeat(s.ref.seconds, s.ref.distance, distance, spec.setType);
        return { swimmerId: s.id, swimmerName: s.name, targetTime, interval: targetInterval(targetTime, REST_SECONDS), group: g };
      });

    const aIntervals = buildIntervals(aRefs, spec.distance, "A");
    const aTotal = aIntervals.length > 0 ? spec.reps * median(aIntervals.map((x) => x.interval)) : 0;

    let bSet = { reps: spec.reps, distance: spec.distance, totalSeconds: 0 };
    let bIntervals: SwimmerInterval[] = [];
    if (bRefs.length > 0) {
      bSet = bestSetForTarget(
        bRefs.map((s) => s.ref),
        spec.setType,
        spec.reps,
        REST_SECONDS,
        aTotal,
        spec.distance
      );
      bIntervals = buildIntervals(bRefs, bSet.distance, "B");
    }

    const groupSets: Partial<Record<IntervalGroup, GroupSetResult>> = {};
    if (aIntervals.length > 0) groupSets.A = { reps: spec.reps, distance: spec.distance, totalSeconds: aTotal };
    if (bIntervals.length > 0) groupSets.B = bSet;

    const allIntervals = [...aIntervals, ...bIntervals];
    resolvedSets.push({ ...spec, intervals: allIntervals, groupSets });

    const placeholder = `[[PACE:${spec.key}]]`;
    text = text.split(placeholder).join(inlineSummary(allIntervals, groupSets));
  }

  return { focus: practice.focus, text, paceSets: resolvedSets, source: practice.source };
}
