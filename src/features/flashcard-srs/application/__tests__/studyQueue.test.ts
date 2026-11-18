import {
  MAX_RELEARN_PER_SESSION,
  describeNextDue,
  findSystemDeckIdForTopic,
  previewIntervalDays,
  ratingHint,
  mapDeckCardToStudyCard,
  requeueAfterRating,
  StudyCard,
} from '../studyQueue';

const card = (id: string): StudyCard => ({ id, word: id, ipa: '', type: '', meaning: '', example: '' });

describe('mapDeckCardToStudyCard', () => {
  it('tách từ, phiên âm, nghĩa và ví dụ từ mặt trước/sau của thẻ', () => {
    const c = mapDeckCardToStudyCard(
      { id: 7, customFront: 'apple  /ˈæp.əl/', customBack: 'quả táo\nVí dụ: I eat an apple.', isNew: true } as never,
      0
    );
    expect(c).toMatchObject({
      id: '7',
      cardId: 7,
      word: 'apple',
      ipa: '/ˈæp.əl/',
      meaning: 'quả táo',
      example: 'I eat an apple.',
      isNew: true,
      relearnCount: 0,
    });
  });

  it('có giá trị mặc định khi thẻ thiếu nội dung', () => {
    const c = mapDeckCardToStudyCard({} as never, 2);
    expect(c.word).toBe('Từ #3');
    expect(c.cardId).toBeUndefined();
    expect(c.isNew).toBe(false);
  });
});

describe('requeueAfterRating', () => {
  const queue = [card('a'), card('b')];

  it('chọn "Tốt"/"Dễ" thì không học lại', () => {
    expect(requeueAfterRating(queue, 0, 2)).toBe(queue);
    expect(requeueAfterRating(queue, 0, 3)).toBe(queue);
  });

  it('chọn "Quên"/"Khó" thì đưa thẻ về cuối lượt', () => {
    const next = requeueAfterRating(queue, 0, 0);
    expect(next).toHaveLength(3);
    expect(next[2]).toMatchObject({ id: 'a#r1', word: 'a', relearnCount: 1 });
  });

  it(`không học lại quá ${MAX_RELEARN_PER_SESSION} lần`, () => {
    let q = queue;
    let idx = 0;
    for (let i = 0; i < MAX_RELEARN_PER_SESSION; i++) {
      q = requeueAfterRating(q, idx, 1);
      idx = q.length - 1;
    }
    expect(q).toHaveLength(2 + MAX_RELEARN_PER_SESSION);
    expect(requeueAfterRating(q, idx, 0)).toBe(q);
  });

  it('chỉ số ngoài hàng đợi thì giữ nguyên', () => {
    expect(requeueAfterRating(queue, 5, 0)).toBe(queue);
  });
});

describe('describeNextDue', () => {
  const today = new Date(2026, 10, 18);
  it.each([
    [null, null],
    ['', null],
    ['abc', null],
    ['2026-11-17', 'hôm nay'],
    ['2026-11-18', 'hôm nay'],
    ['2026-11-19', 'ngày mai'],
    ['2026-11-25', 'sau 7 ngày (25/11)'],
  ])('%s → %s', (input, expected) => {
    expect(describeNextDue(input as string | null, today)).toBe(expected);
  });
});

describe('findSystemDeckIdForTopic', () => {
  const decks = [
    { id: 13, name: '🏥 Sức khỏe & Y tế' },
    { id: 28, name: '👨‍👩‍👧‍👦 Gia đình & Mối quan hệ' },
    { id: 7, name: '✈️ Du lịch & Di chuyển' },
  ];

  it('khớp chủ đề với bộ thẻ hệ thống cùng tên, bỏ qua biểu tượng đầu tên', () => {
    expect(findSystemDeckIdForTopic('Gia đình & Mối quan hệ', decks)).toBe(28);
    expect(findSystemDeckIdForTopic('du lịch &  di chuyển', decks)).toBe(7);
  });

  it('không có bộ thẻ cùng tên thì trả về null', () => {
    expect(findSystemDeckIdForTopic('Chủ đề mới', decks)).toBeNull();
    expect(findSystemDeckIdForTopic('', decks)).toBeNull();
  });
});

describe('previewIntervalDays / ratingHint (SM-2 như learning-service)', () => {
  const base = card('x');

  it('thẻ mới: chấm đúng → 1 ngày, chấm sai → học lại ngay', () => {
    expect(previewIntervalDays({ ...base, repetitions: 0 }, 2)).toBe(1);
    expect(previewIntervalDays({ ...base, repetitions: 0 }, 3)).toBe(1);
    expect(ratingHint({ ...base, repetitions: 0 }, 0)).toBe('Học lại ngay');
    expect(ratingHint({ ...base, repetitions: 0 }, 1)).toBe('Học lại ngay');
    expect(ratingHint({ ...base, repetitions: 0 }, 2)).toBe('1 ngày');
  });

  it('lần đúng thứ 2 → 6 ngày, sau đó khoảng cũ × hệ số dễ', () => {
    expect(previewIntervalDays({ ...base, repetitions: 1, intervalDays: 1 }, 2)).toBe(6);
    expect(previewIntervalDays({ ...base, repetitions: 2, intervalDays: 6, easeFactor: 2.5 }, 2)).toBe(15);
    expect(previewIntervalDays({ ...base, repetitions: 2, intervalDays: 6 }, 3)).toBe(15);
  });

  it('thẻ bị đưa lại trong lượt được tính lại từ đầu', () => {
    const q = requeueAfterRating([{ ...base, repetitions: 3, intervalDays: 15 }], 0, 0);
    expect(previewIntervalDays(q[1], 2)).toBe(1);
  });
});
