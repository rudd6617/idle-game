import type { GameState } from '../entities/types';
import { WORKER_CRAFT_COST, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../entities/constants';

export function getWorkerCost(state: GameState): number {
  return Math.round(WORKER_CRAFT_COST.money * Math.pow(1.2, state.workers.length));
}

export function canCraftWorker(state: GameState): boolean {
  return state.resources.money >= getWorkerCost(state);
}

export function craftWorker(state: GameState): boolean {
  if (!canCraftWorker(state)) return false;

  state.resources.money -= getWorkerCost(state);

  // Spawn near center
  state.workers.push({
    id: state.nextWorkerId++,
    x: Math.floor(MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
    y: Math.floor(MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2,
    state: 'idle',
    currentTask: null,
    workTimer: 0,
    carryingItems: {},
  });

  return true;
}
