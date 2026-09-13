import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/src/theme';

const SHOP_ITEMS = [
  { id: 'item-1', name: 'Đông Băng Streak (Streak Freeze)', desc: 'Bảo vệ chuỗi Streak trong 1 ngày bỏ lỡ học', price: 200, icon: '❄️' },
  { id: 'item-2', name: 'Nhân Đôi XP (2x XP Boost)', desc: 'Nhân đôi XP tích lũy trong 15 phút ôn thẻ', price: 300, icon: '⚡' },
  { id: 'item-3', name: 'Khung Avatar Kim Cương', desc: 'Trang trí hồ sơ cá nhân độc quyền', price: 500, icon: '💎' }
];

export const ShopScreen = () => {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bảng Xếp Hạng</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Cửa Hàng Vật Phẩm 🛒</Text>
      <Text className="text-xs text-neutralGray mb-6">Đổi Coin lấy vật phẩm hỗ trợ học tập & bảo vệ Streak</Text>

      <View className="gap-4">
        {SHOP_ITEMS.map((item) => (
          <View key={item.id} className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm">
            <Text className="text-3xl">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutralInk mb-0.5">{item.name}</Text>
              <Text className="text-xs text-neutralGray mb-2">{item.desc}</Text>
              <Pressable
                onPress={() => alert(`Đã mua ${item.name} thành công!`)}
                style={{ backgroundColor: colors.coinSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.coinBorder, alignSelf: 'flex-start' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.coinDeep }}>Mua ({item.price} 🪙)</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
