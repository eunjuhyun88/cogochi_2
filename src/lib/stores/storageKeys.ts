export const STORAGE_KEYS = {
  gameState: 'cogotchi_state',
  agents: 'cogotchi_agents',
  wallet: 'cogotchi_wallet',
  matchHistory: 'cogotchi_match_history',
  quickTrades: 'cogotchi_quicktrades',
  trackedSignals: 'cogotchi_tracked',
  predictPositions: 'cogotchi_predict_positions',
  community: 'cogotchi_community',
  profile: 'cogotchi_profile',
  pnl: 'cogotchi_pnl',
  dbUsers: 'cogotchi_users',
  dbMatches: 'cogotchi_matches',
  dbSignals: 'cogotchi_signals',
  dbPredictions: 'cogotchi_predictions',
  warRoomScan: 'cogotchi.warroom.scanstate.v1',
  notificationsSeeded: 'cogotchi_notifications_seeded_v1',
  activeGames: 'cogotchi_active_games',
  strategies: 'cogotchi_strategies',
} as const;

/** Keys safe to clear on user-initiated data reset (excludes session-only flags) */
export const RESETTABLE_STORAGE_KEYS: ReadonlyArray<string> = Object.values(STORAGE_KEYS)
  .filter(k => k !== STORAGE_KEYS.notificationsSeeded);
