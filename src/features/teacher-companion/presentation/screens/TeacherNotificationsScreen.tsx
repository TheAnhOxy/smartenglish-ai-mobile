import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useNotificationsQuery, useMarkNotificationReadMutation } from '@/src/features/notifications/application/useNotifications';
import { NotificationItem } from '@/src/core/types/schema';
import { StudentInvoicesModal } from '@/src/features/subscription-paywall/presentation/components/StudentInvoicesModal';

export const TeacherNotificationsScreen = () => {
  const { data: notifications, isLoading, refetch } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
  };

  const handleOpenInvoiceFromNotif = (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    setIsInvoicesModalOpen(true);
  };

  return (
    <View className="flex-1 bg-surface px-6 pt-14">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-2xl font-bold text-secondary">Thông Báo Giáo Viên 🔔</Text>
        <Pressable
          onPress={() => refetch()}
          className="px-2.5 py-1 bg-secondary/10 rounded-full"
        >
          <Text className="text-xs font-semibold text-secondary">Làm mới</Text>
        </Pressable>
      </View>
      <Text className="text-xs text-neutralGray mb-6">
        Biên lai thanh toán gói Pro, cập nhật tiến độ nộp bài & cảnh báo học viên
      </Text>

      {isLoading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator color="#1B3A57" size="large" />
          <Text className="text-xs text-neutralGray mt-2">Đang tải thông báo...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-sm font-semibold text-neutralInk">Không có thông báo nào</Text>
              <Text className="text-xs text-neutralGray mt-1 text-center">
                Bạn đã đọc hết mọi thông báo hoặc chưa có thông báo mới.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPayment =
              item.notification_type === 'payment_receipt' ||
              item.notification_type === 'payment_success' ||
              (item.title && item.title.toLowerCase().includes('thanh toán'));

            return (
              <Pressable
                onPress={() => handleNotificationPress(item)}
                className={`p-4 rounded-2xl border mb-3 ${
                  isPayment
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : item.is_read
                    ? 'bg-cardWhite border-gray-100 opacity-80'
                    : 'bg-secondary/5 border-secondary/20 shadow-sm'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                    <Text className="text-sm font-bold text-neutralInk flex-1" numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  {isPayment && (
                    <View className="bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-emerald-800">BIÊN LAI HĐĐT</Text>
                    </View>
                  )}
                  {!item.is_read && !isPayment && (
                    <View className="h-2 w-2 rounded-full bg-secondary" />
                  )}
                </View>

                <Text className="text-xs text-neutralGray leading-5 mb-2">{item.body}</Text>

                {/* Nút Xem hóa đơn điện tử trực tiếp nếu là thông báo thanh toán */}
                {isPayment && (
                  <Pressable
                    onPress={() => handleOpenInvoiceFromNotif(item)}
                    className="mb-2.5 self-start bg-emerald-600 active:bg-emerald-700 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 shadow-2xs"
                  >
                    <Text className="text-xs font-bold text-white">🧾 Xem hóa đơn điện tử</Text>
                  </Pressable>
                )}

                <Text className="text-[10px] text-neutralGray text-right">
                  {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* Modal Hóa Đơn Điện Tử */}
      <StudentInvoicesModal
        visible={isInvoicesModalOpen}
        onClose={() => setIsInvoicesModalOpen(false)}
      />
    </View>
  );
};

