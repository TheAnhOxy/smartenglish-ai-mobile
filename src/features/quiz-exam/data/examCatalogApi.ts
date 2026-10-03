import { apiClient } from '@/src/core/api/client';

export type ExamCategory =
  | 'TOEIC_FULL'
  | 'TOEIC_MINI'
  | 'PLACEMENT'
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'READING'
  | 'LISTENING'
  | 'GENERAL';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL';

export interface PublicExamSummary {
  id: number;
  title: string;
  description?: string | null;
  category: ExamCategory;
  cefrLevel: CefrLevel;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  xpReward: number;
}

export interface PublicExamSection {
  id?: number | null;
  sectionName?: string | null;
  partNumber: number;
  title?: string | null;
  instructions?: string | null;
  questionCount: number;
}

export interface PublicExamDetail extends PublicExamSummary {
  sections: PublicExamSection[];
  questions?: any[];
}

export interface ExamCatalogPage {
  items: PublicExamSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ExamCatalogFilters {
  search?: string;
  category?: ExamCategory;
  cefrLevel?: Exclude<CefrLevel, 'ALL'>;
  page?: number;
  size?: number;
}

const unwrapData = <T>(payload: any): T => (payload?.data ?? payload) as T;

export async function fetchPublishedExamsApi(filters: ExamCatalogFilters): Promise<ExamCatalogPage> {
  const response = await apiClient.get('/api/v1/content/exams', {
    params: {
      search: filters.search?.trim() || undefined,
      category: filters.category,
      cefrLevel: filters.cefrLevel,
      sortBy: 'created_desc',
      page: filters.page ?? 1,
      size: filters.size ?? 20,
    },
  });

  const data = unwrapData<ExamCatalogPage>(response.data);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? 1),
    size: Number(data?.size ?? filters.size ?? 20),
    totalPages: Number(data?.totalPages ?? 0),
  };
}

export async function fetchPublishedExamDetailApi(examId: number): Promise<PublicExamDetail> {
  const response = await apiClient.get(`/api/v1/content/exams/${examId}`);
  const data = unwrapData<PublicExamDetail>(response.data);
  return {
    ...data,
    id: Number(data.id),
    durationMinutes: Number(data.durationMinutes ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
    passingScore: Number(data.passingScore ?? 0),
    xpReward: Number(data.xpReward ?? 0),
    sections: Array.isArray(data.sections) ? data.sections : [],
    questions: Array.isArray(data.questions) ? data.questions : [],
  };
}
