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

export type AssignmentStatus = 'Chưa làm' | 'Đã nộp' | 'Đạt' | 'Chưa đạt';

export interface ClassAssignmentDTO {
  id: string | number;
  classId: string | number;
  title: string;
  instructions?: string;
  assignmentType: 'quiz' | 'vocab_deck' | 'writing' | 'essay' | 'roleplay' | 'reading' | 'exam' | 'homework' | 'listening' | 'speaking' | 'grammar' | 'document' | string;
  referenceId?: string | number;
  referenceTitle?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  dueDate?: string | null;
  passingScore: number;
  isGraded?: boolean;
  status: AssignmentStatus;
  submittedAt?: string | null;
  submissionText?: string | null;
  score?: number | null;
  feedback?: string | null;
}

interface MySubmissionRaw {
  status?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';
  score?: number | string | null;
  feedbackText?: string | null;
  submissionText?: string | null;
  submittedAt?: string | null;
}

interface AssignmentRaw {
  id: string | number;
  classId?: string | number;
  title: string;
  instructions?: string;
  assignmentType?: string;
  referenceId?: string | number;
  referenceTitle?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  dueDate?: string | null;
  passingScore?: number | string | null;
  isGraded?: boolean;
  mySubmission?: MySubmissionRaw | null;
}

const resolveStatus = (sub: MySubmissionRaw | null | undefined, passingScore: number): AssignmentStatus => {
  if (!sub || !sub.status || sub.status === 'NOT_SUBMITTED') return 'Chưa làm';
  if (sub.status === 'GRADED' && sub.score != null) {
    return Number(sub.score) >= passingScore ? 'Đạt' : 'Chưa đạt';
  }
  return 'Đã nộp';
};

const mapAssignment = (a: AssignmentRaw, classId: string | number): ClassAssignmentDTO => {
  const passingScore = a.passingScore != null ? Number(a.passingScore) : 5;
  const sub = a.mySubmission;
  const isGradedSub = sub?.status === 'GRADED';
  return {
    id: a.id,
    classId: a.classId ?? classId,
    title: a.title,
    instructions: a.instructions,
    assignmentType: String(a.assignmentType || 'homework').toLowerCase(),
    referenceId: a.referenceId,
    referenceTitle: a.referenceTitle,
    attachmentUrl: a.attachmentUrl,
    attachmentName: a.attachmentName,
    dueDate: a.dueDate ?? null,
    passingScore,
    isGraded: a.isGraded !== false,
    status: resolveStatus(sub, passingScore),
    submittedAt: sub?.submittedAt ?? null,
    submissionText: sub?.submissionText ?? null,
    // Chỉ hiển thị điểm khi giáo viên đã chấm
    score: isGradedSub && sub?.score != null ? Number(sub.score) : null,
    feedback: isGradedSub ? sub?.feedbackText ?? null : null,
  };
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

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
        courseTitle: item.courseTitle,
        joinCode: item.joinCode || item.join_code,
        maxStudents: item.maxStudents ?? item.max_students,
        cefrTarget: item.cefrTarget ?? item.cefr_target,
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
        courseTitle: data.courseTitle,
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
    const response = await apiClient.get<{ data?: AssignmentRaw[] } | AssignmentRaw[]>(
      `/api/v1/teacher/classes/${classId}/assignments`
    );
    const body = response.data;
    const data = Array.isArray(body) ? body : body?.data;
    return Array.isArray(data) ? data.map((a) => mapAssignment(a, classId)) : [];
  } catch (error: unknown) {
    console.warn(`[ClassAPI] fetchStudentAssignmentsApi error for class ${classId}:`, error);
    throw new Error(extractErrorMessage(error, 'Không thể tải danh sách bài tập'));
  }
};

export interface SubmitAssignmentPayload {
  submissionText?: string;
  referenceResultId?: number;
  score?: number;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  /** Bản web: DocumentPicker trả về File thật, gửi thẳng thay cho uri */
  webFile?: Blob;
}

/**
 * POST /api/v1/content/upload/file?folder=assignments/submissions
 * Tải file bài làm của học viên (ảnh chụp, PDF, Word...) lên kho lưu trữ, trả về URL công khai.
 */
export const uploadSubmissionFileApi = async (file: PickedFile): Promise<string> => {
  const formData = new FormData();
  if (file.webFile) {
    formData.append('file', file.webFile, file.name);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as unknown as Blob);
  }

  try {
    const response = await apiClient.post<{ data?: { url?: string } }>(
      '/api/v1/content/upload/file?folder=assignments/submissions',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const url = response.data?.data?.url;
    if (!url) throw new Error('Không nhận được đường dẫn file');
    return url;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, 'Không thể tải file bài làm lên'));
  }
};

/**
 * POST /api/v1/teacher/classes/assignments/{assignmentId}/submit
 * Học viên nộp bài (studentId lấy từ JWT). Giáo viên sẽ chấm điểm sau.
 */
export const submitAssignmentApi = async (
  assignmentId: string | number,
  payload: SubmitAssignmentPayload
): Promise<void> => {
  try {
    await apiClient.post(`/api/v1/teacher/classes/assignments/${assignmentId}/submit`, payload);
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, 'Không thể nộp bài, vui lòng thử lại'));
  }
};

interface CurriculumLessonRaw {
  id: number;
  courseId?: number;
  titleVi?: string;
  titleEn?: string;
  lessonType?: string;
  position?: number;
  estimatedMin?: number;
  isFreePreview?: boolean;
}

interface CurriculumCourseRaw {
  id: number;
  thumbnailUrl?: string | null;
  lessons?: CurriculumLessonRaw[];
}

export interface ClassCourseCurriculum {
  /** Ảnh bìa khóa học do giáo viên tải lên (có thể không có). */
  thumbnailUrl: string | null;
  lessons: CourseLessonDTO[];
}

/**
 * GET /api/v1/content/courses/tree
 * Lấy bài học của khóa học gắn với lớp từ cây lộ trình công khai.
 * (Trước đây gọi /content/admin/lessons — gateway chặn tài khoản học viên nên tab giáo trình luôn rỗng.)
 */
export const fetchClassCourseCurriculumApi = async (courseId?: number): Promise<ClassCourseCurriculum> => {
  if (!courseId) return { thumbnailUrl: null, lessons: [] };

  try {
    const response = await apiClient.get<{ data?: CurriculumCourseRaw[] }>('/api/v1/content/courses/tree');
    const course = (response.data?.data ?? []).find((c) => Number(c.id) === Number(courseId));
    const lessons = (course?.lessons ?? []).map((lesson) => ({
      id: lesson.id,
      courseId: lesson.courseId ?? courseId,
      titleVi: lesson.titleVi || 'Bài học',
      titleEn: lesson.titleEn,
      lessonType: lesson.lessonType || 'VOCABULARY',
      orderNumber: lesson.position ?? 1,
      estimatedMinutes: lesson.estimatedMin ?? 15,
      isFreePreview: Boolean(lesson.isFreePreview),
      isPublished: true,
    }));
    return { thumbnailUrl: course?.thumbnailUrl || null, lessons };
  } catch (error) {
    console.warn(`[ClassAPI] fetchClassCourseCurriculumApi error for courseId ${courseId}:`, error);
    return { thumbnailUrl: null, lessons: [] };
  }
};
