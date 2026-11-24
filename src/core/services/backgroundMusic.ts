import { create } from 'zustand';
import Storage from 'expo-sqlite/kv-store';
import { setUiSoundEnabled, setUiSoundVolume } from '@/src/components/ds/feedback';

const ENABLED_KEY = 'bgm_enabled';
const VOLUME_KEY = 'sound_volume';

/** Âm lượng nhạc nền tối đa (mức 100%): vẫn đủ nhỏ để không lấn giọng đọc/hiệu ứng UI. */
export const BGM_MAX_VOLUME = 0.4;
/** 5 nấc âm lượng: 20% … 100%. */
export const VOLUME_STEP = 0.2;
const DEFAULT_VOLUME = 0.6;

/**
 * Màn đang học/luyện tập → tắt nhạc nền (nghe, nói, ghi âm, làm bài cần tập trung).
 * pathname của expo-router không có tên nhóm, vd "/practice/speaking", "/review/decks/3/study".
 */
const QUIET_PREFIXES = [
  '/lesson',
  '/practice',
  '/review/due',
  '/placement/test',
  '/placement-test',
  '/assistant',
  '/daily-challenge',
];

export const isQuietRoute = (pathname: string | null | undefined): boolean => {
  if (!pathname) return false;
  const path = pathname.toLowerCase();
  if (path.startsWith('/review/decks/') && path.endsWith('/study')) return true;
  if (/^\/classes\/[^/]+\/assignments/.test(path)) return true;
  return QUIET_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

const read = (key: string): string | null => {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Không lưu được thì vẫn áp dụng cho phiên hiện tại
  }
};

/** Làm tròn về nấc 0.2 trong khoảng [0.2, 1]. */
export const clampVolume = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  const stepped = Math.round(value / VOLUME_STEP) * VOLUME_STEP;
  return Math.round(Math.max(VOLUME_STEP, Math.min(1, stepped)) * 10) / 10;
};

interface SoundState {
  /** false = tắt hết âm thanh (nhạc nền + hiệu ứng bấm). */
  enabled: boolean;
  /** 0.2 … 1 */
  volume: number;
  setEnabled: (value: boolean) => void;
  setVolume: (value: number) => void;
  /** Giảm/tăng một nấc; "+" khi đang tắt thì bật lại, "−" ở mức thấp nhất thì tắt. */
  stepVolume: (direction: 1 | -1) => void;
}

const initialEnabled = read(ENABLED_KEY) !== '0';
const initialVolume = clampVolume(Number(read(VOLUME_KEY) ?? DEFAULT_VOLUME));
setUiSoundEnabled(initialEnabled);
setUiSoundVolume(initialVolume);

/** Cài đặt âm thanh của app, lưu lại giữa các lần mở. */
export const useBgmStore = create<SoundState>((set, get) => ({
  enabled: initialEnabled,
  volume: initialVolume,
  setEnabled: (value) => {
    set({ enabled: value });
    setUiSoundEnabled(value);
    write(ENABLED_KEY, value ? '1' : '0');
  },
  setVolume: (value) => {
    const volume = clampVolume(value);
    set({ volume });
    setUiSoundVolume(volume);
    write(VOLUME_KEY, String(volume));
  },
  stepVolume: (direction) => {
    const { enabled, volume, setEnabled, setVolume } = get();
    if (!enabled) {
      // Đang tắt: "+" bật lại ở mức cũ, "−" không làm gì
      if (direction > 0) setEnabled(true);
      return;
    }
    // Ở mức thấp nhất mà giảm tiếp → tắt tiếng
    if (direction < 0 && volume <= VOLUME_STEP) {
      setEnabled(false);
      return;
    }
    setVolume(volume + direction * VOLUME_STEP);
  },
}));
