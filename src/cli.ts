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
const root = args.find((a) => !a.startsWith('--')) ?? process.cwd()
const topN = Number(opt('--top', '20'))
const baselinePath = join(root, '.legible-baseline.json')
const fingerprint = (f: ClarityFinding) => `${f.signal}|${f.file}|${f.fragment}`

const report = runClarityAudit({ root, topN: Number.MAX_SAFE_INTEGER })
const score = clarityScore(report)
const all = [...report.autoFixable, ...report.judgment, ...report.surfaceOnly]

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
out.push('')
process.stdout.write(out.join('\n'))
process.stdout.write('\n')
