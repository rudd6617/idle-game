import type { GameState, Tile, TileType } from '../entities/types';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, BLOCK_SIZE, TILE_DEMOLISH_DEFS } from '../entities/constants';

function tileTypeForStartBlock(x: number, y: number): TileType {
  // Warehouse at (1,1) → grass (facility placed on top)
  if (x === 1 && y === 1) return 'grass';
  // Border ring — only wood and stone (big)
  const last = BLOCK_SIZE - 1;
  if (x === 0 || x === last || y === 0 || y === last) {
    const hash = ((x * 11 + y * 17) % 100);
    return hash < 50 ? 'wood' : 'stone';
  }
  // Center 2×2 soil
  const cx = Math.floor(BLOCK_SIZE / 2);
  const cy = Math.floor(BLOCK_SIZE / 2);
  if (x >= cx - 1 && x <= cx && y >= cy - 1 && y <= cy) return 'soil';
  // Inner area — grass with scattered small_wood and small_stone
  const hash = ((x * 11 + y * 17 + x * y * 5) % 100);
  if (hash < 15) return 'small_wood';
  if (hash < 30) return 'small_stone';
  return 'grass';
}

function tileTypeForResourceBlock(x: number, y: number): TileType {
  const hash = ((x * 7 + y * 13 + x * y * 3) % 100);
  if (hash < 25) return 'wood';
  if (hash < 40) return 'stone';
  if (hash < 55) return 'small_wood';
  if (hash < 70) return 'small_stone';
  return 'grass';
}

export function createInitialState(): GameState {
  const tiles: Tile[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const bx = Math.floor(x / BLOCK_SIZE);
      const by = Math.floor(y / BLOCK_SIZE);
      const isStartBlock = bx === 0 && by === 0;
      const type = isStartBlock
        ? tileTypeForStartBlock(x, y)
        : tileTypeForResourceBlock(x, y);
      const demDef = TILE_DEMOLISH_DEFS[type];
      row.push({
        x, y, type,
        cropId: null,
        assignedCrop: type === 'soil' ? 'carrot' : null,
        facilityId: null,
        durability: demDef?.maxDurability ?? 0,
        markedForDemolish: false,
      });
    }
    tiles.push(row);
  }

  // Place warehouse at (1,1)
  const whId = 1;
  tiles[1]![1]!.type = 'grass';
  tiles[1]![1]!.durability = 0;
  tiles[1]![1]!.facilityId = whId;
  tiles[1]![1]!.assignedCrop = null;

  return {
    tiles,
    crops: [],
    workers: [
      {
        id: 1,
        x: Math.floor(BLOCK_SIZE / 2) * TILE_SIZE + TILE_SIZE / 2,
        y: Math.floor(BLOCK_SIZE / 2) * TILE_SIZE + TILE_SIZE / 2,
        state: 'idle',
        currentTask: null,
        workTimer: 0,
        carryingItem: null,
      },
    ],
    facilities: [
      { id: whId, type: 'warehouse', originX: 1, originY: 1, width: 1, height: 1, animalCount: 0, productionTimer: 0, inputBuffer: {}, outputBuffer: {} },
    ],
    purchasedBlocks: [{ x: 0, y: 0 }],
    resources: { money: 200, items: {} },
    unlockedCrops: ['carrot', 'wheat'],
    upgrades: { workerSpeed: 0, growthSpeed: 0, maintenanceInterval: 0, autoHarvest: 0, demolishSpeed: 0 },
    orders: [],
    orderRefreshTimer: 0,
    nextCropId: 1,
    nextWorkerId: 2,
    nextOrderId: 1,
    nextFacilityId: 2,
    lastSaveTime: Date.now(),
  };
}
