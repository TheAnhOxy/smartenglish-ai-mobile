import { apiClient } from '@/src/core/api/client';

export interface DeckDTO {
  id: number | string;
  userId?: number | string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  source?: string;
  studyMode?: string;
  targetExam?: string;
  isPublic?: boolean;
  isPremium?: boolean;
  cardCount: number;
  cards?: DeckCardDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export type DeckItemDTO = DeckDTO;
export type DeckDetailDTO = DeckDTO;
export type DeckResponse = DeckDTO;

export interface CreateDeckPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
  studyMode?: string;
  targetExam?: string;
}

export interface DeckCardDTO {
  id: number | string;
  deckId: number | string;
  wordId?: number | string;
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

export type CardResponse = DeckCardDTO;

export interface AddCardPayload {
  wordId?: number;
  customFront: string;
  customBack: string;
  userNote?: string;
  position?: number;
  imageOverrideUrl?: string;
}

export interface DueCardItemDTO {
  cardId: number;
  deckId: number;
  wordId?: number;
  frontText: string;
  backText: string;
  ipaUs?: string;
  meaningVi?: string;
  exampleSentence?: string;
  audioUrl?: string;
  imageUrl?: string;
  srsStage?: string;
  repetitions?: number;
  intervalDays?: number;
  dueDate?: string;
}

export interface FlashcardStudySessionDTO {
  deckId?: number;
  deckName?: string;
  totalDue: number;
  cards: DueCardItemDTO[];
}

export interface SrsReviewRequestDTO {
  cardId: number;
  rating: number; // 0=Again, 1=Hard, 2=Good, 3=Easy
}

export interface SrsReviewResponseDTO {
  cardId: number;
  deckId: number;
  srsStage: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextDueDate: string;
  xpEarned?: number;
  leveledUp?: boolean;
  currentStreak?: number;
}

/**
 * Standardizes API error messages from Axios / Backend
 */
const formatError = (prefix: string, err: any): Error => {
  const backendMsg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Lỗi kết nối máy chủ';
  const customError = new Error(`[${prefix}] ${backendMsg}`);
  (customError as any).response = err?.response;
  (customError as any).status = err?.response?.status;
  return customError;
};

/**
 * GET /api/v1/learning/decks/system
 * Lấy danh sách bộ thẻ hệ thống theo chủ đề
 */
export const fetchSystemDecksApi = async (): Promise<DeckDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/decks/system');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('[deckApi] fetchSystemDecksApi error:', err);
    throw formatError('fetchSystemDecksApi', err);
  }
};

/**
 * GET /api/v1/learning/decks/my-decks
 * Lấy danh sách bộ thẻ cá nhân của người dùng hiện tại (xác thực qua JWT)
 */
export const fetchMyDecksApi = async (_unusedUserId?: string, _unusedForceRefresh?: boolean): Promise<DeckDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/decks/my-decks');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('[deckApi] fetchMyDecksApi error:', err);
    throw formatError('fetchMyDecksApi', err);
  }
};

/**
 * GET /api/v1/learning/decks
 * Lấy tất cả bộ thẻ của người dùng
 */
export const fetchDecksApi = async (_unusedUserId?: string): Promise<DeckDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/decks');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('[deckApi] fetchDecksApi error:', err);
    throw formatError('fetchDecksApi', err);
  }
};

/**
 * GET /api/v1/learning/decks/{id}
 * Xem chi tiết bộ thẻ kèm danh sách thẻ
 */
export const fetchDeckByIdApi = async (deckId: number | string, _unusedUserId?: string): Promise<DeckDTO> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/${deckId}`);
    const data = response.data?.data ?? response.data;
    if (data && (data.id !== undefined || data.name)) {
      return data;
    }
    throw new Error(`Không tìm thấy bộ thẻ #${deckId}`);
  } catch (err) {
    console.warn('[deckApi] fetchDeckByIdApi error:', err);
    throw formatError('fetchDeckByIdApi', err);
  }
};

/**
 * POST /api/v1/learning/decks
 * Tạo bộ thẻ từ vựng mới
 */
export const createDeckApi = async (
  nameOrPayload: string | CreateDeckPayload,
  description?: string,
  _unusedUserId?: string
): Promise<DeckDTO> => {
  try {
    const payload: CreateDeckPayload =
      typeof nameOrPayload === 'string'
        ? {
            name: nameOrPayload,
            description: description || 'Bộ thẻ tự tạo',
            isPublic: false,
            studyMode: 'srs',
          }
        : nameOrPayload;

    const response = await apiClient.post<any>('/api/v1/learning/decks', payload);
    const data = response.data?.data ?? response.data;
    if (data && (data.id !== undefined || data.name)) {
      return data;
    }
    throw new Error('Dữ liệu bộ thẻ tạo mới không hợp lệ');
  } catch (err) {
    console.warn('[deckApi] createDeckApi error:', err);
    throw formatError('createDeckApi', err);
  }
};

/**
 * PUT /api/v1/learning/decks/{id}
 * Cập nhật tên, mô tả hoặc cài đặt bộ thẻ
 */
export const updateDeckApi = async (
  deckId: number | string,
  payload: CreateDeckPayload,
  _unusedUserId?: string
): Promise<DeckDTO> => {
  try {
    const response = await apiClient.put<any>(`/api/v1/learning/decks/${deckId}`, payload);
    const data = response.data?.data ?? response.data;
    if (data && (data.id !== undefined || data.name)) {
      return data;
    }
    throw new Error('Không thể cập nhật bộ thẻ');
  } catch (err) {
    console.warn('[deckApi] updateDeckApi error:', err);
    throw formatError('updateDeckApi', err);
  }
};

/**
 * DELETE /api/v1/learning/decks/{id}
 * Xóa bộ thẻ
 */
export const deleteDeckApi = async (deckId: number | string, _unusedUserId?: string): Promise<void> => {
  try {
    await apiClient.delete<any>(`/api/v1/learning/decks/${deckId}`);
  } catch (err) {
    console.warn('[deckApi] deleteDeckApi error:', err);
    throw formatError('deleteDeckApi', err);
  }
};

/**
 * POST /api/v1/learning/decks/{deckId}/cards
 * Thêm thẻ mới vào bộ thẻ
 */
export const addCardToDeckApi = async (
  deckId: number | string,
  payload: AddCardPayload,
  _unusedUserId?: string
): Promise<DeckCardDTO> => {
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks/${deckId}/cards`, payload);
    const data = response.data?.data ?? response.data;
    if (data && data.id !== undefined) {
      return data;
    }
    throw new Error('Không nhận được dữ liệu thẻ mới tạo');
  } catch (err) {
    console.warn('[deckApi] addCardToDeckApi error:', err);
    throw formatError('addCardToDeckApi', err);
  }
};

/**
 * PUT /api/v1/learning/decks/{deckId}/cards/{cardId}
 * Cập nhật thông tin thẻ trong bộ thẻ
 */
export const updateCardInDeckApi = async (
  deckId: number | string,
  cardId: number | string,
  payload: AddCardPayload,
  _unusedUserId?: string
): Promise<DeckCardDTO> => {
  try {
    const response = await apiClient.put<any>(`/api/v1/learning/decks/${deckId}/cards/${cardId}`, payload);
    const data = response.data?.data ?? response.data;
    if (data && data.id !== undefined) {
      return data;
    }
    throw new Error('Không nhận được dữ liệu thẻ sau khi cập nhật');
  } catch (err) {
    console.warn('[deckApi] updateCardInDeckApi error:', err);
    throw formatError('updateCardInDeckApi', err);
  }
};

/**
 * DELETE /api/v1/learning/decks/{deckId}/cards/{cardId}
 * Xóa thẻ khỏi bộ thẻ
 */
export const removeCardFromDeckApi = async (
  deckId: number | string,
  cardId: number | string,
  _unusedUserId?: string
): Promise<void> => {
  try {
    await apiClient.delete<any>(`/api/v1/learning/decks/${deckId}/cards/${cardId}`);
  } catch (err) {
    console.warn('[deckApi] removeCardFromDeckApi error:', err);
    throw formatError('removeCardFromDeckApi', err);
  }
};

/**
 * POST /api/v1/learning/decks/save-word
 * Lưu nhanh từ vựng vào bộ thẻ cá nhân
 */
export const saveWordToDeckApi = async (params: {
  word: string;
  meaningVi: string;
  ipa?: string;
  exampleEn?: string;
  userNote?: string;
  targetDeckId?: number;
  _unusedUserId?: string;
}): Promise<DeckCardDTO> => {
  try {
    const response = await apiClient.post<any>('/api/v1/learning/decks/save-word', {
      word: params.word,
      meaningVi: params.meaningVi,
      ipa: params.ipa,
      exampleEn: params.exampleEn,
      userNote: params.userNote,
      targetDeckId: params.targetDeckId,
    });
    const data = response.data?.data ?? response.data;
    if (data && data.id !== undefined) {
      return data;
    }
    throw new Error('Không thể lưu từ vào bộ thẻ');
  } catch (err) {
    console.warn('[deckApi] saveWordToDeckApi error:', err);
    throw formatError('saveWordToDeckApi', err);
  }
};

/**
 * GET /api/v1/learning/srs/due-cards?deckId={id}
 * Lấy danh sách thẻ đến hạn ôn tập SM-2
 */
export const fetchDeckDueCardsApi = async (deckId?: number | string): Promise<FlashcardStudySessionDTO> => {
  try {
    const query = deckId ? `?deckId=${encodeURIComponent(deckId)}` : '';
    const response = await apiClient.get<any>(`/api/v1/learning/srs/due-cards${query}`);
    const data = response.data?.data ?? response.data;
    if (data && Array.isArray(data.cards)) {
      return {
        deckId: data.deckId,
        deckName: data.deckName,
        totalDue: data.totalDue ?? data.cards.length,
        cards: data.cards,
      };
    }
    return {
      deckId: typeof deckId === 'number' ? deckId : undefined,
      totalDue: 0,
      cards: [],
    };
  } catch (err) {
    console.warn('[deckApi] fetchDeckDueCardsApi error:', err);
    throw formatError('fetchDeckDueCardsApi', err);
  }
};

/**
 * POST /api/v1/learning/srs/review
 * Đánh giá mức độ ghi nhớ sau mỗi lượt ôn thẻ (0=Again, 1=Hard, 2=Good, 3=Easy)
 */
export const submitSrsReviewApi = async (params: {
  cardId: number;
  rating: number;
  _unusedUserId?: string;
}): Promise<SrsReviewResponseDTO> => {
  try {
    const response = await apiClient.post<any>('/api/v1/learning/srs/review', {
      cardId: params.cardId,
      rating: params.rating,
    });
    const data = response.data?.data ?? response.data;
    if (data && data.cardId !== undefined) {
      return data;
    }
    throw new Error('Dữ liệu kết quả ôn tập SRS không hợp lệ');
  } catch (err) {
    console.warn('[deckApi] submitSrsReviewApi error:', err);
    throw formatError('submitSrsReviewApi', err);
  }
};
