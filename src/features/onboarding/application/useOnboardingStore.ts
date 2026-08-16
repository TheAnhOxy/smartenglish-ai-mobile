import { create } from 'zustand';
import { PlacementResult } from '../data/onboardingApi';

interface OnboardingState {
  targetGoal: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  result: PlacementResult | null;

  setTargetGoal: (goal: string) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setQuestionIndex: (index: number) => void;
  setResult: (res: PlacementResult) => void;
  resetTest: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  targetGoal: 'TOEIC 750+',
  currentQuestionIndex: 0,
  answers: {},
  result: null,

  setTargetGoal: (goal) => set({ targetGoal: goal }),
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  setQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setResult: (res) => set({ result: res }),
  resetTest: () => set({ currentQuestionIndex: 0, answers: {}, result: null })
}));
