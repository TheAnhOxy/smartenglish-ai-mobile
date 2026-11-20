import { apiClient } from '@/src/core/api/client';

export interface WeeklyGoal {
  weekStart: string | null;
  lessonsTarget: number;
  lessonsDone: number;
  cardsTarget: number;
  cardsReviewed: number;
}

export interface LearningPlan {
  placementCompleted: boolean;
  cefrLevel: string | null;
  recommendedGoal: string | null;
  skills: Record<string, number>;
  weakSkills: string[];
  weeklyGoal: WeeklyGoal | null;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

/** Chuyển dữ liệu backend về dạng an toàn cho giao diện. */
export const toLearningPlan = (data: any): LearningPlan => ({
  placementCompleted: Boolean(data?.placementCompleted),
  cefrLevel: data?.cefrLevel ?? null,
  recommendedGoal: data?.recommendedGoal ?? null,
  skills: data?.skills && typeof data.skills === 'object' ? data.skills : {},
  weakSkills: Array.isArray(data?.weakSkills) ? data.weakSkills : [],
  weeklyGoal: data?.weeklyGoal
    ? {
        weekStart: data.weeklyGoal.weekStart ?? null,
        lessonsTarget: num(data.weeklyGoal.lessonsTarget),
        lessonsDone: num(data.weeklyGoal.lessonsDone),
        cardsTarget: num(data.weeklyGoal.cardsTarget),
        cardsReviewed: num(data.weeklyGoal.cardsReviewed),
      }
    : null,
});

/** Kế hoạch học sau bài kiểm tra đầu vào: kỹ năng cần cải thiện và mục tiêu tuần. */
export const fetchLearningPlanApi = async (): Promise<LearningPlan> => {
  const response = await apiClient.get('/api/v1/learning/placement/plan');
  return toLearningPlan(response.data?.data ?? response.data ?? {});
};
