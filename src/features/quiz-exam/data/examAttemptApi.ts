import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { fetchPublishedExamDetailApi } from './examCatalogApi';
import { Platform } from 'react-native';

export type ExamPart = `PART_${number}`;
export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export interface ExamOption {
  key: AnswerKey;
  label: string;
  subLabel?: string;
  translationVi?: string;
}

export interface ExamPassage {
  title: string;
  type: 'email' | 'article' | 'memo' | 'notice' | 'advertisement';
  emailHeaders?: { from: string; to: string; date: string; subject: string };
  paragraphs: string[];
}

export interface ExamQuestion {
  id: string;
  part: ExamPart;
  partLabel: string;
  partSubTitle: string;
  questionNumber: number;
  totalQuestions: number;
  imageUrl?: string;
  imageTag?: string;
  audioUrl?: string;
  audioTitle?: string;
  audioDurationSec?: number;
  audioNotice?: string;
  groupTag?: string;
  groupQuestionNumbers?: number[];
  passage?: ExamPassage;
  instructionPrompt?: string;
  instructionSub?: string;
  questionText: string;
  categoryTag?: string;
  hasTts?: boolean;
  options: ExamOption[];
  correctAnswer?: AnswerKey;
  audioScript?: string;
  explanationVi?: string;
  selectedAnswer?: AnswerKey;
  isCorrect?: boolean;
}

export interface ExamAttemptSession {
  attemptId: number;
  examId: number;
  title: string;
  description?: string;
  category: string;
  cefrLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  xpReward: number;
  status: string;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  sections: Record<string, unknown>[];
  questions: ExamQuestion[];
  answers: Record<string, AnswerKey>;
  bookmarks: string[];
}

export interface ExamAttemptResult {
  attemptId: number;
  examId: number;
  title: string;
  category: string;
  cefrLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  scorePercentage: number;
  displayScore: number;
  maximumScore: number;
  scoringType: 'TOEIC_ESTIMATED' | 'PERCENTAGE';
  listeningScore?: number;
  readingScore?: number;
  passed: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  xpEarned: number;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt: string;
  questions: ExamQuestion[];
}

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;
const requireUserId = () => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Bạn cần đăng nhập để làm bài kiểm tra');
  return userId;
};

const toPart = (raw: any): ExamPart => {
  const text = String(raw ?? '1').toUpperCase();
  return (text.startsWith('PART_') ? text : `PART_${text.replace(/\D/g, '') || '1'}`) as ExamPart;
};

const normalizeOptions = (raw: any): ExamOption[] =>
  (Array.isArray(raw) ? raw : []).map((option: any, index: number) => {
    const defaultKey = String.fromCharCode(65 + index);
    const candidateId = typeof option?.id === 'string' && ['A', 'B', 'C', 'D'].includes(option.id.toUpperCase()) ? option.id : '';
    const rawKey = String(option?.key || candidateId || defaultKey).toUpperCase() as AnswerKey;
    const textVal = String(option?.text ?? option?.content ?? '').trim();
    const labelVal = String(option?.label ?? '').trim();
    const resolvedLabel = (textVal && textVal.toUpperCase() !== rawKey)
      ? textVal
      : (labelVal && labelVal.toUpperCase() !== rawKey
          ? labelVal
          : (textVal || labelVal || rawKey));
    return {
      key: rawKey,
      label: resolvedLabel,
      subLabel: option?.subLabel ? String(option.subLabel) : undefined,
      translationVi: option?.translationVi
        ? String(option.translationVi)
        : option?.textVi
          ? String(option.textVi)
          : option?.meaningVi
            ? String(option.meaningVi)
            : option?.translation
              ? String(option.translation)
              : option?.subLabel
                ? String(option.subLabel)
                : undefined,
    };
  });

export const normalizeQuestion = (raw: any, index: number, total: number, category: string, sections: any[] = []): ExamQuestion => {
  const part = toPart(raw?.part);
  const partNumber = Number(String(part).replace('PART_', '')) || 1;
  const section = sections.find((item: any) => Number(item?.partNumber) === partNumber);
  const isToeic = category === 'TOEIC_FULL' || category === 'TOEIC_MINI';
  const sectionName = String(raw?.sectionName ?? section?.sectionName ?? (isToeic ? (partNumber <= 4 ? 'Listening' : 'Reading') : category));
  const passageText = raw?.passageText ? String(raw.passageText) : '';
  return {
    ...raw,
    id: String(raw?.questionId ?? raw?.id ?? index + 1),
    part,
    partLabel: String(raw?.partLabel ?? (isToeic ? `${sectionName} · Part ${partNumber}` : sectionName)),
    partSubTitle: String(raw?.partSubTitle ?? raw?.sectionTitle ?? section?.title ?? `Phần ${partNumber}`),
    questionNumber: Number(raw?.questionNumber ?? index + 1),
    totalQuestions: total,
    questionText: String(raw?.questionText ?? ''),
    options: normalizeOptions(raw?.options),
    imageUrl: raw?.imageUrl || undefined,
    audioUrl: raw?.audioUrl || undefined,
    audioTitle: raw?.audioTitle || (raw?.audioUrl ? `Audio câu ${raw?.questionNumber ?? index + 1}` : undefined),
    instructionPrompt: raw?.instructionPrompt || raw?.instructions || section?.instructions || undefined,
    explanationVi: raw?.explanationVi ?? raw?.explanation,
    passage: raw?.passage ?? (passageText ? { title: 'Đoạn văn', type: 'article', paragraphs: [passageText] } : undefined),
  };
};

export const normalizeSession = (raw: any): ExamAttemptSession => {
  const snapshot = raw?.examSnapshot || {};
  const rawQuestions = (Array.isArray(raw?.questions) && raw.questions.length > 0)
    ? raw.questions
    : (Array.isArray(snapshot?.questions) && snapshot.questions.length > 0
      ? snapshot.questions
      : []);
  const sections = Array.isArray(raw?.sections) ? raw.sections : (Array.isArray(snapshot?.sections) ? snapshot.sections : []);
  const total = rawQuestions.length || Number(raw?.totalQuestions ?? snapshot?.totalQuestions ?? 0);
  const category = raw?.category || snapshot?.category || 'GENERAL';
  const title = raw?.title || snapshot?.title || 'Bài kiểm tra';
  return {
    ...raw,
    title,
    category,
    attemptId: Number(raw.attemptId),
    examId: Number(raw.examId),
    durationMinutes: Number(raw.durationMinutes ?? snapshot.durationMinutes ?? 0),
    totalQuestions: total,
    passingScore: Number(raw.passingScore ?? snapshot.passingScore ?? 0),
    xpReward: Number(raw.xpReward ?? snapshot.xpReward ?? 0),
    remainingSeconds: Number(raw.remainingSeconds ?? 0),
    sections,
    questions: rawQuestions.map((q: any, i: number) => normalizeQuestion(q, i, total, category, sections)),
    answers: raw.answers ?? {},
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks.map(String) : [],
  };
};

export async function startExamAttemptApi(examId: number): Promise<ExamAttemptSession> {
  const response = await apiClient.post(`/api/v1/learning/exams/${examId}/start`, null, { params: { userId: requireUserId() } });
  const raw = unwrap<any>(response.data);
  let session = normalizeSession(raw);
  if ((!session.questions || session.questions.length === 0) && examId) {
    try {
      const detail = await fetchPublishedExamDetailApi(examId);
      if (detail.questions && detail.questions.length > 0) {
        session = normalizeSession({
          ...raw,
          questions: detail.questions,
          sections: detail.sections,
          title: detail.title || session.title,
          category: detail.category || session.category,
          durationMinutes: detail.durationMinutes || session.durationMinutes,
        });
      }
    } catch (err) {
      console.warn('Failed to fallback load questions from exam detail:', err);
    }
  }
  return session;
}

export async function fetchExamAttemptApi(attemptId: number): Promise<ExamAttemptSession> {
  const response = await apiClient.get(`/api/v1/learning/exams/attempts/${attemptId}`, { params: { userId: requireUserId() } });
  const raw = unwrap<any>(response.data);
  let session = normalizeSession(raw);
  const examId = raw?.examId || session?.examId;
  if ((!session.questions || session.questions.length === 0) && examId) {
    try {
      const detail = await fetchPublishedExamDetailApi(examId);
      if (detail.questions && detail.questions.length > 0) {
        session = normalizeSession({
          ...raw,
          questions: detail.questions,
          sections: detail.sections,
          title: detail.title || session.title,
          category: detail.category || session.category,
          durationMinutes: detail.durationMinutes || session.durationMinutes,
        });
      }
    } catch (err) {
      console.warn('Failed to fallback load questions from exam detail:', err);
    }
  }
  return session;
}

export async function saveExamAnswerApi(attemptId: number, questionId: string, selectedAnswer?: AnswerKey, bookmarked?: boolean) {
  try {
    await apiClient.put(
      `/api/v1/learning/exams/attempts/${attemptId}/answers`,
      { questionId, selectedAnswer, bookmarked },
      { params: { userId: requireUserId() } }
    );
  } catch (err) {
    // Non-critical: fail silently so the user experience is not interrupted
    console.warn('[saveExamAnswerApi] Failed to persist answer:', err);
  }
  return null;
}

export async function submitExamAttemptApi(attemptId: number, answers: Record<string, AnswerKey>, timeSpentSeconds: number): Promise<ExamAttemptResult> {
  const response = await apiClient.post(`/api/v1/learning/exams/attempts/${attemptId}/submit`,
    { answers, timeSpentSeconds, platform: Platform.OS.toUpperCase() }, { params: { userId: requireUserId() } });
  const raw = unwrap<any>(response.data);
  let result = normalizeResult(raw);
  const examId = raw?.examId || result?.examId;
  if ((!result.questions || result.questions.length === 0) && examId) {
    try {
      const detail = await fetchPublishedExamDetailApi(examId);
      if (detail.questions && detail.questions.length > 0) {
        result = normalizeResult({
          ...raw,
          questions: detail.questions,
          sections: detail.sections,
          title: detail.title || result.title,
          category: detail.category || result.category,
          durationMinutes: detail.durationMinutes || result.durationMinutes,
        });
      }
    } catch (err) {
      console.warn('Failed to fallback load questions from exam detail for submit:', err);
    }
  }
  return result;
}

export async function fetchExamResultApi(attemptId: number): Promise<ExamAttemptResult> {
  const response = await apiClient.get(`/api/v1/learning/exams/attempts/${attemptId}`, { params: { userId: requireUserId() } });
  const raw = unwrap<any>(response.data);
  let result = normalizeResult(raw);
  const examId = raw?.examId || result?.examId;
  if ((!result.questions || result.questions.length === 0) && examId) {
    try {
      const detail = await fetchPublishedExamDetailApi(examId);
      if (detail.questions && detail.questions.length > 0) {
        result = normalizeResult({
          ...raw,
          questions: detail.questions,
          sections: detail.sections,
          title: detail.title || result.title,
          category: detail.category || result.category,
          durationMinutes: detail.durationMinutes || result.durationMinutes,
        });
      }
    } catch (err) {
      console.warn('Failed to fallback load questions from exam detail for result:', err);
    }
  }
  return result;
}

export async function fetchUserExamHistoryApi(examId?: number): Promise<ExamAttemptResult[]> {
  const url = examId ? `/api/v1/learning/exams/${examId}/history` : `/api/v1/learning/exams/history`;
  const response = await apiClient.get(url, { params: { userId: requireUserId(), size: 20 } });
  const rawData = unwrap<any>(response.data);
  const items = Array.isArray(rawData?.content) ? rawData.content : (Array.isArray(rawData) ? rawData : []);
  return items.map(normalizeResult);
}

const normalizeResult = (raw: any): ExamAttemptResult => {
  const snapshot = raw?.examSnapshot || {};
  const rawQuestions = (Array.isArray(raw?.questions) && raw.questions.length > 0)
    ? raw.questions
    : (Array.isArray(snapshot?.questions) && snapshot.questions.length > 0
      ? snapshot.questions
      : []);
  const sections = Array.isArray(raw?.sections) ? raw.sections : (Array.isArray(snapshot?.sections) ? snapshot.sections : []);
  const correctAnswers = Number(raw.correctAnswers ?? 0);
  const wrongAnswers = Number(raw.wrongAnswers ?? 0);
  const unanswered = Number(raw.unanswered ?? 0);
  const answeredCount = correctAnswers + wrongAnswers;
  const resultCount = answeredCount + unanswered;
  const total = rawQuestions.length || Number(raw?.totalQuestions ?? snapshot?.totalQuestions ?? (resultCount > 0 ? resultCount : 0));
  const category = String(raw?.category || snapshot?.category || 'GENERAL').toUpperCase();
  const title = raw?.title || snapshot?.title || 'Kết quả bài thi';
  const isToeic = category.startsWith('TOEIC');

  const scoredTotal = rawQuestions.length > 0 ? rawQuestions.length : (answeredCount > 0 ? answeredCount : total);
  const derivedPercentage = scoredTotal > 0 ? (correctAnswers / scoredTotal) * 100 : 0;
  const scorePercentage = (raw.scorePercentage != null && Number(raw.scorePercentage) > 0)
    ? Number(raw.scorePercentage)
    : derivedPercentage;
  const rawPassing = Number(raw.passingScore ?? snapshot.passingScore ?? 0);
  const passingScore = rawPassing > 0 ? rawPassing : (isToeic ? 450 : 50);
  const answerMap = raw?.answers && typeof raw.answers === 'object' ? raw.answers : {};
  const normalizedQuestions = rawQuestions.map((q: any, i: number) => {
    const normalized = normalizeQuestion(q, i, total, category, sections);
    const selectedAnswer = q?.selectedAnswer
      ?? answerMap[normalized.id]
      ?? answerMap[String(normalized.questionNumber)]
      ?? answerMap[`q${normalized.questionNumber}`];
    return {
      ...normalized,
      selectedAnswer,
      isCorrect: selectedAnswer != null && normalized.correctAnswer != null
        ? String(selectedAnswer).toUpperCase() === String(normalized.correctAnswer).toUpperCase()
        : false,
    };
  });

  const displayScore = isToeic
    ? Number(raw.displayScore ?? raw.totalScore ?? 0)
    : Math.round(derivedPercentage);
  const maximumScore = isToeic ? 990 : 100;
  const scoringType = isToeic ? 'TOEIC_ESTIMATED' : 'PERCENTAGE';
  const passed = raw.passed !== undefined && raw.passed !== null
    ? Boolean(raw.passed)
    : (isToeic ? displayScore >= passingScore : scorePercentage >= passingScore);

  return {
    ...raw,
    title,
    category,
    attemptId: Number(raw.attemptId),
    examId: Number(raw.examId),
    cefrLevel: String(raw.cefrLevel ?? snapshot.cefrLevel ?? ''),
    totalQuestions: total,
    durationMinutes: Number(raw.durationMinutes ?? snapshot.durationMinutes ?? 0),
    passingScore,
    scorePercentage,
    displayScore,
    maximumScore,
    scoringType,
    passed,
    correctAnswers,
    wrongAnswers,
    unanswered,
    xpEarned: Number(raw.xpEarned ?? 0),
    timeSpentSeconds: Number(raw.timeSpentSeconds ?? 0),
    questions: normalizedQuestions,
  };
};

