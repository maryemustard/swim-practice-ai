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

export type GroupRepsResult = {
  reps: number;
  totalSeconds: number; // reps * this group's representative interval — the ACTUAL total, not assumed equal
};

/**
 * Same total set time across groups, not the same rep count: a slower
 * group does fewer reps of the same distance rather than swimming the same
 * count on a more generous interval. `referenceReps` is the rep count as
 * written for the fastest (A) group; other groups' rep counts are scaled so
 * reps * interval comes out CLOSE to A's total time — integer rep counts
 * mean it's an approximation, so callers should show each group's actual
 * total (`totalSeconds`) rather than asserting they're identical.
 */
export function repsPerGroup(
  intervals: SwimmerInterval[],
  referenceReps: number
): Partial<Record<IntervalGroup, GroupRepsResult>> {
  const byGroup: Record<IntervalGroup, number[]> = { A: [], B: [] };
  for (const iv of intervals) byGroup[iv.group].push(iv.interval);

  const median = (vals: number[]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const medians: Partial<Record<IntervalGroup, number>> = {};
  for (const g of ["A", "B"] as const) {
    if (byGroup[g].length > 0) medians[g] = median(byGroup[g]);
  }

  // Total time is anchored on A; if nobody's in A, fall back to B.
  const anchorGroup = (["A", "B"] as const).find((g) => medians[g] !== undefined);
  const totalTime = anchorGroup ? referenceReps * medians[anchorGroup]! : 0;

  const result: Partial<Record<IntervalGroup, GroupRepsResult>> = {};
  for (const g of ["A", "B"] as const) {
    const m = medians[g];
    if (m === undefined) continue;
    const reps = g === anchorGroup ? referenceReps : Math.max(1, Math.round(totalTime / m));
    result[g] = { reps, totalSeconds: reps * m };
  }
  return result;
}
