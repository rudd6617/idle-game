import type { CropType, GameState, Tile, TileType } from '../entities/types';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../entities/constants';

function defaultCropAt(type: TileType): CropType | null {
  return type === 'soil' ? 'carrot' : null;
}

function tileTypeAt(x: number, y: number, w: number, h: number): TileType {
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  // Center 2x2 is soil (4 plots — manageable for 1 worker)
  if (x >= cx - 1 && x <= cx && y >= cy - 1 && y <= cy) return 'soil';
  // Edges are trees
  if (x === 0 || x === w - 1 || y === 0 || y === h - 1) return 'tree';
  // Rest is grass
  return 'grass';
}

export function createInitialState(): GameState {
  const tiles: Tile[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const type = tileTypeAt(x, y, MAP_WIDTH, MAP_HEIGHT);
      row.push({ x, y, type, cropId: null, assignedCrop: defaultCropAt(type) });
    }
    tiles.push(row);
  }

  return {
    tiles,
    crops: [],
    workers: [
      {
        id: 1,
        x: MAP_WIDTH * TILE_SIZE / 2,
        y: MAP_HEIGHT * TILE_SIZE / 2,
        state: 'idle',
        currentTask: null,
        workTimer: 0,
      },
    ],
    resources: { money: 0, crops: {} },
    upgrades: { workerSpeed: 0, growthSpeed: 0, maintenanceInterval: 0, autoHarvest: 0 },
    orders: [],
    orderRefreshTimer: 0,
    nextCropId: 1,
    nextWorkerId: 2,
    nextOrderId: 1,
    lastSaveTime: Date.now(),
  };
}
