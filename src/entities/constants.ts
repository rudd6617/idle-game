import type { FacilityType, ItemType, TileType, UpgradeType } from './types';

export const TILE_SIZE = 48;
export const BLOCK_SIZE = 10;
export const MAP_WIDTH = 20;   // 2 blocks wide
export const MAP_HEIGHT = 20;  // 2 blocks tall
export const BLOCK_COST = 500;
export const BASE_CARRY_CAPACITY = 5;

export const WORKER_SPEED = 80;
export const WORK_DURATION = 1_200;

export const SAVE_INTERVAL = 30_000;
export const SAVE_KEY = 'idle-farm-save';

// Expansion costs (only grass → soil)
export const CLEAR_COST: Partial<Record<TileType, number>> = {
  grass: 10,
};

// Worker crafting
export const WORKER_CRAFT_COST = {
  money: 15,
  carrots: 0,
};

// Demolish definitions
export interface TileDemolishDef {
  workTime: number;       // ms per hit (before upgrades)
  material: ItemType;     // item given per hit
  maxDurability: number;  // total hits before becomes grass
}

export const TILE_DEMOLISH_DEFS: Partial<Record<TileType, TileDemolishDef>> = {
  wood:        { workTime: 10_000, material: 'wood',  maxDurability: 10 },
  small_wood:  { workTime: 10_000, material: 'wood',  maxDurability: 1 },
  stone:       { workTime: 15_000, material: 'stone', maxDurability: 10 },
  small_stone: { workTime: 15_000, material: 'stone', maxDurability: 1 },
};

// Orders
export const MAX_ORDERS = 3;
export const ORDER_DURATION = 300_000;
export const ORDER_REFRESH_INTERVAL = 600_000;
export const ORDER_BONUS_MIN = 1.5;
export const ORDER_BONUS_MAX = 2.0;
export const ORDER_MIN_TYPES = 1;
export const ORDER_MAX_TYPES = 3;
export const ORDER_MIN_AMOUNT = 2;
export const ORDER_MAX_AMOUNT = 8;

// Facilities

export interface FacilityDef {
  type: FacilityType;
  label: string;
  animalName: string;
  width: number;
  height: number;
  cost: number;
  animalCost: number;
  maxAnimals: number;
  capacity: number;
  inputPerAnimal: Partial<Record<ItemType, number>>;
  outputPerAnimal: Partial<Record<ItemType, number>>;
  productionTime: number;
}

export const FACILITY_DEFS: Record<FacilityType, FacilityDef> = {
  warehouse: {
    type: 'warehouse',
    label: 'Warehouse',
    animalName: '',
    width: 1,
    height: 1,
    cost: 30,
    animalCost: 0,
    maxAnimals: 0,
    capacity: 10000,
    inputPerAnimal: {},
    outputPerAnimal: {},
    productionTime: 0,
  },
  chicken_coop: {
    type: 'chicken_coop',
    label: 'Chicken Coop',
    animalName: 'Chicken',
    width: 3,
    height: 3,
    cost: 50,
    animalCost: 10,
    maxAnimals: 5,
    capacity: 0,
    inputPerAnimal: { wheat: 2 },
    outputPerAnimal: { egg: 1 },
    productionTime: 30_000,
  },
  cow_barn: {
    type: 'cow_barn',
    label: 'Cow Barn',
    animalName: 'Cow',
    width: 4,
    height: 4,
    cost: 120,
    animalCost: 30,
    maxAnimals: 4,
    capacity: 0,
    inputPerAnimal: { wheat: 4 },
    outputPerAnimal: { milk: 1 },
    productionTime: 45_000,
  },
};

export const FACILITY_TYPES: FacilityType[] = ['warehouse', 'chicken_coop', 'cow_barn'];

// Item sell prices (for non-crop items)
export const ITEM_SELL_PRICES: Partial<Record<ItemType, number>> = {
  egg: 5,
  milk: 12,
  wood: 2,
  stone: 3,
};

// Upgrades

export interface UpgradeDef {
  label: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectPerLevel: number;
}

export const UPGRADE_DEFS: Record<UpgradeType, UpgradeDef> = {
  workerSpeed: {
    label: 'Speed',
    description: '+20% move speed',
    baseCost: 30,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.2,
  },
  growthSpeed: {
    label: 'Growth',
    description: '+10% crop growth',
    baseCost: 50,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.1,
  },
  maintenanceInterval: {
    label: 'Maint.',
    description: '+15% water/weed interval',
    baseCost: 40,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.15,
  },
  autoHarvest: {
    label: 'AutoHarv',
    description: 'Auto-collect ready crops',
    baseCost: 200,
    costMultiplier: 1,
    maxLevel: 1,
    effectPerLevel: 1,
  },
  demolishSpeed: {
    label: 'Demolish',
    description: '+20% demolish speed',
    baseCost: 25,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.2,
  },
  carryCapacity: {
    label: 'Carry',
    description: '+2 carry capacity',
    baseCost: 20,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 2,
  },
};
