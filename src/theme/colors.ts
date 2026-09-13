// theme/colors.ts — Hệ màu chuẩn hóa Loxera English
// Quy tắc: Brand (primary) TÁCH BIỆT hoàn toàn với Gamification (streak/xp/coin)
// Mỗi màn hình tối đa 2 điểm nhấn màu non-neutral trong cùng 1 khung nhìn

export const colors = {
  // ───── NỀN & CHỮ (neutral, chiếm ~70% diện tích màn hình) ─────
  bg: '#FBFBFE',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F0FA',
  border: '#E5E3F2',
  text: '#050315',
  textSoft: '#5D536B',
  textFaint: '#989FCE',

  // Dark mode
  bgDark: '#0E0D1A',
  surfaceDark: '#181730',
  surfaceMutedDark: '#211F38',
  borderDark: '#2C2A47',
  textDark: '#F4F3FB',
  textSoftDark: '#989FCE',

  // ───── BRAND (dùng cho CTA chính, active state, link, focus ring) ─────
  // Màu DUY NHẤT đại diện thương hiệu — dùng tiết chế, KHÔNG phủ khắp màn hình
  // Chỉ ở nơi cần "đây là hành động chính / đây đang active"
  primary: '#2F27CE',
  primaryDeep: '#231CA3',
  primarySoft: '#DEDCFF',   // nền tag/badge thường, KHÔNG dùng cho gamification
  // Dark mode: sáng hơn để đảm bảo tương phản trên nền tối
  primaryDark: '#6C63FF',
  primaryDeepDark: '#231CA3',
  primarySoftDark: '#2A2850',

  // ───── GAMIFICATION — họ màu ẤM, TÁCH HẲN khỏi brand ─────
  // Lửa/XP/Coin có liên tưởng màu tự nhiên — giữ đúng liên tưởng đó
  streak: '#FF7A45',          // lửa streak — cam
  streakDeep: '#E8592A',      // gradient/stroke đậm của streak ring
  streakSoft: '#FFE7DB',      // nền pill số ngày streak
  streakBorder: '#FFD3BE',
  // Dark mode: giảm ~8-10% saturation, đỡ chói trên nền tối
  streakDark: '#FF8A5C',
  streakSoftDark: '#3D2218',

  xp: '#FFC24B',              // tia sét XP — vàng-cam (KHÔNG phải vàng chanh)
  xpDeep: '#F2A400',
  xpSoft: '#FFF3DA',          // nền thanh XP / tag XP
  xpBorder: '#FFE7B3',
  xpDark: '#FFD070',
  xpSoftDark: '#2E2510',

  coin: '#F4B400',            // xu thưởng — vàng kim
  coinDeep: '#B45309',
  coinSoft: '#FFF0BF',
  coinBorder: '#F5C842',
  coinDark: '#F5C842',
  coinSoftDark: '#2A2100',

  // ───── SEMANTIC — đúng/sai/cảnh báo, KHÔNG lẫn với brand hay gamification ─────
  success: '#1FAE7A',
  successSoft: '#DFF5EB',
  successDark: '#2DC98A',
  successSoftDark: '#0D2E20',

  danger: '#E1543F',
  dangerSoft: '#FBE4E0',
  dangerDark: '#F0604A',
  dangerSoftDark: '#2D1410',

  warning: '#E3A63E',
  warningSoft: '#FBF0DC',
  warningDark: '#F0B84A',
  warningSoftDark: '#2A2008',
};

// Alias để tương thích với code cũ
export const palette = {
  ...colors,
  // Mapping màu cũ sang tên mới (backward compat)
  accent: colors.streak,       // code cũ dùng accent cho streak — giờ phải đúng màu cam
  ink: colors.text,
  plum: colors.textSoft,
  mauve: '#7D6B91',
  periwinkle: colors.textFaint,
  blue: '#347FC4',
};

export type ThemeColors = typeof colors;
export type PaletteColors = typeof palette;
