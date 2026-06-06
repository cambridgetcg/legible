// github/scan-repo.ts — shallow-clone a repo at a SHA and scan it.
//
// MVP approach: clone to a temp dir with the installation token, checkout the
// PR head, run the deterministic audit, hand back the report + dir for the
// caller to clean up. (A future optimization reads the git tree via the API to
// skip the clone, but clone reuses the engine verbatim and is fine at MVP scale.)

import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runClarityAudit } from '../core/audit.js'
import type { ClarityAuditReport } from '../core/types.js'

export interface ScanResult {
  report: ClarityAuditReport
  /** temp dir the caller must rm -rf when done (it also holds .legible-baseline.json). */
  dir: string
}

export function cloneAndScan(cloneUrl: string, sha: string, token: string): ScanResult {
  const dir = mkdtempSync(join(tmpdir(), 'legible-'))
  const authUrl = cloneUrl.replace('https://', `https://x-access-token:${token}@`)
  // Shallow but deep enough to checkout a recent PR head.
  execFileSync('git', ['clone', '--quiet', '--depth', '50', authUrl, dir], { stdio: 'ignore' })
  execFileSync('git', ['-C', dir, 'checkout', '--quiet', sha], { stdio: 'ignore' })
  const report = runClarityAudit({ root: dir })
  return { report, dir }
}
