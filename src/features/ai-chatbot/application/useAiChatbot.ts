import { useMutation } from '@tanstack/react-query';
import { sendChatMessageApi } from '../data/chatbotApi';

export const useSendMessageMutation = () => {
  return useMutation({
    mutationFn: (text: string) => sendChatMessageApi(text)
  });
};
