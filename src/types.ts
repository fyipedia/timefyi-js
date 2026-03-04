/**
 * TypeScript interfaces for the timefyi timezone engine.
 *
 * All timezone identifiers use IANA format (e.g., "America/New_York",
 * "Asia/Seoul"). UTC offsets are in minutes or formatted as "+09:00".
 */

/** Current time information for a single timezone. */
export interface CityTimeInfo {
  /** IANA timezone identifier (e.g., "Asia/Seoul"). */
  timezone: string;
  /** Current local time as ISO 8601 string. */
  currentTime: string;
  /** UTC offset formatted as "+09:00" or "-05:00". */
  utcOffset: string;
  /** UTC offset in total minutes (e.g., 540 for +09:00). */
  offsetMinutes: number;
  /** Timezone abbreviation (e.g., "KST", "EST"). */
  abbreviation: string;
  /** Whether daylight saving time is currently active. */
  isDst: boolean;
}

/** Time difference between two timezones. */
export interface TimeDifferenceInfo {
  /** Source IANA timezone. */
  timezone1: string;
  /** Target IANA timezone. */
  timezone2: string;
  /** Offset difference in fractional hours (e.g., 14, -5.5). */
  offsetDiff: number;
  /** Offset difference in minutes (e.g., 840, -330). */
  offsetDiffMinutes: number;
  /** Human-readable description (e.g., "+14h" or "-5.5h"). */
  description: string;
}

/** One row in a 24-hour comparison table. */
export interface HourlyRow {
  /** Formatted hour in timezone 1 (e.g., "00:00", "13:00"). */
  hour1: string;
  /** Formatted hour in timezone 2 (e.g., "14:00", "03:00"). */
  hour2: string;
}

/** Result of business hours overlap calculation. */
export interface OverlapResult {
  /** IANA timezone identifiers that were compared. */
  timezones: string[];
  /** Start of overlap window in UTC (e.g., "09:00"). */
  overlapStart: string;
  /** End of overlap window in UTC (e.g., "17:00"). */
  overlapEnd: string;
  /** Number of overlapping hours. */
  overlapHours: number;
  /** Whether any overlap exists. */
  hasOverlap: boolean;
}
