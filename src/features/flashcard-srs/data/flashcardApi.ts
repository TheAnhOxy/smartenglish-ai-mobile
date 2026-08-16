import { apiClient } from '@/src/core/api/client';
import { Deck, DeckCard, SrsState, Word, SrsRating } from '@/src/core/types/schema';
import { MOCK_DECKS, MOCK_DECK_CARDS, MOCK_SRS_STATES, MOCK_WORDS } from '@/src/core/data/mockData';
import { calculateSm2 } from '@/src/core/db/srsEngine';

export const fetchDecksApi = async (): Promise<Deck[]> => {
  const response = await apiClient.get<{ decks: Deck[] }>('/learning/decks');
  return response.data.decks;
};

export interface CardStudyItem {
  card: DeckCard;
  word?: Word;
  srsState: SrsState;
}

export const fetchDeckDueCardsApi = async (deckId: string): Promise<CardStudyItem[]> => {
  const cards = MOCK_DECK_CARDS.filter((c) => c.deck_id === deckId);
  const items: CardStudyItem[] = cards.map((card) => {
    const word = MOCK_WORDS.find((w) => w.id === card.word_id);
    const srsState = MOCK_SRS_STATES.find((s) => s.deck_card_id === card.id) || {
      id: `srs-temp-${card.id}`,
      user_id: '11111111-1111-1111-1111-111111111111',
      deck_card_id: card.id,
      interval_days: 1,
      repetitions: 0,
      ease_factor: 2.5,
      due_date: new Date().toISOString().split('T')[0],
      srs_stage: 'new',
      correct_count: 0,
      incorrect_count: 0,
      lapses: 0
    };
    return { card, word, srsState };
  });
  return items;
};

export const rateCardApi = async (srsStateId: string, rating: SrsRating): Promise<SrsState> => {
  const existing = MOCK_SRS_STATES.find((s) => s.id === srsStateId) || MOCK_SRS_STATES[0];
  const sm2Result = calculateSm2(existing, rating);

  const updated: SrsState = {
    ...existing,
    ...sm2Result,
    correct_count: rating > 0 ? existing.correct_count + 1 : existing.correct_count,
    incorrect_count: rating === 0 ? existing.incorrect_count + 1 : existing.incorrect_count
  };

  return updated;
};
