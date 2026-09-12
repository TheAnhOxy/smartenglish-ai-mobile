import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { searchWordsApi, WordDetail } from '../../data/vocabularyApi';

export const ManageCardsScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [words, setWords] = useState<WordDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchWordsApi({
        search: search,
        cefrLevel: stageFilter !== 'all' ? stageFilter.toUpperCase() : undefined,
        page: 1,
        size: 30
      })
        .then((res) => {
          if (isMounted) {
            setWords(res.items);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, stageFilter]);

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bộ Thẻ Flashcard</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Quản Lý Sổ Tay Từ Vựng</Text>
      <Text className="text-xs text-neutralGray mb-6">Tìm kiếm & lọc danh sách thẻ theo trình độ & từ vựng</Text>

      {/* Search Input */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm từ vựng..."
        className="bg-cardWhite px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm mb-4"
      />

      {/* Stage / CEFR Filter Chips */}
      <View className="flex-row gap-2 mb-6">
        {['all', 'A1', 'A2', 'B1', 'B2', 'C1'].map((st) => (
          <Pressable
            key={st}
            onPress={() => setStageFilter(st)}
            className={`px-3.5 py-1.5 rounded-full border ${
              stageFilter === st ? 'bg-primary border-primary' : 'bg-cardWhite border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase ${
                stageFilter === st ? 'text-white' : 'text-neutralInk'
              }`}
            >
              {st}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B35" size="large" className="my-6" />
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-neutralGray text-center mt-10">Không tìm thấy từ vựng nào.</Text>
          }
          renderItem={({ item }) => (
            <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm flex-row justify-between items-center">
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold text-neutralInk mb-0.5">{item.word}</Text>
                {item.ipaUs ? <Text className="text-xs text-secondary">{item.ipaUs}</Text> : null}
                {item.definitionVi ? (
                  <Text className="text-xs text-neutralGray mt-0.5" numberOfLines={1}>{item.definitionVi}</Text>
                ) : null}
              </View>
              <View className="bg-success/10 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-success">{item.cefrLevel}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};
