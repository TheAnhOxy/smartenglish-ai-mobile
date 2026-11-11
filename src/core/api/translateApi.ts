import { apiClient } from '@/src/core/api/client';

export interface TranslationResult {
  text: string;
  translation: string;
  ipa?: string | null;
  partOfSpeech?: string | null;
  note?: string | null;
  source: 'dictionary' | 'ai';
}

export const MAX_TRANSLATE_LENGTH = 300;

/** POST /content/translate — dịch từ/cụm từ được chọn sang tiếng Việt (cần đăng nhập). */
export const translateTextApi = async (text: string): Promise<TranslationResult> => {
  const response = await apiClient.post<any>('/api/v1/content/translate', { text }, { timeout: 20000 });
  const data = response.data?.data ?? response.data;
  if (!data?.translation) {
    throw new Error('Chưa dịch được lúc này, vui lòng thử lại');
  }
  return data as TranslationResult;
};
