import type { WordDetail } from '@/src/features/flashcard-srs/data/vocabularyApi';

export type QuickQuestionType = 'meaning' | 'word' | 'blank';

export interface QuickQuizQuestion {
  id: string;
  type: QuickQuestionType;
  prompt: string;
  /** Câu có chỗ trống (chỉ dạng điền từ) */
  sentence?: string;
  options: string[];
  answer: string;
  /** Giải thích hiển thị sau khi trả lời */
  explanation: string;
  word: string;
}

export const QUICK_TYPE_LABEL: Record<QuickQuestionType, string> = {
  meaning: 'Chọn nghĩa đúng',
  word: 'Chọn từ theo nghĩa',
  blank: 'Điền từ vào câu',
};

const shuffle = <T,>(arr: T[], rand: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Câu ví dụ chứa đúng từ cần hỏi (không phân biệt hoa thường) → câu có chỗ trống. */
export const blankOut = (sentence: string, word: string): string | null => {
  const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  return re.test(sentence) ? sentence.replace(re, '_____') : null;
};

/**
 * Sinh bộ câu hỏi trắc nghiệm từ danh sách từ vựng thật.
 * Mỗi câu có 4 phương án, 3 phương án nhiễu lấy từ các từ khác trong cùng nhóm.
 */
export const generateQuickQuiz = (
  words: WordDetail[],
  types: QuickQuestionType[],
  count: number,
  rand: () => number = Math.random,
): QuickQuizQuestion[] => {
  const pool = words.filter((w) => w.word?.trim() && w.definitionVi?.trim());
  if (pool.length < 4 || types.length === 0) return [];

  const picked = shuffle(pool, rand);
  const questions: QuickQuizQuestion[] = [];

  for (let i = 0; i < picked.length && questions.length < count * 2; i += 1) {
    const target = picked[i];
    const distractors = shuffle(pool.filter((w) => w.word.toLowerCase() !== target.word.toLowerCase()), rand).slice(0, 3);
    if (distractors.length < 3) continue;

    // Ưu tiên dạng điền từ khi từ có câu ví dụ phù hợp
    const order = shuffle(types, rand);
    for (const type of order) {
      if (type === 'blank') {
        const example = target.examples?.find((e) => e.sentenceEn && blankOut(e.sentenceEn, target.word));
        if (!example) continue;
        questions.push({
          id: `${target.id}-blank`,
          type,
          prompt: QUICK_TYPE_LABEL.blank,
          sentence: blankOut(example.sentenceEn, target.word) ?? undefined,
          options: shuffle([target.word, ...distractors.map((d) => d.word)], rand),
          answer: target.word,
          explanation: `${target.word}: ${target.definitionVi}${example.sentenceVi ? ` — ${example.sentenceVi}` : ''}`,
          word: target.word,
        });
        break;
      }
      if (type === 'meaning') {
        questions.push({
          id: `${target.id}-meaning`,
          type,
          prompt: `"${target.word}" nghĩa là gì?`,
          options: shuffle([target.definitionVi, ...distractors.map((d) => d.definitionVi)], rand),
          answer: target.definitionVi,
          explanation: `${target.word} ${target.ipaUs ? `${target.ipaUs} ` : ''}(${target.partOfSpeech}): ${target.definitionVi}`,
          word: target.word,
        });
        break;
      }
      questions.push({
        id: `${target.id}-word`,
        type: 'word',
        prompt: `Từ nào có nghĩa "${target.definitionVi}"?`,
        options: shuffle([target.word, ...distractors.map((d) => d.word)], rand),
        answer: target.word,
        explanation: `${target.word} ${target.ipaUs ? `${target.ipaUs} ` : ''}(${target.partOfSpeech}): ${target.definitionVi}`,
        word: target.word,
      });
      break;
    }
  }
  // Bỏ câu có phương án trùng nhau (hai từ cùng nghĩa trong dữ liệu thật), rồi lấy đủ số câu
  return questions
    .filter((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === q.options.length)
    .slice(0, count);
};
