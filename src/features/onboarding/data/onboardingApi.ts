import { apiClient } from '@/src/core/api/client';

export interface PlacementOption {
  id: string;
  text: string;
}

export interface PlacementQuestion {
  id: string;
  question: string;
  options: PlacementOption[];
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  skill?: string;
  mediaUrl?: string;
  points?: number;
}

export interface PlacementSession {
  attemptId: number;
  examId: number;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: PlacementQuestion[];
  savedAnswers?: Record<string, string>;
}

export interface PlacementResult {
  attemptId?: number;
  examId?: number;
  cefr_level: string;
  score_pct: number;
  recommendedGoal?: string;
  feedbackVi?: string;
  skills: {
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
  };
}

export interface PlacementSubmitParams {
  attemptId?: number;
  examId?: number;
  answers: Record<string, string>;
  timeSpentSeconds?: number;
}

/**
 * Lấy phiên làm bài hoặc khởi tạo phiên thi Placement Test từ learning-service / content-service
 * Tuyệt đối không chứa đáp án đúng (correctAnswer) hay giải thích (explanation) trước khi nộp
 */
export const fetchPlacementTestApi = async (): Promise<PlacementSession> => {
  let data: any = null;
  try {
    const res = await apiClient.post('/api/v1/learning/placement/start');
    data = res.data?.data || res.data;
  } catch (err) {
    try {
      const res = await apiClient.get('/api/v1/learning/placement/session');
      data = res.data?.data || res.data;
    } catch (sessionErr) {
      // Fallback: Lấy đề placement công khai từ content-service nếu learning-service gặp lỗi kết nối
      const publicRes = await apiClient.get('/api/v1/content/exams/placement');
      const examData = publicRes.data?.data || publicRes.data;
      data = {
        attemptId: 0,
        examId: examData?.id || 1,
        title: examData?.title || 'Placement Test',
        durationMinutes: examData?.durationMinutes || 20,
        totalQuestions: examData?.questions?.length || 0,
        questions: examData?.questions || []
      };
    }
  }

  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Không thể tải bộ câu hỏi kiểm tra đầu vào từ hệ thống');
  }

  const normalizedQuestions: PlacementQuestion[] = data.questions.map((q: any, idx: number) => {
    const rawOpts = q.options || [];
    const options: PlacementOption[] = rawOpts.map((opt: any, optIdx: number) => {
      if (typeof opt === 'string') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        return {
          id: letters[optIdx] || String(optIdx + 1),
          text: opt
        };
      }
      return {
        id: String(opt.id || opt.key || opt.letter || opt.option || String.fromCharCode(65 + optIdx)),
        text: String(opt.text || opt.label || opt.value || opt.option || '')
      };
    });

    const rawCategory = String(q.category || q.skill || 'vocabulary').toLowerCase();
    const category: 'vocabulary' | 'grammar' | 'reading' | 'listening' =
      (['vocabulary', 'grammar', 'reading', 'listening'] as const).includes(rawCategory as any)
        ? (rawCategory as 'vocabulary' | 'grammar' | 'reading' | 'listening')
        : 'vocabulary';

    return {
      id: String(q.id != null ? q.id : (q.questionNumber != null ? q.questionNumber : idx + 1)),
      question: String(q.questionText || q.question || `Câu hỏi ${idx + 1}`),
      options,
      category,
      skill: category,
      mediaUrl: q.mediaUrl || q.audioUrl || undefined,
      points: q.points || q.point || 1
    };
  });

  return {
    attemptId: Number(data.attemptId || 0),
    examId: Number(data.examId || 1),
    title: data.title || 'Official Placement Test',
    durationMinutes: Number(data.durationMinutes || 20),
    totalQuestions: normalizedQuestions.length,
    questions: normalizedQuestions,
    savedAnswers: data.answers || {}
  };
};

/**
 * Nộp bài kiểm tra đầu vào lên backend learning-service để chấm điểm server-side độc lập (Zero-Trust)
 * Backend tự động đánh giá CEFR, tính độ chính xác 4 kỹ năng và cập nhật hồ sơ người học
 */
export const submitPlacementTestApi = async (
  params: PlacementSubmitParams | Record<string, string>
): Promise<PlacementResult> => {
  let payload: { attemptId?: number; examId?: number; answers: Record<string, string>; timeSpentSeconds?: number };
  if ('answers' in params && typeof (params as any).answers === 'object') {
    const p = params as PlacementSubmitParams;
    payload = {
      attemptId: p.attemptId != null ? Number(p.attemptId) : undefined,
      examId: p.examId != null ? Number(p.examId) : undefined,
      answers: p.answers,
      timeSpentSeconds: p.timeSpentSeconds != null ? Number(p.timeSpentSeconds) : 180
    };
  } else {
    payload = {
      answers: params as Record<string, string>,
      timeSpentSeconds: 180
    };
  }

  const response = await apiClient.post('/api/v1/learning/placement/submit', payload);
  const resData = response.data?.data || response.data;

  const rawSkills = resData?.skills || {};
  return {
    attemptId: resData?.attemptId != null ? Number(resData.attemptId) : undefined,
    examId: resData?.examId != null ? Number(resData.examId) : undefined,
    cefr_level: String(resData?.assessedCefrLevel || resData?.cefrLevel || 'B1'),
    score_pct: Number(
      resData?.scorePct != null
        ? resData.scorePct
        : (resData?.totalQuestions ? Math.round((Number(resData.correctCount || 0) / Number(resData.totalQuestions)) * 100) : 0)
    ),
    recommendedGoal: resData?.recommendedGoal ? String(resData.recommendedGoal) : 'TOEIC 750+',
    feedbackVi: resData?.feedbackVi ? String(resData.feedbackVi) : undefined,
    skills: {
      vocabulary: Number(rawSkills.vocabulary ?? 70),
      grammar: Number(rawSkills.grammar ?? 70),
      reading: Number(rawSkills.reading ?? 70),
      listening: Number(rawSkills.listening ?? 70)
    }
  };
};
