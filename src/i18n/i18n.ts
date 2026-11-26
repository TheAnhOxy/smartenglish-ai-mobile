/**
 * Đa ngôn ngữ Việt / Anh.
 *
 * Giao diện viết bằng tiếng Việt, nên câu tiếng Việt chính là khóa dịch:
 *  - locales/en.json: "câu tiếng Việt" → "English text" (biến dùng {0}, {1}...)
 *  - locales/vi.json: chỉnh lại câu tiếng Việt nếu cần (mặc định giữ nguyên chữ trong code)
 *
 * bootstrap.ts dịch tự động mọi <Text>, placeholder, Alert khi đang ở tiếng Anh, nên màn hình
 * không phải sửa logic. Muốn dịch chuỗi ngoài giao diện thì gọi t('Câu tiếng Việt', ...giá trị).
 */
import Storage from 'expo-sqlite/kv-store';
import en from './locales/en.json';
import vi from './locales/vi.json';

export type AppLanguage = 'vi' | 'en';

const STORAGE_KEY = 'app_language';
/** Ký tự vô hình: đặt đầu chuỗi để KHÔNG dịch (vd. tên ngôn ngữ "Tiếng Việt" luôn giữ nguyên). */
export const NO_TRANSLATE = '⁠';

const VI_CHARS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
export const hasVietnamese = (s: string) => VI_CHARS.test(s);

type State = { lang: AppLanguage; version: number; listeners: Set<() => void> };
const G = globalThis as unknown as { __smartEnglishLang?: State };

const readSaved = (): AppLanguage => {
  try {
    return Storage.getItemSync(STORAGE_KEY) === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
};

// Giữ trạng thái qua Fast Refresh
const S: State = G.__smartEnglishLang ?? (G.__smartEnglishLang = { lang: readSaved(), version: 0, listeners: new Set() });

const EN = en as Record<string, string>;
const VI = vi as Record<string, string>;

// ---------- Mẫu có biến: "Còn {0}/{1} lượt" → regex ----------
type Pattern = { re: RegExp; key: string; literal: number };
const PLACEHOLDER = /\{(\d+)\}/g;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildPatterns = (dict: Record<string, string>): Pattern[] =>
  Object.keys(dict)
    .filter((k) => /\{\d+\}/.test(k))
    .map((key) => {
      const parts = key.split(/\{\d+\}/);
      const literal = parts.join('').length;
      // Hai biến liền nhau ("{0}{1}", vd. trình độ + hậu tố tùy chọn): biến đầu là một cụm không có
      // khoảng trắng (C1, 15...), biến sau là phần còn lại (có thể rỗng)
      let src = '^' + escapeRe(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        const firstOfPair = i < parts.length - 1 && parts[i] === '';
        const secondOfPair = i > 1 && parts[i - 1] === '';
        src += (firstOfPair ? '(\\S+)' : secondOfPair ? '([\\s\\S]*)' : '([\\s\\S]+?)') + escapeRe(parts[i]);
      }
      const re = new RegExp(src + '$');
      return { re, key, literal };
    })
    // mẫu có nhiều chữ cố định hơn được thử trước (cụ thể hơn)
    .filter((p) => p.literal >= 2)
    .sort((a, b) => b.literal - a.literal);

let patterns: Pattern[] | null = null;
const getPatterns = () => (patterns ??= buildPatterns(EN));

const cache = new Map<string, string>();
const remember = (k: string, v: string) => {
  if (cache.size > 4000) cache.clear();
  cache.set(k, v);
  return v;
};

const fill = (template: string, values: string[]) =>
  template.replace(PLACEHOLDER, (_, i: string) => (values[Number(i)] !== undefined ? values[Number(i)] : `{${i}}`));

/** Dịch phần lõi (đã trim). Trả về null nếu không có bản dịch. */
const translateCore = (core: string, depth = 0): string | null => {
  const exact = EN[core] ?? EN[core.replace(/\s+/g, ' ')];
  if (exact !== undefined) return exact;
  if (depth > 2) return null;
  for (const p of getPatterns()) {
    const m = p.re.exec(core);
    if (!m) continue;
    const values: string[] = [];
    let ok = true;
    for (const raw of m.slice(1)) {
      // Giá trị điền vào chỗ trống: số/tên giữ nguyên; nếu là chữ Việt thì phải dịch được
      if (/^\{\d+\}$/.test(raw) || !hasVietnamese(raw)) {
        values.push(raw);
        continue;
      }
      const sub = translateCore(raw.trim(), depth + 1);
      if (sub === null) {
        ok = false;
        break;
      }
      values.push(raw.replace(raw.trim(), sub));
    }
    if (ok) return fill(EN[p.key], values);
  }
  return null;
};

/** Dịch một chuỗi hiển thị theo ngôn ngữ hiện tại (giữ khoảng trắng đầu/cuối). */
export const translate = (s: string): string => {
  if (!s) return s;
  if (s.charCodeAt(0) === 0x2060) return s;
  if (S.lang === 'vi') return VI[s.trim()] !== undefined ? s.replace(s.trim(), VI[s.trim()]) : s;
  if (!hasVietnamese(s)) return s;
  const hit = cache.get(s);
  if (hit !== undefined) return hit;
  const core = s.trim();
  let out = translateCore(core);
  if (out === null) {
    // Câu ghép bằng dấu ·, •, |, —, xuống dòng: dịch từng phần
    const pieces = core.split(/(\s*[·•|—]\s*|\n+)/);
    if (pieces.length > 1) {
      let changed = false;
      const mapped = pieces.map((piece, i) => {
        if (i % 2 === 1 || !piece.trim() || !hasVietnamese(piece)) return piece;
        const tr = translateCore(piece.trim());
        if (tr === null) return piece;
        changed = true;
        return piece.replace(piece.trim(), tr);
      });
      if (changed) out = mapped.join('');
    }
  }
  return remember(s, out === null ? s : s.replace(core, out));
};

/**
 * Dịch chuỗi ngoài JSX, có biến: t('Còn {0} ngày', n).
 * Biến được điền sau khi dịch nên khớp đúng khóa trong en.json.
 */
export const t = (key: string, ...values: Array<string | number>): string => {
  const base = S.lang === 'en' ? EN[key] ?? key : VI[key] ?? key;
  return fill(base, values.map(String));
};

/** Không dịch chuỗi này (tên riêng, tên ngôn ngữ...). */
export const noTranslate = (s: string) => NO_TRANSLATE + s;

export const getLanguage = (): AppLanguage => S.lang;
export const getLanguageVersion = () => S.version;
export const isEnglish = () => S.lang === 'en';
/** Locale cho định dạng ngày giờ. */
export const dateLocale = () => (S.lang === 'en' ? 'en-US' : 'vi-VN');

export const setLanguage = (next: AppLanguage) => {
  if (next === S.lang) return;
  S.lang = next;
  cache.clear();
  try {
    Storage.setItemSync(STORAGE_KEY, next);
  } catch {
    // vẫn áp dụng cho phiên hiện tại
  }
  S.version += 1;
  S.listeners.forEach((l) => l());
};

export const subscribeLanguage = (listener: () => void) => {
  S.listeners.add(listener);
  return () => {
    S.listeners.delete(listener);
  };
};

// ---------- Dịch children của <Text> ----------
type Child = unknown;
const isElementLike = (c: Child) => c != null && typeof c === 'object';

/**
 * children của Text có thể là: "chuỗi" | ["Còn ", 5, " ngày"] | ["Bạn có ", <B/>, " thẻ"].
 * Ghép thành mẫu "Còn {0} ngày" để dịch cả câu (giữ nguyên số, tên, phần tử con),
 * nếu không có bản dịch nguyên câu thì dịch từng đoạn chữ.
 */
export const translateChildren = (children: Child): Child => {
  if (typeof children === 'string') return translate(children);
  if (!Array.isArray(children)) return children;
  let hasVi = false;
  for (const c of children) {
    if (typeof c === 'string' && hasVietnamese(c)) {
      hasVi = true;
      break;
    }
  }
  if (!hasVi) return children;

  let template = '';
  const slots: Child[] = [];
  for (const c of children) {
    if (c == null || typeof c === 'boolean') continue;
    // Chữ và số ghép thẳng vào câu (mẫu "Còn {0} ngày" tự khớp số); phần tử con giữ chỗ {n}
    if ((typeof c === 'string' && c.charCodeAt(0) !== 0x2060) || typeof c === 'number') template += String(c);
    else {
      template += `{${slots.length}}`;
      slots.push(c);
    }
  }
  const core = template.replace(/\s+/g, ' ').trim();
  const whole = translateCore(core);
  if (whole !== null) {
    const out: Child[] = [];
    for (const part of whole.split(/(\{\d+\})/)) {
      if (!part) continue;
      const m = /^\{(\d+)\}$/.exec(part);
      out.push(m && slots[Number(m[1])] !== undefined ? slots[Number(m[1])] : part);
    }
    if (out.every((c) => !isElementLike(c))) return out.map((c) => (typeof c === 'number' ? String(c) : c)).join('');
    return out;
  }
  let changed = false;
  const mapped = children.map((c) => {
    if (typeof c !== 'string') return c;
    const tr = translate(c);
    if (tr !== c) changed = true;
    return tr;
  });
  return changed ? mapped : children;
};
