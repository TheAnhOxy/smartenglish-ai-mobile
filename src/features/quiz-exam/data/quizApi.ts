import { apiClient } from '@/src/core/api/client';

export interface QuestionItem {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'listening';
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation_vi: string;
}

export interface QuizSuite {
  id: string;
  title: string;
  duration_sec: number;
  questions: QuestionItem[];
}

export interface QuizSubmitResult {
  attemptId: number;
  scorePct: number;
  correctCount: number;
  wrongCount: number;
  skillBreakdown?: Record<string, any>;
  answerDetails?: Array<{
    questionId: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanationVi: string;
  }>;
}

export const fetchQuizzesListApi = async (quizType?: string) => {
  const url = quizType
    ? `/api/v1/learning/quizzes?quizType=${encodeURIComponent(quizType)}`
    : '/api/v1/learning/quizzes';
  const response = await apiClient.get<any>(url);
  const data = response.data?.data || response.data;
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

export const fetchQuizSuiteApi = async (id: string): Promise<QuizSuite> => {
  const response = await apiClient.get<any>(`/api/v1/learning/quizzes/${id}`);
  const quizData = response.data?.data || response.data;
  if (quizData && quizData.questions && Array.isArray(quizData.questions)) {
    return {
      id: String(quizData.id),
      title: quizData.quizType === 'TOEIC_MOCK'
        ? 'Đề Thi Thử TOEIC Mock'
        : (quizData.quizType === 'IELTS_MOCK'
          ? 'Đề Thi Thử IELTS Mock'
          : (quizData.title || 'Bài Kiểm Tra Quiz')),
      duration_sec: Number(quizData.durationMinutes ? quizData.durationMinutes * 60 : 1200),
      questions: quizData.questions.map((q: any, idx: number) => ({
        id: String(q.id || idx + 1),
        type: (q.questionType || 'MULTIPLE_CHOICE').toLowerCase().includes('choice') ? 'multiple_choice' : 'fill_blank',
        question_text: q.questionText || `Câu ${idx + 1}`,
        options: q.options ? q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || opt.option || String(opt))) : ['A', 'B', 'C', 'D'],
        correct_answer: q.correctAnswer || 'A',
        explanation_vi: q.explanationVi || ''
      }))
    };
  }
  throw new Error(`Không tìm thấy dữ liệu bài kiểm tra ID ${id}`);
};

export const submitQuizAttemptApi = async (
  attemptId: number,
  answers: Array<{ questionId: number; userAnswer: string; responseTimeMs?: number }>,
  timeSpentSec: number = 300
): Promise<QuizSubmitResult> => {
  const response = await apiClient.post<any>('/api/v1/learning/attempts/submit', {
    attemptId,
    timeSpentSec,
    answers
  });
  const data = response.data?.data || response.data;
  if (data) {
    return {
      attemptId: data.attemptId || attemptId,
      scorePct: data.scorePct || 100,
      correctCount: data.correctCount || answers.length,
      wrongCount: data.wrongCount || 0,
      skillBreakdown: data.skillBreakdown || {},
      answerDetails: data.answerDetails || []
    };
  }

  throw new Error('Backend không trả về kết quả bài kiểm tra hợp lệ');
};
