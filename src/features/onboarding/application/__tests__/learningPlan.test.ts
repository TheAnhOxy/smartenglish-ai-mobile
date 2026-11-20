jest.mock('@/src/core/api/client', () => ({ apiClient: { get: jest.fn() } }));

import { apiClient } from '@/src/core/api/client';
import { fetchLearningPlanApi, toLearningPlan } from '../../data/learningPlanApi';
import { progressRatio, weakSkillItems } from '../learningPlan';

describe('learningPlan', () => {
  it('liệt kê kỹ năng cần cải thiện với nhãn tiếng Việt và đường dẫn', () => {
    const items = weakSkillItems({ weakSkills: ['listening', 'unknown', 'reading'], skills: { listening: 0, reading: 49.6 } });
    expect(items.map((i) => [i.key, i.label, i.score])).toEqual([
      ['listening', 'Nghe hiểu', 0],
      ['reading', 'Đọc hiểu', 50],
    ]);
    expect(items[0].route.params).toEqual({ tab: 'quiz', category: 'LISTENING' });
    expect(weakSkillItems(null)).toEqual([]);
  });

  it('tính tỉ lệ tiến độ an toàn', () => {
    expect(progressRatio(2, 4)).toBe(0.5);
    expect(progressRatio(9, 4)).toBe(1);
    expect(progressRatio(3, 0)).toBe(0);
  });

  it('chuẩn hoá dữ liệu backend thiếu trường', () => {
    expect(toLearningPlan({})).toEqual({
      placementCompleted: false,
      cefrLevel: null,
      recommendedGoal: null,
      skills: {},
      weakSkills: [],
      weeklyGoal: null,
    });
  });

  it('gọi API kế hoạch học', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          placementCompleted: true,
          cefrLevel: 'B1',
          skills: { listening: 20 },
          weakSkills: ['listening'],
          weeklyGoal: { weekStart: '2026-11-16', lessonsTarget: 4, lessonsDone: 1, cardsTarget: 80, cardsReviewed: 12 },
        },
      },
    } as any);
    const plan = await fetchLearningPlanApi();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/learning/placement/plan');
    expect(plan.weeklyGoal?.cardsReviewed).toBe(12);
    expect(plan.weakSkills).toEqual(['listening']);
  });
});
