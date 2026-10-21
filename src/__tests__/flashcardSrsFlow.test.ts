import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import {
  fetchDecksApi,
  fetchDeckDueCardsApi,
  rateCardApi,
} from '@/src/features/flashcard-srs/data/flashcardApi';
import {
  createDeckApi,
  addCardToDeckApi,
  deleteDeckApi,
} from '@/src/features/flashcard-srs/data/deckApi';

describe('Phase 12 Mobile – Flashcard & SRS Flow Hardening', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('1. Fetches flashcard decks from real backend learning-service endpoint', async () => {
    mock.onGet('/api/v1/learning/decks').reply(200, {
      status: 200,
      data: [
        { id: 1, name: 'Oxford 3000 A1', cardCount: 150, isPublic: true },
        { id: 2, name: 'TOEIC Vocabulary 600', cardCount: 600, isPublic: true },
      ],
    });

    const decks = await fetchDecksApi();
    expect(decks.length).toBeGreaterThanOrEqual(1);
    expect(decks[0].name).toBeDefined();
    expect(decks[0].card_count).toBeGreaterThan(0);
  });

  it('2. Loads due review cards for a study session', async () => {
    mock.onGet(/\/api\/v1\/learning\/srs\/due-cards.*/).reply(200, {
      status: 200,
      data: {
        deckId: 10,
        deckName: 'My Custom Deck',
        totalDue: 1,
        cards: [
          {
            cardId: 101,
            deckId: 10,
            frontText: 'Ambiguous',
            backText: 'Mơ hồ, không rõ ràng',
            ipaUs: '/æmˈbɪɡ.ju.əs/',
            srsStage: 'LEARNING',
            repetitions: 2,
            intervalDays: 3,
          },
        ],
      },
    });

    const studyItems = await fetchDeckDueCardsApi('10');
    expect(studyItems).toHaveLength(1);
    expect(studyItems[0].card.custom_front).toBe('Ambiguous');
    expect(studyItems[0].card.custom_back).toBe('Mơ hồ, không rõ ràng');
    expect(studyItems[0].srsState.srs_stage).toBe('learning');
  });

  it('3. Submits SRS review rating with calculated interval and next due date', async () => {
    mock.onPost('/api/v1/learning/srs/review').reply(200, {
      status: 200,
      data: {
        cardId: 101,
        rating: 3,
        intervalDays: 6,
        repetitions: 3,
        easeFactor: 2.6,
        srsStage: 'REVIEW',
        nextDueDate: '2026-10-26',
      },
    });

    const updatedState = await rateCardApi('srs-101', 3, '101');
    expect(updatedState.deck_card_id).toBe('101');
    expect(updatedState.interval_days).toBe(6);
    expect(updatedState.srs_stage).toBe('review');
    expect(updatedState.due_date).toBe('2026-10-26');
  });

  it('4. Creates new custom deck and adds card', async () => {
    mock.onPost('/api/v1/learning/decks').reply(201, {
      status: 201,
      data: { id: 99, name: 'Business English', cardCount: 0 },
    });
    mock.onPost('/api/v1/learning/decks/99/cards').reply(201, {
      status: 201,
      data: { id: 501, deckId: 99, customFront: 'Revenue', customBack: 'Doanh thu' },
    });

    const newDeck = await createDeckApi({ name: 'Business English' });
    expect(newDeck.id).toBe(99);

    const newCard = await addCardToDeckApi(99, {
      customFront: 'Revenue',
      customBack: 'Doanh thu',
    });
    expect(newCard.id).toBe(501);
    expect(newCard.customFront).toBe('Revenue');
  });

  it('5. Backend failure propagates error properly without returning fallback mock data', async () => {
    mock.onGet('/api/v1/learning/decks').reply(500, {
      status: 500,
      message: 'Database connection failed in learning-service',
    });

    await expect(fetchDecksApi()).rejects.toThrow();
  });
});
