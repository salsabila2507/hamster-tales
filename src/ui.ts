/** Shared UI widgets so every screen looks like the same game. */
import Phaser from 'phaser';
import { audio } from './core/audio';

export const FONT_HEAD = 'Nunito, sans-serif';
export const FONT_BODY = 'Nunito, sans-serif';

export interface Btn {
  container: Phaser.GameObjects.Container;
  setEnabled(v: boolean): void;
  label: Phaser.GameObjects.Text;
}

export function makeButton(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  text: string,
  onClick: () => void,
  opts: { variant?: 'primary' | 'ghost' | 'gold'; size?: number } = {}
): Btn {
  const variant = opts.variant ?? 'primary';
  const g = scene.add.graphics();
  let hover = false;
  let enabled = true;

  const paint = (): void => {
    g.clear();
    const r = h / 2.3;
    let fill = 0xfff3d6;
    let strokeCol = 0x2a1b44;
    let alpha = 1;
    if (variant === 'ghost') {
      fill = 0x2a1b44;
      strokeCol = 0xffe9b8;
      alpha = hover ? 0.85 : 0.55;
    } else if (variant === 'gold') {
      fill = hover ? 0xffd766 : 0xffcb4d;
      strokeCol = 0x8a5a12;
    } else {
      fill = hover ? 0xffe9b8 : 0xfff3d6;
      strokeCol = 0x2a1b44;
    }
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, r);
    g.fillStyle(0x000000, 0.16);
    g.fillRoundedRect(-w / 2, -h / 2 + 7, w, h, r);
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(3, strokeCol, variant === 'ghost' ? 0.5 : 0.22);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    if (variant !== 'ghost') {
      g.fillStyle(0xffffff, 0.28);
      g.fillRoundedRect(-w / 2 + 8, -h / 2 + 5, w - 16, h * 0.3, r * 0.6);
    }
  };
  paint();

  const label = scene.add.text(0, 0, text, {
    fontFamily: FONT_HEAD, fontStyle: 'bold',
    fontSize: `${opts.size ?? Math.round(h * 0.42)}px`,
    color: variant === 'ghost' ? '#FFF3D6' : '#3A2340'
  }).setOrigin(0.5);

  const hit = scene.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
  const container = scene.add.container(x, y, [g, label, hit]);

  hit.on('pointerover', () => {
    if (!enabled) return;
    hover = true;
    paint();
    scene.tweens.add({ targets: container, scale: 1.045, duration: 120, ease: 'Sine.out' });
  });
  hit.on('pointerout', () => {
    hover = false;
    paint();
    scene.tweens.add({ targets: container, scale: 1, duration: 120 });
  });
  hit.on('pointerdown', () => {
    if (!enabled) return;
    scene.tweens.add({ targets: container, scale: 0.97, duration: 70, yoyo: true });
  });
  hit.on('pointerup', () => {
    if (!enabled) return;
    audio.sfx('click');
    onClick();
  });

  return {
    container,
    label,
    setEnabled(v: boolean) {
      enabled = v;
      container.setAlpha(v ? 1 : 0.42);
      hit.setInteractive({ useHandCursor: v });
      if (!v) hit.disableInteractive();
    }
  };
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.95): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x2a1b44, alpha);
  g.fillRoundedRect(x, y, w, h, 20);
  g.lineStyle(3, 0xffe9b8, 0.28);
  g.strokeRoundedRect(x, y, w, h, 20);
  g.fillStyle(0xffffff, 0.05);
  g.fillRoundedRect(x + 8, y + 8, w - 16, 34, 14);
  return g;
}

export function heading(scene: Phaser.Scene, x: number, y: number, text: string, size = 34): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_HEAD, fontStyle: 'bold',
    fontSize: `${size}px`,
    color: '#FFF3D6',
    stroke: '#2a1b44',
    strokeThickness: Math.max(3, Math.round(size / 8))
  }).setOrigin(0.5);
}

export function bodyText(scene: Phaser.Scene, x: number, y: number, text: string, size = 16, width = 600): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_BODY,
    fontSize: `${size}px`,
    color: '#FFE9B8',
    wordWrap: { width },
    lineSpacing: 6
  });
}

/** Horizontal volume slider drawn with graphics, 0..1 */
export function makeSlider(
  scene: Phaser.Scene, x: number, y: number, w: number,
  value: number, onChange: (v: number) => void
): { container: Phaser.GameObjects.Container; set(v: number): void } {
  const track = scene.add.rectangle(0, 0, w, 10, 0x1b1230, 0.9).setOrigin(0.5);
  track.setStrokeStyle(2, 0xffe9b8, 0.25);
  const fill = scene.add.rectangle(-w / 2, 0, w * value, 10, 0xffcb4d, 1).setOrigin(0, 0.5);
  const knob = scene.add.circle(-w / 2 + w * value, 0, 12, 0xfff3d6).setStrokeStyle(3, 0x2a1b44, 0.5);
  const hit = scene.add.rectangle(0, 0, w + 24, 40, 0x000000, 0).setInteractive({ useHandCursor: true, draggable: true });
  const container = scene.add.container(x, y, [track, fill, knob, hit]);

  const apply = (v: number): void => {
    const clamped = Phaser.Math.Clamp(v, 0, 1);
    fill.width = Math.max(1, w * clamped);
    knob.x = -w / 2 + w * clamped;
    onChange(clamped);
  };

  const fromPointer = (p: Phaser.Input.Pointer): void => {
    const local = p.x - container.x;
    apply((local + w / 2) / w);
  };

  hit.on('pointerdown', fromPointer);
  hit.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (p.isDown) fromPointer(p);
  });

  return {
    container,
    set(v: number) {
      fill.width = Math.max(1, w * Phaser.Math.Clamp(v, 0, 1));
      knob.x = -w / 2 + w * Phaser.Math.Clamp(v, 0, 1);
    }
  };
}

export function dim(scene: Phaser.Scene, alpha = 0.72): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(0, 0, 960, 540, 0x120c22, alpha).setOrigin(0).setDepth(0);
  // swallow clicks so overlays never leak input to the scene below
  r.setInteractive();
  return r;
}
