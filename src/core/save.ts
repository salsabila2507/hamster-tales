/** Persistent progress. Everything lives in localStorage under one versioned key. */

export interface LevelRecord {
  completed: boolean;
  seeds: number;
  totalSeeds: number;
  treasures: number;
  bestTime: number;
  deaths: number;
}

export interface Settings {
  music: number;
  sfx: number;
  muted: boolean;
  touch: 'auto' | 'on' | 'off';
}

export interface SaveData {
  version: number;
  seeds: number;
  coins: number;
  treasures: number;
  berriesEaten: number;
  abilities: { doubleJump: boolean; dash: boolean; roll: boolean; sniff: boolean };
  levels: Record<string, LevelRecord>;
  unlockedWorld: number;
  checkpoint: Record<string, { x: number; y: number } | null>;
  quests: Record<string, 'locked' | 'active' | 'done'>;
  achievements: Record<string, boolean>;
  settings: Settings;
  lastLevel: string | null;
  playSeconds: number;
  seenIntro: boolean;
}

const KEY = 'hamster-tales-save-v1';

export const ACHIEVEMENTS: { id: string; name: string; desc: string }[] = [
  { id: 'first-seed', name: 'First Bite', desc: 'Collect your very first sunflower seed' },
  { id: 'seed-hoarder', name: 'Cheek Pouches Full', desc: 'Hold 100 seeds at once' },
  { id: 'treasure-1', name: 'Shiny Thing', desc: 'Find your first rare treasure' },
  { id: 'treasure-4', name: 'Magpie Hamster', desc: 'Find 4 rare treasures' },
  { id: 'double-jump', name: 'Double Fluff', desc: 'Unlock the double jump' },
  { id: 'dash', name: 'Zoomies', desc: 'Unlock the dash' },
  { id: 'sniff', name: 'Nosy Nose', desc: 'Unlock the sniff ability' },
  { id: 'w1-clear', name: 'Meadow Master', desc: 'Clear Sunflower Meadows' },
  { id: 'w2-clear', name: 'Sweet Tooth', desc: 'Clear the Candy Caverns' },
  { id: 'w3-clear', name: 'Sky Sailor', desc: 'Clear Cloudberry Kingdom' },
  { id: 'w4-clear', name: 'Pumpkin Hero', desc: 'Recover the Golden Seeds' },
  { id: 'no-hit-boss', name: 'Untouchable', desc: 'Defeat a boss without taking damage' },
  { id: 'all-secrets', name: 'Secret Squirrel', desc: 'Find every hidden room in one world' },
  { id: 'friend', name: 'Good Listener', desc: 'Complete an NPC side quest' },
  { id: 'rich', name: 'Acorn Bank', desc: 'Collect 250 coins' },
  { id: 'sleepy', name: 'Nap Time', desc: 'Let the hamster fall asleep' }
];

export function defaultSave(): SaveData {
  return {
    version: 1,
    seeds: 0,
    coins: 0,
    treasures: 0,
    berriesEaten: 0,
    abilities: { doubleJump: false, dash: false, roll: false, sniff: false },
    levels: {},
    unlockedWorld: 1,
    checkpoint: {},
    quests: {},
    achievements: {},
    settings: { music: 0.55, sfx: 0.7, muted: false, touch: 'auto' },
    lastLevel: null,
    playSeconds: 0,
    seenIntro: false
  };
}

export class Save {
  data: SaveData;
  private timer: number | null = null;

  constructor() {
    this.data = this.read();
  }

  private read(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const base = defaultSave();
      // shallow-merge so new fields added later do not break old saves
      const merged: SaveData = {
        ...base,
        ...parsed,
        abilities: { ...base.abilities, ...(parsed.abilities ?? {}) },
        settings: { ...base.settings, ...(parsed.settings ?? {}) },
        levels: parsed.levels ?? {},
        checkpoint: parsed.checkpoint ?? {},
        quests: parsed.quests ?? {},
        achievements: parsed.achievements ?? {}
      };
      return merged;
    } catch {
      return defaultSave();
    }
  }

  /** Debounced write so rapid pickups do not hammer localStorage. */
  persist(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 220);
  }

  flush(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage full or blocked: game still playable this session */
    }
  }

  reset(): void {
    this.data = defaultSave();
    this.flush();
  }

  level(id: string): LevelRecord {
    if (!this.data.levels[id]) {
      this.data.levels[id] = { completed: false, seeds: 0, totalSeeds: 0, treasures: 0, bestTime: 0, deaths: 0 };
    }
    return this.data.levels[id];
  }

  addSeeds(n: number): void {
    this.data.seeds += n;
    if (this.data.seeds >= 1) this.achieve('first-seed');
    if (this.data.seeds >= 100) this.achieve('seed-hoarder');
    this.persist();
  }

  addCoins(n: number): void {
    this.data.coins += n;
    if (this.data.coins >= 250) this.achieve('rich');
    this.persist();
  }

  addTreasure(n: number): void {
    this.data.treasures += n;
    this.achieve('treasure-1');
    if (this.data.treasures >= 4) this.achieve('treasure-4');
    this.persist();
  }

  achieve(id: string): boolean {
    if (this.data.achievements[id]) return false;
    this.data.achievements[id] = true;
    this.persist();
    return true;
  }

  has(ability: keyof SaveData['abilities']): boolean {
    return !!this.data.abilities[ability];
  }

  unlock(ability: keyof SaveData['abilities']): void {
    this.data.abilities[ability] = true;
    if (ability === 'doubleJump') this.achieve('double-jump');
    if (ability === 'dash') this.achieve('dash');
    if (ability === 'sniff') this.achieve('sniff');
    this.persist();
  }

  totalSeedsCollected(): number {
    return Object.values(this.data.levels).reduce((a, l) => a + l.seeds, 0) + this.data.seeds;
  }
}

export const save = new Save();
