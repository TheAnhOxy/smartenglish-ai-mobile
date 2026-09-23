// theme/colors.ts — Hệ màu chuẩn hóa SmartEnglish AI
// Đồng bộ với Admin Web: Primary Navy #1F4E79, Secondary Cyan #00B0F0
// Quy tắc: Brand (primary/secondary) TÁCH BIỆT hoàn toàn với Gamification (streak/xp/coin)
// Mỗi màn hình tối đa 2 điểm nhấn màu non-neutral trong cùng 1 khung nhìn

export const colors = {
  // ───── NỀN & CHỮ (neutral, chiếm ~70% diện tích màn hình) ─────
  bg: '#F8FAFC',           // off-white hơi xanh nhạt — matching Admin Web
  surface: '#FFFFFF',
  surfaceMuted: '#F0F4F8', // nền card muted / input bg
  border: '#E2E8F0',       // slate-200 — nhẹ và rõ ràng
  text: '#0F172A',         // slate-900 — đậm, dễ đọc
  textSoft: '#64748B',     // slate-500 — text phụ
  textFaint: '#94A3B8',    // slate-400 — placeholder, hint

  // Dark mode
  bgDark: '#0C1220',
  surfaceDark: '#151E2E',
  surfaceMutedDark: '#1E2A3C',
  borderDark: '#2A3A50',
  textDark: '#F1F5F9',
  textSoftDark: '#94A3B8',

  // ───── BRAND PRIMARY — Navy Deep Blue ─────
  // Màu chủ đạo thương hiệu — đồng bộ với Admin Web #1F4E79
  // Dùng cho: header, active state, nút CTA chính
  primary: '#1F4E79',
  primaryDeep: '#143454',
  primarySoft: '#E8F1F8',   // nền tag/badge brand — xanh navy nhạt
  primaryMid: '#2563A8',    // trung gian giữa primary và secondary
  // Dark mode: sáng hơn để đảm bảo tương phản trên nền tối
  primaryDark: '#4A90D9',
  primaryDeepDark: '#143454',
  primarySoftDark: '#1A2E45',

  // ───── BRAND SECONDARY — Cyan Bright ─────
  // Dùng cho: CTA phụ, accent highlight, link active
  // Tách biệt với primary để phân cấp hành động rõ ràng
  secondary: '#00B0F0',
  secondaryDeep: '#0087C8',
  secondarySoft: '#E6F7FF',  // nền tag/badge secondary
  secondaryDark: '#29C5FF',
  secondarySoftDark: '#0A2233',

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
