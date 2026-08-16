import { apiClient } from '@/src/core/api/client';

export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
}

export const MOCK_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'pq-1',
    question: 'Choose the word that best completes the sentence: "She has an _____ knowledge of economics."',
    options: ['extensive', 'extension', 'extending', 'extensively'],
    correct_answer: 'extensive',
    category: 'vocabulary'
  },
  {
    id: 'pq-2',
    question: 'If I _____ more time, I would have attended the seminar yesterday.',
    options: ['had', 'have had', 'had had', 'have'],
    correct_answer: 'had had',
    category: 'grammar'
  },
  {
    id: 'pq-3',
    question: 'Select the synonym for "accomplish":',
    options: ['achieve', 'abandon', 'delay', 'hesitate'],
    correct_answer: 'achieve',
    category: 'vocabulary'
  },
  {
    id: 'pq-4',
    question: 'By the time the manager arrived, the team _____ the report.',
    options: ['already finished', 'had already finished', 'has finished', 'finishes'],
    correct_answer: 'had already finished',
    category: 'grammar'
  },
  {
    id: 'pq-5',
    question: 'Which word means "negotiation in business"?',
    options: ['Bargaining', 'Dictation', 'Isolation', 'Hesitation'],
    correct_answer: 'Bargaining',
    category: 'vocabulary'
  },
  {
    id: 'pq-6',
    question: 'The meeting was postponed _____ the keynote speaker fell ill unexpectedly.',
    options: ['because of', 'owing to', 'because', 'despite'],
    correct_answer: 'because',
    category: 'grammar'
  },
  {
    id: 'pq-7',
    question: 'Listening excerpt: "The flight departure has been delayed to 4:30 PM due to fog." What is the reason for delay?',
    options: ['Heavy rain', 'Technical glitch', 'Adverse weather (fog)', 'Crew shortage'],
    correct_answer: 'Adverse weather (fog)',
    category: 'listening'
  },
  {
    id: 'pq-8',
    question: 'Select the antonym for "resilient":',
    options: ['fragile', 'strong', 'flexible', 'adaptable'],
    correct_answer: 'fragile',
    category: 'vocabulary'
  },
  {
    id: 'pq-9',
    question: 'Reading excerpt: "Renewable energy adoption has surged by 35% in Northern Europe." What does the passage suggest?',
    options: ['Fossil fuels are rising', 'Clean energy is growing rapidly', 'Solar panels are banned', 'Energy consumption declined'],
    correct_answer: 'Clean energy is growing rapidly',
    category: 'reading'
  },
  {
    id: 'pq-10',
    question: 'She suggested _____ the marketing campaign before the third quarter.',
    options: ['to launch', 'launching', 'launched', 'launch'],
    correct_answer: 'launching',
    category: 'grammar'
  },
  {
    id: 'pq-11',
    question: 'What is the correct definition of "meticulous"?',
    options: ['Careless and rushed', 'Showing great attention to detail', 'Noisy and disruptive', 'Uncertain and timid'],
    correct_answer: 'Showing great attention to detail',
    category: 'vocabulary'
  },
  {
    id: 'pq-12',
    question: 'Neither the manager nor the employees _____ satisfied with the new policy.',
    options: ['was', 'were', 'is', 'be'],
    correct_answer: 'were',
    category: 'grammar'
  },
  {
    id: 'pq-13',
    question: 'Listening excerpt: "Please hand in your quarterly financial statements by Friday 5 PM." What is the deadline?',
    options: ['Friday afternoon', 'Monday morning', 'Wednesday noon', 'Next month'],
    correct_answer: 'Friday afternoon',
    category: 'listening'
  },
  {
    id: 'pq-14',
    question: 'Reading passage: "Artificial Intelligence simplifies routine data processing tasks." What is the main idea?',
    options: ['AI replaces all human jobs', 'AI automates repetitive data work', 'AI is difficult to configure', 'Data processing is obsolete'],
    correct_answer: 'AI automates repetitive data work',
    category: 'reading'
  },
  {
    id: 'pq-15',
    question: 'Had we known about the weather warning, we _____ outdoor plans.',
    options: ['would cancel', 'would have canceled', 'will cancel', 'canceled'],
    correct_answer: 'would have canceled',
    category: 'grammar'
  }
];

export interface PlacementResult {
  cefr_level: string;
  score_pct: number;
  skills: {
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
  };
}

export const submitPlacementTestApi = async (answers: Record<string, string>): Promise<PlacementResult> => {
  let correctCount = 0;
  let vocabCorrect = 0, vocabTotal = 0;
  let grammarCorrect = 0, grammarTotal = 0;
  let readingCorrect = 0, readingTotal = 0;
  let listeningCorrect = 0, listeningTotal = 0;

  MOCK_PLACEMENT_QUESTIONS.forEach((q) => {
    const isCorrect = answers[q.id] === q.correct_answer;
    if (isCorrect) correctCount++;

    if (q.category === 'vocabulary') {
      vocabTotal++;
      if (isCorrect) vocabCorrect++;
    } else if (q.category === 'grammar') {
      grammarTotal++;
      if (isCorrect) grammarCorrect++;
    } else if (q.category === 'reading') {
      readingTotal++;
      if (isCorrect) readingCorrect++;
    } else if (q.category === 'listening') {
      listeningTotal++;
      if (isCorrect) listeningCorrect++;
    }
  });

  const pct = Math.round((correctCount / MOCK_PLACEMENT_QUESTIONS.length) * 100);
  let cefr = 'A1';
  if (pct >= 80) cefr = 'B2';
  else if (pct >= 60) cefr = 'B1';
  else if (pct >= 40) cefr = 'A2';

  return {
    cefr_level: cefr,
    score_pct: pct,
    skills: {
      vocabulary: Math.round((vocabCorrect / Math.max(1, vocabTotal)) * 100),
      grammar: Math.round((grammarCorrect / Math.max(1, grammarTotal)) * 100),
      reading: Math.round((readingCorrect / Math.max(1, readingTotal)) * 100),
      listening: Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 100)
    }
  };
};
