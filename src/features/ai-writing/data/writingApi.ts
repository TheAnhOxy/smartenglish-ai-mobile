import { WritingAnalysis } from '@/src/core/types/schema';

export const submitWritingAnalysisApi = async (text: string, type: string): Promise<WritingAnalysis> => {
  return {
    id: 'ana-101',
    submission_id: 'sub-101',
    user_id: '11111111-1111-1111-1111-111111111111',
    analyzed_at: new Date().toISOString(),
    ai_model: 'gemini-1.5-pro',
    errors: [
      {
        error_id: 'err-1',
        type: 'spelling',
        position_start: 12,
        position_end: 22,
        original: 'acompilsh',
        suggestion: 'accomplish',
        explanation_vi: 'Lỗi chính tả: từ "accomplish" viết thiếu chữ c.',
        severity: 'major',
        is_accepted: false
      },
      {
        error_id: 'err-2',
        type: 'grammar',
        position_start: 35,
        position_end: 45,
        original: 'has finished',
        suggestion: 'had finished',
        explanation_vi: 'Thì quá khứ hoàn thành phù hợp hơn khi nói về hành động kết thúc trước 1 thời điểm quá khứ.',
        severity: 'minor',
        is_accepted: false
      }
    ],
    scoring_detail: {
      task_achievement: 7.0,
      coherence_cohesion: 6.5,
      lexical_resource: 7.0,
      grammatical_range: 6.0
    },
    rewritten_text: 'By the time the project manager arrived, the engineering team had accomplished all critical milestones.'
  };
};
