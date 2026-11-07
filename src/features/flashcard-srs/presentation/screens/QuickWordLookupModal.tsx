import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { RotateCcw, AlertCircle, Volume2, Sparkles, BookOpen } from 'lucide-react-native';
import { searchWordsApi, lookupWordApi, WordDetail } from '../../data/vocabularyApi';
import { speakText } from '@/src/core/services/speechService';

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
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!visible) return;
    const cleanQuery = query.trim();
    setLoading(true);
    setError(null);
    try {
      const res = await searchWordsApi({ search: cleanQuery || undefined, page: 1, size: 20 });
      if (res.items && res.items.length > 0) {
        setWords(res.items);
      } else if (cleanQuery.length >= 2) {
        // Fallback kích hoạt lookup chính xác tầng 2 nếu search chưa trả về kịp
        const exactWord = await lookupWordApi(cleanQuery);
        if (exactWord) {
          setWords([exactWord]);
        } else {
          setWords([]);
        }
      } else {
        setWords([]);
      }
    } catch (err: any) {
      console.warn('Lookup search error:', err);
      // Nếu search báo lỗi nhưng có query hợp lệ, thử tra cứu tầng 2
      if (cleanQuery.length >= 2) {
        try {
          const fallbackWord = await lookupWordApi(cleanQuery);
          if (fallbackWord) {
            setWords([fallbackWord]);
            setLoading(false);
            return;
          }
        } catch (_) {}
      }
      setError(err?.response?.data?.message || err?.message || 'Không thể tra từ lúc này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      handleSearch();
    }, 350);

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

  const handlePlayAudio = (word: string) => {
    setPlayingWord(word);
    speakText(word, {
      language: 'en-US',
      onDone: () => setPlayingWord(null),
      onError: () => setPlayingWord(null),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100 h-4/5">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <BookOpen size={20} color="#FF6B35" />
              <Text className="text-xl font-bold text-neutralInk">Tra Từ Điển Thông Minh</Text>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Text className="text-lg font-bold text-neutralGray">✕</Text>
            </Pressable>
          </View>

          <Text className="text-[11px] text-neutralGray mb-3 flex-row items-center">
            ⚡ Hệ thống tra cứu CSDL nội bộ kết hợp từ điển trực tuyến quốc tế (Free Dictionary, Oxford)
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nhập từ hoặc cụm từ cần tra (vd: Negotiation, look after)..."
            className="bg-surface px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm mb-3"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loading && (
            <View className="my-6 items-center">
              <ActivityIndicator color="#FF6B35" size="large" />
              <Text className="text-xs text-neutralGray mt-2">Đang tra cứu từ điển CSDL & Online...</Text>
            </View>
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
                <View className="items-center justify-center mt-12 px-4">
                  <Text className="text-sm text-neutralGray text-center">
                    {query.trim()
                      ? `Chưa tìm thấy từ phù hợp cho "${query.trim()}". Hãy nhập từ tiếng Anh chuẩn xác để kích hoạt từ điển online.`
                      : 'Nhập từ vựng tiếng Anh bất kỳ để tra cứu nghĩa, phiên âm và phát âm.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSaved = savedWordIds.includes(item.id);
                const isSpeaking = playingWord === item.word;
                const firstExample = item.examples && item.examples.length > 0 ? item.examples[0] : null;

                return (
                  <View className="bg-surface p-4 rounded-2xl border border-gray-100 mb-3 shadow-xs">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-lg font-bold text-neutralInk">{item.word}</Text>
                          <Pressable
                            onPress={() => handlePlayAudio(item.word)}
                            className={`p-1.5 rounded-full ${isSpeaking ? 'bg-primary' : 'bg-primary/10'}`}
                            accessibilityLabel="Phát âm"
                          >
                            <Volume2 size={16} color={isSpeaking ? '#FFFFFF' : '#FF6B35'} />
                          </Pressable>
                        </View>
                        <View className="flex-row items-center gap-2">
                          {item.ipaUs ? (
                            <Text className="text-xs font-semibold text-secondary">{item.ipaUs}</Text>
                          ) : null}
                          <Text className="text-xs text-neutralGray">({item.partOfSpeech})</Text>
                          <View className="bg-success/15 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-success uppercase">{item.cefrLevel || 'B1'}</Text>
                          </View>
                        </View>
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

                    {item.definitionVi ? (
                      <View className="mt-1 bg-cardWhite p-2.5 rounded-xl border border-gray-100">
                        <Text className="text-xs font-medium text-neutralInk leading-5">
                          <Text className="font-bold text-primary">Nghĩa: </Text>
                          {item.definitionVi}
                        </Text>
                        {item.definitionEn && item.definitionEn !== item.definitionVi ? (
                          <Text className="text-[11px] text-neutralGray mt-1 italic leading-4">
                            {item.definitionEn}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {firstExample && firstExample.sentenceEn ? (
                      <View className="mt-2 pl-2 border-l-2 border-primary/40">
                        <Text className="text-xs text-neutralInk italic leading-5">
                          "{firstExample.sentenceEn}"
                        </Text>
                        {firstExample.sentenceVi ? (
                          <Text className="text-[11px] text-neutralGray mt-0.5">
                            {firstExample.sentenceVi}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
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
