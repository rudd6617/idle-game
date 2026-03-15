import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE, BLOCK_SIZE } from './entities/constants';

const VIEWPORT_W = BLOCK_SIZE * TILE_SIZE + TILE_SIZE; // one block + 1 tile padding
const SIDEBAR_W = 220;

new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEWPORT_W + SIDEBAR_W,
  height: VIEWPORT_W,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: document.body,
});
