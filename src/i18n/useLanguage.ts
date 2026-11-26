import { useSyncExternalStore } from 'react';
import { getLanguage, getLanguageVersion, subscribeLanguage, type AppLanguage } from './i18n';

/** Ngôn ngữ hiện tại; component dùng hook này vẽ lại khi người dùng đổi Việt/Anh. */
export const useLanguage = (): { lang: AppLanguage; version: number } => {
  const version = useSyncExternalStore(subscribeLanguage, getLanguageVersion, getLanguageVersion);
  return { lang: getLanguage(), version };
};
