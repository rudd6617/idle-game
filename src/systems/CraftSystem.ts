import type { GameState } from '../entities/types';
import { WORKER_CRAFT_COST, TILE_SIZE } from '../entities/constants';

export function canCraftWorker(state: GameState): boolean {
  const { money, crops } = state.resources;
  return money >= WORKER_CRAFT_COST.money
    && (crops.carrot ?? 0) >= WORKER_CRAFT_COST.carrots;
}

export function craftWorker(state: GameState): boolean {
  if (!canCraftWorker(state)) return false;

  state.resources.money -= WORKER_CRAFT_COST.money;
  state.resources.crops.carrot = (state.resources.crops.carrot ?? 0) - WORKER_CRAFT_COST.carrots;

  // Spawn near center
  state.workers.push({
    id: state.nextWorkerId++,
    x: 4 * TILE_SIZE + TILE_SIZE / 2,
    y: 4 * TILE_SIZE + TILE_SIZE / 2,
    state: 'idle',
    currentTask: null,
    workTimer: 0,
  });

  return true;
}
