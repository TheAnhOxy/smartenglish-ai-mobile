import { apiClient } from '@/src/core/api/client';
import { TeacherClass, Assignment } from '@/src/core/types/schema';
import { MOCK_CLASSES, MOCK_ASSIGNMENTS } from '@/src/core/data/mockData';

export const fetchStudentClassesApi = async (): Promise<TeacherClass[]> => {
  const response = await apiClient.get<{ classes: TeacherClass[] }>('/teacher/classes');
  return response.data.classes;
};

export const joinClassApi = async (joinCode: string): Promise<{ message: string; class: TeacherClass }> => {
  const response = await apiClient.post<{ message: string; class: TeacherClass }>('/teacher/classes/join', {
    join_code: joinCode
  });
  return response.data;
};

export const fetchStudentAssignmentsApi = async (classId: string): Promise<Assignment[]> => {
  const response = await apiClient.get<{ assignments: Assignment[] }>(`/teacher/classes/${classId}/assignments`);
  return response.data.assignments;
};
