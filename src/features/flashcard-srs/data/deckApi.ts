import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface DeckItemDTO {
  id: number | string;
  name: string;
  description?: string;
  source?: string;
  cardCount: number;
  studyMode?: string;
  targetExam?: string;
  isPublic?: boolean;
  isPremium?: boolean;
}

export const fetchSystemDecksApi = async (): Promise<DeckItemDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/decks/system');
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchSystemDecksApi] Error:', err);
  }
  return [];
};

export const fetchMyDecksApi = async (userId?: string): Promise<DeckItemDTO[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/my-decks?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchMyDecksApi] Error:', err);
  }
  return [];
};

export const createDeckApi = async (name: string, description?: string, userId?: string): Promise<DeckItemDTO | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks?userId=${uid}`, {
      name,
      description: description || 'Bộ thẻ tự tạo',
      isPublic: false,
      studyMode: 'srs',
    });
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[createDeckApi] Error:', err);
    return null;
  }
};

export const saveWordToDeckApi = async (params: {
  word: string;
  meaningVi: string;
  ipa?: string;
  exampleEn?: string;
  userNote?: string;
  targetDeckId?: number;
  userId?: string;
}) => {
  const uid = params.userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks/save-word?userId=${uid}`, {
      word: params.word,
      meaningVi: params.meaningVi,
      ipa: params.ipa,
      exampleEn: params.exampleEn,
      userNote: params.userNote,
      targetDeckId: params.targetDeckId,
    });
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[saveWordToDeckApi] Error:', err);
    return null;
  }
};

export interface DeckCardDTO {
  id: number;
  deckId: number;
  wordId?: number;
  customFront: string;
  customBack: string;
  userNote?: string;
  position?: number;
  isSuspended?: boolean;
  imageOverrideUrl?: string;
  intervalDays?: number;
  repetitions?: number;
  dueDate?: string;
  srsStage?: string;
}

export interface DeckDetailDTO extends DeckItemDTO {
  cards: DeckCardDTO[];
}

export const fetchDeckByIdApi = async (deckId: number | string, userId?: string): Promise<DeckDetailDTO | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/${deckId}?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data && data.id) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchDeckByIdApi] Error:', err);
  }
  return null;
};

export const submitSrsReviewApi = async (params: {
  cardId: number;
  rating: number;
  userId?: string;
}) => {
  const uid = params.userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/srs/review?userId=${uid}`, {
      cardId: params.cardId,
      rating: params.rating,
    });
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[submitSrsReviewApi] Error:', err);
    return null;
  }
};
