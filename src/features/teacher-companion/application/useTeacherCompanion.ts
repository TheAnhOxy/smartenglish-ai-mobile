import { useQuery } from '@tanstack/react-query';
import { fetchTeacherClassesApi, fetchClassDetailApi } from '../data/teacherApi';

export const useTeacherClasses = () => {
  return useQuery({
    queryKey: ['teacher-classes'],
    queryFn: fetchTeacherClassesApi
  });
};

export const useTeacherClassDetail = (classId: string) => {
  return useQuery({
    queryKey: ['teacher-class-detail', classId],
    queryFn: () => fetchClassDetailApi(classId),
    enabled: !!classId
  });
};
