import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useDecksQuery } from '../../application/useFlashcardSrs';
import { useRouter } from 'expo-router';

export const DecksScreen = () => {
  const router = useRouter();
  const { data: decks, isLoading, refetch } = useDecksQuery();

  return (
    <View className="flex-1 bg-surface px-6 pt-14 pb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-neutralInk">Bộ Thẻ Flashcard SRS</Text>
          <Text className="text-xs text-neutralGray mt-0.5">Thuật toán SuperMemo-2 tối ưu độ nhớ</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(student)/review/topics' as any)}
          className="bg-secondary/10 px-3 py-1.5 rounded-full"
        >
          <Text className="text-xs font-bold text-secondary">Thư Viện Chủ Đề</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FF6B35" size="large" />
        </View>
      ) : (
        <FlatList
          data={decks || []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(student)/review/decks/${item.id}/study` as any)}
              className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm active:bg-gray-50 flex-row justify-between items-center"
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-bold text-neutralInk mb-1">{item.name}</Text>
                <Text className="text-xs text-neutralGray line-clamp-1">{item.description}</Text>
                <Text className="text-[10px] text-primary font-bold mt-2">Mã chia sẻ: {item.shared_code}</Text>
              </View>

              {/* Due Count Badge */}
              <View className="bg-primary px-3 py-2 rounded-xl items-center shadow-sm">
                <Text className="text-white font-extrabold text-base">{item.card_count}</Text>
                <Text className="text-white font-semibold text-[9px] uppercase">Thẻ Due</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};
