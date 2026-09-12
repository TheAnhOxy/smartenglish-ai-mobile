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
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/gamification/leaderboard?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data && data.rankList && Array.isArray(data.rankList)) {
      return data.rankList.map((m: any) => ({
        user_id: String(m.userId),
        display_name: m.displayName || m.username || 'Learner',
        avatar_url: m.avatarUrl || 'https://i.pravatar.cc/100?img=33',
        weekly_xp: m.weeklyXp || 500,
        rank: m.rank || 1,
        tier: m.rank === 1 ? 'gold' : (m.rank === 2 ? 'silver' : (m.rank === 3 ? 'bronze' : 'normal'))
      }));
    }
  } catch (err) {
    console.warn('Real Leaderboard API error, returning fallback leaderboard:', err);
  }

  return [
    { user_id: 'u-1', display_name: 'Minh Anh', avatar_url: 'https://i.pravatar.cc/100?img=1', weekly_xp: 850, rank: 1, tier: 'gold' },
    { user_id: 'u-2', display_name: 'Hoàng Nam', avatar_url: 'https://i.pravatar.cc/100?img=2', weekly_xp: 720, rank: 2, tier: 'silver' },
    { user_id: '17', display_name: 'Nguyễn Văn Học Viên', avatar_url: 'https://i.pravatar.cc/100?img=33', weekly_xp: 640, rank: 3, tier: 'bronze' },
    { user_id: 'u-4', display_name: 'Thu Trang', avatar_url: 'https://i.pravatar.cc/100?img=4', weekly_xp: 510, rank: 4, tier: 'normal' }
  ];
};

export const fetchGamificationDashboardApi = async (userId?: string) => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/gamification/dashboard?userId=${uid}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('Real Dashboard API error:', err);
    return null;
  }
};
