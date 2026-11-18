// theme/ds.ts — Bộ token giao diện mới (Trang chủ, Trắc nghiệm, Flashcard, Luyện nói, Kết quả).
// Tách riêng khỏi colors.ts để thanh tab và các màn chưa làm lại giữ nguyên giao diện cũ.

export const ds = {
  ink: '#0F2A44',
  inkSoft: '#1B3A5C',
  bg: '#F4F7FB',
  card: '#FFFFFF',
  line: '#E3EAF2',
  lineStrong: '#CBD6E2',
  muted: '#5B6B7F',
  faint: '#8597AB',

  sky: '#0EA5E9',
  skySoft: '#E0F2FE',
  skyLight: '#7DD3FC',
  btn: '#0369A1',
  btnEdge: '#023E5F',

  amber: '#F59E0B',
  amberDeep: '#D97706',
  amberSoft: '#FEF3C7',
  amberText: '#B45309',

  heart: '#E8590C',
  heartDeep: '#C2410C',

  green: '#16A34A',
  greenEdge: '#0F7A36',
  greenSoft: '#DCFCE7',
  greenText: '#166534',

  red: '#DC2626',
  redEdge: '#991B1B',
  redSoft: '#FEE2E2',
  redText: '#991B1B',

  white: '#FFFFFF',
  onInk: 'rgba(255,255,255,0.72)',
  onInkFaint: 'rgba(255,255,255,0.14)',
} as const;

export const dsFont = {
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  body: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

// Thang cỡ chữ cố định
export const dsSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 40,
} as const;

export const dsRadius = { sm: 12, md: 16, lg: 20, xl: 24, full: 999 } as const;

export const dsShadow = {
  card: {
    shadowColor: '#0F2A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  lift: {
    shadowColor: '#0F2A44',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
