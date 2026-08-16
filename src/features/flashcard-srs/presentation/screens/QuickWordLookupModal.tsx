import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { MOCK_WORDS } from '@/src/core/data/mockData';
import { Word } from '@/src/core/types/schema';

interface QuickWordLookupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickWordLookupModal: React.FC<QuickWordLookupModalProps> = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [savedWordIds, setSavedWordIds] = useState<string[]>([]);

  const filteredWords = query
    ? MOCK_WORDS.filter((w) => w.word.toLowerCase().includes(query.toLowerCase()))
    : MOCK_WORDS;

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

          <FlatList
            data={filteredWords}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSaved = savedWordIds.includes(item.id);
              return (
                <View className="bg-surface p-4 rounded-2xl border border-gray-100 mb-3 flex-row justify-between items-center">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-baseline gap-2 mb-0.5">
                      <Text className="text-base font-bold text-neutralInk">{item.word}</Text>
                      <Text className="text-xs font-semibold text-secondary">{item.ipa_us}</Text>
                    </View>
                    <Text className="text-xs text-neutralGray">({item.part_of_speech}) • CEFR: {item.cefr_level}</Text>
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
        </View>
      </View>
    </Modal>
  );
};
