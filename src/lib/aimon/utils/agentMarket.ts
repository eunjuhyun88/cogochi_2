import { getDefaultGrowthLaneId, growthLaneById, type GrowthLaneDefinition } from '../data/growthLanes';
import type { EvalMatchResult, OwnedAgent } from '../types';

const LISTING_LEVEL_REQUIREMENT = 3;
const LISTING_BOND_REQUIREMENT = 10;
const LISTING_MATCH_REQUIREMENT = 5;
const LISTING_WIN_RATE_REQUIREMENT = 0.55;

export interface AgentPerformanceSummary {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  avgConfidence: number;
  avgAccuracy: number;
  avgCoordination: number;
  avgReasoning: number;
}

export interface AgentListingProgress {
  ready: boolean;
  completion: number;
  currentWinRate: number;
  currentMatches: number;
  needs: string[];
}

export const EMPTY_AGENT_PERFORMANCE_SUMMARY: AgentPerformanceSummary = {
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  winRate: 0,
  avgConfidence: 0,
  avgAccuracy: 0,
  avgCoordination: 0,
  avgReasoning: 0
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getAgentGrowthLane(agent: OwnedAgent): GrowthLaneDefinition {
  return growthLaneById[agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId)];
}

export function getAgentDemandScore(agent: OwnedAgent): number {
  return agent.level * 18 + agent.bond * 2 + agent.record.wins * 4 + agent.record.matches;
}

export function getAgentMonthlyFee(agent: OwnedAgent): number {
  return Math.max(18, Math.round(getAgentDemandScore(agent) * 0.45));
}

export function getAgentFeeBand(agent: OwnedAgent): { floor: number; ceiling: number } {
  const midpoint = getAgentMonthlyFee(agent);
  return {
    floor: Math.max(12, midpoint - 12),
    ceiling: midpoint + 18
  };
}

export function getAgentListingProgress(agent: OwnedAgent, results: EvalMatchResult[] = []): AgentListingProgress {
  const performance = summarizeAgentPerformance(agent.id, results);
  const currentMatches = Math.max(agent.record.matches, performance.matches);
  const currentWins = Math.max(agent.record.wins, performance.wins);
  const currentWinRate = currentMatches > 0 ? currentWins / currentMatches : 0;
  const needs: string[] = [];

  if (agent.level < LISTING_LEVEL_REQUIREMENT) {
    needs.push(`Level ${LISTING_LEVEL_REQUIREMENT} 필요 (${agent.level}/${LISTING_LEVEL_REQUIREMENT})`);
  }

  if (agent.bond < LISTING_BOND_REQUIREMENT) {
    needs.push(`Bond ${LISTING_BOND_REQUIREMENT} 필요 (${agent.bond}/${LISTING_BOND_REQUIREMENT})`);
  }

  if (currentMatches < LISTING_MATCH_REQUIREMENT) {
    needs.push(`Proof match ${LISTING_MATCH_REQUIREMENT}회 필요 (${currentMatches}/${LISTING_MATCH_REQUIREMENT})`);
  }

  if (currentWinRate < LISTING_WIN_RATE_REQUIREMENT) {
    needs.push(`Win rate ${Math.round(LISTING_WIN_RATE_REQUIREMENT * 100)}% 필요 (${Math.round(currentWinRate * 100)}%)`);
  }

  const metCount =
    Number(agent.level >= LISTING_LEVEL_REQUIREMENT) +
    Number(agent.bond >= LISTING_BOND_REQUIREMENT) +
    Number(currentMatches >= LISTING_MATCH_REQUIREMENT) +
    Number(currentWinRate >= LISTING_WIN_RATE_REQUIREMENT);

  return {
    ready: needs.length === 0,
    completion: Math.round((metCount / 4) * 100),
    currentWinRate,
    currentMatches,
    needs
  };
}

export function isAgentListable(agent: OwnedAgent, results: EvalMatchResult[] = []): boolean {
  return getAgentListingProgress(agent, results).ready;
}

export function summarizeAgentPerformance(agentId: string, results: EvalMatchResult[]): AgentPerformanceSummary {
  const relevant = results
    .map((result) => ({
      result,
      agentResult: result.agentResults.find((row) => row.agentId === agentId) ?? null
    }))
    .filter((row): row is { result: EvalMatchResult; agentResult: EvalMatchResult['agentResults'][number] } => Boolean(row.agentResult));

  if (relevant.length === 0) return EMPTY_AGENT_PERFORMANCE_SUMMARY;

  const wins = relevant.filter((row) => row.result.outcome === 'WIN').length;
  const draws = relevant.filter((row) => row.result.outcome === 'DRAW').length;
  const losses = relevant.length - wins - draws;

  return {
    matches: relevant.length,
    wins,
    draws,
    losses,
    winRate: wins / relevant.length,
    avgConfidence: average(relevant.map((row) => row.agentResult.confidence)),
    avgAccuracy: average(relevant.map((row) => row.agentResult.accuracyScore)),
    avgCoordination: average(relevant.map((row) => row.agentResult.coordinationScore)),
    avgReasoning: average(relevant.map((row) => row.agentResult.reasoningScore))
  };
}

export function getAgentTrustScore(agent: OwnedAgent, results: EvalMatchResult[]): number {
  const performance = summarizeAgentPerformance(agent.id, results);
  const score =
    agent.level * 12 +
    agent.bond * 0.8 +
    agent.record.matches * 0.3 +
    agent.record.wins * 1.8 +
    performance.winRate * 28 +
    performance.avgAccuracy * 18 +
    performance.avgReasoning * 12;

  return Math.max(12, Math.min(99, Math.round(score)));
}

export function getAgentRentalStatus(agent: OwnedAgent, results: EvalMatchResult[]): 'LISTABLE' | 'NEAR READY' | 'TRAIN MORE' {
  const performance = summarizeAgentPerformance(agent.id, results);
  const listingProgress = getAgentListingProgress(agent, results);

  if (listingProgress.ready && (performance.matches === 0 || performance.winRate >= LISTING_WIN_RATE_REQUIREMENT)) {
    return 'LISTABLE';
  }

  if (listingProgress.completion >= 50 || (agent.level >= 2 && agent.bond >= 6)) {
    return 'NEAR READY';
  }

  return 'TRAIN MORE';
}
