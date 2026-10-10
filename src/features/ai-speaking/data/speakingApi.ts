import { apiClient } from '@/src/core/api/client';

export interface PronunciationResult {
  overall_score: number;
  accuracy_score: number;
  stress_score: number;
  intonation_score: number;
  fluency_score: number;
  phoneme_errors: Array<{ phoneme: string; position: number; message: string }>;
  feedback_vi?: string;
}

export interface PronunciationLesson {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  targetText: string;
  ipaTranscription: string;
  meaningVi: string;
  cefrLevel: string;
  isPremium: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

let memoryPronLessonsCache: CacheEntry<PronunciationLesson[]> | null = null;
let memoryRoleplayCache: CacheEntry<RoleplayScenario[]> | null = null;

export const clearSpeakingCache = () => {
  memoryPronLessonsCache = null;
  memoryRoleplayCache = null;
};

export const fetchPronunciationLessonsApi = async (forceRefresh: boolean = false): Promise<PronunciationLesson[]> => {
  if (!forceRefresh && memoryPronLessonsCache && (Date.now() - memoryPronLessonsCache.timestamp < CACHE_TTL)) {
    return memoryPronLessonsCache.data;
  }
  try {
    const response = await apiClient.get<any>('/api/v1/content/pronunciation-lessons?page=0&size=20');
    const data = response.data?.data?.items || response.data?.data?.content || response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      const result: PronunciationLesson[] = data.map((item: any) => {
        const firstWord = Array.isArray(item.sampleWords) && item.sampleWords.length > 0 ? item.sampleWords[0] : null;
        const targetText = item.targetText || (firstWord ? (typeof firstWord === 'string' ? firstWord : firstWord.word || firstWord.text) : item.title) || '';
        const ipa = item.ipaSymbol || item.ipaTranscription || (firstWord?.ipa) || '';
        const meaning = item.meaningVi || item.description || (firstWord?.meaning) || '';

        return {
          id: item.id,
          title: item.title || targetText || 'Bài Phát Âm',
          category: item.category || 'Vowels',
          difficulty: item.difficulty || item.cefrLevel || 'A1',
          targetText,
          ipaTranscription: ipa,
          meaningVi: meaning,
          cefrLevel: item.cefrLevel || 'A1',
          isPremium: Boolean(item.isPremium),
        };
      });
      memoryPronLessonsCache = { data: result, timestamp: Date.now() };
      return result;
    }
  } catch (err) {
    console.warn('[speakingApi] fetchPronunciationLessons error:', err);
  }
  if (memoryPronLessonsCache) {
    return memoryPronLessonsCache.data;
  }
  return [];
};

export interface RoleplayScenario {
  id: string;
  title: string;
  title_en?: string;
  ai_persona: string;
  opening_line: string;
  cefr_level: string;
  is_premium: boolean;
  category?: string;
  partner_name?: string;
  partner_avatar_url?: string;
  image_url?: string;
  suggested_keywords?: string[];
}

export interface RoleplayChatResponse {
  sessionId: number;
  aiResponse: string;
  suggestedNextReplies: string[];
  grammarCorrections: string[];
  vocabularySuggestions: Array<{ word: string; meaningVi: string }>;
}

export const fetchRoleplayScenariosApi = async (forceRefresh: boolean = false): Promise<RoleplayScenario[]> => {
  if (!forceRefresh && memoryRoleplayCache && (Date.now() - memoryRoleplayCache.timestamp < CACHE_TTL)) {
    return memoryRoleplayCache.data;
  }
  try {
    const response = await apiClient.get<any>('/api/v1/ai-practice/speaking/roleplay/scenarios');
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      const result: RoleplayScenario[] = data.map((s: any) => ({
        id: String(s.id),
        title: s.titleVi || s.title || s.titleEn || 'Kịch Bản Hội Thoại',
        ai_persona: s.aiPersona || s.partnerRole || s.aiRole || s.ai_persona || 'Nhân viên AI',
        opening_line: s.openingLine || s.initialPromptEn || s.opening_line || 'Hello! How can I help you today?',
        cefr_level: s.cefrLevel || s.cefr_level || 'B1',
        is_premium: Boolean(s.isPremium ?? s.isPremiumOnly ?? s.is_premium),
        category: s.category || 'Giao tiếp',
        partner_name: s.partnerName || 'AI Partner',
        partner_avatar_url: s.partnerAvatarUrl || s.partner_avatar_url || '',
        image_url: s.imageUrl || s.image_url || '',
        suggested_keywords: s.suggestedKeywords || s.suggested_keywords || [],
      }));
      memoryRoleplayCache = { data: result, timestamp: Date.now() };
      return result;
    }
  } catch (err) {
    console.warn('Roleplay Scenarios API error:', err);
    if (memoryRoleplayCache) {
      return memoryRoleplayCache.data;
    }
    throw err;
  }
  return [];
};

export interface PronunciationAssessmentData {
  overallScore: number;
  accuracyScore: number;
  stressScore: number;
  intonationScore: number;
  fluencyScore: number;
  nativeComparisonScore: number;
  phonemeErrors: {
    targetPhonemes?: string[];
    mispronounced?: Array<{ phoneme: string; userAudioScore?: number; tip: string }>;
  };
  errorFeedback: string[];
  improvementTips: string[];
  audioUrl?: string;
  transcribedText?: string;
}

export const evaluatePronunciationApi = async (params: {
  targetText: string;
  targetIpa?: string;
  audioBase64?: string;
  sessionType?: string;
}): Promise<PronunciationAssessmentData> => {
  const body = {
    sessionType: params.sessionType || 'SINGLE_WORD',
    targetText: params.targetText,
    targetIpa: params.targetIpa,
    audioBase64: params.audioBase64,
  };

  try {
    const response = await apiClient.post<any>(
      '/api/v1/ai-practice/speaking/pronunciation/evaluate',
      body
    );
    const data = response.data?.data || response.data;
    if (data && typeof data.overallScore === 'number') {
      const overall = Math.round(data.overallScore);
      const acc = Math.round(data.accuracyScore ?? data.overallScore);
      const stress = Math.round(data.stressScore ?? 0);
      const intonation = Math.round(data.intonationScore ?? 0);
      const fluency = Math.round(data.fluencyScore ?? 0);
      return {
        overallScore: overall,
        accuracyScore: acc,
        stressScore: stress,
        intonationScore: intonation,
        fluencyScore: fluency,
        nativeComparisonScore: Math.round(data.nativeComparisonScore ?? 0),
        phonemeErrors: data.phonemeErrors || {
          targetPhonemes: [],
          mispronounced: [],
        },
        errorFeedback: Array.isArray(data.errorFeedback) ? data.errorFeedback : [],
        improvementTips: Array.isArray(data.improvementTips) ? data.improvementTips : [],
        audioUrl: data.audioUrl,
        transcribedText: data.transcribedText,
      };
    }
  } catch (err) {
    console.warn('[speakingApi] evaluatePronunciationApi backend error:', err);
    throw err;
  }

  throw new Error('Backend không trả về kết quả chấm phát âm hợp lệ');
};

export const submitPronunciationAudioApi = async (
  targetText: string = 'I would like to order a cup of hot coffee please.',
  audioUrl?: string
): Promise<PronunciationResult> => {
  try {
    const response = await apiClient.post<any>('/api/v1/ai-practice/speaking/pronunciation/evaluate', {
      targetText,
      audioUrl: audioUrl || 'https://cdn.smartenglish.com/audio/sample_pronunciation.mp3'
    });
    const data = response.data?.data || response.data;
    if (data) {
      return {
        overall_score: data.overallScore ?? 0,
        accuracy_score: data.accuracyScore ?? 0,
        stress_score: data.stressScore ?? 0,
        intonation_score: data.intonationScore ?? 0,
        fluency_score: data.fluencyScore ?? 0,
        phoneme_errors: (data.phonemeErrors || []).map((err: any, idx: number) => ({
          phoneme: err.expectedPhoneme || err.phoneme || '/.../',
          position: idx * 5,
          message: err.suggestion || err.message || 'Chú ý phát âm khẩu hình âm'
        })),
        feedback_vi: data.feedbackVi
      };
    }
  } catch (err) {
    console.warn('Pronunciation API error:', err);
    throw err;
  }

  throw new Error('Backend không trả về kết quả phát âm hợp lệ');
};

export * from './speakingQuotaStore';


export interface SpeakingQuotaApiResponse {
  dailyLimit: number;
  usedDailyChats: number;
  remainingDailyChats: number;
  isPremium: boolean;
}

export const fetchSpeakingDailyQuotaApi = async (
  _userId?: string,
  _isPremium: boolean = false
): Promise<SpeakingQuotaApiResponse> => {
  try {
    const response = await apiClient.get<any>('/api/v1/ai-practice/speaking/roleplay/quota');
    const data = response.data?.data || response.data;
    if (data) {
      return {
        dailyLimit: data.dailyLimit ?? 20,
        usedDailyChats: data.usedDailyChats ?? 0,
        remainingDailyChats: data.remainingDailyChats ?? 20,
        isPremium: Boolean(data.isPremium),
      };
    }
  } catch (err) {
    throw err;
  }

  throw new Error('Backend không trả về thông tin quota hợp lệ');
};

export const sendRoleplayChatApi = async (
  scenarioId: number | string,
  userMessage: string,
  _userId?: string,
  _isPremium: boolean = false
): Promise<RoleplayChatResponse> => {
  try {
    const response = await apiClient.post<any>('/api/v1/ai-practice/speaking/roleplay/chat', {
      scenarioId: Number(scenarioId),
      userMessage,
      userText: userMessage
    });
    const data = response.data?.data || response.data;
    if (data) {
      return {
        sessionId: data.sessionId,
        aiResponse: data.aiResponse || data.aiResponseText,
        suggestedNextReplies: data.suggestedNextReplies || [],
        grammarCorrections: data.grammarCorrections || [],
        vocabularySuggestions: data.vocabularySuggestions || []
      };
    }
  } catch (err: any) {
    console.warn('Roleplay Chat API error:', err);
    throw err;
  }

  throw new Error('Backend không trả về phản hồi roleplay hợp lệ');
};

