import { apiClient } from '@/src/core/api/client';
import { TeacherClass, Assignment } from '@/src/core/types/schema';

export interface StudentProgressRow {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  completion_rate: number;
  is_at_risk: boolean;
  last_login_days_ago: number;
}

export const fetchTeacherClassesApi = async (): Promise<TeacherClass[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/teacher/classes');
    const data = response.data?.data || response.data?.classes || response.data || [];
    const list = Array.isArray(data) ? data : [];

    return list.map((c: any) => ({
      id: String(c.id),
      name: c.name || '',
      description: c.description || null,
      teacher_id: String(c.teacherId || c.teacher_id || ''),
      join_code: c.joinCode || c.join_code || '',
      max_students: c.maxStudents || c.max_students || 30,
      student_count: Number(c.studentCount || c.student_count || 0),
      assignment_count: Number(c.assignmentCount || c.assignment_count || 0),
      cefr_target: c.cefrTarget || c.cefr_target || 'B1',
      status: (c.status || 'active').toLowerCase(),
      start_date: c.startDate || c.start_date || null,
      end_date: c.endDate || c.end_date || null,
    }));
  } catch (error) {
    console.error('[TeacherAPI] Lỗi tải danh sách lớp học:', error);
    return [];
  }
};

export const fetchClassDetailApi = async (classId: string): Promise<{
  classInfo: TeacherClass;
  students: StudentProgressRow[];
  assignments: Assignment[];
}> => {
  try {
    const [classRes, membersRes, assignmentsRes] = await Promise.allSettled([
      apiClient.get<any>(`/api/v1/teacher/classes/${classId}`),
      apiClient.get<any>(`/api/v1/teacher/classes/${classId}/members`),
      apiClient.get<any>(`/api/v1/teacher/classes/${classId}/assignments`),
    ]);

    const rawClass = classRes.status === 'fulfilled' ? (classRes.value.data?.data || classRes.value.data) : null;
    const rawMembers = membersRes.status === 'fulfilled' ? (membersRes.value.data?.data || membersRes.value.data || []) : [];
    const rawAssignments = assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data?.data || assignmentsRes.value.data || []) : [];

    const classInfo: TeacherClass = {
      id: String(rawClass?.id || classId),
      name: rawClass?.name || 'Chi tiết lớp học',
      description: rawClass?.description || null,
      teacher_id: String(rawClass?.teacherId || rawClass?.teacher_id || ''),
      join_code: rawClass?.joinCode || rawClass?.join_code || '',
      max_students: rawClass?.maxStudents || rawClass?.max_students || 30,
      student_count: Number(rawClass?.studentCount || rawClass?.student_count || (Array.isArray(rawMembers) ? rawMembers.length : 0)),
      assignment_count: Number(rawClass?.assignmentCount || rawClass?.assignment_count || (Array.isArray(rawAssignments) ? rawAssignments.length : 0)),
      cefr_target: rawClass?.cefrTarget || rawClass?.cefr_target || 'B1',
      status: (rawClass?.status || 'active').toLowerCase(),
      start_date: rawClass?.startDate || rawClass?.start_date || null,
      end_date: rawClass?.endDate || rawClass?.end_date || null,
    };

    const students: StudentProgressRow[] = (Array.isArray(rawMembers) ? rawMembers : []).map((m: any) => {
      const progress = m.progress != null ? Number(m.progress) : 0;
      const lastLoginDaysAgo = m.lastLoginDaysAgo != null ? Number(m.lastLoginDaysAgo) : 0;
      return {
        user_id: String(m.userId || m.id),
        display_name: m.userName || m.name || `Học viên #${m.userId || m.id}`,
        avatar_url: m.userAvatar || m.avatarUrl || undefined,
        completion_rate: progress,
        is_at_risk: lastLoginDaysAgo > 7 || progress < 20,
        last_login_days_ago: lastLoginDaysAgo,
      };
    });

    const assignments: Assignment[] = (Array.isArray(rawAssignments) ? rawAssignments : []).map((a: any) => ({
      id: String(a.id),
      class_id: String(a.classId || a.class_id || classId),
      teacher_id: String(a.teacherId || a.teacher_id || ''),
      assignment_type: (a.assignmentType || a.assignment_type || 'quiz').toLowerCase(),
      reference_id: String(a.referenceId || a.reference_id || a.id),
      title: a.title || 'Bài tập',
      instructions: a.instructions || null,
      due_date: a.dueDate || a.due_date || new Date().toISOString(),
      passing_score: Number(a.passingScore || a.passing_score || 70),
      is_graded: a.isGraded !== false,
      created_at: a.createdAt || a.created_at || new Date().toISOString(),
      updated_at: a.updatedAt || a.updated_at || new Date().toISOString(),
    }));

    return {
      classInfo,
      students,
      assignments,
    };
  } catch (error) {
    console.error(`[TeacherAPI] Lỗi tải chi tiết lớp ${classId}:`, error);
    throw error;
  }
};
