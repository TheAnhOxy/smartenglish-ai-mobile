import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MOCK_CONVERSATIONS } from '../../data/chatbotApi';

export const ChatConversationsScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Lựa Chọn Luyện Tập</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Trợ Lý Học Tập Sparky ⚡</Text>
      <Text className="text-xs text-neutralGray mb-6">Trò chuyện giải đáp thắc mắc ngữ pháp & từ vựng cùng Sparky</Text>

      <FlatList
        data={MOCK_CONVERSATIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(student)/practice/chatbot/${item.id}` as any)}
            className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-3 shadow-sm active:bg-gray-50 flex-row items-center gap-4"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 justify-center items-center">
              <Text className="text-2xl">⚡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutralInk mb-0.5">{item.title}</Text>
              <Text className="text-xs text-neutralGray line-clamp-1">{item.last_message}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};
