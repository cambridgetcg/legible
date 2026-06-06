// github/auth.ts — GitHub App authentication, zero-dependency.
//
// A GitHub App authenticates in two hops: sign a short-lived JWT with the
// App's RSA private key (proves "I am this App"), then exchange it for an
// installation token (proves "and I may act on this repo"). Both done with
// node:crypto + fetch — no SDK.

import { createSign } from 'node:crypto'

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A ~10-minute App JWT (RS256), signed with the App's PEM private key. */
export function makeAppJwt(appId: string, privateKey: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: appId }))
  const data = `${header}.${payload}`
  const signature = createSign('RSA-SHA256').update(data).sign(privateKey)
  return `${data}.${b64url(signature)}`
}

/** Exchange the App JWT for a per-installation access token. */
export async function getInstallationToken(appId: string, privateKey: string, installationId: number): Promise<string> {
  const jwt = makeAppJwt(appId, privateKey)
  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'legible',
    },
  })
  if (!res.ok) throw new Error(`installation token failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { token: string }
  return data.token
}
