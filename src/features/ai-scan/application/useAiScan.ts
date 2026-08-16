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
    mutationFn: submitScanImageApi
  });
};
