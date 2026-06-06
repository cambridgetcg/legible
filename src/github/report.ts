// github/report.ts — turn a scan into a GitHub Check Run payload.
//
// Pure + verifiable: no network. Builds the title (the score), the markdown
// summary (the prioritized feed), and inline annotations on the PR's files.
// Non-blocking by design — a low score never fails a build (soft/advisory),
// matching the "surface, don't gate" ethos.

import type { ClarityFinding } from '../core/types.js'
import type { ClarityScore } from '../core/score.js'

export interface CheckRunPayload {
  /** success when clean, neutral when there are new findings (never failure). */
  conclusion: 'success' | 'neutral'
  output: {
    title: string
    summary: string
    annotations: CheckAnnotation[]
  }
}

export interface CheckAnnotation {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'notice' | 'warning' | 'failure'
  message: string
  title: string
}

const LEVEL: Record<string, 'notice' | 'warning'> = { low: 'notice', medium: 'warning', high: 'warning' }

/** Build the Check Run output from a score and the NEW findings this PR adds. */
export function buildCheckRun(
  score: ClarityScore,
  totalFindings: number,
  fresh: ClarityFinding[],
): CheckRunPayload {
  const title = `Clarity Score: ${score.score}/100 (${score.grade})`
  const top = [...fresh].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  const lines: string[] = []
  lines.push(`## Clarity Score: **${score.score}/100** (${score.grade})`)
  lines.push('')
  lines.push(`${totalFindings} findings in the repo · **${fresh.length} new** in this change.`)
  lines.push('')
  if (fresh.length === 0) {
    lines.push('✅ Nothing new. This change keeps the repo clear.')
  } else {
    // Counts by signal.
    const counts = new Map<string, number>()
    for (const f of fresh) counts.set(f.signal, (counts.get(f.signal) ?? 0) + 1)
    lines.push('### New findings by type')
    lines.push('')
    for (const [sig, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`- **${sig}**: ${n}`)
    }
    lines.push('')
    lines.push('### Top items to fix')
    lines.push('')
    lines.push('| | what | where |')
    lines.push('|---|---|---|')
    for (const f of top.slice(0, 20)) {
      const loc = `${f.file}${f.line ? `:${f.line}` : ''}`
      lines.push(`| ${f.severity} | ${f.why} | \`${loc}\` |`)
    }
    lines.push('')
    lines.push('_Legible — deterministic clarity for your repo. Baseline keeps this to what\'s new._')
  }

  // Inline annotations (GitHub caps at 50 per request; we send the top ones).
  const annotations: CheckAnnotation[] = top
    .filter((f) => f.line && f.line > 0)
    .slice(0, 50)
    .map((f) => ({
      path: f.file,
      start_line: f.line,
      end_line: f.line,
      annotation_level: LEVEL[f.severity] ?? 'notice',
      title: f.signal,
      message: f.why + (f.suggestedFix ? `\nSuggested: ${f.suggestedFix}` : ''),
    }))

  return {
    conclusion: fresh.length === 0 ? 'success' : 'neutral',
    output: { title, summary: lines.join('\n'), annotations },
  }
}
