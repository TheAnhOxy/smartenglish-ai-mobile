import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationsQuery } from '../../application/useNotifications';

export const NotificationsScreen = () => {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotificationsQuery();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Trang Chủ</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Hộp Thư Thông Báo 🔔</Text>
      <Text className="text-xs text-neutralGray mb-6">Cập nhật bài tập mới, nhắc nhở Streak & lớp học</Text>

      {isLoading ? (
        <ActivityIndicator color="#FF6B35" size="large" />
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-gray-100">
                <Text className="text-xl">🔔</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutralInk mb-0.5">{item.title}</Text>
                <Text className="text-xs text-neutralGray">{item.body}</Text>
                <Text className="text-[10px] text-primary font-bold mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              {!item.is_read && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
};
