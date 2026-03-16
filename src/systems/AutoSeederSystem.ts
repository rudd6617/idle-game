import type { CropType, GameState } from '../entities/types';
import { FACILITY_DEFS } from '../entities/constants';
import { plantCrop } from './CropSystem';

const SEEDER_INTERVAL = FACILITY_DEFS['auto_seeder'].productionTime;

export function updateAutoSeeders(state: GameState, dt: number): void {
  for (const fac of state.facilities) {
    if (fac.type !== 'auto_seeder' || !fac.seedCrop) continue;

    fac.productionTimer -= dt;
    if (fac.productionTimer > 0) continue;

    fac.productionTimer += SEEDER_INTERVAL;
    seedOneInRange(state, fac.originX, fac.originY, fac.seedCrop);
  }
}

function seedOneInRange(state: GameState, ox: number, oy: number, crop: CropType): void {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const tile = state.tiles[oy + dy]?.[ox + dx];
      if (tile && tile.type === 'soil' && tile.cropId === null && tile.facilityId === null) {
        plantCrop(state, ox + dx, oy + dy, crop);
        tile.assignedCrop = crop;
        return;
      }
    }
  }
}
