import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/core/flows/authStore';
import { normalizeCefr, type CefrLevel } from '@/src/features/onboarding/application/learnerLevel';
import { useLearningPlanQuery } from '@/src/features/onboarding/application/useLearningPlan';
import { fetchTeacherCoursesApi, type TeacherCourse } from '../data/teacherCourseApi';
import { splitByLearnerLevel } from './courseLevel';

export const TEACHER_COURSES_KEY = ['content', 'teacher-courses'] as const;

/**
 * Trình độ học viên: ưu tiên kết quả bài kiểm tra đầu vào (server chấm),
 * sau đó tới trình độ lưu trong hồ sơ.
 */
export const useLearnerLevel = (): { level: CefrLevel | null; fromPlacement: boolean } => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { data: plan } = useLearningPlanQuery(currentUser?.id);
  const placed = plan?.placementCompleted ? normalizeCefr(plan.cefrLevel) : null;
  if (placed) return { level: placed, fromPlacement: true };
  return { level: normalizeCefr(currentUser?.cefr_level), fromPlacement: false };
};

export const useTeacherCoursesQuery = () =>
  useQuery({
    queryKey: TEACHER_COURSES_KEY,
    queryFn: fetchTeacherCoursesApi,
    staleTime: 5 * 60_000,
    retry: 1,
  });

/** Khóa học giáo viên đã chia nhóm: đúng trình độ học viên trước, trình độ khác sau. */
export const useTeacherCoursesForLearner = () => {
  const query = useTeacherCoursesQuery();
  const { level, fromPlacement } = useLearnerLevel();
  const groups = useMemo(
    () => splitByLearnerLevel<TeacherCourse>(query.data ?? [], level),
    [query.data, level],
  );
  return { ...query, level, fromPlacement, ...groups };
};
