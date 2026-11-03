import Phaser from 'phaser';
import { buildAllTextures } from '../art';
import { audio } from '../core/audio';
import { save } from '../core/save';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    // Optional AI-generated key art. If it is missing the menu falls back to
    // the procedural background, so the game never depends on this file.
    this.load.image('key-art', 'art/key-art.jpg');
    this.load.on('loaderror', () => { /* silently ignore */ });
  }

  create(): void {
    buildAllTextures(this);

    const splash = document.getElementById('boot-splash');
    if (splash) {
      splash.classList.add('hide');
      window.setTimeout(() => splash.remove(), 500);
    }

    // Audio can only start after a real user gesture.
    const unlock = (): void => {
      audio.init();
      audio.setMusicVolume(save.data.settings.music);
      audio.setSfxVolume(save.data.settings.sfx);
      audio.setMuted(save.data.settings.muted);
      if (this.scene.isActive('menu')) audio.startMusic('menu');
    };
    this.input.once('pointerdown', unlock);
    this.input.keyboard?.once('keydown', unlock);

    this.scene.start('menu');
  }
}
