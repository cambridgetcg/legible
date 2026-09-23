// github/handler.ts — orchestrate one pull_request event into a Check Run.
//
// auth → open check → clone+scan → baseline diff → complete check.
// Runs async after the webhook 200s, so GitHub isn't kept waiting on a scan.

import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { loadBaselineSet, splitFresh } from '../baseline.js'
import { getInstallationToken } from './auth.js'
import { completeCheckRun, createCheckRun } from './checks.js'
import { buildCheckRun } from './report.js'
import { cloneAndScan } from './scan-repo.js'

export interface AppEnv {
  appId: string
  privateKey: string
  webhookSecret: string
}

/** Minimal shape of the pull_request webhook payload we read. */
export interface PullRequestEvent {
  action: string
  installation: { id: number }
  repository: { full_name: string; clone_url: string }
  pull_request: { head: { sha: string } }
}

export async function handlePullRequest(event: PullRequestEvent, env: AppEnv): Promise<void> {
  const token = await getInstallationToken(env.appId, env.privateKey, event.installation.id)
  const [owner, repo] = event.repository.full_name.split('/') as [string, string]
  const sha = event.pull_request.head.sha

  const checkRunId = await createCheckRun(token, owner, repo, sha)
  let dir: string | undefined
  try {
    const { report, dir: cloned } = cloneAndScan(event.repository.clone_url, sha, token)
    dir = cloned
    const all = [...report.autoFixable, ...report.judgment, ...report.surfaceOnly]
    const known = loadBaselineSet(join(dir, '.legible-baseline.json'))
    const fresh = splitFresh(all, known)
    await completeCheckRun(token, owner, repo, checkRunId, buildCheckRun(all.length, fresh))
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
}
