import Phaser from 'phaser';
import type { CropType, FacilityType, GameState, UpgradeType } from '../entities/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, BLOCK_SIZE, BLOCK_COST, BASE_CARRY_CAPACITY, SAVE_INTERVAL, SAVE_KEY, CLEAR_COST, UPGRADE_DEFS, MAX_ORDERS, FACILITY_DEFS, BUILDING_TYPES, MACHINE_TYPES, ITEM_SELL_PRICES, NON_CROP_ITEMS } from '../entities/constants';
import { CROP_TYPES, CROP_DEFS } from '../entities/cropDefs';
import { createInitialState } from '../systems/StateFactory';
import { loadGame, saveGame, getOfflineTime } from '../systems/SaveSystem';
import { updateCrops } from '../systems/CropSystem';
import { updateWorkers } from '../systems/WorkerSystem';
import { updateFacilities, canBuildFacility, buildFacility, buyAnimal, getWarehouseCapacity, getCurrentStorage } from '../systems/FacilitySystem';
import { sellCrop, sellItem } from '../systems/EconomySystem';
import { canCraftWorker, craftWorker, getWorkerCost } from '../systems/CraftSystem';
import { canUpgrade, applyUpgrade, getUpgradeCost, getUpgradeMultiplier } from '../systems/UpgradeSystem';
import { updateOrders, canFulfillOrder, fulfillOrder } from '../systems/OrderSystem';
import { isCropUnlocked, canUnlockCrop, unlockCrop } from '../systems/CropUnlockSystem';
import { generateAllSprites, getCropTextureKey, getTileTextureKey } from '../sprites/SpriteGenerator';

const VIEWPORT_W = BLOCK_SIZE * TILE_SIZE + TILE_SIZE;
const MAP_PX_W = MAP_WIDTH * TILE_SIZE;
const MAP_PX_H = MAP_HEIGHT * TILE_SIZE;
const HUD_H = 22;
const TOOLBAR_H = 40;
const CANVAS_H = VIEWPORT_W + HUD_H + TOOLBAR_H;
const PANEL_H = 280;
const SUB_BAR_H = 36;

const FONT_SM = { fontSize: '11px', color: '#999999', fontFamily: 'monospace' } as const;
const FONT_MD = { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' } as const;
// FONT_HEADER available if needed for panel titles

type PanelType = 'sell' | 'upgrades' | 'crops' | 'orders' | null;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private saveTimer = 0;
  private resetting = false;

  // Sprite layers
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private cropImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWaterIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropWeedIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private cropReadyIcons: Map<number, Phaser.GameObjects.Image> = new Map();
  private workerImages: Phaser.GameObjects.Image[] = [];
  private workerCarryIcons: Phaser.GameObjects.Image[] = [];
  private indicatorImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private facilityImages: Map<number, Phaser.GameObjects.Image> = new Map();
  private demolishOverlay!: Phaser.GameObjects.Graphics;
  private lockImages: Map<string, Phaser.GameObjects.Image> = new Map();

  // Camera
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Modes
  private placingFacility: FacilityType | null = null;
  private placingFarmland = false;
  private demolishMode = false;
  private gatherMode: 'wood' | 'stone' | null = null;
  private placementPreview!: Phaser.GameObjects.Graphics;

  // UI
  private hudText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private activePanel: PanelType = null;
  private panelBg!: Phaser.GameObjects.Graphics;
  // Panel content — pre-created, toggled visibility
  private sellTexts: Phaser.GameObjects.Text[] = [];
  private itemSellTexts: Phaser.GameObjects.Text[] = [];
  private upgradeTexts: Phaser.GameObjects.Text[] = [];
  private cropUnlockTexts: Phaser.GameObjects.Text[] = [];
  private orderTexts: Phaser.GameObjects.Text[] = [];
  private orderClaimTexts: Phaser.GameObjects.Text[] = [];
  private toolbarButtons: Phaser.GameObjects.Image[] = [];
  private activeGroup: 'buildings' | 'machines' | null = null;
  private subBarBg!: Phaser.GameObjects.Graphics;
  private subBarItems: Array<{ img: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; group: string }> = [];

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

    this.placementPreview = this.add.graphics().setDepth(20);
    this.demolishOverlay = this.add.graphics().setDepth(9);

    // Camera — bounds padded so map doesn't hide behind HUD/toolbar
    this.cameras.main.setBounds(0, -HUD_H, MAP_PX_W, MAP_PX_H + HUD_H + TOOLBAR_H);
    this.cameras.main.scrollY = -HUD_H;

    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.middleButtonDown()) { this.isDragging = true; this.dragStartX = p.x; this.dragStartY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.cameras.main.scrollX -= (p.x - this.dragStartX);
        this.cameras.main.scrollY -= (p.y - this.dragStartY);
        this.dragStartX = p.x; this.dragStartY = p.y;
      }
      this.updatePlacementPreview(p);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => { if (p.middleButtonReleased()) this.isDragging = false; });

    // === TOP HUD ===
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(50);
    hudBg.fillStyle(0x111122, 0.9);
    hudBg.fillRect(0, 0, VIEWPORT_W, HUD_H);
    this.hudText = this.add.text(8, 4, '', { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(51);
    // Reset button
    const resetBtn = this.add.text(VIEWPORT_W - 60, 4, '[Reset]', { fontSize: '10px', color: '#ff4444', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => { this.resetting = true; localStorage.removeItem(SAVE_KEY); window.location.reload(); });

    // === BOTTOM TOOLBAR ===
    const tbY = CANVAS_H - TOOLBAR_H;
    const tbBg = this.add.graphics().setScrollFactor(0).setDepth(50);
    tbBg.fillStyle(0x111122, 0.9);
    tbBg.fillRect(0, tbY, VIEWPORT_W, TOOLBAR_H);
    tbBg.lineStyle(1, 0x333333, 1);
    tbBg.lineBetween(0, tbY, VIEWPORT_W, tbY);

    // Mode hint text
    this.modeText = this.add.text(VIEWPORT_W / 2, tbY - 14, '', { fontSize: '10px', color: '#facc15', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(51).setOrigin(0.5, 0.5);

    // Tool buttons (left side) — grouped
    const tools: Array<{ key: string; action: () => void }> = [
      { key: 'tb_farm', action: () => { this.clearModes(); this.placingFarmland = true; } },
      { key: 'tb_build', action: () => this.toggleGroup('buildings') },
      { key: 'tb_machine', action: () => this.toggleGroup('machines') },
      { key: 'tb_demolish', action: () => { this.clearModes(); this.demolishMode = true; } },
      { key: 'tb_gather_wood', action: () => { this.clearModes(); this.gatherMode = 'wood'; } },
      { key: 'tb_gather_stone', action: () => { this.clearModes(); this.gatherMode = 'stone'; } },
    ];

    tools.forEach((t, i) => {
      const btn = this.add.image(20 + i * 36, tbY + 20, t.key)
        .setScrollFactor(0).setDepth(51).setDisplaySize(24, 24)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', t.action);
      this.toolbarButtons.push(btn);
    });

    // Sub-bar for facility groups
    this.subBarBg = this.add.graphics().setScrollFactor(0).setDepth(52).setVisible(false);
    const subBarGroups: Array<{ group: 'buildings' | 'machines'; types: typeof BUILDING_TYPES }> = [
      { group: 'buildings', types: BUILDING_TYPES },
      { group: 'machines', types: MACHINE_TYPES },
    ];
    for (const { group, types } of subBarGroups) {
      for (const type of types) {
        const def = FACILITY_DEFS[type];
        const img = this.add.image(0, 0, `icon_${type}`)
          .setScrollFactor(0).setDepth(53).setDisplaySize(24, 24)
          .setInteractive({ useHandCursor: true }).setVisible(false);
        img.on('pointerdown', () => {
          this.activeGroup = null;
          this.refreshSubBar();
          this.clearPlacementModes();
          if (this.state.resources.money >= def.cost) this.placingFacility = type;
        });
        const label = this.add.text(0, 0, `$${def.cost}`, { fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace' })
          .setScrollFactor(0).setDepth(53).setOrigin(0.5, 0).setVisible(false);
        this.subBarItems.push({ img, label, group });
      }
    }

    // Panel buttons (right side)
    const panels: Array<{ key: string; panel: PanelType }> = [
      { key: 'tb_sell', panel: 'sell' },
      { key: 'tb_upgrade', panel: 'upgrades' },
      { key: 'tb_crops', panel: 'crops' },
      { key: 'tb_orders', panel: 'orders' },
    ];
    panels.forEach((p, i) => {
      const btn = this.add.image(VIEWPORT_W - 20 - (panels.length - 1 - i) * 36, tbY + 20, p.key)
        .setScrollFactor(0).setDepth(51).setDisplaySize(24, 24)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.clearModes();
        this.activePanel = this.activePanel === p.panel ? null : p.panel;
        this.rebuildPanel();
      });
      this.toolbarButtons.push(btn);
    });

    // Worker button in toolbar (icon + cost label)
    const wbX = 20 + tools.length * 36;
    const workerIcon = this.add.image(wbX, tbY + 20, 'tb_worker')
      .setScrollFactor(0).setDepth(51).setDisplaySize(24, 24)
      .setInteractive({ useHandCursor: true });
    workerIcon.on('pointerdown', () => { craftWorker(this.state); });
    const workerLabel = this.add.text(wbX + 16, tbY + 6, '', { fontSize: '9px', color: '#4ade80', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(51);
    (this as any)._workerLabel = workerLabel;

    // Panel background (hidden initially)
    this.panelBg = this.add.graphics().setScrollFactor(0).setDepth(48).setVisible(false);

    // Pre-create panel content elements
    this.createPanelElements();

    // Tile click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y <= HUD_H || pointer.y >= CANVAS_H - TOOLBAR_H) return;
      this.handleTileClick(pointer);
    });

    // Cancel modes
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown()) this.clearModes(); });
    this.input.keyboard?.on('keydown-ESC', () => { this.clearModes(); this.activePanel = null; this.rebuildPanel(); });

    // Background tab handler
    document.addEventListener('visibilitychange', () => {
      if (this.resetting) return;
      if (document.hidden) { this.state.lastSaveTime = Date.now(); saveGame(this.state); }
      else { const e = Date.now() - this.state.lastSaveTime; if (e > 1000) this.simulateOffline(e); }
    });
  }

  private createPanelElements(): void {
    // SELL panel
    CROP_TYPES.forEach((type) => {
      const t = this.add.text(0, 0, '', FONT_MD).setScrollFactor(0).setDepth(49)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      t.on('pointerdown', () => { sellCrop(this.state, type); });
      this.sellTexts.push(t);
    });
    NON_CROP_ITEMS.forEach((type) => {
      const t = this.add.text(0, 0, '', FONT_MD).setScrollFactor(0).setDepth(49)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      t.on('pointerdown', () => { sellItem(this.state, type); });
      this.itemSellTexts.push(t);
    });

    // UPGRADES panel
    const allUpgrades: UpgradeType[] = ['workerSpeed', 'growthSpeed', 'maintenanceInterval', 'autoHarvest', 'demolishSpeed', 'carryCapacity'];
    allUpgrades.forEach((type) => {
      const t = this.add.text(0, 0, '', FONT_MD).setScrollFactor(0).setDepth(49)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      t.on('pointerdown', () => { applyUpgrade(this.state, type); });
      this.upgradeTexts.push(t);
    });

    // CROPS panel
    CROP_TYPES.forEach((type) => {
      const def = CROP_DEFS[type];
      if (def.unlockCost === 0) return;
      const t = this.add.text(0, 0, '', FONT_MD).setScrollFactor(0).setDepth(49)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      t.on('pointerdown', () => { unlockCrop(this.state, type); });
      this.cropUnlockTexts.push(t);
    });

    // ORDERS panel
    for (let i = 0; i < MAX_ORDERS; i++) {
      const ot = this.add.text(0, 0, '', FONT_SM).setScrollFactor(0).setDepth(49).setVisible(false);
      this.orderTexts.push(ot);
      const ct = this.add.text(0, 0, '', FONT_MD).setScrollFactor(0).setDepth(49)
        .setInteractive({ useHandCursor: true }).setVisible(false);
      ct.on('pointerdown', () => { const order = this.state.orders[i]; if (order) fulfillOrder(this.state, order); });
      this.orderClaimTexts.push(ct);
    }
  }

  private rebuildPanel(): void {
    // Hide all panel content
    [...this.sellTexts, ...this.itemSellTexts, ...this.upgradeTexts, ...this.cropUnlockTexts, ...this.orderTexts, ...this.orderClaimTexts]
      .forEach(t => t.setVisible(false));

    if (!this.activePanel) {
      this.panelBg.setVisible(false);
      return;
    }

    const panelY = CANVAS_H - TOOLBAR_H - PANEL_H;
    this.panelBg.setVisible(true);
    this.panelBg.clear();
    this.panelBg.fillStyle(0x111122, 0.92);
    this.panelBg.fillRect(0, panelY, VIEWPORT_W, PANEL_H);
    this.panelBg.lineStyle(1, 0x333333, 1);
    this.panelBg.lineBetween(0, panelY, VIEWPORT_W, panelY);

    // Position content based on active panel
    const x = 12;
    let y = panelY + 8;

    switch (this.activePanel) {
      case 'sell':
        this.sellTexts.forEach(t => { t.setPosition(x, y).setVisible(true); y += 16; });
        this.itemSellTexts.forEach(t => { t.setPosition(x, y).setVisible(true); y += 16; });
        break;
      case 'upgrades':
        this.upgradeTexts.forEach(t => { t.setPosition(x, y).setVisible(true); y += 18; });
        break;
      case 'crops':
        this.cropUnlockTexts.forEach(t => { t.setPosition(x, y).setVisible(true); y += 18; });
        break;
      case 'orders':
        for (let i = 0; i < MAX_ORDERS; i++) {
          this.orderTexts[i]!.setPosition(x, y).setVisible(true); y += 16;
          this.orderClaimTexts[i]!.setPosition(x, y).setVisible(true); y += 22;
        }
        break;
    }
  }

  update(_time: number, delta: number): void {
    if (this.resetting) return;

    // WASD
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
    if (this.saveTimer >= SAVE_INTERVAL) { this.saveTimer = 0; saveGame(this.state); }

    this.syncCrops();
    this.syncFacilities();
    this.syncWorkers();
    this.syncTileVisibility();
    this.drawIndicators();
    this.drawUI();
  }

  // === CLICK HANDLING ===

  private clearPlacementModes(): void {
    this.placingFacility = null;
    this.placingFarmland = false;
    this.demolishMode = false;
    this.gatherMode = null;
  }

  private clearModes(): void {
    this.clearPlacementModes();
    if (this.activeGroup) { this.activeGroup = null; this.refreshSubBar(); }
  }

  private toggleGroup(group: 'buildings' | 'machines'): void {
    this.clearPlacementModes();
    this.activeGroup = this.activeGroup === group ? null : group;
    this.refreshSubBar();
  }

  private refreshSubBar(): void {
    const subBarY = CANVAS_H - TOOLBAR_H - SUB_BAR_H;
    let idx = 0;
    for (const it of this.subBarItems) {
      if (it.group === this.activeGroup) {
        const x = 30 + idx * 56;
        it.img.setPosition(x, subBarY + 12).setVisible(true);
        it.label.setPosition(x, subBarY + 26).setVisible(true);
        idx++;
      } else {
        it.img.setVisible(false);
        it.label.setVisible(false);
      }
    }
    if (idx > 0) {
      this.subBarBg.setVisible(true).clear();
      this.subBarBg.fillStyle(0x111122, 0.92);
      this.subBarBg.fillRect(0, subBarY, VIEWPORT_W, SUB_BAR_H);
      this.subBarBg.lineStyle(1, 0x333333, 1);
      this.subBarBg.lineBetween(0, subBarY, VIEWPORT_W, subBarY);
    } else {
      this.subBarBg.setVisible(false);
    }
  }

  private getBlockCoord(tx: number, ty: number) {
    return { x: Math.floor(tx / BLOCK_SIZE), y: Math.floor(ty / BLOCK_SIZE) };
  }
  private isBlockOwned(bx: number, by: number) {
    return this.state.purchasedBlocks.some(b => b.x === bx && b.y === by);
  }
  private isAdjacentToOwned(bx: number, by: number) {
    return this.state.purchasedBlocks.some(b => (Math.abs(b.x - bx) + Math.abs(b.y - by)) === 1);
  }

  private handleTileClick(pointer: Phaser.Input.Pointer): void {
    if (pointer.rightButtonDown()) return;
    if (this.activeGroup) { this.activeGroup = null; this.refreshSubBar(); return; }

    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    const tile = this.state.tiles[ty]?.[tx];
    if (!tile) return;

    const block = this.getBlockCoord(tx, ty);
    if (!this.isBlockOwned(block.x, block.y)) {
      if (this.isAdjacentToOwned(block.x, block.y) && this.state.resources.money >= BLOCK_COST) {
        this.state.resources.money -= BLOCK_COST;
        this.state.purchasedBlocks.push({ x: block.x, y: block.y });
      }
      return;
    }

    if (this.demolishMode) {
      if (tile.facilityId !== null) { this.demolishFacility(tile.facilityId); this.demolishMode = false; }
      return;
    }
    if (this.gatherMode) {
      const valid = this.gatherMode === 'wood' ? ['wood', 'small_wood'] : ['stone', 'small_stone'];
      if (valid.includes(tile.type) && tile.durability > 0) tile.markedForDemolish = !tile.markedForDemolish;
      return;
    }
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
    if (this.placingFacility) {
      if (buildFacility(this.state, this.placingFacility, tx, ty)) this.placingFacility = null;
      return;
    }
    if (tile.facilityId !== null) {
      const fac = this.state.facilities.find(f => f.id === tile.facilityId);
      if (fac) {
        const def = FACILITY_DEFS[fac.type];
        if (def.maxAnimals > 0) buyAnimal(this.state, fac);
      }
      return;
    }
    if (tile.type === 'soil') {
      if (tile.assignedCrop === null && tile.cropId === null) {
        tile.type = 'grass'; tile.durability = 0; this.updateTileImage(tx, ty);
      } else {
        const cycle: (CropType | null)[] = [...this.state.unlockedCrops, null];
        const idx = cycle.indexOf(tile.assignedCrop);
        tile.assignedCrop = cycle[(idx + 1) % cycle.length] ?? null;
      }
      return;
    }
    if (tile.durability > 0) { tile.markedForDemolish = !tile.markedForDemolish; }
  }

  private demolishFacility(facilityId: number): void {
    const idx = this.state.facilities.findIndex(f => f.id === facilityId);
    if (idx === -1) return;
    const fac = this.state.facilities[idx]!;
    const def = FACILITY_DEFS[fac.type];
    this.state.resources.money += Math.floor(def.cost / 2);
    for (let dy = 0; dy < fac.height; dy++) {
      for (let dx = 0; dx < fac.width; dx++) {
        const t = this.state.tiles[fac.originY + dy]?.[fac.originX + dx];
        if (t) { t.facilityId = null; t.type = 'grass'; this.updateTileImage(fac.originX + dx, fac.originY + dy); }
      }
    }
    this.state.facilities.splice(idx, 1);
  }

  private updatePlacementPreview(pointer: Phaser.Input.Pointer): void {
    const g = this.placementPreview;
    g.clear();
    if (pointer.y <= HUD_H || pointer.y >= CANVAS_H - TOOLBAR_H) return;

    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);

    if (this.demolishMode) {
      const tile = this.state.tiles[ty]?.[tx];
      if (tile?.facilityId != null) {
        const fac = this.state.facilities.find(f => f.id === tile.facilityId);
        if (fac) { g.lineStyle(2, 0xff0000, 0.8); g.strokeRect(fac.originX * TILE_SIZE, fac.originY * TILE_SIZE, fac.width * TILE_SIZE, fac.height * TILE_SIZE); }
      }
      return;
    }
    if (this.placingFarmland) {
      const tile = this.state.tiles[ty]?.[tx];
      const ok = tile?.type === 'grass' && tile?.facilityId === null;
      g.lineStyle(2, ok ? 0x4ade80 : 0xff0000, 0.8);
      g.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      return;
    }
    if (this.placingFacility) {
      const def = FACILITY_DEFS[this.placingFacility];
      const ok = canBuildFacility(this.state, this.placingFacility, tx, ty);
      g.lineStyle(2, ok ? 0x4ade80 : 0xff0000, 0.8);
      g.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, def.width * TILE_SIZE, def.height * TILE_SIZE);
    }
  }

  private updateTileImage(x: number, y: number): void {
    const tile = this.state.tiles[y]?.[x];
    if (!tile) return;
    const img = this.tileImages[y]?.[x];
    if (img) { img.setTexture(getTileTextureKey(tile.type)); img.setDisplaySize(TILE_SIZE - 1, TILE_SIZE - 1); }
  }

  private simulateOffline(ms: number): void {
    const cappedMs = Math.min(ms, 3_600_000);
    for (let t = 0; t < cappedMs; t += 1000) {
      const dt = Math.min(1000, cappedMs - t);
      updateCrops(this.state, dt);
      updateWorkers(this.state, dt);
      updateFacilities(this.state, dt);
      updateOrders(this.state, dt);
    }
  }

  // === SYNC ===

  private syncCrops(): void {
    const activeIds = new Set<number>();
    for (const crop of this.state.crops) {
      activeIds.add(crop.id);
      const key = getCropTextureKey(crop.type, crop.stage);
      let img = this.cropImages.get(crop.id);
      if (!img) { img = this.add.image(0, 0, key).setDepth(5); this.cropImages.set(crop.id, img); }
      img.setTexture(key).setPosition(crop.tileX * TILE_SIZE + TILE_SIZE / 2, crop.tileY * TILE_SIZE + TILE_SIZE / 2).setDisplaySize(TILE_SIZE - 4, TILE_SIZE - 4).setVisible(true);

      let wi = this.cropWaterIcons.get(crop.id);
      if (!wi) { wi = this.add.image(0, 0, 'icon_water').setDepth(8); this.cropWaterIcons.set(crop.id, wi); }
      wi.setPosition(crop.tileX * TILE_SIZE + 10, crop.tileY * TILE_SIZE + 10).setVisible(crop.needsWater);

      let we = this.cropWeedIcons.get(crop.id);
      if (!we) { we = this.add.image(0, 0, 'icon_weed').setDepth(8); this.cropWeedIcons.set(crop.id, we); }
      we.setPosition(crop.tileX * TILE_SIZE + TILE_SIZE - 10, crop.tileY * TILE_SIZE + 10).setVisible(crop.needsWeeding);

      // Ready icon — floating item for pickup
      if (crop.stage === 'ready') {
        let ri = this.cropReadyIcons.get(crop.id);
        if (!ri) { ri = this.add.image(0, 0, `icon_${crop.type}`).setDepth(12); this.cropReadyIcons.set(crop.id, ri); }
        ri.setTexture(`icon_${crop.type}`).setPosition(crop.tileX * TILE_SIZE + TILE_SIZE - 8, crop.tileY * TILE_SIZE + TILE_SIZE - 8).setDisplaySize(12, 12).setVisible(true);
      } else {
        const ri = this.cropReadyIcons.get(crop.id);
        if (ri) { ri.setVisible(false); }
      }
    }
    for (const [id, img] of this.cropImages) {
      if (!activeIds.has(id)) {
        img.destroy(); this.cropImages.delete(id);
        this.cropWaterIcons.get(id)?.destroy(); this.cropWaterIcons.delete(id);
        this.cropWeedIcons.get(id)?.destroy(); this.cropWeedIcons.delete(id);
        this.cropReadyIcons.get(id)?.destroy(); this.cropReadyIcons.delete(id);
      }
    }
  }

  private syncFacilities(): void {
    const activeIds = new Set<number>();
    for (const fac of this.state.facilities) {
      activeIds.add(fac.id);
      const key = `facility_${fac.type}`;
      const pw = fac.width * TILE_SIZE, ph = fac.height * TILE_SIZE;
      let img = this.facilityImages.get(fac.id);
      if (!img) { img = this.add.image(0, 0, key).setDepth(3); this.facilityImages.set(fac.id, img); }
      img.setTexture(key).setPosition(fac.originX * TILE_SIZE + pw / 2, fac.originY * TILE_SIZE + ph / 2).setDisplaySize(pw - 2, ph - 2).setVisible(true);
    }
    for (const [id, img] of this.facilityImages) { if (!activeIds.has(id)) { img.destroy(); this.facilityImages.delete(id); } }
  }

  private syncWorkers(): void {
    while (this.workerImages.length < this.state.workers.length) {
      this.workerImages.push(this.add.image(0, 0, 'worker_idle').setDepth(15));
      this.workerCarryIcons.push(this.add.image(0, 0, 'icon_fallow').setDepth(16).setVisible(false));
    }
    for (let i = 0; i < this.state.workers.length; i++) {
      const w = this.state.workers[i]!;
      this.workerImages[i]!.setTexture(w.state === 'working' ? 'worker_working' : 'worker_idle').setPosition(w.x, w.y).setDisplaySize(16, 16).setVisible(true);
      // Show carried item icon above worker
      const carried = Object.entries(w.carryingItems).find(([, v]) => (v ?? 0) > 0);
      const icon = this.workerCarryIcons[i]!;
      if (carried) {
        icon.setTexture(`icon_${carried[0]}`).setPosition(w.x, w.y - 12).setDisplaySize(10, 10).setVisible(true);
      } else {
        icon.setVisible(false);
      }
    }
    for (let i = this.state.workers.length; i < this.workerImages.length; i++) {
      this.workerImages[i]!.setVisible(false);
      this.workerCarryIcons[i]!.setVisible(false);
    }
  }

  private syncTileVisibility(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const b = this.getBlockCoord(x, y);
        const img = this.tileImages[y]?.[x];
        if (!img) continue;
        img.setVisible(this.isBlockOwned(b.x, b.y));
        const tile = this.state.tiles[y]![x]!;
        const texKey = getTileTextureKey(tile.type);
        if (img.texture.key !== texKey) { img.setTexture(texKey); img.setDisplaySize(TILE_SIZE - 1, TILE_SIZE - 1); }
      }
    }
    // Lock icons
    const activeLocks = new Set<string>();
    const maxBx = Math.floor(MAP_WIDTH / BLOCK_SIZE), maxBy = Math.floor(MAP_HEIGHT / BLOCK_SIZE);
    const blockPx = BLOCK_SIZE * TILE_SIZE;
    for (let by = 0; by < maxBy; by++) {
      for (let bx = 0; bx < maxBx; bx++) {
        if (this.isBlockOwned(bx, by) || !this.isAdjacentToOwned(bx, by)) continue;
        const key = `${bx},${by}`;
        activeLocks.add(key);
        let cx = bx * blockPx + blockPx / 2, cy = by * blockPx + blockPx / 2;
        if (bx > 0 && this.isBlockOwned(bx - 1, by)) cx = bx * blockPx + TILE_SIZE / 2;
        else if (bx < maxBx - 1 && this.isBlockOwned(bx + 1, by)) cx = (bx + 1) * blockPx - TILE_SIZE / 2;
        else if (by > 0 && this.isBlockOwned(bx, by - 1)) { cx = bx * blockPx + blockPx / 2; cy = by * blockPx + TILE_SIZE / 2; }
        else if (by < maxBy - 1 && this.isBlockOwned(bx, by + 1)) { cx = bx * blockPx + blockPx / 2; cy = (by + 1) * blockPx - TILE_SIZE / 2; }
        let li = this.lockImages.get(key);
        if (!li) { li = this.add.image(cx, cy, 'icon_lock').setDepth(25); this.lockImages.set(key, li); }
        li.setPosition(cx, cy).setVisible(true);
      }
    }
    for (const [k, img] of this.lockImages) { if (!activeLocks.has(k)) img.setVisible(false); }
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
        const texKey = tile.assignedCrop ? `icon_${tile.assignedCrop}` : 'icon_fallow';
        let img = this.indicatorImages.get(key);
        if (!img) { img = this.add.image(0, 0, texKey).setDepth(10); this.indicatorImages.set(key, img); }
        img.setTexture(texKey).setPosition(tile.x * TILE_SIZE + 7, tile.y * TILE_SIZE + 7).setVisible(true);
      }
    }
    for (const [k, img] of this.indicatorImages) { if (!active.has(k)) img.setVisible(false); }

    const g = this.demolishOverlay;
    g.clear();
    for (const row of this.state.tiles) {
      for (const tile of row) {
        if (!tile.markedForDemolish || tile.durability <= 0) continue;
        g.lineStyle(2, 0xff4444, 0.8);
        g.strokeRect(tile.x * TILE_SIZE + 1, tile.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }
  }

  // === DRAW UI ===

  private drawUI(): void {
    const { money } = this.state.resources;
    const stored = getCurrentStorage(this.state);
    const cap = getWarehouseCapacity(this.state);
    this.hudText.setText(`$${money}  Storage:${stored}/${cap}  W:${this.state.workers.length}  G:${this.state.crops.length}`);

    // Worker button label
    const wl = (this as any)._workerLabel as Phaser.GameObjects.Text;
    const canCraft = canCraftWorker(this.state);
    wl.setText(`$${getWorkerCost(this.state)}`);
    wl.setColor(canCraft ? '#4ade80' : '#555555');

    // Mode hint
    let hint = '';
    if (this.placingFarmland) hint = 'Place farmland (ESC cancel)';
    else if (this.placingFacility) hint = `Place ${FACILITY_DEFS[this.placingFacility].label} (ESC cancel)`;
    else if (this.demolishMode) hint = 'Click facility to demolish';
    else if (this.gatherMode === 'wood') hint = 'Click wood to gather';
    else if (this.gatherMode === 'stone') hint = 'Click stone to gather';
    this.modeText.setText(hint);

    // Active panel content
    if (this.activePanel === 'sell') this.drawSellPanel();
    if (this.activePanel === 'upgrades') this.drawUpgradesPanel();
    if (this.activePanel === 'crops') this.drawCropsPanel();
    if (this.activePanel === 'orders') this.drawOrdersPanel();
  }

  private drawSellPanel(): void {
    CROP_TYPES.forEach((type, i) => {
      const count = this.state.resources.items[type] ?? 0;
      const unlocked = isCropUnlocked(this.state, type);
      if (!unlocked) { this.sellTexts[i]!.setVisible(false); return; }
      this.sellTexts[i]!.setText(`${type} x${count} [$${CROP_DEFS[type].sellPrice}]`);
      this.sellTexts[i]!.setColor(count > 0 ? '#4ade80' : '#555555');
    });
    NON_CROP_ITEMS.forEach((type, i) => {
      const count = this.state.resources.items[type] ?? 0;
      const price = ITEM_SELL_PRICES[type] ?? 0;
      this.itemSellTexts[i]!.setText(`${type} x${count} [$${price}]`);
      this.itemSellTexts[i]!.setColor(count > 0 ? '#4ade80' : '#555555');
    });
  }

  private drawUpgradesPanel(): void {
    const types: UpgradeType[] = ['workerSpeed', 'growthSpeed', 'maintenanceInterval', 'autoHarvest', 'demolishSpeed', 'carryCapacity'];
    types.forEach((type, i) => {
      const def = UPGRADE_DEFS[type];
      const level = this.state.upgrades[type];
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : getUpgradeCost(type, level);
      const can = canUpgrade(this.state, type);
      let effect: string;
      if (type === 'autoHarvest') effect = level > 0 ? 'ON' : 'OFF';
      else if (type === 'carryCapacity') effect = `${BASE_CARRY_CAPACITY + level * 2}`;
      else effect = `x${getUpgradeMultiplier(this.state, type).toFixed(1)}`;
      const label = maxed ? `${def.label} Lv${level} ${effect} MAX` : `${def.label} Lv${level} ${effect} $${cost}`;
      this.upgradeTexts[i]!.setText(label);
      this.upgradeTexts[i]!.setColor(maxed ? '#facc15' : can ? '#4ade80' : '#555555');
    });
  }

  private drawCropsPanel(): void {
    const lockable = CROP_TYPES.filter(t => CROP_DEFS[t].unlockCost > 0);
    lockable.forEach((type, i) => {
      const def = CROP_DEFS[type];
      const unlocked = isCropUnlocked(this.state, type);
      const can = canUnlockCrop(this.state, type);
      const reqsMet = def.requires.every(r => isCropUnlocked(this.state, r));
      if (unlocked) { this.cropUnlockTexts[i]!.setText(`${type} - unlocked`).setColor('#facc15'); }
      else if (reqsMet) { this.cropUnlockTexts[i]!.setText(`${type} $${def.unlockCost}`).setColor(can ? '#4ade80' : '#aaaaaa'); }
      else { this.cropUnlockTexts[i]!.setText(`${type} (need ${def.requires.filter(r => !isCropUnlocked(this.state, r)).join('+')})`).setColor('#555555'); }
    });
  }

  private drawOrdersPanel(): void {
    for (let i = 0; i < MAX_ORDERS; i++) {
      const order = this.state.orders[i];
      if (!order) {
        this.orderTexts[i]!.setText('---');
        this.orderClaimTexts[i]!.setText('').disableInteractive();
        continue;
      }
      const secs = Math.ceil(order.timeRemaining / 1000);
      const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      this.orderTexts[i]!.setText(`#${order.id} [${timeStr}] ${order.requirements.map(r => `${r.crop} x${r.amount}`).join('  ')}`);
      const canClaim = canFulfillOrder(this.state, order);
      this.orderClaimTexts[i]!.setText(`[Claim $${order.reward}]`).setColor(canClaim ? '#4ade80' : '#555555');
      if (canClaim) this.orderClaimTexts[i]!.setInteractive({ useHandCursor: true });
      else this.orderClaimTexts[i]!.disableInteractive();
    }
  }
}
