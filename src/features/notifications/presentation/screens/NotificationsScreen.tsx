import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationsQuery, useMarkNotificationReadMutation } from '../../application/useNotifications';
import { NotificationItem } from '@/src/core/types/schema';

export const NotificationsScreen = () => {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
  };

  return (
    <View className="flex-1 bg-surface pt-8 px-6 pb-6">
      <Pressable
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.navigate('/(student)/profile' as any);
          }
        }}
        className="mb-4 self-start"
      >
        <Text className="text-primary font-bold text-sm">← Cá Nhân</Text>
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
          ListEmptyComponent={
            <View className="py-16 items-center justify-center">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-sm font-semibold text-neutralInk">Không có thông báo nào</Text>
              <Text className="text-xs text-neutralGray mt-1 text-center">
                Bạn đã đọc hết mọi thông báo hoặc chưa có thông báo mới.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleNotificationPress(item)}
              className={`p-4 rounded-2xl border mb-3 shadow-sm flex-row items-center gap-3 ${
                item.is_read ? 'bg-white border-gray-100 opacity-80' : 'bg-cardWhite border-primary/20'
              }`}
            >
              <View className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-gray-100">
                <Text className="text-xl">🔔</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-sm mb-0.5 ${item.is_read ? 'font-medium text-neutralInk' : 'font-bold text-neutralInk'}`}>
                  {item.title}
                </Text>
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
