/** The gameplay scene: builds a level from its grid and runs the simulation. */
import Phaser from 'phaser';
import { THEMES, Theme } from '../art/palette';
import { TILE } from '../art/world';
import { buildGrid, levelById, LevelDef, ROWS, BossKind } from '../levels/levels';
import { Hamster } from '../entities/Hamster';
import { Enemy, createEnemy, EnemyKind } from '../entities/Enemies';
import { Boss } from '../entities/Boss';
import { Controls, TOUCH, resetTouch } from '../core/input';
import { save } from '../core/save';
import { audio } from '../core/audio';

type PickupType = 'seed' | 'coin' | 'berry' | 'treasure' | 'hidden';

interface Pickup extends Phaser.Physics.Arcade.Sprite {
  pickType?: PickupType;
  collected?: boolean;
}

interface Interactable {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'npc' | 'chest';
  lines: string[];
  done: boolean;
  id: string;
}

const VIEW_W = 960;
const VIEW_H = 540;

export class WorldScene extends Phaser.Scene {
  levelId = 'w1-1';
  level!: LevelDef;
  theme!: Theme;
  grid: string[] = [];
  levelW = 0;
  levelH = 0;

  controls!: Controls;
  player!: Hamster;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  platforms!: Phaser.Physics.Arcade.StaticGroup;
  hazards!: Phaser.Physics.Arcade.StaticGroup;
  pickups!: Phaser.Physics.Arcade.Group;
  enemyShots!: Phaser.Physics.Arcade.Group;
  playerShots!: Phaser.Physics.Arcade.Group;
  breakables: Phaser.GameObjects.Rectangle[] = [];

  enemies: Enemy[] = [];
  boss: Boss | null = null;
  bossDefeated = false;
  interactables: Interactable[] = [];
  nearest: Interactable | null = null;

  checkpoint = { x: 0, y: 0 };
  levelSeeds = 0;
  levelTotalSeeds = 0;
  levelTreasures = 0;
  deaths = 0;
  elapsed = 0;
  running = true;
  finished = false;
  damageTakenThisBoss = 0;

  bgSky?: Phaser.GameObjects.Image;
  bgFar?: Phaser.GameObjects.TileSprite;
  bgMid?: Phaser.GameObjects.TileSprite;
  bgNear?: Phaser.GameObjects.TileSprite;

  goalSprite?: Phaser.GameObjects.Sprite;
  lanternOn = false;
  darkOverlay?: Phaser.GameObjects.Rectangle;
  ambient?: Phaser.GameObjects.Particles.ParticleEmitter;
  promptText?: Phaser.GameObjects.Container;
  promptTarget: Interactable | null = null;
  dialogueActive = false;
  dialogueIndex = 0;
  dialogueLines: string[] = [];
  dialogueNpc: Interactable | null = null;
  questTarget = 0;

  constructor() {
    super('world');
  }

  init(data: { level?: string }): void {
    this.levelId = data.level ?? save.data.lastLevel ?? 'w1-1';
    this.enemies = [];
    this.breakables = [];
    this.interactables = [];
    this.boss = null;
    this.bossDefeated = false;
    this.levelSeeds = 0;
    this.levelTotalSeeds = 0;
    this.levelTreasures = 0;
    this.deaths = 0;
    this.elapsed = 0;
    this.running = true;
    this.finished = false;
    this.nearest = null;
    this.dialogueActive = false;
    this.dialogueLines = [];
    this.dialogueNpc = null;
    this.lanternOn = false;
    this.damageTakenThisBoss = 0;
    this.promptTarget = null;
    this.checkpointSprites = [];
    this.pushBlocks = [];
  }

  create(): void {
    const def = levelById(this.levelId) ?? levelById('w1-1')!;
    this.level = def;
    this.theme = THEMES[def.theme];
    this.grid = buildGrid(def);
    this.levelW = this.grid[0].length * TILE;
    this.levelH = ROWS * TILE;

    this.physics.world.setBounds(0, 0, this.levelW, this.levelH + 240);
    this.cameras.main.setBounds(0, 0, this.levelW, this.levelH);

    resetTouch();
    this.buildBackground();
    this.buildTerrain();
    this.buildProps();
    this.buildPlayer();
    this.buildBoss();
    this.wireCollisions();
    this.buildCamera();
    this.buildPrompt();

    // HUD sits above the world but below overlays: rely on scene-list order
    this.scene.launch('hud', { world: this });

    audio.init();
    audio.startMusic(def.boss ? 'boss' : (this.theme.music as 'meadow' | 'cave' | 'sky' | 'forest'));
    audio.startAmbient(this.theme.ambient);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audio.stopAmbient();
      resetTouch();
    });

    this.showBanner(def.name, def.intro);
    save.data.lastLevel = this.levelId;
    save.persist();

    // event-driven so a single key press is never missed between frames
    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-ESC', () => this.game.events.emit('pause-request'));
      kb.on('keydown-I', () => this.game.events.emit('inventory-request'));
      kb.on('keydown-M', () => this.game.events.emit('map-request'));
    }
  }

  /* ------------------------------ build ------------------------------ */

  private buildBackground(): void {
    const t = this.theme.key;
    this.bgSky = this.add.image(0, 0, `bg-${t}-sky`).setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.bgSky.setDisplaySize(VIEW_W, VIEW_H);
    this.bgFar = this.add.tileSprite(0, 120, VIEW_W, 420, `bg-${t}-far`).setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.bgMid = this.add.tileSprite(0, 80, VIEW_W, 460, `bg-${t}-mid`).setOrigin(0).setScrollFactor(0).setDepth(-80);
    this.bgNear = this.add.tileSprite(0, 240, VIEW_W, 300, `bg-${t}-near`).setOrigin(0).setScrollFactor(0).setDepth(-70);

    if (t === 'forest' || t === 'cave') {
      this.darkOverlay = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0a0518, 0.34)
        .setOrigin(0).setScrollFactor(0).setDepth(-60);
    }

    // drifting motes: pollen in the meadow, embers in the wood, dust in the caves
    const moteTex = t === 'forest' ? 'p-leaf-forest' : 'p-spark';
    this.ambient = this.add.particles(0, 0, moteTex, {
      x: { min: -60, max: 1020 },
      y: { min: 40, max: 520 },
      lifespan: { min: 4200, max: 8200 },
      speedX: { min: -16, max: 16 },
      speedY: { min: -20, max: -4 },
      scale: { start: 0.32, end: 0 },
      alpha: { start: 0.55, end: 0 },
      quantity: 1,
      frequency: 360,
      blendMode: 'ADD'
    }).setScrollFactor(0).setDepth(-65);
  }

  private tileAt(tx: number, ty: number): string {
    if (ty < 0 || ty >= this.grid.length) return '.';
    const row = this.grid[ty];
    if (tx < 0 || tx >= row.length) return '.';
    return row[tx];
  }

  isSolidAt(px: number, py: number): boolean {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    const c = this.tileAt(tx, ty);
    return c === '#' || c === 'X';
  }

  private buildTerrain(): void {
    const t = this.theme.key;
    const cols = this.grid[0].length;
    const h = this.levelH;

    const src = (key: string): HTMLCanvasElement =>
      this.textures.get(key).getSourceImage() as HTMLCanvasElement;

    this.solids = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();

    // Draw the terrain in vertical strips so the renderer only touches the
    // strips that are actually on screen (one giant texture is very slow).
    const STRIP_TILES = 16;
    const stripCount = Math.ceil(cols / STRIP_TILES);
    for (let s = 0; s < stripCount; s++) {
      const tx0 = s * STRIP_TILES;
      const tx1 = Math.min(cols, tx0 + STRIP_TILES);

      // find the vertical extent actually used so the strip texture stays small
      let minTy = this.grid.length;
      let maxTy = -1;
      let minGroundTy = -1;
      for (let ty = 0; ty < this.grid.length; ty++) {
        for (let tx = tx0; tx < tx1; tx++) {
          const c = this.grid[ty][tx];
          if (c === '#' || c === 's' || c === '=' || c === '^') {
            if (ty < minTy) minTy = ty;
            if (ty > maxTy) maxTy = ty;
          }
          if (c === '#' && minGroundTy < 0) minGroundTy = ty;
        }
      }
      if (maxTy < 0) continue;

      const cv = document.createElement('canvas');
      cv.width = (tx1 - tx0) * TILE;
      cv.height = (maxTy - minTy + 1) * TILE;
      const ctx = cv.getContext('2d');
      if (!ctx) continue;

      for (let ty = minTy; ty <= maxTy; ty++) {
        for (let tx = tx0; tx < tx1; tx++) {
          const c = this.grid[ty][tx];
          if (c === '.' || c === undefined) continue;
          const px = (tx - tx0) * TILE;
          const py = (ty - minTy) * TILE;
          const variant = (tx * 7 + ty * 13) % 5;
          if (c === '#') {
            const above = this.tileAt(tx, ty - 1);
            const isTop = above !== '#';
            const key = isTop ? `tile-${t}-top-${variant}` : `tile-${t}-body-${variant}`;
            ctx.drawImage(src(key), px, py);
          } else if (c === 's') {
            ctx.drawImage(src(`tile-${t}-body-${variant}`), px, py);
          } else if (c === '=') {
            ctx.drawImage(src(`tile-${t}-platform`), px, py);
          } else if (c === '^') {
            ctx.drawImage(src(`tile-${t}-spike`), px, py);
          }
        }
      }

      const texKey = `terrain-${this.levelId}-${s}`;
      if (!this.textures.exists(texKey)) this.textures.addCanvas(texKey, cv);

      // depth shading so stacked dirt tiles do not read as a flat repeating grid
      const grad = ctx.createLinearGradient(0, cv.height * 0.42, 0, cv.height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.10)');
      grad.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cv.width, cv.height);

      // faint horizontal strata so deep ground does not read as a repeating grid
      if (minGroundTy >= 0) {
        const top = (minGroundTy - minTy) * TILE;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.09)';
        for (let i = 0; i < 4; i++) {
          const y = top + 18 + i * 27;
          if (y < cv.height - 4) ctx.fillRect(0, y, cv.width, 2);
        }
        ctx.restore();
      }

      this.add.image(tx0 * TILE, minTy * TILE, texKey).setOrigin(0).setDepth(0);
    }

    // merge horizontal runs into single static bodies
    for (let ty = 0; ty < this.grid.length; ty++) {
      let runStart = -1;
      const row = this.grid[ty];
      for (let tx = 0; tx <= row.length; tx++) {
        const solid = tx < row.length && row[tx] === '#';
        if (solid && runStart < 0) runStart = tx;
        if (!solid && runStart >= 0) {
          const count = tx - runStart;
          this.addSolidRect(runStart * TILE, ty * TILE, count * TILE, TILE);
          runStart = -1;
        }
      }
    }

    // one-way platforms and hazards
    for (let ty = 0; ty < this.grid.length; ty++) {
      for (let tx = 0; tx < this.grid[ty].length; tx++) {
        const c = this.grid[ty][tx];
        if (c === '=') {
          const r = this.add.rectangle(tx * TILE + TILE / 2, ty * TILE + 7, TILE, 14, 0x000000, 0);
          this.physics.add.existing(r, true);
          const body = r.body as Phaser.Physics.Arcade.StaticBody;
          body.checkCollision.down = false;
          body.checkCollision.left = false;
          body.checkCollision.right = false;
          this.platforms.add(r);
        } else if (c === '^') {
          const r = this.add.rectangle(tx * TILE + TILE / 2, ty * TILE + 11, TILE - 4, 10, 0xff0000, 0);
          this.physics.add.existing(r, true);
          this.hazards.add(r);
        } else if (c === '~') {
          const r = this.add.rectangle(tx * TILE + TILE / 2, ty * TILE + TILE / 2, TILE, TILE, 0x0000ff, 0);
          this.physics.add.existing(r, true);
          this.hazards.add(r);
        }
      }
    }
  }

  private addSolidRect(x: number, y: number, w: number, h: number): void {
    const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
    this.physics.add.existing(r, true);
    this.solids.add(r);
  }

  private buildProps(): void {
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemyShots = this.physics.add.group({ allowGravity: false });
    this.playerShots = this.physics.add.group({ allowGravity: false });

    let spawn = { x: 2 * TILE, y: 17 * TILE };

    for (let ty = 0; ty < this.grid.length; ty++) {
      for (let tx = 0; tx < this.grid[ty].length; tx++) {
        const c = this.grid[ty][tx];
        const cx = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        switch (c) {
          case '@':
            // stand exactly on top of the tile below
            spawn = { x: cx, y: (ty + 1) * TILE - 30 };
            break;
          case 'S':
            this.addPickup('seed', cx, cy, 'p-seed-glow');
            this.levelTotalSeeds++;
            break;
          case 'h':
            this.addPickup('hidden', cx, cy, 'p-seed-glow');
            this.levelTotalSeeds++;
            break;
          case 'c':
            this.addPickup('coin', cx, cy, 'p-coin', 'coin-spin');
            break;
          case 'b':
            this.addPickup('berry', cx, cy, 'p-berry', 'berry-bob');
            break;
          case 'T':
            this.addPickup('treasure', cx, cy, 'p-treasure', undefined);
            break;
          case 'C':
            this.addChest(cx, (ty + 1) * TILE);
            break;
          case 'K':
            this.addCheckpoint(cx, cy + 12, ty);
            break;
          case 'G':
            this.goalSprite = this.add.sprite(cx, cy + 4, 'p-goal', 0).setDepth(5).play('goal-shine');
            break;
          case 'M': {
            const m = this.add.sprite(cx, ty * TILE + 6, 'p-mushroom', 0).setOrigin(0.5, 0).setDepth(4);
            m.play('mush-bounce');
            const body = this.physics.add.staticImage(cx, ty * TILE + 12, 'p-mushroom');
            body.setVisible(false);
            body.body.setSize(28, 12);
            this.platforms.add(body);
            body.setData('mushroom', true);
            m.setData('bodyRef', body);
            break;
          }
          case 'P':
            this.addPushBlock(cx, cy);
            break;
          case 'X':
            this.addBreakable(tx, ty);
            break;
          case 'L': {
            const off = this.add.sprite(cx, ty * TILE + 22, 'p-lantern-off').setDepth(4);
            off.setData('tile', { tx, ty });
            this.interactables.push({
              sprite: off as unknown as Phaser.GameObjects.Sprite,
              kind: 'chest',
              lines: [],
              done: false,
              id: `lantern-${tx}-${ty}`
            });
            break;
          }
          case 'o': {
            const w = this.add.sprite(cx, cy, 'p-wind', 0).setDepth(3).setAlpha(0.75);
            w.play('wind-blow');
            break;
          }
          case '~': {
            const wtr = this.add.sprite(cx, cy, `tile-${this.theme.key}-water`, 0).setDepth(1);
            wtr.play(`water-${this.theme.key}`);
            break;
          }
          case '1':
            this.addEnemy('slime', cx, cy);
            break;
          case '2':
            this.addEnemy('squirrel', cx, cy);
            break;
          case '3':
            this.addEnemy('beetle', cx, cy);
            break;
          case '4':
            this.addEnemy('bat', cx, cy);
            break;
          case '5':
            this.addEnemy('bird', cx, cy);
            break;
          case '6':
            this.addEnemy('wisp', cx, cy);
            break;
          case 'n':
            this.addNpc(cx, ty * TILE + 4);
            break;
          default:
            break;
        }
      }
    }

    this.checkpoint = { x: spawn.x, y: spawn.y };
    this.spawnPoint = spawn;
  }

  spawnPoint = { x: 64, y: 560 };

  private addPickup(type: PickupType, x: number, y: number, tex: string, anim?: string): void {
    const s = this.pickups.create(x, y, tex, 0) as Pickup;
    s.pickType = type;
    s.setDepth(6);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    if (type === 'hidden') {
      s.setAlpha(0);
      s.setVisible(false);
    }
    if (type === 'seed' || type === 'hidden') {
      // glow is baked into the texture so it always reads against busy art
      s.setScale(1.2);
      this.tweens.add({ targets: s, scale: 1.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: s, y: y - 3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (x % 7) * 60 });
    } else if (type === 'coin') {
      s.setScale(1.15);
      if (anim) s.play(anim);
    } else if (type === 'berry') {
      s.setScale(1.15);
      if (anim) s.play(anim);
    } else if (type === 'treasure') {
      s.setScale(1.05);
      this.tweens.add({ targets: s, y: y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private addChest(x: number, y: number): void {
    const s = this.add.sprite(x, y, 'p-chest').setOrigin(0.5, 1).setDepth(5);
    const surprises = [
      'A single, very old sock. The hamster looks betrayed.',
      'Three seeds and a note: "IOU one treasure".',
      'A tiny hat. It fits perfectly. Nobody can see it.',
      'A loud squeak toy. The hamster squeaks it twice.',
      'A berry. Just a berry. Still counts.'
    ];
    this.interactables.push({
      sprite: s,
      kind: 'chest',
      lines: [Phaser.Utils.Array.GetRandom(surprises)],
      done: false,
      id: `chest-${Math.round(x)}`
    });
  }

  private addCheckpoint(x: number, y: number, ty: number): void {
    const s = this.add.sprite(x, y, 'p-checkpoint-off').setDepth(4).setOrigin(0.5, 1);
    s.setData('active', false);
    this.physics.add.existing(s, true);
    const body = s.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(30, 44);
    body.setOffset(-2, 0);
    this.platforms.add(s);
    this.checkpointSprites.push(s);
    s.setData('pos', { x, y: (ty + 1) * TILE - 30 });
  }

  checkpointSprites: Phaser.GameObjects.Sprite[] = [];

  private addPushBlock(x: number, y: number): void {
    const s = this.physics.add.sprite(x, y, 'p-pushblock');
    s.setDepth(6);
    s.setPushable(true);
    const body = s.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 30);
    body.setGravityY(1800);
    body.setDragX(900);
    body.setMaxVelocity(120, 900);
    body.setBounce(0);
    this.pushBlocks.push(s);
    this.physics.add.collider(s, this.solids);
    this.physics.add.collider(s, this.platforms);
  }

  pushBlocks: Phaser.Physics.Arcade.Sprite[] = [];

  private addBreakable(tx: number, ty: number): void {
    const r = this.add.rectangle(tx * TILE + TILE / 2, ty * TILE + TILE / 2, TILE, TILE, 0x000000, 0);
    this.physics.add.existing(r, true);
    this.solids.add(r);
    const img = this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `tile-${this.theme.key}-breakable`).setDepth(1);
    r.setData('img', img);
    this.breakables.push(r);
  }

  private addEnemy(kind: EnemyKind, x: number, y: number): void {
    const e = createEnemy(this, kind, x, y);
    e.player = this.player;
    e.spawnProjectile = (k, px, py, vx, vy) => this.spawnShot(k, px, py, vx, vy, false);
    e.onKill = (en) => {
      this.burst(en.x, en.y, this.theme.accent);
      save.addSeeds(1);
      this.levelSeeds++;
      this.game.events.emit('seeds-changed');
    };
    e.onSteal = (en) => {
      const taken = Math.min(this.player.cheeks, 3);
      this.player.cheeks -= taken;
      en.stolen = Math.max(1, taken);
      audio.sfx('deny');
      this.game.events.emit('toast', 'The bird stole your seeds! Catch it!');
      this.game.events.emit('cheeks-changed');
    };
    this.enemies.push(e);
  }

  private addNpc(x: number, y: number): void {
    const kinds = ['npc-snail', 'npc-frog', 'npc-owl'];
    const lines: Record<string, string[]> = {
      'npc-snail': [
        'Oh! A hamster. I am Shelly. I am very slow, so listen fast.',
        'They say the Golden Seeds fell from the sky. Or were stolen. Or both.',
        'If you find a secret room, do not tell anyone. Except me. Tell me.'
      ],
      'npc-frog': [
        'Ribbit. I am Pip. I jump for a living. It is a good living.',
        'Tip: hold jump longer to jump higher. Do not tell the beetles.',
        'Have you tried rolling downhill? Terrifying. Ten out of ten.'
      ],
      'npc-owl': [
        'Hoo. Olive here. I have watched this forest for ninety years.',
        'The Pumpkin King is not evil. He is just... very lonely. And large.',
        'Take the lanterns with you. The dark is only rude, not dangerous.'
      ]
    };
    const tex = kinds[Math.floor(Math.abs(x) / 97) % 3];
    const s = this.add.sprite(x, y + 18, tex, 0).setOrigin(0.5, 1).setDepth(5);
    s.play(tex === 'npc-snail' ? 'npc-snail' : tex === 'npc-frog' ? 'npc-frog' : 'npc-owl');
    this.interactables.push({
      sprite: s,
      kind: 'npc',
      lines: lines[tex] ?? ['...'],
      done: false,
      id: `npc-${Math.round(x)}`
    });
  }

  private buildPlayer(): void {
    this.controls = new Controls(this);
    this.player = new Hamster(this, this.spawnPoint.x, this.spawnPoint.y, {
      isSolidAt: (px, py) => this.isSolidAt(px, py)
    });
    this.player.setControls(this.controls);
    this.player.maxHealth = 3 + (save.data.achievements['friend'] ? 1 : 0);
    this.player.health = this.player.maxHealth;
    this.player.cheeks = Math.min(6, save.data.seeds);

    this.player.on('land', () => {
      this.dust(this.player.x, this.player.y + 30);
      audio.sfx('land');
    });
    this.player.on('jump', () => this.dust(this.player.x, this.player.y + 20, 3));
    this.player.on('doubleJump', () => this.ring(this.player.x, this.player.y + 10));
    this.player.on('throw', (dir: number) => {
      this.spawnShot('seed', this.player.x + dir * 14, this.player.y - 2, dir * 480, -90, true);
      audio.sfx('throw');
      this.game.events.emit('cheeks-changed');
    });
    this.player.on('cheeksEmpty', () => this.game.events.emit('toast', 'Your cheeks are empty. Find seeds!'));
    this.player.on('hurt', () => {
      this.game.events.emit('health-changed');
      if (this.boss) this.damageTakenThisBoss++;
    });
    this.player.on('dead', () => this.onPlayerDead());
    this.player.on('sleep', () => {
      save.achieve('sleepy');
      this.game.events.emit('achievement', 'sleepy');
    });
    this.player.on('dash', (dir: number) => {
      this.burst(this.player.x - dir * 12, this.player.y, '#ffffff', 5);
    });
  }

  private buildBoss(): void {
    if (!this.level.boss) return;
    // spawn where the player can actually see it on arrival
    const bx = this.levelW * 0.55;
    const by = 14 * TILE;
    const boss = new Boss(this, this.level.boss as BossKind, bx, by);
    boss.player = this.player;
    boss.spawnProjectile = (k, px, py, vx, vy) => this.spawnShot(k, px, py, vx, vy, false);
    boss.onShockwave = (x, y) => {
      this.spawnShot('shock', x, y - 8, 0, 0, false, true);
      this.cameras.main.shake(240, 0.008);
    };
    boss.onSummon = (x, y) => this.addEnemy('wisp', x, y);
    boss.onDamaged = (hp) => {
      this.game.events.emit('boss-health', hp / boss.maxHp);
      this.game.events.emit('boss-name', boss.bossName);
    };
    boss.onDefeated = () => this.onBossDefeated();
    this.boss = boss;
    this.game.events.emit('boss-name', boss.bossName);
    this.game.events.emit('boss-health', 1);
  }

  private wireCollisions(): void {
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.pushBlocks);

    for (const e of this.enemies) {
      this.physics.add.collider(e, this.solids);
      this.physics.add.collider(e, this.platforms);
    }

    if (this.boss) {
      this.physics.add.collider(this.boss, this.solids);
      this.physics.add.collider(this.boss, this.platforms);
    }

    // player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      (_p, _e) => this.onPlayerTouchEnemy(_e as unknown as Enemy),
      undefined,
      this
    );

    // player vs boss
    if (this.boss) {
      const boss = this.boss;
      this.physics.add.overlap(this.player, boss, () => this.onPlayerTouchBoss(boss), undefined, this);
    }

    // pickups
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.collect(pk as unknown as Pickup), undefined, this);

    // hazards
    this.physics.add.overlap(this.player, this.hazards, () => this.onHazard(), undefined, this);

    // player shots vs enemies
    this.physics.add.overlap(this.playerShots, this.enemies as unknown as Phaser.GameObjects.GameObject[], (shot, en) => {
      const s = shot as Phaser.Physics.Arcade.Sprite;
      const e = en as unknown as Enemy;
      if (e.hit('seed', s.x)) this.burst(s.x, s.y, '#fff3a8', 4);
      s.destroy();
    }, undefined, this);

    // player shots vs boss
    if (this.boss) {
      const boss = this.boss;
      this.physics.add.overlap(this.playerShots, boss, (shot) => {
        const s = shot as Phaser.Physics.Arcade.Sprite;
        boss.hit();
        s.destroy();
      }, undefined, this);
    }

    // player shots vs breakables
    for (const b of this.breakables) {
      this.physics.add.overlap(this.playerShots, b, (shot) => {
        (shot as Phaser.Physics.Arcade.Sprite).destroy();
        this.breakWall(b);
      }, undefined, this);
    }

    // enemy shots vs player
    this.physics.add.overlap(this.player, this.enemyShots, (_p, shot) => {
      const s = shot as Phaser.Physics.Arcade.Sprite;
      if (s.getData('shock')) return;
      s.destroy();
      this.player.hurt(1, s.x);
    }, undefined, this);

    // goal
    if (this.goalSprite) {
      this.physics.add.existing(this.goalSprite, true);
      this.physics.add.overlap(this.player, this.goalSprite, () => this.completeLevel(), undefined, this);
    }

    // checkpoints
    for (const cp of this.checkpointSprites) {
      this.physics.add.overlap(this.player, cp, () => this.activateCheckpoint(cp), undefined, this);
    }
  }

  private buildCamera(): void {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.14, 0.14);
    cam.setDeadzone(90, 60);
    cam.setFollowOffset(0, -10);
    cam.fadeIn(420, 0, 0, 0);
  }

  private buildPrompt(): void {
    const bg = this.add.rectangle(0, 0, 26, 26, 0x2a1b44, 0.9).setStrokeStyle(2, 0xffcb4d);
    const txt = this.add.text(0, 0, 'E', {
      fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: '#FFCB4D'
    }).setOrigin(0.5);
    this.promptText = this.add.container(0, 0, [bg, txt]).setDepth(30).setVisible(false);
  }

  /* ------------------------------ effects ---------------------------- */

  burst(x: number, y: number, color: string, qty = 8): void {
    const p = this.add.particles(x, y, 'p-spark', {
      speed: { min: 40, max: 150 },
      lifespan: 500,
      quantity: qty,
      scale: { start: 0.55, end: 0 },
      tint: Phaser.Display.Color.HexStringToColor(color).color,
      blendMode: 'ADD'
    });
    p.setDepth(25);
    this.time.delayedCall(560, () => p.destroy());
  }

  dust(x: number, y: number, qty = 5): void {
    const p = this.add.particles(x, y, 'p-dust', {
      speed: { min: 20, max: 70 },
      lifespan: 380,
      quantity: qty,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      angle: { min: 200, max: 340 }
    });
    p.setDepth(19);
    this.time.delayedCall(420, () => p.destroy());
  }

  ring(x: number, y: number): void {
    const r = this.add.image(x, y, 'p-ring').setDepth(24).setScale(0.2).setAlpha(0.9);
    this.tweens.add({
      targets: r, scale: 0.8, alpha: 0, duration: 380,
      onComplete: () => r.destroy()
    });
  }

  private showBanner(title: string, sub: string): void {
    this.game.events.emit('banner', title, sub);
  }

  /* ------------------------------ combat ----------------------------- */

  private onPlayerTouchEnemy(e: Enemy): void {
    if (!e.alive) return;
    const p = this.player;
    const pb = p.body as Phaser.Physics.Arcade.Body;
    const eb = e.body as Phaser.Physics.Arcade.Body;
    const stomping = pb.velocity.y > 40 && pb.bottom < eb.top + 18;

    if (p.isDashing) {
      if (e.hit('dash', p.x)) this.burst(e.x, e.y, this.theme.accent);
      return;
    }
    if (p.isRolling) {
      if (e.hit('roll', p.x)) {
        p.setVelocityX(-p.facing * 180);
        this.cameras.main.shake(90, 0.003);
      }
      return;
    }
    if (stomping) {
      if (e.hit('stomp', p.x)) {
        p.setVelocityY(-430);
        this.burst(e.x, e.y, this.theme.accent, 6);
        audio.sfx('stomp');
      } else {
        p.hurt(1, e.x);
      }
      return;
    }
    p.hurt(1, e.x);
  }

  private onPlayerTouchBoss(boss: Boss): void {
    if (boss.state === 'dead') return;
    const p = this.player;
    const pb = p.body as Phaser.Physics.Arcade.Body;
    const bb = boss.body as Phaser.Physics.Arcade.Body;
    const stomping = pb.velocity.y > 40 && pb.bottom < bb.top + 26;

    if (p.isDashing) {
      if (boss.hit()) this.burst(boss.x, boss.y - 30, '#fff3a8', 10);
      return;
    }
    if (stomping) {
      if (boss.hit()) {
        p.setVelocityY(-480);
        this.burst(boss.x, bb.top + 10, '#fff3a8', 8);
      } else {
        p.setVelocityY(-360);
      }
      return;
    }
    p.hurt(1, boss.x);
  }

  private onHazard(): void {
    if (this.player.isInvulnerable || this.finished) return;
    this.deaths++;
    const died = this.player.hurt(1, this.player.x);
    if (!died) return;
    if (this.player.health <= 0) return;
    this.time.delayedCall(160, () => {
      if (this.finished) return;
      this.player.respawnAt(this.checkpoint.x, this.checkpoint.y);
      this.cameras.main.flash(220, 255, 80, 120);
    });
  }

  private onPlayerDead(): void {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    audio.sfx('die');
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(700, () => {
      this.scene.pause();
      this.scene.launch('gameover', { level: this.levelId });
    });
  }

  private collect(pk: Pickup): void {
    if (!pk.active || pk.collected) return;
    pk.collected = true;
    const t = pk.pickType;
    if (t === 'seed' || t === 'hidden') {
      this.levelSeeds++;
      save.addSeeds(1);
      this.player.addCheeks(1);
      audio.sfx('collect');
      this.game.events.emit('cheeks-changed');
      this.game.events.emit('seeds-changed');
    } else if (t === 'coin') {
      save.addCoins(1);
      audio.sfx('coin');
      this.game.events.emit('coins-changed');
    } else if (t === 'berry') {
      save.data.berriesEaten++;
      save.persist();
      if (this.player.health < this.player.maxHealth) {
        this.player.health++;
        this.game.events.emit('health-changed');
        audio.sfx('heal');
      } else {
        audio.sfx('berry');
      }
    } else if (t === 'treasure') {
      this.levelTreasures++;
      save.addTreasure(1);
      audio.sfx('treasure');
      this.player.playPose('ham-cheer', 0.8);
      this.burst(pk.x, pk.y, '#7DE3F5', 14);
      this.game.events.emit('toast', 'Rare treasure found!');
      this.game.events.emit('treasures-changed');
    }
    this.burst(pk.x, pk.y, t === 'treasure' ? '#7DE3F5' : '#fff3a8', 6);
    this.tweens.add({
      targets: pk, y: pk.y - 18, alpha: 0, scale: 1.4, duration: 240,
      onComplete: () => pk.destroy()
    });
  }

  private breakWall(b: Phaser.GameObjects.Rectangle): void {
    const img = b.getData('img') as Phaser.GameObjects.Image | undefined;
    const x = b.x;
    const y = b.y;
    if (img) {
      this.tweens.add({ targets: img, alpha: 0, scale: 1.2, duration: 180, onComplete: () => img.destroy() });
    }
    this.burst(x, y, this.theme.groundBody, 12);
    audio.sfx('stomp');
    this.cameras.main.shake(120, 0.004);
    const idx = this.breakables.indexOf(b);
    if (idx >= 0) this.breakables.splice(idx, 1);
    b.destroy();
  }

  private spawnShot(kind: string, x: number, y: number, vx: number, vy: number, friendly: boolean, shock = false): void {
    const texMap: Record<string, string> = {
      seed: 'proj-seed', acorn: 'proj-acorn', feather: 'proj-feather',
      crystal: 'proj-crystal', flame: 'proj-flame', shock: 'proj-shock'
    };
    const tex = texMap[kind] ?? 'proj-seed';
    const group = friendly ? this.playerShots : this.enemyShots;
    const s = group.create(x, y, tex) as Phaser.Physics.Arcade.Sprite;
    s.setDepth(22);
    const body = s.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(kind === 'acorn');
    s.setVelocity(vx, vy);
    if (kind === 'acorn') body.setGravityY(900);
    if (kind === 'feather') {
      this.tweens.add({ targets: s, angle: 360, duration: 900, repeat: -1 });
      s.setVelocityX(Phaser.Math.Between(-40, 40));
    }
    if (kind === 'flame') s.setScale(1.1);
    if (shock) {
      s.setData('shock', true);
      s.setImmovable(true);
      body.setAllowGravity(false);
      s.setVelocity(0, 0);
      s.setScale(0.6, 1);
      this.tweens.add({
        targets: s, scaleX: 4.5, alpha: 0, duration: 480,
        onComplete: () => s.destroy()
      });
      // shockwave hurts the player if they are on the ground nearby
      const check = this.time.addEvent({
        delay: 60, repeat: 6, callback: () => {
          if (!s.active) return;
          const d = Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y);
          const onGround = this.player.onGround;
          if (d < s.displayWidth * 0.5 && onGround) this.player.hurt(1, s.x);
        }
      });
      this.time.delayedCall(560, () => check.remove());
      return;
    }
    if (kind === 'crystal') this.tweens.add({ targets: s, angle: 540, duration: 900, repeat: -1 });
    this.time.delayedCall(4200, () => { if (s.active) s.destroy(); });
  }

  private activateCheckpoint(cp: Phaser.GameObjects.Sprite): void {
    if (cp.getData('active')) return;
    cp.setData('active', true);
    cp.setTexture('p-checkpoint-on');
    const pos = cp.getData('pos') as { x: number; y: number };
    this.checkpoint = { x: pos.x, y: pos.y };
    audio.sfx('checkpoint');
    this.burst(cp.x, cp.y - 30, '#FFCB4D', 10);
    this.game.events.emit('toast', 'Checkpoint!');
  }

  /* ---------------------------- interaction -------------------------- */

  private updateInteraction(): void {
    if (this.dialogueActive) {
      this.promptText?.setVisible(false);
      if (this.controls.just.interact || this.controls.just.jump) this.advanceDialogue();
      return;
    }
    let best: Interactable | null = null;
    let bestD = 62;
    for (const it of this.interactables) {
      if (it.done) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.sprite.x, it.sprite.y);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    this.nearest = best;
    if (best && this.promptText) {
      this.promptText.setVisible(true);
      if (this.promptTarget !== best) {
        this.promptTarget = best;
        this.tweens.killTweensOf(this.promptText);
        this.promptText.setPosition(best.sprite.x, best.sprite.y - 40);
        this.tweens.add({
          targets: this.promptText,
          y: best.sprite.y - 48,
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    } else if (this.promptTarget) {
      this.promptTarget = null;
      this.tweens.killTweensOf(this.promptText!);
      this.promptText?.setVisible(false);
    }

    if (best && this.controls.just.interact) {
      if (best.kind === 'npc') {
        this.startDialogue(best);
      } else if (best.id.startsWith('lantern')) {
        this.lightLantern(best);
      } else {
        this.openChest(best);
      }
    }
  }

  private lightLantern(it: Interactable): void {
    it.done = true;
    it.sprite.setTexture('p-lantern-on');
    this.lanternOn = true;
    audio.sfx('unlock');
    this.burst(it.sprite.x, it.sprite.y - 10, '#FFB84D', 14);
    if (this.darkOverlay) this.tweens.add({ targets: this.darkOverlay, alpha: 0.1, duration: 700 });
    this.game.events.emit('toast', 'The lantern wakes up. The dark steps back.');
  }

  private openChest(it: Interactable): void {
    it.done = true;
    it.sprite.setTexture('p-chest-open');
    audio.sfx('chest');
    save.addSeeds(5);
    this.levelSeeds += 5;
    this.player.addCheeks(3);
    const roll = Math.random();
    if (roll < 0.34) {
      save.addTreasure(1);
      this.levelTreasures++;
      this.game.events.emit('treasures-changed');
      this.game.events.emit('toast', 'A rare treasure! Inside a chest! Who knew.');
    } else if (roll < 0.7) {
      save.addCoins(8);
      this.game.events.emit('coins-changed');
      this.game.events.emit('toast', '+8 coins and 5 seeds.');
    } else {
      this.game.events.emit('toast', Phaser.Utils.Array.GetRandom(it.lines));
    }
    this.game.events.emit('seeds-changed');
    this.game.events.emit('cheeks-changed');
    this.burst(it.sprite.x, it.sprite.y - 8, '#FFCB4D', 12);
  }

  private startDialogue(it: Interactable): void {
    this.dialogueActive = true;
    this.dialogueNpc = it;
    this.dialogueLines = it.lines;
    this.dialogueIndex = 0;
    this.player.setVelocity(0, 0);
    audio.sfx('quest');
    this.game.events.emit('dialogue', it.lines[0], 0, it.lines.length);
  }

  private advanceDialogue(): void {
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueActive = false;
      if (this.dialogueNpc && !this.dialogueNpc.done) {
        this.dialogueNpc.done = true;
        if (this.dialogueNpc.kind === 'npc' && !save.data.achievements['friend']) {
          save.achieve('friend');
          this.player.maxHealth = 4;
          this.player.health = 4;
          this.game.events.emit('achievement', 'friend');
          this.game.events.emit('health-changed');
          this.game.events.emit('toast', 'New friend! Max health +1.');
        }
      }
      this.dialogueNpc = null;
      this.game.events.emit('dialogue', null, 0, 0);
      return;
    }
    this.game.events.emit('dialogue', this.dialogueLines[this.dialogueIndex], this.dialogueIndex, this.dialogueLines.length);
  }

  /* ---------------------------- completion --------------------------- */

  private onBossDefeated(): void {
    this.bossDefeated = true;
    this.boss = null;
    if (this.damageTakenThisBoss === 0) save.achieve('no-hit-boss');
    this.game.events.emit('boss-health', 0);
    this.time.delayedCall(1200, () => this.completeLevel());
  }

  private completeLevel(): void {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    const rec = save.level(this.levelId);
    rec.completed = true;
    rec.seeds = Math.max(rec.seeds, this.levelSeeds);
    rec.totalSeeds = Math.max(rec.totalSeeds, this.levelTotalSeeds);
    rec.treasures = Math.max(rec.treasures, this.levelTreasures);
    rec.deaths += this.deaths;
    if (rec.bestTime === 0 || this.elapsed < rec.bestTime) rec.bestTime = this.elapsed;
    save.data.lastLevel = this.levelId;
    save.persist();

    const worldClear = this.level.world;
    if (this.level.world > save.data.unlockedWorld) save.data.unlockedWorld = Math.min(4, this.level.world);
    save.achieve(`w${worldClear}-clear`);

    this.player.setVelocity(0, 0);
    this.player.playPose('ham-cheer', 3);
    audio.sfx('victory');
    audio.startMusic('victory');
    this.cameras.main.flash(300, 255, 240, 180);

    this.time.delayedCall(900, () => {
      this.scene.pause();
      this.scene.launch('levelclear', {
        level: this.levelId,
        seeds: this.levelSeeds,
        total: this.levelTotalSeeds,
        treasures: this.levelTreasures,
        time: this.elapsed,
        outro: this.level.outro ?? ''
      });
    });
  }

  /* ------------------------------- loop ------------------------------ */

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 48) / 1000;
    if (!this.controls || !this.player) return;

    this.controls.update();

    if (!this.dialogueActive && this.running) {
      this.player.update(dt);
      this.elapsed += dt;
      save.data.playSeconds += dt;
    } else if (this.dialogueActive) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    }

    for (const e of this.enemies) if (e.alive) e.update(dt);
    if (this.boss && this.boss.state !== 'dead') this.boss.update(dt);

    this.updateInteraction();
    this.updateParallax();
    this.updateShots();

    // breakables broken by roll / dash
    if (this.player.isRolling || this.player.isDashing) {
      const pb = this.player.body as Phaser.Physics.Arcade.Body;
      for (const b of [...this.breakables]) {
        if (Math.abs(b.x - this.player.x) < 26 && Math.abs(b.y - pb.center.y) < 40) this.breakWall(b);
      }
    }

    // secret walls reveal when the player is inside them
    this.updateSecrets();

    // fell out of the world
    if (this.player.y > this.levelH + 120 && this.running) {
      this.player.health = Math.max(1, this.player.health - 1);
      this.player.respawnAt(this.checkpoint.x, this.checkpoint.y);
      this.deaths++;
      this.game.events.emit('health-changed');
    }
  }
  private updateSecrets(): void {
    const sniff = save.has('sniff');
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor((this.player.y + 30) / TILE);
    const inSecret = this.tileAt(tx, ty) === 's';
    if (!sniff && !inSecret) return;

    for (const s of this.pickups.getChildren() as Pickup[]) {
      if (s.pickType !== 'hidden' || s.visible) continue;
      const d = Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y);
      // the sniff ability reveals seeds by scent; secret walls reveal on contact
      if ((sniff && d < 150) || inSecret) {
        s.setVisible(true);
        s.setAlpha(1);
        this.burst(s.x, s.y, '#fff3a8', 5);
        this.game.events.emit('toast', 'You smell something...');
      }
    }
  }

  private updateParallax(): void {
    const cam = this.cameras.main;
    if (this.bgFar) this.bgFar.tilePositionX = cam.scrollX * 0.18;
    if (this.bgMid) this.bgMid.tilePositionX = cam.scrollX * 0.42;
    if (this.bgNear) this.bgNear.tilePositionX = cam.scrollX * 0.72;
    if (this.bgSky) this.bgSky.x = 0;
  }

  private updateShots(): void {
    const bounds = new Phaser.Geom.Rectangle(-100, -200, this.levelW + 200, this.levelH + 400);
    const kill = (s: Phaser.GameObjects.GameObject): void => {
      const sp = s as Phaser.Physics.Arcade.Sprite;
      if (!bounds.contains(sp.x, sp.y)) sp.destroy();
    };
    this.enemyShots.getChildren().forEach(kill);
    this.playerShots.getChildren().forEach(kill);
  }
}
