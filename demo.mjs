import { getCurrentTime, getTimeDifference, getBusinessHoursOverlap } from './dist/index.js'

const C = { r: '\x1b[0m', b: '\x1b[1m', d: '\x1b[2m', y: '\x1b[33m', g: '\x1b[32m', c: '\x1b[36m' }

// 1. Current time
const ny = getCurrentTime('America/New_York')
console.log(`${C.b}${C.y}New York ${C.d}(${ny.abbreviation})${C.r}`)
console.log(`  ${C.c}Time ${C.r} ${C.b}${C.g}${ny.currentTime}${C.r}`)
console.log(`  ${C.c}UTC  ${C.r} ${C.g}${ny.utcOffset}${C.r}`)
console.log(`  ${C.c}DST  ${C.r} ${ny.isDst ? `${C.g}Yes` : `${C.d}No`}${C.r}`)

console.log()

// 2. Time difference
const diff = getTimeDifference('America/New_York', 'Asia/Tokyo')
console.log(`${C.b}${C.y}New York → Tokyo${C.r}`)
console.log(`  ${C.c}Difference${C.r} ${C.g}${diff.description}${C.r}`)
console.log(`  ${C.c}Minutes   ${C.r} ${C.g}${diff.offsetDiffMinutes}${C.r}`)

console.log()

// 3. Business hours overlap
const overlap = getBusinessHoursOverlap(['America/New_York', 'Europe/London'])
console.log(`${C.b}${C.y}Business Hours: NY + London${C.r}`)
console.log(`  ${C.c}Overlap${C.r} ${overlap.hasOverlap ? `${C.g}Yes` : `${C.d}No`}${C.r}`)
console.log(`  ${C.c}Window ${C.r} ${C.g}${overlap.overlapStart} – ${overlap.overlapEnd} UTC${C.r}`)
console.log(`  ${C.c}Hours  ${C.r} ${C.g}${overlap.overlapHours}h${C.r}`)
