import { Platform } from 'react-native';

// Brand palette taken from the web app (frontend/src/styles.css) so both feel like one product.
export const colors = {
  primary: '#D92F4B',
  primaryBright: '#ED3154',
  primaryDark: '#A81E3A',
  primarySoft: '#FFF0F3',
  primaryTint: '#FFE1E7',
  bg: '#FFF8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF5F7',
  text: '#202944',
  textMuted: '#646B80',
  textFaint: '#9CA1B3',
  border: '#F1E3E7',
  borderStrong: '#E3CFD5',
  success: '#16A065',
  successSoft: '#E5F6EE',
  warning: '#D98200',
  warningSoft: '#FFF4E0',
  gold: '#C8963E',
  online: '#22C55E',
  white: '#FFFFFF',
  black: '#0E1020',
  scrim: 'rgba(14, 16, 32, 0.5)',
} as const;

export const gradients = {
  brand: ['#ED3154', '#C2185B'] as const,
  brandSoft: ['#FFF0F3', '#FFF8FA'] as const,
  hero: ['#ED3154', '#C2185B', '#8E1450'] as const,
  photoFade: ['transparent', 'rgba(14,16,32,0.15)', 'rgba(14,16,32,0.85)'] as const,
  gold: ['#E8B65A', '#C8963E'] as const,
};

/** Chat screen: a cool violet-and-white palette, so conversations feel calm next to the red brand screens. */
export const chatTheme = {
  wallpaper: ['#F4F1FF', '#FBF4FF', '#EEF4FF'] as const,
  sent: ['#6366F1', '#8B5CF6'] as const,
  accent: '#7C3AED',
  accentSoft: '#EFE9FF',
  received: '#FFFFFF',
  receivedText: '#1F2544',
  read: '#7DD3FC',
  decor: '#7C3AED',
};

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const type = {
  hero: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
} as const;

export const shadow = {
  card: Platform.select({
    android: { elevation: 3 },
    default: {
      shadowColor: '#7A1230',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
  }),
  raised: Platform.select({
    android: { elevation: 8 },
    default: {
      shadowColor: '#7A1230',
      shadowOpacity: 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
  }),
};
