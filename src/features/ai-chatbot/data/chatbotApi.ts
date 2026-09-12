import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { ChatMessage } from '@/src/core/types/schema';

export interface ChatConversationItem {
  id: string;
  title: string;
  last_message: string;
  last_message_at: string;
}

// In-session conversation history sent to backend for multi-turn context
let _conversationHistory: Array<{ role: 'user' | 'model'; content: string }> = [];

export const clearChatHistory = () => {
  _conversationHistory = [];
};

/**
 * Sends a message to the backend AI chat endpoint (/api/v1/ai-practice/chat).
 * The backend proxies to Gemini — no API key needed on mobile.
 */
export const sendChatMessageApi = async (
  text: string,
  cefrLevel: string = 'Intermediate',
  topic: string = 'Tự do'
): Promise<ChatMessage> => {
  try {
    // Include recent history (last 10 turns) for multi-turn conversation
    const recentHistory = _conversationHistory.slice(-10);

    const response = await apiClient.post<any>('/api/v1/ai-practice/chat', {
      message: text,
      cefrLevel,
      topic,
      history: recentHistory
    });

    const data = response.data?.data || response.data;
    const reply: string = data?.reply || data?.message || 'Loxera AI đang bận, vui lòng thử lại sau.';

    // Append user + AI turns to local history for multi-turn context
    _conversationHistory.push({ role: 'user', content: text });
    _conversationHistory.push({ role: 'model', content: reply });

    return {
      message_id: `m-${Date.now()}`,
      role: 'assistant',
      content: reply,
      sent_at: new Date().toISOString()
    };
  } catch (err: any) {
    console.warn('[chatbotApi] AI chat API error:', err?.message || err);
    return {
      message_id: `m-err-${Date.now()}`,
      role: 'assistant',
      content: 'Không thể kết nối với Loxera AI lúc này. Vui lòng kiểm tra kết nối mạng và thử lại.',
      sent_at: new Date().toISOString()
    };
  }
};
