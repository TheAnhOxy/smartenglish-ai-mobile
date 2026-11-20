import { apiClient } from '@/src/core/api/client';

export interface TeacherCourseLesson {
  id: string;
  title: string;
  position: number;
  isFreePreview: boolean;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  levelMin: string | null;
  levelMax: string | null;
  isPremium: boolean;
  totalLessons: number;
  estimatedHours: number | null;
  lessons: TeacherCourseLesson[];
}

interface RawLesson {
  id?: number | string;
  titleVi?: string;
  titleEn?: string;
  position?: number;
  isFreePreview?: boolean;
}

interface RawCourse {
  id?: number | string;
  titleVi?: string;
  titleEn?: string;
  descriptionVi?: string;
  thumbnailUrl?: string | null;
  cefrLevelMin?: string | null;
  cefrLevelMax?: string | null;
  isPremium?: boolean;
  totalLessons?: number;
  estimatedHours?: number | string | null;
  source?: string;
  ownership?: string;
  lessons?: RawLesson[];
}

const isTeacherCourse = (c: RawCourse): boolean =>
  String(c.source || c.ownership || '').toUpperCase() === 'TEACHER';

const toNumberOrNull = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? null : n;
};

export const toTeacherCourse = (c: RawCourse): TeacherCourse => {
  const lessons = (c.lessons ?? [])
    .map((l, i) => ({
      id: String(l.id ?? `${c.id}-${i}`),
      title: l.titleVi || l.titleEn || `Bài ${i + 1}`,
      position: Number(l.position ?? i + 1),
      isFreePreview: Boolean(l.isFreePreview),
    }))
    .sort((a, b) => a.position - b.position);
  return {
    id: String(c.id),
    title: c.titleVi || c.titleEn || 'Khóa học',
    description: c.descriptionVi || '',
    thumbnailUrl: c.thumbnailUrl || null,
    levelMin: c.cefrLevelMin ?? null,
    levelMax: c.cefrLevelMax ?? null,
    isPremium: Boolean(c.isPremium),
    totalLessons: Number(c.totalLessons ?? lessons.length),
    estimatedHours: toNumberOrNull(c.estimatedHours),
    lessons,
  };
};

/** Khóa học do giáo viên tạo (đã xuất bản), lấy từ cây khóa học của content-service. */
export const fetchTeacherCoursesApi = async (): Promise<TeacherCourse[]> => {
  const response = await apiClient.get<{ data?: RawCourse[] } | RawCourse[]>('/api/v1/content/courses/tree');
  const body = response.data;
  const list: RawCourse[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
  return list.filter((c) => c.id != null && isTeacherCourse(c)).map(toTeacherCourse);
};
