import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import { useStudentClasses } from '../../application/useClassMembership';
import { useRouter } from 'expo-router';
import { Crown, GraduationCap, Plus } from 'lucide-react-native';
import { JoinClassModal } from './JoinClassModal';
import { useAuthStore } from '@/src/core/flows/authStore';

const FREE_MAX_CLASSES = 3;

export const StudentClassesScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { data: classes = [], isLoading, refetch, isRefetching } = useStudentClasses();
  const [showJoinModal, setShowJoinModal] = useState(false);

  const isPremium = currentUser?.plan && currentUser.plan !== 'free';
  const classCount = classes?.length || 0;
  const isLimitReached = !isPremium && classCount >= FREE_MAX_CLASSES;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View className="bg-white border-b border-gray-100 pt-8 pb-4 px-5 flex-row justify-between items-center shadow-xs">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(student)/profile' as any);
            }
          }}
          className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center border border-gray-200 active:bg-gray-100"
        >
          <Text className="text-gray-700 font-bold text-base">←</Text>
        </Pressable>

        <View className="items-center">
          <Text className="text-lg font-bold text-gray-900">Lớp Học Của Tôi</Text>
          <Text className="text-[11px] text-gray-500">Kết nối giảng viên & giáo trình học tập</Text>
        </View>

        <Pressable
          onPress={() => setShowJoinModal(true)}
          className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/20 active:bg-primary/20"
        >
          <Plus size={20} color="#FF6B35" strokeWidth={2.5} />
        </Pressable>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => String(item.id)}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View className="mb-4">
            {/* Student Quota / Premium Banner */}
            {!isPremium ? (
              <View className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <GraduationCap size={16} color="#B45309" strokeWidth={2.2} />
                    <Text className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Gói Học Viên Miễn Phí
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-amber-700">
                    {classCount} / {FREE_MAX_CLASSES} lớp
                  </Text>
                </View>

                {/* Progress bar */}
                <View className="h-2 w-full bg-amber-100 rounded-full overflow-hidden mb-3">
                  <View
                    className={`h-full rounded-full ${
                      isLimitReached ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (classCount / FREE_MAX_CLASSES) * 100)}%` }}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-[11px] text-gray-600 flex-1 mr-3 leading-4">
                    {isLimitReached
                      ? 'Bạn đã đạt giới hạn 3 lớp. Nâng cấp Premium để tham gia không giới hạn!'
                      : 'Học viên Free tham gia tối đa 3 lớp học. Nâng cấp để mở khóa vô hạn!'}
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(student)/profile/premium' as any)}
                    className="bg-amber-500 px-3 py-1.5 rounded-xl shadow-xs active:bg-amber-600 flex-row items-center gap-1.5"
                  >
                    <Crown size={13} color="#FFFFFF" fill="#FFFFFF" />
                    <Text className="text-[11px] font-bold text-white">Nâng Cấp</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="bg-purple-50 p-4 rounded-2xl border border-purple-200 mb-3 shadow-sm flex-row justify-between items-center">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Crown size={15} color="#6B21A8" strokeWidth={2} />
                    <Text className="text-xs font-bold text-purple-900 uppercase">
                      Học Viên VIP Premium
                    </Text>
                  </View>
                  <Text className="text-[11px] text-purple-700">
                    Không giới hạn số lượng lớp học & mở khóa toàn bộ bài giảng AI.
                  </Text>
                </View>
                <View className="bg-purple-600 px-3 py-1.5 rounded-xl">
                  <Text className="text-xs font-bold text-white">{classCount} Lớp</Text>
                </View>
              </View>
            )}

            {/* Section Title */}
            <View className="mt-2 mb-1">
              <Text className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Lớp Đang Theo Học ({classCount})
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() =>
          isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator color="#FF6B35" size="small" />
              <Text className="text-xs text-gray-500 mt-2 font-medium">Đang tải...</Text>
            </View>
          ) : (
            <View className="items-center py-14 bg-white rounded-3xl border border-gray-100 p-6 mx-1 shadow-xs">
              <Text className="text-5xl mb-3">🎓</Text>
              <Text className="text-base font-bold text-gray-800 mb-1">Chưa Tham Gia Lớp Học Nào</Text>
              <Text className="text-xs text-gray-500 text-center mb-6 leading-5 px-4">
                Nhập mã lớp được cung cấp bởi giáo viên (hoặc trung tâm) để truy cập giáo trình khóa học, nộp bài tập và xem bảng điểm.
              </Text>
              <Pressable
                onPress={() => setShowJoinModal(true)}
                className="bg-primary px-6 py-3 rounded-2xl shadow-sm active:bg-primaryDark flex-row items-center gap-2"
              >
                <Text className="text-white font-bold text-sm">Nhập Mã Lớp Ngay</Text>
                <Text className="text-white text-xs">→</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(student)/classes/${item.id}` as any)}
            className="bg-white p-4 rounded-2xl border border-gray-100 mb-3.5 shadow-xs active:bg-gray-50"
          >
            {/* Top row: Class name & CEFR badge */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text className="text-xs text-gray-500 font-medium">
                    👩‍🏫 {item.teacherName || 'Giáo viên'}
                  </Text>
                  <Text className="text-gray-300">•</Text>
                  <Text className="text-xs font-mono text-gray-500">Mã: {item.joinCode}</Text>
                </View>
              </View>

              <View className="bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                <Text className="text-[11px] font-bold text-primary">{item.cefrTarget || 'B1'}</Text>
              </View>
            </View>

            {/* Attached Course Curriculum Tag */}
            <View className="bg-sky-50 border border-sky-100 px-3 py-2 rounded-xl mb-3 flex-row items-center gap-2">
              <Text className="text-sm">📘</Text>
              <View className="flex-1">
                <Text className="text-[10px] uppercase font-bold text-sky-700">Giáo trình lớp học</Text>
                <Text className="text-xs font-semibold text-sky-900" numberOfLines={1}>
                  {item.courseTitle || 'IELTS Master 6.5+ Comprehensive'}
                </Text>
              </View>
            </View>

            {/* Footer metrics */}
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-gray-400">👥</Text>
                  <Text className="text-xs text-gray-600 font-medium">
                    {item.studentCount || 0} học viên
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-gray-400">📝</Text>
                  <Text className="text-xs text-gray-600 font-medium">
                    {item.assignmentCount || 0} bài tập
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-primary">Vào lớp</Text>
                <Text className="text-xs text-primary">→</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Join Class Modal */}
      <JoinClassModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        isLimitReached={isLimitReached}
      />
    </View>
  );
};
