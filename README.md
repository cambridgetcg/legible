# Legible

**One clarity score + a prioritized feed for your repo's docs and structure.**
Dead links, orphan docs, dead code, stale references — found, ranked, and shown
as the ~20 things actually worth fixing. Deterministic. Fast. Cheap to run.

---

## The problem

Developers spend ~58% of their time just *understanding* code (IEEE field study).
Docs rot silently — the #1 complaint about doc tools is "it looks great but the
content is wrong." The fixes exist but are scattered across four tools
(`lychee` for links, `knip` for dead code, `Vale` for prose, drift-checkers for
staleness) — three configs, three CI jobs, no single answer to *"how healthy is
this repo, and what do I fix first?"*

## What Legible does

One install → one **Clarity Score (0–100)** → a **prioritized feed** that unifies:

- **Dead references** — a backtick path or link to a file that isn't there.
- **Orphan docs** — pages nothing links to (findable only if you already know).
- **Stray artifacts** — `.DS_Store`, editor backups, junk that isn't substrate.
- **Plain-language nits** — fancy words where a plain one does, formatting rot.
- *(next)* dead code & circular deps (knip/madge), doc-vs-code drift.

### The moat: it resolves the way real repos actually link

A naive link-checker mislabels most docs as orphans, because real codebases
cross-reference by **path-strings and imports**, not markdown links. Legible's
reference graph handles same-folder refs, unique-basename refs, NodeNext
`.js`→`.ts`, and directory refs — then ranks importance by **PageRank over that
graph**, so the score weights the docs your repo actually leans on. This was
discovered by dogfooding on a large, hostile real-world repo; it's the part
that's hard to copy.

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

## Why it can be cheaper AND better

Everything above is **deterministic** — CPU, not AI. That means a flat, low
per-repo price is genuinely profitable (no inference cost per scan). AI auto-fix
is a **metered premium add-on**, never the flat-priced headline — so the
economics never invert on heavy accounts. "Cheaper" is a *side effect* of the
cost structure, not a price war.

- **Cheaper:** flat ~$19–29/repo/mo for the deterministic core. Undercuts the
  ~$250/mo floor of publishing-platform incumbents with no metered-credit roulette.
- **Better:** one unified score + feed across links/orphans/dead-code/drift —
  the docs-accuracy niche the platform code-only health dashboards ignore.
- **Easier:** one App install, zero config, auto-baselined first report.

## Honest positioning

This is a focused, profitable small-team product, **not a unicorn.** The AST
drift capability is already open-source; the "score" layer may be absorbed by
platform vendors within ~18 months. We win on **packaging, UX, the resolver,
and the docs niche they ignore** — a time-boxed first-mover advantage, ridden
fast. Build the read-only score first, earn "yes I'd pay," then layer metered AI.

## Status

- ✅ Deterministic engine (reference graph + resolver + detectors + score)
- ✅ CLI with auto-baseline
- ⬜ GitHub App (check-run with score + feed on every PR)
- ⬜ Trend dashboard, metered AI auto-fix tier

## Layout

```
src/core/   the engine (ported from a dogfooded clarity loop)
  reference-graph.ts   the moat — graph + resolver + PageRank
  detectors.ts         dead-refs, orphans, stray, fancy-word, nits
  audit.ts             SCAN + RANK
  score.ts             the one number
  config.ts            defaults (per-repo overridable)
src/cli.ts  the `legible` command
```
