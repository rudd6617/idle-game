import type { GameState, UpgradeType } from '../entities/types';
import { UPGRADE_DEFS } from '../entities/constants';

export function getUpgradeCost(type: UpgradeType, level: number): number {
  const def = UPGRADE_DEFS[type];
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
}

export function canUpgrade(state: GameState, type: UpgradeType): boolean {
  const def = UPGRADE_DEFS[type];
  const level = state.upgrades[type];
  if (level >= def.maxLevel) return false;
  return state.resources.money >= getUpgradeCost(type, level);
}

export function applyUpgrade(state: GameState, type: UpgradeType): boolean {
  if (!canUpgrade(state, type)) return false;
  const cost = getUpgradeCost(type, state.upgrades[type]);
  state.resources.money -= cost;
  state.upgrades[type]++;
  return true;
}

/** Get the multiplier for a given upgrade. E.g. level 3 workerSpeed → 1.6 */
export function getUpgradeMultiplier(state: GameState, type: UpgradeType): number {
  const def = UPGRADE_DEFS[type];
  return 1 + state.upgrades[type] * def.effectPerLevel;
}
