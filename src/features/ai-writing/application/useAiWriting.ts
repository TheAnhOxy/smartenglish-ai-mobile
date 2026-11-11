import { useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import type { WritingError } from '@/src/core/types/schema';
import { analyzeWritingApi, WritingResult, WritingType } from '../data/writingApi';

export const WRITING_TYPE_LABEL: Record<WritingType, string> = {
  essay: 'Bài luận ngắn',
  email: 'Email công việc',
  ielts_task1: 'IELTS Writing Task 1',
  ielts_task2: 'IELTS Writing Task 2',
};

/** Phiên viết hiện tại: giữ bài viết và kết quả giữa các màn (soạn → phân tích → so sánh), không đẩy qua URL. */
interface WritingSessionState {
  type: WritingType;
  text: string;
  result: WritingResult | null;
  setType: (type: WritingType) => void;
  setText: (text: string) => void;
  setResult: (result: WritingResult | null) => void;
}

export const useWritingSession = create<WritingSessionState>((set) => ({
  type: 'essay',
  text: '',
  result: null,
  setType: (type) => set({ type }),
  setText: (text) => set({ text }),
  setResult: (result) => set({ result }),
}));

export const useWritingAnalysisMutation = () =>
  useMutation({
    mutationFn: ({ text, type }: { text: string; type: WritingType }) => analyzeWritingApi(text, type),
  });

/**
 * Áp dụng các lỗi đã chấp nhận vào bài gốc theo vị trí ký tự (UC-09).
 * Thay từ cuối bài lên đầu để vị trí của các lỗi phía trước không bị lệch.
 */
export const applyCorrections = (text: string, errors: WritingError[], acceptedIds: string[]): string => {
  const accepted = errors
    .filter((e) => acceptedIds.includes(e.error_id))
    .filter((e) => text.slice(e.position_start, e.position_end) === e.original)
    .sort((a, b) => b.position_start - a.position_start);
  let out = text;
  let lastStart = Number.POSITIVE_INFINITY;
  for (const e of accepted) {
    if (e.position_end > lastStart) continue; // bỏ lỗi chồng lấn
    out = out.slice(0, e.position_start) + e.suggestion + out.slice(e.position_end);
    lastStart = e.position_start;
  }
  return out;
};
