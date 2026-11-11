import { blankOut, generateQuickQuiz } from '../quickQuizGenerator';
import type { WordDetail } from '@/src/features/flashcard-srs/data/vocabularyApi';

const word = (id: string, w: string, vi: string, example?: string): WordDetail => ({
  id,
  word: w,
  ipaUs: '',
  partOfSpeech: 'NOUN',
  cefrLevel: 'A1',
  definitionEn: '',
  definitionVi: vi,
  examples: example ? [{ sentenceEn: example }] : [],
});

const WORDS = [
  word('1', 'apple', 'quả táo', 'I eat an apple every day.'),
  word('2', 'book', 'quyển sách', 'This book is interesting.'),
  word('3', 'chair', 'cái ghế'),
  word('4', 'door', 'cánh cửa'),
  word('5', 'egg', 'quả trứng'),
];

// Bộ sinh số giả cố định để kết quả lặp lại được
const seeded = () => {
  let x = 42;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
};

test('blankOut only replaces the whole word', () => {
  expect(blankOut('I eat an apple every day.', 'apple')).toBe('I eat an _____ every day.');
  expect(blankOut('Pineapples are sweet.', 'apple')).toBeNull();
});

test('every question has 4 unique options including the answer', () => {
  const qs = generateQuickQuiz(WORDS, ['meaning', 'word'], 5, seeded());
  expect(qs).toHaveLength(5);
  for (const q of qs) {
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options).toContain(q.answer);
  }
});

test('blank questions are only made from words with a matching example', () => {
  const qs = generateQuickQuiz(WORDS, ['blank'], 10, seeded());
  expect(qs.map((q) => q.word).sort()).toEqual(['apple', 'book']);
  expect(qs.every((q) => q.sentence?.includes('_____'))).toBe(true);
});

test('returns nothing when there are fewer than 4 usable words', () => {
  expect(generateQuickQuiz(WORDS.slice(0, 3), ['meaning'], 5)).toEqual([]);
});
