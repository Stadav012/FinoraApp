/**
 * Finora Design Tokens
 *
 * Dual-mode palette (light + dark) with shared typography,
 * spacing, and border-radius tokens.
 */

// ── Color type ──
export type ColorPalette = Omit<typeof LightColors, 'statusBar'> & { statusBar: 'dark' | 'light' };

// ── Light Palette ──
export const LightColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceElevated: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.04)',

  text: '#0a0a0a',
  textSecondary: '#686868',
  textTertiary: '#b2b2b2',

  border: '#e5e5e5',
  borderSubtle: '#f0f0f0',

  finoraGreen: '#58cc02',
  finoraGreenDark: '#46a302',
  finoraSkyBlue: '#1cb0f6',
  finoraYellow: '#ffc700',

  interactiveGlow: '#6b62f2',
  statusBar: 'dark' as const,
};

// ── Dark Palette ──
export const DarkColors: ColorPalette = {
  background: '#000000', // True OLED Black
  surface: '#111111',    // Deep matte black cards
  surfaceElevated: '#1a1a1a', // Nav bar
  overlay: 'rgba(255, 255, 255, 0.08)',

  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textTertiary: '#666666',

  border: '#222222',
  borderSubtle: '#181818',

  finoraGreen: '#58cc02',
  finoraGreenDark: '#6ddb22',
  finoraSkyBlue: '#1cb0f6',
  finoraYellow: '#ffc700',

  interactiveGlow: '#8b82ff',
  statusBar: 'light' as const,
};

// ── Default export for backward compatibility ──
// Screens that haven't migrated to useTheme() yet still work.
export const Colors = LightColors;

// ── Typography ──
export const Typography = {
  fonts: {
    heading: 'System',
    body: 'System',
  },

  sizes: {
    caption: 14,
    body: 16,
    subheading: 18,
    headingSm: 24,
    heading: 32,
    headingLg: 36,
    display: 48,
  },

  lineHeights: {
    caption: 21,
    body: 24,
    subheading: 27,
    headingSm: 32,
    heading: 36,
    headingLg: 40,
    display: 48,
  },

  letterSpacing: {
    caption: 0.35,
    body: 0.4,
    subheading: 0.45,
    headingSm: 0,
    heading: 0,
    headingLg: 0,
    display: -0.672,
  },
};

// ── Spacing ──
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
  '5xl': 44,
  '6xl': 48,
  '7xl': 56,
  '8xl': 64,
};

// ── Border Radius ──
export const BorderRadius = {
  md: 4,
  lg: 10,
  '2xl': 19,
  '3xl': 24,
  '4xl': 40,
  full: 64,
  pill: 9999,
};
