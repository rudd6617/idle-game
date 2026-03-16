import { TILE_SIZE } from '../entities/constants';

const T = TILE_SIZE; // 48
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

// ── helpers ──────────────────────────────────────────────

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function emoji(w: number, h: number, char: string, bg?: string, size?: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  const fs = size ?? Math.floor(Math.min(w, h) * 0.75);
  ctx.font = `${fs}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(char, w / 2, h / 2);
  return c;
}

// ── tile sprites (48x48) ─────────────────────────────────

function drawGrass(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = '#3bcc6e';
  ctx.fillRect(8, 4, 3, 3);
  ctx.fillRect(28, 20, 3, 3);
  ctx.fillRect(16, 36, 3, 3);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(12, 8, 2, 2);
  ctx.fillStyle = '#f9a8d4';
  ctx.fillRect(36, 28, 2, 2);
  return c;
}

function drawSoil(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = '#7a5a10';
  for (let y = 0; y < T; y += 12) ctx.fillRect(0, y, T, 2);
  ctx.fillStyle = '#a07820';
  ctx.fillRect(8, 4, 3, 3);
  ctx.fillRect(28, 16, 3, 3);
  return c;
}

// ── crop emoji map ───────────────────────────────────────

const CROP_EMOJI: Record<string, string> = {
  carrot: '🥕', wheat: '🌾', tomato: '🍅', potato: '🥔',
  strawberry: '🍓', corn: '🌽', pumpkin: '🎃', sunflower: '🌻',
  grape: '🍇', coffee: '☕',
};

// ── registration ─────────────────────────────────────────

export function generateAllSprites(scene: Phaser.Scene): void {
  const add = (key: string, canvas: HTMLCanvasElement) => {
    scene.textures.addCanvas(key, canvas);
  };

  // Tiles
  add('tile_grass', drawGrass());
  add('tile_soil', drawSoil());
  add('tile_wood', emoji(T, T, '🌳', '#166534'));
  add('tile_stone', emoji(T, T, '🪨', '#555555'));
  add('tile_small_wood', emoji(T, T, '🌿', '#4ade80', 24));
  add('tile_small_stone', emoji(T, T, '🪨', '#4ade80', 24));

  // Crops
  add('crop_seed', emoji(T, T, '🌱', undefined, 24));
  for (const [crop, em] of Object.entries(CROP_EMOJI)) {
    add(`crop_${crop}_growing`, emoji(T, T, '🌿', undefined, 28));
    add(`crop_${crop}_ready`, emoji(T, T, em));
  }

  // Indicators
  add('icon_water', emoji(12, 12, '💧', undefined, 10));
  add('icon_weed', emoji(12, 12, '🍃', undefined, 10));

  // Workers
  add('worker_idle', emoji(16, 16, '🧑', undefined, 14));
  add('worker_working', emoji(16, 16, '⛏️', undefined, 14));

  // Mini crop icons (12x12)
  for (const [crop, em] of Object.entries(CROP_EMOJI)) {
    add(`icon_${crop}`, emoji(12, 12, em, undefined, 10));
  }
  add('icon_fallow', emoji(12, 12, '❌', undefined, 10));

  // UI
  add('icon_lock', emoji(T, T, '🔒'));

  // Toolbar (24x24)
  add('tb_farm', emoji(24, 24, '🌱', undefined, 18));
  add('tb_build', emoji(24, 24, '🏠', undefined, 18));
  add('tb_machine', emoji(24, 24, '⚙️', undefined, 18));
  add('tb_demolish', emoji(24, 24, '🔨', undefined, 18));
  add('tb_gather_wood', emoji(24, 24, '🪓', undefined, 18));
  add('tb_gather_stone', emoji(24, 24, '⛏️', undefined, 18));
  add('tb_worker', emoji(24, 24, '🧑‍🌾', undefined, 18));
  add('tb_sell', emoji(24, 24, '💰', undefined, 18));
  add('tb_upgrade', emoji(24, 24, '⬆️', undefined, 18));
  add('tb_crops', emoji(24, 24, '🌾', undefined, 18));
  add('tb_orders', emoji(24, 24, '📋', undefined, 18));

  // Facilities
  add('facility_warehouse', emoji(T, T, '🏠', '#8b7355'));
  add('facility_chicken_coop', emoji(3 * T, 3 * T, '🐔', '#a07820', 80));
  add('facility_cow_barn', emoji(4 * T, 4 * T, '🐄', '#4a7c3f', 110));
  add('facility_windmill', emoji(T, T, '⚙️', '#888888'));
  add('facility_juicer', emoji(T, T, '🧃', '#8b7355'));
  add('facility_oven', emoji(2 * T, 2 * T, '🔥', '#8b4513', 50));
  add('facility_cooking_pot', emoji(2 * T, 2 * T, '🍲', '#777777', 50));
  add('facility_auto_seeder', emoji(T, T, '🌱', '#556b55'));

  // Mini facility icons (12x12)
  add('icon_warehouse', emoji(12, 12, '🏠', undefined, 10));
  add('icon_chicken_coop', emoji(12, 12, '🐔', undefined, 10));
  add('icon_cow_barn', emoji(12, 12, '🐄', undefined, 10));
  add('icon_windmill', emoji(12, 12, '⚙️', undefined, 10));
  add('icon_juicer', emoji(12, 12, '🧃', undefined, 10));
  add('icon_oven', emoji(12, 12, '🔥', undefined, 10));
  add('icon_cooking_pot', emoji(12, 12, '🍲', undefined, 10));
  add('icon_auto_seeder', emoji(12, 12, '🌱', undefined, 10));

  // Non-crop item icons (12x12)
  add('icon_egg', emoji(12, 12, '🥚', undefined, 10));
  add('icon_milk', emoji(12, 12, '🥛', undefined, 10));
  add('icon_wood', emoji(12, 12, '🪵', undefined, 10));
  add('icon_stone', emoji(12, 12, '🪨', undefined, 10));
  add('icon_flour', emoji(12, 12, '🌾', undefined, 10));
  add('icon_juice', emoji(12, 12, '🧃', undefined, 10));
  add('icon_bread', emoji(12, 12, '🍞', undefined, 10));
  add('icon_pizza', emoji(12, 12, '🍕', undefined, 10));
}

/** Get the texture key for a crop at a given stage */
export function getCropTextureKey(cropType: string, stage: string): string {
  if (stage === 'seed') return 'crop_seed';
  return `crop_${cropType}_${stage}`;
}

/** Get the texture key for a tile type */
export function getTileTextureKey(tileType: string): string {
  return `tile_${tileType}`;
}
