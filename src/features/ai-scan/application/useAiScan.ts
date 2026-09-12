import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchScanQuotaApi, submitScanImageApi } from '../data/scanApi';

export const useScanQuotaQuery = (isPremium: boolean) => {
  return useQuery({
    queryKey: ['scan-quota', isPremium],
    queryFn: () => fetchScanQuotaApi(isPremium)
  });
};

export const useSubmitScanMutation = () => {
  return useMutation({
    mutationFn: (params?: { base64Image?: string; mode?: 'document' | 'id_card' | 'book' | 'object' }) =>
      submitScanImageApi(params?.base64Image, params?.mode)
  });
};
