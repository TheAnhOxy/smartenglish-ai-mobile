import { canSubmitAssignment } from '../assignmentNavigation';
import type { ClassAssignmentDTO } from '../../data/classApi';

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

const item = (over: Partial<ClassAssignmentDTO>): ClassAssignmentDTO => ({
  id: 1,
  classId: 1,
  title: 'Bài tập',
  assignmentType: 'reading',
  passingScore: 5,
  status: 'Chưa làm',
  dueDate: future,
  ...over,
});

describe('canSubmitAssignment', () => {
  it('chưa làm và còn hạn: được làm bài', () => {
    expect(canSubmitAssignment(item({}))).toBe(true);
  });

  it('đã nộp hoặc đã chấm: chỉ làm lại khi giáo viên cho phép', () => {
    for (const status of ['Đã nộp', 'Đạt', 'Chưa đạt'] as const) {
      expect(canSubmitAssignment(item({ status }))).toBe(false);
      expect(canSubmitAssignment(item({ status, allowRetake: true }))).toBe(true);
    }
  });

  it('quá hạn: không nộp được dù cho phép làm lại', () => {
    expect(canSubmitAssignment(item({ dueDate: past }))).toBe(false);
    expect(canSubmitAssignment(item({ dueDate: past, status: 'Đã nộp', allowRetake: true }))).toBe(false);
  });
});
