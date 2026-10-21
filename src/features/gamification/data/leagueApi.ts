import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface LeaderboardMember {
  user_id: string;
  display_name: string;
  avatar_url: string;
  weekly_xp: number;
  rank: number;
  tier: 'gold' | 'silver' | 'bronze' | 'normal' | 'demotion';
}

export const fetchLeagueLeaderboardApi = async (userId?: string): Promise<LeaderboardMember[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/leaderboard');
    const data = response.data?.data || response.data;
    if (data && data.rankList && Array.isArray(data.rankList)) {
      return data.rankList.map((m: any) => ({
        user_id: String(m.userId),
        display_name: m.displayName || m.username || 'Learner',
        avatar_url: m.avatarUrl || 'https://i.pravatar.cc/100?img=33',
        weekly_xp: m.weeklyXp || 0,
        rank: m.rank || 1,
        tier: m.rank === 1 ? 'gold' : (m.rank === 2 ? 'silver' : (m.rank === 3 ? 'bronze' : 'normal'))
      }));
    }
    return [];
  } catch (err) {
    console.warn('[leagueApi] fetchLeagueLeaderboardApi error:', err);
    throw err;
  }
};

export const fetchGamificationDashboardApi = async (userId?: string) => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/dashboard');
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('Real Dashboard API error:', err);
    return null;
  }
};
