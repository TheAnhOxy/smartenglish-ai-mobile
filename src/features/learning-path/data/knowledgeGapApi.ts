import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface SkillGapItem {
  id: string;
  category: string;
  name: string;
  masteryLevel: 1 | 2 | 3 | 4 | 5;
  wrongCount: number;
  wrongWords: string[];
}

export interface LessonDetailData {
  id: string;
  unitId: string;
  chapterId: string;
  titleVi: string;
  titleEn: string;
  chapterTitleVi: string;
  cefrLevel: string;
  xpReward: number;
  estimatedMin: number;
  isCompleted: boolean;
  summaryVi?: string;
  grammarNotes?: Array<{
    title: string;
    formula?: string;
    explanation: string;
    examples?: Array<{ en: string; vi: string }>;
  }>;
  vocabularyList?: Array<{
    word: string;
    ipa: string;
    pos: string;
    meaningVi: string;
    exampleEn?: string;
    exampleVi?: string;
  }>;
  dialogues?: Array<{
    speaker: string;
    textEn: string;
    textVi: string;
  }>;
  practiceQuestions?: Array<{
    id: number;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanationVi: string;
  }>;
}

export interface LessonCompletionResult {
  lessonId: string;
  isCompleted: boolean;
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  coinsEarned: number;
  streakCurrent: number;
  congratulationMessage: string;
}

export const MOCK_KNOWLEDGE_GAPS: SkillGapItem[] = [
  { id: 'kg-1', category: 'Ngữ Pháp', name: 'Thì Hiện Tại Hoàn Thành', masteryLevel: 2, wrongCount: 4, wrongWords: ['since/for usage', 'already vs yet'] },
  { id: 'kg-2', category: 'Ngữ Pháp', name: 'Mệnh Đề Quan Hệ', masteryLevel: 1, wrongCount: 6, wrongWords: ['whose', 'whom'] },
  { id: 'kg-3', category: 'Từ Vựng', name: 'Từ Vựng Hợp Đồng Doanh Nghiệp', masteryLevel: 3, wrongCount: 2, wrongWords: ['negotiation', 'agreement'] },
  { id: 'kg-4', category: 'Phát Âm', name: 'Trọng Âm Từ & Ngữ Điệu', masteryLevel: 2, wrongCount: 5, wrongWords: ['stress placement'] },
  { id: 'kg-5', category: 'Đọc Hiểu', name: 'Đọc Hiểu Bài Văn Ngắn', masteryLevel: 4, wrongCount: 1, wrongWords: [] }
];

export const fetchKnowledgeGapsApi = async (userId?: string): Promise<SkillGapItem[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/path/skills-analysis?userId=${uid}`);
    const data = response.data?.data || response.data;
    if (data && data.weakSkills) {
      return [
        { id: 'kg-1', category: 'Ngữ Pháp', name: 'Ngữ Thì Nâng Cao', masteryLevel: 2, wrongCount: 4, wrongWords: data.weakSkills },
        { id: 'kg-2', category: 'Phát Âm', name: 'Trọng Âm & Ngữ Điệu', masteryLevel: 2, wrongCount: 3, wrongWords: ['Intonation'] },
        { id: 'kg-3', category: 'Từ Vựng', name: 'Từ Vựng Chủ Đề Công Việc', masteryLevel: 4, wrongCount: 1, wrongWords: data.strongSkills || [] }
      ];
    }
  } catch (err) {
    console.warn('Real Knowledge Gap API error, returning fallback gaps:', err);
  }
  return MOCK_KNOWLEDGE_GAPS;
};

export const fetchLearningPathRoadmapApi = async (userId?: string) => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/path?userId=${uid}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('Real Learning Path API error:', err);
    return [];
  }
};

export const fetchLessonDetailApi = async (lessonId: string, userId?: string): Promise<LessonDetailData | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/path/lessons/${lessonId}?userId=${uid}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[fetchLessonDetailApi] Error:', err);
    return null;
  }
};

export const completeLessonApi = async (lessonId: string, userId?: string): Promise<LessonCompletionResult | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/path/lessons/${lessonId}/complete?userId=${uid}`, {});
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[completeLessonApi] Error:', err);
    return null;
  }
};
