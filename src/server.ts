#!/usr/bin/env bun
// server.ts — the Legible GitHub App webhook server (zero-dependency).
//
// Verifies the webhook signature, responds 202 fast, then scans + posts the
// Check Run asynchronously. Configure via env (see .env.example):
//   APP_ID, WEBHOOK_SECRET, and PRIVATE_KEY or PRIVATE_KEY_PATH, [PORT].

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { handlePullRequest, type AppEnv, type PullRequestEvent } from './github/handler.js'
import { verifySignature } from './github/verify.js'

function loadEnv(): AppEnv & { port: number } {
  const appId = process.env.APP_ID
  const webhookSecret = process.env.WEBHOOK_SECRET
  const privateKey = process.env.PRIVATE_KEY_PATH
    ? readFileSync(process.env.PRIVATE_KEY_PATH, 'utf-8')
    : (process.env.PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  if (!appId || !webhookSecret || !privateKey) {
    throw new Error('Missing env: APP_ID, WEBHOOK_SECRET, and PRIVATE_KEY (or PRIVATE_KEY_PATH) are required.')
  }
  return { appId, webhookSecret, privateKey, port: Number(process.env.PORT ?? 3000) }
}

const env = loadEnv()
const PR_ACTIONS = new Set(['opened', 'synchronize', 'reopened'])

createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(200)
    res.end('legible — clarity for your repo')
    return
  }
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    if (!verifySignature(env.webhookSecret, body, req.headers['x-hub-signature-256'] as string | undefined)) {
      res.writeHead(401)
      res.end('bad signature')
      return
    }
    // Respond immediately; do the scan in the background.
    res.writeHead(202)
    res.end('accepted')
    if (req.headers['x-github-event'] === 'pull_request') {
      const payload = JSON.parse(body) as PullRequestEvent
      if (PR_ACTIONS.has(payload.action)) {
        handlePullRequest(payload, env).catch((err) => console.error('[legible] handler error:', err))
      }
    }
  })
}).listen(env.port, () => console.log(`[legible] webhook server on :${env.port}`))
