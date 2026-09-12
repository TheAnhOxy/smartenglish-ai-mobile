import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface CreateDeckPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddCardPayload {
  wordId?: number;
  customFront: string;
  customBack: string;
  userNote?: string;
}

export interface DeckResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  cardCount: number;
  createdAt: string;
}

export interface CardResponse {
  id: string;
  deckId: string;
  wordId?: string;
  customFront: string;
  customBack: string;
  userNote?: string;
  isSuspended: boolean;
  srsStage?: string;
  nextDueDate?: string;
}

const mapDeck = (d: any, userId: string): DeckResponse => ({
  id: String(d.id || ''),
  userId: String(d.userId || userId),
  name: d.name || 'Bộ thẻ',
  description: d.description || undefined,
  isPublic: Boolean(d.isPublic),
  cardCount: Number(d.cardCount || (d.cards ? d.cards.length : 0)),
  createdAt: d.createdAt || new Date().toISOString()
});

/**
 * POST /api/v1/learning/decks
 * Create a new flashcard deck
 */
export const createDeckApi = async (payload: CreateDeckPayload, userId?: string): Promise<DeckResponse> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks?userId=${uid}`, payload);
    const data = response.data?.data || response.data;
    return mapDeck(data, uid);
  } catch (err: any) {
    console.warn('[DeckAPI] createDeckApi error:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * GET /api/v1/learning/decks
 * List all decks for the user
 */
export const listDecksApi = async (userId?: string): Promise<DeckResponse[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((d: any) => mapDeck(d, uid));
    }
  } catch (err) {
    console.warn('[DeckAPI] listDecksApi error:', err);
  }
  return [];
};

/**
 * GET /api/v1/learning/decks/{id}
 * Get a specific deck with its cards
 */
export const getDeckApi = async (deckId: string, userId?: string): Promise<DeckResponse | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/${deckId}?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data) return mapDeck(data, uid);
  } catch (err) {
    console.warn('[DeckAPI] getDeckApi error:', err);
  }
  return null;
};

/**
 * PUT /api/v1/learning/decks/{id}
 * Update deck metadata
 */
export const updateDeckApi = async (deckId: string, payload: CreateDeckPayload, userId?: string): Promise<DeckResponse | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.put<any>(`/api/v1/learning/decks/${deckId}?userId=${uid}`, payload);
    const data = response.data?.data || response.data;
    if (data) return mapDeck(data, uid);
  } catch (err: any) {
    console.warn('[DeckAPI] updateDeckApi error:', err?.response?.data || err.message);
    throw err;
  }
  return null;
};

/**
 * DELETE /api/v1/learning/decks/{id}
 * Delete a deck
 */
export const deleteDeckApi = async (deckId: string, userId?: string): Promise<void> => {
  const uid = userId || getCurrentUserId();
  try {
    await apiClient.delete<any>(`/api/v1/learning/decks/${deckId}?userId=${uid}`);
  } catch (err: any) {
    console.warn('[DeckAPI] deleteDeckApi error:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * POST /api/v1/learning/decks/{deckId}/cards
 * Add a card to a deck
 */
export const addCardToDeckApi = async (deckId: string, payload: AddCardPayload, userId?: string): Promise<CardResponse | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks/${deckId}/cards?userId=${uid}`, payload);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        id: String(data.id || ''),
        deckId: String(data.deckId || deckId),
        wordId: data.wordId ? String(data.wordId) : undefined,
        customFront: data.customFront || payload.customFront,
        customBack: data.customBack || payload.customBack,
        userNote: data.userNote || undefined,
        isSuspended: Boolean(data.isSuspended),
        srsStage: data.srsStage || 'new',
        nextDueDate: data.dueDate || undefined
      };
    }
  } catch (err: any) {
    console.warn('[DeckAPI] addCardToDeckApi error:', err?.response?.data || err.message);
    throw err;
  }
  return null;
};

/**
 * DELETE /api/v1/learning/decks/{deckId}/cards/{cardId}
 * Remove a card from a deck
 */
export const removeCardFromDeckApi = async (deckId: string, cardId: string, userId?: string): Promise<void> => {
  const uid = userId || getCurrentUserId();
  try {
    await apiClient.delete<any>(`/api/v1/learning/decks/${deckId}/cards/${cardId}?userId=${uid}`);
  } catch (err: any) {
    console.warn('[DeckAPI] removeCardFromDeckApi error:', err?.response?.data || err.message);
    throw err;
  }
};
