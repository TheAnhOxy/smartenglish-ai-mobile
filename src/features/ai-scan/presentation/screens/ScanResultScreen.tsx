import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image as RNImage } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Plus, Bookmark } from 'lucide-react-native';
import { SaveWordSheetModal } from './SaveWordSheetModal';

export const ScanResultScreen = () => {
  const router = useRouter();
  const { scanData } = useLocalSearchParams<{ scanData: string }>();
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const parsed = scanData ? JSON.parse(scanData) : null;
  const objects = parsed?.objects || [
    { id: '1', word: 'Dog', phonetic: '/dɔɡ/', pos: 'Noun', meaning_vi: 'Con chó', word_id: 'w-dog' },
    { id: '2', word: 'Running', phonetic: '/ˈrʌnɪŋ/', pos: 'Verb', meaning_vi: 'Đang chạy', word_id: 'w-running' },
    { id: '3', word: 'Happy', phonetic: '/ˈhæpi/', pos: 'Adj', meaning_vi: 'Hạnh phúc', word_id: 'w-happy' },
    { id: '4', word: 'Grass', phonetic: '/ɡræs/', pos: 'Noun', meaning_vi: 'Bãi cỏ', word_id: 'w-grass' }
  ];

  return (
    <View className="flex-1 bg-[#F8FAF9]">
      {/* Top Half: Scanned Image with Bounding Box Overlays */}
      <View className="w-full h-[45%] relative">
        <RNImage
          source={{ uri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800' }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Back Arrow */}
        <Pressable
          onPress={() => router.back()}
          className="absolute top-12 left-5 w-10 h-10 rounded-full bg-black/40 justify-center items-center backdrop-blur-md z-10"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        {/* Floating "Analysis Complete" Badge */}
        <View className="absolute top-12 right-5 bg-white/90 px-4 py-1.5 rounded-full shadow-md backdrop-blur-md">
          <Text className="text-xs font-bold text-neutralInk">Analysis Complete</Text>
        </View>

        {/* Bounding Box 1: Sky */}
        <View className="absolute top-8 right-20 px-2 py-1 border-2 border-[#FFC93C] bg-[#FFC93C]/20 rounded-md">
          <Text className="text-[10px] font-extrabold text-[#1E293B] bg-[#FFC93C] px-1.5 py-0.5 rounded">Sky</Text>
        </View>

        {/* Bounding Box 2: Dog */}
        <View className="absolute top-24 left-16 w-44 h-36 border-2 border-[#FFC93C] bg-[#FFC93C]/10 rounded-xl justify-start items-start p-1">
          <Text className="text-[10px] font-extrabold text-[#1E293B] bg-[#FFC93C] px-1.5 py-0.5 rounded">Dog</Text>
        </View>

        {/* Bounding Box 3: Grass */}
        <View className="absolute bottom-6 left-8 px-2 py-1 border-2 border-[#FFC93C] bg-[#FFC93C]/20 rounded-md">
          <Text className="text-[10px] font-extrabold text-[#1E293B] bg-[#FFC93C] px-1.5 py-0.5 rounded">Grass</Text>
        </View>
      </View>

      {/* Bottom Half: Vocabulary Results Sheet */}
      <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-3 shadow-2xl">
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

        {/* Section Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-lg font-bold text-neutralInk">Vocabulary</Text>
            <Text className="text-xs text-neutralGray">Found {objects.length} key words</Text>
          </View>

          <Pressable
            onPress={() => setSelectedWordId(objects[0]?.word_id || 'w-dog')}
            className="flex-row items-center gap-1 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full"
          >
            <Plus color="#FF6B35" size={14} />
            <Text className="text-xs font-bold text-[#FF6B35]">Add All to Deck</Text>
          </Pressable>
        </View>

        {/* Word Cards List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="gap-3 pb-8">
            {objects.map((item: any) => {
              const isVerb = item.pos === 'Verb';
              const isAdj = item.pos === 'Adj';
              const badgeBg = isVerb ? 'bg-red-100 text-red-600' : isAdj ? 'bg-gray-100 text-gray-600' : 'bg-cyan-100 text-cyan-700';

              return (
                <View
                  key={item.id}
                  className="bg-surface p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center shadow-sm"
                >
                  <Pressable
                    onPress={() => router.push(`/(student)/practice/scan/${item.word_id}` as any)}
                    className="flex-row items-center gap-3.5 flex-1 mr-2"
                  >
                    {/* Audio Speaker Icon Container */}
                    <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center">
                      <Volume2 color="#0284C7" size={20} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-base font-bold text-neutralInk">{item.word}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${badgeBg.split(' ')[0]}`}>
                          <Text className={`text-[10px] font-bold ${badgeBg.split(' ')[1]}`}>{item.pos}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-neutralGray">{item.phonetic} • {item.meaning_vi}</Text>
                    </View>
                  </Pressable>

                  {/* Save to Flashcard Button */}
                  <Pressable
                    onPress={() => setSelectedWordId(item.word_id)}
                    className="bg-[#FF6B35] px-3 py-2 rounded-xl flex-row items-center gap-1 shadow-sm active:bg-orange-600"
                  >
                    <Bookmark color="#FFFFFF" size={14} fill="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">Lưu Thẻ</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <SaveWordSheetModal
        visible={!!selectedWordId}
        wordId={selectedWordId || ''}
        onClose={() => setSelectedWordId(null)}
      />
    </View>
  );
};
