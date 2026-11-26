import {
  aiConfidence,
  buildSkillMap,
  dimensionAverages,
  filterByRange,
  historyStats,
  overallScore,
  skillBand,
  skillHistory,
  skillInsight,
  strongestAndWeakest,
} from '../skillMap';
import { dedupeRecent, type FeedbackItem, type SkillOverview } from '@/src/features/practice-feedback/data/practiceFeedbackApi';

const sk = (skill: SkillOverview['skill'], sessions: number, average_score: number | null): SkillOverview => ({
  skill, label: skill, sessions, average_score, last_practiced_at: null, latest_advice_vi: [],
});

const item = (id: number, skill: string, score: number, day: number, fb: Record<string, unknown> = {}): FeedbackItem =>
  ({
    id, skill, skillLabel: '', title: `Buổi ${id}`, overallScore: score,
    createdAt: `2026-11-${String(day).padStart(2, '0')}T08:00:00Z`,
    feedback: { strengths_vi: [], improvements_vi: [], advice_vi: [], summary_vi: '', ...fb },
  }) as unknown as FeedbackItem;

describe('AI Skill Map: 6 kỹ năng', () => {
  it('mỗi kỹ năng lấy đúng nguồn; Phát âm gộp luyện phát âm + hội thoại theo số buổi', () => {
    const map = buildSkillMap(
      [sk('WRITING', 1, 89), sk('SPEAKING', 3, 60), sk('ROLEPLAY', 1, 80), sk('LISTENING', 2, 70), sk('GRAMMAR', 1, 0)],
      { totalWordsLearned: 12, masteredWords: 3 },
    );
    expect(map.map((p) => p.label)).toEqual(['Nghe hiểu', 'Phát âm', 'Đọc hiểu', 'Viết', 'Ngữ pháp', 'Từ vựng']);
    const by = Object.fromEntries(map.map((p) => [p.key, p]));
    expect(by.writing.score).toBe(89);
    expect(by.pronunciation.score).toBe(65); // (60*3 + 80*1) / 4
    expect(by.pronunciation.sessions).toBe(4);
    expect(by.grammar.score).toBe(0);
    expect(by.reading.score).toBeNull(); // chưa luyện → không hiện 0% giả
    expect(by.vocabulary.score).toBe(25); // 3/12 từ đã thuộc
    expect(by.vocabulary.source).toBe('3/12 từ đã thuộc');
  });

  it('xu hướng + sparkline lấy từ các buổi gần nhất', () => {
    const recent = [item(1, 'LISTENING', 50, 1), item(2, 'LISTENING', 55, 2), item(3, 'LISTENING', 80, 3), item(4, 'LISTENING', 85, 4)];
    const p = buildSkillMap([sk('LISTENING', 4, 68)], undefined, recent)[0];
    expect(p.spark).toEqual([50, 55, 80, 85]);
    expect(p.trend).toBe('up');
  });

  it('tổng hợp: mạnh nhất, cần ưu tiên, AI score, độ tin cậy', () => {
    const map = buildSkillMap([sk('WRITING', 14, 89), sk('LISTENING', 2, 40)], undefined);
    const { strongest, weakest } = strongestAndWeakest(map);
    expect(strongest?.key).toBe('writing');
    expect(weakest?.key).toBe('listening');
    expect(overallScore(map)).toBe(65);
    expect(aiConfidence(map)).toBe('medium');
  });

  it('5 mức đánh giá', () => {
    expect([null, 20, 45, 60, 75, 90].map(skillBand)).toEqual(['none', 'weak', 'improve', 'fair', 'good', 'great']);
  });

  it('gộp các buổi luyện trùng nhau', () => {
    const base = { skill: 'WRITING' as const, skillLabel: 'Viết', title: 'Luyện viết với AI', overallScore: 89, feedback: {} as never };
    const items = [1, 2, 3, 4, 5].map((id) => ({ ...base, id, createdAt: `2026-11-26T0${id}:00:00Z` }));
    expect(dedupeRecent([...items, { ...base, id: 6, overallScore: 70, createdAt: '2026-11-26T08:00:00Z' }])).toHaveLength(2);
  });
});

describe('chi tiết một kỹ năng', () => {
  it('lịch sử cũ → mới, thống kê, lọc theo khoảng thời gian', () => {
    const items = [item(3, 'ROLEPLAY', 80, 20), item(1, 'SPEAKING', 50, 10), item(2, 'WRITING', 90, 15), item(4, 'SPEAKING', 70, 25)];
    const h = skillHistory(items, 'pronunciation');
    expect(h.map((p) => p.score)).toEqual([50, 80, 70]);
    expect(historyStats(h)).toEqual({ best: 80, latest: 70, trend: -10 }); // buổi cuối 70 so với buổi trước 80
    const now = new Date('2026-11-26T12:00:00Z').getTime();
    expect(filterByRange(h, '7d', now).map((p) => p.score)).toEqual([80, 70]);
    expect(filterByRange(h, 'all', now)).toHaveLength(3);
  });

  it('điểm thành phần trung bình, bỏ thành phần không có điểm', () => {
    const items = [
      item(1, 'SPEAKING', 60, 1, { pronunciation: { score: 60 }, grammar: { score: 80 } }),
      item(2, 'SPEAKING', 70, 2, { pronunciation: { score: 80 } }),
    ];
    expect(dimensionAverages(items, 'pronunciation')).toEqual([
      { label: 'Ngữ pháp', score: 80, count: 1 },
      { label: 'Phát âm', score: 70, count: 2 },
    ]);
  });

  it('AI Insight: nhận xét mới nhất, lỗi thường gặp đếm số lần', () => {
    const items = [
      item(1, 'WRITING', 70, 1, { summary_vi: 'cũ', improvements_vi: ['Nối ý', 'Chính tả'], advice_vi: ['Viết đoạn ngắn'] }),
      item(2, 'WRITING', 85, 5, { summary_vi: 'Bạn diễn đạt rõ ràng', improvements_vi: ['Nối ý'], strengths_vi: ['Câu đơn tốt'] }),
    ];
    const ins = skillInsight(items, 'writing');
    expect(ins.summary).toBe('Bạn diễn đạt rõ ràng');
    expect(ins.mistakes[0]).toEqual({ text: 'Nối ý', count: 2 });
    expect(ins.strengths).toEqual(['Câu đơn tốt']);
    expect(ins.advice).toEqual(['Viết đoạn ngắn']);
  });
});
