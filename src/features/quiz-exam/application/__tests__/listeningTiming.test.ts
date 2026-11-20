import { answerWindowSeconds, audioWatchdogSeconds } from '../listeningTiming';

describe('answerWindowSeconds', () => {
  it('Part 1 và Part 2: một khoảng trả lời cho mỗi câu', () => {
    expect(answerWindowSeconds('PART_1', 1)).toBe(8);
    expect(answerWindowSeconds('PART_2', 1)).toBe(8);
    expect(answerWindowSeconds('PART_2', 3)).toBe(8);
  });

  it('Part 3 và Part 4: nhân theo số câu trong cụm', () => {
    expect(answerWindowSeconds('PART_3', 3)).toBe(36);
    expect(answerWindowSeconds('PART_4', 3)).toBe(36);
    expect(answerWindowSeconds('PART_3', 0)).toBe(12);
  });

  it('phần không rõ dùng mặc định 8 giây', () => {
    expect(answerWindowSeconds(undefined, 2)).toBe(8);
  });
});

describe('audioWatchdogSeconds', () => {
  it('có độ dài file thì dư thêm 10 giây', () => {
    expect(audioWatchdogSeconds({ durationSec: 42.3 })).toBe(53);
  });

  it('không có file thì ước theo số từ của transcript', () => {
    const script = Array.from({ length: 110 }, () => 'word').join(' ');
    expect(audioWatchdogSeconds({ script })).toBe(60);
  });

  it('không dưới 15 giây', () => {
    expect(audioWatchdogSeconds({ script: 'Hello there' })).toBe(15);
    expect(audioWatchdogSeconds({})).toBe(15);
  });
});
