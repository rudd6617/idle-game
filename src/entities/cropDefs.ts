import type { CropDef, CropType } from './types';

export const CROP_DEFS: Record<CropType, CropDef> = {
  carrot: {
    type: 'carrot',
    growTime: 10_000,       // 10s per stage
    waterInterval: 8_000,
    weedInterval: 12_000,
    sellPrice: 5,
  },
  wheat: {
    type: 'wheat',
    growTime: 6_000,        // faster growth
    waterInterval: 10_000,  // less needy
    weedInterval: 8_000,
    sellPrice: 3,           // cheaper
  },
  tomato: {
    type: 'tomato',
    growTime: 18_000,       // slow growth
    waterInterval: 6_000,   // thirsty
    weedInterval: 15_000,
    sellPrice: 12,          // expensive
  },
};

export const CROP_TYPES: CropType[] = ['carrot', 'wheat', 'tomato'];
