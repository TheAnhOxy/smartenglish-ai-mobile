import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { CheckCircle2, Send } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { matchesActiveAssignment, useActiveAssignmentStore } from '../../application/activeAssignmentStore';
import { useSubmitAssignment } from '../../application/useClassMembership';

interface AssignmentSubmitBannerProps {
  /** id học liệu đang mở (đề thi / bài đọc / bài nghe / bài giảng) */
  referenceId?: string | number | null;
  /** Điểm thang 10 nếu học liệu có chấm tự động (đề thi, quiz) */
  score?: number | null;
  /** id kết quả bên service nghiệp vụ (vd: id lượt thi) để giáo viên đối chiếu */
  referenceResultId?: number | null;
}

/**
 * Thanh "Nộp vào bài tập lớp" hiển thị ở cuối màn hình học liệu
 * khi học viên mở học liệu này từ danh sách bài tập của lớp.
 */
export const AssignmentSubmitBanner: React.FC<AssignmentSubmitBannerProps> = ({ referenceId, score, referenceResultId }) => {
  const active = useActiveAssignmentStore((s) => s.active);
  const clear = useActiveAssignmentStore((s) => s.clear);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useSubmitAssignment(active?.classId ?? '');

  if (!matchesActiveAssignment(active, referenceId) && !done) return null;

  if (done) {
    return (
      <View className="flex-row items-center gap-2 bg-success/10 rounded-2xl px-4 py-3 mx-4 mb-3">
        <CheckCircle2 size={16} color={AppColors.success} />
        <Text className="text-xs font-semibold text-success flex-1">Đã nộp vào bài tập lớp</Text>
      </View>
    );
  }

  const handleSubmit = () => {
    if (!active) return;
    setError(null);
    mutate(
      {
        assignmentId: active.assignmentId,
        payload: {
          score: score != null ? Math.round(score * 10) / 10 : undefined,
          referenceResultId: referenceResultId ?? undefined,
          submissionText: score == null ? 'Đã hoàn thành học liệu trên hệ thống' : undefined,
        },
      },
      {
        onSuccess: () => {
          setDone(true);
          clear();
        },
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <View className="bg-white dark:bg-darkCard border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 mx-4 mb-3">
      <Text className="text-xs text-neutralGray mb-2" numberOfLines={1}>
        {active?.title}
        {score != null ? ` · ${score.toFixed(1)}/10` : ''}
      </Text>
      {error ? <Text className="text-xs text-error mb-2">{error}</Text> : null}
      <Pressable
        onPress={handleSubmit}
        disabled={isPending}
        className="h-11 rounded-xl bg-primary flex-row items-center justify-center gap-2 active:bg-primaryDark"
        style={{ opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={14} color="#FFFFFF" />}
        <Text className="text-white font-bold text-sm">Nộp vào bài tập lớp</Text>
      </Pressable>
    </View>
  );
};
