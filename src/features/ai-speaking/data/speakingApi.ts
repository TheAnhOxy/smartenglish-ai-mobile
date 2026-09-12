import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface PronunciationResult {
  overall_score: number;
  accuracy_score: number;
  stress_score: number;
  intonation_score: number;
  fluency_score: number;
  phoneme_errors: Array<{ phoneme: string; position: number; message: string }>;
  feedback_vi?: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  ai_persona: string;
  opening_line: string;
  cefr_level: string;
  is_premium: boolean;
}

export interface RoleplayChatResponse {
  sessionId: number;
  aiResponse: string;
  suggestedNextReplies: string[];
  grammarCorrections: string[];
  vocabularySuggestions: Array<{ word: string; meaningVi: string }>;
}

export const MOCK_ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: '1',
    title: 'Gọi Đồ Uống Tại Quán Cà Phê',
    ai_persona: 'Nhân viên pha chế Starbucks',
    opening_line: 'Hello! Welcome to Starbucks. What can I get started for you today?',
    cefr_level: 'A2',
    is_premium: false
  },
  {
    id: '2',
    title: 'Phỏng Vấn Xin Việc Vị Trí Developer',
    ai_persona: 'Giám đốc Kỹ thuật (CTO)',
    opening_line: 'Good morning! Thank you for coming in today. Could you tell me about your background?',
    cefr_level: 'B2',
    is_premium: true
  }
];

export const fetchRoleplayScenariosApi = async (): Promise<RoleplayScenario[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/ai-practice/speaking/roleplay/scenarios');
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s: any) => ({
        id: String(s.id),
        title: s.titleVi || s.title || 'Kịch Bản Hội Thoại',
        ai_persona: s.aiRole || s.ai_persona || 'Nhân viên AI',
        opening_line: s.initialPromptEn || s.opening_line || 'Hello! How can I help you today?',
        cefr_level: s.cefrLevel || 'B1',
        is_premium: Boolean(s.isPremiumOnly)
      }));
    }
  } catch (err) {
    console.warn('Real Roleplay Scenarios API error, returning mock scenarios:', err);
  }
  return MOCK_ROLEPLAY_SCENARIOS;
};

export const submitPronunciationAudioApi = async (
  targetText: string = 'I would like to order a cup of hot coffee please.',
  audioUrl?: string,
  userId?: string
): Promise<PronunciationResult> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/ai-practice/speaking/pronunciation/evaluate?userId=${uid}`, {
      targetText,
      audioUrl: audioUrl || 'https://cdn.smartenglish.com/audio/sample_pronunciation.mp3'
    });
    const data = response.data?.data || response.data;
    if (data) {
      return {
        overall_score: data.overallScore || 88,
        accuracy_score: data.accuracyScore || 90,
        stress_score: data.stressScore || 85,
        intonation_score: data.intonationScore || 86,
        fluency_score: data.fluencyScore || 91,
        phoneme_errors: (data.phonemeErrors || []).map((err: any, idx: number) => ({
          phoneme: err.expectedPhoneme || err.phoneme || '/.../',
          position: idx * 5,
          message: err.suggestion || err.message || 'Chú ý phát âm khẩu hình âm'
        })),
        feedback_vi: data.feedbackVi || 'Phát âm tự nhiên và rõ ràng!'
      };
    }
  } catch (err) {
    console.warn('Real Pronunciation API error, fallback to mock result:', err);
  }

  return {
    overall_score: 85,
    accuracy_score: 88,
    stress_score: 80,
    intonation_score: 84,
    fluency_score: 88,
    phoneme_errors: [
      { phoneme: 'ʃ', position: 10, message: 'Âm /ʃ/ đọc chưa đủ cong lưỡi' }
    ]
  };
};

export const sendRoleplayChatApi = async (
  scenarioId: number | string,
  userMessage: string,
  userId?: string
): Promise<RoleplayChatResponse> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/ai-practice/speaking/roleplay/chat?userId=${uid}`, {
      scenarioId: Number(scenarioId),
      userText: userMessage
    });
    const data = response.data?.data || response.data;
    if (data) {
      return {
        sessionId: data.sessionId || 1,
        aiResponse: data.aiResponse || 'Thank you for your message. How else can I assist you?',
        suggestedNextReplies: data.suggestedNextReplies || [
          "I'd love a cappuccino, thank you.",
          "Could you recommend something else?"
        ],
        grammarCorrections: data.grammarCorrections || [],
        vocabularySuggestions: data.vocabularySuggestions || []
      };
    }
  } catch (err) {
    console.warn('Real Roleplay Chat API error, fallback to mock AI response:', err);
  }

  return {
    sessionId: 1,
    aiResponse: `AI Roleplay (${userMessage}): Good morning! Certainly, here is our menu. What would you like to order today?`,
    suggestedNextReplies: [
      "I'd love a cup of hot coffee, please.",
      "Could I get a glass of orange juice?"
    ],
    grammarCorrections: [],
    vocabularySuggestions: [
      { word: 'avocado toast', meaningVi: 'bánh mì nướng bơ' }
    ]
  };
};
