import { ChatMessage } from '@/src/core/types/schema';

export interface ChatConversationItem {
  id: string;
  title: string;
  last_message: string;
  last_message_at: string;
}

export const MOCK_CONVERSATIONS: ChatConversationItem[] = [
  {
    id: 'chat-1',
    title: 'Hỏi Đáp Từ Vựng & Cấu Trúc',
    last_message: 'Sparky: "Accomplish" thường đi với tân ngữ là goal hoặc task.',
    last_message_at: '2026-08-16T10:15:00Z'
  }
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    message_id: 'm1',
    role: 'user',
    content: 'Can you explain how to use the word accomplish in a business sentence?',
    sent_at: '2026-08-16T10:14:00Z'
  },
  {
    message_id: 'm2',
    role: 'assistant',
    content: 'Certainly! "Accomplish" means to achieve or complete something successfully. Example: "Our team accomplished all project goals before the deadline."',
    sent_at: '2026-08-16T10:15:00Z',
    referenced_word_ids: ['word-02']
  }
];

export const sendChatMessageApi = async (text: string): Promise<ChatMessage> => {
  return {
    message_id: `m-${Date.now()}`,
    role: 'assistant',
    content: `Sparky: Cảm ơn bạn! Tôi hiểu bạn vừa nói "${text}". Bạn có muốn tôi giải thích thêm về ngữ pháp câu này không?`,
    sent_at: new Date().toISOString(),
    grammar_check: {
      has_error: false,
      corrected_text: text,
      rule_explanation_vi: 'Câu của bạn viết hoàn toàn đúng ngữ pháp!',
      natural_alternatives: [
        `Could you please clarify "${text}"?`,
        `I would like to inquire about "${text}".`
      ]
    }
  };
};
