import { create } from 'zustand';
import { PlacementQuestion, PlacementResult, PlacementSession } from '../data/onboardingApi';

interface OnboardingState {
  targetGoal: string;
  attemptId: number | null;
  examId: number | null;
  questions: PlacementQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  result: PlacementResult | null;
  isLoading: boolean;
  error: string | null;
  /** Khách đã làm xong bài nhưng chưa đăng nhập: nộp ngay sau khi đăng nhập. */
  pendingSubmit: boolean;

  setTargetGoal: (goal: string) => void;
  setSession: (session: PlacementSession) => void;
  setQuestions: (questions: PlacementQuestion[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setQuestionIndex: (index: number) => void;
  setResult: (res: PlacementResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingSubmit: (pending: boolean) => void;
  resetTest: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  targetGoal: 'TOEIC 750+',
  attemptId: null,
  examId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  result: null,
  isLoading: false,
  error: null,
  pendingSubmit: false,

  setTargetGoal: (goal) => set({ targetGoal: goal }),
  setSession: (session) =>
    set({
      attemptId: session.attemptId,
      examId: session.examId,
      questions: session.questions,
      answers: session.savedAnswers || {},
      currentQuestionIndex: 0,
      error: null,
    }),
  setQuestions: (questions) => set({ questions }),
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  setQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setResult: (res) => set({ result: res }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setPendingSubmit: (pending) => set({ pendingSubmit: pending }),
  resetTest: () =>
    set({
      attemptId: null,
      examId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      result: null,
      error: null,
      pendingSubmit: false,
    }),
}));
