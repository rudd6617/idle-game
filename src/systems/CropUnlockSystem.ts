import type { CropType, GameState } from '../entities/types';
import { CROP_DEFS } from '../entities/cropDefs';

export function isCropUnlocked(state: GameState, type: CropType): boolean {
  return state.unlockedCrops.includes(type);
}

export function canUnlockCrop(state: GameState, type: CropType): boolean {
  if (isCropUnlocked(state, type)) return false;
  const def = CROP_DEFS[type];
  if (state.resources.money < def.unlockCost) return false;
  return def.requires.every(req => isCropUnlocked(state, req));
}

export function unlockCrop(state: GameState, type: CropType): boolean {
  if (!canUnlockCrop(state, type)) return false;
  state.resources.money -= CROP_DEFS[type].unlockCost;
  state.unlockedCrops.push(type);
  return true;
}
