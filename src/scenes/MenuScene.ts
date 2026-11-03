/** Main menu: animated hamster, key art backdrop, working buttons. */
import Phaser from 'phaser';
import { makeButton, heading, FONT_BODY, FONT_HEAD } from '../ui';
import { save } from '../core/save';
import { audio } from '../core/audio';

export class MenuScene extends Phaser.Scene {
  private ham!: Phaser.GameObjects.Sprite;
  private hamTimer = 0;
  private seeds: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    this.seeds = [];
    this.buildBackdrop();
    this.buildTitle();
    this.buildHamster();
    this.buildButtons();
    this.buildFooter();

    audio.startMusic('menu');
    audio.stopAmbient();

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.seeds.forEach((s) => s.destroy());
    });
  }

  private buildBackdrop(): void {
    if (this.textures.exists('key-art')) {
      const src = this.textures.get('key-art').getSourceImage() as HTMLImageElement;
      const img = this.add.image(0, 0, 'key-art').setOrigin(0);
      const scale = Math.max(960 / src.width, 540 / src.height);
      img.setScale(scale);
      img.setPosition((960 - img.displayWidth) / 2, (540 - img.displayHeight) / 2);
      // legibility gradient
      const g = this.add.graphics();
      g.fillGradientStyle(0x120c22, 0x120c22, 0x120c22, 0x120c22, 0.82, 0.82, 0.1, 0.1);
      g.fillRect(0, 0, 960, 210);
      g.fillGradientStyle(0x120c22, 0x120c22, 0x120c22, 0x120c22, 0.05, 0.05, 0.85, 0.85);
      g.fillRect(0, 330, 960, 210);
    } else {
      this.add.image(0, 0, 'bg-meadow-sky').setOrigin(0).setDisplaySize(960, 540);
      this.add.tileSprite(0, 0, 960, 540, 'bg-meadow-far').setOrigin(0).setAlpha(0.95);
      this.add.tileSprite(0, 0, 960, 540, 'bg-meadow-mid').setOrigin(0);
      this.add.tileSprite(0, 0, 960, 540, 'bg-meadow-near').setOrigin(0);
    }

    // drifting seeds
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(
        Phaser.Math.Between(0, 960),
        Phaser.Math.Between(60, 540),
        'p-seed', 0
      ).setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setAlpha(Phaser.Math.FloatBetween(0.3, 0.75));
      this.seeds.push(s);
      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(80, 200),
        x: s.x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(6000, 12000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        yoyo: true,
        ease: 'Sine.inOut'
      });
    }
  }

  private buildTitle(): void {
    const t = this.add.text(480, 72, 'HAMSTER TALES', {
      fontFamily: FONT_HEAD, fontStyle: 'bold',
      fontSize: '58px',
      color: '#FFF3D6',
      stroke: '#2a1b44',
      strokeThickness: 7
    }).setOrigin(0.5);
    t.setShadow(0, 6, '#120c22', 12, true, true);

    const sub = this.add.text(480, 120, 'The Great Seed Adventure', {
      fontFamily: FONT_BODY,
      fontSize: '22px',
      color: '#FFCB4D'
    }).setOrigin(0.5);
    sub.setShadow(0, 3, '#120c22', 8, true, true);

    this.tweens.add({ targets: [t, sub], y: '-=6', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private buildHamster(): void {
    // soft contact shadow so the hamster sits in the painted scene instead of on a pasted blob
    const g = this.add.graphics();
    g.fillStyle(0x1a2410, 0.3);
    g.fillEllipse(700, 476, 190, 34);
    g.fillStyle(0x1a2410, 0.16);
    g.fillEllipse(700, 476, 250, 46);

    this.ham = this.add.sprite(700, 416, 'ham-idle', 0).setScale(2.5);
    this.ham.play('ham-idle');
    this.tweens.add({
      targets: this.ham,
      y: 410,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // occasional cheer / eat reaction
    this.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (!this.ham.active) return;
        const r = Math.random();
        if (r < 0.4) {
          this.ham.play('ham-cheer', true);
          this.time.delayedCall(1200, () => this.ham.play('ham-idle', true));
        } else if (r < 0.7) {
          this.ham.play('ham-eat', true);
          this.time.delayedCall(900, () => this.ham.play('ham-idle', true));
        } else {
          this.ham.play('ham-throw', true);
          this.time.delayedCall(600, () => this.ham.play('ham-idle', true));
        }
      }
    });
  }

  private buildButtons(): void {
    const x = 268;
    const hasProgress = Object.keys(save.data.levels).length > 0 || save.data.seeds > 0;

    const cont = makeButton(this, x, 214, 260, 54, 'Play', () => this.startGame('w1-1'), { variant: 'gold' });

    const contBtn = makeButton(this, x, 282, 260, 54, 'Continue', () => {
      const lvl = save.data.lastLevel ?? 'w1-1';
      this.startGame(lvl);
    }, { variant: 'primary' });
    contBtn.setEnabled(hasProgress);
    if (!hasProgress) contBtn.label.setAlpha(0.7);

    makeButton(this, x, 350, 260, 50, 'Settings', () => this.openSettings(), { variant: 'ghost' });
    makeButton(this, x, 414, 260, 50, 'Credits', () => this.openCredits(), { variant: 'ghost' });

    if (hasProgress) {
      const info = this.add.text(x, 466, `${save.data.seeds} seeds  ·  ${save.data.coins} coins  ·  ${save.data.treasures} treasures`, {
        fontFamily: FONT_BODY, fontSize: '14px', color: '#FFE9B8'
      }).setOrigin(0.5).setAlpha(0.8);
      info.setShadow(0, 2, '#120c22', 6, true, true);
    }

    // keyboard: Enter plays
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame(save.data.lastLevel ?? 'w1-1'));
  }

  private buildFooter(): void {
    const t = this.add.text(14, 522, 'v1.0  ·  Phaser 4  ·  arrow keys / A-D to move, Space to jump', {
      fontFamily: FONT_BODY, fontSize: '12px', color: '#FFE9B8'
    }).setOrigin(0, 0.5).setAlpha(0.55);
    t.setShadow(0, 2, '#120c22', 4, true, true);
  }

  private startGame(level: string): void {
    audio.sfx('click');
    audio.stopMusic();
    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('world', { level });
    });
  }

  private openSettings(): void {
    this.scene.launch('settings', { from: 'menu' });
    this.scene.pause();
  }

  private openCredits(): void {
    this.scene.launch('credits', { from: 'menu' });
    this.scene.pause();
  }

  update(_t: number, dt: number): void {
    this.hamTimer += dt / 1000;
    for (const s of this.seeds) {
      s.angle += Math.sin(this.hamTimer + s.x) * 0.06;
    }
  }
}
