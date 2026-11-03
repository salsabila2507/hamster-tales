/** The hamster. Movement, abilities, animation state and damage handling. */
import Phaser from 'phaser';
import { Controls } from '../core/input';
import { save } from '../core/save';
import { audio } from '../core/audio';

export const PHYS = {
  RUN: 208,
  ACCEL: 2600,
  AIR_ACCEL: 1700,
  FRICTION: 2900,
  JUMP_V: 645,
  DOUBLE_V: 585,
  GRAV_UP: 1830,
  GRAV_DOWN: 3120,
  MAX_FALL: 940,
  COYOTE: 0.1,
  BUFFER: 0.13,
  DASH_SPEED: 660,
  DASH_TIME: 0.17,
  DASH_CD: 0.5,
  ROLL_SPEED: 400,
  BODY_W: 36,
  BODY_H: 42
};

const approach = (v: number, target: number, step: number): number =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

export interface HamsterOpts {
  isSolidAt: (px: number, py: number) => boolean;
}

export class Hamster extends Phaser.Physics.Arcade.Sprite {
  controls!: Controls;
  facing: 1 | -1 = 1;
  health = 3;
  maxHealth = 3;
  cheeks = 0;
  maxCheeks = 12;

  private coyote = 0;
  private buffer = 0;
  private jumpsUsed = 0;
  private dashing = false;
  private dashTimer = 0;
  private dashCd = 0;
  private rolling = false;
  private invuln = 0;
  private prevJumpDown = false;
  private idleTimer = 0;
  private asleep = false;
  private poseTimer = 0;
  private poseAnim = '';
  private stepCd = 0;
  private wasOnGround = true;
  private airTime = 0;
  private opts: HamsterOpts;
  private lastSafe = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, opts: HamsterOpts) {
    super(scene, x, y, 'ham-idle', 0);
    this.opts = opts;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PHYS.BODY_W, PHYS.BODY_H);
    body.setOffset(18, 24);
    body.setMaxVelocity(900, PHYS.MAX_FALL);
    body.setGravityY(PHYS.GRAV_UP);
    this.setOrigin(0.5, 0.5);
    this.play('ham-idle');
  }

  get onGround(): boolean {
    const b = this.body as Phaser.Physics.Arcade.Body;
    return b.blocked.down || b.touching.down;
  }

  get isRolling(): boolean {
    return this.rolling;
  }

  get isDashing(): boolean {
    return this.dashing;
  }

  get isInvulnerable(): boolean {
    return this.invuln > 0;
  }

  get isAsleep(): boolean {
    return this.asleep;
  }

  get speedX(): number {
    return (this.body as Phaser.Physics.Arcade.Body).velocity.x;
  }

  setControls(c: Controls): void {
    this.controls = c;
  }

  addCheeks(n: number): void {
    this.cheeks = Math.min(this.maxCheeks, this.cheeks + n);
  }

  spendCheek(): boolean {
    if (this.cheeks <= 0) return false;
    this.cheeks--;
    return true;
  }

  playPose(key: string, dur = 0.4): void {
    this.poseAnim = key;
    this.poseTimer = dur;
    this.play(key, true);
  }

  wake(): void {
    this.asleep = false;
    this.idleTimer = 0;
  }

  markSafe(): void {
    this.lastSafe.x = this.x;
    this.lastSafe.y = this.y;
  }

  get safePoint(): { x: number; y: number } {
    return this.lastSafe;
  }

  healFull(): void {
    this.health = this.maxHealth;
  }

  hurt(amount: number, fromX?: number): boolean {
    if (this.invuln > 0 || this.dashing) return false;
    this.health = Math.max(0, this.health - amount);
    this.invuln = 1.25;
    this.asleep = false;
    const dir = fromX === undefined ? -this.facing : this.x < fromX ? -1 : 1;
    this.setVelocity(dir * 240, -300);
    this.playPose('ham-hurt', 0.45);
    audio.sfx('hurt');
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.35, to: 1 },
      duration: 130,
      repeat: 7,
      yoyo: false,
      onComplete: () => this.setAlpha(1)
    });
    this.scene.cameras.main.shake(160, 0.006);
    this.emit('hurt', this.health);
    if (this.health <= 0) this.emit('dead');
    return true;
  }

  respawnAt(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.invuln = 1.1;
    this.dashing = false;
    this.rolling = false;
    this.jumpsUsed = 0;
    this.asleep = false;
    this.setAlpha(1);
    this.play('ham-idle');
  }

  private startDash(): void {
    this.dashing = true;
    this.dashTimer = PHYS.DASH_TIME;
    this.dashCd = PHYS.DASH_CD;
    this.setVelocity(this.facing * PHYS.DASH_SPEED, 0);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.playPose('ham-dash', PHYS.DASH_TIME);
    audio.sfx('dash');
    this.emit('dash', this.facing);
  }

  /** 1-tile ledge assist so small obstacles feel climbable. */
  private tryStepUp(): void {
    if (this.stepCd > 0) return;
    const b = this.body as Phaser.Physics.Arcade.Body;
    const pushDir = b.blocked.left ? -1 : b.blocked.right ? 1 : 0;
    if (!pushDir) return;
    const feetY = b.bottom;
    const probeX = this.x + pushDir * (PHYS.BODY_W / 2 + 4);
    // is the space one tile up free, and is the obstacle exactly one tile tall?
    if (!this.opts.isSolidAt(probeX, feetY - 6)) return;
    if (this.opts.isSolidAt(probeX, feetY - 34)) return;
    if (!this.opts.isSolidAt(probeX, feetY + 6)) return;
    this.y -= 4;
    this.stepCd = 0.06;
    this.emit('step');
  }

  update(dt: number): void {
    const c = this.controls;
    if (!c) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = this.onGround;

    this.invuln = Math.max(0, this.invuln - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.stepCd = Math.max(0, this.stepCd - dt);
    this.poseTimer = Math.max(0, this.poseTimer - dt);

    if (grounded) {
      this.coyote = PHYS.COYOTE;
      this.jumpsUsed = 0;
      if (!this.wasOnGround) this.emit('land');
      this.airTime = 0;
      this.markSafe();
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
      this.airTime += dt;
    }
    this.wasOnGround = grounded;

    // ---- dash ----
    if (this.dashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.dashing = false;
        body.setAllowGravity(true);
        this.setVelocityX(this.facing * PHYS.RUN * 0.7);
      }
    } else if (c.just.dash && save.has('dash') && this.dashCd <= 0) {
      this.startDash();
    }

    // ---- roll ----
    const wantsRoll = save.has('roll') && c.down.down && grounded && !this.dashing;
    if (wantsRoll && !this.rolling) {
      this.rolling = true;
      audio.sfx('roll');
      this.emit('rollStart');
    }
    if (this.rolling && (!c.down.down || !grounded)) this.rolling = false;

    // ---- horizontal ----
    const dir = (c.down.right ? 1 : 0) - (c.down.left ? 1 : 0);
    if (dir !== 0) this.facing = dir > 0 ? 1 : -1;

    if (!this.dashing) {
      if (this.rolling) {
        body.setVelocityX(this.facing * PHYS.ROLL_SPEED);
      } else if (dir !== 0) {
        const accel = (grounded ? PHYS.ACCEL : PHYS.AIR_ACCEL) * dt;
        body.setVelocityX(approach(body.velocity.x, dir * PHYS.RUN, accel));
      } else {
        const fric = (grounded ? PHYS.FRICTION : PHYS.AIR_ACCEL * 0.5) * dt;
        body.setVelocityX(approach(body.velocity.x, 0, fric));
      }
    }

    // ---- jump ----
    if (c.just.jump) this.buffer = PHYS.BUFFER;
    else this.buffer = Math.max(0, this.buffer - dt);

    const maxJumps = save.has('doubleJump') ? 2 : 1;
    if (this.buffer > 0 && this.coyote > 0 && !this.rolling) {
      body.setVelocityY(-PHYS.JUMP_V);
      this.buffer = 0;
      this.coyote = 0;
      this.jumpsUsed = 1;
      this.asleep = false;
      audio.sfx('jump');
      this.emit('jump');
    } else if (this.buffer > 0 && this.jumpsUsed < maxJumps && !grounded && !this.rolling) {
      body.setVelocityY(-PHYS.DOUBLE_V);
      this.buffer = 0;
      this.jumpsUsed = maxJumps;
      this.playPose('ham-double', 0.3);
      audio.sfx('doubleJump');
      this.emit('doubleJump');
    }

    // variable jump height
    if (this.prevJumpDown && !c.down.jump && body.velocity.y < -80) {
      body.setVelocityY(body.velocity.y * 0.45);
    }
    this.prevJumpDown = c.down.jump;

    // ---- throw ----
    if (c.just.throw && !this.rolling) {
      if (this.spendCheek()) {
        this.playPose('ham-throw', 0.26);
        this.emit('throw', this.facing);
      } else {
        audio.sfx('deny');
        this.emit('cheeksEmpty');
      }
    }

    // ---- gravity ----
    if (!this.dashing) {
      body.setGravityY(body.velocity.y > 0 ? PHYS.GRAV_DOWN : PHYS.GRAV_UP);
      if (body.velocity.y > PHYS.MAX_FALL) body.setVelocityY(PHYS.MAX_FALL);
    }

    // ---- ledge assist ----
    if (grounded && !this.rolling && dir !== 0) this.tryStepUp();

    // ---- idle / sleep ----
    const still = Math.abs(body.velocity.x) < 12 && grounded;
    if (still && !this.asleep) {
      this.idleTimer += dt;
      if (this.idleTimer > 13) {
        this.asleep = true;
        this.play('ham-sleep', true);
        this.emit('sleep');
      }
    } else if (!still) {
      this.idleTimer = 0;
      if (this.asleep) this.asleep = false;
    }

    // ---- animation ----
    if (this.poseTimer > 0) {
      // keep the override pose
    } else if (this.rolling) {
      this.play('ham-roll', true);
    } else if (!grounded) {
      this.play(body.velocity.y < 0 ? 'ham-jump' : 'ham-fall', true);
    } else if (Math.abs(body.velocity.x) > 24) {
      this.play('ham-run', true);
      const anim = this.anims.currentAnim;
      if (anim) this.anims.timeScale = Phaser.Math.Clamp(Math.abs(body.velocity.x) / PHYS.RUN, 0.65, 1.5);
    } else if (this.asleep) {
      this.play('ham-sleep', true);
    } else {
      this.play('ham-idle', true);
      this.anims.timeScale = 1;
    }

    this.setFlipX(this.facing < 0);
  }
}
