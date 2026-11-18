import {
  cefrRank,
  isLevelMatch,
  levelDistance,
  normalizeCefr,
  profileFieldsFromPlacement,
  sortByLevelCloseness,
} from '../learnerLevel';

describe('learnerLevel', () => {
  it('chuẩn hoá trình độ CEFR', () => {
    expect(normalizeCefr(' b1 ')).toBe('B1');
    expect(normalizeCefr('B2+')).toBe('B2');
    expect(normalizeCefr('beginner')).toBeNull();
    expect(normalizeCefr(null)).toBeNull();
    expect(cefrRank('C2')).toBe(5);
    expect(cefrRank('x')).toBe(-1);
  });

  it('so khoảng cách và mức phù hợp', () => {
    expect(levelDistance('A2', 'B2')).toBe(2);
    expect(isLevelMatch('B1', 'A2')).toBe(true);
    expect(isLevelMatch('B1', 'B1')).toBe(true);
    expect(isLevelMatch('B1', 'C1')).toBe(false);
    expect(isLevelMatch(null, 'B1')).toBe(false);
  });

  it('sắp xếp nội dung gần trình độ trước, giữ thứ tự khi ngang nhau', () => {
    const items = [
      { id: 1, level: 'C1' },
      { id: 2, level: 'A2' },
      { id: 3, level: 'B1' },
      { id: 4, level: undefined },
      { id: 5, level: 'B2' },
    ];
    expect(sortByLevelCloseness(items, 'B1', (i) => i.level).map((i) => i.id)).toEqual([3, 2, 5, 1, 4]);
    expect(sortByLevelCloseness(items, null, (i) => i.level).map((i) => i.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('lấy trường hồ sơ từ kết quả bài đầu vào', () => {
    expect(profileFieldsFromPlacement({ cefr_level: 'b1', recommendedGoal: 'TOEIC 650+ / B1 Preliminary' })).toEqual({
      cefr_level: 'B1',
      target_goal: 'TOEIC 650+ / B1 Preliminary',
    });
    expect(profileFieldsFromPlacement({ cefr_level: '' })).toEqual({});
  });
});
