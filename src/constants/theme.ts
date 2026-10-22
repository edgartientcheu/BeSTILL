/**
 * BE STILL design tokens: soft warm neutrals with one muted sage accent.
 * Every text/background pair here meets WCAG AA contrast (4.5:1 or better).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F7F4EF', // warm linen
    surface: '#FFFFFF',
    surfaceMuted: '#EFEAE2',
    border: '#E2DCD2',
    text: '#2B2A28',
    textSecondary: '#625E57',
    accent: '#5B7660', // muted sage
    accentSoft: '#DDE6DD',
    onAccent: '#FFFFFF',
  },
  dark: {
    background: '#171614',
    surface: '#22211E',
    surfaceMuted: '#2C2A26',
    border: '#38352F',
    text: '#EEEAE3',
    textSecondary: '#ADA79C',
    accent: '#A3BCA6',
    accentSoft: '#2F3A31',
    onAccent: '#171614',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Fonts = Platform.select({
  ios: { sans: 'System', serif: 'Georgia' },
  android: { sans: 'sans-serif', serif: 'serif' },
  default: { sans: 'var(--font-sans)', serif: 'var(--font-serif)' },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Minimum size for anything tappable (Apple/Google accessibility guidance). */
export const MinTapSize = 48;

/** Content never stretches wider than this on tablets and desktop browsers. */
export const MaxContentWidth = 640;
