import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/core/components/BackButton';
import { RotateCcw, AlertCircle, Volume2 } from 'lucide-react-native';
import { searchWordsApi, WordDetail } from '../../data/vocabularyApi';
import { speakText } from '@/src/core/services/speechService';

export const ManageCardsScreen = () => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [words, setWords] = useState<WordDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = () => {
    setLoading(true);
    setError(null);
    searchWordsApi({
      search: search.trim() || undefined,
      cefrLevel: stageFilter !== 'all' ? stageFilter.toUpperCase() : undefined,
      page: 1,
      size: 30,
    })
      .then((res) => {
        setWords(res.items);
      })
      .catch((err: any) => {
        console.warn('Search words error:', err);
        setError(err?.response?.data?.message || err?.message || 'Không thể tìm kiếm từ vựng. Vui lòng thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search, stageFilter]);

  return (
    <View style={{ paddingTop: insets.top + 8 }} className="flex-1 bg-surface px-6 pb-6 dark:bg-darkBg">
      <BackButton style={{ marginBottom: 16 }} />

      <Text className="text-2xl font-bold text-neutralInk mb-1 dark:text-darkInk">Quản Lý Sổ Tay Từ Vựng</Text>
      <Text className="text-xs text-neutralGray mb-6 dark:text-darkMuted">Tìm kiếm & lọc danh sách thẻ theo trình độ & từ vựng</Text>

      {/* Search Input */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm từ vựng..."
        className="bg-cardWhite px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm mb-4 dark:bg-darkCard dark:text-darkInk dark:border-darkLine"
      />

      {/* Stage / CEFR Filter Chips */}
      <View className="flex-row gap-2 mb-6">
        {['all', 'A1', 'A2', 'B1', 'B2', 'C1'].map((st) => (
          <Pressable
            key={st}
            onPress={() => setStageFilter(st)}
            className={`px-3.5 py-1.5 rounded-full border ${
              stageFilter === st ? 'bg-primary border-primary' : 'bg-cardWhite border-gray-200'
            } dark:bg-darkCard dark:border-darkLine`}
          >
            <Text
              className={`text-xs font-bold uppercase ${
                stageFilter === st ? 'text-white' : 'text-neutralInk'
              } dark:text-darkInk`}
            >
              {st}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && (
        <ActivityIndicator color="#0EA5E9" size="large" className="my-6" />
      )}

      {!loading && error && (
        <View className="items-center justify-center p-8 bg-cardWhite rounded-2xl border border-gray-100 my-4 dark:bg-darkCard dark:border-darkLine">
          <AlertCircle size={36} color="#EF4444" />
          <Text className="text-base font-bold text-neutralInk mt-3 mb-1 dark:text-darkInk">Lỗi kết nối máy chủ</Text>
          <Text className="text-xs text-neutralGray text-center mb-4 dark:text-darkMuted">{error}</Text>
          <Pressable
            onPress={fetchWords}
            className="flex-row items-center gap-2 bg-primary px-5 py-2.5 rounded-xl active:opacity-90"
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs">Thử lại</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={words}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-sm text-neutralGray text-center mt-10 dark:text-darkMuted">Không tìm thấy từ vựng nào.</Text>
          }
          renderItem={({ item }) => (
            <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm flex-row justify-between items-center dark:bg-darkCard dark:border-darkLine">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-base font-bold text-neutralInk dark:text-darkInk">{item.word}</Text>
                  <Pressable
                    onPress={() => speakText(item.word, { language: 'en-US' })}
                    className="p-1 rounded-full bg-primary/10 active:opacity-70"
                    accessibilityLabel="Phát âm"
                  >
                    <Volume2 size={14} color="#0EA5E9" />
                  </Pressable>
                </View>
                {item.ipaUs ? <Text className="text-xs text-secondary">{item.ipaUs}</Text> : null}
                {item.definitionVi ? (
                  <Text className="text-xs text-neutralGray mt-0.5 dark:text-darkMuted" numberOfLines={1}>{item.definitionVi}</Text>
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
