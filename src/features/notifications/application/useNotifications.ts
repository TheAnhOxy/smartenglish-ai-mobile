import { useQuery } from '@tanstack/react-query';
import { fetchNotificationsApi } from '../data/notificationApi';

export const useNotificationsQuery = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotificationsApi()
  });
};
