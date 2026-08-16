export const AppColors = {
  primary: '#FF6B35',
  primaryDark: '#E85A2A',
  secondary: '#0F7173',
  accent: '#FFC93C',
  success: '#2ECC71',
  error: '#FF4D4D',
  warning: '#FFA726',
  neutralInk: '#1A1D29',
  neutralGray: '#6B7280',
  surface: '#F7F5F2',
  cardWhite: '#FFFFFF',
  darkBg: '#12141C',
  darkCard: '#1E212C',

  // SRS Rating Colors
  srsAgain: '#FF4D4D',
  srsHard: '#FFA726',
  srsGood: '#2ECC71',
  srsEasy: '#0F7173',

  // League Colors
  leagueBronze: '#CD7F32',
  leagueSilver: '#C0C0C0',
  leagueGold: '#FFD700',
  leagueDiamond: '#B9F2FF',

  // Errors / Highlight
  errorSpelling: '#FF4D4D',
  errorGrammar: '#FFA726',
  errorWordChoice: '#0F7173'
} as const;

export type AppColorKey = keyof typeof AppColors;
