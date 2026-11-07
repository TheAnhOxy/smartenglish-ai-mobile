import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { ChatMessage } from '@/src/core/types/schema';

export interface ChatConversationItem {
  id: string;
  title: string;
  last_message: string;
  last_message_at: string;
}
export interface ChatQuota {
  quota_used: number;
  quota_limit: number | null;
  quota_exceeded: boolean;
  is_premium?: boolean;
}
export interface ChatApiResponse extends Partial<ChatQuota> {
  transcript?: string;
  success: boolean;
  reply: string;
  error?: string | null;
}
export interface TutorAudio { base64: string; mimeType: 'audio/webm' | 'audio/mp4' | 'audio/m4a' | 'audio/wav' | 'audio/ogg' }
export interface ChatTurn { role: 'user' | 'model'; content: string }
type ApiEnvelope<T> = T | { data: T };
const unwrap = <T,>(body: ApiEnvelope<T>): T => 'data' in (body as object)
  ? (body as { data: T }).data : body as T;

let historyOwner = '';
let historyVersion = 0;
let conversationHistory: ChatTurn[] = [];
export const clearChatHistory = () => { conversationHistory = []; historyVersion++; };

export const getChatQuotaApi = async (): Promise<ChatQuota> => {
  const response = await apiClient.get<ApiEnvelope<ChatQuota>>('/api/v1/ai-practice/chat/quota');
  return unwrap(response.data);
};

/** All tutor clients share this contract. API keys stay on the backend. */
export const requestTutorReply = async (
  text: string, cefrLevel: string, history: ChatTurn[], audio?: TutorAudio
): Promise<ChatApiResponse> => {
  const response = await apiClient.post<ApiEnvelope<ChatApiResponse>>('/api/v1/ai-practice/chat', {
    message: text, cefrLevel, history: history.slice(-6),
    ...(audio ? { audioBase64: audio.base64, audioMimeType: audio.mimeType } : {}),
  }, { timeout: audio ? 45000 : 30000 });
  return unwrap(response.data);
};

export const sendChatMessageApi = async (
  text: string, cefrLevel: string = 'Intermediate'
): Promise<ChatMessage> => {
  const owner = getCurrentUserId();
  if (owner !== historyOwner) { clearChatHistory(); historyOwner = owner; }
  const version = historyVersion;
  try {
    const data = await requestTutorReply(text, cefrLevel, conversationHistory);
    const failed = !data.success || !data.reply;
    if (!failed && !data.quota_exceeded && owner === getCurrentUserId() && version === historyVersion) {
      conversationHistory = [...conversationHistory,
        { role: 'user' as const, content: text },
        { role: 'model' as const, content: data.reply }].slice(-6);
    }
    return {
      message_id: `m-${Date.now()}`, role: 'assistant',
      content: data.reply || data.error || 'Loxera AI đang bận, vui lòng thử lại sau.',
      sent_at: new Date().toISOString(), is_quota_message: !!data.quota_exceeded,
      is_error: failed, quota_used: data.quota_used, quota_limit: data.quota_limit,
    };
  } catch (error: unknown) {
    return {
      message_id: `m-err-${Date.now()}`, role: 'assistant',
      content: 'Không thể kết nối với Loxera AI. Kiểm tra mạng và thử lại.',
      sent_at: new Date().toISOString(), is_error: true,
    };
  }
};
