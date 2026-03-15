import type { Facility, FacilityType, GameState, ItemType } from '../entities/types';
import { FACILITY_DEFS } from '../entities/constants';

export function updateFacilities(state: GameState, dt: number): void {
  for (const fac of state.facilities) {
    if (fac.animalCount === 0) continue;

    const def = FACILITY_DEFS[fac.type];

    // How many animals can be fed with current inputBuffer?
    let feedable = fac.animalCount;
    for (const [item, perAnimal] of Object.entries(def.inputPerAnimal)) {
      const available = fac.inputBuffer[item as ItemType] ?? 0;
      feedable = Math.min(feedable, Math.floor(available / perAnimal!));
    }
    if (feedable === 0) continue;

    // Tick production
    fac.productionTimer -= dt;
    if (fac.productionTimer <= 0) {
      // Consume input × feedable
      for (const [item, perAnimal] of Object.entries(def.inputPerAnimal)) {
        const key = item as ItemType;
        fac.inputBuffer[key] = (fac.inputBuffer[key] ?? 0) - perAnimal! * feedable;
      }
      // Produce output × feedable
      for (const [item, perAnimal] of Object.entries(def.outputPerAnimal)) {
        const key = item as ItemType;
        fac.outputBuffer[key] = (fac.outputBuffer[key] ?? 0) + perAnimal! * feedable;
      }
      fac.productionTimer = def.productionTime;
    }
  }
}

export function canBuildFacility(state: GameState, type: FacilityType, ox: number, oy: number): boolean {
  const def = FACILITY_DEFS[type];
  if (state.resources.money < def.cost) return false;

  for (let dy = 0; dy < def.height; dy++) {
    for (let dx = 0; dx < def.width; dx++) {
      const tile = state.tiles[oy + dy]?.[ox + dx];
      if (!tile) return false;
      if (tile.type !== 'grass' && tile.type !== 'soil') return false;
      if (tile.cropId !== null) return false;
      if (tile.facilityId !== null) return false;
    }
  }
  return true;
}

export function buildFacility(state: GameState, type: FacilityType, ox: number, oy: number): boolean {
  if (!canBuildFacility(state, type, ox, oy)) return false;

  const def = FACILITY_DEFS[type];
  state.resources.money -= def.cost;

  const fac: Facility = {
    id: state.nextFacilityId++,
    type,
    originX: ox,
    originY: oy,
    width: def.width,
    height: def.height,
    animalCount: 0,
    productionTimer: def.productionTime,
    inputBuffer: {},
    outputBuffer: {},
  };

  state.facilities.push(fac);

  for (let dy = 0; dy < def.height; dy++) {
    for (let dx = 0; dx < def.width; dx++) {
      const tile = state.tiles[oy + dy]![ox + dx]!;
      tile.facilityId = fac.id;
      tile.assignedCrop = null;
    }
  }

  return true;
}

export function canBuyAnimal(state: GameState, fac: Facility): boolean {
  const def = FACILITY_DEFS[fac.type];
  return fac.animalCount < def.maxAnimals && state.resources.money >= def.animalCost;
}

export function buyAnimal(state: GameState, fac: Facility): boolean {
  if (!canBuyAnimal(state, fac)) return false;
  const def = FACILITY_DEFS[fac.type];
  state.resources.money -= def.animalCost;
  fac.animalCount++;
  return true;
}

export function getWarehouseCapacity(state: GameState): number {
  return state.facilities.reduce((sum, f) => sum + FACILITY_DEFS[f.type].capacity, 0);
}

export function getCurrentStorage(state: GameState): number {
  return Object.values(state.resources.items).reduce((sum, v) => sum + (v ?? 0), 0);
}

export function hasStorageSpace(state: GameState, amount = 1): boolean {
  return getCurrentStorage(state) + amount <= getWarehouseCapacity(state);
}

export function needsFeeding(fac: Facility): boolean {
  if (fac.animalCount === 0) return false;
  const def = FACILITY_DEFS[fac.type];
  return Object.entries(def.inputPerAnimal).some(
    ([item, perAnimal]) => (fac.inputBuffer[item as ItemType] ?? 0) < perAnimal! * fac.animalCount,
  );
}

export function needsCollection(fac: Facility): boolean {
  return Object.values(fac.outputBuffer).some(v => (v ?? 0) > 0);
}
