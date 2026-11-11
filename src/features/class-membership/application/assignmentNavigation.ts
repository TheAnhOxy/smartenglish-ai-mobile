import type { Href } from 'expo-router';
import type { ClassAssignmentDTO } from '../data/classApi';

/**
 * Xác định màn hình làm bài tương ứng với bài tập giáo viên giao.
 * referenceId do web admin gán theo loại:
 *  - quiz / exam      → id đề thi (content exams)
 *  - vocab_deck       → id bộ flashcard
 *  - reading          → id bài đọc (reading passages)
 *  - listening        → id bài nghe (listening lessons)
 *  - homework / khác  → id bài giảng trong khóa học
 * Trả về null khi bài tập chỉ có file đính kèm hoặc là bài tự luận nộp trực tiếp.
 */
export const getAssignmentRoute = (item: ClassAssignmentDTO): Href | null => {
  const refId = item.referenceId != null && item.referenceId !== '' ? String(item.referenceId) : '';

  switch (item.assignmentType) {
    case 'quiz':
    case 'exam':
      return refId ? (`/(student)/practice/exam/${refId}` as Href) : null;
    case 'vocab_deck':
      return refId ? (`/(student)/review/decks/${refId}/study` as Href) : ('/(student)/review' as Href);
    case 'writing':
    case 'essay':
      return refId ? null : ('/(student)/practice/writing' as Href);
    case 'roleplay':
    case 'speaking':
      return '/(student)/practice/speaking' as Href;
    case 'reading':
      return refId ? (`/(student)/practice/reading/${refId}` as Href) : null;
    case 'listening':
      return refId ? (`/(student)/practice/listening/${refId}` as Href) : null;
    default:
      return refId ? (`/(student)/lesson/${refId}` as Href) : null;
  }
};

export const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  quiz: 'Trắc nghiệm',
  exam: 'Đề thi',
  vocab_deck: 'Từ vựng',
  writing: 'Viết luận',
  essay: 'Viết luận',
  roleplay: 'Luyện nói',
  speaking: 'Luyện nói',
  reading: 'Đọc hiểu',
  listening: 'Luyện nghe',
  grammar: 'Ngữ pháp',
  document: 'Tài liệu',
  homework: 'Bài tập',
};

export const getAssignmentTypeLabel = (type: string): string => ASSIGNMENT_TYPE_LABELS[type] ?? 'Bài tập';

export const isAssignmentOverdue = (item: ClassAssignmentDTO): boolean =>
  !!item.dueDate && new Date(item.dueDate) < new Date();

/** Học viên còn được nộp/nộp lại khi chưa bị chấm và chưa quá hạn. */
export const canSubmitAssignment = (item: ClassAssignmentDTO): boolean =>
  (item.status === 'Chưa làm' || item.status === 'Đã nộp') && !isAssignmentOverdue(item);
