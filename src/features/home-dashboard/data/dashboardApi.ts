import { apiClient } from '@/src/core/api/client';
import { UserStats, Topic } from '@/src/core/types/schema';
import { MOCK_USER_STATS } from '@/src/core/data/mockData';

export interface DailyPlanData {
  id: string;
  plan_date: string;
  flashcard_target: number;
  flashcard_done: number;
  quiz_target: number;
  quiz_done: number;
  xp_earned: number;
  plan_status: 'pending' | 'partial' | 'completed';
  ai_notes?: string;
}

export interface LearningLessonNode {
  id: string;
  title_vi: string;
  title_en: string;
  status: 'completed' | 'current' | 'locked';
  xp_reward: number;
  estimated_min: number;
  position: number;
}

export const fetchUserStatsApi = async (userId: string): Promise<UserStats> => {
  return MOCK_USER_STATS[userId] || MOCK_USER_STATS['11111111-1111-1111-1111-111111111111'];
};

export const fetchDailyPlanApi = async (): Promise<DailyPlanData> => {
  return {
    id: 'plan-today',
    plan_date: new Date().toISOString().split('T')[0],
    flashcard_target: 20,
    flashcard_done: 12,
    quiz_target: 2,
    quiz_done: 1,
    xp_earned: 45,
    plan_status: 'partial',
    ai_notes: 'Hôm nay tập trung thì hiện tại hoàn thành vì bạn đã sai 4/5 câu phần này tuần trước.'
  };
};

export const fetchLearningPathApi = async (): Promise<LearningLessonNode[]> => {
  return [
    { id: 'les-1', title_vi: 'Chào Hỏi & Giới Thiệu', title_en: 'Greetings & Introduction', status: 'completed', xp_reward: 20, estimated_min: 5, position: 1 },
    { id: 'les-2', title_vi: 'Từ Vựng Giao Tiếp Công Sở', title_en: 'Office Communication', status: 'completed', xp_reward: 25, estimated_min: 8, position: 2 },
    { id: 'les-3', title_vi: 'Thì Hiện Tại Hoàn Thành', title_en: 'Present Perfect Tense', status: 'current', xp_reward: 30, estimated_min: 10, position: 3 },
    { id: 'les-4', title_vi: 'Đàm Phán Hợp Đồng', title_en: 'Contract Negotiation', status: 'locked', xp_reward: 35, estimated_min: 12, position: 4 },
    { id: 'les-5', title_vi: 'Phỏng Vấn Xin Việc', title_en: 'Job Interview Practice', status: 'locked', xp_reward: 40, estimated_min: 15, position: 5 }
  ];
};
