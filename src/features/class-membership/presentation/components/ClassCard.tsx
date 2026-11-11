import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BookOpen, ChevronRight, ClipboardList, UserRound, Users } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import type { StudentClassDTO } from '../../data/classApi';

interface ClassCardProps {
  item: StudentClassDTO;
  onPress: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ item, onPress }) => (
  <Pressable
    onPress={onPress}
    className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3 active:bg-gray-50"
  >
    <View className="flex-row justify-between items-start mb-2">
      <View className="flex-1 mr-2">
        <Text className="text-sm font-bold text-neutralInk dark:text-white mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row items-center gap-1">
          <UserRound size={12} color={AppColors.neutralGray} />
          <Text className="text-xs text-neutralGray" numberOfLines={1}>
            {item.teacherName || 'Giáo viên'} · {item.joinCode}
          </Text>
        </View>
      </View>
      {item.cefrTarget ? (
        <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
          <Text className="text-[11px] font-bold text-primary">{item.cefrTarget}</Text>
        </View>
      ) : null}
    </View>

    {item.courseId ? (
      <View className="flex-row items-center gap-2 bg-surface dark:bg-darkBg px-3 py-2 rounded-xl mb-3">
        <BookOpen size={14} color={AppColors.secondary} />
        <Text className="text-xs font-semibold text-secondary dark:text-gray-200 flex-1" numberOfLines={1}>
          {item.courseTitle}
        </Text>
      </View>
    ) : null}

    <View className="flex-row justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Users size={12} color={AppColors.neutralGray} />
          <Text className="text-xs text-neutralGray">{item.studentCount ?? 0} học viên</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <ClipboardList size={12} color={AppColors.neutralGray} />
          <Text className="text-xs text-neutralGray">{item.assignmentCount ?? 0} bài tập</Text>
        </View>
      </View>
      <ChevronRight size={16} color={AppColors.neutralGray} />
    </View>
  </Pressable>
);
