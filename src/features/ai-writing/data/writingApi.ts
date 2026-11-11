import { apiClient } from '@/src/core/api/client';
import type { WritingError } from '@/src/core/types/schema';

export type WritingType = 'essay' | 'email' | 'ielts_task1' | 'ielts_task2';

export interface WritingResult {
  errors: WritingError[];
  scoring_detail: {
    task_achievement: number;
    coherence_cohesion: number;
    lexical_resource: number;
    grammatical_range: number;
  };
  overall_band: number;
  rewritten_text: string;
  summary_vi: string;
  quota_used: number | null;
  quota_limit: number | null;
}

/** POST /api/v1/ai-practice/writing/analyze — Gemini chấm bài, trả lỗi kèm vị trí ký tự trong bài gốc. */
export const analyzeWritingApi = async (text: string, writingType: WritingType): Promise<WritingResult> => {
  const response = await apiClient.post<any>('/api/v1/ai-practice/writing/analyze', { text, writingType }, { timeout: 90000 });
  const data = response.data?.data ?? response.data;
  if (!data || !Array.isArray(data.errors) || typeof data.rewritten_text !== 'string') {
    throw new Error('Kết quả chấm bài không hợp lệ');
  }
  return data as WritingResult;
};
