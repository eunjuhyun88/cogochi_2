# Cogochi AI Runtime And Training Spec

Last updated: 2026-03-07

This document defines the buildable AI subsystem for Cogochi.

It goes deeper than the product design document and answers:

- how RAG actually works
- how context is assembled
- how evaluation is scored
- how reflection writes back to memory
- how retraining jobs are created and promoted
- how SFT and LoRA can be attached without breaking the game loop

If this document conflicts with a looser product note, this document wins for implementation.

For exact interfaces, state transitions, artifact formats, benchmark schemas, provider contracts, and async PvP persistence, see [AI_IMPLEMENTATION_CONTRACTS.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/AI_IMPLEMENTATION_CONTRACTS.md).

## 1. Product framing

Cogochi is an agent training simulator, not a generic battle game.

The core gameplay object is:

`OwnedAgent = base model + prompt stack + data bindings + tools + memory bank + eval history + training lineage`

The battle screen is the evaluation shell for that object.

The correct loop is:

`create agent -> bind data -> configure prompts -> retrieve memory -> run eval -> reflect -> update memory -> queue retraining -> promote improved version`

## 2. Scope

This spec covers:

- runtime inference
- hybrid retrieval
- context assembly
- multi-agent squad evaluation
- reflection and memory compaction
- retraining orchestration
- SFT and LoRA promotion rules

This spec does not cover:

- full from-scratch pretraining
- distributed cluster training infrastructure
- real exchange execution
- live synchronous PvP servers

## 3. System architecture

```text
DataSource Adapters
-> Scenario Packet Builder
-> Agent Retrieval Query Builder
-> Hybrid Retriever
-> Context Assembler
-> Model Provider
-> Decision Trace Validator
-> Squad Resolver
-> Eval Scorer
-> Reflection Generator
-> Memory Writeback
-> Retraining Queue
-> Optional SFT / LoRA Artifact Promotion
```

## 4. Runtime layers

### 4.1 Layer A: Structured current state

This is not RAG.

It is the current scenario packet directly injected into the model:

- symbol
- timeframe
- market regime
- price and short-term return
- volatility
- fear/greed
- funding
- open interest change
- scenario objective
- allowed data kinds

This must be deterministic and schema-validated.

### 4.2 Layer B: Retrieved past experience

This is RAG.

It contains durable memory:

- success cases
- failure cases
- match summaries
- playbooks
- user doctrine
- benchmark exemplars

### 4.3 Layer C: Policy layer

This is the agent personality and tasking:

- system prompt
- role prompt
- policy prompt
- risk tolerance
- confidence style
- horizon
- tactic preset

### 4.4 Layer D: Execution layer

This is the model adapter and structured output parser:

- heuristic adapter
- Ollama adapter
- OpenAI-compatible adapter
- future local vLLM adapter

## 5. Domain model additions

The current code already has the main domain objects in [types.ts](/Users/ej/Downloads/maxidoge-clones/Cogochi/src/lib/aimon/types.ts). The AI subsystem needs these additional implementation-level types.

```ts
export interface DatasetSlice {
  id: string;
  sourceKind: DataSourceKind;
  label: string;
  schemaVersion: string;
  rows: number;
  createdAt: number;
  metadata: Record<string, string | number | boolean>;
}

export interface ScenarioPacket {
  scenarioId: string;
  symbol: string;
  timeframe: string;
  objective: string;
  allowedDataKinds: DataSourceKind[];
  market: {
    regime: MarketRegime;
    price: number;
    priceChange5m: number;
    volatility: number;
    fearGreed: number;
    fundingRate: number;
    openInterestChange: number;
  };
  evidence: Array<{
    kind: DataSourceKind;
    sourceId: string;
    title: string;
    summary: string;
    score?: number;
  }>;
  generatedAt: number;
}

export interface RetrievedMemoryItem {
  memoryId: string;
  title: string;
  kind: MemoryKind;
  lesson: string;
  summary: string;
  score: number;
  breakdown: {
    semantic: number;
    recency: number;
    success: number;
    importance: number;
    roleMatch: number;
    regimeMatch: number;
    symbolMatch: number;
  };
}

export interface AgentContextPacket {
  agentId: string;
  scenario: ScenarioPacket;
  policy: {
    systemPrompt: string;
    rolePrompt: string;
    policyPrompt: string;
    riskTolerance: number;
    confidenceStyle: AgentConfidenceStyle;
    horizon: AgentHorizon;
  };
  activeDataKinds: DataSourceKind[];
  disallowedDataKinds: DataSourceKind[];
  retrievedMemories: RetrievedMemoryItem[];
  squadNotes: string[];
  outputSchemaVersion: string;
}

export interface ReflectionNote {
  id: string;
  agentId: string;
  scenarioId: string;
  verdict: 'GOOD' | 'MIXED' | 'BAD';
  failureMode?: string;
  lesson: string;
  actionChange?: string;
  confidenceDelta?: number;
  retrievalDelta?: string;
  createdAt: number;
}

export interface TrainingDatasetExample {
  id: string;
  agentId: string;
  scenarioId: string;
  inputContext: AgentContextPacket;
  preferredOutput: AgentDecisionTrace;
  label: 'SUCCESS' | 'FAILURE' | 'PREFERRED' | 'REJECTED';
  createdAt: number;
}

export interface ModelArtifact {
  id: string;
  baseModelId: string;
  kind: 'PROMPT_VARIANT' | 'SFT' | 'LORA';
  label: string;
  storageUri: string;
  metrics: EvalMetrics;
  createdAt: number;
}
```

## 6. Memory architecture

### 6.1 Memory classes

Each `MemoryBank` is partitioned logically into five classes.

1. `Working`
- short-lived notes for the current run
- cleared after the match

2. `Episodic`
- one-card summaries of individual matches
- medium retention

3. `Playbook`
- generalized rules extracted from many successful runs
- long retention

4. `Failure`
- mistakes and anti-patterns
- retained until explicitly superseded

5. `Doctrine`
- player-authored rules
- highest priority, lowest decay

### 6.2 Retrieval index

MVP:

- in-memory hybrid scoring
- lexical token overlap
- metadata filters
- weighted recency and success

Phase 2:

- embedding provider
- vector index
- hybrid merge: semantic score + metadata score

### 6.3 Retrieval guardrails

The retriever must enforce:

- `record.createdAt <= scenarioStartAt`
- `record.symbol == scenario.symbol` when strict symbol mode is enabled
- timeframe compatibility
- role-sensitive weighting
- doctrine cannot be dropped below minimum quota

### 6.4 Retrieval score

Current formula should evolve to:

```text
totalScore =
  0.30 * semanticSimilarity +
  0.15 * lexicalSimilarity +
  0.12 * recency +
  0.12 * successWeight +
  0.10 * importance +
  0.08 * roleMatch +
  0.08 * regimeMatch +
  0.05 * symbolMatch
```

The exact weights must come from `RetrievalPolicy`.

### 6.5 Retrieval quota

Each inference receives a fixed retrieval budget:

- 1 doctrine card minimum
- 1 failure or risk card minimum for `RISK`
- 1 success/playbook card minimum for `EXECUTOR`
- remaining slots by total score

### 6.6 Compaction algorithm

Raw match logs must never be stored indefinitely.

Compaction flow:

1. collect low-level logs from recent matches
2. cluster by:
   - regime
   - symbol
   - role
   - repeated failure mode
3. summarize cluster into one lesson card
4. preserve the top raw exemplar ids in metadata
5. replace verbose logs with compacted card

Compaction score:

```text
retentionScore =
  0.45 * importance +
  0.25 * abs(successScore) +
  0.20 * retrievalCountNormalized +
  0.10 * recency
```

Retention policy:

- keep top doctrine always
- keep top playbooks
- keep recent failures
- aggressively compact stale match summaries

## 7. Context assembly

### 7.1 Context packet order

The context fed to the model must be assembled in this order:

1. system contract
2. role contract
3. scenario objective
4. allowed and disallowed data kinds
5. structured market state
6. structured evidence packets
7. retrieved memories
8. squad notes
9. output schema instructions

### 7.2 Context budget

The model context budget must be explicitly partitioned.

Recommended budget for a 7B local model:

- system and role prompts: 20%
- scenario and market packet: 20%
- evidence packet: 20%
- retrieved memories: 30%
- squad notes and output schema: 10%

If token pressure occurs, trim in this order:

1. redundant evidence lines
2. low-scoring memories
3. verbose squad notes

Never trim:

- output schema
- doctrine memory quota
- scenario objective

### 7.3 Output schema

The model must return strict JSON:

```json
{
  "action": "LONG | SHORT | FLAT",
  "confidence": 0.0,
  "thesis": "string",
  "invalidation": "string",
  "evidenceTitles": ["string"],
  "riskFlags": ["string"],
  "memoryIdsUsed": ["string"]
}
```

### 7.4 Squad reasoning

MVP squad reasoning can be parallel.

Flow:

- each role receives the same scenario packet
- each role receives role-specific memories
- each role returns one trace
- final squad consensus is resolved by:
  - `SCOUT` proposing
  - `ANALYST` interpreting
  - `RISK` vetoing or lowering confidence
  - `EXECUTOR` submitting final stance

Phase 2 can add explicit inter-agent message passing.

## 8. Runtime inference algorithm

### 8.1 Single agent decision algorithm

```ts
function decideAgent(agent, scenario, memoryBank) {
  const query = buildRetrievalQuery(agent, scenario);
  const hits = retrieveRelevantMemories(memoryBank, agent.loadout.retrievalPolicy, query);
  const context = assembleContext(agent, scenario, hits);
  const raw = provider.generate(context);
  const trace = validateAndNormalize(raw);
  return { trace, hits, context };
}
```

### 8.2 Squad evaluation algorithm

```ts
function runSquadEval(squad, scenario) {
  const roleTraces = squad.members.map((agent) => decideAgent(agent, scenario, agent.memoryBank));
  const finalTrace = resolveSquadConsensus(roleTraces);
  const marketOutcome = resolveScenarioOutcome(finalTrace, scenario);
  const metrics = scoreEval(roleTraces, finalTrace, marketOutcome, scenario.scoringWeights);
  const reflections = buildReflections(roleTraces, finalTrace, metrics);
  writeBackMemory(reflections);
  enqueueTrainingIfNeeded(reflections, metrics);
  return { roleTraces, finalTrace, metrics, reflections };
}
```

### 8.3 Provider adapter behavior

Provider contract:

- `generate(context: AgentContextPacket): Promise<AgentDecisionTrace>`

Required adapter behaviors:

- timeout
- one retry on invalid JSON
- one fallback to heuristic
- structured output validation
- provider label tagging

### 8.4 Fallback rules

If external runtime fails:

1. keep the match alive
2. mark `fallbackUsed = true`
3. append provider error into thesis metadata
4. do not discard reflections

## 9. Evaluation and scoring

### 9.1 Per-agent score

Each agent gets:

- direction correctness
- confidence calibration
- role-specific contribution
- evidence quality
- retrieval usefulness

### 9.2 Team score

Scenario-weighted team score:

```text
total =
  returnWeight * returnScore +
  riskWeight * riskScore +
  accuracyWeight * accuracyScore +
  calibrationWeight * calibrationScore +
  reasoningWeight * reasoningScore +
  coordinationWeight * coordinationScore
```

### 9.3 Score decomposition

`reasoningScore` should be computed from:

- thesis clarity
- evidence-title validity
- invalidation quality
- consistency between action and thesis

`coordinationScore` should be computed from:

- role diversity
- veto correctness by `RISK`
- consistency between `SCOUT`, `ANALYST`, and `EXECUTOR`

### 9.4 Promotion gates

A new variant is only promotable if:

- total score improves over baseline
- risk score does not regress below threshold
- reasoning score is not worse than baseline by more than tolerance

## 10. Reflection and memory writeback

### 10.1 Reflection generation

After every match, generate three artifacts.

1. `Raw Match Trace`
- full payload for debugging

2. `Reflection Note`
- structured lesson

3. `Durable Memory Record`
- success, failure, playbook, or summary card

### 10.2 Reflection template

```json
{
  "verdict": "GOOD | MIXED | BAD",
  "failureMode": "late entry | overconfidence | regime mismatch | retrieval miss",
  "lesson": "One clear sentence",
  "actionChange": "Reduce confidence by 0.1 in high-volatility range conditions",
  "retrievalDelta": "Increase failure-case weight for RANGE regime"
}
```

### 10.3 Writeback rules

- strong success repeated 3+ times -> candidate `PLAYBOOK`
- isolated success -> `SUCCESS_CASE`
- isolated failure -> `FAILURE_CASE`
- inconclusive run -> `MATCH_SUMMARY`
- player-authored notes -> `USER_NOTE`

## 11. Retraining design

Retraining is not one thing. It is a family of jobs.

### 11.1 Prompt tune job

Trigger:

- thesis weak
- reasoning score low
- repeated bad framing

Inputs:

- current prompts
- recent failure reflections
- best successful traces

Output:

- new prompt variant
- hypothesis
- diff summary

Acceptance:

- improved reasoning score
- no major risk regression

### 11.2 Retrieval tune job

Trigger:

- correct evidence existed in memory but was not selected
- low retrieval usefulness

Inputs:

- retrieval breakdowns
- missed memory ids
- false-positive memory ids

Output:

- updated `RetrievalPolicy`
- changed weights
- changed quotas

Acceptance:

- better hit quality on benchmark scenarios

### 11.3 Memory compaction job

Trigger:

- memory bank near capacity
- noisy repeated summaries

Inputs:

- old memory records
- retrieval counts
- reflection clustering

Output:

- compacted playbook/failure cards
- raised compaction level

### 11.4 SFT job

Trigger:

- enough high-quality labeled examples
- prompt tuning plateaus

Inputs:

- `TrainingDatasetExample[]`
- selected prompt version
- base model id

Output:

- SFT artifact
- metrics against benchmark pack

Acceptance:

- beats prompt-only baseline
- stays within latency budget

### 11.5 LoRA job

Trigger:

- same as SFT, but local and cheaper

Inputs:

- same dataset examples
- LoRA hyperparameters

Output:

- adapter artifact
- promotion candidate

Acceptance:

- better benchmark score than current promoted version

### 11.6 Continued pretraining job

Not part of MVP.

Only allowed when:

- there is enough curated domain text
- infra supports long-running jobs
- the product already proves prompt/RAG value

## 12. Fine-tuning data pipeline

### 12.1 Example sources

Training examples come from:

- successful eval matches
- corrected failed matches
- curated doctrine transforms
- benchmark reference strategies

### 12.2 SFT example format

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "scenario packet + evidence + memories" },
    { "role": "assistant", "content": "{\"action\":\"LONG\", ...}" }
  ],
  "metadata": {
    "agentId": "agent-123",
    "scenarioId": "btc-breakout-pulse",
    "quality": 0.91
  }
}
```

### 12.3 Preference tuning format

Future phase:

```json
{
  "prompt": "context packet",
  "chosen": "{\"action\":\"FLAT\", ...}",
  "rejected": "{\"action\":\"LONG\", ...}",
  "metadata": {
    "failureMode": "overconfidence"
  }
}
```

### 12.4 Dataset curation rules

- remove leakage
- remove contradictory low-quality examples
- cap duplicate scenarios
- preserve role diversity
- preserve both success and failure corrections

## 13. Versioning and lineage

Each agent needs version lineage:

```ts
export interface AgentVersion {
  id: string;
  agentId: string;
  baseModelId: string;
  promptVariantId?: string;
  artifactId?: string;
  retrievalPolicyVersion: string;
  memoryCompactionLevel: number;
  promoted: boolean;
  createdAt: number;
}
```

Promotion rule:

- one active promoted version per agent
- old versions remain benchmarkable
- eval screen can compare `current vs candidate`

## 14. Storage design

### 14.1 Local MVP

Use local persistence first:

- roster and loadouts: local store
- memory banks: local store
- prompt variants: local store
- training runs: local store
- benchmark results: local store

### 14.2 Files and services

Required runtime modules:

- `src/lib/aimon/services/embeddingProvider.ts`
- `src/lib/aimon/services/retrievalIndex.ts`
- `src/lib/aimon/services/contextAssembler.ts`
- `src/lib/aimon/services/modelProvider.ts`
- `src/lib/aimon/services/reflectionService.ts`
- `src/lib/aimon/services/evalService.ts`
- `src/lib/aimon/services/datasetBuilder.ts`
- `src/lib/aimon/services/fineTuneService.ts`
- `src/lib/aimon/services/trainingOrchestrator.ts`

Required stores:

- `rosterStore`
- `squadStore`
- `labStore`
- `matchStore`
- `runtimeStore`

### 14.3 API surface

Server routes needed:

- `POST /api/aimon/runtime/test`
- `POST /api/aimon/decide`
- `POST /api/aimon/eval/run`
- `POST /api/aimon/memory/compact`
- `POST /api/aimon/training/queue`
- `POST /api/aimon/training/promote`

## 15. UI mapping

### `/agent/[id]`

Must show:

- prompt stack
- active data kinds
- active tools
- retrieval preview
- prompt variants
- training lineage
- memory bank health
- current promoted version

### `/lab`

Must show:

- queued training jobs
- benchmark pack
- recent promotion candidates
- compact memory jobs
- dataset example counts

### `/battle`

Must show:

- selected scenario
- retrieved memories by role
- decision traces by role
- final consensus
- score breakdown
- reflection summary

## 16. Build phases

### Phase 1: Solid local prototype

Required:

- scenario selection
- retrieval-backed decision traces
- reflection writeback
- prompt variant saving
- training queue scaffolding

Status:

- mostly implemented

### Phase 2: Real runtime attachment

Required:

- Ollama connection
- strict JSON output validation
- runtime health test
- benchmark reruns against real model

### Phase 3: Real RAG

Required:

- embeddings
- vector index
- hybrid retrieval
- retrieval analytics

### Phase 4: Retraining and artifacts

Required:

- dataset builder
- SFT/LoRA job records
- artifact registry
- promotion compare view

## 17. Immediate implementation order

1. Add `reflectionService.ts`
- create `ReflectionNote`
- classify failure modes
- generate durable memory cards

2. Add `evalService.ts`
- centralize score decomposition
- remove scoring logic from store layer

3. Add `embeddingProvider.ts` and `retrievalIndex.ts`
- start with fake embeddings if needed
- keep the interface stable

4. Add `datasetBuilder.ts`
- turn matches into SFT-ready examples

5. Add `trainingOrchestrator.ts`
- execute queued prompt/retrieval/memory jobs

6. Add `fineTuneService.ts`
- artifact creation and promotion records

## 18. Success criteria

The AI subsystem is correct when:

- changing prompt, data, or memory changes eval behavior
- the model can explain what memory affected the choice
- post-match reflection produces reusable lessons
- memory compaction improves retrieval quality instead of degrading it
- prompt-only and fine-tuned variants can be benchmarked fairly
- the player feels they are training a persistent agent, not just starting a fresh battle each time
