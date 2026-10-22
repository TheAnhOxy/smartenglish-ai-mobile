import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSystemDecksApi,
  fetchMyDecksApi,
  fetchDecksApi,
  fetchDeckByIdApi,
  createDeckApi,
  updateDeckApi,
  deleteDeckApi,
  addCardToDeckApi,
  updateCardInDeckApi,
  removeCardFromDeckApi,
  saveWordToDeckApi,
  fetchDeckDueCardsApi,
  submitSrsReviewApi,
  CreateDeckPayload,
  AddCardPayload,
} from '../data/deckApi';
import { getTopicsApi } from '../data/vocabularyApi';
import { SrsRating } from '@/src/core/types/schema';

/**
 * Stable query keys for all Flashcard / SRS operations
 */
export const decksKeys = {
  all: ['decks'] as const,
  system: () => ['decks', 'system'] as const,
  myDecks: () => ['decks', 'my-decks'] as const,
  list: () => ['decks', 'list'] as const,
  detail: (deckId: number | string) => ['decks', 'detail', String(deckId)] as const,
  dueCards: (deckId?: number | string) => ['decks', 'due-cards', deckId ? String(deckId) : 'all'] as const,
  topics: () => ['vocab', 'topics'] as const,
};

/**
 * Query hook: Lấy danh sách bộ thẻ hệ thống
 */
export const useSystemDecksQuery = () => {
  return useQuery({
    queryKey: decksKeys.system(),
    queryFn: () => fetchSystemDecksApi(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Query hook: Lấy danh sách bộ thẻ cá nhân của người dùng
 */
export const useMyDecksQuery = () => {
  return useQuery({
    queryKey: decksKeys.myDecks(),
    queryFn: () => fetchMyDecksApi(),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Query hook: Lấy tất cả bộ thẻ
 */
export const useDecksQuery = () => {
  return useQuery({
    queryKey: decksKeys.list(),
    queryFn: () => fetchDecksApi(),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Query hook: Lấy chi tiết bộ thẻ và danh sách thẻ
 */
export const useDeckDetailQuery = (deckId: number | string) => {
  return useQuery({
    queryKey: decksKeys.detail(deckId),
    queryFn: () => fetchDeckByIdApi(deckId),
    enabled: Boolean(deckId),
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Query hook: Lấy danh sách thẻ đến hạn ôn tập SM-2
 */
export const useDeckDueCardsQuery = (deckId?: number | string) => {
  return useQuery({
    queryKey: decksKeys.dueCards(deckId),
    queryFn: () => fetchDeckDueCardsApi(deckId),
    staleTime: 30 * 1000,
  });
};

/**
 * Query hook: Lấy danh sách các chủ đề từ vựng hệ thống
 */
export const useTopicsQuery = () => {
  return useQuery({
    queryKey: decksKeys.topics(),
    queryFn: () => getTopicsApi(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Mutation hook: Tạo bộ thẻ mới
 */
export const useCreateDeckMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeckPayload | string) => {
      if (typeof payload === 'string') {
        return createDeckApi(payload);
      }
      return createDeckApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
    },
  });
};

/**
 * Mutation hook: Cập nhật bộ thẻ
 */
export const useUpdateDeckMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, payload }: { deckId: number | string; payload: CreateDeckPayload }) =>
      updateDeckApi(deckId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
      queryClient.invalidateQueries({ queryKey: decksKeys.detail(variables.deckId) });
    },
  });
};

/**
 * Mutation hook: Xóa bộ thẻ
 */
export const useDeleteDeckMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deckId: number | string) => deleteDeckApi(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
    },
  });
};

/**
 * Mutation hook: Thêm thẻ mới vào bộ
 */
export const useAddCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, payload }: { deckId: number | string; payload: AddCardPayload }) =>
      addCardToDeckApi(deckId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
      queryClient.invalidateQueries({ queryKey: decksKeys.detail(variables.deckId) });
      queryClient.invalidateQueries({ queryKey: decksKeys.dueCards(variables.deckId) });
    },
  });
};

/**
 * Mutation hook: Cập nhật thông tin thẻ trong bộ
 */
export const useUpdateCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deckId,
      cardId,
      payload,
    }: {
      deckId: number | string;
      cardId: number | string;
      payload: AddCardPayload;
    }) => updateCardInDeckApi(deckId, cardId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: decksKeys.detail(variables.deckId) });
      queryClient.invalidateQueries({ queryKey: decksKeys.dueCards(variables.deckId) });
    },
  });
};

/**
 * Mutation hook: Xóa thẻ khỏi bộ
 */
export const useRemoveCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, cardId }: { deckId: number | string; cardId: number | string }) =>
      removeCardFromDeckApi(deckId, cardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
      queryClient.invalidateQueries({ queryKey: decksKeys.detail(variables.deckId) });
      queryClient.invalidateQueries({ queryKey: decksKeys.dueCards(variables.deckId) });
    },
  });
};

/**
 * Mutation hook: Lưu nhanh từ vựng vào bộ thẻ
 */
export const useSaveWordMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      word: string;
      meaningVi: string;
      ipa?: string;
      exampleEn?: string;
      userNote?: string;
      targetDeckId?: number;
    }) => saveWordToDeckApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
    },
  });
};

/**
 * Mutation hook: Đánh giá ghi nhớ SRS
 */
export const useSubmitSrsReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, rating }: { cardId: number; rating: number }) =>
      submitSrsReviewApi({ cardId, rating }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: decksKeys.dueCards() });
      queryClient.invalidateQueries({ queryKey: decksKeys.all });
    },
  });
};

/**
 * Compatibility alias
 */
export const useRateCardMutation = () => {
  const submitMutation = useSubmitSrsReviewMutation();
  return {
    ...submitMutation,
    mutate: ({ cardId, rating }: { srsStateId?: string; rating: SrsRating; cardId?: string | number }) => {
      const numId = Number(cardId || 0);
      return submitMutation.mutate({ cardId: numId, rating });
    },
    mutateAsync: ({ cardId, rating }: { srsStateId?: string; rating: SrsRating; cardId?: string | number }) => {
      const numId = Number(cardId || 0);
      return submitMutation.mutateAsync({ cardId: numId, rating });
    },
  };
};
