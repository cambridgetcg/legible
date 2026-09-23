# Legible GitHub App — setup

The App posts **read-only findings, without a score or grade,** as a check on every
pull request. Zero dependencies — runs on `bun`. ~15 minutes to first check.

## 1. Register the App

GitHub → **Settings → Developer settings → GitHub Apps → New GitHub App**.

- **Name:** Legible (or your brand)
- **Homepage URL:** anything for now
- **Webhook → Active:** ✓
- **Webhook URL:** your server's public URL (see step 3 for local dev)
- **Webhook secret:** a long random string → put the same value in `.env` as `WEBHOOK_SECRET`
- **Repository permissions:**
  - **Checks:** Read & write  ← posts observations
  - **Contents:** Read-only   ← clones the repo to scan
  - **Pull requests:** Read-only
  - **Metadata:** Read-only (auto)
- **Subscribe to events:** **Pull request**
- Create the App, then **Generate a private key** (downloads a `.pem`).

Copy the **App ID** (top of the settings page) into `.env`.

## 2. Configure

```bash
cp .env.example .env
# set APP_ID, WEBHOOK_SECRET, and PRIVATE_KEY_PATH (point at the .pem you downloaded)
```

## 3. Run

```bash
bun run start          # starts the webhook server on :3000
```

For **local development**, expose it to GitHub with a tunnel:

```bash
# e.g. smee.io (no install): create a channel, then
bunx smee-client --url https://smee.io/your-channel --target http://localhost:3000
# …and set the App's Webhook URL to the smee channel URL.
```

For **production**, deploy `bun run start` anywhere that gives you a stable
HTTPS URL (Fly.io, Railway, a small VPS) and point the Webhook URL there.

## 4. Install it on a repo

App settings → **Install App** → pick a repo. Open a PR → a **"Legible — clarity"**
check appears with a summary feed and inline annotations.

## How it behaves

- **Non-blocking.** Findings never fail the build — they are advisory
  (`success` when clean, `neutral` when there are new findings).
- **Auto-baseline.** Commit a `.legible-baseline.json` (run
  `bun run scan . --init-baseline` locally and commit the file) so the check
  shows only what's **new** in each PR, not the repo's whole backlog.
- **Cheap.** The scan is deterministic (CPU, no LLM), so it's effectively free
  to run on every PR.

## Optional exploration

Reading a Git tree through the API could avoid a local clone. This is an
open question, not a delivery obligation. Paid tiers and score dashboards
are retired; the project does not need a business case.
