import { apiClient } from '@/src/core/api/client';

export interface WordDetail {
  id: string;
  word: string;
  ipaUs: string;
  ipaUk?: string;
  partOfSpeech: string;
  cefrLevel: string;
  definitionEn: string;
  definitionVi: string;
  examples: Array<{ sentenceEn: string; sentenceVi?: string }>;
  synonyms?: string[];
  antonyms?: string[];
  topicName?: string;
}

export interface WordSearchPage {
  items: WordDetail[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface VocabTopic {
  id: string;
  name: string;
  description?: string;
  wordCount?: number;
  iconUrl?: string;
}

const mapWord = (w: any): WordDetail => ({
  id: String(w.id || ''),
  word: w.word || w.wordEn || '',
  ipaUs: w.ipaUs || '',
  ipaUk: w.ipaUk || undefined,
  partOfSpeech: w.partOfSpeech || w.pos || 'noun',
  cefrLevel: w.cefrLevel || 'B1',
  definitionEn: w.definitionEn || w.definition || '',
  definitionVi: w.definitionVi || w.meaningVi || w.wordVi || '',
  examples: Array.isArray(w.examples)
    ? w.examples.map((ex: any) => ({
        sentenceEn: ex.sentenceEn || ex.sentence || typeof ex === 'string' ? ex : '',
        sentenceVi: ex.sentenceVi || undefined
      }))
    : [],
  synonyms: Array.isArray(w.synonyms) ? w.synonyms : undefined,
  antonyms: Array.isArray(w.antonyms) ? w.antonyms : undefined,
  topicName: w.topicName || undefined
});

/**
 * GET /api/v1/content/words/lookup?word=...
 * Look up a word by exact string
 */
export const lookupWordApi = async (word: string): Promise<WordDetail | null> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/content/words/lookup?word=${encodeURIComponent(word)}`);
    const data = response.data?.data || response.data;
    if (data && data.id) {
      return mapWord(data);
    }
  } catch (err) {
    console.warn('[VocabAPI] lookupWordApi error:', err);
  }
  return null;
};

/**
 * GET /api/v1/content/words/{id}
 * Get word detail by ID
 */
export const getWordByIdApi = async (id: string): Promise<WordDetail | null> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/content/words/${id}`);
    const data = response.data?.data || response.data;
    if (data && data.id) {
      return mapWord(data);
    }
  } catch (err) {
    console.warn('[VocabAPI] getWordByIdApi error:', err);
  }
  return null;
};

/**
 * GET /api/v1/content/words/search
 * Search words with filters and pagination
 */
export const searchWordsApi = async (params: {
  search?: string;
  partOfSpeech?: string;
  topicId?: number;
  cefrLevel?: string;
  page?: number;
  size?: number;
}): Promise<WordSearchPage> => {
  try {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.partOfSpeech) qs.append('partOfSpeech', params.partOfSpeech);
    if (params.topicId) qs.append('topicId', String(params.topicId));
    if (params.cefrLevel) qs.append('cefrLevel', params.cefrLevel);
    if (params.page) qs.append('page', String(params.page));
    if (params.size) qs.append('size', String(params.size));
    const response = await apiClient.get<any>(`/api/v1/content/words/search?${qs.toString()}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        items: Array.isArray(data.items || data.content) ? (data.items || data.content).map(mapWord) : [],
        page: data.page || 1,
        size: data.size || 10,
        totalItems: data.totalItems || data.totalElements || 0,
        totalPages: data.totalPages || 1
      };
    }
  } catch (err) {
    console.warn('[VocabAPI] searchWordsApi error:', err);
  }
  return { items: [], page: 1, size: 10, totalItems: 0, totalPages: 0 };
};

/**
 * GET /api/v1/content/words/explore
 * Browse vocabulary by topic and CEFR level
 */
export const exploreWordsApi = async (params: {
  topicId?: number;
  cefrLevel?: string;
  page?: number;
  size?: number;
}): Promise<WordSearchPage> => {
  try {
    const qs = new URLSearchParams();
    if (params.topicId) qs.append('topicId', String(params.topicId));
    if (params.cefrLevel) qs.append('cefrLevel', params.cefrLevel);
    if (params.page) qs.append('page', String(params.page));
    if (params.size) qs.append('size', String(params.size));
    const response = await apiClient.get<any>(`/api/v1/content/words/explore?${qs.toString()}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        items: Array.isArray(data.items || data.content) ? (data.items || data.content).map(mapWord) : [],
        page: data.page || 1,
        size: data.size || 10,
        totalItems: data.totalItems || data.totalElements || 0,
        totalPages: data.totalPages || 1
      };
    }
  } catch (err) {
    console.warn('[VocabAPI] exploreWordsApi error:', err);
  }
  return { items: [], page: 1, size: 10, totalItems: 0, totalPages: 0 };
};

/**
 * GET /api/v1/content/topics
 * Get list of all vocabulary topics
 */
export const getTopicsApi = async (): Promise<VocabTopic[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/content/topics');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((t: any) => ({
        id: String(t.id),
        name: t.nameVi || t.nameEn || t.name || 'Chủ đề',
        description: t.description || undefined,
        wordCount: t.wordCount || undefined,
        iconUrl: t.iconUrl || undefined
      }));
    }
  } catch (err) {
    console.warn('[VocabAPI] getTopicsApi error:', err);
  }
  return [];
};
