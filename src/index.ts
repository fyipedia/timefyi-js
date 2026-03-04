/**
 * timefyi -- Pure TypeScript timezone engine for developers.
 *
 * Look up current time in any IANA timezone, calculate differences between
 * zones, convert times, generate 24-hour comparison tables, and find
 * overlapping business hours. Uses built-in {@link Intl.DateTimeFormat}
 * for all timezone operations.
 *
 * Zero dependencies. Works in Node.js, Deno, Bun, and browsers.
 *
 * @example
 * ```ts
 * import { getCurrentTime, getTimeDifference, convertTime } from "timefyi";
 *
 * const seoul = getCurrentTime("Asia/Seoul");
 * console.log(seoul.utcOffset);  // "+09:00"
 *
 * const diff = getTimeDifference("America/New_York", "Asia/Seoul");
 * console.log(diff.description);  // "+14h"
 *
 * const converted = convertTime("09:00", "America/New_York", "Asia/Seoul");
 * console.log(converted);  // "23:00"
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  CityTimeInfo,
  TimeDifferenceInfo,
  HourlyRow,
  OverlapResult,
} from "./types.js";

// Engine -- timezone operations
export {
  formatUtcOffset,
  getCurrentTime,
  getTimeDifference,
  convertTime,
  getHourlyComparison,
  getBusinessHoursOverlap,
} from "./engine.js";
