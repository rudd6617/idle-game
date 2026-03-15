import Phaser from 'phaser';
import type { CropType, FacilityType, GameState, UpgradeType } from '../entities/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, BLOCK_SIZE, BLOCK_COST, SAVE_INTERVAL, SAVE_KEY, CLEAR_COST, WORKER_CRAFT_COST, UPGRADE_DEFS, MAX_ORDERS, FACILITY_DEFS, FACILITY_TYPES, ITEM_SELL_PRICES } from '../entities/constants';
import { CROP_TYPES, CROP_DEFS } from '../entities/cropDefs';
import { createInitialState } from '../systems/StateFactory';
import { loadGame, saveGame, getOfflineTime } from '../systems/SaveSystem';
import { updateCrops } from '../systems/CropSystem';
import { updateWorkers } from '../systems/WorkerSystem';
import { updateFacilities, canBuildFacility, buildFacility, canBuyAnimal, buyAnimal, getWarehouseCapacity, getCurrentStorage } from '../systems/FacilitySystem';
import { sellCrop, sellItem } from '../systems/EconomySystem';
import { canCraftWorker, craftWorker } from '../systems/CraftSystem';
import { canUpgrade, applyUpgrade, getUpgradeCost, getUpgradeMultiplier } from '../systems/UpgradeSystem';
import { updateOrders, canFulfillOrder, fulfillOrder } from '../systems/OrderSystem';
import { isCropUnlocked, canUnlockCrop, unlockCrop } from '../systems/CropUnlockSystem';
import { generateAllSprites, getCropTextureKey, getTileTextureKey } from '../sprites/SpriteGenerator';

const MAP_PX_W = MAP_WIDTH * TILE_SIZE;
const MAP_PX_H = MAP_HEIGHT * TILE_SIZE;
const VIEWPORT_W = BLOCK_SIZE * TILE_SIZE + TILE_SIZE; // one block + 1 tile padding
const SIDEBAR_W_PX = 220;
const SIDEBAR_X = VIEWPORT_W + 12;
const SIDEBAR_W = SIDEBAR_W_PX - 24;

const FONT_SM = { fontSize: '11px', color: '#999999', fontFamily: 'monospace' } as const;
const FONT_MD = { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' } as const;
const FONT_HEADER = { fontSize: '12px', color: '#facc15', fontFamily: 'monospace', fontStyle: 'bold' } as const;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private saveTimer = 0;
  private resetting = false;

  // Sprite layers
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private cropImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWaterIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWeedIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private workerImages: Phaser.GameObjects.Image[] = [];
  private indicatorImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private facilityImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private demolishOverlay!: Phaser.GameObjects.Graphics;
  private lockImages: Map<string, Phaser.GameObjects.Image> = new Map();

  // Camera
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Build / demolish / farmland / gather mode
  private placingFacility: FacilityType | null = null;
  private placingFarmland = false;
  private demolishMode = false;
  private gatherMode: 'wood' | 'stone' | null = null;
  private placementPreview: Phaser.GameObjects.Graphics | null = null;

  // Sidebar UI
  private statusText!: Phaser.GameObjects.Text;
  private craftText!: Phaser.GameObjects.Text;
  private sellTexts: Phaser.GameObjects.Text[] = [];
  private itemSellTexts: Phaser.GameObjects.Text[] = [];
  private orderTexts: Phaser.GameObjects.Text[] = [];
  private orderClaimTexts: Phaser.GameObjects.Text[] = [];
  private upgradeTexts: Phaser.GameObjects.Text[] = [];
  private buildTexts: Phaser.GameObjects.Text[] = [];
  private buildModeText!: Phaser.GameObjects.Text;
  private cropUnlockTexts: Phaser.GameObjects.Text[] = [];
  private inventoryBaseY = 0;

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

    // Placement preview graphics
    this.placementPreview = this.add.graphics();
    this.placementPreview.setDepth(20);
    this.demolishOverlay = this.add.graphics();
    this.demolishOverlay.setDepth(9);

    // === Camera setup ===
    this.cameras.main.setBounds(0, 0, MAP_PX_W, MAP_PX_H);
    this.cameras.main.setScroll(0, 0);

    // WASD keys
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;

    // Middle-mouse drag
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - this.dragStartX);
        cam.scrollY -= (pointer.y - this.dragStartY);
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonReleased()) this.isDragging = false;
    });

    // === Sidebar (fixed to screen, not camera) ===
    // Sidebar background
    const sidebarBg = this.add.graphics();
    sidebarBg.fillStyle(0x1a1a2e, 1);
    sidebarBg.fillRect(VIEWPORT_W, 0, SIDEBAR_W_PX, VIEWPORT_W);
    sidebarBg.setScrollFactor(0).setDepth(50);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x333333, 1);
    divider.lineBetween(VIEWPORT_W, 0, VIEWPORT_W, VIEWPORT_W);
    divider.setScrollFactor(0).setDepth(50);

    // === SIDEBAR ===
    let y = 8;

    // --- FARM STATUS ---
    this.sidebarText(SIDEBAR_X, y, 'FARM STATUS', FONT_HEADER);
    y += 22;
    this.statusText = this.sidebarText(SIDEBAR_X, y, '', FONT_MD);
    y += 22;
    this.craftText = this.sidebarText(SIDEBAR_X, y, '', FONT_MD)
      .setInteractive({ useHandCursor: true });
    this.craftText.on('pointerdown', () => { craftWorker(this.state); });
    y += 22;

    // Reset button
    const resetText = this.sidebarText(SIDEBAR_X, y, '[Reset Game]', { ...FONT_SM, color: '#ff4444' })
      .setInteractive({ useHandCursor: true });
    resetText.on('pointerdown', () => {
      this.resetting = true;
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    });
    y += 28;

    // --- INVENTORY (dynamic, repositioned each frame in drawUI) ---
    this.sidebarText(SIDEBAR_X, y, 'INVENTORY', FONT_HEADER);
    this.inventoryBaseY = y + 22;
    CROP_TYPES.forEach((type) => {
      const sellText = this.sidebarText(0, 0, '', FONT_MD)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      sellText.on('pointerdown', () => { sellCrop(this.state, type); });
      this.sellTexts.push(sellText);
    });
    const extraItemTypes: Array<'wood' | 'stone' | 'egg' | 'milk'> = ['wood', 'stone', 'egg', 'milk'];
    extraItemTypes.forEach((type) => {
      const sellText = this.sidebarText(0, 0, '', FONT_MD)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      sellText.on('pointerdown', () => { sellItem(this.state, type); });
      this.itemSellTexts.push(sellText);
    });
    y += 22 + 6 * 18 + 10;

    // --- BUILD ---
    this.sidebarText(SIDEBAR_X, y, 'BUILD', FONT_HEADER);
    y += 22;
    const farmlandText = this.sidebarText(SIDEBAR_X, y, '', FONT_MD)
      .setInteractive({ useHandCursor: true });
    farmlandText.on('pointerdown', () => {
      this.clearBuildModes();
      this.placingFarmland = !this.placingFarmland;
    });
    this.buildTexts.push(farmlandText);
    y += 22;
    FACILITY_TYPES.forEach((type) => {
      const def = FACILITY_DEFS[type];
      this.sidebarImage(SIDEBAR_X + 6, y + 6, `icon_${type}`);
      const text = this.sidebarText(SIDEBAR_X + 18, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        this.clearBuildModes();
        if (this.state.resources.money >= def.cost) {
          this.placingFacility = type;
        }
      });
      this.buildTexts.push(text);
      y += 22;
    });
    const demolishText = this.sidebarText(SIDEBAR_X, y, '[Demolish]', FONT_MD)
      .setInteractive({ useHandCursor: true });
    demolishText.on('pointerdown', () => {
      this.clearBuildModes();
      this.demolishMode = true;
    });
    this.buildTexts.push(demolishText);
    y += 22;
    // Gather tools
    const gatherWoodText = this.sidebarText(SIDEBAR_X, y, '[Gather Wood]', FONT_MD)
      .setInteractive({ useHandCursor: true });
    gatherWoodText.on('pointerdown', () => {
      this.clearBuildModes();
      this.gatherMode = 'wood';
    });
    this.buildTexts.push(gatherWoodText);
    y += 22;
    const gatherStoneText = this.sidebarText(SIDEBAR_X, y, '[Gather Stone]', FONT_MD)
      .setInteractive({ useHandCursor: true });
    gatherStoneText.on('pointerdown', () => {
      this.clearBuildModes();
      this.gatherMode = 'stone';
    });
    this.buildTexts.push(gatherStoneText);
    y += 22;
    this.buildModeText = this.sidebarText(SIDEBAR_X, y, '', { ...FONT_SM, color: '#facc15' });
    y += 22;

    // --- ORDERS ---
    this.sidebarText(SIDEBAR_X, y, 'ORDERS', FONT_HEADER);
    y += 22;
    for (let i = 0; i < MAX_ORDERS; i++) {
      const orderText = this.sidebarText(SIDEBAR_X, y, '', {
        ...FONT_SM,
        wordWrap: { width: SIDEBAR_W },
      });
      this.orderTexts.push(orderText);
      y += 30;
      const claimText = this.sidebarText(SIDEBAR_X, y, '', FONT_MD)
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
    this.sidebarText(SIDEBAR_X, y, 'UPGRADES', FONT_HEADER);
    y += 22;
    const upgradeTypes: UpgradeType[] = ['workerSpeed', 'growthSpeed', 'maintenanceInterval', 'autoHarvest', 'demolishSpeed'];
    upgradeTypes.forEach((type) => {
      const text = this.sidebarText(SIDEBAR_X, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => { applyUpgrade(this.state, type); });
      this.upgradeTexts.push(text);
      y += 22;
    });
    y += 6;

    // --- CROPS (unlock tree) ---
    this.sidebarText(SIDEBAR_X, y, 'CROPS', FONT_HEADER);
    y += 22;
    CROP_TYPES.forEach((type) => {
      const def = CROP_DEFS[type];
      if (def.unlockCost === 0) return;
      const text = this.sidebarText(SIDEBAR_X, y, '', FONT_MD)
        .setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => { unlockCrop(this.state, type); });
      this.cropUnlockTexts.push(text);
      y += 22;
    });

    // Tile click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTileClick(pointer);
    });

    // Mouse move for placement preview
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updatePlacementPreview(pointer);
    });

    // Right-click / Escape to cancel modes
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.clearBuildModes();
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.clearBuildModes();
    });

    // Background tab handler
    document.addEventListener('visibilitychange', () => {
      if (this.resetting) return;
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
    if (this.resetting) return;

    // WASD camera movement
    const camSpeed = 300 * (delta / 1000);
    const cam = this.cameras.main;
    if (this.wasdKeys.A.isDown) cam.scrollX -= camSpeed;
    if (this.wasdKeys.D.isDown) cam.scrollX += camSpeed;
    if (this.wasdKeys.W.isDown) cam.scrollY -= camSpeed;
    if (this.wasdKeys.S.isDown) cam.scrollY += camSpeed;

    updateCrops(this.state, delta);
    updateWorkers(this.state, delta);
    updateFacilities(this.state, delta);
    updateOrders(this.state, delta);

    this.saveTimer += delta;
    if (this.saveTimer >= SAVE_INTERVAL) {
      this.saveTimer = 0;
      saveGame(this.state);
    }

    this.syncCrops();
    this.syncFacilities();
    this.syncWorkers();
    this.syncTileVisibility();
    this.drawIndicators();
    this.drawUI();
  }

  private handleTileClick(pointer: Phaser.Input.Pointer): void {
    if (pointer.x >= VIEWPORT_W) return;

    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    const tile = this.state.tiles[ty]?.[tx];
    if (!tile) return;

    if (pointer.rightButtonDown()) return;

    const block = this.getBlockCoord(tx, ty);
    // Click on unowned block → buy it
    if (!this.isBlockOwned(block.x, block.y)) {
      if (this.isAdjacentToOwned(block.x, block.y) && this.state.resources.money >= BLOCK_COST) {
        this.state.resources.money -= BLOCK_COST;
        this.state.purchasedBlocks.push({ x: block.x, y: block.y });
      }
      return;
    }

    // Demolish mode
    if (this.demolishMode) {
      if (tile.facilityId !== null) {
        this.demolishFacility(tile.facilityId);
        this.demolishMode = false;
      }
      return;
    }

    // Gather mode
    if (this.gatherMode) {
      const woodTypes = ['wood', 'small_wood'];
      const stoneTypes = ['stone', 'small_stone'];
      const validTypes = this.gatherMode === 'wood' ? woodTypes : stoneTypes;
      if (validTypes.includes(tile.type) && tile.durability > 0) {
        tile.markedForDemolish = !tile.markedForDemolish;
      }
      return;
    }

    // Farmland placement mode
    if (this.placingFarmland) {
      if (tile.type === 'grass' && tile.facilityId === null) {
        const cost = CLEAR_COST['grass'] ?? 0;
        if (this.state.resources.money >= cost) {
          this.state.resources.money -= cost;
          tile.type = 'soil';
          tile.assignedCrop = this.state.unlockedCrops[0] ?? 'carrot';
          this.updateTileImage(tx, ty);
        }
      }
      return;
    }

    // Facility placement mode
    if (this.placingFacility) {
      if (buildFacility(this.state, this.placingFacility, tx, ty)) {
        this.placingFacility = null;
      }
      return;
    }

    // Facility tile: buy animal
    if (tile.facilityId !== null) {
      const fac = this.state.facilities.find(f => f.id === tile.facilityId);
      if (fac) buyAnimal(this.state, fac);
      return;
    }

    // Soil tile: cycle assigned crop, or revert to grass if fallow + empty
    if (tile.type === 'soil') {
      if (tile.assignedCrop === null && tile.cropId === null) {
        tile.type = 'grass';
        tile.durability = 0;
        this.updateTileImage(tx, ty);
      } else {
        const cycle: (CropType | null)[] = [...this.state.unlockedCrops, null];
        const idx = cycle.indexOf(tile.assignedCrop);
        tile.assignedCrop = cycle[(idx + 1) % cycle.length] ?? null;
      }
      return;
    }

    // Resource tile: toggle demolish mark
    if (tile.durability > 0) {
      tile.markedForDemolish = !tile.markedForDemolish;
      return;
    }
  }

  private updatePlacementPreview(pointer: Phaser.Input.Pointer): void {
    const g = this.placementPreview!;
    g.clear();
    if (pointer.x >= VIEWPORT_W) return;

    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);

    if (this.demolishMode) {
      const tile = this.state.tiles[ty]?.[tx];
      if (tile?.facilityId !== null && tile?.facilityId !== undefined) {
        const fac = this.state.facilities.find(f => f.id === tile.facilityId);
        if (fac) {
          g.lineStyle(2, 0xff0000, 0.8);
          g.strokeRect(fac.originX * TILE_SIZE, fac.originY * TILE_SIZE, fac.width * TILE_SIZE, fac.height * TILE_SIZE);
        }
      }
      return;
    }

    if (this.placingFarmland) {
      const tile = this.state.tiles[ty]?.[tx];
      const canPlace = tile?.type === 'grass' && tile?.facilityId === null;
      g.lineStyle(2, canPlace ? 0x4ade80 : 0xff0000, 0.8);
      g.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      return;
    }

    if (!this.placingFacility) return;
    const def = FACILITY_DEFS[this.placingFacility];
    const canPlace = canBuildFacility(this.state, this.placingFacility, tx, ty);
    g.lineStyle(2, canPlace ? 0x4ade80 : 0xff0000, 0.8);
    g.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, def.width * TILE_SIZE, def.height * TILE_SIZE);
  }

  /** Create text fixed to screen (sidebar UI) */
  private sidebarText(x: number, y: number, text: string, style: object): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, style).setScrollFactor(0).setDepth(51);
  }

  /** Create image fixed to screen (sidebar UI) */
  private sidebarImage(x: number, y: number, key: string): Phaser.GameObjects.Image {
    return this.add.image(x, y, key).setScrollFactor(0).setDepth(51);
  }

  private getBlockCoord(tx: number, ty: number): { x: number; y: number } {
    return { x: Math.floor(tx / BLOCK_SIZE), y: Math.floor(ty / BLOCK_SIZE) };
  }

  private isBlockOwned(bx: number, by: number): boolean {
    return this.state.purchasedBlocks.some(b => b.x === bx && b.y === by);
  }

  private isAdjacentToOwned(bx: number, by: number): boolean {
    return this.state.purchasedBlocks.some(b =>
      (Math.abs(b.x - bx) + Math.abs(b.y - by)) === 1,
    );
  }

  private clearBuildModes(): void {
    this.placingFacility = null;
    this.placingFarmland = false;
    this.demolishMode = false;
    this.gatherMode = null;
  }

  private demolishFacility(facilityId: number): void {
    const idx = this.state.facilities.findIndex(f => f.id === facilityId);
    if (idx === -1) return;
    const fac = this.state.facilities[idx]!;
    const def = FACILITY_DEFS[fac.type];

    // Refund 50%
    this.state.resources.money += Math.floor(def.cost / 2);

    // Clear tiles
    for (let dy = 0; dy < fac.height; dy++) {
      for (let dx = 0; dx < fac.width; dx++) {
        const tile = this.state.tiles[fac.originY + dy]?.[fac.originX + dx];
        if (tile) {
          tile.facilityId = null;
          tile.type = 'grass';
          this.updateTileImage(fac.originX + dx, fac.originY + dy);
        }
      }
    }

    this.state.facilities.splice(idx, 1);
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
      updateFacilities(this.state, dt);
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

  private syncFacilities(): void {
    const activeIds = new Set<number>();

    for (const fac of this.state.facilities) {
      activeIds.add(fac.id);
      const textureKey = `facility_${fac.type}`;
      const pixelW = fac.width * TILE_SIZE;
      const pixelH = fac.height * TILE_SIZE;

      let img = this.facilityImages.get(fac.id);
      if (!img) {
        img = this.add.image(0, 0, textureKey);
        img.setDepth(3);
        this.facilityImages.set(fac.id, img);
      }
      img.setTexture(textureKey);
      img.setPosition(
        fac.originX * TILE_SIZE + pixelW / 2,
        fac.originY * TILE_SIZE + pixelH / 2,
      );
      img.setDisplaySize(pixelW - 2, pixelH - 2);
      img.setVisible(true);
    }

    for (const [id, img] of this.facilityImages) {
      if (!activeIds.has(id)) {
        img.destroy();
        this.facilityImages.delete(id);
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
        if (tile.type !== 'soil' || tile.facilityId !== null) continue;
        const blk = this.getBlockCoord(tile.x, tile.y);
        if (!this.isBlockOwned(blk.x, blk.y)) continue;
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

    // Demolish markers
    const g = this.demolishOverlay;
    g.clear();
    for (const row of this.state.tiles) {
      for (const tile of row) {
        if (!tile.markedForDemolish || tile.durability <= 0) continue;
        const bx = tile.x * TILE_SIZE;
        const by = tile.y * TILE_SIZE;
        g.lineStyle(2, 0xff4444, 0.8);
        g.strokeRect(bx + 1, by + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }
  }

  private syncTileVisibility(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const block = this.getBlockCoord(x, y);
        const owned = this.isBlockOwned(block.x, block.y);
        const img = this.tileImages[y]?.[x];
        if (img) img.setVisible(owned);
      }
    }

    // Lock icons — placed on the owned block's edge facing the unowned block
    const activeLocks = new Set<string>();
    const maxBx = Math.floor(MAP_WIDTH / BLOCK_SIZE);
    const maxBy = Math.floor(MAP_HEIGHT / BLOCK_SIZE);
    const blockPx = BLOCK_SIZE * TILE_SIZE;
    for (let by = 0; by < maxBy; by++) {
      for (let bx = 0; bx < maxBx; bx++) {
        if (this.isBlockOwned(bx, by)) continue;
        if (!this.isAdjacentToOwned(bx, by)) continue;
        const key = `${bx},${by}`;
        activeLocks.add(key);

        // Place lock one tile into the unowned block, on the side facing an owned block
        let cx = bx * blockPx + blockPx / 2;
        let cy = by * blockPx + blockPx / 2;
        if (bx > 0 && this.isBlockOwned(bx - 1, by)) {
          cx = bx * blockPx + TILE_SIZE / 2;
          cy = by * blockPx + blockPx / 2;
        } else if (bx < maxBx - 1 && this.isBlockOwned(bx + 1, by)) {
          cx = (bx + 1) * blockPx - TILE_SIZE / 2;
          cy = by * blockPx + blockPx / 2;
        } else if (by > 0 && this.isBlockOwned(bx, by - 1)) {
          cx = bx * blockPx + blockPx / 2;
          cy = by * blockPx + TILE_SIZE / 2;
        } else if (by < maxBy - 1 && this.isBlockOwned(bx, by + 1)) {
          cx = bx * blockPx + blockPx / 2;
          cy = (by + 1) * blockPx - TILE_SIZE / 2;
        }

        let lockImg = this.lockImages.get(key);
        if (!lockImg) {
          lockImg = this.add.image(cx, cy, 'icon_lock');
          lockImg.setDepth(25);
          this.lockImages.set(key, lockImg);
        }
        lockImg.setPosition(cx, cy);
        lockImg.setVisible(true);
      }
    }
    for (const [key, img] of this.lockImages) {
      if (!activeLocks.has(key)) {
        img.setVisible(false);
      }
    }
  }

  private drawUI(): void {
    const { money } = this.state.resources;
    const workers = this.state.workers.length;
    const growing = this.state.crops.length;

    const stored = getCurrentStorage(this.state);
    const cap = getWarehouseCapacity(this.state);
    this.statusText.setText(`$${money}  W:${workers}  G:${growing}\nStorage: ${stored}/${cap}`);

    const canCraft = canCraftWorker(this.state);
    this.craftText.setText(`[+Worker] $${WORKER_CRAFT_COST.money}`);
    this.craftText.setColor(canCraft ? '#4ade80' : '#555555');

    // Dynamic inventory — only show items with stock or unlocked crops
    let invY = this.inventoryBaseY;
    CROP_TYPES.forEach((type, i) => {
      const unlocked = isCropUnlocked(this.state, type);
      const count = this.state.resources.items[type] ?? 0;
      const visible = unlocked && count > 0;
      this.sellTexts[i]!.setVisible(visible);
      if (visible) {
        const price = CROP_DEFS[type].sellPrice;
        this.sellTexts[i]!.setText(`${type} x${count} [$${price}]`);
        this.sellTexts[i]!.setPosition(SIDEBAR_X, invY);
        this.sellTexts[i]!.setColor('#4ade80');
        invY += 18;
      }
    });
    const extraItemTypes: Array<{ type: 'wood' | 'stone' | 'egg' | 'milk'; label: string }> = [
      { type: 'wood', label: 'wood' },
      { type: 'stone', label: 'stone' },
      { type: 'egg', label: 'egg' },
      { type: 'milk', label: 'milk' },
    ];
    extraItemTypes.forEach(({ type, label }, i) => {
      const count = this.state.resources.items[type] ?? 0;
      this.itemSellTexts[i]!.setVisible(count > 0);
      if (count > 0) {
        const price = ITEM_SELL_PRICES[type] ?? 0;
        this.itemSellTexts[i]!.setText(`${label} x${count} [$${price}]`);
        this.itemSellTexts[i]!.setPosition(SIDEBAR_X, invY);
        this.itemSellTexts[i]!.setColor('#4ade80');
        invY += 18;
      }
    });

    // Build buttons — index 0 = farmland
    const farmCost = CLEAR_COST['grass'] ?? 0;
    this.buildTexts[0]!.setText(`Farmland $${farmCost}`);
    this.buildTexts[0]!.setColor(this.placingFarmland ? '#facc15' : this.state.resources.money >= farmCost ? '#4ade80' : '#555555');

    // index 1..N = facilities
    FACILITY_TYPES.forEach((type, i) => {
      const def = FACILITY_DEFS[type];
      const canAfford = this.state.resources.money >= def.cost;
      const active = this.placingFacility === type;
      const owned = this.state.facilities.filter(f => f.type === type);
      const totalAnimals = owned.reduce((s, f) => s + f.animalCount, 0);
      const totalCap = owned.reduce((s, f) => s + FACILITY_DEFS[f.type].maxAnimals, 0);
      let label = `${def.label} $${def.cost}`;
      if (owned.length > 0) label += ` [${totalAnimals}/${totalCap}]`;
      this.buildTexts[i + 1]!.setText(label);
      this.buildTexts[i + 1]!.setColor(active ? '#facc15' : canAfford ? '#4ade80' : '#555555');
    });

    // Demolish button
    const demolishIdx = FACILITY_TYPES.length + 1;
    this.buildTexts[demolishIdx]!.setColor(this.demolishMode ? '#ff0000' : '#aaaaaa');

    // Gather buttons
    const gatherWoodIdx = demolishIdx + 1;
    const gatherStoneIdx = demolishIdx + 2;
    this.buildTexts[gatherWoodIdx]!.setColor(this.gatherMode === 'wood' ? '#facc15' : '#aaaaaa');
    this.buildTexts[gatherStoneIdx]!.setColor(this.gatherMode === 'stone' ? '#facc15' : '#aaaaaa');

    let buildHint = '';
    if (this.demolishMode) {
      buildHint = 'Click facility to demolish';
    } else if (this.gatherMode === 'wood') {
      buildHint = 'Click wood to mark gather';
    } else if (this.gatherMode === 'stone') {
      buildHint = 'Click stone to mark gather';
    } else if (this.placingFarmland) {
      buildHint = 'Click grass to place farmland';
    } else if (this.placingFacility) {
      buildHint = 'Click to place (ESC cancel)';
    } else if (this.state.facilities.length > 0) {
      const fac = this.state.facilities.find(f => canBuyAnimal(this.state, f));
      if (fac) {
        const def = FACILITY_DEFS[fac.type];
        buildHint = `Click facility: +${def.animalName} $${def.animalCost}`;
      }
    }
    this.buildModeText.setText(buildHint);

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

    // Crop unlock tree
    const lockableCrops = CROP_TYPES.filter(t => CROP_DEFS[t].unlockCost > 0);
    lockableCrops.forEach((type, i) => {
      const def = CROP_DEFS[type];
      const unlocked = isCropUnlocked(this.state, type);
      const can = canUnlockCrop(this.state, type);
      const reqsMet = def.requires.every(r => isCropUnlocked(this.state, r));
      if (unlocked) {
        this.cropUnlockTexts[i]!.setText(`${type} - unlocked`);
        this.cropUnlockTexts[i]!.setColor('#facc15');
      } else if (reqsMet) {
        this.cropUnlockTexts[i]!.setText(`${type} $${def.unlockCost}`);
        this.cropUnlockTexts[i]!.setColor(can ? '#4ade80' : '#aaaaaa');
      } else {
        const reqs = def.requires.filter(r => !isCropUnlocked(this.state, r)).join('+');
        this.cropUnlockTexts[i]!.setText(`${type} (need ${reqs})`);
        this.cropUnlockTexts[i]!.setColor('#555555');
      }
    });
  }
}
