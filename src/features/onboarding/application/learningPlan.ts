import type { LearningPlan } from '../data/learningPlanApi';

export type SkillKey = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export interface SkillMeta {
  label: string;
  hint: string;
  route: { pathname: string; params?: Record<string, string> };
}

/** Nhãn tiếng Việt và màn luyện tập tương ứng của từng kỹ năng. */
export const SKILL_META: Record<SkillKey, SkillMeta> = {
  vocabulary: {
    label: 'Từ vựng',
    hint: 'Ôn thẻ từ mỗi ngày',
    route: { pathname: '/(student)/review' },
  },
  grammar: {
    label: 'Ngữ pháp',
    hint: 'Làm đề ngữ pháp',
    route: { pathname: '/(student)/learn', params: { tab: 'quiz', category: 'GRAMMAR' } },
  },
  reading: {
    label: 'Đọc hiểu',
    hint: 'Làm đề đọc hiểu',
    route: { pathname: '/(student)/learn', params: { tab: 'quiz', category: 'READING' } },
  },
  listening: {
    label: 'Nghe hiểu',
    hint: 'Làm đề nghe hiểu',
    route: { pathname: '/(student)/learn', params: { tab: 'quiz', category: 'LISTENING' } },
  },
};

export interface WeakSkillItem extends SkillMeta {
  key: SkillKey;
  score: number;
}

/** Kỹ năng cần cải thiện kèm điểm, bỏ qua khoá không biết. */
export const weakSkillItems = (plan?: Pick<LearningPlan, 'weakSkills' | 'skills'> | null): WeakSkillItem[] =>
  (plan?.weakSkills ?? [])
    .filter((key): key is SkillKey => key in SKILL_META)
    .map((key) => ({ key, score: Math.round(plan?.skills?.[key] ?? 0), ...SKILL_META[key] }));

/** Tỉ lệ hoàn thành 0..1 (an toàn với mục tiêu 0). */
export const progressRatio = (done: number, target: number): number =>
  target > 0 ? Math.max(0, Math.min(1, done / target)) : 0;
