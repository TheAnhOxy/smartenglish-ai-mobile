import { useQuery } from '@tanstack/react-query';
import { fetchQuizSuiteApi } from '../data/quizApi';

export const useQuizSuiteQuery = (quizId: string) => {
  return useQuery({
    queryKey: ['quiz-suite', quizId],
    queryFn: () => fetchQuizSuiteApi(quizId)
  });
};
