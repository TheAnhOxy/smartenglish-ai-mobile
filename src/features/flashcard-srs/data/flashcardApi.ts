import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { Deck, DeckCard, SrsState, Word, SrsRating } from '@/src/core/types/schema';
import { MOCK_DECKS, MOCK_DECK_CARDS, MOCK_SRS_STATES, MOCK_WORDS } from '@/src/core/data/mockData';
import { calculateSm2 } from '@/src/core/db/srsEngine';

export const fetchDecksApi = async (userId?: string): Promise<Deck[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: String(d.id),
        user_id: String(uid),
        name: String(d.name || 'Bộ Thẻ Từ Vựng'),
        description: d.description || undefined,
        source: 'manual' as const,
        is_public: Boolean(d.isPublic),
        card_count: Number(d.cardCount || (d.cards ? d.cards.length : 0)),
        created_at: d.createdAt || new Date().toISOString()
      }));
    }
  } catch (err) {
    console.warn('Real Decks API error, returning fallback decks:', err);
  }
  return MOCK_DECKS;
};

export interface CardStudyItem {
  card: DeckCard;
  word?: Word;
  srsState: SrsState;
}

export const fetchDeckDueCardsApi = async (deckId: string, userId?: string): Promise<CardStudyItem[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/${deckId}?userId=${uid}`);
    const deckData = response.data?.data || response.data;
    if (deckData && deckData.cards && Array.isArray(deckData.cards)) {
      return deckData.cards.map((c: any, idx: number) => {
        const cardObj: DeckCard = {
          id: String(c.id || idx + 1),
          deck_id: String(deckId),
          word_id: String(c.wordId || idx + 100),
          custom_front: String(c.customFront || c.wordEn || 'Vocabulary Word'),
          custom_back: String(c.customBack || c.wordVi || 'Từ vựng tiếng Anh'),
          user_note: c.userNote || '',
          is_suspended: Boolean(c.isSuspended)
        };
        const wordObj: Word = {
          id: cardObj.word_id || `word-${idx}`,
          word: String(c.customFront || 'Word'),
          ipa_us: c.ipaUs || '/wɝːd/',
          part_of_speech: 'noun',
          cefr_level: 'B1',
          is_system: true,
          is_approved: true
        };
        const srsStateObj: SrsState = {
          id: `srs-${c.id || idx}`,
          user_id: String(uid),
          deck_card_id: cardObj.id,
          interval_days: c.intervalDays || 1,
          repetitions: c.repetitions || 0,
          ease_factor: 2.5,
          due_date: c.dueDate || new Date().toISOString().split('T')[0],
          srs_stage: (c.srsStage || 'new').toLowerCase() as any,
          correct_count: 0,
          incorrect_count: 0,
          lapses: 0
        };
        return { card: cardObj, word: wordObj, srsState: srsStateObj };
      });
    }
  } catch (err) {
    console.warn('Real Deck Due Cards API error, returning fallback cards:', err);
  }

  const cards = MOCK_DECK_CARDS.filter((c) => c.deck_id === deckId);
  return cards.map((card) => {
    const word = MOCK_WORDS.find((w) => w.id === card.word_id);
    const srsState = MOCK_SRS_STATES.find((s) => s.deck_card_id === card.id) || {
      id: `srs-temp-${card.id}`,
      user_id: String(userId),
      deck_card_id: card.id,
      interval_days: 1,
      repetitions: 0,
      ease_factor: 2.5,
      due_date: new Date().toISOString().split('T')[0],
      srs_stage: 'new' as const,
      correct_count: 0,
      incorrect_count: 0,
      lapses: 0
    };
    return { card, word, srsState };
  });
};

export const rateCardApi = async (
  srsStateId: string,
  rating: SrsRating,
  cardId?: string,
  userId?: string
): Promise<SrsState> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/srs/review?userId=${uid}`, {
      cardId: cardId ? Number(cardId) : 1,
      rating: rating
    });
    const data = response.data?.data || response.data;
    if (data) {
      return {
        id: srsStateId,
        user_id: String(userId),
        deck_card_id: String(cardId || '1'),
        interval_days: data.nextIntervalDays || 1,
        repetitions: data.repetitions || 1,
        ease_factor: data.easeFactor || 2.5,
        due_date: data.nextDueDate || new Date().toISOString().split('T')[0],
        srs_stage: (data.srsStage || 'review').toLowerCase() as any,
        correct_count: rating > 0 ? 1 : 0,
        incorrect_count: rating === 0 ? 1 : 0,
        lapses: 0
      };
    }
  } catch (err) {
    console.warn('Real SRS Review API error, updating locally via SM-2 engine:', err);
  }

  const existing = MOCK_SRS_STATES.find((s) => s.id === srsStateId) || MOCK_SRS_STATES[0];
  const sm2Result = calculateSm2(existing, rating);
  return {
    ...existing,
    ...sm2Result,
    correct_count: rating > 0 ? existing.correct_count + 1 : existing.correct_count,
    incorrect_count: rating === 0 ? existing.incorrect_count + 1 : existing.incorrect_count
  };
};
