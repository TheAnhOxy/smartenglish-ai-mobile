import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchScanQuotaApi, submitScanImageApi } from '../data/scanApi';

export const SCAN_QUOTA_KEY = ['scan-quota'] as const;

/** Lượt quét còn lại hôm nay (server là nguồn chính xác; lỗi thì ẩn, server vẫn chặn khi hết lượt). */
export const useScanQuotaQuery = (enabled = true) => {
  return useQuery({
    queryKey: SCAN_QUOTA_KEY,
    queryFn: fetchScanQuotaApi,
    enabled,
    retry: 0,
    staleTime: 30_000,
  });
};

export const useSubmitScanMutation = () => {
  return useMutation({
    mutationFn: (params?: { base64Image?: string; mode?: 'document' | 'id_card' | 'book' | 'object' }) =>
      submitScanImageApi(params?.base64Image, params?.mode)
  });
};
