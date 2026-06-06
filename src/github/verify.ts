// github/verify.ts — verify the webhook came from GitHub (HMAC-SHA256).
//
// GitHub signs each webhook body with the shared secret. We recompute and
// compare in constant time. A bad/absent signature is rejected — the server
// must never act on an unverified payload.

import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifySignature(secret: string, rawBody: string, signatureHeader: string | null | undefined): boolean {
  if (!signatureHeader) return false
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && timingSafeEqual(a, b)
}
