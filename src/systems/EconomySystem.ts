import type { CropType, GameState } from '../entities/types';
import { CROP_DEFS } from '../entities/cropDefs';

/** Sell all of one crop type for money */
export function sellCrop(state: GameState, type: CropType): void {
  const count = state.resources.crops[type] ?? 0;
  if (count <= 0) return;
  const def = CROP_DEFS[type];
  state.resources.money += def.sellPrice * count;
  state.resources.crops[type] = 0;
}
