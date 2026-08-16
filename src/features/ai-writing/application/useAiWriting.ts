import { useMutation } from '@tanstack/react-query';
import { submitWritingAnalysisApi } from '../data/writingApi';

export const useWritingAnalysisMutation = () => {
  return useMutation({
    mutationFn: ({ text, type }: { text: string; type: string }) => submitWritingAnalysisApi(text, type)
  });
};
