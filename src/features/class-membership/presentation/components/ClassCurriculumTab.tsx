import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Headphones, Layers, Mic, PenLine } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useCourseCurriculum } from '../../application/useClassMembership';
import type { CourseLessonDTO } from '../../data/classApi';

const LESSON_TYPE_META: Record<string, { label: string; Icon: typeof BookOpen }> = {
  READING: { label: 'Đọc hiểu', Icon: BookOpen },
  LISTENING: { label: 'Nghe', Icon: Headphones },
  GRAMMAR: { label: 'Ngữ pháp', Icon: PenLine },
  SPEAKING: { label: 'Nói', Icon: Mic },
  VOCABULARY: { label: 'Từ vựng', Icon: Layers },
};

interface ClassCurriculumTabProps {
  courseId?: number;
  courseTitle?: string;
}

export const ClassCurriculumTab: React.FC<ClassCurriculumTabProps> = ({ courseId, courseTitle }) => {
  const router = useRouter();
  const { data: lessons = [], isLoading } = useCourseCurriculum(courseId);

  const renderItem = useCallback(
    ({ item, index }: { item: CourseLessonDTO; index: number }) => {
      const meta = LESSON_TYPE_META[item.lessonType] ?? LESSON_TYPE_META.VOCABULARY;
      return (
        <Pressable
          onPress={() => router.push(`/(student)/lesson/${item.id}`)}
          className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3 flex-row items-center active:bg-gray-50"
        >
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
            <meta.Icon size={18} color={AppColors.primary} />
          </View>
          <View className="flex-1 mr-2">
            <Text className="text-[11px] text-neutralGray mb-0.5">
              Bài {item.orderNumber || index + 1} · {meta.label}
            </Text>
            <Text className="text-sm font-bold text-neutralInk dark:text-white" numberOfLines={1}>
              {item.titleVi}
            </Text>
          </View>
          <ChevronRight size={16} color={AppColors.neutralGray} />
        </Pressable>
      );
    },
    [router]
  );

  if (!courseId) {
    return (
      <View className="bg-white dark:bg-darkCard p-6 rounded-2xl items-center">
        <BookOpen size={28} color={AppColors.neutralGray} />
        <Text className="text-sm font-bold text-neutralInk dark:text-white mt-3">Lớp chưa gắn giáo trình</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={lessons}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
      ListHeaderComponent={
        <View className="flex-row items-center gap-2 bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4">
          <BookOpen size={16} color={AppColors.secondary} />
          <Text className="text-sm font-bold text-secondary dark:text-white flex-1" numberOfLines={2}>
            {courseTitle}
          </Text>
          <Text className="text-xs text-neutralGray">{lessons.length} bài</Text>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color={AppColors.primary} size="small" />
          </View>
        ) : (
          <View className="bg-white dark:bg-darkCard p-6 rounded-2xl items-center">
            <Text className="text-sm font-bold text-neutralInk dark:text-white">Khóa học chưa có bài giảng</Text>
          </View>
        )
      }
    />
  );
};
