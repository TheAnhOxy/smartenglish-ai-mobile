import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface DeckItemDTO {
  id: number | string;
  name: string;
  description?: string;
  source?: string;
  cardCount: number;
  studyMode?: string;
  targetExam?: string;
  isPublic?: boolean;
}

export const fetchSystemDecksApi = async (): Promise<DeckItemDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/decks/system');
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchSystemDecksApi] Error:', err);
  }
  // Fallback defaults
  return [
    { id: 1, name: '✈️ Du Lịch & Di Chuyển', description: 'Từ vựng sân bay, khách sạn, chỉ đường và du lịch', cardCount: 15, source: 'SYSTEM_TOPIC' },
    { id: 2, name: '💻 Công Nghệ & AI', description: 'Thuật toán, lập trình, trí tuệ nhân tạo và công nghệ', cardCount: 20, source: 'SYSTEM_TOPIC' },
    { id: 3, name: '💼 Kinh Doanh & Đàm Phán', description: 'Thương mại, hợp đồng, tài chính và giao dịch', cardCount: 18, source: 'SYSTEM_TOPIC' },
    { id: 4, name: '☕ Đời Sống & Giao Tiếp', description: 'Gia đình, bạn bè, ẩm thực và mua sắm', cardCount: 25, source: 'SYSTEM_TOPIC' },
  ];
};

export const fetchMyDecksApi = async (userId?: string): Promise<DeckItemDTO[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/decks/my-decks?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchMyDecksApi] Error:', err);
  }
  // Fallback default user notebook
  return [
    { id: 'my-1', name: '📖 Sổ Từ Vựng Đã Lưu Của Tôi', description: 'Các từ đã tra cứu, lưu từ bài học và chatbot AI', cardCount: 8, source: 'MANUAL' }
  ];
};

export const createDeckApi = async (name: string, description?: string, userId?: string): Promise<DeckItemDTO | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks?userId=${uid}`, {
      name,
      description: description || 'Bộ thẻ tự tạo',
      isPublic: false,
      studyMode: 'srs',
    });
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[createDeckApi] Error:', err);
    return null;
  }
};

export const saveWordToDeckApi = async (params: {
  word: string;
  meaningVi: string;
  ipa?: string;
  exampleEn?: string;
  userNote?: string;
  targetDeckId?: number;
  userId?: string;
}) => {
  const uid = params.userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/decks/save-word?userId=${uid}`, {
      word: params.word,
      meaningVi: params.meaningVi,
      ipa: params.ipa,
      exampleEn: params.exampleEn,
      userNote: params.userNote,
      targetDeckId: params.targetDeckId,
    });
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[saveWordToDeckApi] Error:', err);
    return null;
  }
};
