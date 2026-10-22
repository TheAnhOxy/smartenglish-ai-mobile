import { apiClient } from '@/src/core/api/client';

export interface StudentClassDTO {
  id: string | number;
  name: string;
  description?: string;
  teacherId?: number;
  teacherName?: string;
  courseId?: number;
  courseTitle?: string;
  joinCode: string;
  maxStudents?: number;
  cefrTarget?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  studentCount?: number;
  assignmentCount?: number;
}

export interface ClassMemberDTO {
  id: string | number;
  userId: string | number;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  role: 'STUDENT' | 'TEACHER' | 'ASSISTANT_TEACHER';
  status: string;
  joinedAt: string;
}

export interface ClassAssignmentDTO {
  id: string | number;
  classId: string | number;
  title: string;
  instructions?: string;
  assignmentType: 'quiz' | 'vocab_deck' | 'writing' | 'roleplay' | 'reading' | 'exam';
  referenceId?: string | number;
  dueDate: string;
  passingScore?: number;
  isGraded?: boolean;
  status?: 'Chưa làm' | 'Đang làm' | 'Đã nộp' | 'Đạt' | 'Chưa đạt';
  submittedCount?: number;
}

export interface CourseLessonDTO {
  id: number;
  courseId: number;
  titleVi: string;
  titleEn?: string;
  descriptionVi?: string;
  lessonType: string;
  orderNumber: number;
  estimatedMinutes?: number;
  isFreePreview?: boolean;
  isPublished?: boolean;
}

/**
 * GET /api/v1/teacher/classes/my-student-classes
 * Lấy danh sách lớp học mà học viên hiện tại đã tham gia (danh tính từ JWT)
 */
export const fetchStudentClassesApi = async (_userId?: string): Promise<StudentClassDTO[]> => {
  try {
    const response = await apiClient.get<any>('/api/v1/teacher/classes/my-student-classes');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        teacherId: item.teacherId,
        teacherName: item.teacherName || 'Giáo viên',
        courseId: item.courseId,
        courseTitle: item.courseTitle || 'Chưa gắn giáo trình',
        joinCode: item.joinCode || item.join_code,
        maxStudents: item.maxStudents || item.max_students || 30,
        cefrTarget: item.cefrTarget || item.cefr_target || 'B1',
        status: item.status || 'ACTIVE',
        startDate: item.startDate,
        endDate: item.endDate,
        studentCount: item.studentCount || 0,
        assignmentCount: item.assignmentCount || 0,
      }));
    }
    return [];
  } catch (error: any) {
    console.warn('[ClassAPI] fetchStudentClassesApi error:', error);
    throw error;
  }
};

/**
 * POST /api/v1/teacher/classes/join
 * Học viên nhập mã tham gia lớp học (danh tính studentId lấy từ JWT)
 */
export const joinClassApi = async (
  joinCode: string,
  _userPayload?: {
    studentId?: string | number;
    studentName?: string;
    studentEmail?: string;
    studentAvatar?: string;
    isPremium?: boolean;
  }
): Promise<{ message: string; class: StudentClassDTO }> => {
  const payload = {
    joinCode: joinCode.trim().toUpperCase(),
  };

  try {
    const response = await apiClient.post<any>('/api/v1/teacher/classes/join', payload);
    const data = response.data?.data || response.data;
    return {
      message: response.data?.message || 'Tham gia lớp học thành công',
      class: {
        id: data.id,
        name: data.name,
        description: data.description,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        joinCode: data.joinCode || data.join_code,
        maxStudents: data.maxStudents,
        cefrTarget: data.cefrTarget,
        status: data.status,
        studentCount: data.studentCount || 1,
        assignmentCount: data.assignmentCount || 0,
      },
    };
  } catch (error: any) {
    console.warn('[ClassAPI] joinClassApi error:', error);
    throw error;
  }
};

/**
 * GET /api/v1/teacher/classes/{classId}
 * Lấy chi tiết thông tin lớp học
 */
export const fetchClassDetailApi = async (classId: string | number): Promise<StudentClassDTO> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/teacher/classes/${classId}`);
    const data = response.data?.data || response.data;
    if (data) {
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        teacherId: data.teacherId,
        teacherName: data.teacherName || 'Giáo viên',
        courseId: data.courseId,
        courseTitle: data.courseTitle || 'Giáo trình cốt lõi',
        joinCode: data.joinCode,
        maxStudents: data.maxStudents,
        cefrTarget: data.cefrTarget,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        studentCount: data.studentCount || 0,
        assignmentCount: data.assignmentCount || 0,
      };
    }
    throw new Error('Không tìm thấy thông tin lớp học');
  } catch (error: any) {
    console.warn(`[ClassAPI] fetchClassDetailApi error for class ${classId}:`, error);
    throw error;
  }
};

/**
 * GET /api/v1/teacher/classes/{classId}/members
 * Danh sách thành viên trong lớp (Giáo viên + Các học viên)
 */
export const fetchClassMembersApi = async (classId: string | number): Promise<ClassMemberDTO[]> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/teacher/classes/${classId}/members`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        userName: m.userName || 'Thành viên',
        userEmail: m.userEmail,
        userAvatar: m.userAvatar,
        role: m.role || 'STUDENT',
        status: m.status || 'ACTIVE',
        joinedAt: m.joinedAt || new Date().toISOString(),
      }));
    }
    return [];
  } catch (error: any) {
    console.warn(`[ClassAPI] fetchClassMembersApi error for class ${classId}:`, error);
    throw error;
  }
};

/**
 * GET /api/v1/teacher/classes/{classId}/assignments
 * Danh sách bài tập được giáo viên giao cho lớp
 */
export const fetchStudentAssignmentsApi = async (classId: string | number): Promise<ClassAssignmentDTO[]> => {
  try {
    const response = await apiClient.get<any>(`/api/v1/teacher/classes/${classId}/assignments`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((a: any) => ({
        id: a.id,
        classId: a.classId || classId,
        title: a.title,
        instructions: a.instructions,
        assignmentType: a.assignmentType || 'quiz',
        referenceId: a.referenceId,
        dueDate: a.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
        passingScore: a.passingScore || 70,
        isGraded: a.isGraded !== false,
        status: a.status || 'Chưa làm',
        submittedCount: a.submittedCount || 0,
      }));
    }
    return [];
  } catch (error: any) {
    console.warn(`[ClassAPI] fetchStudentAssignmentsApi error for class ${classId}:`, error);
    throw error;
  }
};

/**
 * GET /api/v1/content/admin/lessons?courseId={courseId}
 * Lấy danh sách bài học thuộc khóa học đính kèm của lớp
 */
export const fetchClassCourseLessonsApi = async (courseId?: number): Promise<CourseLessonDTO[]> => {
  if (!courseId) return [];

  try {
    const response = await apiClient.get<any>(`/api/v1/content/admin/lessons?courseId=${courseId}`);
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((lesson: any) => ({
        id: lesson.id,
        courseId: lesson.courseId || courseId,
        titleVi: lesson.titleVi || lesson.title || 'Bài học',
        titleEn: lesson.titleEn,
        descriptionVi: lesson.descriptionVi,
        lessonType: lesson.lessonType || 'VOCABULARY',
        orderNumber: lesson.orderNumber || 1,
        estimatedMinutes: lesson.estimatedMinutes || 15,
        isFreePreview: Boolean(lesson.isFreePreview),
        isPublished: lesson.isPublished !== false,
      }));
    }
    return [];
  } catch (error) {
    console.warn(`[ClassAPI] fetchClassCourseLessonsApi error for courseId ${courseId}:`, error);
    return [];
  }
};
