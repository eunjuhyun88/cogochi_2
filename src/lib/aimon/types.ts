export type AiMonType =
  | 'Momentum'
  | 'MeanReversion'
  | 'Flow'
  | 'Derivatives'
  | 'Sentiment'
  | 'Macro';

export type MarketRegime = 'TREND' | 'RANGE';
export type AgentState = 'IDLE' | 'SCAN' | 'LOCK' | 'CAST' | 'CLASH' | 'EXECUTE' | 'COOLDOWN';
export type BattlePhase = 'OPEN' | 'EVIDENCE' | 'DECISION' | 'MARKET' | 'RESULT';
export type OrbKind = 'LONG' | 'SHORT' | 'RISK' | 'NEUTRAL';
export type TeamSide = 'player' | 'enemy';
export type BattleOutcome = 'WIN' | 'LOSS' | 'DRAW';
export type AgentAction = 'LONG' | 'SHORT' | 'FLAT';

export type AgentRole = 'SCOUT' | 'ANALYST' | 'RISK' | 'EXECUTOR';
export type AgentStatus = 'READY' | 'TRAINING' | 'QUEUED' | 'IN_MATCH' | 'RECOVERING';
export type DataSourceKind = 'PRICE' | 'NEWS' | 'ONCHAIN' | 'SOCIAL' | 'USER_NOTE' | 'MACRO';
export type ToolKind = 'RETRIEVER' | 'SUMMARIZER' | 'SCORER' | 'RISK_FILTER';
export type MemoryKind = 'MATCH_SUMMARY' | 'FAILURE_CASE' | 'SUCCESS_CASE' | 'PLAYBOOK' | 'USER_NOTE';
export type TrainingRunType = 'PROMPT_TUNE' | 'RETRIEVAL_TUNE' | 'MEMORY_COMPACT' | 'SFT' | 'LORA' | 'CPT';
export type TrainingJobType = TrainingRunType;
export type TrainingJobState =
  | 'DRAFT'
  | 'QUEUED'
  | 'VALIDATING'
  | 'READY'
  | 'RUNNING'
  | 'EVALUATING'
  | 'PROMOTABLE'
  | 'PROMOTED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELED';
export type TrainingRunStatus = TrainingJobState;
export type TrainingJobId = string;
export type MatchMode = 'PVE_BENCHMARK' | 'GHOST_DUEL' | 'ASYNC_PVP';
export type AgentConfidenceStyle = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type AgentHorizon = 'SCALP' | 'INTRADAY' | 'SWING';
export type SquadTacticPreset = 'BALANCED' | 'TREND' | 'DEFENSIVE' | 'EXPERIMENTAL';
export type RuntimeInferenceMode = 'HEURISTIC' | 'OLLAMA' | 'OPENAI_COMPAT';
export type FailureMode =
  | 'REGIME_MISMATCH'
  | 'OVERCONFIDENCE'
  | 'UNDERCONFIDENCE'
  | 'LATE_ENTRY'
  | 'EARLY_EXIT'
  | 'RETRIEVAL_MISS'
  | 'RETRIEVAL_NOISE'
  | 'EVIDENCE_CONFLICT_IGNORED'
  | 'RISK_GUARD_BREACH'
  | 'TOOL_MISUSE'
  | 'SQUAD_COORDINATION_BREAK'
  | 'POLICY_DOCTRINE_VIOLATION'
  | 'DATA_SCOPE_VIOLATION'
  | 'JSON_SCHEMA_INVALID'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_EMPTY_OUTPUT';

export interface AiMonStats {
  detection: number;
  prediction: number;
  risk: number;
  speed: number;
}

export interface AiMonDexEntry {
  id: string;
  dexNo: string;
  name: string;
  type: AiMonType;
  color: string;
  accent: string;
  counterType: AiMonType;
  evolvesTo?: string;
  evolvesAtXp?: number;
  description: string;
  signatureMoves: string[];
  baseStats: AiMonStats;
}

export interface BaseModelDefinition {
  id: string;
  family: string;
  variant: string;
  provider: 'OLLAMA' | 'OPENAI_COMPAT';
  parameterScale: 'SMALL' | 'MEDIUM' | 'LARGE';
  contextWindow: number;
  supportsJsonMode: boolean;
  supportsToolUse: boolean;
}

export interface RetrievalPolicy {
  topK: number;
  recencyWeight: number;
  similarityWeight: number;
  successWeight: number;
  importanceWeight: number;
  roleMatchWeight: number;
  regimeMatchWeight: number;
}

export interface TrainingLoadoutTemplate {
  systemPrompt: string;
  rolePrompt: string;
  policyPrompt: string;
  enabledDataSourceKinds: DataSourceKind[];
  enabledToolKinds: ToolKind[];
  riskTolerance: number;
  confidenceStyle: AgentConfidenceStyle;
  horizon: AgentHorizon;
}

export interface TrainingLoadout {
  systemPrompt: string;
  rolePrompt: string;
  policyPrompt: string;
  enabledDataSourceIds: string[];
  enabledToolIds: string[];
  riskTolerance: number;
  confidenceStyle: AgentConfidenceStyle;
  horizon: AgentHorizon;
  retrievalPolicy: RetrievalPolicy;
  outputSchemaVersion: string;
  retrainingPath: string;
  focusSkill: string;
  indicators: string[];
  readout: string;
  behaviorNote: string;
}

export interface AgentArchetype {
  id: string;
  name: string;
  fantasy: string;
  visualType: AiMonType;
  defaultRole: AgentRole;
  defaultLoadout: TrainingLoadoutTemplate;
  starterTags: string[];
}

export interface AgentRecord {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  lastOutcome?: BattleOutcome;
  lastMatchAt?: number;
}

export interface AgentProgression {
  specializationTier: number;
  unlockedToolIds: string[];
  unlockedDataSourceIds: string[];
  memoryCapacityBonus: number;
}

export interface OwnedAgent {
  id: string;
  speciesId: string;
  name: string;
  archetypeId: string;
  baseModelId: string;
  activeArtifactId?: string;
  role: AgentRole;
  status: AgentStatus;
  level: number;
  xp: number;
  bond: number;
  specializationTags: string[];
  loadout: TrainingLoadout;
  memoryBankId: string;
  record: AgentRecord;
  progression: AgentProgression;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerProfile {
  trainerLevel: number;
  researchPoints: number;
  battleCount: number;
  wins: number;
  unlockedSystems: string[];
  activeBaseModelId: string;
}

export interface DataSourceBinding {
  id: string;
  kind: DataSourceKind;
  name: string;
  enabled: boolean;
  qualityScore: number;
  config: Record<string, string | number | boolean>;
  lastSyncedAt?: number;
}

export interface ToolBinding {
  id: string;
  kind: ToolKind;
  name: string;
  enabled: boolean;
  description: string;
}

export interface MemoryRecord {
  id: string;
  agentId: string;
  kind: MemoryKind;
  title: string;
  summary: string;
  lesson: string;
  tags: string[];
  role: AgentRole;
  regime: string;
  symbol: string;
  timeframe: string;
  sourceIds: string[];
  successScore: number;
  importance: number;
  retrievalCount: number;
  createdAt: number;
  lastRetrievedAt?: number;
}

export interface MemoryBank {
  id: string;
  agentId: string;
  capacity: number;
  compactionLevel: number;
  records: MemoryRecord[];
}

export interface BattleRetrievedMemory {
  id: string;
  title: string;
  lesson: string;
  kind: MemoryKind;
  score: number;
}

export interface ScenarioEvidenceItem {
  kind: DataSourceKind;
  sourceId: string;
  title: string;
  summary: string;
  score?: number;
}

export interface ScenarioPacket {
  scenarioId: string;
  label: string;
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
  evidence: ScenarioEvidenceItem[];
  generatedAt: number;
}

export interface BattleRetrievalFeedItem {
  ownedAgentId: string;
  agentName: string;
  role: AgentRole;
  readout: string;
  decisionHint: string;
  memoryScore: number;
  retrievedMemories: BattleRetrievedMemory[];
}

export interface AgentDecisionContext {
  ownedAgentId: string;
  agentName: string;
  speciesId: string;
  role: AgentRole;
  tacticPreset: SquadTacticPreset;
  baseModelId: string;
  readout: string;
  behaviorNote: string;
  riskTolerance: number;
  confidenceStyle: AgentConfidenceStyle;
  horizon: AgentHorizon;
  activeDataSourceIds: string[];
  activeDataSourceKinds: DataSourceKind[];
  allowedDataSourceKinds: DataSourceKind[];
  disallowedDataSourceKinds: DataSourceKind[];
  activeToolIds: string[];
  scenario: {
    id: string;
    label: string;
    objective: string;
  };
  market: {
    symbol: string;
    timeframe: string;
    regime: MarketRegime;
    price: number;
    priceChange5m: number;
    volatility: number;
    fearGreed: number;
    fundingRate: number;
    openInterestChange: number;
  };
  retrievedMemories: BattleRetrievedMemory[];
  squadNotes: string[];
}

export interface AgentDecisionTrace {
  ownedAgentId: string;
  agentName: string;
  role: AgentRole;
  action: AgentAction;
  confidence: number;
  thesis: string;
  invalidation: string;
  evidenceTitles: string[];
  generatedAt: number;
  providerId?: string;
  providerLabel?: string;
  fallbackUsed?: boolean;
  latencyMs?: number;
  providerError?: string;
}

export interface AgentContextPacket {
  agentId: string;
  agentName: string;
  role: AgentRole;
  baseModelId: string;
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
  activeToolIds: string[];
  retrievedMemories: BattleRetrievedMemory[];
  squadNotes: string[];
  outputSchemaVersion: string;
}

export interface RuntimeConfig {
  mode: RuntimeInferenceMode;
  baseUrl: string;
  modelId: string;
  apiKey: string;
  temperature: number;
  timeoutMs: number;
}

export interface RuntimeState {
  config: RuntimeConfig;
  lastTestedAt?: number;
  lastStatus: 'IDLE' | 'OK' | 'ERROR';
  lastMessage: string;
}

export interface PromptVariant {
  id: string;
  agentId: string;
  label: string;
  systemPrompt: string;
  rolePrompt: string;
  policyPrompt: string;
  createdAt: number;
}

export interface SftTrainingExample {
  id: string;
  agentId: string;
  scenarioId: string;
  benchmarkPackId: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  qualityScore: number;
  createdAt: number;
}

export interface PreferenceTrainingExample {
  id: string;
  agentId: string;
  scenarioId: string;
  benchmarkPackId: string;
  prompt: string;
  chosen: string;
  rejected: string;
  failureMode: FailureMode;
  qualityScore: number;
  createdAt: number;
}

export interface TrainingDatasetBundle {
  id: string;
  agentIds: string[];
  benchmarkPackId: string;
  sourceMatchId: string;
  sftExamples: SftTrainingExample[];
  preferenceExamples: PreferenceTrainingExample[];
  trainIds: string[];
  validIds: string[];
  testIds: string[];
  createdAt: number;
}

export interface FineTuneJobPayload {
  trainingJobId: string;
  agentId: string;
  baseModelId: string;
  benchmarkPackId: string;
  kind: 'SFT' | 'LORA';
  trainSftExamples: SftTrainingExample[];
  validSftExamples: SftTrainingExample[];
  testSftExamples: SftTrainingExample[];
  preferenceExamples: PreferenceTrainingExample[];
  createdAt: number;
}

export interface FineTuneArtifactManifest {
  artifactId: string;
  agentId: string;
  baseModelId: string;
  trainingJobId: string;
  benchmarkPackId: string;
  kind: 'PROMPT_VARIANT' | 'SFT' | 'LORA';
  formatVersion: string;
  storageUri: string;
  metrics: EvalMetrics;
  config: {
    provider: 'OLLAMA' | 'OPENAI_COMPAT' | 'LOCAL';
    model: string;
    epochs?: number;
    learningRate?: number;
    rank?: number;
    alpha?: number;
    batchSize?: number;
  };
  createdAt: number;
}

export interface ModelArtifact {
  id: string;
  agentId: string;
  baseModelId: string;
  benchmarkPackId: string;
  trainingJobId: string;
  kind: 'PROMPT_VARIANT' | 'SFT' | 'LORA';
  label: string;
  storageUri: string;
  status: 'CANDIDATE' | 'ACTIVE' | 'ROLLED_BACK';
  metrics: EvalMetrics;
  createdAt: number;
  promotedAt?: number;
}

export interface ArtifactLineageRecord {
  id: string;
  artifactId: string;
  agentId: string;
  event: 'CREATED' | 'PROMOTED' | 'ROLLED_BACK';
  trainingJobId?: string;
  benchmarkPackId: string;
  sourceDatasetBundleIds: string[];
  promotedFromArtifactId?: string;
  basePromptVariantId?: string;
  retrievalPolicyVersion?: string;
  memoryCompactionLevel?: number;
  note: string;
  createdAt: number;
}

export interface TrainingRun {
  id: TrainingJobId;
  agentId: string;
  type: TrainingJobType;
  state: TrainingJobState;
  hypothesis: string;
  requestedBy: 'PLAYER' | 'SYSTEM';
  benchmarkPackId: string;
  changes: string[];
  payload: Record<string, unknown>;
  validationErrors: string[];
  beforeVersion: string;
  afterVersion: string;
  metricsBefore?: EvalMetrics;
  metricsAfter?: EvalMetrics;
  resultArtifactId?: string;
  resultMetrics?: EvalMetrics;
  promotion?: PromotionCandidateComparison;
  status: TrainingRunStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export type TrainingJob = TrainingRun;

export interface TrainingJobResult {
  ok: boolean;
  state: TrainingJobState;
  message: string;
  artifactId?: string;
  metrics?: EvalMetrics;
  comparison?: PromotionCandidateComparison;
  validationErrors?: string[];
}

export interface SquadRoleMap {
  scout?: string;
  analyst?: string;
  risk?: string;
  executor?: string;
}

export interface Squad {
  id: string;
  name: string;
  memberAgentIds: string[];
  roleMap: SquadRoleMap;
  tacticPreset: SquadTacticPreset;
}

export interface EvalScoreWeights {
  returnWeight: number;
  riskWeight: number;
  accuracyWeight: number;
  calibrationWeight: number;
  reasoningWeight: number;
  coordinationWeight: number;
}

export interface EvalScenario {
  id: string;
  label: string;
  brief: string;
  mode: MatchMode;
  symbol: string;
  timeframe: string;
  marketWindowId: string;
  objective: string;
  allowedDataSourceKinds: DataSourceKind[];
  scoringWeights: EvalScoreWeights;
  targetRegime: MarketRegime;
  startingPrice: number;
  baselinePriceChange5m: number;
  baselineVolatility: number;
  baselineFearGreed: number;
  baselineFundingRate: number;
  baselineOpenInterestChange: number;
  opponentSnapshotId?: string;
  scenarioStartAt: number;
}

export type EvalScenarioTemplate = Omit<EvalScenario, 'scenarioStartAt'>;

export interface SquadSnapshot {
  memberNames: string[];
  roles: AgentRole[];
  summarizedPolicies: string[];
}

export interface OpponentSnapshot {
  id: string;
  label: string;
  squad: SquadSnapshot;
  createdAt: number;
}

export interface EvalMetrics {
  returnScore: number;
  riskScore: number;
  accuracyScore: number;
  calibrationScore: number;
  reasoningScore: number;
  coordinationScore: number;
  totalScore: number;
}

export interface PromotionCandidateComparison {
  benchmarkPackId: string;
  baselineArtifactId?: string;
  candidateArtifactId?: string;
  passed: boolean;
  reasons: string[];
  deltas: {
    total: number;
    returnScore: number;
    riskScore: number;
    accuracyScore: number;
    calibrationScore: number;
    reasoningScore: number;
    coordinationScore: number;
  };
}

export interface ReflectionNote {
  id: string;
  agentId: string;
  scenarioId: string;
  verdict: 'GOOD' | 'MIXED' | 'BAD';
  failureMode: FailureMode | null;
  lesson: string;
  actionChange?: string;
  confidenceDelta?: number;
  retrievalDelta?: string;
  promptDelta?: string;
  createdAt: number;
}

export interface AgentEvalResult {
  agentId: string;
  action: AgentAction;
  confidence: number;
  accuracyScore: number;
  coordinationScore: number;
  reasoningScore: number;
  xpGain: number;
  bondGain: number;
  memoryWrites: MemoryRecord[];
  reasoningSummary?: string;
  evidenceTitles?: string[];
  failureMode?: FailureMode | null;
  reflection?: ReflectionNote;
}

export interface RewardPacket {
  trainerResearchGain: number;
  unlockProgressGain: number;
  agentXpGain: Record<string, number>;
  agentBondGain: Record<string, number>;
}

export interface EvalMatchResult {
  id: string;
  scenarioId: string;
  squadId: string;
  outcome: BattleOutcome;
  teamMetrics: EvalMetrics;
  agentResults: AgentEvalResult[];
  rewards: RewardPacket;
  lessons: string[];
  reflections?: ReflectionNote[];
  contextPackets?: Record<string, AgentContextPacket>;
  datasetBundleId?: string;
  benchmarkManifestId?: string;
  createdAt: number;
}

export interface BenchmarkRunManifest {
  runId: string;
  profile: string;
  benchmarkPackId: string;
  scenarioId: string;
  squadId: string;
  primaryArtifactId?: string;
  artifactIds: string[];
  runtime: {
    mode: RuntimeInferenceMode;
    baseUrl: string;
    modelId: string;
    temperature: number;
    timeoutMs: number;
  };
  system: {
    cpuLoadPct: number;
    memoryUsedGb: number;
    warmCache: boolean;
  };
  fallbackCount: number;
  invalidJsonCount: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  traceValidityRate: number;
  scenarioSeedVersion: string;
  authoritative: boolean;
  startedAt: number;
  finishedAt: number;
}

export interface RosterState {
  agents: OwnedAgent[];
  selectedAgentId: string | null;
}

export interface SquadState {
  activeSquad: Squad;
  savedSquads: Squad[];
}

export interface LabState {
  baseModels: BaseModelDefinition[];
  dataSources: DataSourceBinding[];
  tools: ToolBinding[];
  memoryBanks: MemoryBank[];
  trainingRuns: TrainingRun[];
  promptVariants: PromptVariant[];
  datasetBundles: TrainingDatasetBundle[];
  modelArtifacts: ModelArtifact[];
  artifactLineage: ArtifactLineageRecord[];
}

export interface MatchState {
  selectedScenarioId: string;
  activeScenario: EvalScenario | null;
  currentPhase: BattlePhase | 'IDLE';
  recentResults: EvalMatchResult[];
  recentBenchmarkRuns: BenchmarkRunManifest[];
}

export interface MarketState {
  tick: number;
  timestamp: number;
  price: number;
  priceChange5m: number;
  volatility: number;
  fearGreed: number;
  fundingRate: number;
  openInterestChange: number;
  regime: MarketRegime;
  regimeStrength: number;
}

export interface AiMonInstance {
  instanceId: string;
  ownedAgentId: string;
  dexId: string;
  slot: number;
  team: TeamSide;
  name: string;
  type: AiMonType;
  level: number;
  xp: number;
  state: AgentState;
  stateEnteredAt: number;
  focusTapUntil: number;
  currentTarget?: string;
  lastOrbAt: number;
  position: {
    x: number;
    y: number;
  };
  recentAccuracy: number;
  stats: AiMonStats;
  role: AgentRole | null;
  readout: string;
  decisionHint: string;
  memoryScore: number;
  activeDataSourceCount: number;
  activeToolCount: number;
  retrievedMemories: BattleRetrievedMemory[];
  plannedAction: AgentAction;
}

export interface SignalOrb {
  id: string;
  ownerId: string;
  team: TeamSide;
  type: AiMonType;
  kind: OrbKind;
  strength: number;
  confidence: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  absorbed: boolean;
}

export interface SignalInteractionEvent {
  id: string;
  kind: 'AMPLIFY' | 'COUNTER' | 'CLASH';
  label: string;
  ownerIds: string[];
  orbIds: string[];
  at: number;
}

export interface BattleResult {
  outcome: BattleOutcome;
  consensus: number;
  openingPrice: number;
  closingPrice: number;
  priceDeltaPct: number;
  xpGain: number;
  researchGain: number;
  note: string;
}

export interface BattleState {
  phase: BattlePhase;
  phaseStartedAt: number;
  phaseRemainingMs: number;
  market: MarketState;
  openingPrice: number;
  playerTeam: AiMonInstance[];
  enemyTeam: AiMonInstance[];
  orbs: SignalOrb[];
  consensus: number;
  focusTapCharges: number;
  round: number;
  running: boolean;
  eventBanner: string;
  interactions: SignalInteractionEvent[];
  retrievalFeed: BattleRetrievalFeedItem[];
  decisionFeed: AgentDecisionTrace[];
  result: BattleResult | null;
  rewardsApplied: boolean;
}

export interface TeamSynergySummary {
  score: number;
  notes: string[];
}

export const PHASE_DURATIONS_MS: Record<BattlePhase, number> = {
  OPEN: 5_000,
  EVIDENCE: 35_000,
  DECISION: 10_000,
  MARKET: 20_000,
  RESULT: 10_000
};
