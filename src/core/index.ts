// core/index.ts — Legible's engine barrel.
//
// The deterministic clarity engine: build the reference graph (the moat —
// resolves the way real repos actually link, by path-string + import), run the
// signal detectors, rank by impact × ease, score it. No LLM, near-zero cost.

export type {
  ClarityAuditOptions,
  ClarityAuditReport,
  ClarityFinding,
  ClaritySignal,
  ClaritySeverity,
  DocNode,
  ReduceRoute,
  ReferenceGraph,
} from './types.js'

export { DEFAULT_ROUTE, isFixNever, PROTECTED_PATHS } from './config.js'
export {
  buildReferenceGraph,
  buildResolver,
  extractRefs,
  isSkippable,
  resolveRef,
  type RawRef,
  type Resolver,
} from './reference-graph.js'
export {
  detectDeadReferences,
  detectFancyWord,
  detectMarkdownNit,
  detectOrphans,
  detectStrayArtifacts,
  runPerFileDetectors,
} from './detectors.js'
export { renderClarityReport, runClarityAudit } from './audit.js'
export { clarityScore, type ClarityScore } from './score.js'
