/** Shared colour palette. One source of truth so every world stays harmonious. */

export const FUR = {
  base: '#E3A455',
  dark: '#C4853A',
  deep: '#A96C2C',
  light: '#F5C57E',
  belly: '#FFF7E8',
  ear: '#F2A9A4',
  nose: '#E8798B',
  eye: '#2B1B2E',
  eyeHi: '#FFFFFF',
  scarf: '#4FA36B',
  scarfDark: '#37794E',
  pack: '#A9713F',
  packDark: '#84522A'
};

export const UI = {
  cream: '#FFF3D6',
  ink: '#3A2340',
  inkSoft: '#5B3D63',
  gold: '#FFCB4D',
  goldDeep: '#E8A32C',
  panel: '#2A1B44',
  panelLight: '#3B285C',
  green: '#7FD47F',
  red: '#F2637B',
  blue: '#69C8F2',
  purple: '#B084F5'
};

export interface Theme {
  key: string;
  name: string;
  subtitle: string;
  sky: [string, string, string];
  far: string;
  mid: string;
  near: string;
  groundTop: string;
  groundBody: string;
  groundDark: string;
  accent: string;
  accent2: string;
  fog: string;
  music: 'meadow' | 'cave' | 'sky' | 'forest';
  ambient: 'birds' | 'drips' | 'wind' | 'fireflies';
}

export const THEMES: Record<string, Theme> = {
  meadow: {
    key: 'meadow',
    name: 'Sunflower Meadows',
    subtitle: 'Where every adventure begins',
    sky: ['#8FD8F5', '#BEEAF7', '#E7F7D9'],
    far: '#9BD9A8',
    mid: '#77C489',
    near: '#4FA96B',
    groundTop: '#6FC24E',
    groundBody: '#A9743F',
    groundDark: '#7C4F27',
    accent: '#FFD34E',
    accent2: '#FF8A5C',
    fog: 'rgba(255,247,214,0.35)',
    music: 'meadow',
    ambient: 'birds'
  },
  cave: {
    key: 'cave',
    name: 'The Candy Caverns',
    subtitle: 'Sweet crystals in the deep',
    sky: ['#2A1A46', '#452A6B', '#6B3F8C'],
    far: '#3B2359',
    mid: '#543178',
    near: '#7345A0',
    groundTop: '#C86FA8',
    groundBody: '#8A4585',
    groundDark: '#5C2B5E',
    accent: '#7DE3F5',
    accent2: '#F58AC8',
    fog: 'rgba(125,227,245,0.14)',
    music: 'cave',
    ambient: 'drips'
  },
  sky: {
    key: 'sky',
    name: 'Cloudberry Kingdom',
    subtitle: 'Islands adrift in the blue',
    sky: ['#4FA8E8', '#8FD0F5', '#D8F0FF'],
    far: '#B9E2FA',
    mid: '#8FCDEF',
    near: '#6FB6E4',
    groundTop: '#9BE07A',
    groundBody: '#E7F3FF',
    groundDark: '#B7D4EC',
    accent: '#FFB4D6',
    accent2: '#FFF3A8',
    fog: 'rgba(255,255,255,0.4)',
    music: 'sky',
    ambient: 'wind'
  },
  forest: {
    key: 'forest',
    name: 'The Pumpkinwood',
    subtitle: 'Spooky, but only a little',
    sky: ['#1A1030', '#2E1B47', '#4A2A5C'],
    far: '#2A1A3E',
    mid: '#3D2555',
    near: '#523268',
    groundTop: '#8A5AA8',
    groundBody: '#3A2342',
    groundDark: '#241329',
    accent: '#FF9A3C',
    accent2: '#6FE8D8',
    fog: 'rgba(110,80,160,0.2)',
    music: 'forest',
    ambient: 'fireflies'
  }
};
