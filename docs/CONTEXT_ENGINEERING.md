# Cogochi Context Engineering

Last updated: 2026-03-07

This document defines how Cogochi should be structured so coding agents can work reliably over time.

It is derived from two external ideas:

- OpenAI engineering writeup on building with agent-first repositories and using a short `AGENTS.md` as a map instead of a giant manual:
  [Harness engineering: Using Codex in an agent-first world](https://openai.com/index/harness-engineering-using-codex-in-an-agent-first-world/)
- Anthropic engineering guidance on reducing infrastructure noise in agentic evaluations:
  [Infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)

## 1. Why this matters

Cogochi is no longer a tiny prototype.

It now contains:

- product docs
- AI runtime docs
- stores and routes
- eval logic
- runtime adapters

Without explicit context engineering, future agent runs will drift, repeat work, or optimize the wrong constraint.

## 2. Direct takeaways from OpenAI's agent-first repo approach

The important ideas for us are:

### 2.1 `AGENTS.md` should be a map, not an encyclopedia

Reason:

- giant instruction files waste context
- stale rules become indistinguishable from true rules
- local pattern matching replaces actual navigation

Cogochi rule:

- [AGENTS.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/AGENTS.md) stays short
- deeper truth lives under [docs/INDEX.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/INDEX.md)

### 2.2 `docs/` must be the system of record

Reason:

- if knowledge is only in chat, it does not exist for later runs
- progressive disclosure works better than one giant context blob

Cogochi rule:

- product, runtime, reliability, and plan context must live in repo docs

### 2.3 Plans are first-class artifacts

Reason:

- complicated work needs durable execution plans
- agents need active, completed, and debt-tracking history

Cogochi rule:

- active plans go under `docs/exec-plans/active`
- completed plans move to `docs/exec-plans/completed`
- long-lived debt goes to `docs/exec-plans/tech-debt-tracker.md`

### 2.4 Mechanical enforcement beats good intentions

Reason:

- doc drift is inevitable without checks
- stable constraints should be encoded in code or scripts

Cogochi rule:

- `npm run check` must also validate the context-doc structure

### 2.5 Agent readability is a design target

Reason:

- readable structure helps both humans and coding agents
- predictable layers reduce random variation

Cogochi rule:

- keep domain truth in `src/lib/aimon`
- keep runtime contracts in docs and typed interfaces
- keep eval reliability rules in one place

## 3. Direct takeaways from Anthropic's infrastructure-noise guidance

The important ideas for us are:

### 3.1 Benchmark results mix model quality and environment noise

Reason:

- runtime latency
- shared machine load
- cache differences
- provider instability

all change results even when the agent logic does not.

Cogochi rule:

- benchmark and eval results must record runtime profile metadata

### 3.2 Use named performance profiles

Reason:

- not every run should be judged against the same stability expectation

Cogochi rule:

- define `local-fast`, `local-reference`, and `ci-benchmark` profiles in [RELIABILITY.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/RELIABILITY.md)

### 3.3 Enforce headroom and fail-fast thresholds

Reason:

- unstable machines produce meaningless benchmark comparisons

Cogochi rule:

- benchmark runs must be rejected when runtime health drops below profile thresholds

### 3.4 Isolate noisy eval environments

Reason:

- reliable comparison requires stable environment metadata

Cogochi rule:

- async PvP and benchmark packs must rely on frozen scenario and agent snapshots

## 4. Cogochi repository rules

### 4.1 Short map at the top

Required files:

- [AGENTS.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/AGENTS.md)
- [docs/INDEX.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/INDEX.md)

### 4.2 Durable doc categories

Required docs:

- product truth
- AI runtime truth
- implementation contracts
- plans
- quality score
- reliability

### 4.3 Context should narrow, not flood

Default read path:

1. `AGENTS.md`
2. `docs/INDEX.md`
3. the one or two relevant docs for the task

### 4.4 Stable rules should be machine-checkable

Required:

- presence of core docs
- short `AGENTS.md`
- doc cross-links
- plan directories

This is enforced by `scripts/check-context-docs.mjs`.

## 5. Concrete repo improvements adopted now

The following changes are now part of the standard Cogochi setup:

- short `AGENTS.md`
- docs index
- context engineering guide
- reliability guide
- quality score file
- execution plan directories
- context-doc lint added to `npm run check`
- AIMON architecture lint added to `npm run check`
- code-aware doc freshness checks for implementation contracts
- doc freshness lint against actual code exports
- benchmark run manifests stored per eval
- artifact lineage recorded in repo-local state

## 6. Future improvements

These are not required immediately, but they are the next context-engineering layer:

1. automated doc-gardening tasks
2. scenario pack versioning checks
3. artifact lineage diff viewers
4. benchmark manifest export to durable storage
5. architecture rule autofix hints

## 7. Rule of thumb

If a future agent should know something without rereading a chat transcript, it belongs in this repo.
