import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MOCK_WORDS } from '@/src/core/data/mockData';

export const ManageCardsScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const filteredWords = MOCK_WORDS.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Bộ Thẻ Flashcard</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Quản Lý Sổ Tay Từ Vựng</Text>
      <Text className="text-xs text-neutralGray mb-6">Tìm kiếm & lọc danh sách thẻ theo trạng thái ghi nhớ</Text>

      {/* Search Input */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm từ vựng..."
        className="bg-cardWhite px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm mb-4"
      />

      {/* Stage Filter Chips */}
      <View className="flex-row gap-2 mb-6">
        {['all', 'new', 'learning', 'mastered'].map((st) => (
          <Pressable
            key={st}
            onPress={() => setStageFilter(st)}
            className={`px-3.5 py-1.5 rounded-full border ${
              stageFilter === st ? 'bg-primary border-primary' : 'bg-cardWhite border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold capitalize ${
                stageFilter === st ? 'text-white' : 'text-neutralInk'
              }`}
            >
              {st}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm flex-row justify-between items-center">
            <View>
              <Text className="text-base font-bold text-neutralInk mb-0.5">{item.word}</Text>
              <Text className="text-xs text-secondary">{item.ipa_us}</Text>
            </View>
            <View className="bg-success/10 px-2.5 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-success">Mastered</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};
