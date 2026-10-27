import { AMOUNT_BANDS, COUNT_BANDS, type Interval, type PredicateOutcome } from "./types";

/**
 * Interval containment / disjointness / overlap (M08 / R14 / T14–T25).
 * - wholly contained → Pass
 * - wholly disjoint → Fail
 * - partial overlap → Unresolved
 * - unknown cap → Unresolved (never unlimited)
 * - open-ended request vs finite cap → Unresolved (cannot fully satisfy)
 */

export function compareIntervalToCap(
  requested: Interval,
  cap: number | null | undefined,
  opts?: { minimum?: number | null; unknownCap?: boolean }
): PredicateOutcome {
  if (opts?.unknownCap || cap === undefined) {
    return "Unresolved";
  }

  const minimum = opts?.minimum ?? null;

  // Confirmed unrestricted upper bound
  if (cap === null) {
    if (minimum == null) return "Pass";
    const permitted: Interval = {
      min: minimum,
      minInclusive: true,
      max: null,
      maxInclusive: false,
    };
    if (containsInterval(permitted, requested)) return "Pass";
    if (disjointIntervals(permitted, requested)) return "Fail";
    return "Unresolved";
  }

  const permitted: Interval = {
    min: minimum,
    minInclusive: true,
    max: cap,
    maxInclusive: true,
  };

  if (containsInterval(permitted, requested)) return "Pass";
  if (disjointIntervals(permitted, requested)) return "Fail";
  return "Unresolved";
}

export function containsInterval(outer: Interval, inner: Interval): boolean {
  if (!boundCoversLower(outer, inner)) return false;
  if (!boundCoversUpper(outer, inner)) return false;
  return true;
}

function boundCoversLower(outer: Interval, inner: Interval): boolean {
  if (outer.min == null) return true;
  if (inner.min == null) return false;
  if (inner.min > outer.min) return true;
  if (inner.min < outer.min) return false;
  return outer.minInclusive || !inner.minInclusive;
}

function boundCoversUpper(outer: Interval, inner: Interval): boolean {
  if (outer.max == null) return true;
  if (inner.max == null) return false; // open-ended cannot fully sit inside finite
  if (inner.max < outer.max) return true;
  if (inner.max > outer.max) return false;
  return outer.maxInclusive || !inner.maxInclusive;
}

export function disjointIntervals(a: Interval, b: Interval): boolean {
  return !overlapsInterval(a, b);
}

export function overlapsInterval(a: Interval, b: Interval): boolean {
  if (a.max != null && b.min != null) {
    if (a.max < b.min) return false;
    if (a.max === b.min && (!a.maxInclusive || !b.minInclusive)) return false;
  }
  if (b.max != null && a.min != null) {
    if (b.max < a.min) return false;
    if (b.max === a.min && (!b.maxInclusive || !a.minInclusive)) return false;
  }
  return true;
}

export function getCountBand(id: string): Interval {
  const band = COUNT_BANDS[id];
  if (!band) throw new Error(`Unknown count band: ${id}`);
  return { ...band };
}

export function getAmountBand(id: string): Interval {
  const band = AMOUNT_BANDS[id];
  if (!band) throw new Error(`Unknown amount band: ${id}`);
  return { ...band };
}

/** Closed integer interval helper for tests. */
export function closedInt(min: number, max: number | null): Interval {
  return { min, minInclusive: true, max, maxInclusive: max != null };
}
