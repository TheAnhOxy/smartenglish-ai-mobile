jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => undefined },
}));

import en from '../locales/en.json';
import { noTranslate, setLanguage, t, translate, translateChildren } from '../i18n';

describe('i18n vi/en', () => {
  afterEach(() => setLanguage('vi'));

  it('giữ nguyên tiếng Việt khi chọn vi', () => {
    expect(translate('Đăng nhập')).toBe('Đăng nhập');
  });

  it('dịch câu, câu có biến, và giữ khoảng trắng', () => {
    setLanguage('en');
    expect(translate('Đăng nhập')).toBe('Log in');
    expect(translate(' Đăng nhập ')).toBe(' Log in ');
    expect(translate('Còn 3/20 lượt')).toBe('3/20 turns left');
    expect(translate('Mục tiêu: Giao tiếp tự tin')).toBe('Goal: Confident conversation');
    expect(t('Còn {0}/{1} lượt', 3, 20)).toBe('3/20 turns left');
  });

  it('không ghép mẫu sai khi phần biến là chữ Việt không có bản dịch', () => {
    setLanguage('en');
    expect(translate('Học từ')).toBe('Học từ');
  });

  it('dịch children dạng mảng của <Text>, giữ số và phần tử con', () => {
    setLanguage('en');
    expect(translateChildren(['Còn ', 3, '/', 20, ' lượt'])).toBe('3/20 turns left');
    const el = { type: 'b' };
    expect(translateChildren(['Chào ', 'Minh', '!'])).toBe('Hi Minh!');
    expect(translateChildren(['Tài khoản Free chỉ được tham gia tối đa', ' ', el])).toEqual([
      'Free accounts can join up to',
      ' ',
      el,
    ]);
  });

  it('chuỗi đánh dấu không dịch được giữ nguyên', () => {
    setLanguage('en');
    expect(translate(noTranslate('Tiếng Việt'))).toBe(noTranslate('Tiếng Việt'));
  });

  it('en.json: mọi bản dịch giữ đủ biến {n} như câu gốc', () => {
    const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join(',');
    const bad = Object.entries(en as Record<string, string>).filter(([k, v]) => ph(k) !== ph(v));
    expect(bad).toEqual([]);
  });
});

describe('chữ từ server', () => {
  afterEach(() => setLanguage('vi'));
  it('dịch nhiệm vụ hằng ngày', () => {
    setLanguage('en');
    expect(translate('Ôn tập 30 thẻ từ vựng')).toBe('Review 30 vocabulary cards');
    expect(translate('Học 15 từ vựng mới')).toBe('Learn 15 new words');
    expect(translate('Làm 1 bài nghe hiểu trình độ C1')).toBe('Do 1 listening test (C1)');
    expect(translate('Làm 1 bài ngữ pháp trình độ C1')).toBe('Do 1 grammar test (C1)');
  });
});

describe('câu có phần chữ Việt thay đổi', () => {
  afterEach(() => setLanguage('vi'));
  it('dịch khóa học theo trình độ', () => {
    setLanguage('en');
    expect(translate('2 khóa học đúng trình độ bài kiểm tra đầu vào của bạn')).toBe('2 courses match your placement level');
    expect(translate('Đúng trình độ C1 của bạn theo bài kiểm tra đầu vào')).toBe('Matches your level C1 (from placement test)');
    expect(translate('Trình độ của bạn: C1 (theo bài kiểm tra đầu vào)')).toBe('Your level: C1 (from placement test)');
  });
});

describe('nhiệm vụ hôm nay', () => {
  afterEach(() => setLanguage('vi'));
  it('dịch cả phần thời lượng', () => {
    setLanguage('en');
    expect(translate('Trình độ C1 · khoảng 30 phút')).toBe('Level C1 · about 30 min');
    expect(translate('Trình độ C1')).toBe('Level C1');
  });
});
