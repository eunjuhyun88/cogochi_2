import type { AgentAction, AgentDecisionContext, AgentDecisionTrace, RuntimeConfig } from '../types';

export interface AgentModelProvider {
  id: string;
  label: string;
  decide(context: AgentDecisionContext): AgentDecisionTrace | Promise<AgentDecisionTrace>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sign(value: number): number {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function inferMemoryTilt(context: AgentDecisionContext): number {
  return context.retrievedMemories.reduce((total, memory) => {
    if (memory.kind === 'SUCCESS_CASE' || memory.kind === 'PLAYBOOK') return total + memory.score;
    if (memory.kind === 'FAILURE_CASE') return total - memory.score;
    if (memory.kind === 'USER_NOTE') {
      const lowerLesson = memory.lesson.toLowerCase();
      if (lowerLesson.includes('avoid') || lowerLesson.includes('limit') || lowerLesson.includes('wait')) {
        return total - memory.score * 0.6;
      }
      return total + memory.score * 0.35;
    }
    return total + memory.score * 0.1;
  }, 0);
}

function inferMarketTilt(context: AgentDecisionContext): number {
  const direction = sign(context.market.priceChange5m);
  const trendBias = context.market.regime === 'TREND' ? direction * 0.22 : direction * -0.08;
  const fearGreedBias = (context.market.fearGreed - 50) / 100;
  const fundingBias = clamp(context.market.fundingRate * 200, -0.2, 0.2);
  const oiBias = clamp(context.market.openInterestChange / 10, -0.25, 0.25);
  const volatilityPenalty = context.market.volatility > 0.42 ? 0.14 : 0;

  return trendBias + fearGreedBias + fundingBias + oiBias - volatilityPenalty;
}

function inferScenarioAdjustment(context: AgentDecisionContext): number {
  const objective = context.scenario.objective.toLowerCase();
  const direction = sign(context.market.priceChange5m);
  const restrictionPenalty = context.disallowedDataSourceKinds.length * 0.14;

  let objectiveBias = 0;
  if (objective.includes('directional continuation') || objective.includes('breakout')) {
    objectiveBias += direction * 0.08;
  }
  if (objective.includes('fade') || objective.includes('range')) {
    objectiveBias -= direction * 0.07;
  }
  if (objective.includes('preserve capital') || objective.includes('calibrated conviction')) {
    objectiveBias -= sign(direction) * 0.04;
  }

  return objectiveBias - restrictionPenalty;
}

function inferRoleAdjustment(context: AgentDecisionContext, baseTilt: number): number {
  const tacticBias =
    context.tacticPreset === 'TREND'
      ? sign(context.market.priceChange5m) * 0.1
      : context.tacticPreset === 'DEFENSIVE'
        ? -0.08 * sign(baseTilt)
        : context.tacticPreset === 'EXPERIMENTAL'
          ? 0.04
          : 0;

  if (context.role === 'RISK') {
    return baseTilt * 0.55 - context.market.volatility * 0.18 - (1 - context.riskTolerance) * 0.12 + tacticBias * 0.3;
  }
  if (context.role === 'SCOUT') {
    return baseTilt * 1.08 + sign(context.market.priceChange5m) * 0.08 + tacticBias;
  }
  if (context.role === 'EXECUTOR') {
    return baseTilt + context.retrievedMemories.length * 0.03 + tacticBias;
  }
  return baseTilt * 0.92 + tacticBias * 0.6;
}

function resolveAction(signal: number, context: AgentDecisionContext): AgentAction {
  const threshold = context.role === 'RISK' ? 0.18 : 0.12;
  if (signal >= threshold) return 'LONG';
  if (signal <= -threshold) return 'SHORT';
  return 'FLAT';
}

function buildInvalidation(action: AgentAction, context: AgentDecisionContext): string {
  if (action === 'LONG') {
    return context.market.regime === 'TREND'
      ? 'Abort if momentum decays and open interest rolls over.'
      : 'Abort if range support fails and volatility spikes.';
  }

  if (action === 'SHORT') {
    return context.market.regime === 'TREND'
      ? 'Abort if trend continuation resumes with positive breadth.'
      : 'Abort if mean reversion bounces and fear/greed recovers.';
  }

  return 'Stay flat until regime confidence or evidence quality improves.';
}

function buildThesis(action: AgentAction, context: AgentDecisionContext, memoryTilt: number): string {
  const regimePhrase = `${context.market.regime.toLowerCase()} regime with ${context.market.priceChange5m >= 0 ? 'positive' : 'negative'} short-term drift`;
  const tacticPhrase = `${context.tacticPreset.toLowerCase()} squad preset`;
  const scenarioPhrase = `${context.scenario.label} objective is "${context.scenario.objective}"`;
  const memoryPhrase =
    context.retrievedMemories.length > 0
      ? `Retrieved ${context.retrievedMemories.length} memory cards and the top lesson was "${context.retrievedMemories[0].title}".`
      : 'No relevant memory cards were retrieved, so the agent is leaning on the live market packet only.';
  const restrictionPhrase =
    context.disallowedDataSourceKinds.length > 0
      ? ` Active data policy mismatch: ${context.disallowedDataSourceKinds.join(', ')} should be disabled for this eval.`
      : '';

  if (action === 'LONG') {
    return `${context.readout} sees a ${regimePhrase} under the ${tacticPhrase}. ${scenarioPhrase}. ${memoryPhrase} Net memory tilt ${memoryTilt.toFixed(2)} supports upside continuation.${restrictionPhrase}`;
  }

  if (action === 'SHORT') {
    return `${context.readout} sees a ${regimePhrase} under the ${tacticPhrase}. ${scenarioPhrase}. ${memoryPhrase} Net memory tilt ${memoryTilt.toFixed(2)} supports downside pressure or fade.${restrictionPhrase}`;
  }

  return `${context.readout} sees mixed evidence in a ${regimePhrase} under the ${tacticPhrase}. ${scenarioPhrase}. ${memoryPhrase} The setup does not clear the confidence threshold yet.${restrictionPhrase}`;
}

function decideHeuristically(context: AgentDecisionContext): AgentDecisionTrace {
  const startedAt = Date.now();
  const memoryTilt = inferMemoryTilt(context);
  const marketTilt = inferMarketTilt(context);
  const scenarioAdjustment = inferScenarioAdjustment(context);
  const combinedSignal = inferRoleAdjustment(context, marketTilt + memoryTilt * 0.18 + scenarioAdjustment);
  const action = resolveAction(combinedSignal, context);
  const baseConfidence = 0.46 + Math.abs(combinedSignal) * 0.5 + context.retrievedMemories.length * 0.02;
  const styleBias =
    context.confidenceStyle === 'AGGRESSIVE'
      ? 0.06
      : context.confidenceStyle === 'CONSERVATIVE'
        ? -0.05
        : 0;
  const confidence = clamp(baseConfidence + styleBias - context.disallowedDataSourceKinds.length * 0.06, 0.22, 0.95);

  return {
    ownedAgentId: context.ownedAgentId,
    agentName: context.agentName,
    role: context.role,
    action,
    confidence,
    thesis: buildThesis(action, context, memoryTilt),
    invalidation: buildInvalidation(action, context),
    evidenceTitles: context.retrievedMemories.slice(0, 3).map((memory) => memory.title),
    generatedAt: Date.now(),
    latencyMs: Date.now() - startedAt,
    providerId: heuristicModelProvider.id,
    providerLabel: heuristicModelProvider.label
  };
}

export const heuristicModelProvider: AgentModelProvider = {
  id: 'heuristic-local-v1',
  label: 'Heuristic Local Adapter',
  decide(context) {
    return decideHeuristically(context);
  }
};

function buildExternalPrompt(context: AgentDecisionContext): string {
  return [
    'You are an evaluation agent in AIMON.',
    'Return only valid JSON with keys: action, confidence, thesis, invalidation, evidenceTitles.',
    'action must be LONG, SHORT, or FLAT.',
    `Agent: ${context.agentName} (${context.role})`,
    `Tactic preset: ${context.tacticPreset}`,
    `Scenario: ${context.scenario.label}`,
    `Scenario objective: ${context.scenario.objective}`,
    `Readout: ${context.readout}`,
    `Behavior note: ${context.behaviorNote}`,
    `Active data kinds: ${context.activeDataSourceKinds.join(', ') || 'none'}`,
    `Allowed data kinds: ${context.allowedDataSourceKinds.join(', ') || 'none'}`,
    `Disallowed data kinds: ${context.disallowedDataSourceKinds.join(', ') || 'none'}`,
    `Market: regime=${context.market.regime}, price=${context.market.price.toFixed(2)}, priceChange5m=${context.market.priceChange5m.toFixed(2)}, volatility=${context.market.volatility.toFixed(2)}, fearGreed=${context.market.fearGreed.toFixed(0)}, funding=${context.market.fundingRate.toFixed(4)}, oiChange=${context.market.openInterestChange.toFixed(2)}`,
    `Retrieved memories: ${context.retrievedMemories.map((memory) => `${memory.title} (${memory.kind})`).join(' | ') || 'none'}`,
    `Squad notes: ${context.squadNotes.join(' | ') || 'none'}`
  ].join('\n');
}

function createFallbackTrace(context: AgentDecisionContext, errorMessage: string): AgentDecisionTrace {
  const fallback = decideHeuristically(context);
  return {
    ...fallback,
    thesis: `${fallback.thesis} External provider fallback: ${errorMessage}`,
    providerId: fallback.providerId,
    providerLabel: fallback.providerLabel,
    fallbackUsed: true,
    providerError: errorMessage
  };
}

function sanitizeAction(value: unknown): AgentAction | null {
  if (value === 'LONG' || value === 'SHORT' || value === 'FLAT') return value;
  return null;
}

function parseDecisionPayload(payload: unknown, context: AgentDecisionContext): AgentDecisionTrace | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const action = sanitizeAction(record.action);
  const confidence = typeof record.confidence === 'number' ? clamp(record.confidence, 0.05, 0.99) : null;
  const thesis = typeof record.thesis === 'string' ? record.thesis.trim() : null;
  const invalidation = typeof record.invalidation === 'string' ? record.invalidation.trim() : null;
  const evidenceTitles = Array.isArray(record.evidenceTitles)
    ? record.evidenceTitles.filter((item): item is string => typeof item === 'string').slice(0, 5)
    : context.retrievedMemories.slice(0, 3).map((memory) => memory.title);

  if (!action || confidence === null || !thesis || !invalidation) return null;

  return {
    ownedAgentId: context.ownedAgentId,
    agentName: context.agentName,
    role: context.role,
    action,
    confidence,
    thesis,
    invalidation,
    evidenceTitles,
    generatedAt: Date.now()
  };
}

function extractTextFromProviderResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.response === 'string') return record.response;
  if (typeof record.message === 'object' && record.message && typeof (record.message as Record<string, unknown>).content === 'string') {
    return (record.message as Record<string, string>).content;
  }

  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (first && typeof first === 'object') {
      const choice = first as Record<string, unknown>;
      if (typeof choice.message === 'object' && choice.message && typeof (choice.message as Record<string, unknown>).content === 'string') {
        return (choice.message as Record<string, string>).content;
      }
      if (typeof choice.text === 'string') return choice.text;
    }
  }

  if (Array.isArray(record.output)) {
    const chunks = record.output
      .flatMap((item) => (typeof item === 'object' && item && Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : []))
      .map((item) => (typeof item === 'object' && item && typeof (item as Record<string, unknown>).text === 'string' ? (item as Record<string, string>).text : ''))
      .filter(Boolean);
    if (chunks.length > 0) return chunks.join('\n');
  }

  return null;
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function callOllama(context: AgentDecisionContext, config: RuntimeConfig): Promise<AgentDecisionTrace> {
  const startedAt = Date.now();
  const response = await fetchWithTimeout(
    `${config.baseUrl.replace(/\/$/, '')}/api/chat`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: config.modelId,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: 'Return only valid JSON.'
          },
          {
            role: 'user',
            content: buildExternalPrompt(context)
          }
        ],
        options: {
          temperature: config.temperature
        }
      })
    },
    config.timeoutMs
  );

  if (!response.ok) {
    throw new Error(`Ollama request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const text = extractTextFromProviderResponse(payload);
  const parsed = text ? parseDecisionPayload(extractJsonObject(text), context) : null;
  if (!parsed) throw new Error('Ollama response did not contain valid decision JSON');

  return {
    ...parsed,
    latencyMs: Date.now() - startedAt,
    providerId: 'ollama',
    providerLabel: `Ollama · ${config.modelId}`
  };
}

async function callOpenAICompatible(context: AgentDecisionContext, config: RuntimeConfig): Promise<AgentDecisionTrace> {
  const startedAt = Date.now();
  const response = await fetchWithTimeout(
    `${config.baseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: config.modelId,
        temperature: config.temperature,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Return only valid JSON.'
          },
          {
            role: 'user',
            content: buildExternalPrompt(context)
          }
        ]
      })
    },
    config.timeoutMs
  );

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const text = extractTextFromProviderResponse(payload);
  const parsed = text ? parseDecisionPayload(extractJsonObject(text), context) : null;
  if (!parsed) throw new Error('OpenAI-compatible response did not contain valid decision JSON');

  return {
    ...parsed,
    latencyMs: Date.now() - startedAt,
    providerId: 'openai-compatible',
    providerLabel: `OpenAI Compat · ${config.modelId}`
  };
}

export function runAgentDecision(context: AgentDecisionContext): AgentDecisionTrace {
  return decideHeuristically(context);
}

export async function runRuntimeAgentDecision(context: AgentDecisionContext, config: RuntimeConfig): Promise<AgentDecisionTrace> {
  if (config.mode === 'HEURISTIC') {
    return runAgentDecision(context);
  }

  try {
    if (config.mode === 'OLLAMA') {
      return await callOllama(context, config);
    }

    return await callOpenAICompatible(context, config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown runtime error';
    return createFallbackTrace(context, message);
  }
}

export async function testRuntimeConnection(config: RuntimeConfig): Promise<{ ok: boolean; message: string }> {
  if (config.mode === 'HEURISTIC') {
    return {
      ok: true,
      message: 'Heuristic runtime does not require an external connection.'
    };
  }

  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const target =
      config.mode === 'OLLAMA'
        ? `${baseUrl}/api/tags`
        : `${baseUrl}/models`;

    const response = await fetchWithTimeout(
      target,
      {
        headers: {
          ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {})
        }
      },
      config.timeoutMs
    );

    if (!response.ok) {
      return {
        ok: false,
        message: `Runtime responded with ${response.status}.`
      };
    }

    return {
      ok: true,
      message: `${config.mode} endpoint responded successfully.`
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown runtime error'
    };
  }
}
