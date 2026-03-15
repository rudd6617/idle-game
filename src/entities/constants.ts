export const TILE_SIZE = 48;
export const MAP_WIDTH = 10;
export const MAP_HEIGHT = 10;

export const WORKER_SPEED = 80;       // pixels per second
export const WORK_DURATION = 1_200;   // ms to complete a task

export const SAVE_INTERVAL = 30_000;  // auto-save every 30s
export const SAVE_KEY = 'idle-farm-save';

// Expansion costs
export const CLEAR_COST: Record<string, number> = {
  grass: 10,
  tree: 25,
};

// Worker crafting
export const WORKER_CRAFT_COST = {
  money: 15,
  carrots: 0,
};

// Orders
export const MAX_ORDERS = 3;
export const ORDER_DURATION = 300_000;        // 5 minutes
export const ORDER_REFRESH_INTERVAL = 600_000; // 10 minutes
export const ORDER_BONUS_MIN = 1.5;           // reward multiplier range
export const ORDER_BONUS_MAX = 2.0;
export const ORDER_MIN_TYPES = 1;             // min crop types per order
export const ORDER_MAX_TYPES = 3;
export const ORDER_MIN_AMOUNT = 2;            // per crop type
export const ORDER_MAX_AMOUNT = 8;

// Upgrades
import type { UpgradeType } from './types';

export interface UpgradeDef {
  label: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectPerLevel: number;   // multiplier increment per level
}

export const UPGRADE_DEFS: Record<UpgradeType, UpgradeDef> = {
  workerSpeed: {
    label: 'Worker Speed',
    description: '+20% move speed',
    baseCost: 30,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.2,
  },
  growthSpeed: {
    label: 'Growth Speed',
    description: '+10% crop growth',
    baseCost: 50,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.1,
  },
  maintenanceInterval: {
    label: 'Maintenance',
    description: '+15% water/weed interval',
    baseCost: 40,
    costMultiplier: 1.8,
    maxLevel: 10,
    effectPerLevel: 0.15,
  },
  autoHarvest: {
    label: 'Auto Harvest',
    description: 'Auto-collect ready crops',
    baseCost: 200,
    costMultiplier: 1,
    maxLevel: 1,
    effectPerLevel: 1,
  },
};
