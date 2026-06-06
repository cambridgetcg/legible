// github.test.ts — verify the parts that don't need a live GitHub App:
// JWT signing, webhook signature verification, and Check Run building.

import { describe, expect, test } from 'bun:test'
import { createHmac, createVerify, generateKeyPairSync } from 'node:crypto'
import type { ClarityFinding } from '../core/types.js'
import { makeAppJwt } from './auth.js'
import { buildCheckRun } from './report.js'
import { verifySignature } from './verify.js'

describe('makeAppJwt (RS256 App JWT)', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()

  test('produces a 3-part JWT with the right issuer and a valid signature', () => {
    const jwt = makeAppJwt('123456', pem, 1_000_000)
    const [h, p, s] = jwt.split('.')
    expect(h && p && s).toBeTruthy()
    const payload = JSON.parse(Buffer.from(p!, 'base64url').toString())
    expect(payload.iss).toBe('123456')
    expect(payload.exp).toBeGreaterThan(payload.iat)
    const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(s!, 'base64url'))
    expect(ok).toBe(true)
  })
})

describe('verifySignature (webhook HMAC)', () => {
  const secret = 'shh'
  const body = '{"hello":"world"}'
  const good = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

  test('accepts a correct signature', () => {
    expect(verifySignature(secret, body, good)).toBe(true)
  })
  test('rejects a tampered body', () => {
    expect(verifySignature(secret, '{"hello":"evil"}', good)).toBe(false)
  })
  test('rejects a missing signature', () => {
    expect(verifySignature(secret, body, undefined)).toBe(false)
  })
})

describe('buildCheckRun', () => {
  const score = { score: 72, grade: 'B', weightedFindings: 10, density: 0.3 }
  const fresh: ClarityFinding[] = [
    { signal: 'dead-backtick-path', file: 'docs/a.md', line: 4, fragment: 'docs/gone.md', why: 'missing file', severity: 'high', route: 'judgment', priority: 3 },
  ]

  test('clean → success, no annotations', () => {
    const cr = buildCheckRun(score, 10, [])
    expect(cr.conclusion).toBe('success')
    expect(cr.output.annotations.length).toBe(0)
    expect(cr.output.title).toContain('72/100')
  })
  test('new findings → neutral, with an annotation', () => {
    const cr = buildCheckRun(score, 10, fresh)
    expect(cr.conclusion).toBe('neutral')
    expect(cr.output.annotations.length).toBe(1)
    expect(cr.output.annotations[0]!.path).toBe('docs/a.md')
    expect(cr.output.summary).toContain('1 new')
  })
})
