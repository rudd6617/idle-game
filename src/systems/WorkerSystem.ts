import type { GameState, Task, Worker, Crop, Facility } from '../entities/types';
import { WORKER_SPEED, WORK_DURATION, TILE_SIZE, FACILITY_DEFS, TILE_DEMOLISH_DEFS } from '../entities/constants';
import { CROP_DEFS } from '../entities/cropDefs';
import { plantCrop, removeCrop } from './CropSystem';
import { needsFeeding, needsCollection, hasStorageSpace } from './FacilitySystem';
import { getUpgradeMultiplier } from './UpgradeSystem';

export function updateWorkers(state: GameState, dt: number): void {
  const speedMult = getUpgradeMultiplier(state, 'workerSpeed');
  for (const worker of state.workers) {
    switch (worker.state) {
      case 'idle':
        findTask(state, worker);
        break;
      case 'moving':
        moveToTarget(state, worker, dt, speedMult);
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

  // Carrying item → deposit first
  if (worker.carryingItem) {
    const task = findDepositTask(state);
    if (task) {
      worker.currentTask = task;
      worker.state = 'moving';
    }
    return;
  }

  // Priority: harvest > collect > water > weed > feed > plant
  const task = findHarvestTask(state, claimed)
    ?? findCollectTask(state, claimed)
    ?? findWaterTask(state, claimed)
    ?? findWeedTask(state, claimed)
    ?? findFeedTask(state, claimed)
    ?? findPlantTask(state, claimed)
    ?? findDemolishTask(state, claimed);

  if (!task) return;

  worker.currentTask = task;
  worker.state = 'moving';
}

function isFree(claimed: Set<string>, x: number, y: number): boolean {
  return !claimed.has(`${x},${y}`);
}

function findHarvestTask(state: GameState, claimed: Set<string>): Task | null {
  if (!hasStorageSpace(state)) return null;
  const crop = state.crops.find(c => c.stage === 'ready' && isFree(claimed, c.tileX, c.tileY));
  if (!crop) return null;
  return { type: 'harvest', targetX: crop.tileX, targetY: crop.tileY };
}

function findDepositTask(state: GameState): Task | null {
  // Find nearest warehouse
  const wh = state.facilities.find(f => FACILITY_DEFS[f.type].capacity > 0);
  if (!wh) return null;
  return { type: 'deposit', targetX: wh.originX, targetY: wh.originY };
}

function findCollectTask(state: GameState, claimed: Set<string>): Task | null {
  if (!hasStorageSpace(state)) return null;
  const fac = state.facilities.find(f => needsCollection(f) && isFree(claimed, f.originX, f.originY));
  if (!fac) return null;
  return { type: 'collect', targetX: fac.originX, targetY: fac.originY };
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

function findFeedTask(state: GameState, claimed: Set<string>): Task | null {
  const fac = state.facilities.find(f => {
    if (!needsFeeding(f)) return false;
    if (!isFree(claimed, f.originX, f.originY)) return false;
    // Check if player has enough items for at least 1 animal
    const def = FACILITY_DEFS[f.type];
    return Object.entries(def.inputPerAnimal).every(
      ([item, perAnimal]) => (state.resources.items[item as keyof typeof state.resources.items] ?? 0) >= perAnimal!,
    );
  });
  if (!fac) return null;
  return { type: 'feed', targetX: fac.originX, targetY: fac.originY };
}

function findPlantTask(state: GameState, claimed: Set<string>): Task | null {
  for (const row of state.tiles) {
    for (const tile of row) {
      if (tile.type === 'soil' && tile.cropId === null && tile.facilityId === null && tile.assignedCrop !== null && isFree(claimed, tile.x, tile.y)) {
        return { type: 'plant', targetX: tile.x, targetY: tile.y };
      }
    }
  }
  return null;
}

function findDemolishTask(state: GameState, claimed: Set<string>): Task | null {
  for (const row of state.tiles) {
    for (const tile of row) {
      if (tile.markedForDemolish && tile.durability > 0 && isFree(claimed, tile.x, tile.y)) {
        return { type: 'demolish', targetX: tile.x, targetY: tile.y };
      }
    }
  }
  return null;
}

function moveToTarget(state: GameState, worker: Worker, dt: number, speedMult: number): void {
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
    if (task.type === 'demolish') {
      const tile = state.tiles[task.targetY]?.[task.targetX];
      const demDef = tile ? TILE_DEMOLISH_DEFS[tile.type] : undefined;
      const demMult = getUpgradeMultiplier(state, 'demolishSpeed');
      worker.workTimer = demDef ? demDef.workTime / demMult : WORK_DURATION;
    } else {
      worker.workTimer = WORK_DURATION;
    }
    return;
  }

  const step = WORKER_SPEED * speedMult * (dt / 1000);
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

  executeTask(state, worker, task);
  worker.currentTask = null;
  worker.state = 'idle';
}

function findFacilityAt(state: GameState, x: number, y: number): Facility | undefined {
  return state.facilities.find(f => f.originX === x && f.originY === y);
}

function executeTask(state: GameState, worker: Worker, task: Task): void {
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
      if (crop) {
        worker.carryingItem = crop.type;
        removeCrop(state, crop);
      }
      break;
    }
    case 'deposit': {
      if (worker.carryingItem && hasStorageSpace(state)) {
        const item = worker.carryingItem;
        state.resources.items[item] = (state.resources.items[item] ?? 0) + 1;
        worker.carryingItem = null;
      }
      break;
    }
    case 'demolish': {
      const tile = state.tiles[task.targetY]?.[task.targetX];
      if (!tile || tile.durability <= 0) break;
      const demDef = TILE_DEMOLISH_DEFS[tile.type];
      if (!demDef) break;
      tile.durability--;
      // Give material — carry to warehouse
      worker.carryingItem = demDef.material;
      if (tile.durability <= 0) {
        tile.type = 'grass';
        tile.markedForDemolish = false;
      }
      break;
    }
    case 'feed': {
      const fac = findFacilityAt(state, task.targetX, task.targetY);
      if (!fac || fac.animalCount === 0) break;
      const def = FACILITY_DEFS[fac.type];
      // Feed as many animals as inventory allows
      let canFeed = fac.animalCount;
      for (const [item, perAnimal] of Object.entries(def.inputPerAnimal)) {
        const available = state.resources.items[item as keyof typeof state.resources.items] ?? 0;
        canFeed = Math.min(canFeed, Math.floor(available / perAnimal!));
      }
      if (canFeed === 0) break;
      for (const [item, perAnimal] of Object.entries(def.inputPerAnimal)) {
        const key = item as keyof typeof state.resources.items;
        const total = perAnimal! * canFeed;
        state.resources.items[key] = (state.resources.items[key] ?? 0) - total;
        const bufKey = item as keyof typeof fac.inputBuffer;
        fac.inputBuffer[bufKey] = (fac.inputBuffer[bufKey] ?? 0) + total;
      }
      break;
    }
    case 'collect': {
      const fac = findFacilityAt(state, task.targetX, task.targetY);
      if (!fac) break;
      // Transfer output to inventory
      for (const [item, amount] of Object.entries(fac.outputBuffer)) {
        if ((amount ?? 0) <= 0) continue;
        const key = item as keyof typeof state.resources.items;
        state.resources.items[key] = (state.resources.items[key] ?? 0) + amount!;
        fac.outputBuffer[item as keyof typeof fac.outputBuffer] = 0;
      }
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
