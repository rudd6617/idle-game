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

function drawStone(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, T, T);
  // big rock shape
  px(ctx, 2, 3, 8, 6, '#777777');
  px(ctx, 3, 2, 6, 1, '#888888');
  px(ctx, 3, 9, 6, 1, '#666666');
  px(ctx, 3, 8, 5, 1, '#444444');
  px(ctx, 4, 4, 2, 1, '#999999');
  return c;
}

function drawSmallWood(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, T, T);
  // small stump
  px(ctx, 4, 7, 4, 3, '#8B4513');
  px(ctx, 5, 6, 2, 1, '#a0522d');
  // few leaves
  px(ctx, 3, 5, 2, 2, '#228B22');
  px(ctx, 7, 4, 2, 2, '#228B22');
  return c;
}

function drawSmallStone(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, T, T);
  // small rocks
  px(ctx, 4, 7, 3, 2, '#888888');
  px(ctx, 3, 8, 1, 1, '#777777');
  px(ctx, 7, 6, 2, 2, '#999999');
  px(ctx, 8, 7, 1, 1, '#666666');
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

function drawPotatoGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil mound
  px(ctx, 3, 9, 6, 2, '#8b6914');
  // small green sprout
  px(ctx, 5, 5, 2, 1, '#22c55e');
  px(ctx, 5, 6, 2, 3, '#16a34a');
  // leaves
  px(ctx, 4, 4, 1, 1, '#22c55e');
  px(ctx, 7, 4, 1, 1, '#22c55e');
  return c;
}

function drawPotatoReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 9, 6, 2, '#8b6914');
  // green plant above
  px(ctx, 4, 3, 4, 1, '#22c55e');
  px(ctx, 5, 4, 2, 2, '#16a34a');
  // potato tubers peeking from soil
  px(ctx, 3, 8, 2, 2, '#c8a55a');
  px(ctx, 7, 8, 2, 2, '#b8954a');
  px(ctx, 5, 9, 2, 1, '#d4b06a');
  // highlight
  px(ctx, 3, 8, 1, 1, '#dac07a');
  return c;
}

function drawStrawberryGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // low green bush
  px(ctx, 3, 7, 6, 3, '#16a34a');
  px(ctx, 4, 6, 4, 1, '#22c55e');
  // small white flowers
  px(ctx, 4, 7, 1, 1, '#ffffff');
  px(ctx, 7, 8, 1, 1, '#ffffff');
  return c;
}

function drawStrawberryReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // green bush
  px(ctx, 3, 6, 6, 4, '#16a34a');
  px(ctx, 4, 5, 4, 1, '#22c55e');
  // red berries
  px(ctx, 3, 8, 2, 2, '#ef4444');
  px(ctx, 7, 7, 2, 2, '#dc2626');
  px(ctx, 5, 9, 2, 1, '#ef4444');
  // green leaf tops on berries
  px(ctx, 3, 8, 1, 1, '#22c55e');
  px(ctx, 7, 7, 1, 1, '#22c55e');
  // highlight
  px(ctx, 4, 8, 1, 1, '#ff6b6b');
  return c;
}

function drawCornGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // tall green stalks
  px(ctx, 4, 4, 1, 6, '#16a34a');
  px(ctx, 7, 3, 1, 7, '#16a34a');
  // leaves
  px(ctx, 3, 5, 1, 1, '#22c55e');
  px(ctx, 5, 6, 1, 1, '#22c55e');
  px(ctx, 6, 4, 1, 1, '#22c55e');
  px(ctx, 8, 5, 1, 1, '#22c55e');
  return c;
}

function drawCornReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // tall green stalks
  px(ctx, 4, 2, 1, 8, '#16a34a');
  px(ctx, 7, 1, 1, 9, '#16a34a');
  // leaves
  px(ctx, 3, 3, 1, 1, '#22c55e');
  px(ctx, 5, 4, 1, 1, '#22c55e');
  px(ctx, 6, 2, 1, 1, '#22c55e');
  px(ctx, 8, 3, 1, 1, '#22c55e');
  // corn cobs (yellow)
  px(ctx, 5, 5, 1, 3, '#fbbf24');
  px(ctx, 8, 4, 1, 3, '#fbbf24');
  // husk
  px(ctx, 5, 5, 1, 1, '#a3d977');
  px(ctx, 8, 4, 1, 1, '#a3d977');
  return c;
}

function drawPumpkinGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine along ground
  px(ctx, 2, 9, 8, 1, '#16a34a');
  // small green bump (unripe pumpkin)
  px(ctx, 5, 7, 3, 2, '#4ade80');
  // leaves
  px(ctx, 3, 7, 2, 1, '#22c55e');
  px(ctx, 8, 8, 2, 1, '#22c55e');
  return c;
}

function drawPumpkinReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine
  px(ctx, 2, 9, 8, 1, '#16a34a');
  // large orange pumpkin
  px(ctx, 4, 6, 4, 3, '#f97316');
  px(ctx, 3, 7, 1, 1, '#f97316');
  px(ctx, 8, 7, 1, 1, '#f97316');
  // ridges
  px(ctx, 6, 6, 1, 3, '#ea580c');
  // stem
  px(ctx, 5, 5, 2, 1, '#65a30d');
  // highlight
  px(ctx, 4, 6, 1, 1, '#fb923c');
  return c;
}

function drawSunflowerGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // tall green stalk
  px(ctx, 5, 3, 2, 7, '#16a34a');
  // leaves
  px(ctx, 3, 6, 2, 1, '#22c55e');
  px(ctx, 7, 5, 2, 1, '#22c55e');
  // small bud (not yet bloomed)
  px(ctx, 5, 2, 2, 1, '#84cc16');
  return c;
}

function drawSunflowerReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // tall green stalk
  px(ctx, 5, 5, 2, 5, '#16a34a');
  // leaves
  px(ctx, 3, 7, 2, 1, '#22c55e');
  px(ctx, 7, 6, 2, 1, '#22c55e');
  // yellow petals
  px(ctx, 3, 1, 6, 1, '#facc15');
  px(ctx, 2, 2, 8, 1, '#facc15');
  px(ctx, 2, 3, 1, 2, '#facc15');
  px(ctx, 9, 3, 1, 2, '#facc15');
  px(ctx, 3, 5, 6, 1, '#facc15');
  // brown center
  px(ctx, 3, 2, 6, 3, '#92400e');
  px(ctx, 4, 2, 4, 3, '#78350f');
  // seed dots
  px(ctx, 5, 3, 1, 1, '#451a03');
  px(ctx, 7, 3, 1, 1, '#451a03');
  return c;
}

function drawGrapeGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine trellis (vertical stick)
  px(ctx, 5, 3, 2, 7, '#8B4513');
  // horizontal support
  px(ctx, 3, 3, 6, 1, '#a0522d');
  // leaves
  px(ctx, 3, 4, 2, 2, '#22c55e');
  px(ctx, 7, 4, 2, 2, '#22c55e');
  // small green grape buds
  px(ctx, 4, 6, 1, 1, '#86efac');
  px(ctx, 7, 6, 1, 1, '#86efac');
  return c;
}

function drawGrapeReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // vine trellis
  px(ctx, 5, 3, 2, 7, '#8B4513');
  // horizontal support
  px(ctx, 3, 3, 6, 1, '#a0522d');
  // leaves
  px(ctx, 3, 4, 2, 1, '#22c55e');
  px(ctx, 7, 4, 2, 1, '#22c55e');
  // purple grape clusters
  px(ctx, 3, 5, 2, 3, '#7c3aed');
  px(ctx, 4, 6, 1, 2, '#6d28d9');
  px(ctx, 7, 5, 2, 3, '#7c3aed');
  px(ctx, 8, 6, 1, 2, '#6d28d9');
  // highlights
  px(ctx, 3, 5, 1, 1, '#a78bfa');
  px(ctx, 7, 5, 1, 1, '#a78bfa');
  return c;
}

function drawCoffeeGrowing(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // green bush
  px(ctx, 3, 5, 6, 5, '#16a34a');
  px(ctx, 4, 4, 4, 1, '#22c55e');
  // lighter leaf accents
  px(ctx, 4, 6, 1, 1, '#22c55e');
  px(ctx, 7, 7, 1, 1, '#22c55e');
  return c;
}

function drawCoffeeReady(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  // soil
  px(ctx, 3, 10, 6, 1, '#8b6914');
  // green bush
  px(ctx, 3, 4, 6, 6, '#16a34a');
  px(ctx, 4, 3, 4, 1, '#22c55e');
  // coffee cherries (dark red-brown beans)
  px(ctx, 4, 6, 1, 1, '#7f1d1d');
  px(ctx, 6, 5, 1, 1, '#7f1d1d');
  px(ctx, 3, 8, 1, 1, '#92400e');
  px(ctx, 7, 7, 1, 1, '#7f1d1d');
  px(ctx, 5, 8, 1, 1, '#92400e');
  // lighter leaf highlights
  px(ctx, 5, 4, 1, 1, '#22c55e');
  px(ctx, 7, 6, 1, 1, '#22c55e');
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

// ── mini crop icons (12×12, for UI indicators) ──────────

function drawMiniCarrot(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // orange body
  px(ctx, 2, 2, 2, 3, '#ff8c00', s);
  // green top
  px(ctx, 2, 0, 2, 2, '#22c55e', s);
  px(ctx, 1, 1, 1, 1, '#22c55e', s);
  px(ctx, 4, 1, 1, 1, '#22c55e', s);
  // tip
  px(ctx, 2, 5, 2, 1, '#ff6600', s);
  return c;
}

function drawMiniWheat(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // stalks
  px(ctx, 1, 2, 1, 4, '#daa520', s);
  px(ctx, 3, 2, 1, 4, '#daa520', s);
  px(ctx, 5, 2, 1, 4, '#daa520', s);
  // wheat heads
  px(ctx, 0, 0, 2, 2, '#f5deb3', s);
  px(ctx, 2, 0, 2, 2, '#f5deb3', s);
  px(ctx, 4, 0, 2, 2, '#f5deb3', s);
  return c;
}

function drawMiniTomato(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // red body
  px(ctx, 1, 2, 4, 3, '#ef4444', s);
  px(ctx, 2, 1, 2, 1, '#ef4444', s);
  px(ctx, 2, 5, 2, 1, '#ef4444', s);
  // green stem
  px(ctx, 2, 0, 2, 1, '#22c55e', s);
  // highlight
  px(ctx, 2, 2, 1, 1, '#ff6b6b', s);
  return c;
}

function drawMiniFallow(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // red X
  ctx.fillStyle = '#ef4444';
  for (let i = 0; i < 6; i++) {
    px(ctx, i, i, 1, 1, '#ef4444', s);
    px(ctx, 5 - i, i, 1, 1, '#ef4444', s);
  }
  return c;
}

function drawMiniPotato(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // brown oval body
  px(ctx, 1, 2, 4, 3, '#c8a55a', s);
  px(ctx, 2, 1, 2, 1, '#c8a55a', s);
  px(ctx, 2, 5, 2, 1, '#b8954a', s);
  // eye spots
  px(ctx, 2, 3, 1, 1, '#a07820', s);
  px(ctx, 4, 2, 1, 1, '#a07820', s);
  // highlight
  px(ctx, 2, 2, 1, 1, '#dac07a', s);
  return c;
}

function drawMiniStrawberry(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // red body (tapered)
  px(ctx, 1, 2, 4, 2, '#ef4444', s);
  px(ctx, 2, 4, 2, 1, '#dc2626', s);
  px(ctx, 2, 5, 1, 1, '#dc2626', s);
  // green leaf top
  px(ctx, 1, 1, 4, 1, '#22c55e', s);
  px(ctx, 2, 0, 2, 1, '#16a34a', s);
  // seed dots
  px(ctx, 2, 3, 1, 1, '#fbbf24', s);
  px(ctx, 4, 2, 1, 1, '#fbbf24', s);
  return c;
}

function drawMiniCorn(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // yellow corn cob
  px(ctx, 2, 1, 2, 4, '#fbbf24', s);
  px(ctx, 2, 5, 2, 1, '#f59e0b', s);
  // green husk
  px(ctx, 1, 1, 1, 3, '#22c55e', s);
  px(ctx, 4, 2, 1, 2, '#22c55e', s);
  // silk top
  px(ctx, 2, 0, 1, 1, '#f5deb3', s);
  px(ctx, 3, 0, 1, 1, '#daa520', s);
  return c;
}

function drawMiniPumpkin(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // orange body
  px(ctx, 1, 2, 4, 3, '#f97316', s);
  px(ctx, 2, 1, 2, 1, '#f97316', s);
  px(ctx, 2, 5, 2, 1, '#ea580c', s);
  // ridge
  px(ctx, 3, 2, 1, 3, '#ea580c', s);
  // green stem
  px(ctx, 2, 0, 2, 1, '#65a30d', s);
  // highlight
  px(ctx, 1, 2, 1, 1, '#fb923c', s);
  return c;
}

function drawMiniSunflower(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // yellow petals
  px(ctx, 1, 0, 4, 1, '#facc15', s);
  px(ctx, 0, 1, 1, 3, '#facc15', s);
  px(ctx, 5, 1, 1, 3, '#facc15', s);
  px(ctx, 1, 4, 4, 1, '#facc15', s);
  // brown center
  px(ctx, 1, 1, 4, 3, '#92400e', s);
  px(ctx, 2, 2, 2, 1, '#78350f', s);
  // stem
  px(ctx, 2, 5, 2, 1, '#16a34a', s);
  return c;
}

function drawMiniGrape(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // purple grape cluster (triangle-ish)
  px(ctx, 1, 1, 4, 1, '#7c3aed', s);
  px(ctx, 1, 2, 3, 1, '#7c3aed', s);
  px(ctx, 2, 3, 2, 1, '#6d28d9', s);
  px(ctx, 2, 4, 1, 1, '#6d28d9', s);
  // green stem
  px(ctx, 2, 0, 2, 1, '#22c55e', s);
  // highlight
  px(ctx, 1, 1, 1, 1, '#a78bfa', s);
  px(ctx, 3, 2, 1, 1, '#a78bfa', s);
  return c;
}

function drawMiniCoffee(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  // dark brown bean shape
  px(ctx, 1, 1, 4, 3, '#7f1d1d', s);
  px(ctx, 2, 0, 2, 1, '#92400e', s);
  px(ctx, 2, 4, 2, 1, '#7f1d1d', s);
  // center line (bean crease)
  px(ctx, 2, 1, 1, 3, '#451a03', s);
  // highlight
  px(ctx, 3, 1, 1, 1, '#a07820', s);
  // green leaf
  px(ctx, 4, 0, 1, 1, '#22c55e', s);
  return c;
}

// ── facility sprites ─────────────────────────────────────

function drawWarehouse(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  const s = 4;
  // floor
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, T, T);
  // walls
  px(ctx, 0, 0, 12, 1, '#5c4033', s);
  px(ctx, 0, 11, 12, 1, '#5c4033', s);
  px(ctx, 0, 0, 1, 12, '#5c4033', s);
  px(ctx, 11, 0, 1, 12, '#5c4033', s);
  // roof
  px(ctx, 1, 1, 10, 3, '#a0522d', s);
  px(ctx, 2, 0, 8, 1, '#cd853f', s);
  // door
  px(ctx, 4, 7, 4, 5, '#654321', s);
  px(ctx, 5, 9, 2, 1, '#ffd700', s);
  // crate
  px(ctx, 1, 7, 2, 2, '#daa520', s);
  return c;
}

function drawMiniWarehouse(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  px(ctx, 0, 1, 6, 5, '#8b7355', s);
  px(ctx, 0, 0, 6, 1, '#a0522d', s);
  px(ctx, 2, 3, 2, 3, '#654321', s);
  px(ctx, 4, 2, 2, 2, '#daa520', s);
  return c;
}


// ── toolbar icons (24×24) ───────────────────────────────

function drawToolbarIcon(draw: (ctx: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(24, 24);
  draw(ctx, 3);
  return c;
}

function drawIconFarm(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 2, 5, 4, 2, '#8b6914', s); // soil
    px(ctx, 3, 3, 2, 2, '#22c55e', s); // plant
    px(ctx, 3, 2, 2, 1, '#16a34a', s);
  });
}

function drawIconDemolish(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 3, 1, 2, 5, '#a0a0a0', s); // hammer head
    px(ctx, 2, 1, 1, 2, '#888888', s);
    px(ctx, 4, 3, 1, 4, '#8B4513', s); // handle
  });
}

function drawIconGatherWood(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 1, 2, 1, 5, '#a0a0a0', s); // axe blade
    px(ctx, 2, 3, 1, 1, '#a0a0a0', s);
    px(ctx, 2, 1, 1, 6, '#8B4513', s); // handle
    px(ctx, 4, 3, 3, 3, '#228B22', s); // tree
    px(ctx, 5, 5, 1, 2, '#8B4513', s);
  });
}

function drawIconGatherStone(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 1, 2, 1, 5, '#a0a0a0', s); // pickaxe
    px(ctx, 2, 3, 1, 1, '#a0a0a0', s);
    px(ctx, 2, 1, 1, 6, '#8B4513', s);
    px(ctx, 4, 4, 4, 3, '#888888', s); // rock
    px(ctx, 5, 3, 2, 1, '#999999', s);
  });
}

function drawIconSell(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 2, 1, 4, 5, '#ffd700', s); // coin
    px(ctx, 3, 0, 2, 1, '#ffd700', s);
    px(ctx, 3, 6, 2, 1, '#ffd700', s);
    px(ctx, 3, 3, 2, 1, '#daa520', s); // $ line
  });
}

function drawIconUpgrade(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 3, 1, 2, 6, '#4ade80', s); // arrow up
    px(ctx, 2, 2, 1, 1, '#4ade80', s);
    px(ctx, 5, 2, 1, 1, '#4ade80', s);
    px(ctx, 1, 3, 1, 1, '#4ade80', s);
    px(ctx, 6, 3, 1, 1, '#4ade80', s);
  });
}

function drawIconCrops(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 1, 4, 2, 2, '#ff8c00', s); // carrot
    px(ctx, 1, 3, 1, 1, '#22c55e', s);
    px(ctx, 4, 3, 2, 3, '#ef4444', s); // tomato
    px(ctx, 4, 2, 2, 1, '#22c55e', s);
  });
}

function drawIconOrders(): HTMLCanvasElement {
  return drawToolbarIcon((ctx, s) => {
    px(ctx, 1, 0, 6, 7, '#f5deb3', s); // paper
    px(ctx, 2, 2, 4, 1, '#888888', s); // line 1
    px(ctx, 2, 4, 3, 1, '#888888', s); // line 2
  });
}

function drawLockIcon(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(T, T);
  const s = 4;
  // lock body
  px(ctx, 3, 6, 6, 5, '#888888', s);
  // keyhole
  px(ctx, 5, 8, 2, 2, '#333333', s);
  px(ctx, 5, 10, 2, 1, '#333333', s);
  // shackle (arch)
  px(ctx, 4, 3, 1, 3, '#aaaaaa', s);
  px(ctx, 7, 3, 1, 3, '#aaaaaa', s);
  px(ctx, 5, 2, 2, 1, '#aaaaaa', s);
  return c;
}

function drawChickenCoop(): HTMLCanvasElement {
  const size = 3 * T; // 144×144
  const [c, ctx] = makeCanvas(size, size);
  const s = 4;
  // dirt floor
  ctx.fillStyle = '#a07820';
  ctx.fillRect(0, 0, size, size);
  // wooden walls
  px(ctx, 0, 0, 36, 2, '#8B4513', s);   // top
  px(ctx, 0, 34, 36, 2, '#8B4513', s);  // bottom
  px(ctx, 0, 0, 2, 36, '#8B4513', s);   // left
  px(ctx, 34, 0, 2, 36, '#8B4513', s);  // right
  // roof
  px(ctx, 4, 2, 28, 6, '#d2691e', s);
  px(ctx, 8, 0, 20, 2, '#cd853f', s);
  // chickens (white blobs)
  px(ctx, 8, 14, 3, 3, '#ffffff', s);
  px(ctx, 8, 13, 1, 1, '#ff0000', s);   // comb
  px(ctx, 20, 18, 3, 3, '#ffffff', s);
  px(ctx, 20, 17, 1, 1, '#ff0000', s);
  px(ctx, 14, 24, 3, 3, '#ffffff', s);
  px(ctx, 14, 23, 1, 1, '#ff0000', s);
  // nest with egg
  px(ctx, 26, 26, 4, 3, '#daa520', s);
  px(ctx, 27, 27, 2, 1, '#fffdd0', s);
  return c;
}

function drawCowBarn(): HTMLCanvasElement {
  const size = 4 * T; // 192×192
  const [c, ctx] = makeCanvas(size, size);
  const s = 4;
  // grass floor
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(0, 0, size, size);
  // barn structure
  px(ctx, 2, 8, 44, 32, '#8b4513', s);
  // roof
  px(ctx, 0, 4, 48, 6, '#a0522d', s);
  px(ctx, 4, 2, 40, 2, '#cd853f', s);
  px(ctx, 8, 0, 32, 2, '#d2691e', s);
  // barn door
  px(ctx, 20, 20, 8, 20, '#654321', s);
  px(ctx, 23, 28, 2, 2, '#ffd700', s);  // handle
  // hay bale
  px(ctx, 6, 30, 6, 6, '#daa520', s);
  px(ctx, 7, 31, 4, 1, '#f5deb3', s);
  // cow (right side, outside)
  px(ctx, 36, 28, 6, 4, '#ffffff', s);   // body
  px(ctx, 34, 26, 3, 3, '#ffffff', s);   // head
  px(ctx, 34, 26, 1, 1, '#333333', s);   // eye
  px(ctx, 36, 32, 2, 4, '#333333', s);   // legs
  px(ctx, 40, 32, 2, 4, '#333333', s);
  // spots
  px(ctx, 38, 29, 2, 2, '#333333', s);
  return c;
}

// mini facility icons (12×12)
function drawMiniChicken(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  px(ctx, 2, 2, 3, 3, '#ffffff', s);  // body
  px(ctx, 2, 1, 1, 1, '#ff0000', s);  // comb
  px(ctx, 1, 3, 1, 1, '#ffa500', s);  // beak
  px(ctx, 3, 5, 1, 1, '#ffa500', s);  // legs
  px(ctx, 4, 5, 1, 1, '#ffa500', s);
  return c;
}

function drawMiniCow(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  const s = 2;
  px(ctx, 1, 2, 4, 3, '#ffffff', s);  // body
  px(ctx, 0, 1, 2, 2, '#ffffff', s);  // head
  px(ctx, 0, 1, 1, 1, '#333333', s);  // eye
  px(ctx, 2, 3, 1, 1, '#333333', s);  // spot
  px(ctx, 1, 5, 1, 1, '#333333', s);  // legs
  px(ctx, 4, 5, 1, 1, '#333333', s);
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
  add('tile_wood', drawTree());
  add('tile_stone', drawStone());
  add('tile_small_wood', drawSmallWood());
  add('tile_small_stone', drawSmallStone());

  // crops — all share the same seed sprite
  add('crop_seed', drawSeedMound());
  add('crop_carrot_growing', drawCarrotGrowing());
  add('crop_carrot_ready', drawCarrotReady());
  add('crop_wheat_growing', drawWheatGrowing());
  add('crop_wheat_ready', drawWheatReady());
  add('crop_tomato_growing', drawTomatoGrowing());
  add('crop_tomato_ready', drawTomatoReady());
  add('crop_potato_growing', drawPotatoGrowing());
  add('crop_potato_ready', drawPotatoReady());
  add('crop_strawberry_growing', drawStrawberryGrowing());
  add('crop_strawberry_ready', drawStrawberryReady());
  add('crop_corn_growing', drawCornGrowing());
  add('crop_corn_ready', drawCornReady());
  add('crop_pumpkin_growing', drawPumpkinGrowing());
  add('crop_pumpkin_ready', drawPumpkinReady());
  add('crop_sunflower_growing', drawSunflowerGrowing());
  add('crop_sunflower_ready', drawSunflowerReady());
  add('crop_grape_growing', drawGrapeGrowing());
  add('crop_grape_ready', drawGrapeReady());
  add('crop_coffee_growing', drawCoffeeGrowing());
  add('crop_coffee_ready', drawCoffeeReady());

  // indicators
  add('icon_water', drawWaterDrop());
  add('icon_weed', drawWeedIcon());

  // workers
  add('worker_idle', drawWorkerIdle());
  add('worker_working', drawWorkerWorking());

  // mini crop icons (for indicators & UI)
  add('icon_carrot', drawMiniCarrot());
  add('icon_wheat', drawMiniWheat());
  add('icon_tomato', drawMiniTomato());
  add('icon_fallow', drawMiniFallow());
  add('icon_potato', drawMiniPotato());
  add('icon_strawberry', drawMiniStrawberry());
  add('icon_corn', drawMiniCorn());
  add('icon_pumpkin', drawMiniPumpkin());
  add('icon_sunflower', drawMiniSunflower());
  add('icon_grape', drawMiniGrape());
  add('icon_coffee', drawMiniCoffee());

  // UI icons
  add('icon_lock', drawLockIcon());
  add('tb_farm', drawIconFarm());
  add('tb_demolish', drawIconDemolish());
  add('tb_gather_wood', drawIconGatherWood());
  add('tb_gather_stone', drawIconGatherStone());
  add('tb_sell', drawIconSell());
  add('tb_upgrade', drawIconUpgrade());
  add('tb_crops', drawIconCrops());
  add('tb_orders', drawIconOrders());

  // facilities
  add('facility_warehouse', drawWarehouse());
  add('facility_chicken_coop', drawChickenCoop());
  add('facility_cow_barn', drawCowBarn());
  add('icon_warehouse', drawMiniWarehouse());
  add('icon_chicken_coop', drawMiniChicken());
  add('icon_cow_barn', drawMiniCow());
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
