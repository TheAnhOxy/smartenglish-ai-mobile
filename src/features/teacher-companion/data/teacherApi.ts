import { apiClient } from '@/src/core/api/client';
import { TeacherClass, ClassMember, Assignment } from '@/src/core/types/schema';
import { MOCK_CLASSES, MOCK_CLASS_MEMBERS, MOCK_ASSIGNMENTS } from '@/src/core/data/mockData';

export const fetchTeacherClassesApi = async (): Promise<TeacherClass[]> => {
  const response = await apiClient.get<{ classes: TeacherClass[] }>('/teacher/classes');
  return response.data.classes;
};

export interface StudentProgressRow {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  completion_rate: number;
  is_at_risk: boolean;
  last_login_days_ago: number;
}

export const fetchClassDetailApi = async (classId: string): Promise<{
  classInfo: TeacherClass;
  students: StudentProgressRow[];
  assignments: Assignment[];
}> => {
  const foundClass = MOCK_CLASSES.find((c) => c.id === classId) || MOCK_CLASSES[0];
  const assignments = MOCK_ASSIGNMENTS.filter((a) => a.class_id === classId);

  const mockStudents: StudentProgressRow[] = [
    {
      user_id: 's-1',
      display_name: 'Nguyễn Văn Học Viên',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      completion_rate: 85,
      is_at_risk: false,
      last_login_days_ago: 1
    },
    {
      user_id: 's-2',
      display_name: 'Lê Thị Thu Hà',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      completion_rate: 30,
      is_at_risk: true, // Cờ nguy cơ bỏ học (last_login > 7 ngày)
      last_login_days_ago: 9
    },
    {
      user_id: 's-3',
      display_name: 'Phạm Hoàng Minh',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      completion_rate: 92,
      is_at_risk: false,
      last_login_days_ago: 0
    }
  ];

  return {
    classInfo: foundClass,
    students: mockStudents,
    assignments
  };
};
