/**
 * geminiService.ts — AI service that proxies through the backend.
 *
 * ALL Gemini calls are routed through the backend (api-gateway → ai-practice-service).
 * The mobile app never needs a Gemini API key.
 *
 * Legacy types are kept for compatibility with existing screens (AI Scan, AI Speaking).
 */

import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export type EnglishLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiResponse {
  success: boolean;
  reply: string;
  error?: string;
}

let _customApiKey: string | null = null;
export const setCustomApiKey = (key: string) => {
  _customApiKey = key;
};
export const getApiKey = (): string => {
  return _customApiKey || '';
};

export interface VisionDetectedItem {
  id: string;
  word_id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning_vi: string;
  confidence: number;
  bounding_box: { x: number; y: number; width: number; height: number };
  examples: {
    easy: string;
    medium: string;
    hard: string;
  };
}

export interface GeminiVisionResponse {
  success: boolean;
  detected_count: number;
  objects: VisionDetectedItem[];
  error?: string;
}

/**
 * Sends a chat message through the backend AI chat proxy.
 * History items are mapped from Gemini format to our backend format.
 */
export const sendMessageToGemini = async (
  userMessage: string,
  history: ChatHistoryItem[],
  level: EnglishLevel = 'Intermediate',
  topic: string = 'Tự do'
): Promise<GeminiResponse> => {
  try {
    // Map Gemini-style history to our backend format
    const backendHistory = history.slice(-10).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      content: h.parts.map((p) => p.text).join(' ')
    }));

    const response = await apiClient.post<any>('/api/v1/ai-practice/chat', {
      message: userMessage,
      cefrLevel: level,
      topic,
      history: backendHistory
    });

    const data = response.data?.data || response.data;
    const reply: string = data?.reply || data?.message || '';

    if (reply) {
      return { success: true, reply };
    }

    return {
      success: false,
      reply: '',
      error: 'Không thể kết nối với Loxera AI lúc này. Vui lòng thử lại.'
    };
  } catch (err: any) {
    console.warn('[geminiService] Backend chat error:', err?.message || err);
    return {
      success: false,
      reply: '',
      error: 'Lỗi kết nối mạng khi kết nối AI. Vui lòng thử lại.'
    };
  }
};

/**
 * Analyzes an image by sending base64 to the backend image-scan endpoint.
 * The backend (ai-practice-service) calls Gemini Vision internally.
 */
export const analyzeImageWithGemini = async (
  base64Image: string,
  mode: 'document' | 'id_card' | 'book' | 'object' = 'document'
): Promise<GeminiVisionResponse> => {
  const uid = getCurrentUserId();
  try {
    // Strip data URI prefix if present
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await apiClient.post<any>(
      `/api/v1/ai-practice/image-scan/analyze${uid ? `?userId=${uid}` : ''}`,
      {
        imageBase64: cleanBase64,
        source: mode === 'document' ? 'GALLERY' : 'CAMERA'
      }
    );

    const data = response.data?.data || response.data;
    if (data && Array.isArray(data.detectedObjects) && data.detectedObjects.length > 0) {
      const objects: VisionDetectedItem[] = data.detectedObjects.map((obj: any, idx: number) => ({
        id: String(obj.id || idx + 1),
        word_id: `w-${obj.id || idx + 1}`,
        word: obj.objectLabel || obj.word || 'Unknown Object',
        phonetic: obj.ipaUs || obj.phonetic || '/.../',
        pos: obj.partOfSpeech || 'Noun',
        meaning_vi: obj.meaningVi || '',
        confidence: obj.confidence ? Number(obj.confidence) : 0.9,
        bounding_box: {
          x: obj.boundingBoxX || 40,
          y: obj.boundingBoxY || 40,
          width: obj.boundingBoxWidth || 200,
          height: obj.boundingBoxHeight || 180
        },
        examples: {
          easy: obj.exampleEasy || `Look at that ${obj.objectLabel || 'object'}.`,
          medium: obj.exampleMedium || `The ${obj.objectLabel || 'object'} is very interesting.`,
          hard: obj.exampleHard || `The ${obj.objectLabel || 'object'} plays an important role.`
        }
      }));
      return { success: true, detected_count: objects.length, objects };
    }

    return {
      success: false,
      detected_count: 0,
      objects: [],
      error: 'Không nhận diện được vật thể. Vui lòng chụp lại rõ nét hơn.'
    };
  } catch (err: any) {
    console.warn('[geminiService] Image scan API error:', err?.message || err);
    return {
      success: false,
      detected_count: 0,
      objects: [],
      error: 'Không thể kết nối với dịch vụ AI lúc này. Vui lòng thử lại.'
    };
  }
};
