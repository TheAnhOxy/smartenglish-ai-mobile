import { applyCorrections } from '../useAiWriting';
import type { WritingError } from '@/src/core/types/schema';

const TEXT = 'Yesterday I go to the market and buyed some apple.';
const err = (id: string, original: string, suggestion: string): WritingError => {
  const start = TEXT.indexOf(original);
  return {
    error_id: id,
    type: 'grammar',
    position_start: start,
    position_end: start + original.length,
    original,
    suggestion,
    explanation_vi: '',
    severity: 'minor',
    is_accepted: false,
  };
};

const ERRORS = [err('a', 'go', 'went'), err('b', 'buyed', 'bought'), err('c', 'apple', 'apples')];

test('applies only accepted corrections, keeping positions correct', () => {
  expect(applyCorrections(TEXT, ERRORS, ['a', 'c'])).toBe('Yesterday I went to the market and buyed some apples.');
  expect(applyCorrections(TEXT, ERRORS, ['a', 'b', 'c'])).toBe('Yesterday I went to the market and bought some apples.');
});

test('returns the original text when nothing is accepted', () => {
  expect(applyCorrections(TEXT, ERRORS, [])).toBe(TEXT);
});

test('skips an error whose position no longer matches the text', () => {
  const stale = { ...ERRORS[1], position_start: 0, position_end: 5 };
  expect(applyCorrections(TEXT, [stale], ['b'])).toBe(TEXT);
});
