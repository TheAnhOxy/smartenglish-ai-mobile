import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { UserRound, Users } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useClassMembers } from '../../application/useClassMembership';
import type { ClassMemberDTO, StudentClassDTO } from '../../data/classApi';

interface ClassMembersTabProps {
  classInfo: StudentClassDTO;
}

export const ClassMembersTab: React.FC<ClassMembersTabProps> = ({ classInfo }) => {
  const { data: members = [], isLoading } = useClassMembers(classInfo.id);
  const students = members.filter((m) => m.role !== 'TEACHER');

  const renderItem = useCallback(
    ({ item }: { item: ClassMemberDTO }) => (
      <View className="bg-white dark:bg-darkCard px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 mb-2 flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-surface dark:bg-darkBg items-center justify-center mr-3">
          <Text className="text-xs font-bold text-secondary dark:text-white">{item.userName.charAt(0)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-neutralInk dark:text-white">{item.userName}</Text>
          {item.joinedAt ? (
            <Text className="text-[11px] text-neutralGray">
              Tham gia {new Date(item.joinedAt).toLocaleDateString('vi-VN')}
            </Text>
          ) : null}
        </View>
      </View>
    ),
    []
  );

  return (
    <FlatList
      data={students}
      keyExtractor={(item) => String(item.userId)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
      ListHeaderComponent={
        <View className="mb-4">
          <View className="flex-row items-center bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <UserRound size={18} color={AppColors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-neutralGray">Giáo viên</Text>
              <Text className="text-sm font-bold text-neutralInk dark:text-white">{classInfo.teacherName || 'Giáo viên'}</Text>
            </View>
          </View>
          <Text className="text-xs font-bold text-neutralGray uppercase">
            Học viên ({students.length}
            {classInfo.maxStudents ? `/${classInfo.maxStudents}` : ''})
          </Text>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={AppColors.primary} size="small" />
          </View>
        ) : (
          <View className="bg-white dark:bg-darkCard rounded-2xl p-8 items-center">
            <Users size={28} color={AppColors.neutralGray} />
            <Text className="text-sm font-semibold text-neutralInk dark:text-white mt-3">Chưa có học viên</Text>
          </View>
        )
      }
    />
  );
};
