import type { GameState } from '../entities/types';
import { SAVE_KEY } from '../entities/constants';

export function saveGame(state: GameState): void {
  state.lastSaveTime = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as GameState;
    migrateState(state);
    return state;
  } catch {
    return null;
  }
}

/** Patch old saves missing new fields */
function migrateState(state: GameState): void {
  for (const row of state.tiles) {
    for (const tile of row) {
      if (tile.assignedCrop === undefined) {
        tile.assignedCrop = tile.type === 'soil' ? 'carrot' : null;
      }
    }
  }
}

export function getOfflineTime(state: GameState): number {
  if (!state.lastSaveTime) return 0;
  return Date.now() - state.lastSaveTime;
}
