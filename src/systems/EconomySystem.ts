import type { CropType, GameState, ItemType } from '../entities/types';
import { CROP_DEFS } from '../entities/cropDefs';
import { ITEM_SELL_PRICES } from '../entities/constants';

/** Sell all of one crop type for money */
export function sellCrop(state: GameState, type: CropType): void {
  const count = state.resources.items[type] ?? 0;
  if (count <= 0) return;
  const def = CROP_DEFS[type];
  state.resources.money += def.sellPrice * count;
  state.resources.items[type] = 0;
}

/** Sell all of one item type for money */
export function sellItem(state: GameState, type: ItemType): void {
  const count = state.resources.items[type] ?? 0;
  if (count <= 0) return;
  const price = ITEM_SELL_PRICES[type] ?? 0;
  if (price <= 0) return;
  state.resources.money += price * count;
  state.resources.items[type] = 0;
}
