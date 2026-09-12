import { useQuery } from '@tanstack/react-query';
import { fetchLeagueLeaderboardApi } from '../data/leagueApi';

export const useLeagueLeaderboardQuery = () => {
  return useQuery({
    queryKey: ['league-leaderboard'],
    queryFn: () => fetchLeagueLeaderboardApi()
  });
};
