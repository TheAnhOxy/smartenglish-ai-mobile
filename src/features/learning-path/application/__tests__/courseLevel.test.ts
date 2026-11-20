import {
  coversLevel,
  defaultLevelFilter,
  distanceToLevel,
  filterByLevel,
  filterChaptersByLevel,
  resolveChaptersForLevel,
  levelLabel,
  splitByLearnerLevel,
} from '../courseLevel';

const c = (id: string, levelMin: string | null, levelMax: string | null = null) => ({ id, levelMin, levelMax });

describe('courseLevel', () => {
  it('coversLevel kiểm tra trong khoảng min–max', () => {
    expect(coversLevel(c('1', 'A2', 'B1'), 'B1')).toBe(true);
    expect(coversLevel(c('1', 'A2', 'B1'), 'B2')).toBe(false);
    expect(coversLevel(c('1', 'B1'), 'b1')).toBe(true);
    expect(coversLevel(c('1', null), 'B1')).toBe(false);
    expect(coversLevel(c('1', 'B1'), null)).toBe(false);
  });

  it('distanceToLevel đo số bậc tới khoảng', () => {
    expect(distanceToLevel(c('1', 'B1', 'B2'), 'A1')).toBe(2);
    expect(distanceToLevel(c('1', 'B1', 'B2'), 'C1')).toBe(1);
    expect(distanceToLevel(c('1', 'B1', 'B2'), 'B2')).toBe(0);
    expect(distanceToLevel(c('1', 'C1', 'A2'), 'B1')).toBe(0);
  });

  it('levelLabel hiển thị một mức hoặc khoảng', () => {
    expect(levelLabel(c('1', 'B1', 'B2'))).toBe('B1–B2');
    expect(levelLabel(c('1', 'B1', 'B1'))).toBe('B1');
    expect(levelLabel(c('1', null, 'C1'))).toBe('C1');
    expect(levelLabel(c('1', null))).toBeNull();
  });

  it('splitByLearnerLevel đưa khóa đúng trình độ lên trước, phần còn lại theo độ gần', () => {
    const items = [c('c1', 'C1'), c('a1', 'A1'), c('b1', 'B1'), c('b1b2', 'B1', 'B2'), c('a2', 'A2'), c('none', null)];
    const { matched, others } = splitByLearnerLevel(items, 'B1');
    expect(matched.map((x) => x.id)).toEqual(['b1', 'b1b2']);
    expect(others.map((x) => x.id)).toEqual(['a2', 'c1', 'a1', 'none']);
  });

  it('splitByLearnerLevel chưa có trình độ thì giữ nguyên thứ tự', () => {
    const items = [c('x', 'C1'), c('y', 'A1')];
    expect(splitByLearnerLevel(items, null)).toEqual({ matched: [], others: items });
  });

  it('filterByLevel và defaultLevelFilter', () => {
    const items = [c('a', 'A1', 'A2'), c('b', 'B1')];
    expect(filterByLevel(items, 'A2').map((x) => x.id)).toEqual(['a']);
    expect(filterByLevel(items, 'ALL')).toHaveLength(2);
    expect(defaultLevelFilter('b2')).toBe('B2');
    expect(defaultLevelFilter('C2')).toBe('C1');
    expect(defaultLevelFilter(undefined)).toBe('ALL');
  });
});

describe('filterChaptersByLevel', () => {
  const chapters = [
    { id: 'a1', cefr_level: 'A1' },
    { id: 'b1', cefr_level: 'B1' },
    { id: 'b2', cefr_level: 'B2', placement_start: true },
    { id: 'c2', cefr_level: 'C2' },
  ];

  it('mức của học viên giữ cả chương bắt đầu theo bài đầu vào', () => {
    expect(filterChaptersByLevel(chapters, 'C1', 'C1').map((c) => c.id)).toEqual(['b2', 'c2']);
  });

  it('mức khác chỉ lấy đúng mức đó', () => {
    expect(filterChaptersByLevel(chapters, 'B1', 'C1').map((c) => c.id)).toEqual(['b1']);
    expect(filterChaptersByLevel(chapters, 'ALL', 'B1')).toHaveLength(4);
  });
});

describe('resolveChaptersForLevel', () => {
  const chapters = [
    { id: 'a1', cefr_level: 'A1' },
    { id: 'a2', cefr_level: 'A2' },
    { id: 'b1', cefr_level: 'B1' },
    { id: 'b2', cefr_level: 'B2' },
  ];

  it('chưa có chương C1 thì lấy trình độ gần nhất (B2)', () => {
    const r = resolveChaptersForLevel(chapters, 'C1', 'C1');
    expect(r.fallbackLevel).toBe('B2');
    expect(r.chapters.map((c) => c.id)).toEqual(['b2']);
  });

  it('có chương đúng trình độ thì không dùng dự phòng', () => {
    const r = resolveChaptersForLevel(chapters, 'B1', 'B1');
    expect(r).toEqual({ chapters: [chapters[2]], fallbackLevel: null });
  });

  it('mức người dùng tự chọn khác trình độ của họ thì không dự phòng', () => {
    expect(resolveChaptersForLevel(chapters, 'C1', 'A1')).toEqual({ chapters: [], fallbackLevel: null });
  });
});
