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
