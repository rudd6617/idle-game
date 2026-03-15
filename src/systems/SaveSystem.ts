import type { GameState, Tile } from '../entities/types';
import { SAVE_KEY, MAP_WIDTH, MAP_HEIGHT } from '../entities/constants';

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
  if (!state.upgrades) {
    state.upgrades = { workerSpeed: 0, growthSpeed: 0, maintenanceInterval: 0, autoHarvest: 0 };
  }
  if (!state.orders) state.orders = [];
  if (state.orderRefreshTimer === undefined) state.orderRefreshTimer = 0;
  if (!state.nextOrderId) state.nextOrderId = 1;

  // Expand map if saved size is smaller than current MAP_WIDTH/HEIGHT
  const oldH = state.tiles.length;
  const oldW = state.tiles[0]?.length ?? 0;
  if (oldH < MAP_HEIGHT || oldW < MAP_WIDTH) {
    const newTiles: Tile[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const existing = state.tiles[y]?.[x];
        if (existing) {
          row.push(existing);
        } else {
          const isEdge = x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1;
          row.push({ x, y, type: isEdge ? 'tree' : 'grass', cropId: null, assignedCrop: null });
        }
      }
      newTiles.push(row);
    }
    state.tiles = newTiles;
  }
}

export function getOfflineTime(state: GameState): number {
  if (!state.lastSaveTime) return 0;
  return Date.now() - state.lastSaveTime;
}
