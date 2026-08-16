import { useQuery } from '@tanstack/react-query';
import { fetchKnowledgeGapsApi } from '../data/knowledgeGapApi';

export const useKnowledgeGapQuery = () => {
  return useQuery({
    queryKey: ['knowledge-gaps'],
    queryFn: fetchKnowledgeGapsApi
  });
};
