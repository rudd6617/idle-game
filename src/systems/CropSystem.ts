import type { Crop, CropType, GameState } from '../entities/types';
import { CROP_DEFS } from '../entities/cropDefs';
import { WEATHER_DEFS } from '../entities/constants';
import { getUpgradeMultiplier } from './UpgradeSystem';
import { hasStorageSpace } from './FacilitySystem';

export function updateCrops(state: GameState, dt: number): void {
  const weatherDef = WEATHER_DEFS[state.weather.type];
  const growthMult = getUpgradeMultiplier(state, 'growthSpeed') * weatherDef.growthMult;
  const maintMult = getUpgradeMultiplier(state, 'maintenanceInterval');
  const autoHarvest = state.upgrades.autoHarvest > 0;

  // Auto-harvest ready crops (only if warehouse has space)
  if (autoHarvest) {
    for (let i = state.crops.length - 1; i >= 0; i--) {
      const crop = state.crops[i]!;
      if (crop.stage === 'ready' && hasStorageSpace(state)) harvestCrop(state, crop);
    }
  }

  for (const crop of state.crops) {
    if (crop.stage === 'ready') continue;

    // Rain clears water needs
    if (weatherDef.stopsWaterDecay && crop.needsWater) {
      crop.needsWater = false;
      const def = CROP_DEFS[crop.type];
      crop.waterTimer = def?.waterInterval ?? 8000;
    }

    // Growth pauses if needs water or weeding
    if (!crop.needsWater && !crop.needsWeeding) {
      crop.growthTimer -= dt * growthMult;
      if (crop.growthTimer <= 0) {
        advanceStage(crop);
      }
    }

    // Water timer (higher maintMult = slower decay = longer intervals)
    if (!weatherDef.stopsWaterDecay) {
      crop.waterTimer -= dt * weatherDef.waterDecayMult / maintMult;
      if (crop.waterTimer <= 0) {
        crop.needsWater = true;
      }
    }

    // Weed timer
    crop.weedTimer -= dt / maintMult;
    if (crop.weedTimer <= 0) {
      crop.needsWeeding = true;
    }
  }
}

function advanceStage(crop: Crop): void {
  const def = CROP_DEFS[crop.type];
  if (!def) return;

  if (crop.stage === 'seed') {
    crop.stage = 'growing';
    crop.growthTimer = def.growTime;
  } else if (crop.stage === 'growing') {
    crop.stage = 'ready';
    crop.growthTimer = 0;
  }
}

export function plantCrop(state: GameState, tileX: number, tileY: number, type: CropType): Crop | null {
  const def = CROP_DEFS[type];
  if (!def) return null;

  const tile = state.tiles[tileY]?.[tileX];
  if (!tile || tile.type !== 'soil' || tile.cropId !== null) return null;

  const crop: Crop = {
    id: state.nextCropId++,
    tileX,
    tileY,
    type: def.type,
    stage: 'seed',
    growthTimer: def.growTime,
    needsWater: false,
    needsWeeding: false,
    waterTimer: def.waterInterval,
    weedTimer: def.weedInterval,
  };

  state.crops.push(crop);
  tile.cropId = crop.id;
  return crop;
}

/** Remove crop from map and add to inventory (used by auto-harvest) */
export function harvestCrop(state: GameState, crop: Crop): void {
  state.resources.items[crop.type] = (state.resources.items[crop.type] ?? 0) + 1;
  removeCrop(state, crop);
}

/** Remove crop from map without adding to inventory (worker carries it) */
export function removeCrop(state: GameState, crop: Crop): void {
  const tile = state.tiles[crop.tileY]?.[crop.tileX];
  if (tile) tile.cropId = null;
  const idx = state.crops.indexOf(crop);
  if (idx !== -1) state.crops.splice(idx, 1);
}
