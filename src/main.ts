import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE, BLOCK_SIZE } from './entities/constants';

const VIEWPORT_W = BLOCK_SIZE * TILE_SIZE;
const SIDEBAR_W = 200;
const HUD_H = 22;
const TOOLBAR_H = 40;
const TOOLBAR2_H = 36;

new Phaser.Game({
  type: Phaser.CANVAS,
  width: VIEWPORT_W + SIDEBAR_W,
  height: VIEWPORT_W + HUD_H + TOOLBAR_H + TOOLBAR2_H,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: document.body,
  pixelArt: false,
});
