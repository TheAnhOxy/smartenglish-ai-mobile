import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  ExamCatalogFilters,
  fetchPublishedExamDetailApi,
  fetchPublishedExamsApi,
} from '../data/examCatalogApi';

export function usePublishedExamsInfiniteQuery(filters: Omit<ExamCatalogFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['public-exams', filters],
    queryFn: ({ pageParam }) => fetchPublishedExamsApi({ ...filters, page: Number(pageParam) }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function usePublishedExamDetailQuery(examId: number | null) {
  return useQuery({
    queryKey: ['public-exam-detail', examId],
    queryFn: () => fetchPublishedExamDetailApi(examId as number),
    enabled: examId !== null && Number.isFinite(examId) && examId > 0,
    staleTime: 60_000,
  });
}
