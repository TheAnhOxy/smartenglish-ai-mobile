import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ArrowLeft, Crown, GraduationCap, Plus } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useStudentClasses } from '../../application/useClassMembership';
import type { StudentClassDTO } from '../../data/classApi';
import { ClassCard } from '../components/ClassCard';
import { JoinClassModal } from './JoinClassModal';

const FREE_MAX_CLASSES = 3;

export const StudentClassesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const { data: classes = [], isLoading, isError, error, refetch, isRefetching } = useStudentClasses();
  const [showJoinModal, setShowJoinModal] = useState(false);

  const isPremium = !!currentUser?.plan && currentUser.plan !== 'free';
  const classCount = classes.length;
  const isLimitReached = !isPremium && classCount >= FREE_MAX_CLASSES;

  const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/(student)/profile'));

  const renderItem = useCallback(
    ({ item }: { item: StudentClassDTO }) => (
      <ClassCard item={item} onPress={() => router.push(`/(student)/classes/${item.id}`)} />
    ),
    [router]
  );

  const header = (
    <View className="mb-3">
      {!isPremium ? (
        <View className="flex-row items-center justify-between bg-white dark:bg-darkCard px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3">
          <Text className="text-xs text-neutralGray">
            {classCount}/{FREE_MAX_CLASSES} lớp (gói miễn phí)
          </Text>
          <Pressable
            onPress={() => router.push('/(student)/profile/premium')}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10"
          >
            <Crown size={12} color={AppColors.primary} />
            <Text className="text-xs font-bold text-primary">Nâng cấp</Text>
          </Pressable>
        </View>
      ) : null}
      <Text className="text-xs font-bold text-neutralGray uppercase">Lớp đang học ({classCount})</Text>
    </View>
  );

  const empty = isLoading ? (
    <View className="items-center py-20">
      <ActivityIndicator color={AppColors.primary} size="small" />
    </View>
  ) : isError ? (
    <View className="items-center py-12 bg-white dark:bg-darkCard rounded-2xl p-6">
      <AlertCircle size={28} color={AppColors.error} />
      <Text className="text-sm text-neutralGray text-center my-3">
        {error instanceof Error ? error.message : 'Không thể tải danh sách lớp học'}
      </Text>
      <Pressable onPress={() => refetch()} className="bg-primary px-5 py-2.5 rounded-xl active:bg-primaryDark">
        <Text className="text-white font-bold text-xs">Thử lại</Text>
      </Pressable>
    </View>
  ) : (
    <View className="items-center py-14 bg-white dark:bg-darkCard rounded-2xl p-6">
      <GraduationCap size={28} color={AppColors.neutralGray} />
      <Text className="text-sm font-bold text-neutralInk dark:text-white mt-3 mb-5">Chưa tham gia lớp nào</Text>
      <Pressable
        onPress={() => setShowJoinModal(true)}
        className="bg-primary px-6 py-3 rounded-2xl active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-sm">Nhập mã lớp</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-surface dark:bg-darkBg">
      <View
        className="bg-white dark:bg-darkCard border-b border-gray-100 dark:border-gray-800 pb-3 px-4 flex-row justify-between items-center"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={goBack} hitSlop={10} accessibilityLabel="Quay lại" className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={20} color={AppColors.neutralInk} />
        </Pressable>
        <Text className="text-base font-bold text-neutralInk dark:text-white">Lớp học của tôi</Text>
        <Pressable
          onPress={() => setShowJoinModal(true)}
          hitSlop={10}
          accessibilityLabel="Tham gia lớp"
          className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center"
        >
          <Plus size={20} color={AppColors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />

      <JoinClassModal visible={showJoinModal} onClose={() => setShowJoinModal(false)} isLimitReached={isLimitReached} />
    </View>
  );
};
