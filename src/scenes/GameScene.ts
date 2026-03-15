import Phaser from 'phaser';
import type { CropType, GameState, UpgradeType } from '../entities/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, SAVE_INTERVAL, CLEAR_COST, WORKER_CRAFT_COST, UPGRADE_DEFS, MAX_ORDERS } from '../entities/constants';
import { CROP_TYPES, CROP_DEFS } from '../entities/cropDefs';
import { createInitialState } from '../systems/StateFactory';
import { loadGame, saveGame, getOfflineTime } from '../systems/SaveSystem';
import { updateCrops } from '../systems/CropSystem';
import { updateWorkers } from '../systems/WorkerSystem';
import { sellCrop } from '../systems/EconomySystem';
import { canCraftWorker, craftWorker } from '../systems/CraftSystem';
import { canUpgrade, applyUpgrade, getUpgradeCost, getUpgradeMultiplier } from '../systems/UpgradeSystem';
import { updateOrders, canFulfillOrder, fulfillOrder } from '../systems/OrderSystem';
import { generateAllSprites, getCropTextureKey, getTileTextureKey } from '../sprites/SpriteGenerator';

// Cycle order: carrot → wheat → tomato → null → carrot
const CROP_CYCLE: (CropType | null)[] = ['carrot', 'wheat', 'tomato', null];

const GAME_W = MAP_WIDTH * TILE_SIZE;
const SIDEBAR_X = GAME_W + 12;
const SIDEBAR_W = 196;

const FONT_SM = { fontSize: '11px', color: '#999999', fontFamily: 'monospace' } as const;
const FONT_MD = { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' } as const;
const FONT_HEADER = { fontSize: '12px', color: '#facc15', fontFamily: 'monospace', fontStyle: 'bold' } as const;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private saveTimer = 0;

  // Sprite layers
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private cropImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWaterIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWeedIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private workerImages: Phaser.GameObjects.Image[] = [];
  private indicatorImages: Map<string, Phaser.GameObjects.Image> = new Map();

  // Sidebar UI
  private statusText!: Phaser.GameObjects.Text;
  private craftText!: Phaser.GameObjects.Text;
  private sellTexts: Phaser.GameObjects.Text[] = [];
  private orderTexts: Phaser.GameObjects.Text[] = [];
  private orderClaimTexts: Phaser.GameObjects.Text[] = [];
  private upgradeTexts: Phaser.GameObjects.Text[] = [];

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

    generateAllSprites(this);

    // Tile grid
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

    // Sidebar divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x333333, 1);
    divider.lineBetween(GAME_W, 0, GAME_W, MAP_HEIGHT * TILE_SIZE);

    // === SIDEBAR ===
    let y = 8;

    // --- FARM STATUS ---
    this.add.text(SIDEBAR_X, y, 'FARM STATUS', FONT_HEADER);
    y += 22;
    this.statusText = this.add.text(SIDEBAR_X, y, '', FONT_MD);
    y += 22;
    this.craftText = this.add.text(SIDEBAR_X, y, '', FONT_MD)
      .setInteractive({ useHandCursor: true });
    this.craftText.on('pointerdown', () => { craftWorker(this.state); });
    y += 28;

    // --- INVENTORY ---
    this.add.text(SIDEBAR_X, y, 'INVENTORY', FONT_HEADER);
    y += 22;
    CROP_TYPES.forEach((type) => {
      this.add.image(SIDEBAR_X + 6, y + 6, `icon_${type}`);
      const sellText = this.add.text(SIDEBAR_X + 18, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      sellText.on('pointerdown', () => { sellCrop(this.state, type); });
      this.sellTexts.push(sellText);
      y += 22;
    });
    y += 10;

    // --- ORDERS ---
    this.add.text(SIDEBAR_X, y, 'ORDERS', FONT_HEADER);
    y += 22;
    for (let i = 0; i < MAX_ORDERS; i++) {
      const orderText = this.add.text(SIDEBAR_X, y, '', {
        ...FONT_SM,
        wordWrap: { width: SIDEBAR_W },
      });
      this.orderTexts.push(orderText);
      y += 30;
      const claimText = this.add.text(SIDEBAR_X, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      claimText.on('pointerdown', () => {
        const order = this.state.orders[i];
        if (order) fulfillOrder(this.state, order);
      });
      this.orderClaimTexts.push(claimText);
      y += 24;
    }
    y += 6;

    // --- UPGRADES ---
    this.add.text(SIDEBAR_X, y, 'UPGRADES', FONT_HEADER);
    y += 22;
    const upgradeTypes: UpgradeType[] = ['workerSpeed', 'growthSpeed', 'maintenanceInterval', 'autoHarvest'];
    upgradeTypes.forEach((type) => {
      const text = this.add.text(SIDEBAR_X, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => { applyUpgrade(this.state, type); });
      this.upgradeTexts.push(text);
      y += 22;
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
    updateOrders(this.state, delta);

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
    if (pointer.x >= GAME_W) return;

    const tx = Math.floor(pointer.x / TILE_SIZE);
    const ty = Math.floor(pointer.y / TILE_SIZE);
    const tile = this.state.tiles[ty]?.[tx];
    if (!tile) return;

    if (tile.type === 'soil') {
      const idx = CROP_CYCLE.indexOf(tile.assignedCrop);
      tile.assignedCrop = CROP_CYCLE[(idx + 1) % CROP_CYCLE.length] ?? null;
      return;
    }

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
      updateOrders(this.state, dt);
    }
  }

  private syncCrops(): void {
    const activeCropIds = new Set<number>();

    for (const crop of this.state.crops) {
      activeCropIds.add(crop.id);
      const textureKey = getCropTextureKey(crop.type, crop.stage);

      let img = this.cropImages.get(crop.id);
      if (!img) {
        img = this.add.image(0, 0, textureKey);
        img.setDepth(5);
        this.cropImages.set(crop.id, img);
      }
      img.setTexture(textureKey);
      img.setPosition(crop.tileX * TILE_SIZE + TILE_SIZE / 2, crop.tileY * TILE_SIZE + TILE_SIZE / 2);
      img.setDisplaySize(TILE_SIZE - 4, TILE_SIZE - 4);
      img.setVisible(true);

      let waterIcon = this.cropWaterIcons.get(crop.id);
      if (!waterIcon) {
        waterIcon = this.add.image(0, 0, 'icon_water');
        waterIcon.setDepth(8);
        this.cropWaterIcons.set(crop.id, waterIcon);
      }
      waterIcon.setPosition(crop.tileX * TILE_SIZE + 10, crop.tileY * TILE_SIZE + 10);
      waterIcon.setVisible(crop.needsWater);

      let weedIcon = this.cropWeedIcons.get(crop.id);
      if (!weedIcon) {
        weedIcon = this.add.image(0, 0, 'icon_weed');
        weedIcon.setDepth(8);
        this.cropWeedIcons.set(crop.id, weedIcon);
      }
      weedIcon.setPosition(crop.tileX * TILE_SIZE + TILE_SIZE - 10, crop.tileY * TILE_SIZE + 10);
      weedIcon.setVisible(crop.needsWeeding);
    }

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

  private syncWorkers(): void {
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

    for (let i = this.state.workers.length; i < this.workerImages.length; i++) {
      this.workerImages[i]!.setVisible(false);
    }
  }

  private drawIndicators(): void {
    const active = new Set<string>();

    for (const row of this.state.tiles) {
      for (const tile of row) {
        if (tile.type !== 'soil') continue;
        const key = `${tile.x},${tile.y}`;
        active.add(key);
        const textureKey = tile.assignedCrop ? `icon_${tile.assignedCrop}` : 'icon_fallow';

        let img = this.indicatorImages.get(key);
        if (!img) {
          img = this.add.image(0, 0, textureKey);
          img.setDepth(10);
          this.indicatorImages.set(key, img);
        }
        img.setTexture(textureKey);
        img.setPosition(tile.x * TILE_SIZE + 7, tile.y * TILE_SIZE + 7);
        img.setVisible(true);
      }
    }

    for (const [key, img] of this.indicatorImages) {
      if (!active.has(key)) {
        img.setVisible(false);
      }
    }
  }

  private drawUI(): void {
    const { money } = this.state.resources;
    const workers = this.state.workers.length;
    const growing = this.state.crops.length;

    // Status
    this.statusText.setText(`$${money}  W:${workers}  G:${growing}`);

    // Craft
    const canCraft = canCraftWorker(this.state);
    this.craftText.setText(`[+Worker] $${WORKER_CRAFT_COST.money}`);
    this.craftText.setColor(canCraft ? '#4ade80' : '#555555');

    // Inventory
    CROP_TYPES.forEach((type, i) => {
      const count = this.state.resources.crops[type] ?? 0;
      const price = CROP_DEFS[type].sellPrice;
      this.sellTexts[i]!.setText(`${type} x${count} [$${price}]`);
      this.sellTexts[i]!.setColor(count > 0 ? '#4ade80' : '#555555');
    });

    // Orders
    for (let i = 0; i < MAX_ORDERS; i++) {
      const order = this.state.orders[i];
      if (!order) {
        this.orderTexts[i]!.setText('---');
        this.orderClaimTexts[i]!.setText('').disableInteractive();
        continue;
      }
      const secs = Math.ceil(order.timeRemaining / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      const timeStr = `${mins}:${String(s).padStart(2, '0')}`;
      const reqs = order.requirements.map(r => `${r.crop} x${r.amount}`).join('  ');
      this.orderTexts[i]!.setText(`#${order.id} [${timeStr}]  ${reqs}`);

      const canClaim = canFulfillOrder(this.state, order);
      this.orderClaimTexts[i]!.setText(`[Claim $${order.reward}]`);
      this.orderClaimTexts[i]!.setColor(canClaim ? '#4ade80' : '#555555');
      if (canClaim) {
        this.orderClaimTexts[i]!.setInteractive({ useHandCursor: true });
      } else {
        this.orderClaimTexts[i]!.disableInteractive();
      }
    }

    // Upgrades
    const upgradeTypes: UpgradeType[] = ['workerSpeed', 'growthSpeed', 'maintenanceInterval', 'autoHarvest'];
    upgradeTypes.forEach((type, i) => {
      const def = UPGRADE_DEFS[type];
      const level = this.state.upgrades[type];
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : getUpgradeCost(type, level);
      const can = canUpgrade(this.state, type);
      const effect = type === 'autoHarvest'
        ? (level > 0 ? 'ON' : 'OFF')
        : `x${getUpgradeMultiplier(this.state, type).toFixed(1)}`;
      const label = maxed
        ? `${def.label} Lv${level} ${effect} MAX`
        : `${def.label} Lv${level} ${effect} $${cost}`;
      this.upgradeTexts[i]!.setText(label);
      this.upgradeTexts[i]!.setColor(maxed ? '#facc15' : can ? '#4ade80' : '#555555');
    });
  }
}
