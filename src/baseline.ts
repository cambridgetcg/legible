// baseline.ts — the auto-baseline: only surface what's NEW.
//
// A repo commits a .legible-baseline.json (a list of finding fingerprints).
// Everything in it is "known mess"; the feed shows only findings not in it.
// This is what keeps the first report to ~20 real items instead of 10,000.

import { existsSync, readFileSync } from 'node:fs'
import type { ClarityFinding } from './core/types.js'

export const fingerprint = (f: ClarityFinding): string => `${f.signal}|${f.file}|${f.fragment}`

export function loadBaselineSet(path: string): Set<string> {
  if (!existsSync(path)) return new Set()
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8')) as { fingerprints?: string[] }
    return new Set(data.fingerprints ?? [])
  } catch {
    // A corrupt baseline must not crash a scan — treat as empty.
    return new Set()
  }
}

export function splitFresh(all: ClarityFinding[], known: Set<string>): ClarityFinding[] {
  return all.filter((f) => !known.has(fingerprint(f)))
}
