import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/core/flows/authStore';
import { fetchUserStatsApi, fetchDailyPlanApi, fetchLearningPathApi, fetchDailyQuestsListApi } from '../data/dashboardApi';
import { hasClaimedToday } from '../data/dailyClaimMemory';

export const useUserStatsQuery = (userId: string) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStatsApi(userId),
    enabled: !!userId
  });
};

export const useDailyPlanQuery = () => {
  return useQuery({
    queryKey: ['daily-plan-today'],
    queryFn: () => fetchDailyPlanApi()
  });
};

export const useLearningPathQuery = () => {
  return useQuery({
    queryKey: ['learning-path'],
    queryFn: () => fetchLearningPathApi()
  });
};

export const useDailyQuestsQuery = () => {
  // Gắn id người dùng vào khoá cache: đổi tài khoản không được thấy tiến độ của tài khoản trước
  const userId = useAuthStore((s) => s.currentUser?.id);
  return useQuery({
    queryKey: ['daily-quests', userId],
    queryFn: () => fetchDailyQuestsListApi(),
    enabled: !!userId,
    // Đã nhận thưởng hôm nay trên máy này thì coi như đã nhận, kể cả khi server cũ báo chưa
    select: (data) =>
      !data.isClaimed && hasClaimedToday(userId)
        ? { ...data, isClaimed: true, quests: data.quests.map((q) => ({ ...q, claimed: true })) }
        : data,
  });
};
