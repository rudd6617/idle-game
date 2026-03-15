import type { GameState, Tile, TileType } from '../entities/types';
import { SAVE_KEY, MAP_WIDTH, MAP_HEIGHT, TILE_DEMOLISH_DEFS } from '../entities/constants';

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
  // Tile migrations
  for (const row of state.tiles) {
    for (const tile of row) {
      if (tile.assignedCrop === undefined) {
        tile.assignedCrop = tile.type === 'soil' ? 'carrot' : null;
      }
      if (tile.facilityId === undefined) tile.facilityId = null;
      if (tile.markedForDemolish === undefined) tile.markedForDemolish = false;
      // Rename old tile types BEFORE setting durability
      if ((tile.type as string) === 'tree') tile.type = 'wood';
      if ((tile.type as string) === 'blocked') tile.type = 'stone';
      const demDef = TILE_DEMOLISH_DEFS[tile.type];
      if (tile.durability === undefined || (demDef && tile.durability === 0)) {
        tile.durability = demDef?.maxDurability ?? 0;
      }
    }
  }

  if (!state.upgrades) {
    state.upgrades = { workerSpeed: 0, growthSpeed: 0, maintenanceInterval: 0, autoHarvest: 0, demolishSpeed: 0, carryCapacity: 0 };
  }
  if ((state.upgrades as any).demolishSpeed === undefined) {
    (state.upgrades as any).demolishSpeed = 0;
  }
  if ((state.upgrades as any).carryCapacity === undefined) {
    (state.upgrades as any).carryCapacity = 0;
  }

  if (!state.orders) state.orders = [];
  if (state.orderRefreshTimer === undefined) state.orderRefreshTimer = 0;
  if (!state.nextOrderId) state.nextOrderId = 1;

  const res = state.resources as any;
  if (res.crops && !res.items) {
    res.items = res.crops;
    delete res.crops;
  }
  if (!state.resources.items) state.resources.items = {};

  // Purchased blocks
  if (!state.purchasedBlocks) state.purchasedBlocks = [{ x: 0, y: 0 }];

  if (!state.facilities) state.facilities = [];
  if (!state.nextFacilityId) state.nextFacilityId = 1;
  for (const fac of state.facilities) {
    if (fac.animalCount === undefined) fac.animalCount = 0;
  }

  for (const w of state.workers) {
    // Migrate old carryingItem → carryingItems
    const wAny = w as any;
    if (wAny.carryingItem !== undefined) {
      if (wAny.carryingItem) {
        w.carryingItems = { [wAny.carryingItem]: 1 };
      } else {
        w.carryingItems = {};
      }
      delete wAny.carryingItem;
    }
    if (!w.carryingItems) w.carryingItems = {};
  }

  if (!state.unlockedCrops) state.unlockedCrops = ['carrot', 'wheat', 'tomato'];

  // Expand map
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
          row.push({ x, y, type: 'grass' as TileType, cropId: null, assignedCrop: null, facilityId: null, durability: 0, markedForDemolish: false });
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
