/** Tiện ích trình độ CEFR của học viên: chuẩn hoá, so khoảng cách và sắp xếp nội dung phù hợp. */
export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_ORDER)[number];

/** Chuẩn hoá chuỗi trình độ ("b1", " B1 ", "B1+") về A1..C2; không nhận ra thì trả null. */
export const normalizeCefr = (value?: string | null): CefrLevel | null => {
  if (!value) return null;
  const match = String(value).toUpperCase().match(/[ABC][12]/);
  return match ? (match[0] as CefrLevel) : null;
};

export const cefrRank = (value?: string | null): number => {
  const level = normalizeCefr(value);
  return level ? CEFR_ORDER.indexOf(level) : -1;
};

/** Khoảng cách giữa hai trình độ; không xác định thì coi là rất xa. */
export const levelDistance = (a?: string | null, b?: string | null): number => {
  const ra = cefrRank(a);
  const rb = cefrRank(b);
  return ra < 0 || rb < 0 ? Number.MAX_SAFE_INTEGER : Math.abs(ra - rb);
};

/** Nội dung được xem là phù hợp khi cùng trình độ hoặc lệch một bậc. */
export const isLevelMatch = (learner?: string | null, content?: string | null): boolean =>
  levelDistance(learner, content) <= 1;

/** Sắp xếp ổn định: gần trình độ học viên trước; chưa có trình độ thì giữ nguyên thứ tự. */
export const sortByLevelCloseness = <T>(
  items: readonly T[],
  learner: string | null | undefined,
  levelOf: (item: T) => string | null | undefined,
): T[] => {
  if (!normalizeCefr(learner)) return [...items];
  return items
    .map((item, index) => ({ item, index, d: levelDistance(learner, levelOf(item)) }))
    .sort((x, y) => x.d - y.d || x.index - y.index)
    .map((x) => x.item);
};

/** Trường hồ sơ cần cập nhật ngay sau khi có kết quả bài kiểm tra đầu vào. */
export const profileFieldsFromPlacement = (result: {
  cefr_level?: string | null;
  recommendedGoal?: string | null;
}): { cefr_level?: string; target_goal?: string } => {
  const fields: { cefr_level?: string; target_goal?: string } = {};
  const level = normalizeCefr(result.cefr_level);
  if (level) fields.cefr_level = level;
  if (result.recommendedGoal) fields.target_goal = result.recommendedGoal;
  return fields;
};
