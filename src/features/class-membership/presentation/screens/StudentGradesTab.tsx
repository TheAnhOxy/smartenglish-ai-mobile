import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, BarChart3 } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useStudentAssignments } from '../../application/useClassMembership';
import { getAssignmentRoute } from '../../application/assignmentNavigation';
import type { ClassAssignmentDTO } from '../../data/classApi';
import { AssignmentStatusBadge } from '../components/AssignmentStatusBadge';

interface StudentGradesTabProps {
  classId: string | number;
  className?: string;
}

const getAcademicRank = (avg: number | null) => {
  if (avg == null) return { label: 'Chưa xếp loại', text: 'text-neutralGray', bg: 'bg-gray-100' };
  if (avg >= 8.5) return { label: 'Xuất sắc', text: 'text-success', bg: 'bg-success/10' };
  if (avg >= 7.0) return { label: 'Khá giỏi', text: 'text-primary', bg: 'bg-primary/10' };
  if (avg >= 5.0) return { label: 'Trung bình', text: 'text-warning', bg: 'bg-warning/10' };
  return { label: 'Cần cố gắng', text: 'text-error', bg: 'bg-error/10' };
};

export const StudentGradesTab: React.FC<StudentGradesTabProps> = ({ classId, className }) => {
  const router = useRouter();
  const { data: assignments = [], isLoading, isError, refetch, isRefetching } = useStudentAssignments(classId);

  const stats = useMemo(() => {
    const total = assignments.length;
    const submitted = assignments.filter((a) => a.status !== 'Chưa làm').length;
    const scores = assignments.map((a) => a.score).filter((s): s is number => s != null);
    const avg = scores.length > 0 ? scores.reduce((sum, v) => sum + v, 0) / scores.length : null;
    return {
      total,
      submitted,
      avg,
      completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    };
  }, [assignments]);

  const rank = getAcademicRank(stats.avg);

  const renderItem = useCallback(
    ({ item }: { item: ClassAssignmentDTO }) => {
      const route = getAssignmentRoute(item);
      return (
        <Pressable
          onPress={() => route && router.push(route)}
          disabled={!route}
          className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3 active:bg-gray-50"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-neutralInk dark:text-white" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-[11px] text-neutralGray mt-0.5">
                Hạn nộp: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'Không hạn'}
              </Text>
            </View>
            <AssignmentStatusBadge item={item} />
          </View>

          {item.feedback ? (
            <View className="bg-surface dark:bg-darkBg p-2.5 rounded-xl mt-2">
              <Text className="text-[11px] text-neutralInk dark:text-gray-200 leading-4">
                <Text className="font-semibold">Nhận xét của giáo viên: </Text>
                {item.feedback}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    },
    [router]
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator color={AppColors.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center py-14 bg-white dark:bg-darkCard rounded-2xl p-6">
        <AlertCircle size={28} color={AppColors.error} />
        <Text className="text-sm text-neutralGray my-3">Không thể tải bảng điểm</Text>
        <Pressable onPress={() => refetch()} className="bg-primary px-5 py-2.5 rounded-xl active:bg-primaryDark">
          <Text className="text-white font-bold text-xs">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={assignments}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{ paddingBottom: 80 }}
      ListHeaderComponent={
        <View className="bg-white dark:bg-darkCard p-5 rounded-3xl border border-gray-100 dark:border-gray-800 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-neutralInk dark:text-white flex-1 mr-2" numberOfLines={1}>
              {className || 'Bảng điểm'}
            </Text>
            <View className={`px-3 py-1 rounded-full ${rank.bg}`}>
              <Text className={`text-xs font-bold ${rank.text}`}>{rank.label}</Text>
            </View>
          </View>

          <View className="flex-row bg-surface dark:bg-darkBg p-3 rounded-2xl">
            <View className="flex-1 items-center">
              <Text className="text-[11px] font-semibold text-neutralGray mb-1">Điểm TB</Text>
              <Text className="text-2xl font-extrabold text-primary">
                {stats.avg != null ? stats.avg.toFixed(1) : '—'}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[11px] font-semibold text-neutralGray mb-1">Đã nộp</Text>
              <Text className="text-2xl font-extrabold text-secondary dark:text-white">
                {stats.submitted}/{stats.total}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[11px] font-semibold text-neutralGray mb-1">Hoàn thành</Text>
              <Text className="text-2xl font-extrabold text-success">{stats.completionRate}%</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View className="bg-white dark:bg-darkCard p-6 rounded-2xl items-center">
          <BarChart3 size={28} color={AppColors.neutralGray} />
          <Text className="text-sm font-bold text-neutralInk dark:text-white mt-3">Chưa có bài tập</Text>
        </View>
      }
    />
  );
};
