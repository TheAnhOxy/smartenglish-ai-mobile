// theme/darkColorMap.ts — Quy đổi màu giao diện sáng → tối theo vai trò của màu (nền / chữ / viền).
// Dùng cho các màu viết cứng trong StyleSheet: giữ sắc độ (hue) gốc để màn tối vẫn "có màu", không xám xịt.

export type ColorRole = 'bg' | 'text' | 'border';

/** Bảng màu nền tối dùng chung (đồng bộ với ds/colors bản tối). */
export const DARK = {
  bg: '#0A1120',
  card: '#131D31',
  cardRaised: '#1A2740',
  line: '#24334D',
  ink: '#EAF2FB',
  inkSoft: '#C9D7E8',
  muted: '#9AABC2',
  faint: '#6F819B',
} as const;

interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
  /** Chênh lệch kênh màu lớn nhất–nhỏ nhất (0–1): đo "có màu" ổn định hơn độ bão hoà HSL ở màu rất sáng. */
  chroma?: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const parseHex = (value: string): Hsl | null => {
  const m = HEX.exec(value.trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length <= 4) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l, a, chroma: max - min };
};

const toHex = ({ h, s, l, a }: Hsl): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const hex = rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  return `#${hex}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`.toUpperCase();
};

const NAMED: Record<string, string> = { white: '#FFFFFF', black: '#000000' };

/** Màu chữ tối hay dùng → đúng màu chữ sáng chuẩn (thay vì quy đổi ước lượng). */
const EXACT_TEXT: Record<string, string> = {
  '#0F2A44': DARK.ink,
  '#0F172A': DARK.ink,
  '#1A1D29': DARK.ink,
  '#1E293B': DARK.ink,
  '#111827': DARK.ink,
  '#000000': DARK.ink,
  '#1B3A5C': DARK.inkSoft,
  '#334155': DARK.inkSoft,
  '#1E3A5F': '#9CC3EC',
  '#5B6B7F': DARK.muted,
  '#64748B': DARK.muted,
  '#6B7280': DARK.muted,
  '#475569': DARK.muted,
  '#8597AB': DARK.faint,
  '#94A3B8': DARK.faint,
};

/**
 * Màu sáng → tối theo vai trò. Màu không cần đổi (nút màu đậm, chữ trắng, rgba…) giữ nguyên.
 * - bg: nền trắng/xám nhạt → nền tối; nền pastel → bản tối cùng sắc.
 * - text: chữ đen/xám → chữ sáng; chữ màu đậm → bản sáng cùng sắc.
 * - border: viền nhạt → viền tối.
 */
export const toDarkColor = (value: unknown, role: ColorRole): unknown => {
  if (typeof value !== 'string') return value;
  const hsl = parseHex(NAMED[value.toLowerCase()] ?? value);
  if (!hsl) return value;
  const { s, l } = hsl;
  const chroma = hsl.chroma ?? 0;
  // Nền/viền: < 0.09 coi như trắng/xám (#F4F7FB, #E2E8F0…); chữ: dùng độ bão hoà như thường
  const neutralSurface = chroma < 0.09;
  const neutral = s < 0.22;

  if (role === 'bg') {
    if (l >= 0.985) return DARK.card;
    if (l >= 0.9) return neutralSurface ? DARK.bg : toHex({ ...hsl, s: Math.min(s, 0.55), l: 0.17 });
    if (l >= 0.78) return neutralSurface ? DARK.cardRaised : toHex({ ...hsl, s: Math.min(s, 0.6), l: 0.24 });
    return value;
  }
  if (role === 'border') {
    if (l >= 0.8) return neutralSurface ? DARK.line : toHex({ ...hsl, s: Math.min(s, 0.55), l: 0.3 });
    return value;
  }
  // text
  const exact = EXACT_TEXT[(NAMED[value.toLowerCase()] ?? value).toUpperCase()];
  if (exact) return exact;
  if (neutral) {
    if (l <= 0.3) return DARK.ink;
    if (l <= 0.45) return DARK.inkSoft;
    if (l <= 0.62) return DARK.muted;
    return value;
  }
  if (l <= 0.45) return toHex({ ...hsl, l: Math.max(0.68, 1 - l) });
  return value;
};

const ROLE_BY_PROP: Record<string, ColorRole> = {
  backgroundColor: 'bg',
  color: 'text',
  borderColor: 'border',
  borderTopColor: 'border',
  borderBottomColor: 'border',
  borderLeftColor: 'border',
  borderRightColor: 'border',
  borderStartColor: 'border',
  borderEndColor: 'border',
  textDecorationColor: 'text',
  placeholderTextColor: 'text',
};

/** Đổi các thuộc tính màu của một style object (không đụng object gốc). */
export const toDarkStyle = <T extends Record<string, unknown>>(style: T): T => {
  let changed: Record<string, unknown> | null = null;
  for (const key of Object.keys(style)) {
    const role = ROLE_BY_PROP[key];
    if (!role) continue;
    const next = toDarkColor(style[key], role);
    if (next !== style[key]) {
      changed = changed ?? { ...style };
      changed[key] = next;
    }
  }
  return (changed as T) ?? style;
};
