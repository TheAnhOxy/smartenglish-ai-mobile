/**
 * Nạp TRƯỚC mọi màn hình (xem index.js). Không được có JSX trong file này.
 *
 * Bọc hàm tạo phần tử của React để khi đang ở tiếng Anh:
 *  - chữ bên trong <Text> (mọi thư viện, kể cả tab bar / header) được dịch qua locales/en.json
 *  - placeholder, accessibilityLabel được dịch
 * Alert.alert và định dạng ngày 'vi-VN' cũng đổi theo ngôn ngữ.
 * Chỉ đổi chữ hiển thị: không đổi style, không đổi logic.
 */
import { Alert, Platform } from 'react-native';
import { hasVietnamese, isEnglish, translate, translateChildren } from './i18n';

type Props = Record<string, unknown> | null | undefined;
type Fn = (...args: unknown[]) => unknown;

const FLAG = '__smartEnglishI18nPatched';
const G = globalThis as Record<string, unknown>;

// Native: mọi <Text> cuối cùng render thành phần tử host 'RCTText' / 'RCTVirtualText'.
// Web: react-native-web vẽ Text thành thẻ DOM (div/span) — chữ thô chỉ nằm trong các thẻ đó.
const IS_WEB = Platform.OS === 'web';
const isTextHost = (type: unknown) =>
  type === 'RCTText' || type === 'RCTVirtualText' || (IS_WEB && typeof type === 'string');

const translateStringProp = (props: Record<string, unknown>, name: string, out: Record<string, unknown> | null) => {
  const v = props[name];
  if (typeof v !== 'string' || !hasVietnamese(v)) return out;
  const tr = translate(v);
  if (tr === v) return out;
  const next = out ?? { ...props };
  next[name] = tr;
  return next;
};

const translateProps = (type: unknown, props: Props): Props => {
  if (!props || !isEnglish()) return props;
  let out: Record<string, unknown> | null = null;
  if (isTextHost(type) && props.children != null) {
    const c = translateChildren(props.children);
    if (c !== props.children) out = { ...props, children: c };
  }
  out = translateStringProp(out ?? props, 'placeholder', out);
  out = translateStringProp(out ?? props, 'accessibilityLabel', out);
  return out ?? props;
};

const wrapJsx = (orig: Fn): Fn =>
  function patchedJsx(this: unknown, type: unknown, props: unknown, ...rest: unknown[]) {
    return orig.call(this, type, translateProps(type, props as Props), ...rest);
  };

const wrapCreateElement = (orig: Fn): Fn =>
  function patchedCreateElement(this: unknown, type: unknown, props: unknown, ...children: unknown[]) {
    if (!isEnglish()) return orig.call(this, type, props, ...children);
    const p = translateProps(type, props as Props);
    if (isTextHost(type) && children.length) {
      const c = translateChildren(children.length === 1 ? children[0] : children);
      return Array.isArray(c) && children.length > 1 ? orig.call(this, type, p, ...c) : orig.call(this, type, p, c);
    }
    return orig.call(this, type, p, ...children);
  };

// require (không dùng import *): cần đúng object module CommonJS mà các file khác dùng chung
/* eslint-disable @typescript-eslint/no-require-imports */
const ReactJsx: unknown = require('react/jsx-runtime');
const ReactJsxDev: unknown = require('react/jsx-dev-runtime');
const ReactMod: unknown = require('react');
/* eslint-enable @typescript-eslint/no-require-imports */

const patch = (mod: unknown, key: string, wrap: (f: Fn) => Fn) => {
  const target = mod as Record<string, unknown>;
  const fn = target[key];
  if (typeof fn !== 'function') return;
  try {
    target[key] = wrap(fn as Fn);
  } catch {
    // module bị đóng băng: bỏ qua (giao diện vẫn chạy, chỉ không dịch)
  }
};

if (!G[FLAG]) {
  G[FLAG] = true;
  patch(ReactJsx, 'jsx', wrapJsx);
  patch(ReactJsx, 'jsxs', wrapJsx);
  patch(ReactJsxDev, 'jsxDEV', wrapJsx);
  patch(ReactMod, 'createElement', wrapCreateElement);
  // NativeWind biên dịch JSX qua react-native-css-interop/jsx-runtime và giữ bản jsx gốc của React
  // từ lúc nạp — bọc luôn module này để dịch được cả khi bootstrap chạy muộn (vd. Fast Refresh).
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const interop: unknown = require('react-native-css-interop/jsx-runtime');
    patch(interop, 'jsx', wrapJsx);
    patch(interop, 'jsxs', wrapJsx);
    patch(interop, 'jsxDEV', wrapJsx);
    patch(interop, 'createInteropElement', wrapCreateElement);
  } catch {
    // không có NativeWind: bỏ qua
  }

  // Hộp thoại
  const origAlert = Alert.alert.bind(Alert);
  Alert.alert = (title, message, buttons, options) => {
    if (!isEnglish()) return origAlert(title, message, buttons, options);
    return origAlert(
      typeof title === 'string' ? translate(title) : title,
      typeof message === 'string' ? translate(message) : message,
      buttons?.map((b) => (typeof b.text === 'string' ? { ...b, text: translate(b.text) } : b)),
      options,
    );
  };

  // Ngày giờ: toLocaleDateString('vi-VN') → 'en-US' khi đang ở tiếng Anh
  const mapLocale = (locales: unknown) =>
    isEnglish() && typeof locales === 'string' && locales.toLowerCase().startsWith('vi') ? 'en-US' : locales;
  for (const name of ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'] as const) {
    const orig = Date.prototype[name] as (this: Date, l?: unknown, o?: unknown) => string;
    try {
      Date.prototype[name] = function (this: Date, locales?: unknown, opts?: unknown) {
        return orig.call(this, mapLocale(locales), opts);
      } as never;
    } catch {
      // bỏ qua
    }
  }
}
