// core/config.ts — Legible's default policy (generic, per-repo overridable).
//
// Legible finds what doesn't make sense in a codebase's docs + structure
// (dead links, orphans, stray files, plain-language nits) and reports ONE
// clarity score + a prioritized feed. Deterministic, near-zero cost to run.
//
// Every value here is a default a repo can override via legible.config.json.
// Ported from a dogfooded engine; the reference-graph resolver (same-folder /
// unique-basename / .js→.ts) is the part naive checkers get wrong.

import type { ClaritySignal, ClaritySeverity, ReduceRoute } from './types.js'

// ── ranking: priority = (importance × severity) / effort ─────────
export const SEVERITY_WEIGHT: Record<ClaritySeverity, number> = { high: 3, medium: 2, low: 1 }
export const EFFORT_WEIGHT: Record<ReduceRoute, number> = { auto: 1, judgment: 4, surface: 2 }
export const DEFAULT_TOP_N = 20

// ── protected paths (read but never auto-fix) — user-configured ──
// Default empty: a repo declares what the loop must never touch.
export const PROTECTED_PATHS: string[] = []
export function isFixNever(relPath: string): boolean {
  return PROTECTED_PATHS.some((p) => (p.endsWith('/') ? relPath.startsWith(p) : relPath === p))
}

// ── importance: pure PageRank by default ────────────────────────
// A repo may pin entry docs (README, ARCHITECTURE) to the top; empty default.
export const IMPORTANCE_ANCHORS: string[] = []

// ── orphan exemptions / index files ─────────────────────────────
export const ORPHAN_EXEMPT: string[] = [
  'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'LICENSE.md', 'CODE_OF_CONDUCT.md',
  'SECURITY.md', 'docs/README.md', 'index.md',
]
export const INDEX_BASENAMES: string[] = ['README.md', 'INDEX.md', 'index.md']

// ── stray artifacts (auto-deletable deny list) ──────────────────
export const STRAY_ARTIFACT_NAMES: string[] = ['.DS_Store', 'Thumbs.db', '.dccache', 'undefined']
export const STRAY_ARTIFACT_SUFFIXES: string[] = ['.orig', '~', '.swp', '.bak']

// ── plain-language swaps (generic; coined vocab is user-allowlisted) ──
export const FANCY_WORD_SWAPS: Record<string, string> = {
  utilize: 'use', utilise: 'use', leverage: 'use', commence: 'begin',
  endeavor: 'try', facilitate: 'help', ascertain: 'find out',
  subsequently: 'later', additionally: 'also', furthermore: 'also',
  numerous: 'many', utilization: 'use', prior_to: 'before',
  in_order_to: 'to', aforementioned: 'this',
}
// Default empty — a repo adds its domain/coined vocabulary so swaps never fight it.
export const COINED_VOCAB_ALLOWLIST: string[] = []

// ── default reduce-route per signal (isFixNever overrides → surface) ──
export const DEFAULT_ROUTE: Record<ClaritySignal, ReduceRoute> = {
  'dead-backtick-path': 'judgment',
  'dead-md-link': 'auto',
  'orphan-doc': 'judgment',
  'stray-artifact': 'auto',
  'source-coupling-stale': 'surface',
  'calendar-stale': 'surface',
  'weak-scent': 'surface',
  'fancy-word': 'surface',
  'forbidden-hedge': 'surface',
  'markdown-nit': 'auto',
  'dead-ts-export': 'surface',
  'circular-dep': 'surface',
}

// ── scan scope ───────────────────────────────────────────────────
export const DEFAULT_INCLUDE: string[] = ['.md', '.mdx', '.ts', '.tsx']
export const DEFAULT_EXCLUDE: string[] = [
  'node_modules', '/dist/', '/.git/', '/build/', '/coverage/', '/.next/',
  '/.turbo/', '/vendor/', '/.cache/',
]
