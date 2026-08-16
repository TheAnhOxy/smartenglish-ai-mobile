export interface LeaderboardMember {
  user_id: string;
  display_name: string;
  avatar_url: string;
  weekly_xp: number;
  rank: number;
  tier: 'gold' | 'silver' | 'bronze' | 'normal' | 'demotion';
}

export const fetchLeagueLeaderboardApi = async (): Promise<LeaderboardMember[]> => {
  return [
    { user_id: 'u-1', display_name: 'Minh Anh', avatar_url: 'https://i.pravatar.cc/100?img=1', weekly_xp: 850, rank: 1, tier: 'gold' },
    { user_id: 'u-2', display_name: 'Hoàng Nam', avatar_url: 'https://i.pravatar.cc/100?img=2', weekly_xp: 720, rank: 2, tier: 'silver' },
    { user_id: '11111111-1111-1111-1111-111111111111', display_name: 'Nguyễn Văn Học', avatar_url: 'https://i.pravatar.cc/100?img=33', weekly_xp: 640, rank: 3, tier: 'bronze' },
    { user_id: 'u-4', display_name: 'Thu Trang', avatar_url: 'https://i.pravatar.cc/100?img=4', weekly_xp: 510, rank: 4, tier: 'normal' },
    { user_id: 'u-5', display_name: 'Đức Huy', avatar_url: 'https://i.pravatar.cc/100?img=5', weekly_xp: 120, rank: 10, tier: 'demotion' }
  ];
};
