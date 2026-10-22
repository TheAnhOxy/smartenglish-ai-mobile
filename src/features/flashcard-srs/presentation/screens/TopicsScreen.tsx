import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { RotateCcw, AlertCircle } from 'lucide-react-native';
import { getTopicsApi, VocabTopic } from '../../data/vocabularyApi';

export const TopicsScreen = () => {
  const router = useRouter();
  const [topics, setTopics] = useState<VocabTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTopicsApi();
      setTopics(res);
    } catch (err: any) {
      console.warn('Error loading topics:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách chủ đề. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bộ Thẻ Flashcard</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Thư Viện Chủ Đề</Text>
      <Text className="text-xs text-neutralGray mb-6">Chọn chủ đề từ vựng được biên soạn sẵn bởi hệ thống</Text>

      {loading && (
        <ActivityIndicator color="#FF6B35" size="large" className="my-10" />
      )}

      {!loading && error && (
        <View className="items-center justify-center p-8 bg-cardWhite rounded-2xl border border-gray-100 my-4">
          <AlertCircle size={36} color="#EF4444" />
          <Text className="text-base font-bold text-neutralInk mt-3 mb-1">Lỗi tải dữ liệu</Text>
          <Text className="text-xs text-neutralGray text-center mb-4">{error}</Text>
          <Pressable
            onPress={loadTopics}
            className="flex-row items-center gap-2 bg-primary px-5 py-2.5 rounded-xl active:opacity-90"
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs">Thử lại</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-neutralGray text-center mt-10">Chưa có chủ đề nào.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/(student)/review/decks/[deckId]/study`,
                  params: {
                    deckId: item.id,
                    topicId: item.id,
                    deckName: item.name,
                  },
                } as any)
              }
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
