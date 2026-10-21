/**
 * Unified Flashcard SRS API
 * Re-exports consolidated official Deck/SRS client from deckApi.ts
 */
import {
  fetchDecksApi as baseFetchDecksApi,
  fetchDeckDueCardsApi as baseFetchDeckDueCardsApi,
  submitSrsReviewApi,
  DeckDTO,
  DueCardItemDTO,
} from './deckApi';
import { Deck, DeckCard, SrsState, Word, SrsRating } from '@/src/core/types/schema';

export * from './deckApi';

export interface CardStudyItem {
  card: DeckCard;
  word?: Word;
  srsState: SrsState;
}

/**
 * Compatibility wrapper returning schema-typed Deck[]
 */
export const fetchDecksApi = async (_unusedUserId?: string): Promise<Deck[]> => {
  const dtos: DeckDTO[] = await baseFetchDecksApi();
  return dtos.map((d) => ({
    id: String(d.id),
    user_id: String(d.userId || ''),
    name: d.name || 'Bộ Thẻ Từ Vựng',
    description: d.description,
    source: 'manual' as const,
    is_public: Boolean(d.isPublic),
    card_count: d.cardCount || 0,
    created_at: d.createdAt || new Date().toISOString(),
  }));
};

/**
 * Compatibility wrapper returning schema-typed CardStudyItem[]
 */
export const fetchDeckDueCardsApi = async (deckId: string, _unusedUserId?: string): Promise<CardStudyItem[]> => {
  const session = await baseFetchDeckDueCardsApi(deckId);
  return session.cards.map((c: DueCardItemDTO, idx: number) => {
    const cardObj: DeckCard = {
      id: String(c.cardId || idx + 1),
      deck_id: String(c.deckId || deckId),
      word_id: c.wordId ? String(c.wordId) : undefined,
      custom_front: c.frontText || 'Vocabulary Word',
      custom_back: c.backText || 'Từ vựng tiếng Anh',
      user_note: '',
      is_suspended: false,
    };
    const wordObj: Word = {
      id: cardObj.word_id || `word-${idx}`,
      word: c.frontText || 'Word',
      ipa_us: c.ipaUs || '',
      part_of_speech: 'noun',
      cefr_level: 'B1',
      is_system: true,
      is_approved: true,
    };
    const srsStateObj: SrsState = {
      id: `srs-${c.cardId || idx}`,
      user_id: '',
      deck_card_id: cardObj.id,
      interval_days: c.intervalDays || 1,
      repetitions: c.repetitions || 0,
      ease_factor: 2.5,
      due_date: c.dueDate || new Date().toISOString().split('T')[0],
      srs_stage: ((c.srsStage || 'new').toLowerCase() as any),
      correct_count: 0,
      incorrect_count: 0,
      lapses: 0,
    };
    return { card: cardObj, word: wordObj, srsState: srsStateObj };
  });
};

/**
 * Compatibility wrapper for rating a card via SRS review API
 */
export const rateCardApi = async (
  srsStateId: string,
  rating: SrsRating,
  cardId?: string,
  _unusedUserId?: string
): Promise<SrsState> => {
  if (!cardId) {
    throw new Error('Mã thẻ (cardId) là bắt buộc để đánh giá SRS');
  }

  const result = await submitSrsReviewApi({
    cardId: Number(cardId),
    rating: Number(rating),
  });

  return {
    id: srsStateId,
    user_id: '',
    deck_card_id: String(result.cardId),
    interval_days: result.intervalDays || 1,
    repetitions: result.repetitions || 1,
    ease_factor: result.easeFactor || 2.5,
    due_date: result.nextDueDate || new Date().toISOString().split('T')[0],
    srs_stage: ((result.srsStage || 'review').toLowerCase() as any),
    correct_count: rating > 0 ? 1 : 0,
    incorrect_count: rating === 0 ? 1 : 0,
    lapses: 0,
  };
};
