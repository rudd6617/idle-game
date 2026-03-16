import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE, BLOCK_SIZE } from './entities/constants';

const VIEWPORT_W = BLOCK_SIZE * TILE_SIZE + TILE_SIZE; // 528
const HUD_H = 22;
const TOOLBAR_H = 40;

new Phaser.Game({
  type: Phaser.CANVAS,
  width: VIEWPORT_W,
  height: VIEWPORT_W + HUD_H + TOOLBAR_H,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: document.body,
  pixelArt: false,
});
