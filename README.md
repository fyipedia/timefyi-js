# timefyi

[![npm](https://img.shields.io/npm/v/timefyi)](https://www.npmjs.com/package/timefyi)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/timefyi)

Pure TypeScript timezone engine for developers. Look up [current time](https://timefyi.com/) in any IANA timezone, calculate [time differences](https://timefyi.com/) between zones, convert times, generate [24-hour comparison tables](https://timefyi.com/), and find overlapping [business hours](https://timefyi.com/) -- all with zero dependencies.

> **Try the interactive tools at [timefyi.com](https://timefyi.com/)** -- world clock, timezone converter, and business hours overlap finder.

<p align="center">
  <img src="demo.gif" alt="timefyi demo — timezone conversion and business hours overlap" width="800">
</p>

## Install

```bash
npm install timefyi
```

Works in Node.js, Deno, Bun, and browsers (ESM).

## Quick Start

```typescript
import { getCurrentTime, getTimeDifference, convertTime, formatUtcOffset } from "timefyi";

// Current time in any IANA timezone
const seoul = getCurrentTime("Asia/Seoul");
console.log(seoul.utcOffset);      // "+09:00"
console.log(seoul.abbreviation);   // "KST"
console.log(seoul.isDst);          // false
console.log(seoul.currentTime);    // "2026-03-04T14:30:00"

// Time difference between two cities
const diff = getTimeDifference("America/New_York", "Asia/Seoul");
console.log(diff.offsetDiff);      // 14
console.log(diff.description);     // "+14h"

// Convert a specific time between timezones
const converted = convertTime("09:00", "America/New_York", "Asia/Seoul");
console.log(converted);            // "23:00"

// Format UTC offset from minutes
console.log(formatUtcOffset(540));   // "+09:00"
console.log(formatUtcOffset(-300));  // "-05:00"
console.log(formatUtcOffset(330));   // "+05:30"
```

## How Timezone Conversion Works

This engine uses the `Intl.DateTimeFormat` API built into JavaScript runtimes (V8, SpiderMonkey, JSC). No timezone database is bundled -- it uses the ICU data already present in your runtime.

This approach has several advantages:

- **Always up to date**: Timezone rules change frequently (governments adjust DST, create new zones). Your runtime's ICU data is updated with the OS, so conversions stay correct without package updates.
- **Zero bundle size**: No timezone database shipped. The IANA timezone database is ~300KB compressed; this package adds 0 bytes of timezone data.
- **DST-aware**: Daylight saving time transitions are handled automatically by the runtime. The engine detects DST status by comparing January and July offsets.
- **Half-hour offsets**: Zones like `Asia/Kolkata` (+05:30) and `Asia/Kathmandu` (+05:45) are handled natively.

## Hourly Comparison Table

```typescript
import { getHourlyComparison } from "timefyi";

// Generate a 24-hour comparison between New York and Seoul
const rows = getHourlyComparison("America/New_York", "Asia/Seoul");
console.log(rows[0]);   // { hour1: "00:00", hour2: "14:00" }
console.log(rows[9]);   // { hour1: "09:00", hour2: "23:00" }
console.log(rows.length); // 24
```

## Business Hours Overlap

```typescript
import { getBusinessHoursOverlap } from "timefyi";

// Find overlapping business hours (default 09:00-17:00)
const result = getBusinessHoursOverlap([
  "America/New_York",
  "Europe/London",
]);
console.log(result.hasOverlap);     // true
console.log(result.overlapHours);   // 3
console.log(result.overlapStart);   // "14:00"
console.log(result.overlapEnd);     // "17:00"

// Three-way overlap with custom hours
const threeWay = getBusinessHoursOverlap(
  ["America/New_York", "Europe/London", "Asia/Seoul"],
  9, 17,
);
console.log(threeWay.hasOverlap);   // false (no 3-way overlap)
```

## API Reference

### Time Lookup

| Function | Description |
|----------|-------------|
| `getCurrentTime(timezone) -> CityTimeInfo` | Current time, UTC offset, abbreviation, DST status |
| `formatUtcOffset(offsetMinutes) -> string` | Format minutes as "+HH:MM" / "-HH:MM" |

### Timezone Comparison

| Function | Description |
|----------|-------------|
| `getTimeDifference(tz1, tz2) -> TimeDifferenceInfo` | Offset difference in hours and minutes |
| `convertTime(timeStr, fromTz, toTz) -> string` | Convert "HH:MM" between timezones |
| `getHourlyComparison(tz1, tz2, hours?) -> HourlyRow[]` | 24-hour side-by-side comparison table |

### Business Hours

| Function | Description |
|----------|-------------|
| `getBusinessHoursOverlap(timezones, startHour?, endHour?) -> OverlapResult` | Find overlapping business hours across multiple zones |

## TypeScript Types

```typescript
import type {
  CityTimeInfo,
  TimeDifferenceInfo,
  HourlyRow,
  OverlapResult,
} from "timefyi";
```

## Features

- **Current time lookup**: Any IANA timezone with UTC offset, abbreviation, and DST status
- **Time difference**: Calculate offset between any two timezones (including half-hour zones)
- **Time conversion**: Convert "HH:MM" strings between timezones
- **Hourly comparison**: Generate 24-hour side-by-side tables for scheduling
- **Business hours overlap**: Find meeting windows across multiple timezones
- **DST-aware**: Automatic daylight saving time detection
- **Zero dependencies**: Uses built-in `Intl.DateTimeFormat`, no timezone database bundled
- **Type-safe**: Full TypeScript with strict mode
- **Tree-shakeable**: ESM with named exports
- **Fast**: All computations under 1ms

## Also Available for Python

```bash
pip install timefyi
```

See the [Python package on PyPI](https://pypi.org/project/timefyi/).

## FYIPedia Developer Tools

Part of the [FYIPedia](https://github.com/fyipedia) open-source developer tools ecosystem:

| Package | Description |
|---------|-------------|
| [@fyipedia/colorfyi](https://www.npmjs.com/package/@fyipedia/colorfyi) | Color conversion, WCAG contrast, harmonies -- [colorfyi.com](https://colorfyi.com/) |
| [emojifyi](https://www.npmjs.com/package/emojifyi) | Emoji lookup, search, encoding -- [emojifyi.com](https://emojifyi.com/) |
| [symbolfyi](https://www.npmjs.com/package/symbolfyi) | Symbol encoding, Unicode properties -- [symbolfyi.com](https://symbolfyi.com/) |
| [unicodefyi](https://www.npmjs.com/package/unicodefyi) | Unicode character info, encodings -- [unicodefyi.com](https://unicodefyi.com/) |
| [fontfyi](https://www.npmjs.com/package/fontfyi) | Google Fonts metadata, CSS -- [fontfyi.com](https://fontfyi.com/) |
| [distancefyi](https://www.npmjs.com/package/distancefyi) | Distance, bearing, travel times -- [distancefyi.com](https://distancefyi.com/) |
| **[timefyi](https://www.npmjs.com/package/timefyi)** | **Timezone ops, time differences -- [timefyi.com](https://timefyi.com/)** |
| [namefyi](https://www.npmjs.com/package/namefyi) | Korean romanization, Five Elements -- [namefyi.com](https://namefyi.com/) |
| [unitfyi](https://www.npmjs.com/package/unitfyi) | Unit conversion, 200 units -- [unitfyi.com](https://unitfyi.com/) |
| [holidayfyi](https://www.npmjs.com/package/holidayfyi) | Holiday dates, Easter calculation -- [holidayfyi.com](https://holidayfyi.com/) |

## Links

- [Interactive World Clock](https://timefyi.com/) -- Current time in every timezone
- [Python Package](https://pypi.org/project/timefyi/) -- Same engine, Python version
- [Source Code](https://github.com/fyipedia/timefyi-js) -- MIT licensed

## License

MIT
