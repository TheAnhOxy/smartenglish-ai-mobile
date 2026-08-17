export const AppColors = {
  primary: '#0EA5E9',        // Soft Sky Blue
  primaryDark: '#0284C7',    // Deep Sky Blue
  secondary: '#1E3A5F',      // Navy Blue
  accent: '#38BDF8',         // Light Blue Accent
  success: '#2ECC71',
  error: '#FF4D4D',
  warning: '#FFA726',
  neutralInk: '#1A1D29',
  neutralGray: '#6B7280',
  surface: '#F0F7FF',        // Soft Light Blue Background
  cardWhite: '#FFFFFF',
  darkBg: '#12141C',
  darkCard: '#1E212C',

  // SRS Rating Colors
  srsAgain: '#FF4D4D',
  srsHard: '#FFA726',
  srsGood: '#2ECC71',
  srsEasy: '#0EA5E9',

  // League Colors
  leagueBronze: '#CD7F32',
  leagueSilver: '#C0C0C0',
  leagueGold: '#FFD700',
  leagueDiamond: '#B9F2FF',

  // Errors / Highlight
  errorSpelling: '#FF4D4D',
  errorGrammar: '#FFA726',
  errorWordChoice: '#0EA5E9'
} as const;

export type AppColorKey = keyof typeof AppColors;
