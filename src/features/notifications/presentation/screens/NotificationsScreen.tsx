import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationsQuery, useMarkNotificationReadMutation } from '../../application/useNotifications';
import { NotificationItem } from '@/src/core/types/schema';
import { StudentInvoicesModal } from '@/src/features/subscription-paywall/presentation/components/StudentInvoicesModal';
import { Bell, Inbox, Receipt } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';

export const NotificationsScreen = () => {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotificationsQuery();
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

      <Text className="text-xl font-bold text-neutralInk mb-5">Thông báo</Text>

      {isLoading ? (
        <ActivityIndicator color="#0EA5E9" size="large" />
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-16 items-center justify-center">
              <Inbox size={28} color={AppColors.neutralGray} />
              <Text className="text-sm font-semibold text-neutralInk mt-3">Chưa có thông báo</Text>
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
                className={`p-4 rounded-2xl border mb-3 shadow-sm flex-row items-start gap-3 ${
                  isPayment
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : item.is_read
                    ? 'bg-white border-gray-100 opacity-80'
                    : 'bg-cardWhite border-primary/20'
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center border ${
                    isPayment
                      ? 'bg-emerald-100/70 border-emerald-200'
                      : 'bg-surface border-gray-100'
                  }`}
                >
                  {isPayment ? (
                    <Receipt size={18} color={AppColors.success} />
                  ) : (
                    <Bell size={18} color={AppColors.primary} />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`text-sm mb-0.5 flex-1 ${
                        item.is_read ? 'font-medium text-neutralInk' : 'font-bold text-neutralInk'
                      }`}
                    >
                      {item.title}
                    </Text>
                    {isPayment && (
                      <View className="bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-emerald-800">BIÊN LAI HĐĐT</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-neutralGray">{item.body}</Text>

                  {/* Nút Xem hóa đơn điện tử trực tiếp nếu là thông báo thanh toán */}
                  {isPayment && (
                    <Pressable
                      onPress={() => handleOpenInvoiceFromNotif(item)}
                      className="mt-2.5 self-start bg-emerald-600 active:bg-emerald-700 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 shadow-2xs"
                    >
                      <Text className="text-xs font-bold text-white">Xem hóa đơn</Text>
                    </Pressable>
                  )}

                  <Text className="text-[10px] text-primary font-bold mt-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {!item.is_read && <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />}
              </Pressable>
            );
          }}
        />
      )}

      {/* Modal Hóa Đơn Điện Tử cho Học Viên */}
      <StudentInvoicesModal
        visible={isInvoicesModalOpen}
        onClose={() => setIsInvoicesModalOpen(false)}
      />
    </View>
  );
};
