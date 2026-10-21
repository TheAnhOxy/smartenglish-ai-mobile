import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { RotateCcw, AlertCircle } from 'lucide-react-native';
import { searchWordsApi, WordDetail } from '../../data/vocabularyApi';

interface QuickWordLookupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickWordLookupModal: React.FC<QuickWordLookupModalProps> = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [words, setWords] = useState<WordDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWordIds, setSavedWordIds] = useState<string[]>([]);

  const handleSearch = () => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    searchWordsApi({ search: query.trim() || undefined, page: 1, size: 20 })
      .then((res) => {
        setWords(res.items);
      })
      .catch((err: any) => {
        console.warn('Lookup search error:', err);
        setError(err?.response?.data?.message || err?.message || 'Không thể tra từ lúc này.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, visible]);

  const toggleSaveWord = (wordId: string) => {
    if (savedWordIds.includes(wordId)) {
      setSavedWordIds(savedWordIds.filter((id) => id !== wordId));
    } else {
      setSavedWordIds([...savedWordIds, wordId]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100 h-3/4">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-neutralInk">Tra Từ Điển Nhanh</Text>
            <Pressable onPress={onClose} className="p-1">
              <Text className="text-lg font-bold text-neutralGray">✕</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nhập từ cần tra (vd: Negotiation)..."
            className="bg-surface px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm mb-4"
          />

          {loading && (
            <ActivityIndicator color="#FF6B35" size="large" className="my-6" />
          )}

          {!loading && error && (
            <View className="items-center justify-center p-6 bg-surface rounded-2xl border border-gray-100 my-4">
              <AlertCircle size={32} color="#EF4444" />
              <Text className="text-sm font-bold text-neutralInk mt-2 mb-1">Lỗi tra từ</Text>
              <Text className="text-xs text-neutralGray text-center mb-3">{error}</Text>
              <Pressable
                onPress={handleSearch}
                className="flex-row items-center gap-2 bg-primary px-4 py-2 rounded-xl active:opacity-90"
              >
                <RotateCcw size={14} color="#FFFFFF" />
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
                <Text className="text-sm text-neutralGray text-center mt-10">Không tìm thấy từ vựng phù hợp.</Text>
              }
              renderItem={({ item }) => {
                const isSaved = savedWordIds.includes(item.id);
                return (
                  <View className="bg-surface p-4 rounded-2xl border border-gray-100 mb-3 flex-row justify-between items-center">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-baseline gap-2 mb-0.5">
                        <Text className="text-base font-bold text-neutralInk">{item.word}</Text>
                        {item.ipaUs ? <Text className="text-xs font-semibold text-secondary">{item.ipaUs}</Text> : null}
                      </View>
                      <Text className="text-xs text-neutralGray">({item.partOfSpeech}) • CEFR: {item.cefrLevel}</Text>
                      {item.definitionVi ? (
                        <Text className="text-xs text-neutralInk font-medium mt-1">{item.definitionVi}</Text>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => toggleSaveWord(item.id)}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSaved ? 'bg-success/10 border-success' : 'bg-primary/10 border-primary'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSaved ? 'text-success' : 'text-primary'}`}>
                        {isSaved ? '✓ Đã Lưu' : '+ Lưu Thẻ'}
                      </Text>
                    </Pressable>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
