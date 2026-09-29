// Parsing and display for swim times as coaches actually write them —
// "1:09.40" or "58.4", never raw seconds past 60 like "69".

/** "1:09.4", "1:09", or a bare "58.4" -> total seconds. Throws on anything unparseable. */
export function parseTimeToSeconds(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Time is required");

  const colonMatch = trimmed.match(/^(\d+):([0-5]?\d(?:\.\d+)?)$/);
  if (colonMatch) {
    const minutes = Number(colonMatch[1]);
    const seconds = Number(colonMatch[2]);
    return minutes * 60 + seconds;
  }

  const bareMatch = trimmed.match(/^\d+(\.\d+)?$/);
  if (bareMatch) {
    return Number(trimmed);
  }

  throw new Error(`Couldn't parse time "${input}" — use m:ss (e.g. 1:09.40) or seconds (e.g. 58.4)`);
}

/** Total seconds -> "1:09.40" (or "58.40" under a minute), keeping the precision a real time needs. */
export function formatRaceTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds - m * 60;
  const secondsStr = s.toFixed(2).padStart(5, "0");
  return m > 0 ? `${m}:${secondsStr}` : secondsStr;
}
