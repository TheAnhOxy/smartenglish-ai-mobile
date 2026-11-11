import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useClassDetail } from '../../application/useClassMembership';
import { ClassCurriculumTab } from '../components/ClassCurriculumTab';
import { ClassMembersTab } from '../components/ClassMembersTab';
import { StudentAssignmentsScreen } from './StudentAssignmentsScreen';
import { StudentGradesTab } from './StudentGradesTab';

type DetailTab = 'curriculum' | 'assignments' | 'grades' | 'members';

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'curriculum', label: 'Giáo trình' },
  { key: 'assignments', label: 'Bài tập' },
  { key: 'grades', label: 'Bảng điểm' },
  { key: 'members', label: 'Thành viên' },
];

export const StudentClassDetailScreen = () => {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<DetailTab>('curriculum');

  const validClassId = classId ? String(classId) : '';
  const { data: currentClass, isLoading, isError, error, refetch } = useClassDetail(validClassId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface dark:bg-darkBg justify-center items-center">
        <ActivityIndicator color={AppColors.primary} size="small" />
      </View>
    );
  }

  if (!validClassId || isError || !currentClass) {
    return (
      <View className="flex-1 bg-surface dark:bg-darkBg justify-center items-center px-6">
        <AlertCircle size={28} color={AppColors.error} />
        <Text className="text-sm text-neutralGray text-center my-3">
          {error instanceof Error ? error.message : 'Không thể tải lớp học'}
        </Text>
        <View className="flex-row gap-3">
          <Pressable onPress={() => router.back()} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-darkCard">
            <Text className="text-xs font-bold text-neutralInk dark:text-white">Quay lại</Text>
          </Pressable>
          {validClassId ? (
            <Pressable onPress={() => refetch()} className="px-5 py-2.5 rounded-xl bg-primary active:bg-primaryDark">
              <Text className="text-xs font-bold text-white">Thử lại</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-darkBg">
      <View
        className="bg-white dark:bg-darkCard border-b border-gray-100 dark:border-gray-800 pb-3 px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Quay lại" className="w-10 h-10 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={AppColors.neutralInk} />
          </Pressable>
          <Text className="flex-1 text-base font-bold text-neutralInk dark:text-white" numberOfLines={1}>
            {currentClass.name}
          </Text>
          {currentClass.cefrTarget ? (
            <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
              <Text className="text-[11px] font-bold text-primary">{currentClass.cefrTarget}</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs text-neutralGray mb-3">
          {currentClass.teacherName || 'Giáo viên'} · {currentClass.joinCode}
        </Text>

        <View className="flex-row bg-surface dark:bg-darkBg p-1 rounded-xl">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-white dark:bg-darkCard' : ''}`}
              >
                <Text className={`text-xs font-bold ${active ? 'text-primary' : 'text-neutralGray'}`}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 p-4">
        {activeTab === 'curriculum' && (
          <ClassCurriculumTab
            courseId={currentClass.courseId ? Number(currentClass.courseId) : undefined}
            courseTitle={currentClass.courseTitle}
          />
        )}
        {activeTab === 'assignments' && <StudentAssignmentsScreen classId={validClassId} />}
        {activeTab === 'grades' && <StudentGradesTab classId={validClassId} className={currentClass.name} />}
        {activeTab === 'members' && <ClassMembersTab classInfo={currentClass} />}
      </View>
    </View>
  );
};
