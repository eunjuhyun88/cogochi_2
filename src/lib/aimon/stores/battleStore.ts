import { get, writable } from 'svelte/store';
import { createEvalScenario } from '../data/evalScenarios';
import { advanceBattleState, applyFocusTap, applyMemoryPulse, applyRetarget, applyRiskVeto, createInitialBattleState } from '../engine/battleEngine';
import { buildBenchmarkRunManifest } from '../services/benchmarkManifestService';
import { compileChartBattleScene } from '../services/chartBattleScene';
import { buildAgentContextPacket, buildAgentDecisionContext } from '../services/contextAssembler';
import { buildDatasetFromEval } from '../services/datasetBuilder';
import { buildEvalMatchResult } from '../services/evalService';
import { retrieveRelevantMemories } from '../services/memoryService';
import { runAgentDecision } from '../services/modelProvider';
import { buildBattleReflections } from '../services/reflectionService';
import { applyBattleRewards } from './playerStore';
import { applyBattleRewardsToRoster, rosterStore } from './rosterStore';
import { runtimeStore } from './runtimeStore';
import { squadStore } from './squadStore';
import { appendDatasetBundle, appendMemoryRecords, labStore } from './labStore';
import { beginLegacyMatch, matchStore, recordBenchmarkRunManifest, recordEvalMatchResult, syncMatchPhase } from './matchStore';
import type { AgentContextPacket, BattleState, EvalScenario, OwnedAgent, SquadTacticPreset } from '../types';

let timer: ReturnType<typeof setInterval> | null = null;

function resolveActiveBattleAgents(): OwnedAgent[] {
  const roster = get(rosterStore).agents;
  const squadIds = get(squadStore).activeSquad.memberAgentIds;
  const selected = squadIds.map((id) => roster.find((agent) => agent.id === id)).filter((agent): agent is OwnedAgent => Boolean(agent));

  if (selected.length >= 4) return selected.slice(0, 4);

  const filler = roster.filter((agent) => !selected.some((picked) => picked.id === agent.id)).slice(0, 4 - selected.length);
  return [...selected, ...filler];
}

function buildState(): BattleState {
  const match = get(matchStore);
  const scenario = match.activeScenario ?? createEvalScenario(match.selectedScenarioId);
  return createInitialBattleState(resolveActiveBattleAgents(), scenario);
}

export const battleStore = writable<BattleState>(buildState());

function attachScene(state: BattleState): BattleState {
  const match = get(matchStore);
  const scenario = match.activeScenario ?? createEvalScenario(match.selectedScenarioId);
  return {
    ...state,
    scene: compileChartBattleScene(state, scenario)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildContextPackets(
  state: BattleState,
  agents: OwnedAgent[],
  scenario: EvalScenario,
  tacticPreset: SquadTacticPreset
): Record<string, AgentContextPacket> {
  const lab = get(labStore);
  const squadLabels = agents.map((agent) => `${agent.role}:${agent.name}`);

  return agents.reduce<Record<string, AgentContextPacket>>((acc, agent) => {
    const instance = state.playerTeam.find((item) => item.ownedAgentId === agent.id);
    if (!instance) return acc;

    const activeDataSources = lab.dataSources.filter((source) => agent.loadout.enabledDataSourceIds.includes(source.id));
    const activeDataSourceKinds = activeDataSources.map((source) => source.kind);
    const decisionContext = buildAgentDecisionContext(
      agent,
      state.market,
      instance.retrievedMemories,
      squadLabels.filter((label) => label !== `${agent.role}:${agent.name}`),
      tacticPreset,
      scenario,
      activeDataSourceKinds
    );

    acc[agent.id] = buildAgentContextPacket(agent, decisionContext, activeDataSources);
    return acc;
  }, {});
}

function hydrateBattleIntel(state: BattleState): BattleState {
  const rosterAgents = get(rosterStore).agents;
  const lab = get(labStore);
  const match = get(matchStore);
  const activeSquad = get(squadStore).activeSquad;
  const runtime = get(runtimeStore).config;
  const activeScenario = match.activeScenario ?? createEvalScenario(match.selectedScenarioId);
  const scenarioStartAt = activeScenario.scenarioStartAt;
  const memoryPulseActive = state.memoryPulseUntil > Date.now();
  const retargetActive = state.retargetUntil > Date.now();
  const riskVetoActive = state.riskVetoUntil > Date.now();
  const retrievalFeed: BattleState['retrievalFeed'] = [];
  const decisionFeed: BattleState['decisionFeed'] = [];
  const squadLabels = state.playerTeam
    .map((instance) => rosterAgents.find((item) => item.id === instance.ownedAgentId))
    .filter((agent): agent is OwnedAgent => Boolean(agent))
    .map((agent) => `${agent.role}:${agent.name}`);

  const playerTeam = state.playerTeam.map((instance) => {
    const agent = rosterAgents.find((item) => item.id === instance.ownedAgentId);
    if (!agent) return instance;

    const memoryBank = lab.memoryBanks.find((bank) => bank.agentId === agent.id || bank.id === agent.memoryBankId) ?? null;
    const activeDataSourceKinds = agent.loadout.enabledDataSourceIds
      .map((id) => lab.dataSources.find((source) => source.id === id)?.kind)
      .filter((kind): kind is (typeof lab.dataSources)[number]['kind'] => Boolean(kind));
    const retrieved = retrieveRelevantMemories(memoryBank, agent.loadout.retrievalPolicy, {
      role: agent.role,
      symbol: activeScenario.symbol,
      timeframe: activeScenario.timeframe,
      regime: state.market.regime,
      tags: [activeScenario.id, activeScenario.symbol, agent.speciesId, agent.role, ...agent.loadout.indicators, ...agent.specializationTags],
      scenarioStartAt
    });

    const baseMemoryScore = retrieved.length > 0 ? retrieved.reduce((sum, item) => sum + item.totalScore, 0) / retrieved.length : 0;
    const memoryScore = clamp(baseMemoryScore + (memoryPulseActive ? 0.16 : 0), 0, 1);
    const confidenceBias =
      agent.loadout.confidenceStyle === 'AGGRESSIVE'
        ? 0.05
        : agent.loadout.confidenceStyle === 'CONSERVATIVE'
          ? -0.03
          : 0;

    const recentAccuracy = clamp(
      0.48 +
        agent.level * 0.018 +
        memoryScore * 0.32 +
        confidenceBias +
        agent.loadout.enabledDataSourceIds.length * 0.01 +
        (retargetActive ? 0.04 : 0),
      0.35,
      0.95
    );

    const topMemory = retrieved[0];
    const retrievedMemories = retrieved.map((candidate) => ({
      id: candidate.record.id,
      title: candidate.record.title,
      lesson: candidate.record.lesson,
      kind: candidate.record.kind,
      score: candidate.totalScore
    }));
    const decisionContext = buildAgentDecisionContext(
      agent,
      state.market,
      retrievedMemories,
      squadLabels.filter((label) => label !== `${agent.role}:${agent.name}`),
      activeSquad.tacticPreset,
      activeScenario,
      activeDataSourceKinds
    );
    const existingTrace =
      runtime.mode !== 'HEURISTIC' ? state.decisionFeed.find((trace) => trace.ownedAgentId === agent.id) ?? null : null;
    const decisionTrace = existingTrace ?? runAgentDecision(decisionContext);

    retrievalFeed.push({
      ownedAgentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      readout: agent.loadout.readout,
      decisionHint: decisionTrace.thesis,
      memoryScore,
      retrievedMemories
    });
    decisionFeed.push(decisionTrace);

    return {
      ...instance,
      role: agent.role,
      readout: agent.loadout.readout,
      decisionHint: decisionTrace.thesis,
      memoryScore,
      activeDataSourceCount: agent.loadout.enabledDataSourceIds.length,
      activeToolCount: agent.loadout.enabledToolIds.length,
      retrievedMemories,
      recentAccuracy: clamp((recentAccuracy + decisionTrace.confidence) / 2, 0.35, 0.95),
      plannedAction: decisionTrace.action
    };
  });

  const topFeed = retrievalFeed[0];
  const topDecision = decisionFeed[0];
  const activeCommands = [
    memoryPulseActive ? 'Memory Pulse' : null,
    riskVetoActive ? 'Risk Veto' : null,
    retargetActive ? 'Retarget' : null
  ].filter((value): value is string => Boolean(value));
  const livePrefix = activeCommands.length > 0 ? `${activeCommands.join(' · ')} active` : null;
  const tacticalBanner =
    state.interactions.length > 0 || (!topFeed && !topDecision) || state.phase === 'RESULT'
      ? state.eventBanner
      : `Decide · ${activeSquad.tacticPreset} · ${topDecision?.agentName ?? topFeed.agentName}: ${topDecision?.action ?? 'FLAT'} · ${topFeed.retrievedMemories[0]?.title ?? topFeed.readout}`;

  return {
    ...state,
    playerTeam,
    retrievalFeed,
    decisionFeed,
    eventBanner: livePrefix ? `${livePrefix} · ${tacticalBanner}` : tacticalBanner
  };
}

async function primeRuntimeDecisionFeed(state: BattleState): Promise<BattleState> {
  const runtime = get(runtimeStore).config;
  if (runtime.mode === 'HEURISTIC' || typeof window === 'undefined') return state;

  const rosterAgents = get(rosterStore).agents;
  const lab = get(labStore);
  const match = get(matchStore);
  const activeScenario = match.activeScenario ?? createEvalScenario(match.selectedScenarioId);
  const activeSquad = get(squadStore).activeSquad;
  const requests = state.playerTeam.map(async (instance) => {
    const agent = rosterAgents.find((item) => item.id === instance.ownedAgentId);
    if (!agent) return null;
    const squadNotes = state.playerTeam
      .map((item) => rosterAgents.find((entry) => entry.id === item.ownedAgentId))
      .filter((item): item is OwnedAgent => Boolean(item))
      .filter((item) => item.id !== agent.id)
      .map((item) => `${item.role}:${item.name}`);
    const activeDataSourceKinds = agent.loadout.enabledDataSourceIds
      .map((id) => lab.dataSources.find((source) => source.id === id)?.kind)
      .filter((kind): kind is (typeof lab.dataSources)[number]['kind'] => Boolean(kind));

    const context = buildAgentDecisionContext(
      agent,
      state.market,
      instance.retrievedMemories,
      squadNotes,
      activeSquad.tacticPreset,
      activeScenario,
      activeDataSourceKinds
    );

    try {
      const response = await fetch('/api/aimon/decide', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          context,
          config: runtime
        })
      });
      const payload = (await response.json()) as { trace?: BattleState['decisionFeed'][number] };
      return payload.trace ?? null;
    } catch {
      return null;
    }
  });

  const decisionFeed = (await Promise.all(requests)).filter((trace): trace is BattleState['decisionFeed'][number] => Boolean(trace));
  if (decisionFeed.length === 0) return state;

  return {
    ...state,
    decisionFeed
  };
}

function clearTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export async function startBattle(): Promise<void> {
  clearTimer();
  beginLegacyMatch();
  const baseState = hydrateBattleIntel(buildState());
  const primedState = hydrateBattleIntel(await primeRuntimeDecisionFeed(baseState));
  battleStore.set(attachScene(primedState));
  timer = setInterval(() => {
    battleStore.update((state) => {
      const prepared = hydrateBattleIntel(state);
      const next = attachScene(hydrateBattleIntel(advanceBattleState(prepared, Date.now())));
      syncMatchPhase(next.phase);
      if (next.result && !next.rewardsApplied) {
        const rosterAgents = get(rosterStore).agents;
        const activeScenario = get(matchStore).activeScenario ?? createEvalScenario(get(matchStore).selectedScenarioId);
        const activeSquad = get(squadStore).activeSquad;
        const runtime = get(runtimeStore).config;
        const activeAgents = next.playerTeam
          .map((instance) => rosterAgents.find((agent) => agent.id === instance.ownedAgentId))
          .filter((agent): agent is OwnedAgent => Boolean(agent));
        const activeAgentIds = activeAgents.map((agent) => agent.id);
        const decisionTracesByAgent = next.decisionFeed.reduce<Record<string, (typeof next.decisionFeed)[number]>>((acc, trace) => {
          acc[trace.ownedAgentId] = trace;
          return acc;
        }, {});

        applyBattleRewards(next.result);
        applyBattleRewardsToRoster(activeAgentIds, next.result);
        const draftMatchResult = buildEvalMatchResult({
          scenario: activeScenario,
          battleResult: next.result,
          agents: activeAgents,
          decisionTracesByAgent,
          squadId: activeSquad.id
        });
        const reflectionOutputs = buildBattleReflections(
          activeScenario,
          next.result,
          activeAgents,
          draftMatchResult.agentResults,
          decisionTracesByAgent,
          draftMatchResult.createdAt
        );
        const reflectionsByAgent = Object.fromEntries(
          Object.entries(reflectionOutputs).map(([agentId, output]) => [agentId, output.note])
        );
        const writtenRecords = appendMemoryRecords(Object.values(reflectionOutputs).map((output) => output.durableMemory));
        const memoryWritesByAgent = writtenRecords.reduce<Record<string, typeof writtenRecords>>((acc, record) => {
          acc[record.agentId] = [...(acc[record.agentId] ?? []), record];
          return acc;
        }, {});
        const finalMatchResult = buildEvalMatchResult({
          scenario: activeScenario,
          battleResult: next.result,
          agents: activeAgents,
          decisionTracesByAgent,
          memoryWritesByAgent,
          reflectionsByAgent,
          squadId: activeSquad.id,
          createdAt: draftMatchResult.createdAt
        });
        const contextPackets = buildContextPackets(next, activeAgents, activeScenario, activeSquad.tacticPreset);
        const datasetBundle = buildDatasetFromEval(finalMatchResult, contextPackets, reflectionsByAgent);
        appendDatasetBundle(datasetBundle);
        const benchmarkManifest = buildBenchmarkRunManifest({
          matchResult: finalMatchResult,
          runtime: runtime,
          agents: activeAgents,
          decisionTraces: Object.values(decisionTracesByAgent),
          startedAt: activeScenario.scenarioStartAt,
          finishedAt: finalMatchResult.createdAt
        });
        recordBenchmarkRunManifest(benchmarkManifest);
        recordEvalMatchResult({
          ...finalMatchResult,
          contextPackets,
          datasetBundleId: datasetBundle.id,
          benchmarkManifestId: benchmarkManifest.runId
        });
        return { ...next, rewardsApplied: true };
      }
      if (!next.running) clearTimer();
      return next;
    });
  }, 1000);
}

export function restartBattle(): void {
  startBattle();
}

export function stopBattle(): void {
  clearTimer();
}

export function focusTap(instanceId: string): void {
  battleStore.update((state) => attachScene(hydrateBattleIntel(applyFocusTap(state, instanceId, Date.now()))));
}

export function useIntervention(kind: 'MEMORY_PULSE' | 'RISK_VETO' | 'RETARGET'): void {
  battleStore.update((state) => {
    const now = Date.now();
    if (kind === 'MEMORY_PULSE') return attachScene(hydrateBattleIntel(applyMemoryPulse(state, now)));
    if (kind === 'RISK_VETO') return attachScene(hydrateBattleIntel(applyRiskVeto(state, now)));
    return attachScene(hydrateBattleIntel(applyRetarget(state, now)));
  });
}
