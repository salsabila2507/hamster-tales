/** Pause, settings, inventory, map, game over, level clear, credits. */
import Phaser from 'phaser';
import { makeButton, makeSlider, panel, heading, bodyText, dim, FONT_BODY, FONT_HEAD } from '../ui';
import { save, ACHIEVEMENTS } from '../core/save';
import { audio } from '../core/audio';
import { LEVELS, levelById, LEVEL_ORDER } from '../levels/levels';
import { THEMES } from '../art/palette';

type From = 'menu' | 'world' | 'pause';

function closeOverlay(scene: Phaser.Scene, from: From): void {
  scene.scene.stop();
  if (from === 'menu') scene.scene.resume('menu');
  else if (from === 'pause') scene.scene.resume('pause');
  else scene.scene.resume('world');
}

const W = 960;
const H = 540;

/* ------------------------------- pause -------------------------------- */

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause');
  }

  create(): void {
    dim(this, 0.62);
    panel(this, 280, 96, 400, 348);
    heading(this, 480, 140, 'Paused', 36);

    const items: [string, () => void, 'primary' | 'ghost' | 'gold'][] = [
      ['Resume', () => { this.scene.stop(); this.scene.resume('world'); }, 'gold'],
      ['Inventory', () => this.open('inventory'), 'primary'],
      ['Map', () => this.open('map'), 'primary'],
      ['Settings', () => this.open('settings'), 'ghost'],
      ['Restart Level', () => this.restart(), 'ghost'],
      ['Main Menu', () => this.toMenu(), 'ghost']
    ];
    items.forEach(([label, cb, variant], i) => {
      makeButton(this, 480, 196 + i * 46, 300, 40, label, cb, { variant, size: 18 });
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('world');
    });
  }

  private open(key: string): void {
    this.scene.launch(key, { from: 'pause' });
    this.scene.pause();
  }

  private restart(): void {
    const world = this.scene.get('world') as Phaser.Scene & { levelId?: string };
    const id = world?.levelId ?? 'w1-1';
    this.scene.stop('hud');
    this.scene.stop();
    this.scene.stop('world');
    this.scene.start('world', { level: id });
  }

  private toMenu(): void {
    this.scene.stop('hud');
    this.scene.stop();
    this.scene.stop('world');
    this.scene.start('menu');
  }
}

/* ------------------------------ settings ------------------------------ */

export class SettingsScene extends Phaser.Scene {
  private from: From = 'menu';
  private muteLabel!: Phaser.GameObjects.Text;
  private touchLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('settings');
  }

  init(data: { from?: From }): void {
    this.from = data.from ?? 'menu';
  }

  create(): void {
    dim(this, 0.7);
    panel(this, 220, 70, 520, 400);
    heading(this, 480, 112, 'Settings', 34);

    this.add.text(280, 164, 'Music', { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '20px', color: '#FFE9B8' });
    makeSlider(this, 520, 176, 220, save.data.settings.music, (v) => {
      save.data.settings.music = v;
      audio.setMusicVolume(v);
      save.persist();
    });

    this.add.text(280, 220, 'Sound FX', { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '20px', color: '#FFE9B8' });
    makeSlider(this, 520, 232, 220, save.data.settings.sfx, (v) => {
      save.data.settings.sfx = v;
      audio.setSfxVolume(v);
      save.persist();
    });

    this.muteLabel = this.add.text(280, 276, save.data.settings.muted ? 'Audio: Muted' : 'Audio: On', {
      fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '20px', color: '#FFE9B8'
    });
    makeButton(this, 620, 288, 120, 34, save.data.settings.muted ? 'Unmute' : 'Mute', () => {
      const m = !save.data.settings.muted;
      save.data.settings.muted = m;
      audio.setMuted(m);
      this.muteLabel.setText(m ? 'Audio: Muted' : 'Audio: On');
      save.persist();
    }, { variant: 'ghost', size: 15 });

    this.touchLabel = this.add.text(280, 332, 'Touch controls: ' + save.data.settings.touch, {
      fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '18px', color: '#FFE9B8'
    });
    makeButton(this, 620, 344, 120, 34, 'Cycle', () => {
      const order: ('auto' | 'on' | 'off')[] = ['auto', 'on', 'off'];
      const i = order.indexOf(save.data.settings.touch);
      save.data.settings.touch = order[(i + 1) % 3];
      this.touchLabel.setText('Touch controls: ' + save.data.settings.touch);
      save.persist();
    }, { variant: 'ghost', size: 15 });

    this.add.text(480, 388, 'A / D or arrows move   ·   Space jumps   ·   Shift dashes   ·   J throws   ·   E interacts', {
      fontFamily: FONT_BODY, fontSize: '12px', color: '#FFE9B8', align: 'center', wordWrap: { width: 520 }
    }).setOrigin(0.5).setAlpha(0.72);

    makeButton(this, 480, 434, 180, 40, 'Back', () => closeOverlay(this, this.from), { variant: 'gold', size: 18 });
  }
}

/* ------------------------------ inventory ----------------------------- */

export class InventoryScene extends Phaser.Scene {
  private from: From = 'world';

  constructor() {
    super('inventory');
  }

  init(data: { from?: From }): void {
    this.from = data.from ?? 'world';
  }

  create(): void {
    dim(this, 0.74);
    panel(this, 90, 46, 780, 448);
    heading(this, 480, 84, 'Satchel', 34);

    const stats: [string, string][] = [
      ['Seeds', `${save.data.seeds}`],
      ['Coins', `${save.data.coins}`],
      ['Treasures', `${save.data.treasures}`],
      ['Berries eaten', `${save.data.berriesEaten}`],
      ['Play time', `${Math.floor(save.data.playSeconds / 60)} min`]
    ];
    stats.forEach(([k, v], i) => {
      const y = 126 + i * 26;
      this.add.text(130, y, k, { fontFamily: FONT_BODY, fontSize: '16px', color: '#FFE9B8' }).setAlpha(0.85);
      this.add.text(300, y, v, { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '17px', color: '#FFCB4D' }).setOrigin(1, 0);
    });

    this.add.text(130, 274, 'Abilities', { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '20px', color: '#FFF3D6' });
    const ab: [keyof typeof save.data.abilities, string, string][] = [
      ['doubleJump', 'Double Jump', 'Space again in mid-air'],
      ['dash', 'Dash', 'Shift, a burst of speed'],
      ['roll', 'Roll', 'Hold Down while moving'],
      ['sniff', 'Sniff', 'Reveals hidden seeds']
    ];
    ab.forEach(([key, name, desc], i) => {
      const y = 304 + i * 26;
      const has = save.has(key);
      this.add.text(140, y, has ? '\u2713' : '\u2715', {
        fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '16px', color: has ? '#7FD47F' : '#8A7A9A'
      });
      this.add.text(168, y, name, { fontFamily: FONT_BODY, fontSize: '15px', color: has ? '#FFF3D6' : '#9A8AAA' });
      this.add.text(360, y, desc, { fontFamily: FONT_BODY, fontSize: '14px', color: '#C9B8D8' }).setAlpha(has ? 0.9 : 0.45);
    });

    this.add.text(560, 126, `Achievements  ${ACHIEVEMENTS.filter((a) => save.data.achievements[a.id]).length}/${ACHIEVEMENTS.length}`, {
      fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '20px', color: '#FFF3D6'
    });
    let ay = 156;
    for (const a of ACHIEVEMENTS) {
      const got = !!save.data.achievements[a.id];
      this.add.text(560, ay, `${got ? '\u2605' : '\u2606'} ${a.name}`, {
        fontFamily: FONT_BODY, fontSize: '13px', color: got ? '#FFCB4D' : '#8A7A9A'
      });
      ay += 17;
    }

    makeButton(this, 480, 466, 160, 36, 'Close', () => closeOverlay(this, this.from), { variant: 'gold', size: 17 });
  }
}

/* --------------------------------- map -------------------------------- */

export class MapScene extends Phaser.Scene {
  private from: From = 'world';

  constructor() {
    super('map');
  }

  init(data: { from?: From }): void {
    this.from = data.from ?? 'world';
  }

  create(): void {
    dim(this, 0.8);
    panel(this, 60, 40, 840, 460);
    heading(this, 480, 76, 'World Map', 34);

    const worlds = [1, 2, 3, 4];
    worlds.forEach((w, i) => {
      const x = 140 + i * 200;
      const y = 210;
      const unlocked = w <= save.data.unlockedWorld;
      const theme = Object.values(THEMES)[i];

      const card = this.add.graphics();
      card.fillStyle(unlocked ? 0x3b285c : 0x241a34, 1);
      card.fillRoundedRect(x - 84, y - 96, 168, 192, 16);
      card.lineStyle(3, unlocked ? 0xffcb4d : 0x4a3d52, unlocked ? 0.6 : 0.4);
      card.strokeRoundedRect(x - 84, y - 96, 168, 192, 16);

      const thumb = this.add.graphics();
      thumb.fillStyle(Phaser.Display.Color.HexStringToColor(theme.groundTop).color, unlocked ? 1 : 0.3);
      thumb.fillRoundedRect(x - 72, y - 84, 144, 46, 10);

      this.add.text(x, y - 66, theme.name, {
        fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '15px', color: unlocked ? '#2A1B44' : '#7A6A8A',
        align: 'center', wordWrap: { width: 132 }
      }).setOrigin(0.5);

      const levels = LEVELS.filter((l) => l.world === w);
      levels.forEach((lv, li) => {
        const rec = save.data.levels[lv.id];
        const done = rec?.completed;
        const isBoss = !!lv.boss;
        const ly = y + 6 + li * 34;
        const node = this.add.circle(x - 44, ly, 11, done ? 0x7FD47F : (unlocked ? 0x6B5A82 : 0x3A2F42));
        node.setStrokeStyle(2, 0xffe9b8, 0.4);
        this.add.text(x - 24, ly, isBoss ? 'Boss Fight' : 'Main Level', {
          fontFamily: FONT_BODY, fontSize: '13px', color: unlocked ? '#FFF3D6' : '#8A7A9A'
        }).setOrigin(0, 0.5);
        if (done) {
          this.add.text(x + 68, ly, `${rec.seeds}`, {
            fontFamily: FONT_BODY, fontSize: '12px', color: '#FFCB4D'
          }).setOrigin(1, 0.5);
        }
      });

      if (!unlocked) {
        this.add.text(x, y + 62, 'Locked', {
          fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '14px', color: '#8A7A9A'
        }).setOrigin(0.5);
      }
    });

    const hint = this.add.text(480, 372, 'Clear a world to unlock the next. Secret rooms and treasures are tracked per level.', {
      fontFamily: FONT_BODY, fontSize: '14px', color: '#FFE9B8', align: 'center', wordWrap: { width: 640 }
    }).setOrigin(0.5).setAlpha(0.75);

    makeButton(this, 480, 466, 160, 36, 'Close', () => closeOverlay(this, this.from), { variant: 'gold', size: 17 });
  }
}

/* ------------------------------ game over ----------------------------- */

export class GameOverScene extends Phaser.Scene {
  private level = 'w1-1';

  constructor() {
    super('gameover');
  }

  init(data: { level?: string }): void {
    this.level = data.level ?? 'w1-1';
  }

  create(): void {
    dim(this, 0.82);
    panel(this, 280, 140, 400, 260);
    heading(this, 480, 190, 'Oh no.', 38);
    bodyText(this, 480, 236, 'The hamster used up all its energy. But hamsters are famously stubborn.', 15, 320)
      .setOrigin(0.5, 0);

    makeButton(this, 480, 320, 240, 44, 'Try Again', () => {
      this.scene.stop('hud');
      this.scene.stop();
      this.scene.stop('world');
      this.scene.start('world', { level: this.level });
    }, { variant: 'gold', size: 19 });

    makeButton(this, 480, 374, 240, 38, 'Main Menu', () => {
      this.scene.stop('hud');
      this.scene.stop();
      this.scene.stop('world');
      this.scene.start('menu');
    }, { variant: 'ghost', size: 17 });
  }
}

/* ----------------------------- level clear ---------------------------- */

const UNLOCKS: Record<string, { key: 'doubleJump' | 'dash' | 'roll' | 'sniff'; text: string }> = {
  'w1-1': { key: 'doubleJump', text: 'Double Jump unlocked! Press Space again in mid-air.' },
  'w1-b': { key: 'roll', text: 'Roll unlocked! Hold Down while running to curl up.' },
  'w2-b': { key: 'dash', text: 'Dash unlocked! Press Shift to burst forward.' },
  'w3-b': { key: 'sniff', text: 'Sniff unlocked! Hidden seeds now shimmer nearby.' }
};

export class LevelClearScene extends Phaser.Scene {
  private levelId = 'w1-1';
  private stats = { seeds: 0, total: 0, treasures: 0, time: 0, outro: '' };

  constructor() {
    super('levelclear');
  }

  init(data: { level: string; seeds: number; total: number; treasures: number; time: number; outro: string }): void {
    this.levelId = data.level;
    this.stats = { seeds: data.seeds, total: data.total, treasures: data.treasures, time: data.time, outro: data.outro };
  }

  create(): void {
    dim(this, 0.78);
    panel(this, 230, 70, 500, 400);
    const lv = levelById(this.levelId);
    heading(this, 480, 110, lv?.boss ? 'Golden Seed Recovered!' : 'Level Complete!', 30);

    bodyText(this, 480, 148, this.stats.outro || lv?.intro || '', 14, 420).setOrigin(0.5, 0);

    const rows: [string, string][] = [
      ['Seeds', `${this.stats.seeds} / ${this.stats.total}`],
      ['Treasures', `${this.stats.treasures}`],
      ['Time', `${Math.floor(this.stats.time / 60)}:${String(Math.floor(this.stats.time % 60)).padStart(2, '0')}`]
    ];
    rows.forEach(([k, v], i) => {
      const y = 216 + i * 24;
      this.add.text(320, y, k, { fontFamily: FONT_BODY, fontSize: '16px', color: '#FFE9B8' }).setAlpha(0.85);
      this.add.text(640, y, v, { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '17px', color: '#FFCB4D' }).setOrigin(1, 0);
    });

    const unlock = UNLOCKS[this.levelId];
    if (unlock) {
      if (!save.has(unlock.key)) save.unlock(unlock.key);
      const box = this.add.graphics();
      box.fillStyle(0xffcb4d, 0.14);
      box.fillRoundedRect(300, 292, 360, 52, 12);
      box.lineStyle(2, 0xffcb4d, 0.5);
      box.strokeRoundedRect(300, 292, 360, 52, 12);
      this.add.text(480, 318, unlock.text, {
        fontFamily: FONT_BODY, fontSize: '13px', color: '#FFE9B8', align: 'center', wordWrap: { width: 330 }
      }).setOrigin(0.5);
    }

    const idx = LEVEL_ORDER.indexOf(this.levelId);
    const nextId = LEVEL_ORDER[idx + 1];
    const next = nextId ? levelById(nextId) : undefined;

    if (next) {
      makeButton(this, 480, 384, 260, 44, `Next: ${next.name}`, () => {
        this.scene.stop('hud');
        this.scene.stop();
        this.scene.stop('world');
        this.scene.start('world', { level: next.id });
      }, { variant: 'gold', size: 16 });
    } else {
      makeButton(this, 480, 384, 260, 44, 'You saved the meadow', () => {
        this.scene.stop('hud');
        this.scene.stop();
        this.scene.stop('world');
        this.scene.start('credits', { from: 'menu' });
      }, { variant: 'gold', size: 16 });
    }

    makeButton(this, 480, 434, 150, 34, 'World Map', () => {
      this.scene.launch('map', { from: 'menu' });
      this.scene.stop();
    }, { variant: 'ghost', size: 15 });
  }
}

/* ------------------------------- credits ------------------------------ */

export class CreditsScene extends Phaser.Scene {
  private from: From = 'menu';

  constructor() {
    super('credits');
  }

  init(data: { from?: From }): void {
    this.from = data.from ?? 'menu';
  }

  create(): void {
    dim(this, 0.85);
    panel(this, 200, 60, 560, 420);
    heading(this, 480, 100, 'Credits', 34);

    const lines: [string, string][] = [
      ['Design & Code', 'Built with Phaser 4 + TypeScript'],
      ['Art', 'Every sprite, tile and background is drawn procedurally at runtime'],
      ['Music & Sound', 'Synthesised live with WebAudio'],
      ['Hamster', 'One (1) very small adventurer'],
      ['Special Thanks', 'You, for finding the secret rooms']
    ];
    let y = 152;
    for (const [k, v] of lines) {
      this.add.text(480, y, k, { fontFamily: FONT_HEAD, fontStyle: 'bold', fontSize: '17px', color: '#FFCB4D' }).setOrigin(0.5);
      this.add.text(480, y + 20, v, {
        fontFamily: FONT_BODY, fontSize: '13px', color: '#FFE9B8', align: 'center', wordWrap: { width: 420 }
      }).setOrigin(0.5).setAlpha(0.85);
      y += 56;
    }

    this.add.text(480, 424, 'No external assets. Nothing can 404.', {
      fontFamily: FONT_BODY, fontSize: '12px', color: '#9A8AAA'
    }).setOrigin(0.5);

    makeButton(this, 480, 456, 150, 34, 'Back', () => closeOverlay(this, this.from), { variant: 'gold', size: 15 });
  }
}
