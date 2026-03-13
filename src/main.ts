import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './entities/constants';

const HUD_HEIGHT = 100; // rows: HUD(8) + crops(32) + sell(54) + legend(76) + padding

new Phaser.Game({
  type: Phaser.AUTO,
  width: MAP_WIDTH * TILE_SIZE,
  height: MAP_HEIGHT * TILE_SIZE + HUD_HEIGHT,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
  parent: document.body,
});
