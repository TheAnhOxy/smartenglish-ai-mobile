import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/src/core/flows/authStore';
import { sendChatMessageApi } from '../data/chatbotApi';

export const useSendMessageMutation = (cefrLevel?: string) => {
  const profileLevel = useAuthStore((state) => state.currentUser?.cefr_level);
  return useMutation({
    mutationFn: (text: string) => sendChatMessageApi(text, cefrLevel || profileLevel || 'Intermediate')
  });
};
