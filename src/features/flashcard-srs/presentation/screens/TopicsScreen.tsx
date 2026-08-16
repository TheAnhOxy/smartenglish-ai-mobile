import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_TOPICS = [
  { id: 1, name_vi: 'Du Lịch & Khách Sạn', name_en: 'Travel & Hospitality', emoji: '✈️', color: '#FF6B35', count: 45 },
  { id: 2, name_vi: 'Ẩm Thực & Nhà Hàng', name_en: 'Food & Dining', emoji: '🍜', color: '#2ECC71', count: 30 },
  { id: 3, name_vi: 'Kinh Doanh & Thương Mại', name_en: 'Business & Trade', emoji: '💼', color: '#0F7173', count: 60 },
  { id: 4, name_vi: 'Công Nghệ & AI', name_en: 'Technology & AI', emoji: '💻', color: '#3B82F6', count: 50 }
];

export const TopicsScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bộ Thẻ Flashcard</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Thư Viện Chủ Đề</Text>
      <Text className="text-xs text-neutralGray mb-6">Chọn chủ đề từ vựng được biên soạn sẵn bởi hệ thống</Text>

      <FlatList
        data={MOCK_TOPICS}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(student)/review/decks/deck-toeic-essential/study` as any)}
            className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm flex-row items-center gap-4 active:bg-gray-50"
          >
            <View className="w-14 h-14 rounded-2xl items-center justify-center bg-surface border border-gray-100">
              <Text className="text-3xl">{item.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutralInk mb-0.5">{item.name_vi}</Text>
              <Text className="text-xs text-neutralGray">{item.name_en}</Text>
            </View>
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-neutralInk">{item.count} từ</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};
