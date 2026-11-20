// Chuyển nhiệm vụ hằng ngày từ backend sang dạng hiển thị: biểu tượng, đơn vị và màn mở khi bấm.

export type DailyQuestIconKey = 'target' | 'vocab' | 'reading' | 'listening' | 'xp' | 'quiz';

export interface DailyQuestItem {
  id: string;
  icon: DailyQuestIconKey;
  title: string;
  /** Tên bài được giao (bài kỹ năng), hiện dưới tiêu đề. */
  subtitle?: string;
  current: number;
  target: number;
  xp: number;
  unit: string;
  claimed: boolean;
  route: string;
}

export interface RawDailyTask {
  taskId?: number | string;
  kind?: string;
  skill?: string;
  descriptionVi?: string;
  title?: string;
  targetCount?: number;
  currentCount?: number;
  isClaimed?: boolean;
  unit?: string;
  examId?: number | string;
  examTitle?: string;
  cefrLevel?: string;
}

const EXAM_CATEGORY: Record<string, string> = { grammar: 'GRAMMAR', reading: 'READING', listening: 'LISTENING' };

const SKILL_ICON: Record<string, DailyQuestIconKey> = { grammar: 'quiz', reading: 'reading', listening: 'listening' };

const query = (params: Record<string, string | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join('&');

/** Nhiệm vụ theo trình độ (có `kind`): mở đúng bài được giao; dạng cũ thì đoán theo mô tả. */
export const toDailyQuest = (t: RawDailyTask, index: number, xpEach: number, claimed: boolean): DailyQuestItem => {
  const title = t.descriptionVi || t.title || `Nhiệm vụ ${index + 1}`;
  const base = {
    id: String(t.taskId ?? index + 1),
    title,
    current: t.currentCount ?? 0,
    target: t.targetCount ?? 1,
    xp: xpEach,
    claimed: claimed || Boolean(t.isClaimed),
  };

  switch (t.kind) {
    case 'REVIEW_CARDS':
    case 'LEARN_WORDS':
      return { ...base, icon: 'vocab', unit: t.unit || 'thẻ', route: '/(student)/review' };
    case 'PLACEMENT':
      return { ...base, icon: 'target', unit: t.unit || 'bài', route: '/(student)/placement/test' };
    case 'SKILL_EXAM': {
      const skill = t.skill ?? '';
      const route = t.examId
        ? `/(student)/practice/exam/${t.examId}?${query({ mode: 'PRACTICE', title: t.examTitle })}`
        : `/(student)/learn?${query({ tab: 'quiz', category: EXAM_CATEGORY[skill], level: t.cefrLevel })}`;
      return { ...base, icon: SKILL_ICON[skill] ?? 'quiz', unit: t.unit || 'bài', subtitle: t.examTitle, route };
    }
    default:
      break;
  }

  const desc = title.toLowerCase();
  if (desc.includes('flashcard') || desc.includes('từ vựng')) {
    return { ...base, icon: 'vocab', unit: 'từ', route: '/(student)/review' };
  }
  if (desc.includes('đọc') || desc.includes('reading')) {
    return { ...base, icon: 'reading', unit: 'bài', route: '/(student)/practice/reading' };
  }
  if (desc.includes('xp')) {
    return { ...base, icon: 'xp', unit: 'XP', route: '/(student)/learn' };
  }
  if (desc.includes('quiz')) {
    return { ...base, icon: 'quiz', unit: 'bài', route: '/(student)/learn?tab=quiz' };
  }
  return { ...base, icon: 'target', unit: 'lần', route: '/(student)/learn' };
};
