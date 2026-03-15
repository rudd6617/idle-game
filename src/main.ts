import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './entities/constants';

const SIDEBAR_W = 220;

new Phaser.Game({
  type: Phaser.AUTO,
  width: MAP_WIDTH * TILE_SIZE + SIDEBAR_W,
  height: MAP_HEIGHT * TILE_SIZE,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: document.body,
});
