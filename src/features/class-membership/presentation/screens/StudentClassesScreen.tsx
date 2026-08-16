import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useStudentClasses } from '../../application/useClassMembership';
import { useRouter } from 'expo-router';
import { JoinClassModal } from './JoinClassModal';

export const StudentClassesScreen = () => {
  const router = useRouter();
  const { data: classes, isLoading, refetch } = useStudentClasses();
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <View className="flex-1 bg-surface px-6 pt-14 pb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Text className="text-primary font-bold text-sm">← Hồ Sơ</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-neutralInk">Lớp Học Của Tôi</Text>
        <View className="w-8" />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FF6B35" size="large" />
        </View>
      ) : (
        <FlatList
          data={classes || []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center py-20">
              <Text className="text-5xl mb-4">🎓</Text>
              <Text className="text-lg font-bold text-neutralInk mb-1">Bạn Chưa Tham Gia Lớp Học Nào</Text>
              <Text className="text-xs text-neutralGray text-center px-6 mb-6">
                Nhập mã lớp được cung cấp bởi giáo viên để bắt đầu nhận bài tập & tham gia bảng điểm lớp.
              </Text>
              <Pressable
                onPress={() => setShowJoinModal(true)}
                className="bg-primary px-6 py-3 rounded-xl shadow-md active:bg-primaryDark"
              >
                <Text className="text-white font-bold text-sm">Nhập Mã Lớp Hóa Học</Text>
              </Pressable>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(student)/classes/${item.id}` as any)}
              className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm active:bg-gray-50 flex-row justify-between items-center"
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-bold text-neutralInk mb-1">{item.name}</Text>
                <Text className="text-xs text-neutralGray">Mã: {item.join_code} • Target: {item.cefr_target}</Text>
              </View>

              {/* Pending Badge */}
              <View className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-primary" />
                <Text className="text-xs font-bold text-primary">1 Bài tập</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => setShowJoinModal(true)}
        className="absolute bottom-8 right-6 bg-primary px-5 py-3.5 rounded-full shadow-lg flex-row items-center gap-2 active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-xl">+</Text>
        <Text className="text-white font-bold text-sm">Tham Gia Lớp Mới</Text>
      </Pressable>

      <JoinClassModal visible={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </View>
  );
};
