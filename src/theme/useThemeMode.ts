import { useEffect, useState, useSyncExternalStore } from 'react';
import { getThemePref, getThemeVersion, isDarkTheme, isThemeSwitching, subscribeTheme, type ThemePref } from './themeMode';

/** Theme hiện tại; component dùng hook này sẽ vẽ lại khi người dùng đổi Sáng/Tối. */
export const useThemeMode = (): { dark: boolean; pref: ThemePref; version: number } => {
  const version = useSyncExternalStore(subscribeTheme, getThemeVersion, getThemeVersion);
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, getThemePref);
  return { dark: isDarkTheme(), pref, version };
};

/** true ngay sau khi đổi theme (~1,5s) rồi tự về false — dùng để tắt hiệu ứng chuyển màn lúc đổi theme. */
export const useThemeSwitching = (): boolean => {
  const version = useSyncExternalStore(subscribeTheme, getThemeVersion, getThemeVersion);
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!isThemeSwitching()) return;
    // Hết khoảng "đang đổi theme" thì vẽ lại để bật lại hiệu ứng chuyển màn
    const t = setTimeout(() => rerender((x) => x + 1), 1600);
    return () => clearTimeout(t);
  }, [version]);
  return isThemeSwitching();
};
