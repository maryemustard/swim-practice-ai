import Anthropic from "@anthropic-ai/sdk";
import { formatRaceTime } from "./time";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type GroupContext = {
  name: string;
  ageRange: string | null;
  targetStandard: string | null;
  swimmers: {
    name: string;
    gender: string | null;
    times: { event: string; kind: string; seconds: number }[];
  }[];
  goalMeets: {
    name: string;
    date: Date;
    taperWeeks: number;
    attendanceNotes: string | null;
  }[];
  drills: { name: string; definition: string }[];
  practices: { focus: string | null; createdAt: Date; content: string }[];
};

function buildContext(group: GroupContext): string {
  const swimmerLines = group.swimmers
    .map((s) => {
      const times =
        s.times.map((t) => `${t.event} ${t.kind}: ${formatRaceTime(t.seconds)}`).join(", ") ||
        "no times on file";
      return `- ${s.name}${s.gender ? ` (${s.gender})` : ""}: ${times}`;
    })
    .join("\n");

  const goalMeetLines = group.goalMeets
    .map(
      (g) =>
        `- ${g.name} on ${g.date.toDateString()}, ${g.taperWeeks}-week taper${
          g.attendanceNotes ? ` — ${g.attendanceNotes}` : ""
        }`
    )
    .join("\n");

  const drillLines = group.drills.map((d) => `- ${d.name}: ${d.definition}`).join("\n");

  const practiceLines = group.practices
    .slice(0, 5)
    .map((p) => `### ${p.createdAt.toDateString()} — ${p.focus ?? "no focus set"}\n${p.content}`)
    .join("\n\n");

  return `GROUP: ${group.name}${group.ageRange ? ` (ages ${group.ageRange})` : ""}
TARGET STANDARD: ${group.targetStandard ?? "not set"}

SWIMMERS AND TIMES:
${swimmerLines || "(no swimmers on file)"}

GOAL MEETS:
${goalMeetLines || "(none on file)"}

DRILL GLOSSARY:
${drillLines || "(none on file)"}

RECENT PRACTICES (most recent first):
${practiceLines || "(none generated yet)"}`;
}

export async function askAboutGroup(
  group: GroupContext,
  question: string,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });
  const system = `You are a helpful assistant for a swim coach, answering questions about one of their training groups. Only use the data given below — if something isn't covered by it, say so plainly instead of guessing or inventing numbers. Keep answers short and practical, the way a coach would want them (a coach is usually asking between practices, not reading a report). Always give times in m:ss notation (e.g. "1:09.4"), never as raw seconds past 60 (never "69.4s").

${buildContext(group)}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system,
    messages: [...history, { role: "user", content: question }],
  });

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
