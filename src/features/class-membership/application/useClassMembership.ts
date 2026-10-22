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
  return useQuery({
    queryKey: ['my-classes'],
    queryFn: () => fetchStudentClassesApi(),
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

  return useMutation({
    mutationFn: (joinCode: string) => joinClassApi(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });
};
