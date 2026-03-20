import { writable } from 'svelte/store';

export interface GameState {
  currentScreen: 'hub' | 'roster' | 'battle' | 'team' | 'lab' | 'market';
  prototypeScope: {
    simulatorOnly: boolean;
    pveOnly: boolean;
    speciesCount: number;
    regimeCount: number;
  };
}

const defaultState: GameState = {
  currentScreen: 'hub',
  prototypeScope: {
    simulatorOnly: true,
    pveOnly: true,
    speciesCount: 24,
    regimeCount: 2
  }
};

export const gameStore = writable<GameState>(defaultState);

export function setScreen(screen: GameState['currentScreen']): void {
  gameStore.update((state) => ({ ...state, currentScreen: screen }));
}
