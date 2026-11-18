import { toDailyQuest } from '../data/dailyQuestMapper';

describe('toDailyQuest', () => {
  it('opens the assigned exam for a skill task', () => {
    const q = toDailyQuest(
      { taskId: 3, kind: 'SKILL_EXAM', skill: 'listening', descriptionVi: 'Làm 1 bài nghe hiểu trình độ B1', targetCount: 1, currentCount: 0, examId: 11, examTitle: 'Listening B1', cefrLevel: 'B1' },
      2, 10, false,
    );
    expect(q).toMatchObject({ id: '3', icon: 'listening', subtitle: 'Listening B1', unit: 'bài' });
    expect(q.route).toBe('/(student)/practice/exam/11?mode=PRACTICE&title=Listening%20B1');
  });

  it('falls back to the level-filtered catalog when no exam was assigned', () => {
    const q = toDailyQuest({ kind: 'SKILL_EXAM', skill: 'reading', cefrLevel: 'A2' }, 0, 10, false);
    expect(q.route).toBe('/(student)/learn?tab=quiz&category=READING&level=A2');
    expect(q.icon).toBe('reading');
  });

  it('maps card, word and placement tasks', () => {
    expect(toDailyQuest({ kind: 'REVIEW_CARDS', unit: 'thẻ' }, 0, 10, false)).toMatchObject({ icon: 'vocab', unit: 'thẻ', route: '/(student)/review' });
    expect(toDailyQuest({ kind: 'LEARN_WORDS', unit: 'từ' }, 1, 10, false).unit).toBe('từ');
    expect(toDailyQuest({ kind: 'PLACEMENT' }, 2, 10, true)).toMatchObject({ route: '/(student)/placement/test', claimed: true });
  });

  it('keeps guessing from the description for the old backend format', () => {
    expect(toDailyQuest({ descriptionVi: 'Ôn tập 10 thẻ từ vựng Flashcard', targetCount: 10, currentCount: 4 }, 0, 10, false))
      .toMatchObject({ icon: 'vocab', current: 4, target: 10 });
    expect(toDailyQuest({ descriptionVi: 'Hoàn thành 1 bài kiểm tra (Quiz)' }, 1, 10, false).route).toBe('/(student)/learn?tab=quiz');
  });
});
