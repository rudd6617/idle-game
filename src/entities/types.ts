// === Tile ===

export type TileType = 'soil' | 'grass' | 'tree' | 'blocked';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  cropId: number | null;
  assignedCrop: CropType | null;
}

// === Crop ===

export type CropType = 'carrot' | 'wheat' | 'tomato';

export interface CropDef {
  type: CropType;
  growTime: number;       // ms to fully grow
  waterInterval: number;  // ms between needing water
  weedInterval: number;   // ms between needing weeding
  sellPrice: number;
}

export type CropStage = 'seed' | 'growing' | 'ready';

export interface Crop {
  id: number;
  tileX: number;
  tileY: number;
  type: CropType;
  stage: CropStage;
  growthTimer: number;    // ms remaining to next stage
  needsWater: boolean;
  needsWeeding: boolean;
  waterTimer: number;     // ms until needs water
  weedTimer: number;      // ms until needs weeding
}

// === Worker ===

export type WorkerState = 'idle' | 'moving' | 'working';

export interface Task {
  type: 'plant' | 'water' | 'weed' | 'harvest';
  targetX: number;
  targetY: number;
}

export interface Worker {
  id: number;
  x: number;
  y: number;
  state: WorkerState;
  currentTask: Task | null;
  workTimer: number;      // ms remaining on current task
}

// === Resources ===

export interface Resources {
  money: number;
  crops: Partial<Record<CropType, number>>;
}

// === Upgrades ===

export type UpgradeType = 'workerSpeed' | 'growthSpeed' | 'maintenanceInterval' | 'autoHarvest';

// === Orders ===

export interface OrderRequirement {
  crop: CropType;
  amount: number;
}

export interface Order {
  id: number;
  requirements: OrderRequirement[];
  reward: number;
  timeRemaining: number;  // ms
}

// === Game State ===

export interface GameState {
  tiles: Tile[][];
  crops: Crop[];
  workers: Worker[];
  resources: Resources;
  upgrades: Record<UpgradeType, number>;
  orders: Order[];
  orderRefreshTimer: number;  // ms until next order refill
  nextCropId: number;
  nextWorkerId: number;
  nextOrderId: number;
  lastSaveTime: number;
}
