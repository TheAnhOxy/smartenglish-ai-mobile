import { useQuery } from '@tanstack/react-query';
import { fetchPlacementStatusApi } from '../data/onboardingApi';
import { PLACEMENT_STATUS_KEY } from './placementRoutes';

/** Trạng thái bài kiểm tra đầu vào của học viên đã đăng nhập (khách: không gọi API). */
export const usePlacementStatusQuery = (userId?: string | number | null, enabled = true) =>
  useQuery({
    queryKey: [...PLACEMENT_STATUS_KEY, userId ?? 'guest'],
    queryFn: fetchPlacementStatusApi,
    enabled: enabled && userId != null && userId !== '',
    staleTime: 60_000,
    retry: 1,
  });
