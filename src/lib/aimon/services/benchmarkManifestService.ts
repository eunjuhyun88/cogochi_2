import type { AgentDecisionTrace, BenchmarkRunManifest, EvalMatchResult, OwnedAgent, RuntimeConfig } from '../types';

export interface BuildBenchmarkRunManifestInput {
  matchResult: EvalMatchResult;
  runtime: RuntimeConfig;
  agents: OwnedAgent[];
  decisionTraces: AgentDecisionTrace[];
  startedAt: number;
  finishedAt?: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[index] ?? sorted[sorted.length - 1] ?? 0;
}

function estimateMemoryUsedGb(): number {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const typedPerformance = performance as Performance & {
      memory?: {
        usedJSHeapSize?: number;
      };
    };
    const bytes = typedPerformance.memory?.usedJSHeapSize;
    if (typeof bytes === 'number' && Number.isFinite(bytes)) {
      return Number((bytes / 1024 / 1024 / 1024).toFixed(2));
    }
  }

  const typedNavigator = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : null;
  if (typedNavigator && typeof typedNavigator.deviceMemory === 'number') {
    return Number((typedNavigator.deviceMemory * 0.45).toFixed(2));
  }

  return 0;
}

function buildProfile(runtime: RuntimeConfig): string {
  if (runtime.mode === 'HEURISTIC') return 'local-heuristic';
  if (runtime.mode === 'OLLAMA') return 'local-ollama';
  return 'openai-compatible';
}

export function buildBenchmarkRunManifest(input: BuildBenchmarkRunManifestInput): BenchmarkRunManifest {
  const finishedAt = input.finishedAt ?? Date.now();
  const latencies = input.decisionTraces.map((trace) => trace.latencyMs ?? 0).filter((latency) => latency > 0);
  const fallbackCount = input.decisionTraces.filter((trace) => trace.fallbackUsed).length;
  const invalidJsonCount = input.decisionTraces.filter((trace) => {
    const error = trace.providerError?.toLowerCase() ?? '';
    return error.includes('json');
  }).length;
  const validTraceCount = input.decisionTraces.filter((trace) => !trace.providerError).length;
  const artifactIds = input.agents.map((agent) => agent.activeArtifactId).filter((id): id is string => Boolean(id));
  const primaryArtifactId = artifactIds[0];
  const fallbackRate = input.decisionTraces.length > 0 ? fallbackCount / input.decisionTraces.length : 0;
  const invalidJsonRate = input.decisionTraces.length > 0 ? invalidJsonCount / input.decisionTraces.length : 0;

  return {
    runId: `bench-run-${input.matchResult.id}`,
    profile: buildProfile(input.runtime),
    benchmarkPackId: `benchmark-${input.matchResult.scenarioId}`,
    scenarioId: input.matchResult.scenarioId,
    squadId: input.matchResult.squadId,
    primaryArtifactId,
    artifactIds,
    runtime: {
      mode: input.runtime.mode,
      baseUrl: input.runtime.baseUrl,
      modelId: input.runtime.modelId,
      temperature: input.runtime.temperature,
      timeoutMs: input.runtime.timeoutMs
    },
    system: {
      cpuLoadPct: 0,
      memoryUsedGb: estimateMemoryUsedGb(),
      warmCache: input.runtime.mode === 'HEURISTIC'
    },
    fallbackCount,
    invalidJsonCount,
    averageLatencyMs: Number(average(latencies).toFixed(2)),
    p95LatencyMs: Number(percentile95(latencies).toFixed(2)),
    traceValidityRate: Number(
      (input.decisionTraces.length > 0 ? validTraceCount / input.decisionTraces.length : 1).toFixed(2)
    ),
    scenarioSeedVersion: `${input.matchResult.scenarioId}@${input.matchResult.createdAt}`,
    authoritative: fallbackRate <= 0.1 && invalidJsonRate <= 0.05,
    startedAt: input.startedAt,
    finishedAt
  };
}
