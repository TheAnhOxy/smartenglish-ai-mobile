import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudentClassesApi,
  joinClassApi,
  fetchClassDetailApi,
  fetchClassMembersApi,
  fetchStudentAssignmentsApi,
  fetchClassCourseLessonsApi,
} from '../data/classApi';
import { useAuthStore } from '@/src/core/flows/authStore';

export const useStudentClasses = () => {
  const { currentUser } = useAuthStore();
  const userId = currentUser?.id ? String(currentUser.id) : undefined;

  return useQuery({
    queryKey: ['my-classes', userId],
    queryFn: () => fetchStudentClassesApi(userId),
    staleTime: 1000 * 30, // 30s cache
  });
};

export const useClassDetail = (classId: string | number) => {
  return useQuery({
    queryKey: ['class-detail', String(classId)],
    queryFn: () => fetchClassDetailApi(classId),
    enabled: !!classId,
  });
};

export const useClassMembers = (classId: string | number) => {
  return useQuery({
    queryKey: ['class-members', String(classId)],
    queryFn: () => fetchClassMembersApi(classId),
    enabled: !!classId,
  });
};

export const useStudentAssignments = (classId: string | number) => {
  return useQuery({
    queryKey: ['student-assignments', String(classId)],
    queryFn: () => fetchStudentAssignmentsApi(classId),
    enabled: !!classId,
  });
};

export const useCourseCurriculum = (courseId?: number) => {
  return useQuery({
    queryKey: ['course-curriculum', courseId],
    queryFn: () => fetchClassCourseLessonsApi(courseId),
    enabled: !!courseId,
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (joinCode: string) => {
      const isPremium = currentUser?.plan && currentUser.plan !== 'free';
      return joinClassApi(joinCode, {
        studentId: currentUser?.id,
        studentName: currentUser?.display_name || currentUser?.email || 'Học viên',
        studentEmail: currentUser?.email,
        studentAvatar: currentUser?.avatar_url || undefined,
        isPremium: Boolean(isPremium),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });
};
