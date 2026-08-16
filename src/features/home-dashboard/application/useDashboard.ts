import { useQuery } from '@tanstack/react-query';
import { fetchUserStatsApi, fetchDailyPlanApi, fetchLearningPathApi } from '../data/dashboardApi';

export const useUserStatsQuery = (userId: string) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStatsApi(userId)
  });
};

export const useDailyPlanQuery = () => {
  return useQuery({
    queryKey: ['daily-plan-today'],
    queryFn: fetchDailyPlanApi
  });
};

export const useLearningPathQuery = () => {
  return useQuery({
    queryKey: ['learning-path'],
    queryFn: fetchLearningPathApi
  });
};
