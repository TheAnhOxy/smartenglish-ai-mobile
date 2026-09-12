import { useMutation } from '@tanstack/react-query';
import { submitPronunciationAudioApi } from '../data/speakingApi';

export const usePronunciationMutation = () => {
  return useMutation({
    mutationFn: (targetText?: string) => submitPronunciationAudioApi(targetText)
  });
};
