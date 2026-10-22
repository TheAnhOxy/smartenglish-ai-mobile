import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface DailyStudyPoint {
  dayLabel: string; // "T2", "T3", etc.
  dateStr: string;
  minutes: number;
  isToday: boolean;
}

export interface StudentProgressData {
  totalStudyMinutes: number;
  weeklyMinutes: number;
  streakDays: number;
  totalWordsLearned: number;
  masteredWords: number;
  lessonsCompleted: number;
  totalQuizCount: number;
  quizAccuracyPct: number;
  avgResponseTimeSec: number;
  weeklyChart: DailyStudyPoint[];
  skillRadarScores: {
    vocabulary: number;
    grammar: number;
    listening: number;
    speaking: number;
    reading: number;
  };
}

export interface WeakVocabularyItem {
  word: string;
  meaning: string;
  lapsesCount: number;
  example: string;
}

export interface WeaknessDetail {
  id: string;
  category: string;
  ruleName: string;
  description: string;
  mistakeCount: number;
  sampleMistake: string;
  correctiveRule: string;
}

export interface RemedialQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetTopic: string;
}

export interface StudentAssessmentData {
  overallMasteryScore: number;
  levelClassification: string;
  summaryInsight: string;
  completedLessonsCount: number;
  vocabularyReviewedCount: number;
  totalMistakesRecorded: number;
  weakVocabulary: WeakVocabularyItem[];
  weaknesses: WeaknessDetail[];
  strengths: string[];
  remedialQuizzes: RemedialQuiz[];
}

export interface LeaderboardMember {
  userId: number;
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  weeklyXp: number;
  totalXp: number;
  streak: number;
  level: number;
  isMe: boolean;
  trend: 'up' | 'down' | 'same';
  delta: string;
}

export interface LeaderboardData {
  leagueName: string;
  weekNumber: number;
  userRank: number;
  userWeeklyXp: number;
  rankList: LeaderboardMember[];
}

export const fetchProgressStatsApi = async (userId?: string): Promise<StudentProgressData> => {
  const uid = userId || getCurrentUserId();
  try {
    const res = await apiClient.get<any>(`/api/v1/learning/analytics/progress?userId=${uid}`);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        totalStudyMinutes: data.totalStudyMinutes ?? 0,
        weeklyMinutes: data.weeklyMinutes ?? 0,
        streakDays: data.streakDays ?? 0,
        totalWordsLearned: data.totalWordsLearned ?? 0,
        masteredWords: data.masteredWords ?? 0,
        lessonsCompleted: data.lessonsCompleted ?? 0,
        totalQuizCount: data.totalQuizCount ?? 0,
        quizAccuracyPct: data.quizAccuracyPct ?? 0,
        avgResponseTimeSec: data.avgResponseTimeSec ?? 0,
        weeklyChart: data.weeklyChart || [],
        skillRadarScores: data.skillRadarScores || {
          vocabulary: 0,
          grammar: 0,
          listening: 0,
          speaking: 0,
          reading: 0,
        },
      };
    }
  } catch (err) {
    console.warn('[AnalyticsApi] fetchProgressStatsApi failed:', err);
  }

  return {
    totalStudyMinutes: 0,
    weeklyMinutes: 0,
    streakDays: 0,
    totalWordsLearned: 0,
    masteredWords: 0,
    lessonsCompleted: 0,
    totalQuizCount: 0,
    quizAccuracyPct: 0,
    avgResponseTimeSec: 0,
    weeklyChart: [
      { dayLabel: 'T2', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'T3', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'T4', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'T5', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'T6', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'T7', dateStr: '', minutes: 0, isToday: false },
      { dayLabel: 'CN', dateStr: '', minutes: 0, isToday: false },
    ],
    skillRadarScores: { vocabulary: 0, grammar: 0, listening: 0, speaking: 0, reading: 0 },
  };
};

export const fetchAiAssessmentApi = async (userId?: string): Promise<StudentAssessmentData> => {
  const uid = userId || getCurrentUserId();
  try {
    const res = await apiClient.get<any>(`/api/v1/learning/analytics/assessment?userId=${uid}`);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        overallMasteryScore: data.overallMasteryScore ?? 0,
        levelClassification: data.levelClassification ?? 'A1 - Mới bắt đầu',
        summaryInsight: data.summaryInsight ?? '',
        completedLessonsCount: data.completedLessonsCount ?? 0,
        vocabularyReviewedCount: data.vocabularyReviewedCount ?? 0,
        totalMistakesRecorded: data.totalMistakesRecorded ?? 0,
        weakVocabulary: data.weakVocabulary || [],
        weaknesses: data.weaknesses || [],
        strengths: data.strengths || [],
        remedialQuizzes: data.remedialQuizzes || [],
      };
    }
  } catch (err) {
    console.warn('[AnalyticsApi] fetchAiAssessmentApi failed:', err);
  }

  return {
    overallMasteryScore: 0,
    levelClassification: 'A1 - Mới bắt đầu',
    summaryInsight: 'Chưa có dữ liệu đánh giá học lực.',
    completedLessonsCount: 0,
    vocabularyReviewedCount: 0,
    totalMistakesRecorded: 0,
    weakVocabulary: [],
    weaknesses: [],
    strengths: [],
    remedialQuizzes: [],
  };
};

export const fetchLeaderboardApi = async (
  type: 'global' | 'friends' = 'global',
  userId?: string
): Promise<LeaderboardData> => {
  const uid = userId || getCurrentUserId();
  try {
    const res = await apiClient.get<any>(
      `/api/v1/learning/gamification/leaderboard?userId=${uid}&type=${type}`
    );
    const data = res.data?.data || res.data;
    if (data) {
      return {
        leagueName: data.leagueName || 'Bảng Xếp Hạng',
        weekNumber: data.weekNumber || 1,
        userRank: data.userRank || 0,
        userWeeklyXp: data.userWeeklyXp || 0,
        rankList: data.rankList || [],
      };
    }
  } catch (err) {
    console.warn('[AnalyticsApi] fetchLeaderboardApi failed:', err);
  }

  return {
    leagueName: 'Bảng Xếp Hạng',
    weekNumber: 1,
    userRank: 0,
    userWeeklyXp: 0,
    rankList: [],
  };
};
