import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDecksApi, fetchDeckDueCardsApi, rateCardApi } from '../data/flashcardApi';
import { SrsRating } from '@/src/core/types/schema';

export const useDecksQuery = () => {
  return useQuery({
    queryKey: ['decks'],
    queryFn: () => fetchDecksApi()
  });
};

export const useDeckDueCardsQuery = (deckId: string) => {
  return useQuery({
    queryKey: ['deck-due-cards', deckId],
    queryFn: () => fetchDeckDueCardsApi(deckId),
    enabled: !!deckId
  });
};

export const useRateCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ srsStateId, rating }: { srsStateId: string; rating: SrsRating }) =>
      rateCardApi(srsStateId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck-due-cards'] });
    }
  });
};
