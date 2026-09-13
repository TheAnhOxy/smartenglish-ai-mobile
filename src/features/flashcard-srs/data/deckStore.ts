import { create } from 'zustand';

export interface UserDeck {
  id: string;
  name: string;
  count: number;
  iconName: 'coffee' | 'briefcase' | 'plane' | 'graduation' | 'sparkles' | 'folder';
  color: string;
  ringColor: string;
  progressPct: number;
}

export interface SavedWord {
  id: string;
  deck_id: string;
  word_id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning_vi: string;
  examples?: any;
  saved_at: string;
}

interface DeckState {
  decks: UserDeck[];
  savedWords: SavedWord[];
  addDeck: (name: string) => UserDeck;
  saveWordsToDeck: (deckId: string, items: Array<{
    word_id: string;
    word: string;
    phonetic: string;
    pos: string;
    meaning_vi: string;
    examples?: any;
  }>) => void;
  isWordSavedInDeck: (deckId: string, wordId: string) => boolean;
}

const INITIAL_DECKS: UserDeck[] = [
  {
    id: 'deck-my-words',
    name: 'Bộ thẻ của tôi',
    count: 0,
    iconName: 'folder',
    color: 'bg-orange-100 text-orange-600',
    ringColor: '#FF6B35',
    progressPct: 0,
  },
  {
    id: 'deck-favorites',
    name: 'Từ vựng yêu thích',
    count: 0,
    iconName: 'sparkles',
    color: 'bg-purple-100 text-purple-600',
    ringColor: '#A855F7',
    progressPct: 0,
  },
];

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: INITIAL_DECKS,
  savedWords: [],

  addDeck: (name: string) => {
    const trimmed = name.trim();
    const newDeck: UserDeck = {
      id: `deck-${Date.now()}`,
      name: trimmed,
      count: 0,
      iconName: 'folder',
      color: 'bg-emerald-100 text-emerald-600',
      ringColor: '#10B981',
      progressPct: 0,
    };

    set((state) => ({
      decks: [...state.decks, newDeck],
    }));

    return newDeck;
  },

  saveWordsToDeck: (deckId: string, items) => {
    const state = get();
    const existingWordIds = new Set(state.savedWords.filter(w => w.deck_id === deckId).map(w => w.word_id));
    
    const newSavedItems: SavedWord[] = [];
    items.forEach((item) => {
      if (!existingWordIds.has(item.word_id)) {
        newSavedItems.push({
          id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          deck_id: deckId,
          word_id: item.word_id,
          word: item.word,
          phonetic: item.phonetic,
          pos: item.pos,
          meaning_vi: item.meaning_vi,
          examples: item.examples,
          saved_at: new Date().toISOString(),
        });
      }
    });

    if (newSavedItems.length === 0) return;

    set((state) => ({
      savedWords: [...state.savedWords, ...newSavedItems],
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, count: deck.count + newSavedItems.length }
          : deck
      ),
    }));
  },

  isWordSavedInDeck: (deckId: string, wordId: string) => {
    const { savedWords } = get();
    return savedWords.some((w) => w.deck_id === deckId && w.word_id === wordId);
  },
}));
