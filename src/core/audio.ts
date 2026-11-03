/**
 * All audio is synthesised at runtime with WebAudio: no files to load, no
 * external dependencies, and music/SFX volume are fully independent.
 */

type TrackName = 'meadow' | 'cave' | 'sky' | 'forest' | 'boss' | 'menu' | 'victory';

interface TrackDef {
  bpm: number;
  root: number;
  wave: OscillatorType;
  scale: number[];
  chords: number[];
  melody: number[];
  bass: number[];
  leadGain: number;
  padGain: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const TRACKS: Record<TrackName, TrackDef> = {
  meadow: {
    bpm: 112, root: 261.63, wave: 'triangle', scale: MAJOR,
    chords: [0, 4, 5, 3],
    melody: [0, 2, 4, 2, 5, 4, 2, 0, 4, 2, 4, 5, 4, 2, 0, -1],
    bass: [0, -1, -1, -1, 4, -1, -1, -1, 0, -1, -1, -1, 3, -1, -1, -1],
    leadGain: 0.1, padGain: 0.045
  },
  cave: {
    bpm: 86, root: 220, wave: 'sine', scale: MINOR,
    chords: [0, 5, 3, 4],
    melody: [0, -1, 2, -1, 4, 2, -1, 0, 2, -1, 4, 5, 4, -1, 2, -1],
    bass: [0, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1, -1, -1, -1, -1],
    leadGain: 0.085, padGain: 0.06
  },
  sky: {
    bpm: 98, root: 349.23, wave: 'triangle', scale: MAJOR,
    chords: [0, 3, 4, 5],
    melody: [4, -1, 2, 4, -1, 5, 4, 2, 4, -1, 2, 0, 2, 4, -1, -1],
    bass: [0, -1, -1, -1, 3, -1, -1, -1, 4, -1, -1, -1, 3, -1, -1, -1],
    leadGain: 0.085, padGain: 0.05
  },
  forest: {
    bpm: 78, root: 196, wave: 'sine', scale: MINOR,
    chords: [0, 3, 5, 4],
    melody: [0, -1, 3, -1, 2, -1, 0, -1, 4, -1, 3, -1, 2, -1, -1, -1],
    bass: [0, -1, -1, -1, -1, -1, 3, -1, 0, -1, -1, -1, -1, -1, -1, -1],
    leadGain: 0.09, padGain: 0.055
  },
  boss: {
    bpm: 138, root: 174.61, wave: 'square', scale: MINOR,
    chords: [0, 0, 3, 4],
    melody: [0, 0, 3, 0, 4, 3, 0, -1, 0, 0, 3, 4, 5, 4, 3, 0],
    bass: [0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 4, -1, 3, -1],
    leadGain: 0.075, padGain: 0.05
  },
  menu: {
    bpm: 92, root: 293.66, wave: 'triangle', scale: MAJOR,
    chords: [0, 5, 3, 4],
    melody: [0, 2, 4, -1, 2, 4, 5, -1, 4, 2, 0, -1, 2, -1, -1, -1],
    bass: [0, -1, -1, -1, 3, -1, -1, -1, 0, -1, -1, -1, 4, -1, -1, -1],
    leadGain: 0.075, padGain: 0.04
  },
  victory: {
    bpm: 132, root: 261.63, wave: 'square', scale: MAJOR,
    chords: [0, 3, 4, 0],
    melody: [0, 4, 7, 4, 5, 4, 2, 0, 4, 5, 7, 9, 7, 4, 2, 0],
    bass: [0, -1, 3, -1, 4, -1, 0, -1, 0, -1, 3, -1, 4, -1, 0, -1],
    leadGain: 0.08, padGain: 0.04
  }
};

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicBus: GainNode | null = null;
  sfxBus: GainNode | null = null;
  ambientBus: GainNode | null = null;
  noise: AudioBuffer | null = null;

  private track: TrackName | null = null;
  private step = 0;
  private nextTime = 0;
  private schedTimer: number | null = null;
  private ambientTimer: number | null = null;
  private ambientKind: 'birds' | 'drips' | 'wind' | 'fireflies' | null = null;
  private windSrc: AudioBufferSourceNode | null = null;

  musicVol = 0.55;
  sfxVol = 0.7;
  muted = false;

  init(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    try {
      this.ctx = new Ctor();
    } catch {
      return false;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.5;
    this.ambientBus.connect(this.master);

    // one shared noise buffer for thuds, wind and whooshes
    const len = Math.floor(ctx.sampleRate * 1.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return true;
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    if (this.musicBus) this.musicBus.gain.value = this.musicVol;
    if (this.sfxBus) this.sfxBus.gain.value = this.sfxVol;
  }

  setMusicVolume(v: number): void {
    this.musicVol = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.sfxVol = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyVolumes();
  }

  /* ------------------------------ music ------------------------------ */

  startMusic(name: TrackName): void {
    if (!this.init()) return;
    if (this.track === name && this.schedTimer !== null) return;
    this.stopMusic();
    this.track = name;
    this.step = 0;
    this.nextTime = (this.ctx?.currentTime ?? 0) + 0.08;
    this.schedTimer = window.setInterval(() => this.schedule(), 45);
  }

  stopMusic(): void {
    if (this.schedTimer !== null) {
      window.clearInterval(this.schedTimer);
      this.schedTimer = null;
    }
    this.track = null;
  }

  get currentTrack(): TrackName | null {
    return this.track;
  }

  private schedule(): void {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus || !this.track) return;
    const def = TRACKS[this.track];
    const stepDur = 60 / def.bpm / 4; // 16th notes
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(def, this.step, this.nextTime, bus, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(def: TrackDef, step: number, when: number, bus: GainNode, dur: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bar = Math.floor(step / 16) % def.chords.length;
    const chord = def.chords[bar];
    const idx = step % 16;

    // lead
    const deg = def.melody[idx];
    if (deg >= 0) {
      const semi = def.scale[(deg + chord) % 7] + 12 * Math.floor((deg + chord) / 7);
      const freq = def.root * Math.pow(2, semi / 12) * (step >= 32 ? 2 : 1);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = def.wave;
      o.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(def.leadGain, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, when + dur * 1.7);
      o.connect(g).connect(bus);
      o.start(when);
      o.stop(when + dur * 1.9);
    }

    // bass
    const b = def.bass[idx];
    if (b >= 0) {
      const semi = def.scale[(b + chord) % 7] - 24 + 12 * Math.floor((b + chord) / 7);
      const freq = def.root * Math.pow(2, semi / 12);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.16, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur * 3.2);
      o.connect(g).connect(bus);
      o.start(when);
      o.stop(when + dur * 3.4);
    }

    // soft pad on the first beat of each bar
    if (idx === 0) {
      for (const off of [0, 2, 4]) {
        const semi = def.scale[(off + chord) % 7] + 12 * Math.floor((off + chord) / 7);
        const freq = def.root * Math.pow(2, semi / 12);
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, when);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(def.padGain, when + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, when + dur * 14);
        o.connect(g).connect(bus);
        o.start(when);
        o.stop(when + dur * 15);
      }
    }
  }

  /* ------------------------------- sfx ------------------------------- */

  private blip(
    freq: number, dur: number, type: OscillatorType, vol: number,
    slideTo?: number, delay = 0
  ): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noiseHit(dur: number, vol: number, filterHz: number, type: BiquadFilterType = 'lowpass', delay = 0, sweepTo?: number): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus || !this.noise) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(filterHz, t);
    if (sweepTo !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  sfx(name: string): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    switch (name) {
      case 'jump':
        this.blip(420, 0.16, 'triangle', 0.18, 780);
        break;
      case 'doubleJump':
        this.blip(620, 0.18, 'triangle', 0.17, 1100);
        this.blip(880, 0.14, 'sine', 0.1, 1400, 0.05);
        break;
      case 'land':
        this.noiseHit(0.14, 0.2, 700, 'lowpass', 0, 220);
        this.blip(150, 0.1, 'sine', 0.12, 90);
        break;
      case 'collect':
        this.blip(880, 0.09, 'square', 0.09, 1320);
        this.blip(1320, 0.1, 'square', 0.06, 1760, 0.05);
        break;
      case 'coin':
        this.blip(1046, 0.07, 'square', 0.08);
        this.blip(1568, 0.12, 'square', 0.07, 1568, 0.06);
        break;
      case 'berry':
        this.blip(660, 0.1, 'sine', 0.12, 990);
        this.blip(990, 0.12, 'sine', 0.09, 1320, 0.07);
        break;
      case 'hurt':
        this.blip(320, 0.28, 'sawtooth', 0.14, 90);
        this.noiseHit(0.18, 0.12, 1400, 'highpass');
        break;
      case 'dash':
        this.noiseHit(0.24, 0.2, 2600, 'bandpass', 0, 600);
        this.blip(240, 0.2, 'triangle', 0.1, 620);
        break;
      case 'roll':
        this.noiseHit(0.3, 0.13, 900, 'bandpass', 0, 320);
        break;
      case 'throw':
        this.blip(760, 0.08, 'square', 0.09, 460);
        break;
      case 'stomp':
        this.blip(220, 0.12, 'square', 0.14, 90);
        this.noiseHit(0.12, 0.16, 900);
        break;
      case 'bossHit':
        this.blip(120, 0.3, 'sawtooth', 0.2, 60);
        this.noiseHit(0.25, 0.16, 500);
        break;
      case 'enemyDie':
        this.blip(500, 0.12, 'square', 0.1, 200);
        this.noiseHit(0.16, 0.1, 1200);
        break;
      case 'unlock':
        [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.22, 'triangle', 0.13, f, i * 0.09));
        break;
      case 'treasure':
        [784, 988, 1175, 1568].forEach((f, i) => this.blip(f, 0.3, 'sine', 0.12, f, i * 0.07));
        break;
      case 'checkpoint':
        this.blip(587, 0.18, 'triangle', 0.12, 880);
        break;
      case 'chest':
        this.noiseHit(0.2, 0.12, 800, 'lowpass', 0, 400);
        this.blip(700, 0.2, 'triangle', 0.1, 1050, 0.08);
        break;
      case 'bounce':
        this.blip(300, 0.22, 'sine', 0.16, 900);
        break;
      case 'sniff':
        this.noiseHit(0.12, 0.07, 2200, 'highpass');
        break;
      case 'heal':
        [660, 880].forEach((f, i) => this.blip(f, 0.2, 'sine', 0.1, f * 1.2, i * 0.1));
        break;
      case 'die':
        [400, 330, 262, 196].forEach((f, i) => this.blip(f, 0.3, 'triangle', 0.14, f * 0.8, i * 0.11));
        break;
      case 'click':
        this.blip(720, 0.05, 'square', 0.07, 900);
        break;
      case 'back':
        this.blip(500, 0.07, 'square', 0.06, 340);
        break;
      case 'victory':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.blip(f, 0.4, 'triangle', 0.13, f, i * 0.12));
        break;
      case 'quest':
        this.blip(880, 0.1, 'triangle', 0.1, 1175);
        this.blip(1175, 0.14, 'triangle', 0.08, 1568, 0.09);
        break;
      case 'deny':
        this.blip(200, 0.12, 'square', 0.09, 150);
        break;
      default:
        break;
    }
  }

  /* ----------------------------- ambience ---------------------------- */

  startAmbient(kind: 'birds' | 'drips' | 'wind' | 'fireflies'): void {
    if (!this.init() || !this.ctx) return;
    if (this.ambientKind === kind) return;
    this.stopAmbient();
    this.ambientKind = kind;
    if (kind === 'wind') {
      this.startWind();
      return;
    }
    const loop = (): void => {
      if (this.ambientKind !== kind) return;
      if (kind === 'birds') {
        const f = 1500 + Math.random() * 1200;
        this.blip(f, 0.09, 'sine', 0.035, f * 1.4);
        this.blip(f * 1.3, 0.07, 'sine', 0.025, f * 1.1, 0.11);
      } else if (kind === 'drips') {
        const f = 900 + Math.random() * 700;
        this.blip(f, 0.22, 'sine', 0.045, f * 0.55);
      } else {
        const f = 2400 + Math.random() * 900;
        this.blip(f, 0.05, 'square', 0.012, f);
        this.blip(f * 1.05, 0.05, 'square', 0.01, f * 1.05, 0.08);
      }
      this.ambientTimer = window.setTimeout(loop, 2200 + Math.random() * 4200);
    };
    this.ambientTimer = window.setTimeout(loop, 1200);
  }

  private startWind(): void {
    const ctx = this.ctx;
    const bus = this.ambientBus;
    if (!ctx || !bus || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 520;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(f).connect(g).connect(bus);
    src.start();
    lfo.start();
    this.windSrc = src;
  }

  stopAmbient(): void {
    if (this.ambientTimer !== null) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    if (this.windSrc) {
      try {
        this.windSrc.stop();
      } catch {
        /* already stopped */
      }
      this.windSrc = null;
    }
    this.ambientKind = null;
  }
}

export const audio = new AudioEngine();
