import { cefrRank, normalizeCefr, type CefrLevel } from '@/src/features/onboarding/application/learnerLevel';

/** Các mức lọc hiển thị cho học viên (C2 gộp vào C1 vì bài đầu vào chỉ xếp tới C1). */
export const LEVEL_FILTERS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type LevelFilter = (typeof LEVEL_FILTERS)[number] | 'ALL';

export interface LevelRange {
  levelMin?: string | null;
  levelMax?: string | null;
}

/** Khoảng trình độ của nội dung; thiếu mức trên thì coi như chỉ một mức. */
const rangeOf = (item: LevelRange): [number, number] | null => {
  const min = cefrRank(item.levelMin);
  const max = cefrRank(item.levelMax);
  if (min < 0 && max < 0) return null;
  const lo = min >= 0 ? min : max;
  const hi = max >= 0 ? max : min;
  return lo <= hi ? [lo, hi] : [hi, lo];
};

/** Nội dung dạy đúng trình độ này (nằm trong khoảng min–max). */
export const coversLevel = (item: LevelRange, level?: string | null): boolean => {
  const rank = cefrRank(level);
  const range = rangeOf(item);
  return rank >= 0 && range != null && rank >= range[0] && rank <= range[1];
};

/** Số bậc từ trình độ học viên tới khoảng của nội dung (0 = đúng trình độ). */
export const distanceToLevel = (item: LevelRange, level?: string | null): number => {
  const rank = cefrRank(level);
  const range = rangeOf(item);
  if (rank < 0 || range == null) return Number.MAX_SAFE_INTEGER;
  if (rank < range[0]) return range[0] - rank;
  if (rank > range[1]) return rank - range[1];
  return 0;
};

/** Nhãn khoảng trình độ: "B1" hoặc "B1–B2"; không rõ thì null. */
export const levelLabel = (item: LevelRange): string | null => {
  const min = normalizeCefr(item.levelMin);
  const max = normalizeCefr(item.levelMax);
  if (min && max && min !== max) return `${min}–${max}`;
  return min ?? max ?? null;
};

/**
 * Chia danh sách thành hai nhóm: đúng trình độ học viên trước, các trình độ khác sau
 * (gần trình độ học viên hơn đứng trước). Thứ tự gốc được giữ khi bằng nhau.
 */
export const splitByLearnerLevel = <T extends LevelRange>(
  items: readonly T[],
  learner?: string | null,
): { matched: T[]; others: T[] } => {
  if (!normalizeCefr(learner)) return { matched: [], others: [...items] };
  const ranked = items
    .map((item, index) => ({ item, index, d: distanceToLevel(item, learner) }))
    .sort((a, b) => a.d - b.d || a.index - b.index);
  return {
    matched: ranked.filter((r) => r.d === 0).map((r) => r.item),
    others: ranked.filter((r) => r.d !== 0).map((r) => r.item),
  };
};

/** Lọc theo một mức cụ thể; 'ALL' giữ nguyên. */
export const filterByLevel = <T extends LevelRange>(items: readonly T[], filter: LevelFilter): T[] =>
  filter === 'ALL' ? [...items] : items.filter((item) => coversLevel(item, filter));

/** Mức lọc mặc định: trình độ học viên (C2 → C1), chưa có thì xem tất cả. */
export const defaultLevelFilter = (learner?: string | null): LevelFilter => {
  const level: CefrLevel | null = normalizeCefr(learner);
  if (!level) return 'ALL';
  return level === 'C2' ? 'C1' : level;
};

interface ChapterLevelInfo {
  cefr_level?: string | null;
  placement_start?: boolean;
}

/**
 * Chương hiển thị theo mức lọc. Với mức của chính học viên, chương được xếp làm điểm bắt đầu
 * luôn có mặt (kể cả khi hệ thống chưa có chương đúng mức đó, ví dụ C1 nhưng khóa cao nhất là B2).
 */
export const filterChaptersByLevel = <T extends ChapterLevelInfo>(
  chapters: readonly T[],
  filter: LevelFilter,
  learner?: string | null,
): T[] => {
  if (filter === 'ALL') return [...chapters];
  const isMine = defaultLevelFilter(learner) === filter;
  return chapters.filter((c) => {
    const level = normalizeCefr(c.cefr_level);
    const sameLevel = level === filter || (filter === 'C1' && level === 'C2');
    return sameLevel || (isMine && Boolean(c.placement_start));
  });
};

/**
 * Như filterChaptersByLevel, nhưng khi đang xem đúng trình độ học viên mà chưa có chương nào
 * thì lấy các chương ở trình độ gần nhất (bằng nhau thì ưu tiên mức thấp hơn) để học viên vẫn có điểm bắt đầu.
 */
export const resolveChaptersForLevel = <T extends ChapterLevelInfo>(
  chapters: readonly T[],
  filter: LevelFilter,
  learner?: string | null,
): { chapters: T[]; fallbackLevel: CefrLevel | null } => {
  const direct = filterChaptersByLevel(chapters, filter, learner);
  if (direct.length > 0 || filter === 'ALL' || defaultLevelFilter(learner) !== filter) {
    return { chapters: direct, fallbackLevel: null };
  }
  const target = cefrRank(filter);
  let best: CefrLevel | null = null;
  let bestDistance = Number.MAX_SAFE_INTEGER;
  for (const c of chapters) {
    const level = normalizeCefr(c.cefr_level);
    if (!level) continue;
    const d = Math.abs(cefrRank(level) - target);
    if (d < bestDistance || (d === bestDistance && best != null && cefrRank(level) < cefrRank(best))) {
      best = level;
      bestDistance = d;
    }
  }
  if (!best) return { chapters: [], fallbackLevel: null };
  return { chapters: chapters.filter((c) => normalizeCefr(c.cefr_level) === best), fallbackLevel: best };
};
