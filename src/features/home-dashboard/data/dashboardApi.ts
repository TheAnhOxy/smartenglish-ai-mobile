import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { UserStats } from '@/src/core/types/schema';

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

export interface DailyQuestItem {
  id: string;
  icon: string;
  title: string;
  current: number;
  target: number;
  xp: number;
  unit: string;
  claimed: boolean;
  route: string;
}

export const fetchUserStatsApi = async (userId?: string): Promise<UserStats> => {
  const uid = userId || getCurrentUserId();
  const response = await apiClient.get<any>('/api/v1/learning/gamification/dashboard');
  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Không thể tải thông tin tiến độ học tập');
  }

  let leagueStr: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
  if (data.leagueLevel) {
    const l = String(data.leagueLevel).toLowerCase();
    if (['bronze', 'silver', 'gold', 'diamond'].includes(l)) {
      leagueStr = l as any;
    }
  }

  return {
    user_id: String(uid || ''),
    xp_total: data.xpTotal ?? 0,
    xp_this_week: data.xpThisWeek ?? 0,
    level: data.level ?? 1,
    coins: data.coins ?? 0,
    streak_current: data.streakCurrent ?? 0,
    streak_longest: data.streakLongest ?? 0,
    streak_freeze_count: data.streakFreezeCount ?? 0,
    league: leagueStr,
  };
};

export const fetchDailyPlanApi = async (userId?: string): Promise<DailyPlanData> => {
  const response = await apiClient.get<any>('/api/v1/learning/gamification/daily-quests');
  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Không thể tải kế hoạch học tập hàng ngày');
  }

  const tasks: any[] = data.tasks || [];
  const flashcardTask = tasks.find((t: any) =>
    (t.descriptionVi || '').toLowerCase().includes('flashcard') || (t.descriptionVi || '').toLowerCase().includes('từ vựng')
  );
  const quizTask = tasks.find((t: any) =>
    (t.descriptionVi || '').toLowerCase().includes('quiz') || (t.descriptionVi || '').toLowerCase().includes('bài đọc')
  );
  const totalXp = data.totalXpReward || 50;
  const allDone = tasks.length > 0 && tasks.every((t: any) => Boolean(t.isCompleted));

  return {
    id: 'plan-today',
    plan_date: data.challengeDate || new Date().toISOString().split('T')[0],
    flashcard_target: flashcardTask?.targetCount || 10,
    flashcard_done: flashcardTask?.currentCount || 0,
    quiz_target: quizTask?.targetCount || 1,
    quiz_done: quizTask?.currentCount || 0,
    xp_earned: allDone ? totalXp : 0,
    plan_status: allDone ? 'completed' : 'pending',
    ai_notes: data.theme || undefined,
  };
};

export const fetchDailyQuestsListApi = async (): Promise<{ quests: DailyQuestItem[]; questId: number; isClaimed: boolean; totalXpReward: number }> => {
  const response = await apiClient.get<any>('/api/v1/learning/gamification/daily-quests');
  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Không thể tải nhiệm vụ hôm nay');
  }
  const questId = data.id || 1;
  const isClaimed = Boolean(data.isClaimed);
  const totalXp = data.totalXpReward || 50;

  const rawTasks: any[] = data.tasks || [];
  const quests: DailyQuestItem[] = rawTasks.map((t: any, idx: number) => {
    const desc = t.descriptionVi || t.title || `Nhiệm vụ ${idx + 1}`;
    let icon = '🎯';
    let unit = 'lần';
    let route = '/(student)/learn';

    if (desc.toLowerCase().includes('flashcard') || desc.toLowerCase().includes('từ vựng')) {
      icon = '🗂️';
      unit = 'từ';
      route = '/(student)/review';
    } else if (desc.toLowerCase().includes('đọc') || desc.toLowerCase().includes('reading')) {
      icon = '📖';
      unit = 'bài';
      route = '/(student)/practice/reading';
    } else if (desc.toLowerCase().includes('xp')) {
      icon = '⚡';
      unit = 'XP';
      route = '/(student)/learn';
    } else if (desc.toLowerCase().includes('quiz')) {
      icon = '❓';
      unit = 'bài';
      route = '/(student)/learn?tab=quiz';
    }

    return {
      id: String(t.taskId || idx + 1),
      icon,
      title: desc,
      current: t.currentCount ?? 0,
      target: t.targetCount ?? 1,
      xp: Math.round(totalXp / Math.max(rawTasks.length, 1)),
      unit,
      claimed: isClaimed || Boolean(t.isClaimed),
      route,
    };
  });

  return { quests, questId, isClaimed, totalXpReward: totalXp };
};

export const claimDailyQuestRewardApi = async (questId: number | string): Promise<any> => {
  const response = await apiClient.post<any>(`/api/v1/learning/gamification/daily-quests/${questId}/claim`, {});
  return response.data?.data || response.data;
};

export const fetchLearningPathApi = async (userId?: string): Promise<LearningLessonNode[]> => {
  const response = await apiClient.get<any>('/api/v1/learning/path');
  const data = response.data?.data || response.data;
  if (Array.isArray(data)) {
    return data.map((m: any, idx: number) => ({
      id: String(m.id || idx + 1),
      title_vi: m.titleVi || m.title || `Cột mốc ${idx + 1}`,
      title_en: m.titleEn || m.title || `Milestone ${idx + 1}`,
      status: (m.status || 'locked').toLowerCase() as any,
      xp_reward: m.xpReward || 20,
      estimated_min: m.estimatedMin || m.estimatedMinutes || 10,
      position: m.position || idx + 1,
    }));
  }
  return [];
};
