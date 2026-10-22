import { apiClient } from '@/src/core/api/client';

export interface PassageItem {
  id: string;
  title: string;
  cefr_level: string;
  content_en: string;
  content_vi: string;
  key_vocabulary?: Array<{ word: string; meaningVi: string; ipaUs: string }>;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  audio_url: string;
  duration_sec: number;
  subtitles: Array<{ time_ms: number; text_en: string; text_vi: string }>;
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
    key_vocabulary: data.keyVocabulary || []
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
    subtitles: (data.syncedTranscripts || []).map((st: any) => ({
      time_ms: st.startMs || st.time_ms || 0,
      text_en: st.text || st.text_en || '',
      text_vi: st.textVi || st.text_vi || ''
    }))
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
      key_vocabulary: p.keyVocabulary || []
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
      subtitles: (l.syncedTranscripts || []).map((st: any) => ({
        time_ms: st.startMs || 0,
        text_en: st.text || '',
        text_vi: st.textVi || ''
      }))
    }));
  }
  return [];
};
