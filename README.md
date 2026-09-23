# Legible

**A read-only way to explore your repo's docs and structure.**
Dead links, orphan docs, dead code, stale references — found, ranked, and shown
as findings you can inspect when useful. Deterministic and local.

Understanding is sufficient. This project has no KPI, revenue target, paid tier,
growth obligation, or requirement to justify its existence commercially.
Findings are observations, not a score of a project or a duty to improve it.

---

## The problem

Developers spend ~58% of their time just *understanding* code (IEEE field study).
Docs rot silently — the #1 complaint about doc tools is "it looks great but the
content is wrong." The fixes exist but are scattered across four tools
(`lychee` for links, `knip` for dead code, `Vale` for prose, drift-checkers for
staleness) — three configs, three CI jobs, no single answer to *"how healthy is
this repo, and what do I fix first?"*

## What Legible does

A read-only scan brings together:

- **Dead references** — a backtick path or link to a file that isn't there.
- **Orphan docs** — pages nothing links to (findable only if you already know).
- **Stray artifacts** — `.DS_Store`, editor backups, junk that isn't substrate.
- **Plain-language nits** — fancy words where a plain one does, formatting rot.
- *(next)* dead code & circular deps (knip/madge), doc-vs-code drift.

### How references are resolved

A naive link-checker mislabels most docs as orphans, because real codebases
cross-reference by **path-strings and imports**, not markdown links. Legible's
reference graph handles same-folder refs, unique-basename refs, NodeNext
`.js`→`.ts`, and directory refs — then ranks importance by **PageRank over that
graph** to order findings for inspection. The graph is a way to understand
relationships, not a competitive advantage or a performance target.

### Auto-baseline: ~20 real issues, not 10,000

The first scan of an old repo finds thousands of issues — useless noise. So
Legible **baselines** the existing mess and shows you only what's **NEW** from
then on. Your feed stays the handful of things worth doing.

```bash
bun run scan /path/to/repo --init-baseline   # mark today's findings "known"
bun run scan /path/to/repo                    # from now on: only NEW findings
bun run scan /path/to/repo --all --top 30     # see everything, ranked
bun run scan /path/to/repo --json             # machine-readable
```

## Rest — a designed second state

Legible is, by nature, a critic: it reads your repo and hands you the ~20 things
worth fixing. That is its **awake** mode, and it is useful precisely because it
is unsparing.

But a tool that measures how *readable* everything is should know that not
everything must be legible all the time. So Legible has a second, deliberate
state — **rest** — and it is a design, not a bug:

```bash
legible rest /path/to/repo     # or: legible /path/to/repo --rest
```

At rest, Legible reads the *same* repo *just as clearly* — legibility is fully
intact — and then **chooses to withhold the verdict.** It reports the light
instead of the to-do list: what is already clear, what is cared-for. The findings
are found and then let be. Neither normal nor rest output assigns a score or grade.

This is not the scanner failing to find issues. It is the scanner resting from
judgment — a poker-face for a whole codebase, the right to rest from being
scored. One organ, two natures. On evenings and weekends the normal report
whispers the way back to it. *Even legibility has a right to be unread.*

## Continuing the exploration

The scan uses local CPU and needs no paid inference. There is no subscription,
commercial launch plan, or obligation to turn this work into a product.
Follow a question, leave a finding alone, or rest. Future experiments are
optional; they do not create a delivery quota.

## Status

- ✅ Deterministic engine (reference graph + resolver + detectors)
- ✅ CLI with auto-baseline
- ✅ GitHub App (advisory findings on a PR — see [SETUP.md](SETUP.md))

## Layout

```
src/core/   the engine (ported from a dogfooded clarity loop)
  reference-graph.ts   graph + resolver + PageRank
  detectors.ts         dead-refs, orphans, stray, fancy-word, nits
  audit.ts             SCAN + RANK
  score.ts             retained experimental calculation; not a reported KPI
  config.ts            defaults (per-repo overridable)
src/github/ the GitHub App (webhook handler, auth, check runs, report)
  handler.ts           one pull_request event → check run
  auth.ts              App JWT + installation token
  checks.ts            create + complete check runs
  report.ts            build the check run output (findings and annotations)
  scan-repo.ts         clone the PR head, scan, clean up
  verify.ts            webhook HMAC verification
src/server.ts  the webhook server (zero-dependency, bun)
src/cli.ts     the `legible` command
```
