/**
 * Time computation engine -- pure TypeScript, zero dependencies, <1ms.
 *
 * Provides current time lookup, timezone difference calculation, time
 * conversion, hourly comparison, and business hours overlap detection.
 * All functions use the built-in {@link Intl.DateTimeFormat} API for
 * timezone operations. No external dependencies required.
 */

import type {
  CityTimeInfo,
  TimeDifferenceInfo,
  HourlyRow,
  OverlapResult,
} from "./types.js";

// ── Internal Helpers ──────────────────────────────────────────────

/**
 * Get the UTC offset in minutes for a given IANA timezone at a specific instant.
 *
 * Uses `Intl.DateTimeFormat` to format the date in the target timezone,
 * then compares the local date parts to derive the offset.
 */
function getOffsetMinutes(timezone: string, date: Date = new Date()): number {
  // Format date parts in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10) - 1; // 0-indexed
  const day = parseInt(get("day"), 10);
  let hour = parseInt(get("hour"), 10);
  // Intl may return 24 for midnight in some locales
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);

  // Build a UTC timestamp from these "local" parts
  const localAsUtc = Date.UTC(year, month, day, hour, minute, second);
  const utcMs = date.getTime();

  // The offset is how far ahead (or behind) the timezone is from UTC
  const diffMs = localAsUtc - utcMs;
  return Math.round(diffMs / 60_000) || 0; // Avoid -0
}

/**
 * Get the timezone abbreviation (e.g., "KST", "EST", "PDT") for a
 * given IANA timezone at a specific instant.
 */
function getAbbreviation(timezone: string, date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
}

/**
 * Check whether DST is active for a timezone at a given instant.
 *
 * Compares the current offset to the January offset. If they differ,
 * DST is active when the current offset is greater (northern hemisphere)
 * or lesser (southern hemisphere). This heuristic works for all standard
 * IANA zones.
 */
function isDstActive(timezone: string, date: Date = new Date()): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const janOffset = getOffsetMinutes(timezone, jan);
  const julOffset = getOffsetMinutes(timezone, jul);
  const currentOffset = getOffsetMinutes(timezone, date);

  // If January and July have the same offset, no DST is observed
  if (janOffset === julOffset) return false;

  // Standard offset is the smaller one; DST is when we're on the larger one
  const standardOffset = Math.min(janOffset, julOffset);
  return currentOffset !== standardOffset;
}

/**
 * Format a date in a specific timezone as an ISO 8601 string
 * (without trailing "Z" since it represents local time).
 */
function formatISOInTimezone(timezone: string, date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "00";

  let hour = get("hour");
  if (hour === "24") hour = "00";

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}`;
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Format a UTC offset in minutes as a "+HH:MM" / "-HH:MM" string.
 *
 * @example
 * ```ts
 * formatUtcOffset(540);   // "+09:00"
 * formatUtcOffset(-300);  // "-05:00"
 * formatUtcOffset(330);   // "+05:30"
 * ```
 */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Get the current time for a timezone.
 *
 * @param timezone - IANA timezone identifier (e.g., "America/New_York").
 * @returns CityTimeInfo with current time, UTC offset, abbreviation, and DST status.
 *
 * @example
 * ```ts
 * const info = getCurrentTime("Asia/Seoul");
 * console.log(info.utcOffset);     // "+09:00"
 * console.log(info.abbreviation);  // "KST"
 * ```
 */
export function getCurrentTime(timezone: string): CityTimeInfo {
  const now = new Date();
  const offsetMin = getOffsetMinutes(timezone, now);

  return {
    timezone,
    currentTime: formatISOInTimezone(timezone, now),
    utcOffset: formatUtcOffset(offsetMin),
    offsetMinutes: offsetMin,
    abbreviation: getAbbreviation(timezone, now),
    isDst: isDstActive(timezone, now),
  };
}

/**
 * Calculate the time difference between two timezones.
 *
 * @param tz1 - Source IANA timezone.
 * @param tz2 - Target IANA timezone.
 * @returns TimeDifferenceInfo with offset difference and description.
 *
 * @example
 * ```ts
 * const diff = getTimeDifference("America/New_York", "Asia/Seoul");
 * console.log(diff.offsetDiff);    // 14
 * console.log(diff.description);   // "+14h"
 * ```
 */
export function getTimeDifference(
  tz1: string,
  tz2: string,
): TimeDifferenceInfo {
  const now = new Date();
  const offset1 = getOffsetMinutes(tz1, now);
  const offset2 = getOffsetMinutes(tz2, now);

  const diffMinutes = offset2 - offset1;
  const diffHours = diffMinutes / 60;

  const description =
    diffHours === Math.trunc(diffHours)
      ? `${diffHours >= 0 ? "+" : ""}${Math.trunc(diffHours)}h`
      : `${diffHours >= 0 ? "+" : ""}${diffHours.toFixed(1)}h`;

  return {
    timezone1: tz1,
    timezone2: tz2,
    offsetDiff: diffHours,
    offsetDiffMinutes: diffMinutes,
    description,
  };
}

/**
 * Convert a time string from one timezone to another.
 *
 * @param timeStr - Time in "HH:MM" or ISO 8601 format.
 * @param fromTz  - Source IANA timezone.
 * @param toTz    - Target IANA timezone.
 * @returns Converted time as "HH:MM" string in the target timezone.
 *
 * @example
 * ```ts
 * convertTime("09:00", "America/New_York", "Asia/Seoul");
 * // "23:00" (EST+14 = next day)
 * ```
 */
export function convertTime(
  timeStr: string,
  fromTz: string,
  toTz: string,
): string {
  const now = new Date();
  const fromOffset = getOffsetMinutes(fromTz, now);
  const toOffset = getOffsetMinutes(toTz, now);
  const diffMinutes = toOffset - fromOffset;

  // Parse HH:MM
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: "${timeStr}". Expected "HH:MM".`);
  }
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const totalMinutes = hour * 60 + minute + diffMinutes;
  // Normalize to 0..1439
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Generate a 24-hour comparison table between two timezones.
 *
 * @param tz1   - Source IANA timezone.
 * @param tz2   - Target IANA timezone.
 * @param hours - Number of hours to generate (default 24).
 * @returns Array of HourlyRow with formatted hour pairs.
 *
 * @example
 * ```ts
 * const rows = getHourlyComparison("America/New_York", "Asia/Seoul");
 * // rows[0] => { hour1: "00:00", hour2: "14:00" }
 * ```
 */
export function getHourlyComparison(
  tz1: string,
  tz2: string,
  hours: number = 24,
): HourlyRow[] {
  const diff = getTimeDifference(tz1, tz2);
  const diffMinutes = diff.offsetDiffMinutes;

  const rows: HourlyRow[] = [];
  for (let h = 0; h < hours; h++) {
    const totalMinutes = h * 60 + diffMinutes;
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const toH = Math.floor(normalized / 60);
    const toM = normalized % 60;

    rows.push({
      hour1: `${String(h).padStart(2, "0")}:00`,
      hour2: `${String(toH).padStart(2, "0")}:${String(toM).padStart(2, "0")}`,
    });
  }
  return rows;
}

/**
 * Find overlapping business hours across multiple timezones.
 *
 * Business hours are defined as 09:00--17:00 local time by default.
 * Returns the UTC hours where all timezones are within their business
 * window simultaneously.
 *
 * @param timezones  - Array of IANA timezone identifiers.
 * @param startHour  - Business day start (default 9).
 * @param endHour    - Business day end (default 17).
 * @returns OverlapResult with the overlap window and count.
 *
 * @example
 * ```ts
 * const result = getBusinessHoursOverlap([
 *   "America/New_York",
 *   "Europe/London",
 *   "Asia/Seoul",
 * ]);
 * console.log(result.hasOverlap);    // false (no 3-way overlap)
 * console.log(result.overlapHours);  // 0
 * ```
 */
export function getBusinessHoursOverlap(
  timezones: string[],
  startHour: number = 9,
  endHour: number = 17,
): OverlapResult {
  if (timezones.length === 0) {
    return {
      timezones: [],
      overlapStart: "",
      overlapEnd: "",
      overlapHours: 0,
      hasOverlap: false,
    };
  }

  const now = new Date();
  const offsets = timezones.map((tz) => getOffsetMinutes(tz, now));

  const overlapUtcHours: number[] = [];
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    let allInBusiness = true;
    for (const offsetMin of offsets) {
      const localMinutes = utcHour * 60 + offsetMin;
      const normalizedMinutes = ((localMinutes % 1440) + 1440) % 1440;
      const localHour = normalizedMinutes / 60;
      if (localHour < startHour || localHour >= endHour) {
        allInBusiness = false;
        break;
      }
    }
    if (allInBusiness) {
      overlapUtcHours.push(utcHour);
    }
  }

  const hasOverlap = overlapUtcHours.length > 0;
  const overlapStart = hasOverlap
    ? `${String(overlapUtcHours[0]).padStart(2, "0")}:00`
    : "";
  const overlapEnd = hasOverlap
    ? `${String((overlapUtcHours[overlapUtcHours.length - 1] + 1) % 24).padStart(2, "0")}:00`
    : "";

  return {
    timezones,
    overlapStart,
    overlapEnd,
    overlapHours: overlapUtcHours.length,
    hasOverlap,
  };
}
