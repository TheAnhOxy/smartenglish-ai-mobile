import { apiClient } from '@/src/core/api/client';

/** Câu hỏi trắc nghiệm của bài đọc / bài nghe (đã chuẩn hoá 2 định dạng lưu trên web). */
export interface SkillQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const stripOptionPrefix = (s: string) => s.replace(/^\s*[A-Da-d][.)]\s+/, '').trim();

export const normalizeSkillQuestions = (raw: unknown): SkillQuestion[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q: any, idx: number): SkillQuestion | null => {
      const options: string[] = Array.isArray(q?.options)
        ? q.options.map((o: any) => stripOptionPrefix(typeof o === 'string' ? o : String(o?.text ?? o?.label ?? '')))
        : [];
      const question = String(q?.questionText ?? q?.question ?? '').trim();
      if (!question || options.length < 2) return null;
      let correctIndex = typeof q?.correctIndex === 'number' ? q.correctIndex : -1;
      if (correctIndex < 0 && q?.correctAnswer != null) {
        const ans = String(q.correctAnswer).trim();
        if (/^[A-Da-d]$/.test(ans)) correctIndex = ans.toUpperCase().charCodeAt(0) - 65;
        else correctIndex = options.findIndex((o) => o.toLowerCase() === stripOptionPrefix(ans).toLowerCase());
      }
      if (correctIndex < 0 || correctIndex >= options.length) return null;
      return {
        id: String(q?.id ?? idx + 1),
        question,
        options,
        correctIndex,
        explanation: q?.explanationVi || q?.explanation || undefined,
      };
    })
    .filter((q): q is SkillQuestion => q !== null);
};

export interface PassageItem {
  id: string;
  title: string;
  cefr_level: string;
  content_en: string;
  content_vi: string;
  key_vocabulary?: Array<{ word: string; meaningVi: string; ipaUs: string }>;
  topic?: string;
  questions: SkillQuestion[];
}

export interface AudioTrackItem {
  id: string;
  title: string;
  audio_url: string;
  duration_sec: number;
  /** Lời thoại đầy đủ, dùng để đọc bằng giọng máy khi bài chưa có file audio. */
  transcript: string;
  subtitles:Array<{ time_ms: number; text_en: string; text_vi: string }>;
  cefr_level?: string;
  questions?: SkillQuestion[];
}

export const fetchPassageApi = async (id: string): Promise<PassageItem> => {
  if (!id) {
    throw new Error('ID bài đọc không hợp lệ');
  }
  const response = await apiClient.get<any>(`/api/v1/content/reading/passages/${id}`);
  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Không tìm thấy nội dung bài đọc');
  }
  return {
    id: String(data.id || id),
    title: data.titleEn || data.titleVi || 'Reading Passage',
    cefr_level: data.cefrLevel || 'B1',
    content_en: data.passageText || '',
    content_vi: data.titleVi || '',
    key_vocabulary: data.keyVocabulary || [],
    topic: data.topic || undefined,
    questions: normalizeSkillQuestions(data.questions),
  };
};

export const fetchAudioTrackApi = async (id: string): Promise<AudioTrackItem> => {
  if (!id) {
    throw new Error('ID bài nghe không hợp lệ');
  }
  const response = await apiClient.get<any>(`/api/v1/content/listening/lessons/${id}`);
  const data = response.data?.data || response.data;
  if (!data) {
    throw new Error('Không tìm thấy nội dung bài nghe');
  }
  return {
    id: String(data.id || id),
    title: data.titleEn || data.titleVi || 'Listening Lesson',
    audio_url: data.audioUrl || '',
    duration_sec: data.durationSec || 0,
    transcript: data.transcript || '',
    subtitles: (data.syncedTranscripts || []).map((st: any) => ({
      time_ms: st.startMs || st.time_ms || 0,
      text_en: st.text || st.text_en || '',
      text_vi: st.textVi || st.text_vi || ''
    })),
    cefr_level: data.cefrLevel || undefined,
    questions: normalizeSkillQuestions(data.questions),
  };
};

export const fetchPassagesListApi = async (cefrLevel?: string, topicId?: number): Promise<PassageItem[]> => {
  const params = new URLSearchParams();
  if (cefrLevel) params.append('cefrLevel', cefrLevel);
  if (topicId) params.append('topicId', String(topicId));
  const url = `/api/v1/content/reading/passages${params.toString() ? `?${params}` : ''}`;
  const response = await apiClient.get<any>(url);
  const data = response.data?.data || response.data;
  if (Array.isArray(data)) {
    return data.map((p: any) => ({
      id: String(p.id),
      title: p.titleEn || p.titleVi || 'Reading Passage',
      cefr_level: p.cefrLevel || 'B1',
      content_en: p.passageText || '',
      content_vi: p.titleVi || '',
      key_vocabulary: p.keyVocabulary || [],
      questions: normalizeSkillQuestions(p.questions),
    }));
  }
  return [];
};

export const fetchListeningLessonsListApi = async (cefrLevel?: string, topicId?: number): Promise<AudioTrackItem[]> => {
  const params = new URLSearchParams();
  if (cefrLevel) params.append('cefrLevel', cefrLevel);
  if (topicId) params.append('topicId', String(topicId));
  const url = `/api/v1/content/listening/lessons${params.toString() ? `?${params}` : ''}`;
  const response = await apiClient.get<any>(url);
  const data = response.data?.data || response.data;
  if (Array.isArray(data)) {
    return data.map((l: any) => ({
      id: String(l.id),
      title: l.titleEn || l.titleVi || 'Listening Lesson',
      audio_url: l.audioUrl || '',
      duration_sec: l.durationSec || 0,
      transcript: l.transcript || '',
      subtitles: (l.syncedTranscripts || []).map((st: any) => ({
        time_ms: st.startMs || 0,
        text_en: st.text || '',
        text_vi: st.textVi || ''
      }))
    }));
  }
  return [];
};

/** Lưu kết quả bài nghe / bài đọc để nhiệm vụ hằng ngày và thống kê tính đúng. */
export const saveSkillPracticeResultApi = async (payload: {
  kind: 'READING' | 'LISTENING';
  contentId: string;
  title?: string;
  correct: number;
  total: number;
  durationSec: number;
}): Promise<void> => {
  await apiClient.post('/api/v1/learning/skill-practice/results', payload);
};
