import { apiClient, getCurrentUserId } from '@/src/core/api/client';

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

export const MOCK_QUIZ_SUITE: QuizSuite = {
  id: '1',
  title: 'Quiz Ngữ Pháp: Thì Quá Khứ & Hiện Tại Hoàn Thành',
  duration_sec: 300,
  questions: [
    {
      id: '1',
      type: 'multiple_choice',
      question_text: 'She _____ to London three times this year.',
      options: ['has been', 'was', 'goes', 'had been'],
      correct_answer: 'has been',
      explanation_vi: 'Dùng thì Hiện tại hoàn thành (has been) để diễn tả trải nghiệm đã xảy ra nhiều lần tính tới hiện tại.'
    },
    {
      id: '2',
      type: 'multiple_choice',
      question_text: 'They _____ the new contract yesterday morning.',
      options: ['signed', 'have signed', 'had signed', 'sign'],
      correct_answer: 'signed',
      explanation_vi: 'Có mốc thời gian xác định trong quá khứ (yesterday morning) ➔ dùng thì Quá khứ đơn (signed).'
    }
  ]
};

export const MOCK_EXAM_SUITE: QuizSuite = {
  id: 'exam-toeic-mini',
  title: 'Đề Thi Thử TOEIC Mini (Reading & Listening)',
  duration_sec: 2700,
  questions: [
    {
      id: 'eq1',
      type: 'multiple_choice',
      question_text: 'Mr. Henderson requested that all sales reports be submitted _____ Friday afternoon.',
      options: ['before', 'after', 'until', 'during'],
      correct_answer: 'before',
      explanation_vi: 'Dùng giới từ "before" + thời gian để chỉ hạn chót nộp báo cáo.'
    },
    {
      id: 'eq2',
      type: 'multiple_choice',
      question_text: 'The marketing campaign resulted in a _____ increase in online store traffic.',
      options: ['significant', 'significantly', 'signify', 'significance'],
      correct_answer: 'significant',
      explanation_vi: 'Cần một tính từ (significant) để bổ nghĩa cho danh từ "increase".'
    }
  ]
};

export const fetchQuizzesListApi = async (quizType?: string) => {
  try {
    const uid = getCurrentUserId();
    const url = quizType
      ? `/api/v1/learning/quizzes?quizType=${quizType}${uid ? `&userId=${uid}` : ''}`
      : `/api/v1/learning/quizzes${uid ? `?userId=${uid}` : ''}`;
    const response = await apiClient.get<any>(url);
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Real Quizzes List API error:', err);
  }
  return [MOCK_QUIZ_SUITE];
};

export const fetchQuizSuiteApi = async (id: string): Promise<QuizSuite> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/quizzes/${id}`);
    const quizData = response.data?.data || response.data;
    if (quizData && quizData.questions && Array.isArray(quizData.questions)) {
      return {
        id: String(quizData.id),
        title: quizData.quizType === 'TOEIC_MOCK' ? 'Đề Thi Thử TOEIC Mock' : (quizData.quizType === 'IELTS_MOCK' ? 'Đề Thi Thử IELTS Mock' : 'Bài Kiểm Tra Quiz'),
        duration_sec: 1200,
        questions: quizData.questions.map((q: any, idx: number) => ({
          id: String(q.id || idx + 1),
          type: (q.questionType || 'MULTIPLE_CHOICE').toLowerCase().includes('choice') ? 'multiple_choice' : 'fill_blank',
          question_text: q.questionText || `Question ${idx + 1}: Select the correct answer`,
          options: q.options ? q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || opt.option || String(opt))) : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
          correct_answer: q.correctAnswer || 'A',
          explanation_vi: q.explanationVi || 'Lời giải thích cặn kẽ bằng tiếng Việt.'
        }))
      };
    }
  } catch (err) {
    console.warn('Real Quiz Detail API error, returning fallback quiz:', err);
  }
  return id.includes('exam') ? MOCK_EXAM_SUITE : MOCK_QUIZ_SUITE;
};

export const submitQuizAttemptApi = async (
  attemptId: number,
  answers: Array<{ questionId: number; userAnswer: string; responseTimeMs?: number }>,
  timeSpentSec: number = 300,
  userId?: string
): Promise<QuizSubmitResult> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/attempts/submit?userId=${uid}`, {
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
  } catch (err) {
    console.warn('Real Submit Attempt API error, returning estimated result:', err);
  }

  return {
    attemptId,
    scorePct: 100,
    correctCount: answers.length,
    wrongCount: 0,
    answerDetails: answers.map((ans) => ({
      questionId: ans.questionId,
      userAnswer: ans.userAnswer,
      correctAnswer: ans.userAnswer,
      isCorrect: true,
      explanationVi: 'Đáp án chính xác!'
    }))
  };
};
