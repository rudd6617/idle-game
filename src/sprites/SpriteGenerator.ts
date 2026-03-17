import { TILE_SIZE } from '../entities/constants';

const T = TILE_SIZE; // 48

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

/** Draw pixel art from string rows + color palette. '.' = transparent. */
function px(w: number, h: number, rows: string[], pal: Record<string, string>): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const cols = rows[0]!.length;
  const sw = w / cols, sh = h / rows.length;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = rows[y]![x]!;
      if (ch === '.' || !pal[ch]) continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(Math.floor(x * sw), Math.floor(y * sh), Math.ceil(sw), Math.ceil(sh));
    }
  }
  return c;
}

// ── palettes ──────────────────────────────────────────────

const P = {
  // Nature
  grass1: '#5cb85c', grass2: '#4a9e4a', flower1: '#fde047', flower2: '#f9a8d4',
  soil1: '#8b6914', soil2: '#7a5a10', soil3: '#9e7b28',
  trunk: '#5c3a1a', bark: '#7a5232', leaf1: '#2d6b30', leaf2: '#3e8c3a', leaf3: '#50a050',
  rock1: '#777777', rock2: '#999999', rock3: '#555555',
  // Crops
  green1: '#3da53d', green2: '#2d8a2d', green3: '#6ec96e',
  orange: '#e87830', orange2: '#c06020',
  gold: '#d4a017', gold2: '#b8860b',
  red: '#cc3333', red2: '#992222',
  brown: '#8b6914', brown2: '#6b4e12',
  yellow: '#f0c040', yellow2: '#d4a020',
  purple: '#7744aa', purple2: '#553388',
  pink: '#e05080',
  // Building
  wood1: '#a07840', wood2: '#886030', wood3: '#c09060',
  roof1: '#884422', roof2: '#aa5533',
  stone1: '#888888', stone2: '#aaaaaa', stone3: '#666666',
  hay: '#d4a830', hay2: '#b89020',
  fence: '#c09868',
  metal: '#8899aa', metal2: '#667788',
  brick: '#994433', brick2: '#773322',
  // Character
  skin: '#f0c0a0', hair: '#553322', shirt: '#4488cc', pants: '#334466', shoe: '#333333',
  // UI
  white: '#ffffff', black: '#222222', gray: '#888888',
  blue: '#4488cc', cyan: '#44bbdd',
  lockGold: '#ccaa33', lockDark: '#887722',
};

// ── registration ─────────────────────────────────────────

export function generateAllSprites(scene: Phaser.Scene): void {
  const add = (key: string, canvas: HTMLCanvasElement) => {
    scene.textures.addCanvas(key, canvas);
  };

  // === TILES (16x16 → 48x48) ===
  add('tile_grass', px(T, T, [
    'gggggggggggggggg',
    'gGggfgGgggggggGg',
    'ggggggggggGggggg',
    'gggGgggggggggggg',
    'ggggggggGgggpggg',
    'gGgggggggggGgggg',
    'gggggGgggggggggg',
    'ggggggggggggGggg',
    'ggGgggfgGggggggg',
    'ggggggggggggggGg',
    'gggGggggggGggggg',
    'gggggggggggggggg',
    'gGgggpggggggGggg',
    'ggggGggggggggggg',
    'gggggggGgggggggg',
    'gggggggggggggggg',
  ], { g: P.grass1, G: P.grass2, f: P.flower1, p: P.flower2 }));

  add('tile_soil', px(T, T, [
    'bLbbbbLbbbbbLbbb',
    'BBBBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbbbb',
    'bbbLbbbbbbLbbbbb',
    'BBBBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbbbb',
    'bbLbbbbbbbbbbLbb',
    'BBBBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbbbb',
    'bbbbbbbLbbbbbbbb',
    'BBBBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbbbb',
    'bLbbbbbbbbbLbbbb',
    'BBBBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbbbb',
    'bbbbbLbbbbbbbbLb',
  ], { b: P.soil1, B: P.soil2, L: P.soil3 }));

  add('tile_wood', px(T, T, [
    '....DDDDDD......',
    '...DDdDDDDDd....',
    '..DDDDDdDDDDD...',
    '.DDdDDDDDDDDDD..',
    '.DDDDDDDdDDDDD..',
    'DDDDdDDDDDDdDDD.',
    '.DDDDDDDDDDDDDd.',
    '..DDDdDDDDDDDD..',
    '...DDDDDdDDDD...',
    '....DDDDDDDd....',
    '......TT........',
    '......TT........',
    '......tT........',
    '......TT........',
    '................',
    '................',
  ], { D: P.leaf1, d: P.leaf2, T: P.trunk, t: P.bark }));

  add('tile_stone', px(T, T, [
    '................',
    '................',
    '....SSSSSS......',
    '...SssSSSSS.....',
    '..SSSSSsSSSS....',
    '..SSSSSSSSS.....',
    '..SsSSSSSSS.....',
    '...SSSSSSS......',
    '........SSSSS...',
    '.......SSSsSSSS.',
    '......SSSSSSsSS.',
    '......SSSSSSSSS.',
    '.......SSSSSS...',
    '................',
    '................',
    '................',
  ], { S: P.rock1, s: P.rock2, D: P.rock3 }));

  add('tile_small_wood', px(T, T, [
    'gggggggggggggggg',
    'gGggggGgggggggGg',
    'ggggggggggGggggg',
    'gggGgddddggggggg',
    'gggdddDddddggggg',
    'ggddDdddDddggggg',
    'gggdddDdddgggggg',
    'ggggddddgggggggg',
    'gggggttggggggggg',
    'ggGgggggggGggggg',
    'gggggggggggggggg',
    'gGggggggggggGggg',
    'ggggGggggggggggg',
    'gggggggGgggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
  ], { g: P.grass1, G: P.grass2, d: P.leaf2, D: P.leaf3, t: P.trunk }));

  add('tile_small_stone', px(T, T, [
    'gggggggggggggggg',
    'gGggggGgggggggGg',
    'ggggggggggGggggg',
    'gggGgggggggggggg',
    'gggggggggggggggg',
    'gGgggSSSSgGggggg',
    'ggggSsSSSSgggggg',
    'ggggSSSSsSgggggg',
    'gggggSSSSggggggg',
    'ggggggggggggggGg',
    'gggGggggggGggggg',
    'gggggggggggggggg',
    'gGggggggggggGggg',
    'ggggGggggggggggg',
    'gggggggGgggggggg',
    'gggggggggggggggg',
  ], { g: P.grass1, G: P.grass2, S: P.rock1, s: P.rock2 }));

  // === CROPS (16x16 → 48x48) ===
  add('crop_seed', px(T, T, [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......b.........',
    '................',
    '....b.....b.....',
    '................',
    '..........b.....',
    '.....b..........',
    '................',
    '...b............',
    '................',
    '................',
    '................',
  ], { b: P.brown2 }));

  const growingArt = [
    '................',
    '................',
    '................',
    '................',
    '.......g........',
    '......gG........',
    '......Gg........',
    '.....gGg........',
    '......G.........',
    '......G.........',
    '......G.........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];
  const growPal = { g: P.green3, G: P.green1 };

  // Crop-specific ready sprites
  const cropArts: Record<string, { rows: string[]; pal: Record<string, string> }> = {
    carrot: { rows: [
      '................',
      '......gg........',
      '.....gGGg.......',
      '....gGggGg......',
      '......OO........',
      '.....OOOO.......',
      '......OO........',
      '......Oo........',
      '.......o........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green3, G: P.green1, O: P.orange, o: P.orange2 } },
    wheat: { rows: [
      '................',
      '......YY........',
      '.....YYYY.......',
      '......YY........',
      '.....YYYY.......',
      '......Yy........',
      '......GG........',
      '......GG........',
      '......GG........',
      '......GG........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { Y: P.gold, y: P.gold2, G: P.green1 } },
    tomato: { rows: [
      '................',
      '.......g........',
      '......ggg.......',
      '.....RRRR.......',
      '....RRRRRR......',
      '....RRRRRR......',
      '....RRrRRR......',
      '.....RRRR.......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green1, R: P.red, r: P.red2 } },
    potato: { rows: [
      '................',
      '......g.........',
      '.....gGg........',
      '......G.........',
      '......G.........',
      '.....BBB........',
      '....BBbBB.......',
      '....BBBBB.......',
      '....BBbBB.......',
      '.....BBB........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green3, G: P.green1, B: P.brown, b: P.brown2 } },
    strawberry: { rows: [
      '................',
      '......gg........',
      '.....gGGg.......',
      '.....RRRR.......',
      '....RRRRRR......',
      '....RRwRRR......',
      '....RRRwRR......',
      '.....RRRR.......',
      '......RR........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green1, G: P.green3, R: P.red, w: P.pink } },
    corn: { rows: [
      '......g.........',
      '.....gGg........',
      '....gGGGg.......',
      '....gYYYg.......',
      '....YYYYY.......',
      '....YYyYY.......',
      '....YYYYY.......',
      '....YYyYY.......',
      '....YYYYY.......',
      '.....GG.........',
      '......G.........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green1, G: P.green3, Y: P.yellow, y: P.yellow2 } },
    pumpkin: { rows: [
      '................',
      '......g.........',
      '......G.........',
      '....OOOOOO......',
      '...OOOoOOOO.....',
      '...OOOOOOOO.....',
      '...OOoOOoOO.....',
      '...OOOOOOOO.....',
      '....OOOOOO......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green1, G: P.green3, O: P.orange, o: P.orange2 } },
    sunflower: { rows: [
      '....YYYYYY......',
      '...YYYyYYYY.....',
      '..YYYbbbbYYY....',
      '..YYbbbbbbYY....',
      '..YYbbbbbbYY....',
      '..YYYbbbbYYY....',
      '...YYYyYYYY.....',
      '....YYYYYY......',
      '......GG........',
      '.....gGG........',
      '......GG........',
      '......GG........',
      '................',
      '................',
      '................',
      '................',
    ], pal: { Y: P.yellow, y: P.yellow2, b: P.brown, G: P.green1, g: P.green3 } },
    grape: { rows: [
      '................',
      '......gg........',
      '.....gGGg.......',
      '......PP........',
      '.....PPPP.......',
      '....PPpPPP......',
      '....PPPPPP......',
      '.....PPpP.......',
      '......PP........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green3, G: P.green1, P: P.purple, p: P.purple2 } },
    coffee: { rows: [
      '................',
      '......gg........',
      '.....gGGg.......',
      '....gGGGGg......',
      '......BB........',
      '.....BBBB.......',
      '....BBbBBB......',
      '....BBBBBB......',
      '.....BBBB.......',
      '......GG........',
      '......GG........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], pal: { g: P.green3, G: P.green1, B: P.brown, b: P.brown2 } },
  };

  for (const [crop, def] of Object.entries(cropArts)) {
    add(`crop_${crop}_growing`, px(T, T, growingArt, growPal));
    add(`crop_${crop}_ready`, px(T, T, def.rows, def.pal));
  }

  // === INDICATORS (6x6 → 12x12) ===
  add('icon_water', px(12, 12, [
    '..B...',
    '.BBB..',
    '.BBb..',
    'BBBBb.',
    '.BBB..',
    '......',
  ], { B: P.cyan, b: P.blue }));

  add('icon_weed', px(12, 12, [
    '..g...',
    '.gGg..',
    '.Gg...',
    'gGg...',
    '.G....',
    '......',
  ], { g: P.green3, G: P.green1 }));

  // === WORKERS (8x8 → 16x16) ===
  add('worker_idle', px(16, 16, [
    '..hh....',
    '..Hh....',
    '.SSSS...',
    '..SS....',
    '..SS....',
    '.S..S...',
    '.s..s...',
    '........',
  ], { h: P.skin, H: P.hair, S: P.shirt, s: P.shoe }));

  add('worker_working', px(16, 16, [
    '..hh....',
    '..Hh....',
    '.SSSS...',
    '..SS....',
    '..SS....',
    '.S..S...',
    '.s..s...',
    '........',
  ], { h: P.skin, H: P.hair, S: P.shirt, s: P.shoe }));

  // === MINI CROP ICONS (6x6 → 12x12) ===
  const iconDefs: Record<string, { rows: string[]; pal: Record<string, string> }> = {
    carrot:     { rows: ['..gg..', '..OO..', '.OOO..', '..Oo..', '...o..', '......'], pal: { g: P.green1, O: P.orange, o: P.orange2 } },
    wheat:      { rows: ['..YY..', '.YYYY.', '..Yy..', '..GG..', '..GG..', '......'], pal: { Y: P.gold, y: P.gold2, G: P.green1 } },
    tomato:     { rows: ['..gg..', '.RRRR.', '.RRRR.', '.RrRR.', '..RR..', '......'], pal: { g: P.green1, R: P.red, r: P.red2 } },
    potato:     { rows: ['......', '.BBB..', 'BBbBB.', 'BBBBB.', '.BBB..', '......'], pal: { B: P.brown, b: P.brown2 } },
    strawberry: { rows: ['..gg..', '.RRRR.', '.RwRR.', '.RRRR.', '..RR..', '......'], pal: { g: P.green1, R: P.red, w: P.pink } },
    corn:       { rows: ['.gYg..', '.YYY..', '.YyY..', '.YYY..', '..G...', '......'], pal: { g: P.green1, G: P.green3, Y: P.yellow, y: P.yellow2 } },
    pumpkin:    { rows: ['..g...', '.OOOO.', 'OOoOOO', 'OOOOOO', '.OOOO.', '......'], pal: { g: P.green1, O: P.orange, o: P.orange2 } },
    sunflower:  { rows: ['.YYYY.', 'YYbbYY', 'YbbbbY', 'YYbbYY', '.YYYY.', '..GG..'], pal: { Y: P.yellow, b: P.brown, G: P.green1 } },
    grape:      { rows: ['..gg..', '.PPP..', 'PPpPP.', 'PPPPP.', '.PPP..', '......'], pal: { g: P.green1, P: P.purple, p: P.purple2 } },
    coffee:     { rows: ['..gg..', '.BBB..', 'BBbBB.', 'BBBBB.', '.BBB..', '......'], pal: { g: P.green1, B: P.brown, b: P.brown2 } },
  };

  for (const [crop, def] of Object.entries(iconDefs)) {
    add(`icon_${crop}`, px(12, 12, def.rows, def.pal));
  }

  add('icon_fallow', px(12, 12, [
    'R....R',
    '.R..R.',
    '..RR..',
    '..RR..',
    '.R..R.',
    'R....R',
  ], { R: P.red }));

  add('icon_gather', px(16, 16, [
    '....MMSS',
    '...MSSS.',
    '..MS....',
    '.WM.....',
    'WW......',
    'W.......',
    'W.......',
    '........',
  ], { M: P.metal, S: P.stone2, W: P.wood1 }));

  // === UI ===
  add('icon_lock', px(T, T, [
    '................',
    '................',
    '.....GGGG.......',
    '....G....G......',
    '....G....G......',
    '...GGGGGGGG.....',
    '...GGGGGGGG.....',
    '...GGGggGGG.....',
    '...GGGggGGG.....',
    '...GGGGGGGG.....',
    '...GGGGGGGG.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { G: P.lockGold, g: P.lockDark }));

  // === TOOLBAR (8x8 → 24x24) ===
  add('tb_farm', px(24, 24, [
    '........',
    '...gg...',
    '..gGGg..',
    '...GG...',
    '...GG...',
    '...GG...',
    '..bbbb..',
    '........',
  ], { g: P.green3, G: P.green1, b: P.soil1 }));

  add('tb_build', px(24, 24, [
    '...RR...',
    '..RRRR..',
    '.RRRRRR.',
    '.WWWWWW.',
    '.WW..WW.',
    '.WW..WW.',
    '.WWWWWW.',
    '........',
  ], { R: P.roof1, W: P.wood1 }));

  add('tb_machine', px(24, 24, [
    '..MMMM..',
    '.M.MM.M.',
    '.MMMMMM.',
    '.MM..MM.',
    '.MMMMMM.',
    '.M.MM.M.',
    '..MMMM..',
    '........',
  ], { M: P.metal }));

  add('tb_demolish', px(24, 24, [
    'R....R..',
    '.R..R...',
    '..RR....',
    '.RRRR...',
    '..RR....',
    '.R..R...',
    'R....R..',
    '........',
  ], { R: P.red }));

  add('tb_gather', px(24, 24, [
    '....MMSS',
    '...MSSS.',
    '..MS....',
    '.WM.....',
    'WW......',
    'W.......',
    'W.......',
    '........',
  ], { M: P.metal, S: P.stone2, W: P.wood1 }));

  add('tb_worker', px(24, 24, [
    '...hh...',
    '...Hh...',
    '..SSSS..',
    '...SS...',
    '...SS...',
    '..S..S..',
    '..s..s..',
    '........',
  ], { h: P.skin, H: P.hair, S: P.shirt, s: P.shoe }));

  add('tb_sell', px(24, 24, [
    '..YYYY..',
    '.YYYYYY.',
    '.YYyyYY.',
    '.YYYYYY.',
    '.YYyyYY.',
    '.YYYYYY.',
    '..YYYY..',
    '........',
  ], { Y: P.gold, y: P.gold2 }));

  add('tb_upgrade', px(24, 24, [
    '...GG...',
    '..GGGG..',
    '.GGGGGG.',
    '...GG...',
    '...GG...',
    '...GG...',
    '...GG...',
    '........',
  ], { G: P.green1 }));

  add('tb_crops', px(24, 24, [
    '..YY.YY.',
    '.YYYY.Y.',
    '..Yy.Y..',
    '..GG.G..',
    '..GG.G..',
    '..GG.G..',
    '........',
    '........',
  ], { Y: P.gold, y: P.gold2, G: P.green1 }));

  add('tb_orders', px(24, 24, [
    '.WWWWWW.',
    '.W.W..W.',
    '.W....W.',
    '.W.WW.W.',
    '.W....W.',
    '.W.WW.W.',
    '.WWWWWW.',
    '........',
  ], { W: P.white }));

  // === FACILITIES ===
  // Warehouse (16x16 → 48x48)
  add('facility_warehouse', px(T, T, [
    '................',
    '.....RRRR.......',
    '....RRRRRR......',
    '...RRRRRRRR.....',
    '..RRRRRRRRRR....',
    '..WWWWWWWWWW....',
    '..WW....WWWW....',
    '..WW....WWWW....',
    '..WW....WWWW....',
    '..WWWWWWWWWW....',
    '..WWWWWWWWWW....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { R: P.roof1, W: P.wood1 }));

  // Chicken coop (16x16 → 144x144)
  add('facility_chicken_coop', px(3 * T, 3 * T, [
    'FFFFFFFFFFFFFFFF',
    'F..RRRRRRRRRR.F.',
    'F.RRRRRRRRRRRRF.',
    'F.WWWWWWWWWWWWF.',
    'F.WWhhhWWWWWWWF.',
    'F.WWWWWWWWWWWWF.',
    'FFFFFFFFFFFFFFFF',
    'F....F....F....F',
    'F....F....F....F',
    'F....F....F....F',
    'FFFFFFFFFFFFFFFF',
    'F....F....F....F',
    'F....F....F....F',
    'F....F....F....F',
    'FFFFFFFFFFFFFFFF',
    '................',
  ], { F: P.fence, R: P.roof2, W: P.wood3, h: P.hay }));

  // Cow barn (16x16 → 192x192)
  add('facility_cow_barn', px(4 * T, 4 * T, [
    'FFFFFFFFFFFFFFFF',
    'F..............F',
    'F..RRRRRRRRRR.F.',
    'F.RRRRRRRRRRRRF.',
    'F.WWWWWWWWWWWWF.',
    'F.WW....WWWWWWF.',
    'F.WW....WWWWWWF.',
    'F.WW....WWWWWWF.',
    'F.WWWWWWWWWWWWF.',
    'F.............F.',
    'F..hh..hh..hh.F',
    'F.............F.',
    'F..hh..hh..hh.F',
    'F.............F.',
    'F..............F',
    'FFFFFFFFFFFFFFFF',
  ], { F: P.fence, R: P.roof1, W: P.wood1, h: P.hay }));

  // Windmill (16x16 → 48x48)
  add('facility_windmill', px(T, T, [
    '.M.......M......',
    '..M..RR.M.......',
    '...MRRM.........',
    '....RRMM........',
    '...RRRRMM.......',
    '..RRRRRR.M......',
    '..MMRRRR........',
    '....MRRM........',
    '...M.RR..M......',
    '..M..SS...M.....',
    '.....SS.........',
    '....SSSS........',
    '....SSSS........',
    '...SSSSSS.......',
    '...SSSSSS.......',
    '................',
  ], { M: P.wood1, R: P.roof2, S: P.stone1 }));

  // Juicer (16x16 → 48x48)
  add('facility_juicer', px(T, T, [
    '................',
    '......MM........',
    '.....MMMM.......',
    '....MMMMMM......',
    '....MgggMM......',
    '....MgggMM......',
    '....MgggMM......',
    '....MMMMMM......',
    '.....MMMM.......',
    '......MM........',
    '.....MM.........',
    '....M...........',
    '................',
    '................',
    '................',
    '................',
  ], { M: P.metal, g: P.green1 }));

  // Oven (16x16 → 96x96)
  add('facility_oven', px(2 * T, 2 * T, [
    '................',
    '..BBBBBBBBBB....',
    '..BBBBBBBBbB....',
    '..BBBBBBBBBB....',
    '..BB......BB....',
    '..BB.RRRR.BB....',
    '..BB.RRRR.BB....',
    '..BB.RrrR.BB....',
    '..BB.RRRR.BB....',
    '..BB......BB....',
    '..BBBBBBBBBB....',
    '..BBBBBBBBbB....',
    '..BBBBBBBBBB....',
    '................',
    '................',
    '................',
  ], { B: P.brick, b: P.brick2, R: P.red, r: P.orange }));

  // Cooking pot (16x16 → 96x96)
  add('facility_cooking_pot', px(2 * T, 2 * T, [
    '................',
    '................',
    '.....MMMM.......',
    '...MMMMMMMM.....',
    '..MMMMMMMMMM....',
    '..MMggggggMM....',
    '..MMggggggMM....',
    '..MMggggggMM....',
    '..MMMMMMMMMM....',
    '...MMMMMMMM.....',
    '....M....M......',
    '....M....M......',
    '...MM....MM.....',
    '................',
    '................',
    '................',
  ], { M: P.metal2, g: P.green1 }));

  // Auto-seeder (16x16 → 48x48)
  add('facility_auto_seeder', px(T, T, [
    '................',
    '.....MMMM.......',
    '....MMMMMM......',
    '....MMggMM......',
    '....MMggMM......',
    '....MMMMMM......',
    '.....MMMM.......',
    '......MM........',
    '......MM........',
    '.....b..b.......',
    '....b....b......',
    '...b......b.....',
    '................',
    '................',
    '................',
    '................',
  ], { M: P.metal, g: P.green1, b: P.soil1 }));

  // === MINI FACILITY ICONS (6x6 → 12x12) ===
  add('icon_warehouse', px(12, 12, ['..RR..', '.RRRR.', 'WWWWWW', 'WW..WW', 'WWWWWW', '......'], { R: P.roof1, W: P.wood1 }));
  add('icon_chicken_coop', px(12, 12, ['..hh..', '.hhhh.', 'hh..hh', '.hhhh.', '..hh..', '......'], { h: P.hay }));
  add('icon_cow_barn', px(12, 12, ['..RR..', '.RRRR.', 'WWWWWW', 'WW..WW', 'WWWWWW', '......'], { R: P.roof1, W: P.wood1 }));
  add('icon_windmill', px(12, 12, ['..MM..', '.MMMM.', '..MM..', '.SSSS.', '.SSSS.', '......'], { M: P.metal, S: P.stone1 }));
  add('icon_juicer', px(12, 12, ['..MM..', '.MggM.', '.MggM.', '.MMMM.', '..MM..', '......'], { M: P.metal, g: P.green1 }));
  add('icon_oven', px(12, 12, ['BBBBBB', 'B....B', 'B.RR.B', 'B.RR.B', 'BBBBBB', '......'], { B: P.brick, R: P.red }));
  add('icon_cooking_pot', px(12, 12, ['.MMMM.', 'MggggM', 'MggggM', '.MMMM.', '.M..M.', '......'], { M: P.metal2, g: P.green1 }));
  add('icon_auto_seeder', px(12, 12, ['.MMMM.', '.MggM.', '.MMMM.', '..MM..', '.b..b.', '......'], { M: P.metal, g: P.green1, b: P.soil1 }));

  // === NON-CROP ITEM ICONS (6x6 → 12x12) ===
  add('icon_egg', px(12, 12, ['..WW..', '.WWWW.', 'WWWWWW', 'WWWWWW', '.WWWW.', '..WW..'], { W: '#f5f0e0' }));
  add('icon_milk', px(12, 12, ['..WW..', '.WWWW.', '.WWWW.', '.WwWW.', '.WWWW.', '......'], { W: '#f0f0f0', w: '#ddeeff' }));
  add('icon_wood', px(12, 12, ['WWWWWW', 'WwWWwW', 'WWWWWW', 'WwWWwW', 'WWWWWW', '......'], { W: P.wood1, w: P.wood2 }));
  add('icon_stone', px(12, 12, ['..SS..', '.SSSS.', 'SSsSSS', 'SSSSSS', '.SSSS.', '......'], { S: P.rock1, s: P.rock2 }));
  add('icon_flour', px(12, 12, ['..WW..', '.WWWW.', 'WWWWWW', 'WWWWWW', 'WWWWWW', '......'], { W: '#f5e6c8' }));
  add('icon_juice', px(12, 12, ['..MM..', '.MOOM.', '.MOOM.', '.MOOM.', '.MMMM.', '......'], { M: P.metal, O: P.orange }));
  add('icon_bread', px(12, 12, ['..BB..', '.BBBB.', 'BBBbBB', 'BBBBBB', '.BBBB.', '......'], { B: P.gold, b: P.gold2 }));
  add('icon_pizza', px(12, 12, ['..YY..', '.YYYY.', 'YYrYYY', 'YYYYrY', '.YYYY.', '......'], { Y: P.gold, r: P.red }));
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
