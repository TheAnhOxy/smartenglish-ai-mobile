import { create } from 'zustand';
import { Platform } from 'react-native';

export const FREE_SPEAKING_DAILY_LIMIT = 20;

export interface SpeakingDailyQuota {
  date: string;
  usedToday: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  isPremium: boolean;
}

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_KEY = 'SMART_ENGLISH_SPEAKING_DAILY_QUOTA';

// Safe cross-platform synchronous storage
const readStoredQuota = (): { date: string; usedToday: number } => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === getTodayDateString() && typeof parsed.usedToday === 'number') {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[speakingQuotaStore] read storage error:', err);
  }
  return { date: getTodayDateString(), usedToday: 0 };
};

const writeStoredQuota = (data: { date: string; usedToday: number }) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('[speakingQuotaStore] write storage error:', err);
  }
};

interface SpeakingQuotaState {
  date: string;
  usedToday: number;
  getQuota: (isPremium: boolean) => SpeakingDailyQuota;
  canChat: (isPremium: boolean) => boolean;
  consumeTurn: (isPremium: boolean) => boolean;
  setUsedToday: (count: number) => void;
  resetForNewDay: () => void;
}

export const useSpeakingQuotaStore = create<SpeakingQuotaState>((set, get) => {
  const initial = readStoredQuota();

  return {
    date: initial.date,
    usedToday: initial.usedToday,

    getQuota: (isPremium: boolean): SpeakingDailyQuota => {
      const state = get();
      const today = getTodayDateString();

      // Auto-reset if midnight has passed
      let currentUsed = state.usedToday;
      if (state.date !== today) {
        currentUsed = 0;
        set({ date: today, usedToday: 0 });
        writeStoredQuota({ date: today, usedToday: 0 });
      }

      const limit = isPremium ? 9999 : FREE_SPEAKING_DAILY_LIMIT;
      const remaining = isPremium ? 9999 : Math.max(0, limit - currentUsed);
      const isExceeded = !isPremium && currentUsed >= limit;

      return {
        date: today,
        usedToday: currentUsed,
        limit,
        remaining,
        isExceeded,
        isPremium,
      };
    },

    canChat: (isPremium: boolean): boolean => {
      if (isPremium) return true;
      const quota = get().getQuota(false);
      return quota.remaining > 0;
    },

    consumeTurn: (isPremium: boolean): boolean => {
      const state = get();
      const today = getTodayDateString();

      let currentUsed = state.usedToday;
      if (state.date !== today) {
        currentUsed = 0;
      }

      if (!isPremium && currentUsed >= FREE_SPEAKING_DAILY_LIMIT) {
        return false;
      }

      const newUsed = isPremium ? currentUsed : currentUsed + 1;
      set({ date: today, usedToday: newUsed });
      writeStoredQuota({ date: today, usedToday: newUsed });
      return true;
    },

    setUsedToday: (count: number) => {
      const today = getTodayDateString();
      set({ date: today, usedToday: count });
      writeStoredQuota({ date: today, usedToday: count });
    },

    resetForNewDay: () => {
      const today = getTodayDateString();
      set({ date: today, usedToday: 0 });
      writeStoredQuota({ date: today, usedToday: 0 });
    },
  };
});
