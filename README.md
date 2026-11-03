# Hamster Tales: The Great Seed Adventure

A complete 2D platformer built with **Phaser 4 + TypeScript**. A small golden hamster
crosses four worlds to recover the Golden Seeds.

Every sprite, tile, background and sound is generated at runtime (Canvas 2D + WebAudio).
There are no binary assets to download and nothing can 404 at play time. The only optional
external file is `public/art/key-art.jpg`, the menu backdrop, and the menu falls back to the
procedural background if it is missing.

---

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:5183
```

## Build it

```bash
npm run build      # type-checks, then emits dist/
npm run preview    # serves dist/ on http://127.0.0.1:4173
```

`dist/` is a plain static bundle (`base: './'`), so it can be dropped on any static host.

---

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or `←` / `→` | Move |
| `Space` | Jump (again in mid-air for double jump once unlocked) |
| `Shift` | Dash (once unlocked) |
| `Down` while running | Roll into a ball (once unlocked) |
| `J` | Throw a seed from your cheeks |
| `E` | Interact: talk to NPCs, open chests, light lanterns |
| `I` | Inventory / achievements |
| `M` | World map |
| `Esc` | Pause |

On touch devices an on-screen pad appears automatically (left/right/jump/dash/throw/down).
It can be forced on or off in Settings.

---

## What is in the game

**4 worlds, 8 levels.** Sunflower Meadows, The Candy Caverns, Cloudberry Kingdom, The
Pumpkinwood. Each world has a main level and a boss level.

**Progression.** Clearing `w1-1` unlocks the double jump, `w1-b` the roll, `w2-b` the dash and
`w3-b` the sniff ability. Each unlock is required somewhere later.

**Movement feel.** Jump physics are derived from a target height (3.5 tiles) and time to apex
(0.35 s), with asymmetric gravity (fall gravity is 1.7x rise), 0.1 s coyote time, 0.13 s jump
buffering, variable jump height, and a 1-tile ledge assist.

**Enemies.** Slimes that hop at you, squirrels that lob acorns, beetles that charge in a straight
line, bats that swoop, birds that steal seeds from your cheeks, and wisps that orbit. Stomping
kills, thrown seeds stun, dashing kills, rolling dizzy-stuns.

**Bosses.** Sir Nibbles, Crystalback, Stormwing and the Pumpkin King. Each cycles three
telegraphed attacks and speeds up as its health drops.

**Systems.** Health with invulnerability frames, checkpoint respawn, hazards (spikes, water,
pits), breakable walls, push blocks, bounce mushrooms, wind columns, lanterns, one-way
platforms, secret walls, hidden seeds, chests, NPC dialogue, quests, achievements, and a
versioned `localStorage` save.

**Audio.** Music and SFX are synthesised live: four distinct world themes plus boss, menu and
victory tracks, a step sequencer with per-theme scales and chord progressions, ~25 sound
effects, and per-world ambience. Music and SFX volumes are independent and persist.

---

## Project layout

```
src/
  art/            procedural texture generation
    draw.ts       canvas primitives (rounded rects, gradients, wrapped drawing)
    palette.ts    shared colours + per-world themes
    characters.ts the hamster (all animation frames), NPCs
    enemies.ts    enemy and boss art
    world.ts      tiles, props, parallax layers, particles
    index.ts      registers every texture and animation with Phaser
  core/
    save.ts       versioned save data, achievements, ability unlocks
    audio.ts      WebAudio music sequencer + SFX + ambience
    input.ts      keyboard + touch with edge detection
  entities/
    Hamster.ts    player controller, abilities, damage
    Enemies.ts    enemy behaviours
    Boss.ts       boss state machine and attack patterns
  levels/
    levels.ts     26 hand-authored 16x20 segments, 8 level definitions
  scenes/
    BootScene.ts  texture build, optional key art load
    MenuScene.ts  main menu
    WorldScene.ts gameplay: terrain, props, collisions, camera, loop
    HUDScene.ts   hearts, counters, boss bar, toasts, dialogue, touch pad
    Overlays.ts   pause, settings, inventory, map, game over, level clear, credits
  main.ts         Phaser config and scene registration
```

### How levels are built

Levels are concatenated from 16x20 tile segments so every gap and ledge sits inside the
verified jump envelope (max 4-tile gap, 3-tile step-up). `buildGrid()` shifts the grid up two
rows and fills the freed rows with solid ground so the play area is framed properly instead of
showing a screen of empty sky. Terrain is baked into per-strip canvas textures (only visible
strips draw) and collision uses merged horizontal runs rather than one body per tile.

---

## Dev scripts

These are development tools, not part of the shipped build.

```bash
node scripts/verify.mjs      # 15 functional checks in a real browser (movement, pickups,
                             # pause, level clear, bosses, all worlds, save, no errors)
node scripts/fastcheck.mjs   # 8 fast state checks, no frame-rate dependency
node scripts/perf.mjs        # frame-rate probe; GPU=1 for a headed hardware-GPU run
node scripts/shot.mjs w1-1   # one screenshot, self-contained server, exits clean
node scripts/gen-art.mjs "<prompt>" public/art/key-art.jpg
```

All of these serve `dist/` themselves and exit clean; run `npm run build` first. They locate
Playwright from the local npx cache. `scripts/perf.mjs` expects a server on port 4173.

---

## Save data

Stored under the key `hamster-tales-save-v1`. New fields are merged over defaults on load, so
older saves keep working. Settings (volumes, mute, touch mode) persist alongside progress.
