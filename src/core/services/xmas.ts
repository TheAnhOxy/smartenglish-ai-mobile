import { create } from 'zustand';
import Storage from 'expo-sqlite/kv-store';
import { isDarkTheme } from '@/src/theme/themeMode';

const STORAGE_KEY = 'xmas_decor';

/** Mùa Giáng sinh: 15/11 – 6/1. */
export const isXmasSeason = (date = new Date()): boolean => {
  const m = date.getMonth(); // 0 = tháng 1
  const d = date.getDate();
  return (m === 10 && d >= 15) || m === 11 || (m === 0 && d <= 6);
};

const read = (): boolean | null => {
  try {
    const v = Storage.getItemSync(STORAGE_KEY);
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
};

interface XmasState {
  /** Bật trang trí Giáng sinh (tuyết rơi, cây thông, người tuyết, dây đèn). */
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

/** Mặc định: tự bật trong mùa Giáng sinh; người dùng tắt/bật trong Cài đặt thì nhớ lựa chọn. */
export const useXmasStore = create<XmasState>((set) => ({
  enabled: read() ?? isXmasSeason(),
  setEnabled: (value) => {
    set({ enabled: value });
    try {
      Storage.setItemSync(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // vẫn áp dụng cho phiên hiện tại
    }
  },
}));

/** Trang trí Giáng sinh chỉ hiện ở CHẾ ĐỘ TỐI (chế độ sáng giữ nguyên giao diện gốc). */
export const useXmasActive = (): boolean => {
  const enabled = useXmasStore((s) => s.enabled);
  return enabled && isDarkTheme();
};
