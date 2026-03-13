import type { GameState, Task, Worker, Crop } from '../entities/types';
import { WORKER_SPEED, WORK_DURATION, TILE_SIZE } from '../entities/constants';
import { CROP_DEFS } from '../entities/cropDefs';
import { plantCrop, harvestCrop } from './CropSystem';

export function updateWorkers(state: GameState, dt: number): void {
  for (const worker of state.workers) {
    switch (worker.state) {
      case 'idle':
        findTask(state, worker);
        break;
      case 'moving':
        moveToTarget(worker, dt);
        break;
      case 'working':
        doWork(state, worker, dt);
        break;
    }
  }
}

function getClaimedTiles(state: GameState, self: Worker): Set<string> {
  const claimed = new Set<string>();
  for (const w of state.workers) {
    if (w === self || !w.currentTask) continue;
    claimed.add(`${w.currentTask.targetX},${w.currentTask.targetY}`);
  }
  return claimed;
}

function findTask(state: GameState, worker: Worker): void {
  const claimed = getClaimedTiles(state, worker);

  // Priority: harvest > water > weed > plant
  const task = findHarvestTask(state, claimed)
    ?? findWaterTask(state, claimed)
    ?? findWeedTask(state, claimed)
    ?? findPlantTask(state, claimed);

  if (!task) return;

  worker.currentTask = task;
  worker.state = 'moving';
}

function isFree(claimed: Set<string>, x: number, y: number): boolean {
  return !claimed.has(`${x},${y}`);
}

function findHarvestTask(state: GameState, claimed: Set<string>): Task | null {
  const crop = state.crops.find(c => c.stage === 'ready' && isFree(claimed, c.tileX, c.tileY));
  if (!crop) return null;
  return { type: 'harvest', targetX: crop.tileX, targetY: crop.tileY };
}

function findWaterTask(state: GameState, claimed: Set<string>): Task | null {
  const crop = state.crops.find(c => c.needsWater && c.stage !== 'ready' && isFree(claimed, c.tileX, c.tileY));
  if (!crop) return null;
  return { type: 'water', targetX: crop.tileX, targetY: crop.tileY };
}

function findWeedTask(state: GameState, claimed: Set<string>): Task | null {
  const crop = state.crops.find(c => c.needsWeeding && c.stage !== 'ready' && isFree(claimed, c.tileX, c.tileY));
  if (!crop) return null;
  return { type: 'weed', targetX: crop.tileX, targetY: crop.tileY };
}

function findPlantTask(state: GameState, claimed: Set<string>): Task | null {
  for (const row of state.tiles) {
    for (const tile of row) {
      if (tile.type === 'soil' && tile.cropId === null && tile.assignedCrop !== null && isFree(claimed, tile.x, tile.y)) {
        return { type: 'plant', targetX: tile.x, targetY: tile.y };
      }
    }
  }
  return null;
}

function moveToTarget(worker: Worker, dt: number): void {
  const task = worker.currentTask;
  if (!task) {
    worker.state = 'idle';
    return;
  }

  const targetPx = task.targetX * TILE_SIZE + TILE_SIZE / 2;
  const targetPy = task.targetY * TILE_SIZE + TILE_SIZE / 2;
  const dx = targetPx - worker.x;
  const dy = targetPy - worker.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 2) {
    worker.x = targetPx;
    worker.y = targetPy;
    worker.state = 'working';
    worker.workTimer = WORK_DURATION;
    return;
  }

  const step = WORKER_SPEED * (dt / 1000);
  worker.x += (dx / dist) * Math.min(step, dist);
  worker.y += (dy / dist) * Math.min(step, dist);
}

function doWork(state: GameState, worker: Worker, dt: number): void {
  worker.workTimer -= dt;
  if (worker.workTimer > 0) return;

  const task = worker.currentTask;
  if (!task) {
    worker.state = 'idle';
    return;
  }

  executeTask(state, task);
  worker.currentTask = null;
  worker.state = 'idle';
}

function executeTask(state: GameState, task: Task): void {
  switch (task.type) {
    case 'plant': {
      const tile = state.tiles[task.targetY]?.[task.targetX];
      if (tile?.assignedCrop) {
        plantCrop(state, task.targetX, task.targetY, tile.assignedCrop);
      }
      break;
    }
    case 'water':
      waterCrop(state, task);
      break;
    case 'weed':
      weedCrop(state, task);
      break;
    case 'harvest': {
      const crop = findCropAt(state, task.targetX, task.targetY);
      if (crop) harvestCrop(state, crop);
      break;
    }
  }
}

function waterCrop(state: GameState, task: Task): void {
  const crop = findCropAt(state, task.targetX, task.targetY);
  if (!crop) return;
  crop.needsWater = false;
  const def = CROP_DEFS[crop.type];
  crop.waterTimer = def?.waterInterval ?? 8000;
}

function weedCrop(state: GameState, task: Task): void {
  const crop = findCropAt(state, task.targetX, task.targetY);
  if (!crop) return;
  crop.needsWeeding = false;
  const def = CROP_DEFS[crop.type];
  crop.weedTimer = def?.weedInterval ?? 12000;
}

function findCropAt(state: GameState, x: number, y: number): Crop | undefined {
  return state.crops.find(c => c.tileX === x && c.tileY === y);
}
