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

export const MOCK_QUIZ_SUITE: QuizSuite = {
  id: 'quiz-grammar-01',
  title: 'Quiz Ngữ Pháp: Thì Quá Khứ & Hiện Tại Hoàn Thành',
  duration_sec: 300,
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question_text: 'She _____ to London three times this year.',
      options: ['has been', 'was', 'goes', 'had been'],
      correct_answer: 'has been',
      explanation_vi: 'Dùng thì Hiện tại hoàn thành (has been) để diễn tả trải nghiệm đã xảy ra nhiều lần tính tới hiện tại (this year).'
    },
    {
      id: 'q2',
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
  duration_sec: 2700, // 45 mins
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

export const fetchQuizSuiteApi = async (id: string): Promise<QuizSuite> => {
  return id.includes('exam') ? MOCK_EXAM_SUITE : MOCK_QUIZ_SUITE;
};
