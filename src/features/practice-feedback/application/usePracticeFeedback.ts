import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/core/flows/authStore';
import { markPracticeUpdated } from '@/src/core/flows/practiceActivity';
import {
  fetchFeedbackOverviewApi,
  submitSessionFeedbackApi,
  type SessionFeedbackInput,
} from '../data/practiceFeedbackApi';

export const FEEDBACK_OVERVIEW_KEY = ['practice-feedback', 'overview'] as const;
export const FEEDBACK_RECENT_KEY = ['practice-feedback', 'recent'] as const;

/**
 * AI nhận xét một buổi luyện. Khoá theo kỹ năng + mã buổi nên mở lại màn kết quả
 * không gọi AI lần nữa; xong thì làm mới tab Đánh giá.
 */
export const useSessionFeedback = (input: SessionFeedbackInput | null) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.currentUser?.id);
  const enabled = Boolean(input && userId && input.details.trim().length >= 10);

  const query = useQuery({
    queryKey: ['practice-feedback', 'session', userId, input?.skill, input?.sourceId ?? input?.title],
    // Làm mới tab Đánh giá ngay khi AI chấm xong — kể cả khi người học đã rời màn kết quả
    // (AI chấm 10–30 giây, thường xong sau khi đã quay về tab Thống kê)
    queryFn: async () => {
      const result = await submitSessionFeedbackApi(input as SessionFeedbackInput);
      markPracticeUpdated();
      void queryClient.invalidateQueries({ queryKey: FEEDBACK_OVERVIEW_KEY });
      void queryClient.invalidateQueries({ queryKey: FEEDBACK_RECENT_KEY });
      return result;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 0,
  });

  return { ...query, enabled };
};

export const useFeedbackOverview = () => {
  const userId = useAuthStore((s) => s.currentUser?.id);
  return useQuery({
    queryKey: [...FEEDBACK_OVERVIEW_KEY, userId],
    queryFn: fetchFeedbackOverviewApi,
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
};
