export interface AppThemeColors {
  primary: string;
  primaryMedium: string;
  primaryLight: string;
  primaryBorder: string;
  headerBg: string;
  headerBorder: string;

  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceBorder: string;
  cardBorder: string;
  cardBg: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  rose: string;
  roseLight: string;
  roseBorder: string;

  amber: string;
  amberLight: string;
  amberBorder: string;

  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface AppTheme {
  dark: boolean;
  colors: AppThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

const COMMON_METRICS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};

export const LIGHT_THEME: AppTheme = {
  dark: false,
  colors: {
    primary: '#166534', // Emerald 800
    primaryMedium: '#059669', // Emerald 600
    primaryLight: '#ecfdf5', // Emerald 50
    primaryBorder: '#a7f3d0', // Emerald 200
    headerBg: '#166534',
    headerBorder: '#14532d',

    background: '#f8fafc', // Slate 50
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9', // Slate 100
    surfaceBorder: '#f1f5f9', // Slate 100
    cardBorder: '#e2e8f0', // Slate 200
    cardBg: '#ffffff',

    textPrimary: '#0f172a', // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94a3b8', // Slate 400

    rose: '#e11d48',
    roseLight: '#fff1f2',
    roseBorder: '#ffe4e6',

    amber: '#d97706',
    amberLight: '#fffbeb',
    amberBorder: '#fef3c7',

    tabBarBg: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#166534',
    tabBarInactive: '#94a3b8',
  },
  ...COMMON_METRICS,
};

export const DARK_THEME: AppTheme = {
  dark: true,
  colors: {
    primary: '#10b981', // Emerald 500
    primaryMedium: '#059669',
    primaryLight: '#064e3b', // Deep forest emerald
    primaryBorder: '#065f46',
    headerBg: '#0b2318', // Deep forest night
    headerBorder: '#133a28',

    background: '#090d16', // Deep midnight slate
    surface: '#131b2e', // Elevated dark surface
    surfaceSubtle: '#182238',
    surfaceBorder: '#1e293b',
    cardBorder: '#1e293b',
    cardBg: '#131b2e',

    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',

    rose: '#fb7185',
    roseLight: '#4c0519',
    roseBorder: '#881337',

    amber: '#fbbf24',
    amberLight: '#451a03',
    amberBorder: '#78350f',

    tabBarBg: '#0b1120',
    tabBarBorder: '#1e293b',
    tabBarActive: '#4ade80',
    tabBarInactive: '#64748b',
  },
  ...COMMON_METRICS,
};

// Default export for backward compatibility
export const THEME = LIGHT_THEME;
