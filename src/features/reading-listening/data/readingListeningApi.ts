import { apiClient, getCurrentUserId } from '@/src/core/api/client';

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

export const MOCK_PASSAGE: PassageItem = {
  id: '1',
  title: 'Artificial Intelligence in Modern Healthcare',
  cefr_level: 'B2',
  content_en: 'Artificial Intelligence is revolutionizing modern healthcare system. Machine learning algorithms allow doctors to diagnose complex diseases earlier and with higher precision than ever before.',
  content_vi: 'Trí tuệ nhân tạo đang cách mạng hóa hệ thống y tế hiện đại. Các thuật toán học máy cho phép bác sĩ chẩn đoán các bệnh phức tạp sớm hơn và với độ chính xác cao hơn bao giờ hết.',
  key_vocabulary: [
    { word: 'Artificial Intelligence', meaningVi: 'Trí tuệ nhân tạo', ipaUs: '/ˌɑːrtɪˈfɪʃl ɪnˈtelɪdʒəns/' },
    { word: 'Revolutionize', meaningVi: 'Cách mạng hóa', ipaUs: '/ˌrev.əˈluː.ʃə.naɪz/' }
  ]
};

export const MOCK_AUDIO_TRACK: AudioTrackItem = {
  id: '1',
  title: 'Business Podcast: Negotiation Strategies',
  audio_url: 'https://cdn.smartenglish.com/audio/listening_coffee_shop.mp3',
  duration_sec: 180,
  subtitles: [
    { time_ms: 0, text_en: 'Welcome back to Business Insights podcast.', text_vi: 'Chào mừng quay trở lại với podcast Business Insights.' },
    { time_ms: 5000, text_en: 'Today we will discuss effective negotiation strategies.', text_vi: 'Hôm nay chúng ta sẽ thảo luận về chiến lược đàm phán hiệu quả.' }
  ]
};

export const fetchPassageApi = async (id: string): Promise<PassageItem> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/content/reading/passages/${id}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        id: String(data.id || id),
        title: data.titleEn || data.titleVi || 'Reading Passage',
        cefr_level: data.cefrLevel || 'B1',
        content_en: data.passageText || MOCK_PASSAGE.content_en,
        content_vi: data.titleVi || MOCK_PASSAGE.content_vi,
        key_vocabulary: data.keyVocabulary || MOCK_PASSAGE.key_vocabulary
      };
    }
  } catch (err) {
    console.warn('Real Reading Passage API error, fallback to mock:', err);
  }
  return MOCK_PASSAGE;
};

export const fetchAudioTrackApi = async (id: string): Promise<AudioTrackItem> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/content/listening/lessons/${id}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        id: String(data.id || id),
        title: data.titleEn || data.titleVi || 'Listening Lesson',
        audio_url: data.audioUrl || MOCK_AUDIO_TRACK.audio_url,
        duration_sec: data.durationSec || 180,
        subtitles: (data.syncedTranscripts || []).map((st: any) => ({
          time_ms: st.startMs || st.time_ms || 0,
          text_en: st.text || st.text_en || '',
          text_vi: st.textVi || st.text_vi || ''
        }))
      };
    }
  } catch (err) {
    console.warn('Real Listening Lesson API error, fallback to mock:', err);
  }
  return MOCK_AUDIO_TRACK;
};

export const fetchPassagesListApi = async (cefrLevel?: string, topicId?: number): Promise<PassageItem[]> => {
  try {
    const params = new URLSearchParams();
    if (cefrLevel) params.append('cefrLevel', cefrLevel);
    if (topicId) params.append('topicId', String(topicId));
    const url = `/api/v1/content/reading/passages${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<any>(url);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((p: any) => ({
        id: String(p.id),
        title: p.titleEn || p.titleVi || 'Reading Passage',
        cefr_level: p.cefrLevel || 'B1',
        content_en: p.passageText || '',
        content_vi: p.titleVi || '',
        key_vocabulary: p.keyVocabulary || []
      }));
    }
  } catch (err) {
    console.warn('Passages list API error:', err);
  }
  return [];
};

export const fetchListeningLessonsListApi = async (cefrLevel?: string, topicId?: number): Promise<AudioTrackItem[]> => {
  try {
    const params = new URLSearchParams();
    if (cefrLevel) params.append('cefrLevel', cefrLevel);
    if (topicId) params.append('topicId', String(topicId));
    const url = `/api/v1/content/listening/lessons${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<any>(url);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
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
  } catch (err) {
    console.warn('Listening lessons list API error:', err);
  }
  return [];
};
