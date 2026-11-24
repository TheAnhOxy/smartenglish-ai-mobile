// theme/themeMode.ts — Giao diện Sáng / Tối / Theo hệ thống cho toàn app.
//
// PHẢI được import ĐẦU TIÊN trong app/_layout.tsx (trước mọi màn hình), vì:
//  1. Đổi giá trị token (ds, colors, palette, AppColors) sang bản tối trước khi màn hình đọc chúng.
//  2. Bọc StyleSheet.create: ghi nhớ mọi style để đổi màu viết cứng (nền/chữ/viền) theo theme,
//     và đổi lại ngay khi người dùng chuyển theme — không cần khởi động lại app.
import { Appearance, StyleSheet } from 'react-native';
import { colorScheme as nativewindScheme } from 'nativewind';
import Storage from 'expo-sqlite/kv-store';
import { ds } from './ds';
import { colors, palette } from './colors';
import { AppColors } from '@/src/core/theme/colors';
import { DARK, toDarkColor, toDarkStyle, type ColorRole } from './darkColorMap';

export type ThemePref = 'light' | 'dark' | 'system';
type Tokens = Record<string, string>;

const STORAGE_KEY = 'theme_pref';

// ── Bộ màu tối: nền navy sâu, màu nhấn sáng và bão hoà hơn để nổi bật ───────────────────────
const DS_DARK: Tokens = {
  ink: DARK.ink,
  inkSoft: DARK.inkSoft,
  bg: DARK.bg,
  card: DARK.card,
  line: DARK.line,
  lineStrong: '#33466A',
  muted: DARK.muted,
  faint: DARK.faint,
  sky: '#38BDF8',
  skySoft: '#0B2A42',
  skyLight: '#7DD3FC',
  btn: '#0EA5E9',
  btnEdge: '#075985',
  amber: '#FBBF24',
  amberDeep: '#F59E0B',
  amberSoft: '#3A2A0A',
  amberText: '#FCD34D',
  heart: '#FB7A3C',
  heartDeep: '#EA580C',
  green: '#22C55E',
  greenEdge: '#15803D',
  greenSoft: '#0E2E1C',
  greenText: '#86EFAC',
  red: '#F87171',
  redEdge: '#B91C1C',
  redSoft: '#3A1418',
  redText: '#FCA5A5',
  hero: '#14254A',
  heroSoft: '#1C3364',
};

const COLORS_DARK: Tokens = {
  bg: DARK.bg,
  surface: DARK.card,
  surfaceMuted: DARK.cardRaised,
  border: DARK.line,
  text: DARK.ink,
  textSoft: DARK.muted,
  textFaint: DARK.faint,
  primary: '#4A90D9',
  primaryDeep: '#2563A8',
  primarySoft: '#16304D',
  primaryMid: '#3B82F6',
  secondary: '#29C5FF',
  secondaryDeep: '#0EA5E9',
  secondarySoft: '#0A2233',
  streak: '#FF8A5C',
  streakSoft: '#3D2218',
  streakBorder: '#5A2E1C',
  xp: '#FFD070',
  xpSoft: '#2E2510',
  xpBorder: '#4A3A12',
  coin: '#F5C842',
  coinSoft: '#2A2100',
  coinBorder: '#6B5410',
  success: '#2DC98A',
  successSoft: '#0D2E20',
  danger: '#F0604A',
  dangerSoft: '#2D1410',
  warning: '#F0B84A',
  warningSoft: '#2A2008',
};

const PALETTE_DARK: Tokens = {
  ...COLORS_DARK,
  accent: COLORS_DARK.streak,
  ink: COLORS_DARK.text,
  plum: COLORS_DARK.textSoft,
  periwinkle: COLORS_DARK.textFaint,
};

const APP_DARK: Tokens = {
  primary: '#38BDF8',
  primaryDark: '#0EA5E9',
  secondary: '#7FB3E8',
  accent: '#7DD3FC',
  neutralInk: DARK.ink,
  neutralGray: DARK.muted,
  surface: DARK.bg,
  cardWhite: DARK.card,
};

// ── Trạng thái theme dùng chung, SỐNG QUA các lần nạp lại module (Fast Refresh) ──────────────
// Lỗi cũ: mỗi lần nạp lại, module chạy lại từ đầu → mất danh sách style đã tạo (đổi về Sáng thì style cũ vẫn tối)
// và nếu lúc đó đang Tối thì chụp nhầm màu tối làm "bản gốc sáng" → giao diện sáng bị trộn màu.
type StyleObj = Record<string, unknown>;
interface ThemeState {
  /** Bản token sáng GỐC (chụp một lần duy nhất lúc khởi động đầu tiên). */
  light: Tokens[];
  registry: { target: StyleObj; light: StyleObj }[];
  pref: ThemePref;
  dark: boolean;
  version: number;
  listeners: Set<() => void>;
  appearanceHooked: boolean;
  /** Mọi bản object token đã thấy (file token cũng có thể bị nạp lại → nhiều bản cùng tồn tại). */
  tokenGroups: Tokens[][];
  /** Mốc thời gian (ms) tới đó coi như "đang đổi theme": tắt hiệu ứng chuyển màn để không bị lật/trượt. */
  switchingUntil: number;
}

const readPref = (): ThemePref => {
  try {
    const v = Storage.getItemSync(STORAGE_KEY);
    return v === 'dark' || v === 'system' || v === 'light' ? v : 'light';
  } catch {
    return 'light';
  }
};

const resolveDark = (p: ThemePref) => p === 'dark' || (p === 'system' && Appearance.getColorScheme() === 'dark');

const tokenObjects: Tokens[] = [ds, colors, palette, AppColors] as unknown as Tokens[];
const G = globalThis as unknown as { __smartEnglishTheme?: ThemeState };
if (!G.__smartEnglishTheme) {
  const initialPref = readPref();
  G.__smartEnglishTheme = {
    light: tokenObjects.map((o) => ({ ...o })),
    registry: [],
    pref: initialPref,
    dark: resolveDark(initialPref),
    version: 0,
    listeners: new Set(),
    appearanceHooked: false,
    tokenGroups: [],
    switchingUntil: 0,
  };
}
const S = G.__smartEnglishTheme;
if (!S.tokenGroups.some((g) => g[0] === tokenObjects[0])) S.tokenGroups.push(tokenObjects);

const targets: [Tokens, Tokens, Tokens][] = [
  [tokenObjects[0], S.light[0], DS_DARK],
  [tokenObjects[1], S.light[1], COLORS_DARK],
  [tokenObjects[2], S.light[2], PALETTE_DARK],
  [tokenObjects[3], S.light[3], APP_DARK],
];

/**
 * "Đánh dấu" màu token bản tối: lệch kênh xanh dương `offset` đơn vị (mắt không phân biệt được).
 * Lý do: style tạo ra khi app đang tối chứa giá trị token tối và phải dịch ngược về bản sáng khi đổi theme.
 * Nhiều màu tối (#0EA5E9, #FBBF24, #22C55E…) trùng với màu sáng viết cứng ở chỗ khác → dịch ngược theo giá trị
 * sẽ làm sai cả các màu viết cứng đó (lỗi "về giao diện sáng không như cũ"). Màu đã đánh dấu thì không trùng.
 */
const tagColor = (hex: string, offset: number): string => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const b = parseInt(m[1].slice(4, 6), 16);
  const nb = b + offset <= 255 ? b + offset : b - offset;
  return `#${m[1].slice(0, 4)}${nb.toString(16).padStart(2, '0')}`.toUpperCase();
};
targets.forEach(([, , darkSet], idx) => {
  // ds: +1 · colors & palette: +2 (palette dùng chung giá trị với colors) · AppColors: +3
  const offset = idx === 0 ? 1 : idx === 3 ? 3 : 2;
  for (const key of Object.keys(darkSet)) darkSet[key] = tagColor(darkSet[key], offset);
});

// Màu token bản tối (đã đánh dấu) → bản sáng
const darkToLight = new Map<string, string>();
for (const [, light, darkSet] of targets) {
  for (const key of Object.keys(darkSet)) {
    if (light[key] && light[key] !== darkSet[key] && !darkToLight.has(darkSet[key])) darkToLight.set(darkSet[key], light[key]);
  }
}

const applyTokens = (isDark: boolean) => {
  for (const group of S.tokenGroups) {
    group.forEach((target, i) => {
      Object.assign(target, S.light[i]);
      if (isDark) Object.assign(target, targets[i][2]);
    });
  }
};

// ── Bọc StyleSheet.create ───────────────────────────────────────────────────────────────────
const toLightStyle = (style: StyleObj): StyleObj => {
  let out: StyleObj | null = null;
  for (const key of Object.keys(style)) {
    const v = style[key];
    if (typeof v === 'string' && darkToLight.has(v)) {
      out = out ?? { ...style };
      out[key] = darkToLight.get(v);
    }
  }
  return out ?? style;
};

const fill = (target: StyleObj, source: StyleObj) => {
  // Object bị đóng băng (không phải do mình tạo) thì bỏ qua — không được làm crash app
  if (Object.isFrozen(target)) return;
  try {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, source);
  } catch {
    // bỏ qua
  }
};

// Không gọi StyleSheet.create gốc: bản dev của nó Object.freeze từng style ("Property is not configurable"
// khi đổi theme). Bản gốc chỉ kiểm tra + đóng băng, trả lại đúng object — trả trực tiếp là tương đương.
(StyleSheet as unknown as { create: (s: Record<string, unknown>) => unknown }).create = (styles: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(styles)) {
    const style = styles[name];
    if (style && typeof style === 'object' && !Array.isArray(style)) {
      const light = S.dark ? toLightStyle(style as StyleObj) : (style as StyleObj);
      const target: StyleObj = { ...(S.dark ? toDarkStyle(light) : light) };
      S.registry.push({ target, light });
      out[name] = target;
    } else {
      out[name] = style;
    }
  }
  return out;
};

const applyStyles = (isDark: boolean) => {
  for (const { target, light } of S.registry) fill(target, isDark ? toDarkStyle(light) : light);
};

const syncNativewind = (isDark: boolean) => {
  try {
    nativewindScheme.set(isDark ? 'dark' : 'light');
  } catch {
    // web/test: bỏ qua
  }
};

applyTokens(S.dark);
syncNativewind(S.dark);

const apply = (nextDark: boolean) => {
  if (nextDark === S.dark) return;
  S.dark = nextDark;
  S.switchingUntil = Date.now() + 1500;
  applyTokens(S.dark);
  applyStyles(S.dark);
  syncNativewind(S.dark);
  S.version += 1;
  S.listeners.forEach((l) => l());
};

// Theo hệ thống: đổi khi máy chuyển sáng/tối (gắn một lần, không nhân đôi khi nạp lại)
if (!S.appearanceHooked) {
  S.appearanceHooked = true;
  Appearance.addChangeListener(() => {
    if (S.pref === 'system') apply(resolveDark('system'));
  });
}

export const isDarkTheme = () => S.dark;
/** Vừa đổi theme (≈1,5 giây): các navigator tắt hiệu ứng chuyển màn. */
export const isThemeSwitching = () => Date.now() < (S.switchingUntil ?? 0);
export const getThemePref = () => S.pref;
export const getThemeVersion = () => S.version;

export const setThemePref = (next: ThemePref) => {
  S.pref = next;
  try {
    Storage.setItemSync(STORAGE_KEY, next);
  } catch {
    // vẫn áp dụng cho phiên hiện tại
  }
  apply(resolveDark(next));
  S.listeners.forEach((l) => l());
};

export const subscribeTheme = (listener: () => void) => {
  S.listeners.add(listener);
  return () => {
    S.listeners.delete(listener);
  };
};

/**
 * Màu viết thẳng trong JSX (style={{...}}, color="#..."): StyleSheet.create đã được đổi màu tự động,
 * còn style inline thì không — bọc bằng dk() để đổi theo giao diện tối. Chế độ sáng trả nguyên màu.
 * Đánh giá lúc render; đổi theme sẽ vẽ lại cả cây giao diện nên luôn đúng.
 */
export const dk = (color: string, role: ColorRole = 'text'): string =>
  S.dark ? (toDarkColor(color, role) as string) : color;

/** Bộ token `ds` GỐC (giao diện sáng), không đổi theo theme — cho màn cần giữ nguyên thiết kế (đăng nhập/đăng ký). */
export const DS_LIGHT = { ...(S.light[0] as Record<string, string>) } as unknown as typeof ds;

/**
 * Như StyleSheet.create nhưng KHÔNG qua bộ đổi màu giao diện tối — style giữ nguyên màu đã viết.
 * Dùng cho màn luôn giữ thiết kế gốc (đăng nhập/đăng ký).
 */
export const staticStyles = ((styles: unknown) => styles) as typeof StyleSheet.create;
