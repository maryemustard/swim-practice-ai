import Anthropic from "@anthropic-ai/sdk";
import {
  SetType,
  assignIntervalGroups,
  targetInterval,
  targetTimeForRepeat,
} from "./paceEngine";

export type PracticeSet = {
  label: string;
  reps: number;
  distance: number;
  stroke: string;
  setType: SetType;
  restSeconds: number;
  notes?: string;
};

export type GeneratedPractice = {
  focus: string;
  sets: PracticeSet[];
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
function templatePractice(focus: string): PracticeSet[] {
  const focusKey = focus.toLowerCase();
  const mainType: SetType = focusKey.includes("sprint")
    ? "sprint"
    : focusKey.includes("threshold")
      ? "threshold"
      : focusKey.includes("im")
        ? "im"
        : "aerobic";

  return [
    { label: "Warmup", reps: 1, distance: 400, stroke: "Free/Choice", setType: "recovery", restSeconds: 0 },
    { label: "Kick set", reps: 6, distance: 50, stroke: "Kick", setType: "kick", restSeconds: 15 },
    {
      label: "Main set",
      reps: mainType === "sprint" ? 8 : 6,
      distance: mainType === "sprint" ? 50 : mainType === "im" ? 100 : 100,
      stroke: mainType === "im" ? "IM" : "Free",
      setType: mainType,
      restSeconds: mainType === "sprint" ? 20 : 10,
      notes: `Focus: ${focus}`,
    },
    { label: "Drill set", reps: 4, distance: 50, stroke: "Drill", setType: "drill", restSeconds: 15 },
    { label: "Cooldown", reps: 1, distance: 200, stroke: "Free", setType: "recovery", restSeconds: 0 },
  ];
}

// --- Claude-generated practice, matching the group's own style examples ---
async function claudePractice(group: GroupForGeneration, focus: string): Promise<PracticeSet[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const styleText = group.styleExamples
    .map((s) => `### ${s.title}\n${s.content}`)
    .join("\n\n");
  const drillText = group.drills.map((d) => `- ${d.name}: ${d.definition}`).join("\n");

  const prompt = `You write swim practices for a specific coach and group. Match this coach's own structure and tone from their past practices below — don't invent a generic template.

GROUP: ${group.name}${group.ageRange ? ` (ages ${group.ageRange})` : ""}
TARGET STANDARD: ${group.targetStandard ?? "not specified"}
TODAY'S FOCUS: ${focus}

PAST PRACTICES FROM THIS COACH (style reference):
${styleText || "(none provided yet)"}

THIS COACH'S DRILL VOCABULARY:
${drillText || "(none provided yet)"}

Return ONLY a JSON array of sets, no prose, no markdown fences. Each item:
{"label": string, "reps": number, "distance": number (yards per rep), "stroke": string, "setType": one of "sprint"|"threshold"|"aerobic"|"recovery"|"im"|"kick"|"drill", "restSeconds": number, "notes": optional string}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    if (Array.isArray(parsed)) return parsed as PracticeSet[];
    return null;
  } catch {
    return null;
  }
}

export async function generatePractice(
  group: GroupForGeneration,
  focus: string
): Promise<GeneratedPractice> {
  const claudeSets = await claudePractice(group, focus).catch(() => null);
  const sets = claudeSets ?? templatePractice(focus);
  return { focus, sets, source: claudeSets ? "claude" : "template" };
}

export type SetWithIntervals = PracticeSet & {
  intervals: ReturnType<typeof assignIntervalGroups>;
};

const INTERVAL_SET_TYPES: SetType[] = ["sprint", "threshold", "aerobic", "im"];

/** For each interval-bearing set, compute every swimmer's target time/interval and A/B/C group. */
export function computeIntervals(
  group: GroupForGeneration,
  practice: GeneratedPractice
): SetWithIntervals[] {
  return practice.sets.map((set) => {
    if (!INTERVAL_SET_TYPES.includes(set.setType)) {
      return { ...set, intervals: [] };
    }
    const swimmerTargets = group.swimmers
      .map((s) => {
        const ref = referenceTimeFor(s);
        if (!ref) return null;
        const targetTime = targetTimeForRepeat(ref.seconds, ref.distance, set.distance, set.setType);
        const interval = targetInterval(targetTime, set.restSeconds);
        return { id: s.id, name: s.name, targetTime, interval };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return { ...set, intervals: assignIntervalGroups(swimmerTargets) };
  });
}
