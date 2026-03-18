import {
  buildAgentLink,
  buildBattleLink,
  buildCreateLink,
  buildMarketLink,
  buildDeepLink,
  buildTerminalLink,
  buildWorldLink,
} from '$lib/utils/deepLinks';

export type AppSurfaceId =
  | 'home'
  | 'mission'
  | 'create'
  | 'terminal'
  | 'world'
  | 'battle'
  | 'agent'
  | 'market';

export interface AppSurface {
  id: AppSurfaceId;
  label: string;
  shortLabel: string;
  mobileIcon: string;
  description: string;
  homeDetail: string;
  href: string;
  activePatterns: string[];
}

const SURFACE_MAP: Record<AppSurfaceId, AppSurface> = {
  home: {
    id: 'home',
    label: 'Home',
    shortLabel: 'HOME',
    mobileIcon: '⌂',
    description: 'understand the loop and choose the next action',
    homeDetail: 'start here',
    href: buildDeepLink('/'),
    activePatterns: ['/'],
  },
  mission: {
    id: 'mission',
    label: 'Mission',
    shortLabel: 'MSN',
    mobileIcon: '◎',
    description: 'create, train, and prove the agent in one guided flow',
    homeDetail: 'guided loop',
    href: buildCreateLink(),
    activePatterns: ['/create', '/terminal', '/world', '/arena', '/arena-war', '/arena-v2'],
  },
  create: {
    id: 'create',
    label: 'Create',
    shortLabel: 'CRT',
    mobileIcon: '+',
    description: 'mint the character-agent and bind the brain',
    homeDetail: 'mint and bind',
    href: buildCreateLink(),
    activePatterns: ['/create'],
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    shortLabel: 'TERM',
    mobileIcon: '~',
    description: 'train the brain and inspect readiness',
    homeDetail: 'train the brain',
    href: buildTerminalLink(),
    activePatterns: ['/terminal'],
  },
  world: {
    id: 'world',
    label: 'World',
    shortLabel: 'WRLD',
    mobileIcon: '◌',
    description: 'legacy mission mode for world traversal and scenario staging',
    homeDetail: 'internal mission mode',
    href: buildWorldLink(),
    activePatterns: ['/world'],
  },
  battle: {
    id: 'battle',
    label: 'Arena',
    shortLabel: 'ARNA',
    mobileIcon: '⚔',
    description: 'resolve live encounters under pressure',
    homeDetail: 'prove the run',
    href: buildBattleLink(),
    activePatterns: ['/arena', '/arena-war', '/arena-v2'],
  },
  agent: {
    id: 'agent',
    label: 'Agent',
    shortLabel: 'AGENT',
    mobileIcon: '@',
    description: 'grow proof, train memory, and manage the agent hub',
    homeDetail: 'grow and review',
    href: buildAgentLink(),
    activePatterns: ['/agent', '/lab', '/passport', '/agents'],
  },
  market: {
    id: 'market',
    label: 'Market',
    shortLabel: 'MKT',
    mobileIcon: '#',
    description: 'follow signals, proof, and public trust',
    homeDetail: 'public context',
    href: buildMarketLink(),
    activePatterns: ['/signals', '/market', '/oracle', '/creator'],
  },
};

export const DESKTOP_NAV_SURFACES = [
  SURFACE_MAP.mission,
  SURFACE_MAP.agent,
  SURFACE_MAP.market,
] as const;

export const MOBILE_NAV_SURFACES = [
  SURFACE_MAP.home,
  SURFACE_MAP.mission,
  SURFACE_MAP.agent,
  SURFACE_MAP.market,
] as const;

export const HOME_SURFACES = [
  SURFACE_MAP.mission,
  SURFACE_MAP.agent,
  SURFACE_MAP.market,
] as const;

export function getAppSurface(id: AppSurfaceId): AppSurface {
  return SURFACE_MAP[id];
}

export function isAppSurfaceActive(id: AppSurfaceId, pathname: string): boolean {
  const surface = SURFACE_MAP[id];
  return surface.activePatterns.some((pattern) => matchesPattern(pathname, pattern));
}

function matchesPattern(pathname: string, pattern: string): boolean {
  return pathname === pattern || pathname.startsWith(`${pattern}/`);
}
