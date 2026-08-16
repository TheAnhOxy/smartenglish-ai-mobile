import { useQuery } from '@tanstack/react-query';
import { fetchSocialFeedApi } from '../data/feedApi';

export const useSocialFeedQuery = () => {
  return useQuery({
    queryKey: ['social-feed'],
    queryFn: fetchSocialFeedApi
  });
};
