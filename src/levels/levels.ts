/**
 * Level content.
 *
 * Levels are assembled from 16x20 hand-authored segments so every gap and ledge
 * is inside the verified jump envelope (max 4-tile gap, 3-tile step-up).
 *
 * Legend
 *  .  empty            #  solid            =  one-way platform
 *  ^  spikes           ~  water            X  breakable wall (roll/dash/seed)
 *  s  secret wall (walk through)            P  push block
 *  M  bounce mushroom  o  wind updraft      L  lantern
 *  @  spawn            S  seed             c  coin
 *  b  berry            T  treasure         C  chest
 *  K  checkpoint       G  goal             h  hidden seed (needs sniff)
 *  1 slime  2 squirrel  3 beetle  4 bat  5 bird  6 wisp   n NPC
 */

export const SEG_W = 16;
export const ROWS = 20;

export type SegId = string;

const E = '................';

export const SEGMENTS: Record<SegId, string[]> = {
  start: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '..@.S......S....',
    '################',
    '################'
  ],
  flat: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '....S......S....',
    '################',
    '################'
  ],
  gap3: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '.....c....c.....',
    '######...#######',
    '######...#######'
  ],
  gap4: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '....c......c....',
    '#####....#######',
    '#####....#######'
  ],
  stairs: [
    E, E, E, E, E, E, E, E, E, E, E, E,
    '..........######',
    '..........#..S..',
    '.....#####......',
    '.....=..........',
    E,
    '................',
    '################',
    '################'
  ],
  platforms: [
    E, E, E, E, E, E, E, E, E, E,
    '...c.c....c.c...',
    '...===....===...',
    E,
    '.......===......',
    E, E,
    '..===.......===.',
    '................',
    '################',
    '################'
  ],
  slimes: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '.....1.....1....',
    '################',
    '################'
  ],
  squirrels: [
    E, E, E, E, E, E, E, E, E, E, E, E,
    '.........######.',
    '.........c..S...',
    E, E, E,
    '..2.............',
    '################',
    '################'
  ],
  beetles: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '......3.........',
    '################',
    '################'
  ],
  bats: [
    E, E, E, E, E, E, E, E, E, E,
    '.....4.....4....',
    E, E, E, E, E, E,
    '.....S.....S....',
    '################',
    '################'
  ],
  wisps: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '......6.........',
    E, E,
    '.....S..........',
    '################',
    '################'
  ],
  secretWalk: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '........#####...',
    '........s...#...',
    '........s.T.#...',
    '################',
    '################'
  ],
  secretBreak: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '........#####...',
    '........X...#...',
    '........X.T.#...',
    '################',
    '################'
  ],
  mushroom: [
    E, E, E, E, E, E, E, E, E, E,
    '.............T..',
    E, E, E, E, E, E,
    '.....M.....S....',
    '################',
    '################'
  ],
  checkpoint: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '.......K........',
    '................',
    '################',
    '################'
  ],
  npc: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '.......n........',
    '................',
    '################',
    '################'
  ],
  water: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '...===....===...',
    '###~~~~~~~~~~~~#',
    '################',
    '################'
  ],
  spikes: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '...===....===...',
    E, E,
    '.....^^^^^^^^^^.',
    '################',
    '################'
  ],
  tunnel: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '..##############',
    '..S............h',
    E,
    '################',
    '################'
  ],
  wind: [
    E, E, E, E,
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '......oo........',
    '.....c..c.......',
    '......oo........',
    '......oo........',
    '################',
    '################'
  ],
  lanterns: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '....L.....L.....',
    '................',
    '################',
    '################'
  ],
  pushblock: [
    E, E, E, E, E, E, E, E, E, E, E,
    '..............T.',
    '............####',
    E, E, E, E,
    '.....P..........',
    '################',
    '################'
  ],
  goal: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '......G.........',
    '................',
    '################',
    '################'
  ],
  grove: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '...b....C....b..',
    '################',
    '################'
  ],
  birds: [
    E, E, E, E, E, E, E, E, E, E, E, E,
    '.....5.....5....',
    E, E, E, E, E,
    '################',
    '################'
  ],
  bossLeft: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '................',
    '################',
    '################'
  ],
  bossRight: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '................',
    '################',
    '################'
  ],
  bossWall: [
    E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
    '...............#',
    '################',
    '################'
  ]
};

export type BossKind = 'squirrel' | 'toad' | 'bird' | 'pumpkin';

export interface LevelDef {
  id: string;
  world: number;
  name: string;
  theme: string;
  segments: SegId[];
  boss?: BossKind;
  intro: string;
  outro?: string;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'w1-1',
    world: 1,
    name: 'Sunflower Meadows',
    theme: 'meadow',
    segments: ['start', 'flat', 'gap3', 'slimes', 'stairs', 'secretWalk', 'checkpoint', 'platforms', 'npc', 'grove', 'gap3', 'goal'],
    intro: 'The Golden Seeds are gone. A very small hamster has a very big job.'
  },
  {
    id: 'w1-b',
    world: 1,
    name: 'The Great Acorn Heist',
    theme: 'meadow',
    segments: ['bossLeft', 'bossRight', 'bossWall'],
    boss: 'squirrel',
    intro: 'A giant squirrel guards the first Golden Seed. He looks... greedy.',
    outro: 'The squirrel burps, apologises, and hands over a Golden Seed.'
  },
  {
    id: 'w2-1',
    world: 2,
    name: 'The Candy Caverns',
    theme: 'cave',
    segments: ['start', 'flat', 'gap4', 'tunnel', 'beetles', 'checkpoint', 'water', 'secretBreak', 'bats', 'pushblock', 'goal'],
    intro: 'It smells like sugar down here. And bats. Mostly bats.'
  },
  {
    id: 'w2-b',
    world: 2,
    name: 'The Crystalback Toad',
    theme: 'cave',
    segments: ['bossLeft', 'bossRight', 'bossWall'],
    boss: 'toad',
    intro: 'Something enormous is sitting on the second Golden Seed.',
    outro: 'The toad croaks, hiccups a crystal, and rolls away.'
  },
  {
    id: 'w3-1',
    world: 3,
    name: 'Cloudberry Kingdom',
    theme: 'sky',
    segments: ['start', 'flat', 'wind', 'platforms', 'gap4', 'bats', 'birds', 'checkpoint', 'mushroom', 'secretBreak', 'npc', 'goal'],
    intro: 'The clouds are soft. The falls are not. Mind the gap.'
  },
  {
    id: 'w3-b',
    world: 3,
    name: 'Stormwing the Seed Thief',
    theme: 'sky',
    segments: ['bossLeft', 'bossRight', 'bossWall'],
    boss: 'bird',
    intro: 'A bird with a grudge and a very loud voice circles above.',
    outro: 'Stormwing sulks, drops a Golden Seed, and flies off to think about it.'
  },
  {
    id: 'w4-1',
    world: 4,
    name: 'The Pumpkinwood',
    theme: 'forest',
    segments: ['start', 'lanterns', 'wisps', 'gap4', 'spikes', 'checkpoint', 'tunnel', 'secretBreak', 'grove', 'npc', 'goal'],
    intro: 'Spooky. But the pumpkins are smiling, so probably fine.'
  },
  {
    id: 'w4-b',
    world: 4,
    name: 'The Pumpkin King',
    theme: 'forest',
    segments: ['bossLeft', 'bossRight', 'bossWall'],
    boss: 'pumpkin',
    intro: 'The last Golden Seed glows inside a very large vegetable.',
    outro: 'The Golden Seeds are home. The meadow will bloom again.'
  }
];

export function levelById(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

/**
 * Concatenate segments into one grid of ROWS strings.
 *
 * The authored segments leave a lot of headroom above the ground. Shifting the
 * whole grid up by SHIFT rows (and filling the freed rows with solid ground)
 * frames the play area properly instead of showing a screen of empty sky.
 */
const SHIFT = 2;

export function buildGrid(level: LevelDef): string[] {
  const raw: string[] = [];
  for (let r = 0; r < ROWS; r++) raw.push('');
  for (const id of level.segments) {
    const seg = SEGMENTS[id];
    if (!seg) continue;
    for (let r = 0; r < ROWS; r++) {
      const row = seg[r] ?? E;
      raw[r] += row.length >= SEG_W ? row.slice(0, SEG_W) : row.padEnd(SEG_W, '.');
    }
  }
  const width = raw[0]?.length ?? 0;
  const solid = '#'.repeat(width);
  const grid: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    const src = r + SHIFT;
    grid.push(src < ROWS ? raw[src] : solid);
  }
  return grid;
}

/** Dev-time sanity check: every segment must be ROWS tall and SEG_W wide. */
export function validateSegments(): string[] {
  const problems: string[] = [];
  for (const [id, seg] of Object.entries(SEGMENTS)) {
    if (seg.length !== ROWS) problems.push(`${id}: ${seg.length} rows (expected ${ROWS})`);
    seg.forEach((row, i) => {
      if (row.length !== SEG_W) problems.push(`${id}[${i}]: ${row.length} cols (expected ${SEG_W})`);
    });
  }
  return problems;
}

export const LEVEL_ORDER: string[] = LEVELS.map((l) => l.id);
