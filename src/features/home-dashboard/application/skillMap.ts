// AI Skill Map (tab Đánh giá): 6 kỹ năng, mỗi kỹ năng lấy từ đúng nguồn dữ liệu thật của nó.
//  - Nghe hiểu / Đọc hiểu / Viết / Ngữ pháp: điểm AI chấm sau từng buổi luyện của chính kỹ năng đó
//  - Phát âm: luyện phát âm + hội thoại (AI chấm)
//  - Từ vựng: quiz/đề từ vựng; chưa có thì dùng tỉ lệ từ đã thuộc trong ôn thẻ SRS
// Kỹ năng chưa luyện trả về null (hiện "Chưa luyện"), không hiện 0% giả.

import type { FeedbackItem, PracticeSkill, SkillOverview } from '@/src/features/practice-feedback/data/practiceFeedbackApi';

export type SkillKey = 'listening' | 'pronunciation' | 'reading' | 'writing' | 'grammar' | 'vocabulary';

/** Thứ tự trên biểu đồ (theo chiều kim đồng hồ, bắt đầu từ đỉnh trên). */
export const SKILL_ORDER: SkillKey[] = ['listening', 'pronunciation', 'reading', 'writing', 'grammar', 'vocabulary'];

export const SKILL_LABELS: Record<SkillKey, string> = {
  listening: 'Nghe hiểu',
  pronunciation: 'Phát âm',
  reading: 'Đọc hiểu',
  writing: 'Viết',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
};

const SKILL_SOURCES: Record<SkillKey, PracticeSkill[]> = {
  listening: ['LISTENING'],
  pronunciation: ['SPEAKING', 'ROLEPLAY'],
  reading: ['READING'],
  writing: ['WRITING'],
  grammar: ['GRAMMAR'],
  vocabulary: ['VOCABULARY', 'QUIZ'],
};
export const sourcesOf = (key: SkillKey): PracticeSkill[] => SKILL_SOURCES[key];

export interface VocabStats {
  totalWordsLearned: number;
  masteredWords: number;
}

export type Trend = 'up' | 'down' | 'stable' | null;

export interface SkillPoint {
  key: SkillKey;
  label: string;
  /** 0–100 hoặc null nếu chưa có dữ liệu. */
  score: number | null;
  sessions: number;
  /** Mô tả nguồn số liệu, vd. "3 buổi AI chấm", "12/40 từ đã thuộc". */
  source: string;
  trend: Trend;
  /** Điểm các buổi gần nhất (cho sparkline). */
  spark: number[];
}

// ---------------------------------------------------------------------------
// Mức đánh giá
// ---------------------------------------------------------------------------

export type Band = 'none' | 'weak' | 'improve' | 'fair' | 'good' | 'great';

export const skillBand = (score: number | null): Band =>
  score == null ? 'none' : score >= 85 ? 'great' : score >= 70 ? 'good' : score >= 55 ? 'fair' : score >= 40 ? 'improve' : 'weak';

export const SKILL_BAND_LABEL: Record<Band, string> = {
  none: 'Chưa luyện',
  weak: 'Yếu',
  improve: 'Cần cải thiện',
  fair: 'Khá',
  good: 'Tốt',
  great: 'Rất tốt',
};

// ---------------------------------------------------------------------------
// Lịch sử & xu hướng
// ---------------------------------------------------------------------------

export interface HistoryPoint {
  id: number;
  score: number;
  date: string | null;
  title: string;
}

/** Điểm các buổi luyện của một kỹ năng, cũ → mới (tối đa `max` buổi gần nhất). */
export const skillHistory = (items: FeedbackItem[], key: SkillKey, max = 30): HistoryPoint[] =>
  items
    .filter((it) => sourcesOf(key).includes(it.skill) && it.overallScore != null)
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    .slice(-max)
    .map((it) => ({ id: it.id, score: it.overallScore as number, date: it.createdAt, title: it.title }));

export interface HistoryStats {
  best: number | null;
  latest: number | null;
  /** Chênh lệch trung bình các buổi gần nhất so với các buổi trước đó (null nếu chưa đủ 2 buổi). */
  trend: number | null;
}

export const historyStats = (points: HistoryPoint[]): HistoryStats => {
  if (points.length === 0) return { best: null, latest: null, trend: null };
  const scores = points.map((p) => p.score);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  let trend: number | null = null;
  if (scores.length >= 2) {
    const k = Math.min(3, Math.floor(scores.length / 2));
    trend = Math.round(avg(scores.slice(-k)) - avg(scores.slice(-2 * k, -k)));
  }
  return { best: Math.max(...scores), latest: scores[scores.length - 1], trend };
};

export const trendOf = (delta: number | null): Trend => (delta == null ? null : delta > 3 ? 'up' : delta < -3 ? 'down' : 'stable');

export type TimeRange = '7d' | '30d' | '90d' | 'all';
export const TIME_RANGES: Array<{ key: TimeRange; label: string; days: number | null }> = [
  { key: '7d', label: '7 ngày', days: 7 },
  { key: '30d', label: '30 ngày', days: 30 },
  { key: '90d', label: '3 tháng', days: 90 },
  { key: 'all', label: 'Tất cả', days: null },
];

export const filterByRange = (points: HistoryPoint[], range: TimeRange, now = Date.now()): HistoryPoint[] => {
  const days = TIME_RANGES.find((r) => r.key === range)?.days;
  if (!days) return points;
  const from = now - days * 86_400_000;
  return points.filter((p) => (p.date ? new Date(p.date).getTime() >= from : false));
};

// ---------------------------------------------------------------------------
// Bản đồ 6 kỹ năng
// ---------------------------------------------------------------------------

/** Trung bình có trọng số theo số buổi của các nguồn thuộc cùng một kỹ năng. */
const combine = (items: SkillOverview[]): { score: number | null; sessions: number } => {
  let sum = 0;
  let weight = 0;
  let sessions = 0;
  for (const it of items) {
    sessions += it.sessions;
    if (it.average_score == null) continue;
    sum += it.average_score * it.sessions;
    weight += it.sessions;
  }
  return { score: weight > 0 ? Math.round(sum / weight) : null, sessions };
};

export const buildSkillMap = (
  overview: SkillOverview[] | undefined,
  vocab: VocabStats | undefined,
  recent: FeedbackItem[] = [],
): SkillPoint[] =>
  SKILL_ORDER.map((key) => {
    const items = (overview ?? []).filter((o) => sourcesOf(key).includes(o.skill));
    const { score, sessions } = combine(items);
    const history = skillHistory(recent, key, 8);
    const trend = trendOf(historyStats(history).trend);
    const spark = history.map((h) => h.score);
    if (key === 'vocabulary' && score === null && vocab && vocab.totalWordsLearned > 0) {
      return {
        key,
        label: SKILL_LABELS[key],
        score: Math.round((vocab.masteredWords / vocab.totalWordsLearned) * 100),
        sessions: 0,
        source: `${vocab.masteredWords}/${vocab.totalWordsLearned} từ đã thuộc`,
        trend: null,
        spark: [],
      };
    }
    const srs = key === 'vocabulary' && vocab && vocab.totalWordsLearned > 0 ? ` · ${vocab.masteredWords}/${vocab.totalWordsLearned} từ đã thuộc` : '';
    return {
      key,
      label: SKILL_LABELS[key],
      score,
      sessions,
      source: sessions > 0 ? `${sessions} buổi AI chấm${srs}` : 'Chưa luyện',
      trend,
      spark,
    };
  });

/** Kỹ năng mạnh nhất / cần ưu tiên (chỉ trong các kỹ năng đã có điểm). */
export const strongestAndWeakest = (points: SkillPoint[]) => {
  const scored = points.filter((p) => p.score != null) as Array<SkillPoint & { score: number }>;
  if (scored.length === 0) return { strongest: null, weakest: null };
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  return { strongest: sorted[0], weakest: sorted.length > 1 ? sorted[sorted.length - 1] : null };
};

/** "AI Learning Score": trung bình các kỹ năng đã có điểm. */
export const overallScore = (points: SkillPoint[]): number | null => {
  const s = points.filter((p) => p.score != null).map((p) => p.score as number);
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
};

/** Độ tin cậy của đánh giá: dựa trên số buổi được chấm và số kỹ năng có dữ liệu. */
export const aiConfidence = (points: SkillPoint[]): 'high' | 'medium' | 'low' => {
  const sessions = points.reduce((a, p) => a + p.sessions, 0);
  const scored = points.filter((p) => p.score != null).length;
  if (sessions >= 15 && scored >= 4) return 'high';
  if (sessions >= 5 && scored >= 2) return 'medium';
  return 'low';
};
export const CONFIDENCE_LABEL = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' } as const;

// ---------------------------------------------------------------------------
// Chi tiết một kỹ năng
// ---------------------------------------------------------------------------

const DIMENSIONS = [
  ['vocabulary', 'Từ vựng'],
  ['grammar', 'Ngữ pháp'],
  ['pronunciation', 'Phát âm'],
  ['speaking', 'Độ trôi chảy'],
] as const;

/** Điểm thành phần trung bình (AI chấm trong từng buổi) của một kỹ năng. */
export const dimensionAverages = (items: FeedbackItem[], key: SkillKey): Array<{ label: string; score: number; count: number }> => {
  const rows = items.filter((it) => sourcesOf(key).includes(it.skill));
  return DIMENSIONS.map(([dim, label]) => {
    const scores = rows.map((r) => r.feedback?.[dim]?.score).filter((v): v is number => typeof v === 'number');
    return { label, score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : -1, count: scores.length };
  }).filter((d) => d.count > 0);
};

export interface SkillInsight {
  /** Nhận xét AI của buổi gần nhất. */
  summary: string | null;
  strengths: string[];
  /** Lỗi / điểm cần cải thiện gặp nhiều nhất, kèm số lần. */
  mistakes: Array<{ text: string; count: number }>;
  advice: string[];
}

export const skillInsight = (items: FeedbackItem[], key: SkillKey): SkillInsight => {
  const rows = items
    .filter((it) => sourcesOf(key).includes(it.skill))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const uniq = (xs: string[], n: number) => Array.from(new Set(xs.map((x) => x.trim()).filter(Boolean))).slice(0, n);
  const counts = new Map<string, number>();
  for (const r of rows) for (const m of r.feedback?.improvements_vi ?? []) counts.set(m.trim(), (counts.get(m.trim()) ?? 0) + 1);
  return {
    summary: rows.find((r) => r.feedback?.summary_vi)?.feedback.summary_vi ?? null,
    strengths: uniq(rows.flatMap((r) => r.feedback?.strengths_vi ?? []), 3),
    mistakes: [...counts.entries()]
      .filter(([t]) => t)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([text, count]) => ({ text, count })),
    advice: uniq(rows.flatMap((r) => r.feedback?.advice_vi ?? []), 3),
  };
};
