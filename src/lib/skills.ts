export type CueGroup = { label: string; items: string[] };

export const CATEGORIES = [
  { value: "general", label: "Skills" },
  { value: "freestyle", label: "Freestyle" },
  { value: "backstroke", label: "Backstroke" },
  { value: "breaststroke", label: "Breaststroke" },
  { value: "butterfly", label: "Butterfly" },
  { value: "im", label: "IM" },
] as const;

export const STAGES = [
  { value: "foundation", label: "Foundation" },
  { value: "development", label: "Development" },
  { value: "experienced", label: "Experienced" },
] as const;

/**
 * Coaches type cues in a plain convention instead of filling out a form per
 * bullet: a line with no leading "- " starts a new named group, lines
 * starting with "- " are that group's bullets. A single ungrouped block
 * (no label line before the first "- ") becomes one group with an empty
 * label.
 */
export function parseCues(raw: string): CueGroup[] {
  const groups: CueGroup[] = [];
  let current: CueGroup | null = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("- ")) {
      const item = line.slice(2).trim();
      if (!current) {
        current = { label: "", items: [] };
        groups.push(current);
      }
      current.items.push(item);
    } else {
      current = { label: line, items: [] };
      groups.push(current);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}
