import { palette } from './colors';
import { font } from './typography';

export const theme = {
  colors: palette,
  font,
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    soft: {
      shadowColor: '#050315',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: '#2F27CE',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};

export { palette, font };
