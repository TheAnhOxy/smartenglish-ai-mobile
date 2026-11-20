import { useQuery } from '@tanstack/react-query';
import { fetchLearningPlanApi } from '../data/learningPlanApi';

/** Khóa React Query của kế hoạch học (làm mới sau bài kiểm tra đầu vào). */
export const LEARNING_PLAN_KEY = ['placement', 'plan'] as const;

/** Kế hoạch học của học viên đã đăng nhập (khách: không gọi API). */
export const useLearningPlanQuery = (userId?: string | number | null) =>
  useQuery({
    queryKey: [...LEARNING_PLAN_KEY, userId ?? 'guest'],
    queryFn: fetchLearningPlanApi,
    enabled: userId != null && userId !== '',
    staleTime: 60_000,
    retry: 1,
  });
