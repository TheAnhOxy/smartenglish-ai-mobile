import { apiClient } from '@/src/core/api/client';

export type PracticeSkill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'ROLEPLAY' | 'GRAMMAR' | 'VOCABULARY' | 'QUIZ';

export interface FeedbackDimension {
  score: number | null;
  comment_vi: string;
  words_to_review?: string[];
}

export interface SessionFeedback {
  overall_score: number | null;
  summary_vi: string;
  vocabulary: FeedbackDimension | null;
  pronunciation: FeedbackDimension | null;
  speaking: FeedbackDimension | null;
  grammar: FeedbackDimension | null;
  strengths_vi: string[];
  improvements_vi: string[];
  advice_vi: string[];
}

export interface FeedbackItem {
  id: number;
  skill: PracticeSkill;
  skillLabel: string;
  title: string;
  overallScore: number | null;
  createdAt: string | null;
  feedback: SessionFeedback;
}

export interface SkillOverview {
  skill: PracticeSkill;
  label: string;
  sessions: number;
  average_score: number | null;
  last_practiced_at: string | null;
  latest_advice_vi: string[];
}

export interface FeedbackOverview {
  totalSessions: number;
  skills: SkillOverview[];
  coach: { summary_vi: string; focus_vi: string[]; plan_vi: string[] } | null;
  recent: FeedbackItem[];
}

export interface SessionFeedbackInput {
  skill: PracticeSkill;
  title: string;
  /** Điểm buổi luyện 0–100 nếu có. */
  score?: number | null;
  cefrLevel?: string | null;
  /** Mã buổi luyện (attemptId, sessionId...) để không nhận xét trùng. */
  sourceId?: string | null;
  /** Tóm tắt buổi luyện cho AI: câu sai, transcript, điểm thành phần... */
  details: string;
}

const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const toDimension = (v: unknown): FeedbackDimension | null => {
  if (!v || typeof v !== 'object') return null;
  const d = v as Record<string, unknown>;
  return {
    score: typeof d.score === 'number' ? d.score : null,
    comment_vi: typeof d.comment_vi === 'string' ? d.comment_vi : '',
    words_to_review: strList(d.words_to_review),
  };
};

export const toSessionFeedback = (v: unknown): SessionFeedback => {
  const d = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    overall_score: typeof d.overall_score === 'number' ? d.overall_score : null,
    summary_vi: typeof d.summary_vi === 'string' ? d.summary_vi : '',
    vocabulary: toDimension(d.vocabulary),
    pronunciation: toDimension(d.pronunciation),
    speaking: toDimension(d.speaking),
    grammar: toDimension(d.grammar),
    strengths_vi: strList(d.strengths_vi),
    improvements_vi: strList(d.improvements_vi),
    advice_vi: strList(d.advice_vi),
  };
};

export const toFeedbackItem = (v: unknown): FeedbackItem => {
  const d = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    id: Number(d.id) || 0,
    skill: (d.skill as PracticeSkill) || 'QUIZ',
    skillLabel: typeof d.skillLabel === 'string' ? d.skillLabel : '',
    title: typeof d.title === 'string' ? d.title : '',
    overallScore: typeof d.overallScore === 'number' ? d.overallScore : null,
    createdAt: typeof d.createdAt === 'string' ? d.createdAt : null,
    feedback: toSessionFeedback(d.feedback),
  };
};

/** Cắt bớt chi tiết để vừa giới hạn server (8000 ký tự). */
export const clampDetails = (text: string, max = 7500): string => (text.length > max ? `${text.slice(0, max)}…` : text);

export const submitSessionFeedbackApi = async (input: SessionFeedbackInput): Promise<FeedbackItem> => {
  const response = await apiClient.post('/api/v1/ai-practice/feedback/session', {
    skill: input.skill,
    title: input.title.slice(0, 200),
    score: input.score == null || Number.isNaN(input.score) ? null : Math.max(0, Math.min(100, input.score)),
    cefrLevel: input.cefrLevel ?? null,
    sourceId: input.sourceId ?? null,
    details: clampDetails(input.details),
  });
  return toFeedbackItem(response.data?.data ?? response.data);
};

export const fetchFeedbackOverviewApi = async (): Promise<FeedbackOverview> => {
  const response = await apiClient.get('/api/v1/ai-practice/feedback/overview');
  const d = (response.data?.data ?? response.data ?? {}) as Record<string, unknown>;
  const coach = d.coach && typeof d.coach === 'object' ? (d.coach as Record<string, unknown>) : null;
  return {
    totalSessions: Number(d.totalSessions) || 0,
    skills: (Array.isArray(d.skills) ? d.skills : []).map((s: Record<string, unknown>) => ({
      skill: s.skill as PracticeSkill,
      label: String(s.label ?? s.skill ?? ''),
      sessions: Number(s.sessions) || 0,
      average_score: typeof s.average_score === 'number' ? s.average_score : null,
      last_practiced_at: typeof s.last_practiced_at === 'string' ? s.last_practiced_at : null,
      latest_advice_vi: strList(s.latest_advice_vi),
    })),
    coach: coach
      ? { summary_vi: String(coach.summary_vi ?? ''), focus_vi: strList(coach.focus_vi), plan_vi: strList(coach.plan_vi) }
      : null,
    recent: dedupeRecent((Array.isArray(d.recent) ? d.recent : []).map(toFeedbackItem)),
  };
};

/**
 * Một bài được nhận xét nhiều lần (dữ liệu cũ) hiện thành nhiều dòng giống hệt nhau:
 * gộp các dòng cùng kỹ năng + tên + điểm + ngày, giữ dòng mới nhất.
 */
export const dedupeRecent = (items: FeedbackItem[]): FeedbackItem[] => {
  const seen = new Set<string>();
  return items.filter((it) => {
    const key = [it.skill, it.title, it.overallScore ?? '', (it.createdAt ?? '').slice(0, 10)].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Các buổi luyện gần nhất (đã gộp trùng) — dùng cho biểu đồ chi tiết từng kỹ năng. */
export const fetchRecentFeedbackApi = async (limit = 50): Promise<FeedbackItem[]> => {
  const response = await apiClient.get(`/api/v1/ai-practice/feedback/recent?limit=${limit}`);
  const d = response.data?.data ?? response.data;
  return dedupeRecent((Array.isArray(d) ? d : []).map(toFeedbackItem));
};
