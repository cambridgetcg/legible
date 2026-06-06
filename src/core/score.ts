// core/score.ts — the one number a repo gets.
//
// Score is explainable on purpose: 100 = clean. It falls as the density of
// severity-weighted findings per file rises. 0 findings → 100; one medium
// finding per file → ~33; the curve saturates so a huge repo isn't unfairly
// crushed. No black box — a buyer can see exactly why their score is what it is.

import { SEVERITY_WEIGHT } from './config.js'
import type { ClarityAuditReport } from './types.js'

export interface ClarityScore {
  /** 0–100, higher is clearer. */
  score: number
  /** A..F letter grade for at-a-glance reading. */
  grade: string
  /** Σ severity weights across all findings (high 3 / med 2 / low 1). */
  weightedFindings: number
  /** weightedFindings ÷ files scanned. */
  density: number
}

export function clarityScore(report: ClarityAuditReport): ClarityScore {
  let weighted = 0
  for (const f of [...report.autoFixable, ...report.judgment, ...report.surfaceOnly]) {
    weighted += SEVERITY_WEIGHT[f.severity]
  }
  const density = report.filesScanned > 0 ? weighted / report.filesScanned : 0
  const score = Math.round(100 / (1 + density))
  const grade =
    score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'
  return { score, grade, weightedFindings: weighted, density: Number(density.toFixed(3)) }
}
