import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useReferralQuery } from '../../application/useReferralIot';

export const ReferralScreen = () => {
  const router = useRouter();
  const { data: refData, isLoading } = useReferralQuery();

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Hồ Sơ Cá Nhân</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Mời Bạn Bè Nhận Premium 🎁</Text>
      <Text className="text-xs text-neutralGray mb-6">Mỗi bạn bè đăng ký qua mã của bạn, cả 2 nhận 7 ngày Premium miễn phí</Text>

      {isLoading ? (
        <ActivityIndicator color="#FF6B35" size="large" />
      ) : (
        <View className="gap-6">
          {/* Referral Code Box */}
          <View className="bg-cardWhite p-6 rounded-3xl border border-gray-100 items-center shadow-sm">
            <Text className="text-xs text-neutralGray uppercase font-bold mb-2">Mã Giới Thiệu Của Bạn</Text>
            <View className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/30 mb-3">
              <Text className="text-2xl font-extrabold text-primary letter-spacing-widest">
                {refData?.referral_code}
              </Text>
            </View>
            <Pressable
              onPress={() => alert('Đã sao chép mã giới thiệu vào bộ nhớ tạm!')}
              className="bg-primary px-6 py-2.5 rounded-xl shadow-sm active:bg-primaryDark"
            >
              <Text className="text-white font-bold text-xs">📋 Sao Chép Mã</Text>
            </Pressable>
          </View>

          {/* Referral Stats */}
          <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row justify-around shadow-sm">
            <View className="items-center">
              <Text className="text-xs text-neutralGray font-medium mb-1">Số Bạn Đã Mời</Text>
              <Text className="text-2xl font-bold text-secondary">{refData?.invited_count} người</Text>
            </View>
            <View className="w-[1px] bg-gray-200 h-full" />
            <View className="items-center">
              <Text className="text-xs text-neutralGray font-medium mb-1">Số Ngày Premium Thưởng</Text>
              <Text className="text-2xl font-bold text-success">+{refData?.reward_days_earned} ngày</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
