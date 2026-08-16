import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStudentClassesApi, joinClassApi, fetchStudentAssignmentsApi } from '../data/classApi';

export const useStudentClasses = () => {
  return useQuery({
    queryKey: ['my-classes'],
    queryFn: fetchStudentClassesApi
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (joinCode: string) => joinClassApi(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    }
  });
};

export const useStudentAssignments = (classId: string) => {
  return useQuery({
    queryKey: ['student-assignments', classId],
    queryFn: () => fetchStudentAssignmentsApi(classId),
    enabled: !!classId
  });
};
