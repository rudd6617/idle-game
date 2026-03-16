// === Tile ===

export type TileType = 'soil' | 'grass' | 'wood' | 'stone' | 'small_wood' | 'small_stone';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  cropId: number | null;
  assignedCrop: CropType | null;
  facilityId: number | null;
  durability: number;
  markedForDemolish: boolean;
}

// === Crop ===

export type CropType = 'carrot' | 'wheat' | 'tomato' | 'potato' | 'strawberry' | 'corn' | 'pumpkin' | 'sunflower' | 'grape' | 'coffee';

export interface CropDef {
  type: CropType;
  growTime: number;
  waterInterval: number;
  weedInterval: number;
  sellPrice: number;
  unlockCost: number;
  requires: CropType[];
}

export type CropStage = 'seed' | 'growing' | 'ready';

export interface Crop {
  id: number;
  tileX: number;
  tileY: number;
  type: CropType;
  stage: CropStage;
  growthTimer: number;
  needsWater: boolean;
  needsWeeding: boolean;
  waterTimer: number;
  weedTimer: number;
}

// === Items ===

export type ItemType = CropType | 'egg' | 'milk' | 'wood' | 'stone' | 'flour' | 'juice' | 'bread' | 'pizza';

// === Facility ===

export type FacilityType = 'chicken_coop' | 'cow_barn' | 'warehouse' | 'windmill' | 'juicer' | 'oven' | 'cooking_pot';

export interface Facility {
  id: number;
  type: FacilityType;
  originX: number;
  originY: number;
  width: number;
  height: number;
  animalCount: number;
  productionTimer: number;
  inputBuffer: Partial<Record<ItemType, number>>;
  outputBuffer: Partial<Record<ItemType, number>>;
}

// === Worker ===

export type WorkerState = 'idle' | 'moving' | 'working';

export interface Task {
  type: 'plant' | 'water' | 'weed' | 'harvest' | 'feed' | 'collect' | 'deposit' | 'demolish';
  targetX: number;
  targetY: number;
}

export interface Worker {
  id: number;
  x: number;
  y: number;
  state: WorkerState;
  currentTask: Task | null;
  workTimer: number;
  carryingItems: Partial<Record<ItemType, number>>;
}

// === Resources ===

export interface Resources {
  money: number;
  items: Partial<Record<ItemType, number>>;
}

// === Upgrades ===

export type UpgradeType = 'workerSpeed' | 'growthSpeed' | 'maintenanceInterval' | 'autoHarvest' | 'demolishSpeed' | 'carryCapacity';

// === Orders ===

export interface OrderRequirement {
  crop: CropType;
  amount: number;
}

export interface Order {
  id: number;
  requirements: OrderRequirement[];
  reward: number;
  timeRemaining: number;
}

// === Game State ===

export interface BlockCoord {
  x: number;
  y: number;
}

export interface GameState {
  tiles: Tile[][];
  crops: Crop[];
  workers: Worker[];
  facilities: Facility[];
  purchasedBlocks: BlockCoord[];
  resources: Resources;
  unlockedCrops: CropType[];
  upgrades: Record<UpgradeType, number>;
  orders: Order[];
  orderRefreshTimer: number;
  nextCropId: number;
  nextWorkerId: number;
  nextOrderId: number;
  nextFacilityId: number;
  lastSaveTime: number;
}
