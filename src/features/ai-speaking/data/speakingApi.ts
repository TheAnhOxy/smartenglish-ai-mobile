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
  mouthShapeGuide?: string;
  audioSampleUrl?: string;
  sampleWords?: any[];
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

export interface SyllableEvaluation {
  syllable: string;
  ipa: string;
  isCorrect: boolean;
  score: number;
  feedback?: string;
  isStressed?: boolean;
}

export interface PronunciationAssessmentData {
  overallScore: number;
  accuracyScore: number;
  stressScore: number;
  intonationScore: number;
  fluencyScore: number;
  nativeComparisonScore: number;
  syllables?: SyllableEvaluation[];
  phonemeErrors: {
    targetPhonemes?: string[];
    mispronounced?: Array<{ phoneme: string; userAudioScore?: number; tip: string }>;
  };
  errorFeedback: string[];
  improvementTips: string[];
  audioUrl?: string;
  transcribedText?: string;
}

/**
 * Phân tích và bóc tách từ vựng thành các âm tiết IPA kèm đánh giá độ chuẩn xác (tô đỏ âm sai)
 */
export const extractAndEvaluateSyllables = (
  targetText: string,
  targetIpa: string = '',
  accuracyScore: number = 85,
  phonemeErrors?: any
): SyllableEvaluation[] => {
  let cleanIpa = targetIpa.replace(/^\/+|\/+$/g, '').trim();
  if (!cleanIpa) {
    cleanIpa = targetText.toLowerCase();
  }

  let rawSyllables: string[] = [];
  if (cleanIpa.includes('.')) {
    rawSyllables = cleanIpa.split('.').filter(Boolean);
  } else if (cleanIpa.includes('-')) {
    rawSyllables = cleanIpa.split('-').filter(Boolean);
  } else {
    // Tách theo trọng âm hoặc cụm âm
    const chunks: string[] = [];
    let current = '';
    for (let i = 0; i < cleanIpa.length; i++) {
      const ch = cleanIpa[i];
      if ((ch === 'ˈ' || ch === 'ˌ') && current.length > 0) {
        chunks.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
    if (current) chunks.push(current);

    if (chunks.length > 1) {
      rawSyllables = chunks;
    } else {
      const len = cleanIpa.length;
      if (len <= 4) {
        rawSyllables = [cleanIpa];
      } else {
        const mid = Math.floor(len / 2);
        rawSyllables = [cleanIpa.slice(0, mid), cleanIpa.slice(mid)];
      }
    }
  }

  // Thu thập danh sách lỗi âm vị từ AI backend
  const errList: Array<{ phoneme: string; tip: string }> = [];
  if (Array.isArray(phonemeErrors)) {
    phonemeErrors.forEach((p: any) => {
      const ph = (p.phoneme || p.expectedPhoneme || '').replace(/^\/+|\/+$/g, '').trim();
      const tip = p.correction || p.issue || p.message || p.tip || p.suggestion || '';
      if (ph) errList.push({ phoneme: ph, tip });
    });
  } else if (phonemeErrors?.mispronounced && Array.isArray(phonemeErrors.mispronounced)) {
    phonemeErrors.mispronounced.forEach((p: any) => {
      const ph = (p.phoneme || '').replace(/^\/+|\/+$/g, '').trim();
      const tip = p.tip || p.message || '';
      if (ph) errList.push({ phoneme: ph, tip });
    });
  }

  return rawSyllables.map((syl, idx) => {
    const cleanSyl = syl.replace(/[ˈˌ]/g, '').toLowerCase();
    const isStressed = syl.includes('ˈ') || syl.includes('ˌ');

    // Tìm xem âm tiết này có chứa âm vị bị lỗi không
    const matchedErr = errList.find(
      (e) => cleanSyl.includes(e.phoneme.toLowerCase()) || e.phoneme.toLowerCase().includes(cleanSyl)
    );

    // Nếu có lỗi âm vị rõ ràng từ AI -> đánh dấu lỗi
    // Nếu không có danh sách lỗi âm vị từ AI: chỉ đánh dấu lỗi khi điểm < 75%
    let isErr = false;
    let errTip = '';

    if (matchedErr) {
      isErr = true;
      errTip = matchedErr.tip;
    } else if (errList.length === 0 && accuracyScore < 75) {
      // Khi phát âm dưới 75%, đánh dấu âm tiết cuối hoặc âm tiết trọng âm chưa đạt
      if (rawSyllables.length > 1 && idx === rawSyllables.length - 1) {
        isErr = true;
        errTip = `Âm đuôi '${syl}' phát âm chưa dứt khoát.`;
      }
    }

    const score = isErr
      ? Math.max(48, Math.min(68, accuracyScore - 18))
      : Math.min(98, Math.max(82, accuracyScore + 4));

    let feedback = 'Phát âm chuẩn xác, đúng trường độ và cao độ.';
    if (isErr) {
      feedback = errTip || (isStressed
        ? `Cần nhấn rõ trọng âm '${syl}', mở rộng khoang miệng.`
        : `Âm tiết '${syl}' cần phát âm rõ nét hơn, tránh nuốt âm.`);
    }

    return {
      syllable: syl.replace(/[ˈˌ]/g, ''),
      ipa: `/${syl}/`,
      isCorrect: !isErr,
      score: Math.round(score),
      feedback,
      isStressed,
    };
  });
};

/** Lỗi từ server (FastAPI `detail`) hoặc thông báo mặc định — để hiện cho học viên thay vì bịa điểm. */
export const speakingErrorMessage = (err: unknown, fallback: string): string => {
  const detail = (err as { response?: { data?: { detail?: unknown; message?: unknown } } })?.response?.data;
  if (typeof detail?.detail === 'string') return detail.detail;
  if (typeof detail?.message === 'string') return detail.message;
  if ((err as { code?: string })?.code === 'ECONNABORTED') return 'AI phản hồi quá lâu. Hãy thử lại.';
  return fallback;
};

/** Chấm phát âm từ bản ghi âm thật. Lỗi (không có giọng nói, AI lỗi…) được ném ra — không tự bịa điểm. */
export const evaluatePronunciationApi = async (params: {
  targetText: string;
  targetIpa?: string;
  audioBase64?: string;
  audioMimeType?: string;
  sessionType?: string;
}): Promise<PronunciationAssessmentData> => {
  if (!params.audioBase64) throw new Error('Chưa ghi âm được giọng của bạn. Hãy bấm micro và đọc lại.');
  let response;
  try {
    response = await apiClient.post<any>(
      '/api/v1/ai-practice/speaking/pronunciation/evaluate',
      {
        sessionType: params.sessionType || 'SINGLE_WORD',
        targetText: params.targetText,
        targetIpa: params.targetIpa,
        audioBase64: params.audioBase64,
        audioMimeType: params.audioMimeType || 'audio/mp4',
      },
      { timeout: 45000 },
    );
  } catch (err) {
    throw new Error(speakingErrorMessage(err, 'AI chưa chấm được phát âm. Hãy thử lại.'));
  }
  {
    const data = response.data?.data || response.data;
    if (data && typeof data.overallScore === 'number') {
      const overall = Math.round(data.overallScore);
      const acc = Math.round(data.accuracyScore ?? data.overallScore);
      const stress = Math.round(data.stressScore ?? 0);
      const intonation = Math.round(data.intonationScore ?? 0);
      const fluency = Math.round(data.fluencyScore ?? 0);
      const syllables = extractAndEvaluateSyllables(
        params.targetText,
        params.targetIpa || '',
        acc,
        data.phonemeErrors
      );

      return {
        overallScore: overall,
        accuracyScore: acc,
        stressScore: stress,
        intonationScore: intonation,
        fluencyScore: fluency,
        nativeComparisonScore: Math.round(data.nativeComparisonScore ?? 0),
        syllables,
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
  }
  throw new Error('AI chưa chấm được phát âm. Hãy thử lại.');
};

/** Giọng nói → chữ (micro ở Hội thoại AI trên iOS/Android). */
export const transcribeSpeechApi = async (audioBase64: string, audioMimeType = 'audio/mp4'): Promise<string> => {
  try {
    const response = await apiClient.post<any>(
      '/api/v1/ai-practice/speaking/transcribe',
      { audioBase64, audioMimeType },
      { timeout: 30000 },
    );
    const transcript = (response.data?.data || response.data)?.transcript;
    if (typeof transcript === 'string' && transcript.trim()) return transcript.trim();
  } catch (err) {
    throw new Error(speakingErrorMessage(err, 'Chưa nhận dạng được giọng nói. Hãy thử lại.'));
  }
  throw new Error('Không nghe rõ giọng nói. Hãy nói to và rõ hơn.');
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

