import Phaser from 'phaser';
import type { CropType, GameState } from '../entities/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, SAVE_INTERVAL, CLEAR_COST, WORKER_CRAFT_COST } from '../entities/constants';
import { CROP_TYPES, CROP_DEFS } from '../entities/cropDefs';
import { createInitialState } from '../systems/StateFactory';
import { loadGame, saveGame, getOfflineTime } from '../systems/SaveSystem';
import { updateCrops } from '../systems/CropSystem';
import { updateWorkers } from '../systems/WorkerSystem';
import { sellCrop } from '../systems/EconomySystem';
import { canCraftWorker, craftWorker } from '../systems/CraftSystem';
import { generateAllSprites, getCropTextureKey, getTileTextureKey } from '../sprites/SpriteGenerator';

const CROP_COLORS: Record<CropType, number> = {
  carrot: 0xffa500,
  wheat: 0xf5deb3,
  tomato: 0xff6347,
};

// Cycle order: carrot → wheat → tomato → null → carrot
const CROP_CYCLE: (CropType | null)[] = ['carrot', 'wheat', 'tomato', null];

const GAME_W = MAP_WIDTH * TILE_SIZE;
const UI_Y = MAP_HEIGHT * TILE_SIZE;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private saveTimer = 0;

  // Sprite layers
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private cropImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWaterIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWeedIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private workerImages: Phaser.GameObjects.Image[] = [];
  private indicatorGraphics!: Phaser.GameObjects.Graphics;

  // UI
  private hudText!: Phaser.GameObjects.Text;
  private sellTexts: Phaser.GameObjects.Text[] = [];
  private craftText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const saved = loadGame();
    this.state = saved ?? createInitialState();

    if (saved) {
      const offlineMs = getOfflineTime(this.state);
      if (offlineMs > 0) this.simulateOffline(offlineMs);
    }

    // Generate all pixel art textures
    generateAllSprites(this);

    // Create tile image grid
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: Phaser.GameObjects.Image[] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.state.tiles[y]![x]!;
        const img = this.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          getTileTextureKey(tile.type),
        );
        img.setDisplaySize(TILE_SIZE - 1, TILE_SIZE - 1);
        row.push(img);
      }
      this.tileImages.push(row);
    }

    // Indicator overlay (assigned crop dots + fallow X) — drawn on top of tiles and crops
    this.indicatorGraphics = this.add.graphics();
    this.indicatorGraphics.setDepth(10);

    // --- UI Panel ---
    this.hudText = this.add.text(8, UI_Y + 8, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    });

    // Sell buttons
    const row2Y = UI_Y + 32;
    const colW = Math.floor(GAME_W / 3);
    CROP_TYPES.forEach((type, i) => {
      const x = 8 + i * colW;
      const sellText = this.add.text(x, row2Y, '', {
        fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      }).setInteractive({ useHandCursor: true });
      sellText.on('pointerdown', () => {
        sellCrop(this.state, type);
      });
      this.sellTexts.push(sellText);
    });

    // Color legend
    const legendY = UI_Y + 56;
    const legendG = this.add.graphics();
    const legendItems = [
      { color: 0xffa500, label: 'Carrot' },
      { color: 0xf5deb3, label: 'Wheat' },
      { color: 0xff6347, label: 'Tomato' },
    ];
    legendItems.forEach((item, i) => {
      const lx = 8 + i * 80;
      legendG.fillStyle(item.color, 1);
      legendG.fillRect(lx, legendY + 2, 8, 8);
      this.add.text(lx + 12, legendY, item.label, {
        fontSize: '10px', color: '#999999', fontFamily: 'monospace',
      });
    });
    this.add.text(8 + 3 * 80, legendY, '(click soil)', {
      fontSize: '10px', color: '#666666', fontFamily: 'monospace',
    });

    // Craft worker button
    this.craftText = this.add.text(GAME_W - 120, UI_Y + 8, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    }).setInteractive({ useHandCursor: true });
    this.craftText.on('pointerdown', () => {
      craftWorker(this.state);
    });

    // Tile click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTileClick(pointer);
    });

    // Background tab handler
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.state.lastSaveTime = Date.now();
        saveGame(this.state);
      } else {
        const elapsed = Date.now() - this.state.lastSaveTime;
        if (elapsed > 1000) {
          this.simulateOffline(elapsed);
        }
      }
    });
  }

  update(_time: number, delta: number): void {
    updateCrops(this.state, delta);
    updateWorkers(this.state, delta);

    this.saveTimer += delta;
    if (this.saveTimer >= SAVE_INTERVAL) {
      this.saveTimer = 0;
      saveGame(this.state);
    }

    this.syncCrops();
    this.syncWorkers();
    this.drawIndicators();
    this.drawUI();
  }

  private handleTileClick(pointer: Phaser.Input.Pointer): void {
    if (pointer.y >= UI_Y) return;

    const tx = Math.floor(pointer.x / TILE_SIZE);
    const ty = Math.floor(pointer.y / TILE_SIZE);
    const tile = this.state.tiles[ty]?.[tx];
    if (!tile) return;

    // Soil tile: cycle assigned crop
    if (tile.type === 'soil') {
      if (tile.cropId !== null) {
        tile.assignedCrop = null;
      } else {
        const idx = CROP_CYCLE.indexOf(tile.assignedCrop);
        tile.assignedCrop = CROP_CYCLE[(idx + 1) % CROP_CYCLE.length] ?? null;
      }
      return;
    }

    // Non-soil: expand
    const cost = CLEAR_COST[tile.type];
    if (cost === undefined) return;

    if (this.state.resources.money >= cost) {
      this.state.resources.money -= cost;
      tile.type = 'soil';
      tile.assignedCrop = 'carrot';
      this.updateTileImage(tx, ty);
    }
  }

  private updateTileImage(x: number, y: number): void {
    const tile = this.state.tiles[y]?.[x];
    if (!tile) return;
    const img = this.tileImages[y]?.[x];
    if (!img) return;
    img.setTexture(getTileTextureKey(tile.type));
    img.setDisplaySize(TILE_SIZE - 1, TILE_SIZE - 1);
  }

  private simulateOffline(ms: number): void {
    const cappedMs = Math.min(ms, 3_600_000);
    const step = 1000;
    for (let t = 0; t < cappedMs; t += step) {
      const dt = Math.min(step, cappedMs - t);
      updateCrops(this.state, dt);
      updateWorkers(this.state, dt);
    }
  }

  /** Sync crop Image objects with state.crops */
  private syncCrops(): void {
    const activeCropIds = new Set<number>();

    for (const crop of this.state.crops) {
      activeCropIds.add(crop.id);
      const textureKey = getCropTextureKey(crop.type, crop.stage);

      // Crop image
      let img = this.cropImages.get(crop.id);
      if (!img) {
        img = this.add.image(0, 0, textureKey);
        img.setDepth(5);
        this.cropImages.set(crop.id, img);
      }
      img.setTexture(textureKey);
      img.setPosition(
        crop.tileX * TILE_SIZE + TILE_SIZE / 2,
        crop.tileY * TILE_SIZE + TILE_SIZE / 2,
      );
      img.setDisplaySize(TILE_SIZE - 4, TILE_SIZE - 4);
      img.setVisible(true);

      // Water icon
      let waterIcon = this.cropWaterIcons.get(crop.id);
      if (!waterIcon) {
        waterIcon = this.add.image(0, 0, 'icon_water');
        waterIcon.setDepth(8);
        this.cropWaterIcons.set(crop.id, waterIcon);
      }
      waterIcon.setPosition(crop.tileX * TILE_SIZE + 10, crop.tileY * TILE_SIZE + 10);
      waterIcon.setVisible(crop.needsWater);

      // Weed icon
      let weedIcon = this.cropWeedIcons.get(crop.id);
      if (!weedIcon) {
        weedIcon = this.add.image(0, 0, 'icon_weed');
        weedIcon.setDepth(8);
        this.cropWeedIcons.set(crop.id, weedIcon);
      }
      weedIcon.setPosition(crop.tileX * TILE_SIZE + TILE_SIZE - 10, crop.tileY * TILE_SIZE + 10);
      weedIcon.setVisible(crop.needsWeeding);
    }

    // Remove images for harvested crops
    for (const [id, img] of this.cropImages) {
      if (!activeCropIds.has(id)) {
        img.destroy();
        this.cropImages.delete(id);
        this.cropWaterIcons.get(id)?.destroy();
        this.cropWaterIcons.delete(id);
        this.cropWeedIcons.get(id)?.destroy();
        this.cropWeedIcons.delete(id);
      }
    }
  }

  /** Sync worker Image objects with state.workers */
  private syncWorkers(): void {
    // Grow pool if needed
    while (this.workerImages.length < this.state.workers.length) {
      const img = this.add.image(0, 0, 'worker_idle');
      img.setDepth(15);
      this.workerImages.push(img);
    }

    for (let i = 0; i < this.state.workers.length; i++) {
      const worker = this.state.workers[i]!;
      const img = this.workerImages[i]!;
      img.setTexture(worker.state === 'working' ? 'worker_working' : 'worker_idle');
      img.setPosition(worker.x, worker.y);
      img.setDisplaySize(16, 16);
      img.setVisible(true);
    }

    // Hide excess
    for (let i = this.state.workers.length; i < this.workerImages.length; i++) {
      this.workerImages[i]!.setVisible(false);
    }
  }

  /** Draw assigned crop indicators + fallow X with Graphics overlay */
  private drawIndicators(): void {
    const g = this.indicatorGraphics;
    g.clear();

    for (const row of this.state.tiles) {
      for (const tile of row) {
        if (tile.type !== 'soil') continue;
        const bx = tile.x * TILE_SIZE;
        const by = tile.y * TILE_SIZE;
        if (tile.assignedCrop) {
          g.fillStyle(CROP_COLORS[tile.assignedCrop], 1);
          g.fillRect(bx, by, 6, 6);
        } else {
          g.lineStyle(2, 0xff0000, 1);
          g.lineBetween(bx + 1, by + 1, bx + 7, by + 7);
          g.lineBetween(bx + 7, by + 1, bx + 1, by + 7);
        }
      }
    }
  }

  private drawUI(): void {
    const { money } = this.state.resources;
    const workers = this.state.workers.length;
    const growing = this.state.crops.length;

    this.hudText.setText(`$${money}  Workers:${workers}  Growing:${growing}`);

    CROP_TYPES.forEach((type, i) => {
      const sellText = this.sellTexts[i]!;
      const count = this.state.resources.crops[type] ?? 0;
      const def = CROP_DEFS[type];

      sellText.setText(`${type} x${count}  sell($${def.sellPrice})`);
      sellText.setColor(count > 0 ? '#4ade80' : '#555555');
    });

    const canCraft = canCraftWorker(this.state);
    this.craftText.setText(`[+Worker] $${WORKER_CRAFT_COST.money}`);
    this.craftText.setColor(canCraft ? '#4ade80' : '#555555');
  }
}
