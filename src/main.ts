import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { WorldScene } from './scenes/WorldScene';
import { HUDScene } from './scenes/HUDScene';
import { PauseScene, SettingsScene, InventoryScene, MapScene, GameOverScene, LevelClearScene, CreditsScene } from './scenes/Overlays';

const errBox = document.getElementById('err');
function showError(msg: string): void {
  if (!errBox) return;
  errBox.style.display = 'block';
  errBox.textContent = (errBox.textContent ? errBox.textContent + '\n' : '') + msg;
}

window.addEventListener('error', (e) => showError(`${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener('unhandledrejection', (e) => showError(`Promise: ${String(e.reason)}`));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#120c22',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance'
  },
  input: {
    activePointers: 3
  },
  scene: [
    BootScene,
    MenuScene,
    WorldScene,
    HUDScene,
    PauseScene,
    SettingsScene,
    InventoryScene,
    MapScene,
    GameOverScene,
    LevelClearScene,
    CreditsScene
  ]
};

const game = new Phaser.Game(config);

// exposed for automated smoke tests
(window as unknown as { __HT: unknown }).__HT = {
  game,
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  level: () => (game.scene.getScene('world') as WorldScene | null)?.levelId ?? null
};
