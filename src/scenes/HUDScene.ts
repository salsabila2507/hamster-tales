/** In-game HUD: hearts, seeds, abilities, boss bar, toasts, dialogue, touch controls. */
import Phaser from 'phaser';
import { save } from '../core/save';
import { audio } from '../core/audio';
import { TOUCH, touchDown, touchUp } from '../core/input';
import { WorldScene } from './WorldScene';

const W = 960;
const H = 540;

export class HUDScene extends Phaser.Scene {
  private world!: WorldScene;
  private hearts: Phaser.GameObjects.Image[] = [];
  private seedText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private cheekPips: Phaser.GameObjects.Rectangle[] = [];
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossName!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private bannerTitle!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private touchLayer!: Phaser.GameObjects.Container;
  private abilityIcons: Phaser.GameObjects.Container[] = [];
  private worldLabel!: Phaser.GameObjects.Text;
  private hideTimer = 0;

  constructor() {
    super('hud');
  }

  init(data: { world: WorldScene }): void {
    this.world = data.world;
  }

  create(): void {
    this.hearts = [];
    this.cheekPips = [];
    this.abilityIcons = [];

    // top-left panel
    const panel = this.add.graphics();
    panel.fillStyle(0x241636, 0.82);
    panel.fillRoundedRect(14, 12, 268, 92, 14);
    panel.lineStyle(2, 0xffe9b8, 0.34);
    panel.strokeRoundedRect(14, 12, 268, 92, 14);
    panel.setScrollFactor(0);

    for (let i = 0; i < 5; i++) {
      const h = this.add.image(40 + i * 30, 40, 'p-heart').setScrollFactor(0).setDepth(5);
      h.setVisible(false);
      this.hearts.push(h);
    }

    this.seedText = this.add.text(30, 60, '0', {
      fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#FFF3D6'
    }).setScrollFactor(0).setDepth(5);

    const seedIcon = this.add.image(20, 70, 'p-seed', 0).setScrollFactor(0).setScale(0.85).setDepth(5);
    seedIcon.setAlpha(0.9);

    this.coinText = this.add.text(120, 60, '0', {
      fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#FFCB4D'
    }).setScrollFactor(0).setDepth(5);
    this.add.image(110, 70, 'p-coin', 0).setScrollFactor(0).setScale(0.8).setDepth(5);

    for (let i = 0; i < 12; i++) {
      const p = this.add.rectangle(30 + (i % 6) * 9, 88 + Math.floor(i / 6) * 8, 6, 5, 0xefe3c8, 0.9)
        .setScrollFactor(0).setDepth(5);
      p.setVisible(false);
      this.cheekPips.push(p);
    }

    this.worldLabel = this.add.text(W - 18, 20, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '17px', color: '#FFF3D6'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5).setAlpha(0.85);

    // boss bar
    this.bossBarBg = this.add.rectangle(W / 2, H - 54, 420, 16, 0x2a1b44, 0.75)
      .setScrollFactor(0).setDepth(6).setVisible(false);
    this.bossBarBg.setStrokeStyle(2, 0xffe9b8, 0.35);
    this.bossBarFill = this.add.rectangle(W / 2 - 208, H - 54, 416, 10, 0xf2637b, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(7).setVisible(false);
    this.bossName = this.add.text(W / 2, H - 76, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#FFCB4D'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(7).setVisible(false);

    // toast
    this.toastText = this.add.text(W / 2, 118, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#2A1B44',
      backgroundColor: '#FFCB4D', padding: { x: 18, y: 9 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9).setAlpha(0);

    // banner
    this.bannerTitle = this.add.text(W / 2, H / 2 - 40, '', {
      fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fontSize: '46px', color: '#FFF3D6',
      stroke: '#2a1b44', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setAlpha(0);
    this.bannerSub = this.add.text(W / 2, H / 2 + 14, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#FFE9B8',
      stroke: '#2a1b44', strokeThickness: 5, align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setAlpha(0);

    this.buildDialogue();
    this.buildAbilities();
    this.buildTouch();
    this.refresh();
    this.hookEvents();
    this.syncBossBar();
  }

  /** The world may already have a boss when the HUD starts, so read it directly. */
  private syncBossBar(): void {
    const boss = this.world?.boss;
    if (!boss) {
      this.bossBarBg.setVisible(false);
      this.bossBarFill.setVisible(false);
      this.bossName.setVisible(false);
      return;
    }
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossName.setVisible(true);
    this.bossName.setText(boss.bossName);
    this.bossBarFill.width = 416 * (boss.hp / boss.maxHp);
  }

  private buildDialogue(): void {
    const bg = this.add.rectangle(0, 0, 720, 116, 0x2a1b44, 0.94).setStrokeStyle(3, 0xffcb4d, 0.7);
    const t = this.add.text(-336, -40, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#FFF3D6',
      wordWrap: { width: 672 }, lineSpacing: 5
    });
    const hint = this.add.text(336, 40, 'E / Space', {
      fontFamily: 'Nunito, sans-serif', fontSize: '13px', color: '#FFCB4D'
    }).setOrigin(1, 0.5);
    this.dialogueText = t;
    this.dialogueBox = this.add.container(W / 2, H - 110, [bg, t, hint])
      .setScrollFactor(0).setDepth(12).setVisible(false);
  }

  private buildAbilities(): void {
    const defs: { key: keyof typeof save.data.abilities; label: string; tex: string }[] = [
      { key: 'doubleJump', label: '2x JUMP', tex: 'p-spark' },
      { key: 'dash', label: 'DASH', tex: 'fx-slash' },
      { key: 'roll', label: 'ROLL', tex: 'p-ring' }
    ];
    defs.forEach((d, i) => {
      const bg = this.add.rectangle(0, 0, 78, 26, 0x2a1b44, 0.6).setStrokeStyle(2, 0xffe9b8, 0.2);
      const icon = this.add.image(-26, 0, d.tex).setScale(d.tex === 'p-ring' ? 0.4 : 0.6);
      const label = this.add.text(-14, 0, d.label, {
        fontFamily: 'Nunito, sans-serif', fontSize: '12px', color: '#FFE9B8'
      }).setOrigin(0, 0.5);
      const c = this.add.container(60 + i * 84, 118, [bg, icon, label])
        .setScrollFactor(0).setDepth(6).setVisible(false);
      c.setData('ab', d.key);
      this.abilityIcons.push(c);
    });
  }

  private buildTouch(): void {
    const show = this.sys.game.device.input.touch &&
      save.data.settings.touch !== 'off';
    this.touchLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(11);
    if (!show) {
      this.touchLayer.setVisible(false);
      return;
    }
    const mk = (x: number, y: number, r: number, label: string, action: 'left' | 'right' | 'jump' | 'dash' | 'throw' | 'down' | 'interact') => {
      const c = this.add.circle(x, y, r, 0xfff3d6, 0.16).setStrokeStyle(3, 0xfff3d6, 0.4);
      const t = this.add.text(x, y, label, {
        fontFamily: 'Nunito, sans-serif', fontSize: `${Math.round(r * 0.8)}px`, color: '#FFF3D6'
      }).setOrigin(0.5).setAlpha(0.85);
      c.setInteractive({ useHandCursor: false });
      c.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event?.preventDefault?.();
        touchDown(action);
        c.setFillStyle(0xfff3d6, 0.34);
      });
      const up = () => {
        touchUp(action);
        c.setFillStyle(0xfff3d6, 0.16);
      };
      c.on('pointerup', up);
      c.on('pointerout', up);
      c.on('pointerupoutside', up);
      this.touchLayer.add([c, t]);
    };
    mk(72, H - 76, 34, '\u25C0', 'left');
    mk(168, H - 76, 34, '\u25B6', 'right');
    mk(W - 78, H - 84, 40, '\u25B2', 'jump');
    mk(W - 168, H - 58, 28, 'D', 'dash');
    mk(W - 78, H - 172, 28, 'J', 'throw');
    mk(W - 262, H - 60, 26, '\u25BC', 'down');
  }

  private hookEvents(): void {
    const g = this.game.events;
    const onSeeds = () => this.refresh();
    const onHealth = () => this.refresh();
    const onCoins = () => this.refresh();
    const onCheeks = () => this.refresh();
    const onTreasures = () => this.refresh();
    const onBossHealth = (v: number) => {
      this.bossBarBg.setVisible(v > 0);
      this.bossBarFill.setVisible(v > 0);
      this.bossName.setVisible(v > 0);
      if (v > 0) this.bossBarFill.width = 416 * v;
    };
    const onBossName = (n: string) => this.bossName.setText(n);
    const onToast = (msg: string) => this.toast(msg);
    const onBanner = (title: string, sub: string) => this.banner(title, sub);
    const onAchievement = (id: string) => {
      const a = ['first-seed', 'seed-hoarder', 'treasure-1', 'treasure-4', 'double-jump', 'dash', 'sniff',
        'w1-clear', 'w2-clear', 'w3-clear', 'w4-clear', 'no-hit-boss', 'all-secrets', 'friend', 'rich', 'sleepy'];
      if (a.includes(id)) this.toast('Achievement unlocked!');
    };
    const onDialogue = (line: string | null) => {
      if (!line) {
        this.dialogueBox.setVisible(false);
        return;
      }
      this.dialogueBox.setVisible(true);
      this.dialogueText.setText(line);
    };

    const openOverlay = (key: string, data: Record<string, unknown>): void => {
      if (!this.scene.isActive('world')) return;
      this.scene.pause('world');
      this.scene.launch(key, data);
    };
    const onPause = () => openOverlay('pause', {});
    const onInventory = () => openOverlay('inventory', { from: 'world' });
    const onMap = () => openOverlay('map', { from: 'world' });

    g.on('seeds-changed', onSeeds);
    g.on('health-changed', onHealth);
    g.on('coins-changed', onCoins);
    g.on('cheeks-changed', onCheeks);
    g.on('treasures-changed', onTreasures);
    g.on('boss-health', onBossHealth);
    g.on('boss-name', onBossName);
    g.on('toast', onToast);
    g.on('banner', onBanner);
    g.on('achievement', onAchievement);
    g.on('dialogue', onDialogue);
    g.on('pause-request', onPause);
    g.on('inventory-request', onInventory);
    g.on('map-request', onMap);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      g.off('seeds-changed', onSeeds);
      g.off('health-changed', onHealth);
      g.off('coins-changed', onCoins);
      g.off('cheeks-changed', onCheeks);
      g.off('treasures-changed', onTreasures);
      g.off('boss-health', onBossHealth);
      g.off('boss-name', onBossName);
      g.off('toast', onToast);
      g.off('banner', onBanner);
      g.off('achievement', onAchievement);
      g.off('dialogue', onDialogue);
      g.off('pause-request', onPause);
      g.off('inventory-request', onInventory);
      g.off('map-request', onMap);
    });
  }

  refresh(): void {
    const p = this.world?.player;
    if (!p) return;
    for (let i = 0; i < this.hearts.length; i++) {
      const h = this.hearts[i];
      h.setVisible(i < p.maxHealth);
      h.setTexture(i < p.health ? 'p-heart' : 'p-heart-empty');
    }
    this.seedText.setText(`${save.data.seeds}`);
    this.coinText.setText(`${save.data.coins}`);
    for (let i = 0; i < this.cheekPips.length; i++) {
      this.cheekPips[i].setVisible(i < p.cheeks);
    }
    for (const c of this.abilityIcons) {
      const key = c.getData('ab') as keyof typeof save.data.abilities;
      const has = save.has(key);
      c.setVisible(has);
      c.setAlpha(1);
    }
    if (this.world?.level) {
      this.worldLabel.setText(this.world.level.name);
    }
  }

  toast(msg: string): void {
    this.toastText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setY(132);
    this.tweens.add({
      targets: this.toastText, y: 120, alpha: 0, delay: 1700, duration: 500
    });
  }

  banner(title: string, sub: string): void {
    this.bannerTitle.setText(title).setAlpha(0).setScale(0.9);
    this.bannerSub.setText(sub).setAlpha(0);
    this.tweens.add({ targets: this.bannerTitle, alpha: 1, scale: 1, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: this.bannerSub, alpha: 1, duration: 420, delay: 140 });
    this.tweens.add({ targets: [this.bannerTitle, this.bannerSub], alpha: 0, delay: 2600, duration: 600 });
  }
}
