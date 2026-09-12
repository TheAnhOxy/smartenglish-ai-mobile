import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getTopicsApi, VocabTopic } from '../../data/vocabularyApi';

export const TopicsScreen = () => {
  const router = useRouter();
  const [topics, setTopics] = useState<VocabTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopicsApi().then((res) => {
      setTopics(res);
      setLoading(false);
    });
  }, []);

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bộ Thẻ Flashcard</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Thư Viện Chủ Đề</Text>
      <Text className="text-xs text-neutralGray mb-6">Chọn chủ đề từ vựng được biên soạn sẵn bởi hệ thống</Text>

      {loading ? (
        <ActivityIndicator color="#FF6B35" size="large" />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-neutralGray text-center mt-10">Chưa có chủ đề nào.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(student)/review/decks/deck-toeic-essential/study` as any)}
              className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm flex-row items-center gap-4 active:bg-gray-50"
            >
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-surface border border-gray-100">
                <Text className="text-3xl">{item.iconUrl || '📚'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-neutralInk mb-0.5">{item.name}</Text>
                {item.description ? (
                  <Text className="text-xs text-neutralGray" numberOfLines={1}>{item.description}</Text>
                ) : null}
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-neutralInk">{item.wordCount || 0} từ</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};
