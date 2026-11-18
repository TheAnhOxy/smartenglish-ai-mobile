/**
 * Ghi nhớ ngày đã nhận thưởng nhiệm vụ hằng ngày ở phía app.
 * Server cũ luôn trả isClaimed=false nên nút "Nhận XP" hiện lại sau mỗi lần tải;
 * khi server đã trả isClaimed đúng thì phần này không còn tác dụng gì.
 * Web lưu localStorage, native giữ trong bộ nhớ đến khi tắt app.
 */
const memory = new Map<string, string>();
const keyOf = (userId: string | number) => `se_daily_claimed_${userId}`;

export const todayKey = (now: Date = new Date()): string => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const readStored = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(key);
  } catch {
    // localStorage bị chặn: dùng bộ nhớ tạm
  }
  return memory.get(key) ?? null;
};

export const rememberDailyClaim = (userId: string | number, now: Date = new Date()): void => {
  const key = keyOf(userId);
  const value = todayKey(now);
  memory.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
  } catch {
    // bỏ qua, đã có bản trong bộ nhớ
  }
};

export const hasClaimedToday = (userId: string | number | undefined, now: Date = new Date()): boolean =>
  userId != null && readStored(keyOf(userId)) === todayKey(now);
