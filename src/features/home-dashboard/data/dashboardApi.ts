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

export const fetchUserStatsApi = async (userId?: string): Promise<UserStats> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/gamification/dashboard?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) {
      let leagueStr: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
      if (data.leagueLevel) {
        const l = String(data.leagueLevel).toLowerCase();
        if (['bronze', 'silver', 'gold', 'diamond'].includes(l)) {
          leagueStr = l as any;
        }
      }

      return {
        user_id: String(uid),
        xp_total: data.xpTotal ?? 0,
        xp_this_week: data.xpThisWeek ?? 0,
        level: data.level ?? 1,
        coins: data.coins ?? 0,
        streak_current: data.streakCurrent ?? 0,
        streak_longest: data.streakLongest ?? 0,
        streak_freeze_count: data.streakFreezeCount ?? 0,
        league: leagueStr
      };
    }
  } catch (err) {
    console.warn('[Dashboard] fetchUserStatsApi error:', err);
  }
  // Return zero-value stats so UI shows empty state instead of fake data
  return {
    user_id: String(uid),
    xp_total: 0,
    xp_this_week: 0,
    level: 1,
    coins: 0,
    streak_current: 0,
    streak_longest: 0,
    streak_freeze_count: 0,
    league: 'bronze'
  };
};

export const fetchDailyPlanApi = async (userId?: string): Promise<DailyPlanData> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/gamification/daily-quests?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) {
      // Map daily quests to plan format
      const quests: any[] = data.quests || data.dailyQuests || [];
      const flashcardQuest = quests.find((q: any) => (q.questType || q.type || '').toLowerCase().includes('flashcard'));
      const quizQuest = quests.find((q: any) => (q.questType || q.type || '').toLowerCase().includes('quiz'));
      const totalXp = quests.reduce((sum: number, q: any) => sum + (q.xpEarned || q.xpReward || 0), 0);
      const allDone = quests.length > 0 && quests.every((q: any) => q.isCompleted || q.completed);

      return {
        id: 'plan-today',
        plan_date: new Date().toISOString().split('T')[0],
        flashcard_target: flashcardQuest?.targetCount || 20,
        flashcard_done: flashcardQuest?.currentCount || flashcardQuest?.progress || 0,
        quiz_target: quizQuest?.targetCount || 2,
        quiz_done: quizQuest?.currentCount || quizQuest?.progress || 0,
        xp_earned: totalXp,
        plan_status: allDone ? 'completed' : (totalXp > 0 ? 'partial' : 'pending'),
        ai_notes: data.motivationalMessage || undefined
      };
    }
  } catch (err) {
    console.warn('[Dashboard] fetchDailyPlanApi error:', err);
  }
  // Return empty plan so UI shows 0 progress instead of fake numbers
  return {
    id: 'plan-today',
    plan_date: new Date().toISOString().split('T')[0],
    flashcard_target: 20,
    flashcard_done: 0,
    quiz_target: 2,
    quiz_done: 0,
    xp_earned: 0,
    plan_status: 'pending'
  };
};

export const fetchLearningPathApi = async (userId?: string): Promise<LearningLessonNode[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/path?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((m: any, idx: number) => ({
        id: String(m.id || idx + 1),
        title_vi: m.titleVi || m.title || `Cột mốc ${idx + 1}`,
        title_en: m.titleEn || m.title || `Milestone ${idx + 1}`,
        status: (m.status || 'locked').toLowerCase() as any,
        xp_reward: m.xpReward || 20,
        estimated_min: m.estimatedMin || m.estimatedMinutes || 10,
        position: m.position || idx + 1
      }));
    }
  } catch (err) {
    console.warn('[Dashboard] fetchLearningPathApi error:', err);
  }
  return [];
};
