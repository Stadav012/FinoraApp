/**
 * Finora Design Tokens
 * 
 * Clean, sophisticated light-mode aesthetic with Dimension-inspired
 * typography precision and Finora brand colors.
 */

export const Colors = {
  // Surfaces (Light Mode)
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceElevated: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.04)',

  // Text
  text: '#0a0a0a',
  textSecondary: '#686868',
  textTertiary: '#b2b2b2',

  // Borders
  border: '#e5e5e5',
  borderSubtle: '#f0f0f0',

  // Finora Brand
  finoraGreen: '#58cc02',
  finoraGreenDark: '#46a302',
  finoraSkyBlue: '#1cb0f6',
  finoraYellow: '#ffc700',

  // Accents
  interactiveGlow: '#6b62f2',

  // Status bar
  statusBar: 'dark' as const,
};

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

export const BorderRadius = {
  md: 4,
  lg: 10,
  '2xl': 19,
  '3xl': 24,
  '4xl': 40,
  full: 64,
  pill: 9999,
};
