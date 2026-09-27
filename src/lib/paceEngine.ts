// Pace / interval engine
//
// Placeholder default formula — swap this out once the coach's real formula
// (see Open Questions in the concept doc) is written down. Everything below
// this file's exports stays the same either way: give it a swimmer's time
// for a reference event and a set type, get back a target pace.

export type SetType = "sprint" | "threshold" | "aerobic" | "recovery" | "im" | "kick" | "drill";

// Seconds added per 100 (of the reference event) for each set type, relative
// to straight race pace. A placeholder, not a validated coaching formula.
const OFFSET_SECONDS_PER_100: Record<SetType, number> = {
  sprint: 1,
  threshold: 4,
  aerobic: 9,
  im: 6,
  kick: 12,
  drill: 15,
  recovery: 18,
};

/** Reference time (seconds) for some event -> pace per 100 (seconds). */
export function per100Pace(referenceSeconds: number, referenceDistance: number): number {
  return referenceSeconds / (referenceDistance / 100);
}

/** Target time for one repeat of `distance`, given a reference time/distance and a set type. */
export function targetTimeForRepeat(
  referenceSeconds: number,
  referenceDistance: number,
  repeatDistance: number,
  setType: SetType
): number {
  const basePace100 = per100Pace(referenceSeconds, referenceDistance) + OFFSET_SECONDS_PER_100[setType];
  return Math.round(basePace100 * (repeatDistance / 100));
}

/** Round up to the next 5-second interval and add rest, so the interval is easy to read on a pace clock. */
export function targetInterval(targetTimeSeconds: number, restSeconds: number): number {
  return Math.ceil((targetTimeSeconds + restSeconds) / 5) * 5;
}

export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}"`;
}

export type SwimmerInterval = {
  swimmerId: string;
  swimmerName: string;
  targetTime: number;
  interval: number;
  group: "A" | "B" | "C";
};

/**
 * Split swimmers into A/B/C lanes for one set, based on each swimmer's
 * computed target time (fastest third = A, middle third = B, rest = C).
 */
export function assignIntervalGroups(
  swimmers: { id: string; name: string; targetTime: number; interval: number }[]
): SwimmerInterval[] {
  const sorted = [...swimmers].sort((a, b) => a.targetTime - b.targetTime);
  const n = sorted.length;
  return sorted.map((s, i) => {
    const pct = n <= 1 ? 0 : i / (n - 1);
    const group: "A" | "B" | "C" = pct < 1 / 3 ? "A" : pct < 2 / 3 ? "B" : "C";
    return { swimmerId: s.id, swimmerName: s.name, targetTime: s.targetTime, interval: s.interval, group };
  });
}
