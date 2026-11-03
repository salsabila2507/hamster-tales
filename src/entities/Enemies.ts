/** Regular enemies. Each has one readable behaviour and a clear counter. */
import Phaser from 'phaser';
import { Hamster } from './Hamster';
import { audio } from '../core/audio';

export type EnemyKind = 'slime' | 'squirrel' | 'beetle' | 'bat' | 'bird' | 'wisp';
export type HitMode = 'stomp' | 'seed' | 'roll' | 'dash';

interface Spec {
  tex: string;
  bodyW: number;
  bodyH: number;
  offX: number;
  offY: number;
  gravity: boolean;
  anim?: string;
  rate?: number;
}

const SPECS: Record<EnemyKind, Spec> = {
  slime: { tex: 'e-slime', bodyW: 22, bodyH: 18, offX: 5, offY: 13, gravity: true, anim: 'slime-hop', rate: 4 },
  squirrel: { tex: 'e-squirrel', bodyW: 22, bodyH: 26, offX: 9, offY: 8, gravity: true, anim: 'squirrel-idle', rate: 3 },
  beetle: { tex: 'e-beetle', bodyW: 26, bodyH: 16, offX: 4, offY: 13, gravity: true, anim: 'beetle-walk', rate: 10 },
  bat: { tex: 'e-bat', bodyW: 24, bodyH: 16, offX: 6, offY: 8, gravity: false, anim: 'bat-fly', rate: 8 },
  bird: { tex: 'e-bird', bodyW: 22, bodyH: 18, offX: 7, offY: 10, gravity: false, anim: 'bird-fly', rate: 7 },
  wisp: { tex: 'e-wisp', bodyW: 18, bodyH: 18, offX: 5, offY: 7, gravity: false, anim: 'wisp-float', rate: 6 }
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  hp = 1;
  alive = true;
  stunned = 0;
  homeX: number;
  homeY: number;
  dir = -1;
  timer = Math.random() * 1.2;
  chargeTimer = 0;
  cooldown = 0;
  stolen = 0;
  player?: Hamster;
  spawnProjectile?: (kind: string, x: number, y: number, vx: number, vy: number) => void;
  onKill?: (e: Enemy) => void;
  onSteal?: (e: Enemy) => void;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const s = SPECS[kind];
    super(scene, x, y, s.tex, 0);
    this.kind = kind;
    this.homeX = x;
    this.homeY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(15);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(s.bodyW, s.bodyH);
    body.setOffset(s.offX, s.offY);
    body.setAllowGravity(s.gravity);
    body.setCollideWorldBounds(false);
    if (s.gravity) body.setGravityY(1800);
    if (s.anim) this.play(s.anim);
    if (kind === 'bat' || kind === 'bird' || kind === 'wisp') body.setAllowGravity(false);
    this.setFlipX(this.dir > 0);
  }

  private get b(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private distToPlayer(): number {
    if (!this.player) return 9999;
    return Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
  }

  update(dt: number): void {
    if (!this.alive) return;
    const p = this.player;
    this.timer += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.stunned > 0) {
      this.stunned -= dt;
      this.b.setVelocityX(this.b.velocity.x * 0.9);
      if (this.kind !== 'bat' && this.kind !== 'bird' && this.kind !== 'wisp') {
        this.b.setVelocityY(this.b.velocity.y + 900 * dt);
      }
      this.setAngle(Math.sin(this.stunned * 26) * 10);
      if (this.stunned <= 0) {
        this.setAngle(0);
        this.clearTint();
        this.setScale(1);
      }
      return;
    }

    switch (this.kind) {
      case 'slime':
        this.updateSlime(dt, p);
        break;
      case 'squirrel':
        this.updateSquirrel(dt, p);
        break;
      case 'beetle':
        this.updateBeetle(dt, p);
        break;
      case 'bat':
        this.updateBat(dt, p);
        break;
      case 'bird':
        this.updateBird(dt, p);
        break;
      case 'wisp':
        this.updateWisp(dt, p);
        break;
      default:
        break;
    }
    this.setFlipX(this.dir > 0 ? this.kind === 'bird' : this.dir < 0);
  }

  private updateSlime(dt: number, p?: Hamster): void {
    const grounded = this.b.blocked.down;
    if (grounded && this.timer > 1.35) {
      this.timer = 0;
      if (p && this.distToPlayer() < 340) {
        this.dir = p.x < this.x ? -1 : 1;
        this.b.setVelocity(this.dir * 105, -330);
      } else {
        this.b.setVelocity(this.dir * 70, -250);
      }
    }
    if (grounded && Math.abs(this.b.velocity.x) < 6) this.b.setVelocityX(this.dir * 40);
  }

  private updateSquirrel(dt: number, p?: Hamster): void {
    this.b.setVelocityX(0);
    if (!p || !this.spawnProjectile) return;
    const d = this.distToPlayer();
    if (d < 380 && this.timer > 1.9) {
      this.timer = 0;
      this.dir = p.x < this.x ? -1 : 1;
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const vx = Phaser.Math.Clamp(dx * 1.5, -320, 320);
      const vy = Math.min(-160, dy * 1.2 - 220);
      this.spawnProjectile('acorn', this.x + this.dir * 12, this.y - 4, vx, vy);
      audio.sfx('throw');
      this.scene.tweens.add({ targets: this, angle: this.dir * 8, duration: 90, yoyo: true });
    }
  }

  private updateBeetle(dt: number, p?: Hamster): void {
    if (this.chargeTimer > 0) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) this.cooldown = 1.1;
      return;
    }
    if (this.cooldown > 0) {
      this.b.setVelocityX(0);
      return;
    }
    if (p && Math.abs(p.y - this.y) < 46 && Math.abs(p.x - this.x) < 230 && Math.abs(p.x - this.x) > 40) {
      this.dir = p.x < this.x ? -1 : 1;
      this.b.setVelocityX(this.dir * 300);
      this.chargeTimer = 0.85;
      this.setTint(0xffc2c2);
      this.scene.time.delayedCall(880, () => this.clearTint());
      return;
    }
    if (this.b.blocked.left) this.dir = 1;
    if (this.b.blocked.right) this.dir = -1;
    if (Math.abs(this.x - this.homeX) > 90) this.dir = this.x < this.homeX ? 1 : -1;
    this.b.setVelocityX(this.dir * 58);
  }

  private updateBat(dt: number, p?: Hamster): void {
    const target = { x: this.homeX, y: this.homeY + Math.sin(this.timer * 2.2) * 10 };
    if (p && this.distToPlayer() < 260) {
      target.x = p.x;
      target.y = p.y;
      const ang = Math.atan2(target.y - this.y, target.x - this.x);
      this.b.setVelocity(Math.cos(ang) * 145, Math.sin(ang) * 145);
    } else {
      const ang = Math.atan2(target.y - this.y, target.x - this.x);
      const d = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      const sp = Math.min(90, d * 2);
      this.b.setVelocity(Math.cos(ang) * sp, Math.sin(ang) * sp);
    }
    this.dir = this.b.velocity.x >= 0 ? 1 : -1;
  }

  private updateBird(dt: number, p?: Hamster): void {
    if (this.stolen > 0) {
      this.b.setVelocityY(-120);
      this.b.setVelocityX(this.dir * 140);
      this.timer += dt;
      if (this.timer > 4) this.vanish();
      return;
    }
    if (Math.abs(this.x - this.homeX) > 120) this.dir = this.x < this.homeX ? 1 : -1;
    this.b.setVelocityX(this.dir * 82);
    this.b.setVelocityY(Math.sin(this.timer * 2.6) * 26);
    if (p && this.distToPlayer() < 34 && this.onSteal) {
      this.onSteal(this);
      this.stolen = 1;
      this.setTint(0xfff3a8);
      this.scene.time.delayedCall(260, () => this.clearTint());
    }
  }

  private updateWisp(dt: number, p?: Hamster): void {
    const r = 44;
    const a = this.timer * 1.1;
    const tx = this.homeX + Math.cos(a) * r;
    const ty = this.homeY + Math.sin(a * 1.3) * r * 0.55;
    this.b.setVelocity((tx - this.x) * 3, (ty - this.y) * 3);
    if (p && this.distToPlayer() < 90) {
      const ang = Math.atan2(p.y - this.y, p.x - this.x);
      this.b.setVelocity(Math.cos(ang) * 100, Math.sin(ang) * 100);
    }
  }

  /** Returns true when the hit actually landed. */
  hit(mode: HitMode, fromX?: number): boolean {
    if (!this.alive) return false;
    if (mode === 'stomp' && this.kind === 'wisp') return false;

    if (mode === 'dash' || mode === 'stomp') {
      this.kill();
      return true;
    }
    // seed / roll -> stun
    this.stunned = mode === 'roll' ? 2.6 : 3.2;
    this.setTint(0x9fb4ff);
    const push = fromX === undefined ? 1 : this.x < fromX ? -1 : 1;
    this.b.setVelocity(push * 170, -140);
    audio.sfx('stomp');
    if (this.scene) {
      const stars = this.scene.add.particles(this.x, this.y - 18, 'p-spark', {
        speed: { min: 40, max: 90 },
        lifespan: 520,
        quantity: 3,
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD'
      });
      this.scene.time.delayedCall(560, () => stars.destroy());
    }
    return true;
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    audio.sfx('enemyDie');
    const sc = this.scene;
    if (sc) {
      const puff = sc.add.particles(this.x, this.y, 'p-dust', {
        speed: { min: 40, max: 130 },
        lifespan: 420,
        quantity: 8,
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.8, end: 0 }
      });
      sc.time.delayedCall(460, () => puff.destroy());
      sc.tweens.add({
        targets: this,
        scaleX: 1.4,
        scaleY: 0.2,
        alpha: 0,
        duration: 220,
        onComplete: () => {
          this.onKill?.(this);
          this.destroy();
        }
      });
    }
    this.b.setEnable(false);
  }

  vanish(): void {
    this.alive = false;
    this.b.setEnable(false);
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 300, onComplete: () => this.destroy() });
  }
}

export function createEnemy(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number): Enemy {
  return new Enemy(scene, kind, x, y);
}
