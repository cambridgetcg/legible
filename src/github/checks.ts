// github/checks.ts — create + complete a Check Run via the REST API.
//
// The Check Run is how the observations show up on a PR: an in-progress run
// created on receipt, completed with the summary, and inline
// annotations once the scan finishes.

import type { CheckRunPayload } from './report.js'

const API = 'https://api.github.com'
const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'legible',
  'Content-Type': 'application/json',
})

/** Open an in-progress Check Run; returns its id. */
export async function createCheckRun(token: string, owner: string, repo: string, headSha: string): Promise<number> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/check-runs`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name: 'Legible — clarity', head_sha: headSha, status: 'in_progress' }),
  })
  if (!res.ok) throw new Error(`create check-run failed: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { id: number }).id
}

/** Complete the Check Run with the summary, and annotations. */
export async function completeCheckRun(
  token: string,
  owner: string,
  repo: string,
  checkRunId: number,
  payload: CheckRunPayload,
): Promise<void> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/check-runs/${checkRunId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ status: 'completed', conclusion: payload.conclusion, output: payload.output }),
  })
  if (!res.ok) throw new Error(`complete check-run failed: ${res.status} ${await res.text()}`)
}
