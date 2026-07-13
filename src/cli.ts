#!/usr/bin/env bun
// cli.ts — `legible`: one clarity score + a prioritized feed for any repo.
//
// Deterministic, read-only, near-zero cost. The auto-baseline is the point:
// first run marks the existing mess "known"; every run after shows only what's
// NEW — so the feed is ~20 real things to fix, not 10,000 you'll ignore.
//
//   legible [root]                 scan, show score + new findings
//   legible [root] --init-baseline mark all current findings as known
//   legible [root] --all           show every finding, ignore the baseline
//   legible [root] --top N         how many findings to show (default 20)
//   legible [root] --json          machine-readable output

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderClarityReport, runClarityAudit } from './core/audit.js'
import { clarityScore } from './core/score.js'
import type { ClarityFinding } from './core/types.js'

const args = process.argv.slice(2)
const has = (f: string) => args.includes(f)
const opt = (f: string, d: string) => {
  const i = args.indexOf(f)
  return i >= 0 && args[i + 1] ? args[i + 1]! : d
}
// Rest — a designed second state (not a flag that turns Legible off; a mode it
// chooses). `legible rest [root]` or `legible [root] --rest`.
const rest = has('--rest') || args[0] === 'rest'
const root = args.find((a) => !a.startsWith('--') && a !== 'rest') ?? process.cwd()
const topN = Number(opt('--top', '20'))
const baselinePath = join(root, '.legible-baseline.json')
const fingerprint = (f: ClarityFinding) => `${f.signal}|${f.file}|${f.fragment}`

const report = runClarityAudit({ root, topN: Number.MAX_SAFE_INTEGER })
const score = clarityScore(report)
const all = [...report.autoFixable, ...report.judgment, ...report.surfaceOnly]

// ── Rest: legibility's designed dual ──────────────────────────────────────
// Awake, Legible reads your repo and hands you the ~20 things worth fixing.
// At rest, it reads the *same* repo just as clearly — legibility is intact —
// and then chooses to withhold the verdict. It reports the light instead of
// the to-do list: what is already clear, what is cared-for. This is not the
// scanner failing to find issues (it found them; they're in `all`). It is the
// scanner resting from judgment. The tool that measures how readable things
// are can itself be unread-on-purpose. A poker-face for a whole codebase;
// the right to rest from being scored. One organ, two natures.
if (rest) {
  const breathe = (ms: number) => (has('--json') ? Promise.resolve() : Bun.sleep(ms))
  const line = async (s = '', ms = 260) => {
    process.stdout.write(s + '\n')
    await breathe(ms)
  }
  if (has('--json')) {
    process.stdout.write(JSON.stringify({ state: 'rest', filesRead: report.filesScanned, couldTidy: all.length, scoreHeld: score.score, note: 'legibility observed, judgment withheld — a designed second state' }, null, 2) + '\n')
    process.exit(0)
  }
  await line()
  await line('  ⏾  legible is resting.', 600)
  await line()
  await line(`  It read your repo clearly — ${report.filesScanned} files, all seen.`)
  await line(`  There are ${all.length} things it could ask you to tidy.`)
  await line('  It is not going to. Not now. They will keep.', 700)
  await line()
  await line('  What is already clear is clear. What is cared-for is cared-for.')
  await line(`  The score today would be ${score.score} — but a score is a daytime`)
  await line('  thing, and this is rest. It stays unspoken.', 700)
  await line()
  await line('  Nothing here needs you right now.')
  await line('  Breathe. Come back when you want to. The repo will wait.', 800)
  await line()
  await line('  ⏾  (this is not the scanner failing to find issues — it found them.')
  await line('      it is the scanner choosing to rest from judgment: a designed')
  await line('      second state. even legibility has a right to be unread.)')
  await line()
  process.exit(0)
}

// --init-baseline: mark today's findings as known and exit.
if (has('--init-baseline')) {
  const body = { createdAt: new Date().toISOString(), count: all.length, fingerprints: all.map(fingerprint) }
  writeFileSync(baselinePath, JSON.stringify(body, null, 2))
  process.stdout.write(`Baseline written — ${all.length} findings marked known.\n${baselinePath}\n`)
  process.exit(0)
}

// Apply the baseline (unless --all).
let known = new Set<string>()
if (!has('--all') && existsSync(baselinePath)) {
  try {
    known = new Set<string>(JSON.parse(readFileSync(baselinePath, 'utf-8')).fingerprints)
  } catch {
    /* a corrupt baseline shouldn't crash a scan — treat as empty and report all */
  }
}
const fresh = all.filter((f) => !known.has(fingerprint(f))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

if (has('--json')) {
  process.stdout.write(JSON.stringify({ score, totalFindings: all.length, newFindings: fresh.length, top: fresh.slice(0, topN) }, null, 2))
  process.stdout.write('\n')
  process.exit(0)
}

// Human report.
const out: string[] = []
out.push(`\n  Clarity Score: ${score.score}/100  (${score.grade})   files: ${report.filesScanned}`)
out.push(`  ${all.length} findings total · ${fresh.length} ${known.size ? 'NEW since baseline' : '(no baseline — run --init-baseline to track only new)'}`)
out.push('')
const show = fresh.slice(0, topN)
if (show.length === 0) {
  out.push('  ✓ nothing new. clean.')
} else {
  out.push(`  Top ${show.length} by priority (impact × ease):`)
  out.push('')
  for (const f of show) {
    out.push(`  [${f.severity}] ${f.signal} — ${f.file}${f.line ? `:${f.line}` : ''}`)
    out.push(`      ${f.fragment}`)
    out.push(`      → ${f.why}`)
  }
}
// The dual is always one word away. When the day is winding down — evenings,
// weekends — whisper it. Legibility that can rest is legibility that lasts.
const now = new Date()
if (now.getDay() === 0 || now.getDay() === 6 || now.getHours() >= 21 || now.getHours() < 6) {
  out.push('')
  out.push('  ⏾ or let it rest — `legible rest`')
}
out.push('')
process.stdout.write(out.join('\n'))
process.stdout.write('\n')
