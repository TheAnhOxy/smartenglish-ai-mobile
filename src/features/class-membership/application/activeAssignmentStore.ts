import { create } from 'zustand';

export interface ActiveAssignment {
  assignmentId: string | number;
  classId: string | number;
  title: string;
  assignmentType: string;
  referenceId?: string | number;
}

interface ActiveAssignmentState {
  active: ActiveAssignment | null;
  start: (assignment: ActiveAssignment) => void;
  clear: () => void;
}

/**
 * Ghi nhớ bài tập lớp học mà học viên đang làm khi mở một học liệu hệ thống
 * (đề thi, bài đọc, bài nghe, bài giảng). Màn hình làm bài đọc store này để hiện nút
 * "Nộp vào bài tập lớp" — nhờ vậy kết quả được lưu về đúng bài tập của lớp.
 */
export const useActiveAssignmentStore = create<ActiveAssignmentState>((set) => ({
  active: null,
  start: (assignment) => set({ active: assignment }),
  clear: () => set({ active: null }),
}));

/** Bài tập đang làm có gắn với học liệu `referenceId` hiện tại không (tránh nộp nhầm bài). */
export const matchesActiveAssignment = (
  active: ActiveAssignment | null,
  referenceId?: string | number | null
): active is ActiveAssignment =>
  !!active && active.referenceId != null && referenceId != null && String(active.referenceId) === String(referenceId);
