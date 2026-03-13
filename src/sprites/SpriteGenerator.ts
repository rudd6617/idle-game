import { TILE_SIZE } from '../entities/constants';

const T = TILE_SIZE; // 48

// ── helpers ──────────────────────────────────────────────

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** Fill a rectangle in "big pixel" units (each unit = scale real pixels) */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, scale = 4): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
}

// ── tile sprites (48×48) ─────────────────────────────────

function drawGrass(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, T, T);
  // dithered texture
  ctx.fillStyle = '#3bcc6e';
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if ((x + y) % 3 === 0) px(ctx, x, y, 1, 1, '#3bcc6e');
    }
  }
  // occasional flower dots
  px(ctx, 3, 2, 1, 1, '#fde047');
  px(ctx, 9, 7, 1, 1, '#fde047');
  px(ctx, 6, 10, 1, 1, '#f9a8d4');
  return c;
}

function drawSoil(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(0, 0, T, T);
  // furrow lines
  for (let row = 0; row < 12; row++) {
    if (row % 3 === 0) {
      px(ctx, 0, row, 12, 1, '#7a5a10');
    }
  }
  // dirt specks
  px(ctx, 2, 1, 1, 1, '#a07820');
  px(ctx, 7, 4, 1, 1, '#a07820');
  px(ctx, 4, 8, 1, 1, '#6b4e0e');
  px(ctx, 10, 10, 1, 1, '#a07820');
  return c;
}

function drawTree(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // grass base
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, 0, T, T);
  // trunk
  px(ctx, 5, 8, 2, 4, '#8B4513');
  // canopy (circle-ish)
  px(ctx, 3, 2, 6, 6, '#228B22');
  px(ctx, 4, 1, 4, 1, '#228B22');
  px(ctx, 4, 8, 4, 1, '#228B22');
  // highlights
  px(ctx, 4, 3, 2, 2, '#2ecc40');
  return c;
}

function drawBlocked(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, T, T);
  // rock shape
  px(ctx, 2, 4, 8, 5, '#777777');
  px(ctx, 3, 3, 6, 1, '#777777');
  px(ctx, 3, 9, 6, 1, '#777777');
  // shadow
  px(ctx, 3, 8, 5, 1, '#444444');
  // highlight
  px(ctx, 4, 4, 2, 1, '#999999');
  return c;
}

// ── crop sprites (48×48, drawn on transparent bg) ────────

function drawSeedMound(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // small dirt mound
  px(ctx, 3, 8, 6, 2, '#a07820');
  px(ctx, 4, 7, 4, 1, '#8b6914');
  // seed dots
  px(ctx, 5, 8, 1, 1, '#fbbf24');
  px(ctx, 6, 9, 1, 1, '#fbbf24');
  return c;
}

function drawCarrotGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil mound
  px(ctx, 3, 9, 6, 2, '#8b6914');
  // green tops (feathery)
  px(ctx, 5, 4, 2, 1, '#22c55e');
  px(ctx, 4, 5, 4, 1, '#22c55e');
  px(ctx, 5, 6, 2, 3, '#16a34a');
  return c;
}

function drawCarrotReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 9, 6, 2, '#8b6914');
  // carrot body peeking out
  px(ctx, 5, 7, 2, 2, '#ff8c00');
  px(ctx, 5, 9, 2, 1, '#ff6600');
  // green tops (bigger)
  px(ctx, 4, 3, 4, 1, '#22c55e');
  px(ctx, 3, 4, 6, 1, '#22c55e');
  px(ctx, 5, 5, 2, 2, '#16a34a');
  return c;
}

function drawWheatGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // stalks
  px(ctx, 4, 5, 1, 5, '#90b030');
  px(ctx, 6, 6, 1, 4, '#90b030');
  px(ctx, 8, 5, 1, 5, '#90b030');
  return c;
}

function drawWheatReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // stalks
  px(ctx, 4, 4, 1, 6, '#daa520');
  px(ctx, 6, 3, 1, 7, '#daa520');
  px(ctx, 8, 4, 1, 6, '#daa520');
  // wheat heads
  px(ctx, 3, 2, 3, 2, '#f5deb3');
  px(ctx, 5, 1, 3, 2, '#f5deb3');
  px(ctx, 7, 2, 3, 2, '#f5deb3');
  return c;
}

function drawTomatoGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine
  px(ctx, 5, 4, 2, 6, '#16a34a');
  px(ctx, 4, 5, 1, 2, '#22c55e');
  px(ctx, 7, 5, 1, 2, '#22c55e');
  // leaves
  px(ctx, 3, 4, 2, 1, '#22c55e');
  px(ctx, 7, 4, 2, 1, '#22c55e');
  return c;
}

function drawTomatoReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine
  px(ctx, 5, 3, 2, 7, '#16a34a');
  // leaves
  px(ctx, 3, 3, 2, 1, '#22c55e');
  px(ctx, 7, 3, 2, 1, '#22c55e');
  // tomatoes!
  px(ctx, 3, 6, 2, 2, '#ef4444');
  px(ctx, 7, 5, 2, 2, '#ef4444');
  px(ctx, 5, 8, 2, 2, '#dc2626');
  // highlights
  px(ctx, 3, 6, 1, 1, '#ff6b6b');
  px(ctx, 7, 5, 1, 1, '#ff6b6b');
  return c;
}

// ── indicator icons (12×12) ──────────────────────────────

function drawWaterDrop(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2; // pixel scale for 12px canvas
  ctx.fillStyle = '#3b82f6';
  // teardrop shape
  px(ctx, 2, 0, 2, 1, '#3b82f6', s);
  px(ctx, 1, 1, 4, 1, '#3b82f6', s);
  px(ctx, 1, 2, 4, 1, '#3b82f6', s);
  px(ctx, 1, 3, 4, 1, '#60a5fa', s);
  px(ctx, 2, 4, 2, 1, '#3b82f6', s);
  // highlight
  px(ctx, 2, 2, 1, 1, '#93c5fd', s);
  return c;
}

function drawWeedIcon(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // stem
  px(ctx, 2, 2, 1, 4, '#65a30d', s);
  // leaves
  px(ctx, 1, 1, 1, 1, '#84cc16', s);
  px(ctx, 3, 2, 1, 1, '#84cc16', s);
  px(ctx, 1, 3, 1, 1, '#84cc16', s);
  px(ctx, 3, 4, 1, 1, '#84cc16', s);
  return c;
}

// ── worker sprites (16×16) ──────────────────────────────

function drawWorkerIdle(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  const s = 2;
  // head
  px(ctx, 3, 0, 2, 2, '#fcd6a0', s);
  // hat
  px(ctx, 2, 0, 4, 1, '#8b5cf6', s);
  // body
  px(ctx, 3, 2, 2, 3, '#3b82f6', s);
  // legs
  px(ctx, 3, 5, 1, 2, '#1e3a5f', s);
  px(ctx, 4, 5, 1, 2, '#1e3a5f', s);
  // arms
  px(ctx, 2, 2, 1, 2, '#fcd6a0', s);
  px(ctx, 5, 2, 1, 2, '#fcd6a0', s);
  return c;
}

function drawWorkerWorking(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  const s = 2;
  // head (bent forward)
  px(ctx, 4, 1, 2, 2, '#fcd6a0', s);
  // hat
  px(ctx, 3, 1, 4, 1, '#8b5cf6', s);
  // body (leaning)
  px(ctx, 3, 3, 2, 2, '#3b82f6', s);
  // legs
  px(ctx, 2, 5, 1, 2, '#1e3a5f', s);
  px(ctx, 4, 5, 1, 2, '#1e3a5f', s);
  // arms reaching down
  px(ctx, 5, 3, 1, 1, '#fcd6a0', s);
  px(ctx, 6, 4, 1, 1, '#fcd6a0', s);
  // tool
  px(ctx, 6, 5, 1, 2, '#a0a0a0', s);
  return c;
}

// ── registration ─────────────────────────────────────────

export function generateAllSprites(scene: Phaser.Scene): void {
  const add = (key: string, canvas: HTMLCanvasElement) => {
    scene.textures.addCanvas(key, canvas);
  };

  // tiles
  add('tile_grass', drawGrass());
  add('tile_soil', drawSoil());
  add('tile_tree', drawTree());
  add('tile_blocked', drawBlocked());

  // crops — all 3 share the same seed sprite
  add('crop_seed', drawSeedMound());
  add('crop_carrot_growing', drawCarrotGrowing());
  add('crop_carrot_ready', drawCarrotReady());
  add('crop_wheat_growing', drawWheatGrowing());
  add('crop_wheat_ready', drawWheatReady());
  add('crop_tomato_growing', drawTomatoGrowing());
  add('crop_tomato_ready', drawTomatoReady());

  // indicators
  add('icon_water', drawWaterDrop());
  add('icon_weed', drawWeedIcon());

  // workers
  add('worker_idle', drawWorkerIdle());
  add('worker_working', drawWorkerWorking());
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
