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
  videos?: Array<{
    type?: string;
    title: string;
    videoUrl: string;
    isR2?: boolean;
    fileName?: string;
    fileSize?: string;
    durationSeconds?: number;
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

export const fetchKnowledgeGapsApi = async (userId?: string): Promise<SkillGapItem[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/learning/path/skills-analysis');
    const data = response.data?.data || response.data;
    if (data && data.hasSufficientData && Array.isArray(data.weakSkills) && data.weakSkills.length > 0) {
      return data.weakSkills.map((skillName: string, idx: number) => {
        const categoryMatch = skillName.match(/\((.*?)\)/);
        const category = categoryMatch ? categoryMatch[1].trim() : 'Kỹ năng';
        return {
          id: `gap-${idx + 1}`,
          category,
          name: skillName,
          masteryLevel: 2 as const,
          wrongCount: 1,
          wrongWords: [],
        };
      });
    }
    return [];
  } catch (err) {
    console.warn('[knowledgeGapApi] fetchKnowledgeGapsApi error:', err);
    throw err;
  }
};

export const isSystemCourse = (item: any): boolean => {
  if (!item) return false;
  const source = String(item.source || item.ownership || '').toUpperCase();
  if (source === 'TEACHER') {
    return false;
  }
  if (source === 'SYSTEM') {
    return true;
  }
  if (item.createdBy && Number(item.createdBy) > 1) {
    return false;
  }
  if (item.created_by && Number(item.created_by) > 1) {
    return false;
  }
  return true;
};

let memoryRoadmapCache: { data: any[]; timestamp: number; userId: string } | null = null;
const ROADMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchLearningPathRoadmapApi = async (userId?: string, forceRefresh = false) => {
  const uid = userId || getCurrentUserId();
  if (!forceRefresh && memoryRoadmapCache && memoryRoadmapCache.userId === (uid || '') && Date.now() - memoryRoadmapCache.timestamp < ROADMAP_CACHE_TTL) {
    return memoryRoadmapCache.data;
  }
  try {
    const response = await apiClient.get<any>('/api/v1/learning/path');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      // Chỉ giữ lại khóa học của hệ thống
      const systemMilestones = data.filter(isSystemCourse);
      memoryRoadmapCache = { data: systemMilestones, timestamp: Date.now(), userId: uid || '' };
      return systemMilestones;
    }
  } catch (err) {
    console.warn('[LearningPath] Real Learning Path API error, trying direct content tree fallback:', err);
  }

  // Fallback direct to content-service courses tree if learning-service is unavailable
  try {
    const fallbackRes = await apiClient.get<any>('/api/v1/content/courses/tree');
    const courses = fallbackRes.data?.data || fallbackRes.data;
    if (Array.isArray(courses)) {
      // Chỉ lấy khóa học của hệ thống
      const systemCourses = courses.filter(isSystemCourse);
      return systemCourses.map((c: any, cIdx: number) => ({
        id: `course-${c.id}`,
        chapterNumber: cIdx + 1,
        titleVi: c.titleVi,
        titleEn: c.titleEn,
        descriptionVi: c.descriptionVi,
        isPremium: Boolean(c.isPremium),
        source: c.source || 'SYSTEM',
        ownership: c.ownership || 'SYSTEM',
        createdBy: c.createdBy,
        units: (c.lessons || []).map((l: any, lIdx: number) => ({
          id: String(l.id),
          unitNumber: l.position || lIdx + 1,
          titleVi: l.titleVi,
          titleEn: l.titleEn,
          descriptionVi: l.titleVi,
          isPremium: !l.isFreePreview,
          status: lIdx === 0 ? 'current' : 'unlocked',
          iconType: !l.isFreePreview ? 'crown' : ['star', 'grad', 'book', 'speech'][lIdx % 4],
          totalLessons: 1,
          completedLessons: 0,
          xpReward: l.xpReward || 30,
          lessonIds: [String(l.id)],
        })),
      }));
    }
  } catch (treeErr) {
    console.warn('[LearningPath] Content tree fallback failed:', treeErr);
    throw treeErr;
  }

  return [];
};

export const fetchLessonDetailApi = async (lessonId: string, userId?: string): Promise<LessonDetailData | null> => {
  const uid = userId || getCurrentUserId();
  const cleanId = lessonId.replace(/^[^\d]*/, '') || lessonId;
  try {
    const response = await apiClient.get<any>(`/api/v1/learning/path/lessons/${cleanId}`);
    const data = response.data?.data || response.data;
    if (data && (
      (data.vocabularyList && data.vocabularyList.length > 0) ||
      (data.grammarNotes && data.grammarNotes.length > 0) ||
      (data.dialogues && data.dialogues.length > 0) ||
      (data.practiceQuestions && data.practiceQuestions.length > 0) ||
      (data.videos && data.videos.length > 0)
    )) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchLessonDetailApi] Learning path API error, fallback to content service:', err);
  }

  // Fallback direct to content-service lesson detail
  try {
    if (cleanId) {
      const contentRes = await apiClient.get<any>(`/api/v1/content/lessons/${cleanId}`);
      const l = contentRes.data?.data || contentRes.data;
      if (l) {
        let blocks: any[] = [];
        if (Array.isArray(l.contentBlocks)) {
          blocks = l.contentBlocks;
        } else if (typeof l.contentBlocks === 'string' && l.contentBlocks.trim().length > 0) {
          try {
            blocks = JSON.parse(l.contentBlocks);
          } catch (e) {
            console.warn('Failed to parse contentBlocks string:', e);
          }
        }

        const vocabBlock = blocks.find((b) => b.type === 'vocabulary');
        const grammarBlock = blocks.find((b) => b.type === 'theory' || b.type === 'grammar');
        const dialogueBlock = blocks.find((b) => b.type === 'dialogue');
        const quizBlock = blocks.find((b) => b.type === 'quiz');
        const videoBlocks = blocks.filter((b) => b.type === 'video');

        return {
          id: String(l.id),
          unitId: String(l.id),
          chapterId: String(l.courseId || 1),
          titleVi: l.titleVi,
          titleEn: l.titleEn,
          chapterTitleVi: l.courseTitleVi || `Chương ${l.courseId || 1}`,
          cefrLevel: 'A1',
          xpReward: l.xpReward || 30,
          estimatedMin: l.estimatedMin || 10,
          isCompleted: false,
          summaryVi: grammarBlock?.content || l.titleVi,
          videos: videoBlocks.map((v) => ({
            type: 'video',
            title: v.title || 'Video bài học',
            videoUrl: v.videoUrl,
            isR2: Boolean(v.isR2),
            fileName: v.fileName,
            fileSize: v.fileSize,
            durationSeconds: v.durationSeconds,
          })),
          vocabularyList: vocabBlock?.items?.map((item: any) => ({
            word: item.word,
            ipa: item.ipa || '',
            pos: item.pos || 'n',
            meaningVi: item.meaningVi || '',
            exampleEn: item.exampleEn,
            exampleVi: item.exampleVi,
          })) || [],
          grammarNotes: grammarBlock ? [{
            title: grammarBlock.title || 'Lý thuyết trọng tâm',
            explanation: grammarBlock.content || '',
            examples: grammarBlock.examples || [],
          }] : [],
          dialogues: dialogueBlock?.lines?.map((line: any) => ({
            speaker: line.speaker,
            textEn: line.text,
            textVi: line.translation,
          })) || [],
          practiceQuestions: quizBlock?.questions?.map((q: any, qIdx: number) => ({
            id: q.id || qIdx + 1,
            questionText: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanationVi: q.explanation || '',
          })) || [],
        };
      }
    }
  } catch (cErr) {
    console.warn('[fetchLessonDetailApi] Content API fallback error:', cErr);
  }

  return null;
};

export const completeLessonApi = async (lessonId: string, userId?: string): Promise<LessonCompletionResult | null> => {
  const uid = userId || getCurrentUserId();
  const cleanId = lessonId.replace(/^[^\d]*/, '') || lessonId;
  memoryRoadmapCache = null;
  try {
    const response = await apiClient.post<any>(`/api/v1/learning/path/lessons/${cleanId}/complete`, {});
    return response.data?.data || response.data;
  } catch (err) {
    console.warn('[completeLessonApi] Error:', err);
    return null;
  }
};
