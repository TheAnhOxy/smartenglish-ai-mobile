/**
 * Unified Deck Management API
 * Re-exports consolidated official Deck/Card client from deckApi.ts
 */
export * from './deckApi';

// Aliases for compatibility
export {
  fetchDecksApi as listDecksApi,
  fetchDeckByIdApi as getDeckApi,
} from './deckApi';
