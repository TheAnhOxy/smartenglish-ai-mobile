import { useQuery } from '@tanstack/react-query';
import { fetchPassageApi, fetchAudioTrackApi } from '../data/readingListeningApi';

export const usePassageQuery = (passageId: string) => {
  return useQuery({
    queryKey: ['passage', passageId],
    queryFn: () => fetchPassageApi(passageId)
  });
};

export const useAudioTrackQuery = (audioId: string) => {
  return useQuery({
    queryKey: ['audio-track', audioId],
    queryFn: () => fetchAudioTrackApi(audioId)
  });
};
