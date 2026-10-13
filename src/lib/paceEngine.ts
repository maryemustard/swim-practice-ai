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
  im: 15,
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

export type GroupSetResult = {
  reps: number;
  distance: number; // yards per rep — the main lever we adjust per group
  interval: number; // the ONE send-off every swimmer in this group goes on
  totalSeconds: number;
};

/**
 * The single interval (send-off) for a group's set, based on its SLOWEST
 * swimmer at this distance — the real number a coach would actually call out
 * on deck, since everyone in the group has to be able to make it. Not a
 * range, not a per-swimmer average: one number.
 */
export function groupInterval(
  refs: { seconds: number; distance: number }[],
  setType: SetType,
  distance: number,
  restSeconds: number
): number {
  const intervals = refs.map((r) => targetInterval(targetTimeForRepeat(r.seconds, r.distance, distance, setType), restSeconds));
  return Math.max(...intervals);
}

/**
 * The longest swimmable distance (25-yard steps) a slower group can hold
 * while still making a FIXED interval that was set by the faster group — so
 * both groups go off the exact same send-off and finish in the exact same
 * total time, same as the real coach's own convention ("200 FR swim @ 3:00,
 * B-group 150"): one interval for the whole set, distance is the only thing
 * that changes for the slower group.
 */
export function bestDistanceForInterval(
  refs: { seconds: number; distance: number }[],
  setType: SetType,
  restSeconds: number,
  interval: number,
  maxDistance: number
): number {
  for (let d = maxDistance; d >= 25; d -= 25) {
    const fits = refs.every(
      (r) => targetInterval(targetTimeForRepeat(r.seconds, r.distance, d, setType), restSeconds) <= interval
    );
    if (fits) return d;
  }
  return 25;
}
