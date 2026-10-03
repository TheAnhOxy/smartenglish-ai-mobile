import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AnswerKey,
  fetchExamAttemptApi,
  fetchExamResultApi,
  fetchUserExamHistoryApi,
  saveExamAnswerApi,
  startExamAttemptApi,
  submitExamAttemptApi,
} from '../data/examAttemptApi';

export const useStartExamAttempt = () => useMutation({ mutationFn: startExamAttemptApi });

export const useExamAttemptQuery = (attemptId: number | null) => useQuery({
  queryKey: ['exam-attempt', attemptId],
  queryFn: () => fetchExamAttemptApi(attemptId as number),
  enabled: Boolean(attemptId && attemptId > 0),
  staleTime: 0,
  refetchOnWindowFocus: false,
});

export const useUserExamHistoryQuery = (examId?: number) => useQuery({
  queryKey: ['user-exam-history', examId],
  queryFn: () => fetchUserExamHistoryApi(examId),
  staleTime: 10_000,
  refetchOnWindowFocus: false,
});


export const useSaveExamAnswer = () => useMutation({
  mutationFn: (payload: { attemptId: number; questionId: string; selectedAnswer?: AnswerKey; bookmarked?: boolean }) =>
    saveExamAnswerApi(payload.attemptId, payload.questionId, payload.selectedAnswer, payload.bookmarked),
});

export const useSubmitExamAttempt = () => useMutation({
  mutationFn: (payload: { attemptId: number; answers: Record<string, AnswerKey>; timeSpentSeconds: number }) =>
    submitExamAttemptApi(payload.attemptId, payload.answers, payload.timeSpentSeconds),
});

export const useExamResultQuery = (attemptId: number | null) => useQuery({
  queryKey: ['exam-attempt-result', attemptId],
  queryFn: () => fetchExamResultApi(attemptId as number),
  enabled: Boolean(attemptId && attemptId > 0),
  staleTime: 30_000,
});

