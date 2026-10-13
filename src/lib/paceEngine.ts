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

export type IntervalGroup = "A" | "B";

export type SwimmerInterval = {
  swimmerId: string;
  swimmerName: string;
  targetTime: number;
  interval: number;
  group: IntervalGroup;
};

/**
 * Split swimmers into A/B lanes for one set, based on each swimmer's
 * computed target time (faster half = A, slower half = B).
 */
export function assignIntervalGroups(
  swimmers: { id: string; name: string; targetTime: number; interval: number }[]
): SwimmerInterval[] {
  const sorted = [...swimmers].sort((a, b) => a.targetTime - b.targetTime);
  const n = sorted.length;
  return sorted.map((s, i) => {
    const group: IntervalGroup = i < n / 2 ? "A" : "B";
    return { swimmerId: s.id, swimmerName: s.name, targetTime: s.targetTime, interval: s.interval, group };
  });
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type GroupSetResult = {
  reps: number;
  distance: number; // yards per rep — the main lever we adjust per group
  totalSeconds: number;
};

/**
 * Finds whichever (reps, distance) combination for a slower group lands
 * CLOSEST to the faster group's total time — this is how the real coach this
 * engine was built from actually scales a set by hand ("3 x 100s FR @ 1:25
 * (B group 75/100/75)" from an uploaded example: distance shrinks before reps
 * do). Reps are only reduced below the written count when no distance in the
 * search range gets close enough on its own — distance is the first lever,
 * reps the second, never the only one, since a handful of reps gives too few
 * distance steps alone to land close at low rep counts.
 */
export function bestSetForTarget(
  refs: { seconds: number; distance: number }[],
  setType: SetType,
  referenceReps: number,
  restSeconds: number,
  targetTotalSeconds: number,
  maxDistance: number
): { reps: number; distance: number; totalSeconds: number } {
  let best = { reps: referenceReps, distance: maxDistance, totalSeconds: 0 };
  let bestDiff = Infinity;
  const minReps = Math.max(1, referenceReps - 2);
  for (let reps = referenceReps; reps >= minReps; reps--) {
    for (let d = 25; d <= maxDistance; d += 25) {
      const intervals = refs.map((r) => targetInterval(targetTimeForRepeat(r.seconds, r.distance, d, setType), restSeconds));
      const total = reps * median(intervals);
      const diff = Math.abs(total - targetTotalSeconds);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = { reps, distance: d, totalSeconds: total };
      }
    }
  }
  return best;
}
