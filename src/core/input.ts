/** Unified keyboard + touch input with edge detection for jump buffering. */
import Phaser from 'phaser';

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'dash' | 'throw' | 'interact';

const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'jump', 'dash', 'throw', 'interact'];

/** Written by the HUD's on-screen buttons, read by Controls. */
export const TOUCH: { down: Record<Action, boolean>; tap: Record<Action, boolean> } = {
  down: { left: false, right: false, up: false, down: false, jump: false, dash: false, throw: false, interact: false },
  tap: { left: false, right: false, up: false, down: false, jump: false, dash: false, throw: false, interact: false }
};

export function resetTouch(): void {
  for (const a of ACTIONS) {
    TOUCH.down[a] = false;
    TOUCH.tap[a] = false;
  }
}

export function touchDown(a: Action): void {
  TOUCH.down[a] = true;
  TOUCH.tap[a] = true;
}

export function touchUp(a: Action): void {
  TOUCH.down[a] = false;
}

export class Controls {
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private prev: Record<Action, boolean> = { left: false, right: false, up: false, down: false, jump: false, dash: false, throw: false, interact: false };
  readonly down: Record<Action, boolean> = { left: false, right: false, up: false, down: false, jump: false, dash: false, throw: false, interact: false };
  readonly just: Record<Action, boolean> = { left: false, right: false, up: false, down: false, jump: false, dash: false, throw: false, interact: false };
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (name: string, code: number) => {
      this.keys[name] = kb.addKey(code, true, false);
    };
    add('left', K.LEFT);
    add('right', K.RIGHT);
    add('up', K.UP);
    add('down', K.DOWN);
    add('a', K.A);
    add('d', K.D);
    add('w', K.W);
    add('s', K.S);
    add('space', K.SPACE);
    add('shift', K.SHIFT);
    add('j', K.J);
    add('e', K.E);
    add('esc', K.ESC);
    add('i', K.I);
    add('m', K.M);
    kb.addCapture([K.LEFT, K.RIGHT, K.UP, K.DOWN, K.SPACE, K.SHIFT]);
  }

  private k(name: string): Phaser.Input.Keyboard.Key | undefined {
    return this.keys[name];
  }

  update(): void {
    const k = (n: string): Phaser.Input.Keyboard.Key | undefined => this.k(n);
    const isDown = (n: string): boolean => !!k(n)?.isDown;
    const jd = (n: string): boolean => {
      const key = k(n);
      return key ? Phaser.Input.Keyboard.JustDown(key) : false;
    };

    const d = this.down;
    d.left = isDown('left') || isDown('a') || TOUCH.down.left;
    d.right = isDown('right') || isDown('d') || TOUCH.down.right;
    d.up = isDown('up') || isDown('w') || TOUCH.down.up;
    d.down = isDown('down') || isDown('s') || TOUCH.down.down;
    d.jump = isDown('space') || TOUCH.down.jump;
    d.dash = isDown('shift') || TOUCH.down.dash;
    d.throw = isDown('j') || TOUCH.down.throw;
    d.interact = isDown('e') || TOUCH.down.interact;

    const j = this.just;
    j.jump = jd('space') || TOUCH.tap.jump;
    j.dash = jd('shift') || TOUCH.tap.dash;
    j.throw = jd('j') || TOUCH.tap.throw;
    j.interact = jd('e') || TOUCH.tap.interact;
    j.up = jd('up') || jd('w') || TOUCH.tap.up;
    j.down = jd('down') || jd('s') || TOUCH.tap.down;
    j.left = jd('left') || jd('a') || TOUCH.tap.left;
    j.right = jd('right') || jd('d') || TOUCH.tap.right;

    for (const a of ACTIONS) this.prev[a] = d[a];
    for (const a of ACTIONS) TOUCH.tap[a] = false;
  }

  /** Keyboard-only pause / menu keys, polled by the world scene. */
  menuKey(name: 'esc' | 'i' | 'm'): boolean {
    const key = this.keys[name];
    return key ? Phaser.Input.Keyboard.JustDown(key) : false;
  }
}
