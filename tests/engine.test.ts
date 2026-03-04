import { describe, it, expect } from "vitest";
import {
  formatUtcOffset,
  getCurrentTime,
  getTimeDifference,
  convertTime,
  getHourlyComparison,
  getBusinessHoursOverlap,
} from "../src/index.js";

// ── formatUtcOffset ─────────────────────────────────────────────

describe("formatUtcOffset", () => {
  it("formats positive whole-hour offset", () => {
    expect(formatUtcOffset(540)).toBe("+09:00");
  });

  it("formats negative whole-hour offset", () => {
    expect(formatUtcOffset(-300)).toBe("-05:00");
  });

  it("formats half-hour offset", () => {
    expect(formatUtcOffset(330)).toBe("+05:30");
  });

  it("formats zero offset", () => {
    expect(formatUtcOffset(0)).toBe("+00:00");
  });

  it("formats 45-minute offset", () => {
    expect(formatUtcOffset(345)).toBe("+05:45");
  });

  it("formats negative half-hour offset", () => {
    expect(formatUtcOffset(-210)).toBe("-03:30");
  });
});

// ── getCurrentTime ──────────────────────────────────────────────

describe("getCurrentTime", () => {
  it("returns valid CityTimeInfo for Asia/Seoul", () => {
    const info = getCurrentTime("Asia/Seoul");
    expect(info.timezone).toBe("Asia/Seoul");
    expect(info.utcOffset).toBe("+09:00");
    expect(info.offsetMinutes).toBe(540);
    // Node.js ICU data may return "KST" or "GMT+9" depending on build
    expect(["KST", "GMT+9"]).toContain(info.abbreviation);
    expect(info.isDst).toBe(false);
    expect(info.currentTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it("returns valid CityTimeInfo for UTC", () => {
    const info = getCurrentTime("UTC");
    expect(info.utcOffset).toBe("+00:00");
    expect(info.offsetMinutes).toBe(0);
    expect(info.abbreviation).toBe("UTC");
    expect(info.isDst).toBe(false);
  });

  it("returns valid info for America/New_York", () => {
    const info = getCurrentTime("America/New_York");
    expect(info.timezone).toBe("America/New_York");
    // EST = -05:00, EDT = -04:00
    expect(["-05:00", "-04:00"]).toContain(info.utcOffset);
    expect(["EST", "EDT"]).toContain(info.abbreviation);
    expect(typeof info.isDst).toBe("boolean");
  });

  it("handles Asia/Kolkata (+05:30 half-hour offset)", () => {
    const info = getCurrentTime("Asia/Kolkata");
    expect(info.utcOffset).toBe("+05:30");
    expect(info.offsetMinutes).toBe(330);
  });

  it("handles Asia/Kathmandu (+05:45)", () => {
    const info = getCurrentTime("Asia/Kathmandu");
    expect(info.utcOffset).toBe("+05:45");
    expect(info.offsetMinutes).toBe(345);
  });

  it("handles Pacific/Auckland", () => {
    const info = getCurrentTime("Pacific/Auckland");
    // NZST = +12:00, NZDT = +13:00
    expect(["+12:00", "+13:00"]).toContain(info.utcOffset);
  });
});

// ── getTimeDifference ───────────────────────────────────────────

describe("getTimeDifference", () => {
  it("calculates difference between same timezone as 0", () => {
    const diff = getTimeDifference("Asia/Seoul", "Asia/Seoul");
    expect(diff.offsetDiff).toBe(0);
    expect(diff.offsetDiffMinutes).toBe(0);
    expect(diff.description).toBe("+0h");
  });

  it("calculates Seoul to UTC", () => {
    const diff = getTimeDifference("Asia/Seoul", "UTC");
    expect(diff.offsetDiff).toBe(-9);
    expect(diff.offsetDiffMinutes).toBe(-540);
    expect(diff.description).toBe("-9h");
  });

  it("calculates UTC to Seoul", () => {
    const diff = getTimeDifference("UTC", "Asia/Seoul");
    expect(diff.offsetDiff).toBe(9);
    expect(diff.offsetDiffMinutes).toBe(540);
    expect(diff.description).toBe("+9h");
  });

  it("handles half-hour timezones", () => {
    const diff = getTimeDifference("UTC", "Asia/Kolkata");
    expect(diff.offsetDiff).toBe(5.5);
    expect(diff.offsetDiffMinutes).toBe(330);
    expect(diff.description).toBe("+5.5h");
  });

  it("returns correct types", () => {
    const diff = getTimeDifference("America/Los_Angeles", "Europe/London");
    expect(diff.timezone1).toBe("America/Los_Angeles");
    expect(diff.timezone2).toBe("Europe/London");
    expect(typeof diff.offsetDiff).toBe("number");
    expect(typeof diff.offsetDiffMinutes).toBe("number");
    expect(typeof diff.description).toBe("string");
  });
});

// ── convertTime ─────────────────────────────────────────────────

describe("convertTime", () => {
  it("converts time between timezones with whole-hour difference", () => {
    // UTC to Seoul (+9)
    const result = convertTime("09:00", "UTC", "Asia/Seoul");
    expect(result).toBe("18:00");
  });

  it("converts time that wraps past midnight", () => {
    // Seoul 23:00 to UTC (-9) = 14:00
    const result = convertTime("23:00", "Asia/Seoul", "UTC");
    expect(result).toBe("14:00");
  });

  it("converts time that wraps before midnight", () => {
    // UTC 02:00 to New York (EST -5) = 21:00 (previous day)
    // Note: We only return HH:MM without date info
    const result = convertTime("02:00", "UTC", "America/New_York");
    // EST: -5 => 02:00 - 5 = -3 => 21:00
    // EDT: -4 => 02:00 - 4 = -2 => 22:00
    expect(["21:00", "22:00"]).toContain(result);
  });

  it("handles midnight conversion", () => {
    const result = convertTime("00:00", "UTC", "Asia/Seoul");
    expect(result).toBe("09:00");
  });

  it("handles half-hour timezone", () => {
    const result = convertTime("00:00", "UTC", "Asia/Kolkata");
    expect(result).toBe("05:30");
  });

  it("preserves minutes in input", () => {
    const result = convertTime("10:30", "UTC", "Asia/Seoul");
    expect(result).toBe("19:30");
  });

  it("throws on invalid format", () => {
    expect(() => convertTime("invalid", "UTC", "Asia/Seoul")).toThrow(
      'Invalid time format',
    );
  });

  it("throws on missing minutes", () => {
    expect(() => convertTime("9", "UTC", "Asia/Seoul")).toThrow(
      'Invalid time format',
    );
  });
});

// ── getHourlyComparison ─────────────────────────────────────────

describe("getHourlyComparison", () => {
  it("returns 24 rows by default", () => {
    const rows = getHourlyComparison("UTC", "Asia/Seoul");
    expect(rows).toHaveLength(24);
  });

  it("starts with 00:00 in timezone 1", () => {
    const rows = getHourlyComparison("UTC", "Asia/Seoul");
    expect(rows[0].hour1).toBe("00:00");
  });

  it("shows correct offset for UTC -> Seoul (+9)", () => {
    const rows = getHourlyComparison("UTC", "Asia/Seoul");
    expect(rows[0].hour2).toBe("09:00");
    expect(rows[15].hour1).toBe("15:00");
    expect(rows[15].hour2).toBe("00:00"); // 15+9 = 24 => 00:00
  });

  it("wraps around at 24 hours", () => {
    const rows = getHourlyComparison("UTC", "Asia/Seoul");
    // 20:00 UTC = 05:00 KST (next day)
    expect(rows[20].hour2).toBe("05:00");
  });

  it("respects custom hours parameter", () => {
    const rows = getHourlyComparison("UTC", "Asia/Seoul", 12);
    expect(rows).toHaveLength(12);
  });

  it("handles same timezone", () => {
    const rows = getHourlyComparison("UTC", "UTC");
    expect(rows[0].hour1).toBe("00:00");
    expect(rows[0].hour2).toBe("00:00");
    expect(rows[12].hour1).toBe("12:00");
    expect(rows[12].hour2).toBe("12:00");
  });

  it("handles half-hour offsets", () => {
    const rows = getHourlyComparison("UTC", "Asia/Kolkata");
    expect(rows[0].hour2).toBe("05:30");
    expect(rows[1].hour2).toBe("06:30");
  });

  it("all rows have HH:MM format", () => {
    const rows = getHourlyComparison("America/New_York", "Europe/London");
    for (const row of rows) {
      expect(row.hour1).toMatch(/^\d{2}:\d{2}$/);
      expect(row.hour2).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});

// ── getBusinessHoursOverlap ─────────────────────────────────────

describe("getBusinessHoursOverlap", () => {
  it("returns no overlap for empty input", () => {
    const result = getBusinessHoursOverlap([]);
    expect(result.hasOverlap).toBe(false);
    expect(result.overlapHours).toBe(0);
    expect(result.overlapStart).toBe("");
    expect(result.overlapEnd).toBe("");
  });

  it("returns 8 hours for single timezone", () => {
    const result = getBusinessHoursOverlap(["UTC"]);
    expect(result.hasOverlap).toBe(true);
    expect(result.overlapHours).toBe(8);
    expect(result.overlapStart).toBe("09:00");
    expect(result.overlapEnd).toBe("17:00");
  });

  it("returns same timezone overlap", () => {
    const result = getBusinessHoursOverlap(["UTC", "UTC"]);
    expect(result.hasOverlap).toBe(true);
    expect(result.overlapHours).toBe(8);
  });

  it("finds overlap for nearby timezones", () => {
    // New York (EST -5) and London (GMT +0): 5h difference
    // NY 9-17 = UTC 14-22; London 9-17 = UTC 9-17
    // Overlap: UTC 14-17 = 3 hours
    const result = getBusinessHoursOverlap([
      "America/New_York",
      "Europe/London",
    ]);
    expect(result.hasOverlap).toBe(true);
    // During EST: 3 hours overlap; during EDT: 4 hours
    expect(result.overlapHours).toBeGreaterThanOrEqual(3);
    expect(result.overlapHours).toBeLessThanOrEqual(4);
  });

  it("finds no overlap for very distant timezones", () => {
    // New York (EST -5) and Seoul (KST +9): 14h difference
    // NY 9-17 = UTC 14-22; Seoul 9-17 = UTC 0-8
    // No overlap
    const result = getBusinessHoursOverlap([
      "America/New_York",
      "Asia/Seoul",
    ]);
    // During EST: no overlap; during EDT: possible 1h overlap
    expect(result.overlapHours).toBeLessThanOrEqual(1);
  });

  it("supports custom business hours", () => {
    const result = getBusinessHoursOverlap(["UTC"], 8, 20);
    expect(result.overlapHours).toBe(12);
  });

  it("returns correct timezones array", () => {
    const tzs = ["America/New_York", "Europe/London"];
    const result = getBusinessHoursOverlap(tzs);
    expect(result.timezones).toEqual(tzs);
  });

  it("overlapStart and overlapEnd are HH:00 format", () => {
    const result = getBusinessHoursOverlap(["UTC"]);
    expect(result.overlapStart).toMatch(/^\d{2}:00$/);
    expect(result.overlapEnd).toMatch(/^\d{2}:00$/);
  });
});
