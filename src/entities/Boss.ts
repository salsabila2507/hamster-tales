/** Bosses: telegraphed attacks, phase escalation, clear counter-play. */
import Phaser from 'phaser';
import { Hamster } from './Hamster';
import { audio } from '../core/audio';

export type BossKind = 'squirrel' | 'toad' | 'bird' | 'pumpkin';
type BossState = 'intro' | 'idle' | 'telegraph' | 'attack' | 'recover' | 'dead';

interface BossSpec {
  tex: string;
  bodyW: number;
  bodyH: number;
  offX: number;
  offY: number;
  hp: number;
  gravity: boolean;
  name: string;
}

const SPECS: Record<BossKind, BossSpec> = {
  squirrel: { tex: 'b-squirrel', bodyW: 74, bodyH: 94, offX: 35, offY: 36, hp: 8, gravity: true, name: 'Sir Nibbles' },
  toad: { tex: 'b-toad', bodyW: 82, bodyH: 64, offX: 31, offY: 56, hp: 8, gravity: true, name: 'Crystalback' },
  bird: { tex: 'b-bird', bodyW: 60, bodyH: 66, offX: 42, offY: 34, hp: 9, gravity: false, name: 'Stormwing' },
  pumpkin: { tex: 'b-pumpkin', bodyW: 74, bodyH: 84, offX: 35, offY: 40, hp: 10, gravity: true, name: 'The Pumpkin King' }
};

export class Boss extends Phaser.Physics.Arcade.Sprite {
  kind: BossKind;
  hp: number;
  maxHp: number;
  bossName: string;
  state: BossState = 'intro';
  invuln = 0;
  timer = 0;
  stateTime = 0;
  facing: 1 | -1 = -1;
  player?: Hamster;
  spawnProjectile?: (kind: string, x: number, y: number, vx: number, vy: number) => void;
  onSummon?: (x: number, y: number) => void;
  onDefeated?: () => void;
  onDamaged?: (hp: number) => void;
  onShockwave?: (x: number, y: number) => void;
  private nextAttack = 0;
  private pattern: number[] = [];
  private patternIdx = 0;

  constructor(scene: Phaser.Scene, kind: BossKind, x: number, y: number) {
    const s = SPECS[kind];
    super(scene, x, y, s.tex, 0);
    this.kind = kind;
    this.hp = s.hp;
    this.maxHp = s.hp;
    this.bossName = s.name;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(s.bodyW, s.bodyH);
    body.setOffset(s.offX, s.offY);
    body.setAllowGravity(s.gravity);
    if (s.gravity) body.setGravityY(1800);
    body.setImmovable(true);
    this.setPushable(false);
    body.setCollideWorldBounds(false);
    this.setScale(0.2);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, scale: 1, alpha: 1, duration: 520, ease: 'Back.out' });
    this.pattern = this.buildPattern(kind);
  }

  private buildPattern(kind: BossKind): number[] {
    if (kind === 'squirrel') return [0, 1, 0, 2, 1];
    if (kind === 'toad') return [1, 0, 1, 2, 0];
    if (kind === 'bird') return [0, 1, 0, 2, 1];
    return [1, 0, 2, 1, 0];
  }

  get phase(): number {
    const t = this.hp / this.maxHp;
    if (t > 0.66) return 1;
    if (t > 0.33) return 2;
    return 3;
  }

  private get b(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private speedMul(): number {
    return 1 + (this.phase - 1) * 0.28;
  }

  update(dt: number): void {
    if (this.state === 'dead') return;
    this.invuln = Math.max(0, this.invuln - dt);
    this.timer += dt;
    this.stateTime += dt;

    if (this.player) {
      this.facing = this.player.x < this.x ? -1 : 1;
      this.setFlipX(this.facing < 0);
    }

    switch (this.state) {
      case 'intro':
        if (this.stateTime > 1.2) this.changeState('idle');
        break;
      case 'idle':
        this.b.setVelocityX(0);
        if (this.stateTime > Math.max(0.7, 1.25 - this.phase * 0.18)) {
          this.nextAttack = this.pattern[this.patternIdx % this.pattern.length];
          this.patternIdx++;
          this.changeState('telegraph');
          this.setTint(0xffd0d0);
        }
        break;
      case 'telegraph':
        if (this.stateTime > Math.max(0.28, 0.5 - this.phase * 0.06)) {
          this.clearTint();
          this.executeAttack(this.nextAttack);
          this.changeState('attack');
        }
        break;
      case 'attack':
        this.tickAttack(dt);
        break;
      case 'recover':
        if (this.stateTime > Math.max(0.5, 0.85 - this.phase * 0.1)) this.changeState('idle');
        break;
      default:
        break;
    }
  }

  private changeState(s: BossState): void {
    this.state = s;
    this.stateTime = 0;
  }

  private executeAttack(id: number): void {
    const p = this.player;
    if (!p) return;
    const sp = this.speedMul();
    const dir = p.x < this.x ? -1 : 1;

    if (this.kind === 'squirrel') {
      if (id === 0) {
        // leap
        this.b.setVelocity(dir * 210 * sp, -640);
        this.scene.time.delayedCall(560, () => {
          if (this.state === 'dead') return;
          this.onShockwave?.(this.x, this.b.bottom);
          audio.sfx('stomp');
        });
      } else if (id === 1) {
        // acorn fan
        for (let i = 0; i < 3; i++) {
          const vx = dir * (200 + i * 60) * sp;
          const vy = -260 + i * 70;
          this.scene.time.delayedCall(i * 130, () =>
            this.spawnProjectile?.('acorn', this.x + dir * 30, this.y - 10, vx, vy));
        }
      } else {
        // charge
        this.b.setVelocity(dir * 330 * sp, 0);
        this.scene.time.delayedCall(760, () => this.b.setVelocityX(0));
      }
      return;
    }

    if (this.kind === 'toad') {
      if (id === 0) {
        // hop
        this.b.setVelocity(dir * 170 * sp, -600);
        this.scene.time.delayedCall(520, () => {
          if (this.state === 'dead') return;
          for (let i = 0; i < 4; i++) {
            const a = -Math.PI / 2 + (i - 1.5) * 0.5;
            this.spawnProjectile?.('crystal', this.x, this.y - 10, Math.cos(a) * 260 * sp, Math.sin(a) * 260);
          }
        });
      } else if (id === 1) {
        // crystal spit
        for (let i = 0; i < 3; i++) {
          const ang = Math.atan2(p.y - this.y, p.x - this.x) + (i - 1) * 0.22;
          this.scene.time.delayedCall(i * 150, () =>
            this.spawnProjectile?.('crystal', this.x, this.y - 6, Math.cos(ang) * 300 * sp, Math.sin(ang) * 300 * sp));
        }
      } else {
        // slam
        this.b.setVelocity(0, -520);
        this.scene.time.delayedCall(340, () => {
          if (this.state === 'dead') return;
          this.b.setVelocity(0, 900);
        });
        this.scene.time.delayedCall(700, () => {
          if (this.state === 'dead') return;
          this.onShockwave?.(this.x, this.b.bottom);
        });
      }
      return;
    }

    if (this.kind === 'bird') {
      if (id === 0) {
        // dive
        const ang = Math.atan2(p.y - this.y, p.x - this.x);
        this.b.setVelocity(Math.cos(ang) * 460 * sp, Math.sin(ang) * 460 * sp);
        this.scene.time.delayedCall(620, () => {
          if (this.state === 'dead') return;
          this.b.setVelocity(0, 0);
          this.scene.tweens.add({ targets: this, y: this.y - 130, duration: 520, ease: 'Sine.out' });
        });
      } else if (id === 1) {
        // feathers
        for (let i = 0; i < 5; i++) {
          this.scene.time.delayedCall(i * 120, () => {
            if (this.state === 'dead') return;
            this.spawnProjectile?.('feather', p.x + (i - 2) * 46, p.y - 170, 0, 120);
          });
        }
      } else {
        // gust
        const ang = p.x < this.x ? Math.PI : 0;
        p.setVelocityX(Math.cos(ang) * 340);
        p.setVelocityY(-190);
        audio.sfx('dash');
        this.scene.cameras.main.shake(220, 0.004);
      }
      return;
    }

    // pumpkin
    if (id === 0) {
      // flames fan
      for (let i = 0; i < 5; i++) {
        const ang = Math.atan2(p.y - this.y, p.x - this.x) + (i - 2) * 0.19;
        this.scene.time.delayedCall(i * 110, () =>
          this.spawnProjectile?.('flame', this.x, this.y - 8, Math.cos(ang) * 260 * sp, Math.sin(ang) * 260 * sp));
      }
    } else if (id === 1) {
      // teleport next to the player
      this.setAlpha(0.15);
      this.b.setEnable(false);
      this.scene.time.delayedCall(280, () => {
        if (this.state === 'dead') return;
        const nx = Phaser.Math.Clamp(p.x + (p.x < this.x ? 120 : -120), this.x - 260, this.x + 260);
        this.setPosition(nx, this.y - 10);
        this.b.setEnable(true);
        this.setAlpha(1);
        this.scene.cameras.main.flash(120, 111, 232, 216);
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i - 1) * 0.5;
          this.spawnProjectile?.('flame', this.x, this.y, Math.cos(a) * 220, Math.sin(a) * 220);
        }
      });
    } else {
      // summon
      for (let i = 0; i < 2; i++) {
        this.onSummon?.(this.x + (i === 0 ? -70 : 70), this.y - 40);
      }
      audio.sfx('unlock');
    }
  }

  private tickAttack(dt: number): void {
    const done =
      (this.kind === 'squirrel' && this.stateTime > 0.9) ||
      (this.kind === 'toad' && this.stateTime > 0.95) ||
      (this.kind === 'bird' && this.stateTime > 0.85) ||
      (this.kind === 'pumpkin' && this.stateTime > 0.9);
    if (done) {
      this.b.setVelocityX(0);
      this.changeState('recover');
    }
  }

  hit(): boolean {
    if (this.state === 'dead' || this.invuln > 0) return false;
    this.hp--;
    this.invuln = 0.5;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (this.state !== 'dead') this.clearTint();
    });
    audio.sfx('bossHit');
    this.scene.cameras.main.shake(140, 0.005);
    this.onDamaged?.(this.hp);
    if (this.hp <= 0) this.die();
    return true;
  }

  die(): void {
    this.state = 'dead';
    this.b.setEnable(false);
    this.clearTint();
    audio.sfx('victory');
    const sc = this.scene;
    sc.cameras.main.shake(420, 0.012);
    for (let i = 0; i < 5; i++) {
      sc.time.delayedCall(i * 130, () => {
        const p = sc.add.particles(
          this.x + Phaser.Math.Between(-50, 50),
          this.y + Phaser.Math.Between(-50, 30),
          'p-spark',
          { speed: { min: 60, max: 220 }, lifespan: 700, quantity: 10, scale: { start: 0.9, end: 0 }, blendMode: 'ADD' }
        );
        sc.time.delayedCall(760, () => p.destroy());
      });
    }
    sc.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 1.3,
      angle: 12,
      duration: 900,
      ease: 'Sine.in',
      onComplete: () => {
        this.onDefeated?.();
        this.destroy();
      }
    });
  }
}
