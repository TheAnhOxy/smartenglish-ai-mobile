import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, BookOpen, Clock, ClipboardList, Paperclip, Play, Send } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useStudentAssignments } from '../../application/useClassMembership';
import { useActiveAssignmentStore } from '../../application/activeAssignmentStore';
import {
  canSubmitAssignment,
  getAssignmentRoute,
  getAssignmentTypeLabel,
  isAssignmentOverdue,
} from '../../application/assignmentNavigation';
import type { ClassAssignmentDTO } from '../../data/classApi';
import { AssignmentStatusBadge } from '../components/AssignmentStatusBadge';
import { SubmitAssignmentSheet } from '../components/SubmitAssignmentSheet';

interface StudentAssignmentsScreenProps {
  classId: string | number;
}

const openAttachment = async (url?: string) => {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn('Cannot open attachment URL:', err);
  }
};

export const StudentAssignmentsScreen: React.FC<StudentAssignmentsScreenProps> = ({ classId }) => {
  const { data: assignments = [], isLoading, isError, error, refetch, isRefetching } = useStudentAssignments(classId);
  const router = useRouter();
  const startAssignment = useActiveAssignmentStore((s) => s.start);
  const [submitting, setSubmitting] = useState<ClassAssignmentDTO | null>(null);

  const handleOpen = useCallback(
    (item: ClassAssignmentDTO) => {
      const route = getAssignmentRoute(item);
      if (route) {
        // Ghi nhớ bài tập đang làm để màn học liệu hiện nút "Nộp vào bài tập lớp"
        startAssignment({
          assignmentId: item.id,
          classId,
          title: item.title,
          assignmentType: item.assignmentType,
          referenceId: item.referenceId,
        });
        router.push(route);
      } else if (item.attachmentUrl) {
        openAttachment(item.attachmentUrl);
      } else if (canSubmitAssignment(item)) {
        setSubmitting(item);
      }
    },
    [router, startAssignment, classId]
  );

  const renderItem = useCallback(
    ({ item }: { item: ClassAssignmentDTO }) => {
      const overdue = isAssignmentOverdue(item);
      const submittable = canSubmitAssignment(item);
      const hasPractice = !!getAssignmentRoute(item);

      return (
        <Pressable
          onPress={() => handleOpen(item)}
          className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3 active:bg-gray-50"
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-[10px] uppercase font-bold text-primary mb-0.5">
                {getAssignmentTypeLabel(item.assignmentType)}
              </Text>
              <Text className="text-sm font-bold text-neutralInk dark:text-white leading-snug" numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <AssignmentStatusBadge item={item} />
          </View>

          {item.referenceTitle ? (
            <View className="flex-row items-center gap-1.5 bg-surface dark:bg-darkBg rounded-xl px-3 py-1.5 mb-2">
              <BookOpen size={13} color={AppColors.secondary} />
              <Text className="text-xs font-semibold text-secondary dark:text-gray-200 flex-1" numberOfLines={1}>
                {item.referenceTitle}
              </Text>
            </View>
          ) : null}

          {item.attachmentUrl ? (
            <Pressable
              onPress={() => openAttachment(item.attachmentUrl)}
              className="flex-row items-center gap-2 bg-surface dark:bg-darkBg rounded-xl px-3 py-2 mb-2"
            >
              <Paperclip size={13} color={AppColors.secondary} />
              <Text className="text-xs font-semibold text-neutralInk dark:text-white flex-1" numberOfLines={1}>
                {item.attachmentName || 'Tài liệu đính kèm'}
              </Text>
            </Pressable>
          ) : null}

          {item.instructions ? (
            <Text className="text-xs text-neutralGray mb-2 px-1" numberOfLines={2}>
              {item.instructions}
            </Text>
          ) : null}

          {item.feedback ? (
            <View className="bg-surface dark:bg-darkBg p-2.5 rounded-xl mb-2">
              <Text className="text-[11px] text-neutralInk dark:text-gray-200 leading-4">
                <Text className="font-semibold">Nhận xét: </Text>
                {item.feedback}
              </Text>
            </View>
          ) : null}

          <View className="flex-row justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color={overdue && item.status === 'Chưa làm' ? AppColors.error : AppColors.neutralGray} />
              <Text
                className={`text-[11px] font-medium ${
                  overdue && item.status === 'Chưa làm' ? 'text-error' : 'text-neutralGray'
                }`}
              >
                {item.dueDate ? new Date(item.dueDate).toLocaleString('vi-VN') : 'Không giới hạn'}
              </Text>
            </View>

            {hasPractice && submittable ? (
              <Pressable
                onPress={() => handleOpen(item)}
                hitSlop={8}
                className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-xl active:bg-primaryDark"
              >
                <Play size={12} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {item.status === 'Đã nộp' ? 'Làm lại' : 'Làm bài'}
                </Text>
              </Pressable>
            ) : submittable ? (
              <Pressable
                onPress={() => setSubmitting(item)}
                hitSlop={8}
                className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-xl active:bg-primaryDark"
              >
                <Send size={12} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {item.status === 'Đã nộp' ? 'Nộp lại' : 'Nộp bài'}
                </Text>
              </Pressable>
            ) : hasPractice ? (
              <Text className="text-xs font-bold text-primary">Xem bài</Text>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [handleOpen]
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
      <View className="items-center py-14 bg-white dark:bg-darkCard rounded-2xl p-6 mx-1">
        <AlertCircle size={28} color={AppColors.error} />
        <Text className="text-sm text-neutralGray text-center my-3 px-3">
          {error instanceof Error ? error.message : 'Không thể tải danh sách bài tập'}
        </Text>
        <Pressable onPress={() => refetch()} className="bg-primary px-5 py-2.5 rounded-xl active:bg-primaryDark">
          <Text className="text-white font-bold text-xs">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="items-center py-14 bg-white dark:bg-darkCard rounded-2xl p-6 mx-1">
            <ClipboardList size={28} color={AppColors.neutralGray} />
            <Text className="text-sm font-bold text-neutralInk dark:text-white mt-3">Chưa có bài tập</Text>
          </View>
        }
      />
      <SubmitAssignmentSheet classId={classId} assignment={submitting} onClose={() => setSubmitting(null)} />
    </>
  );
};
