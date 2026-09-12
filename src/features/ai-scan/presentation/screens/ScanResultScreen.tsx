import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image as RNImage, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Plus, Bookmark, VolumeX, CheckCircle2, X, Sparkles } from 'lucide-react-native';
import { SaveWordSheetModal } from './SaveWordSheetModal';
import { speakText, stopSpeech } from '@/src/core/services/speechService';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';

// Distinct color palettes for up to 5 detected objects
const OBJECT_COLORS = [
  {
    name: 'cyan',
    borderColor: '#00F2FE',
    bgColor: 'rgba(0, 242, 254, 0.2)',
    selectedBgColor: 'rgba(0, 242, 254, 0.45)',
    tagBg: 'bg-[#00F2FE]',
    tagText: 'text-[#042A36]',
    cardBorder: 'border-[#00F2FE]',
    cardBg: 'bg-[#ECFEFF]',
    cardDot: 'bg-[#00F2FE]',
    speakerBg: 'bg-[#00F2FE]/20 text-[#0891B2]',
  },
  {
    name: 'amber',
    borderColor: '#FF9F1C',
    bgColor: 'rgba(255, 159, 28, 0.2)',
    selectedBgColor: 'rgba(255, 159, 28, 0.45)',
    tagBg: 'bg-[#FF9F1C]',
    tagText: 'text-[#3B1C00]',
    cardBorder: 'border-[#FF9F1C]',
    cardBg: 'bg-[#FFFBEB]',
    cardDot: 'bg-[#FF9F1C]',
    speakerBg: 'bg-[#FF9F1C]/20 text-[#D97706]',
  },
  {
    name: 'emerald',
    borderColor: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.2)',
    selectedBgColor: 'rgba(16, 185, 129, 0.45)',
    tagBg: 'bg-[#10B981]',
    tagText: 'text-white',
    cardBorder: 'border-[#10B981]',
    cardBg: 'bg-[#ECFDF5]',
    cardDot: 'bg-[#10B981]',
    speakerBg: 'bg-[#10B981]/20 text-[#059669]',
  },
  {
    name: 'purple',
    borderColor: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.2)',
    selectedBgColor: 'rgba(168, 85, 247, 0.45)',
    tagBg: 'bg-[#A855F7]',
    tagText: 'text-white',
    cardBorder: 'border-[#A855F7]',
    cardBg: 'bg-[#FAF5FF]',
    cardDot: 'bg-[#A855F7]',
    speakerBg: 'bg-[#A855F7]/20 text-[#9333EA]',
  },
  {
    name: 'rose',
    borderColor: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.2)',
    selectedBgColor: 'rgba(244, 63, 94, 0.45)',
    tagBg: 'bg-[#F43F5E]',
    tagText: 'text-white',
    cardBorder: 'border-[#F43F5E]',
    cardBg: 'bg-[#FFF1F2]',
    cardDot: 'bg-[#F43F5E]',
    speakerBg: 'bg-[#F43F5E]/20 text-[#E11D48]',
  },
];

export const ScanResultScreen = () => {
  const router = useRouter();
  const { imageUri, scanData } = useLocalSearchParams<{ imageUri?: string; scanData?: string }>();
  const { savedWords } = useDeckStore();

  const [itemsToSave, setItemsToSave] = useState<any[] | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const parsed = scanData ? JSON.parse(scanData) : null;
  const objects = (parsed?.objects || [
    {
      id: '1',
      word_id: 'w-electric-fan',
      word: 'Electric Fan',
      phonetic: "/ɪ'lektrɪk fæn/",
      pos: 'Noun',
      meaning_vi: 'Quạt điện',
      bounding_box: { x: 50, y: 50, width: 190, height: 180 },
      examples: {
        easy: 'Turn on the electric fan.',
        medium: 'The electric fan keeps the room cool during summer.',
        hard: 'Electric fans are energy-efficient household cooling appliances.'
      }
    },
    {
      id: '2',
      word_id: 'w-rice-cooker',
      word: 'Rice Cooker',
      phonetic: "/raɪs 'kʊk.ər/",
      pos: 'Noun',
      meaning_vi: 'Nồi cơm điện',
      bounding_box: { x: 170, y: 20, width: 110, height: 100 },
      examples: {
        easy: 'The rice cooker makes delicious rice.',
        medium: 'An electric rice cooker automates the steaming process.',
        hard: 'Modern smart rice cookers utilize induction heating technology.'
      }
    }
  ]).slice(0, 5); // Max 5 items

  const displayImageUri = imageUri || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800';

  const handlePlayAudio = (wordId: string, wordText: string) => {
    setSelectedBoxId(wordId);
    if (playingWordId === wordId) {
      stopSpeech();
      setPlayingWordId(null);
      return;
    }

    setPlayingWordId(wordId);
    speakText(wordText, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlayingWordId(null),
      onError: () => setPlayingWordId(null)
    });
  };

  const handleOpenDetail = (item: any) => {
    setSelectedDetailItem(item);
  };

  const isWordSaved = (wordId: string) => {
    return savedWords.some((w) => w.word_id === wordId);
  };

  return (
    <View className="flex-1 bg-[#F8FAF9]">
      {/* Top Half: Scanned Image with Per-Object Distinct Color Bounding Boxes */}
      <View className="w-full h-[46%] relative bg-black justify-center items-center overflow-hidden">
        <RNImage
          source={{ uri: displayImageUri }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Back Arrow Button: Returns to Camera Scanner Screen */}
        <Pressable
          onPress={() => router.push('/(student)/practice/scan' as any)}
          className="absolute top-12 left-5 w-10 h-10 rounded-full bg-black/60 justify-center items-center backdrop-blur-md z-30 border border-white/20 active:bg-black/80"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        {/* Floating Top Badge */}
        <View className="absolute top-12 right-5 bg-black/70 border border-white/20 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md z-30 flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-emerald-400" />
          <Text className="text-xs font-bold text-white tracking-wide">Nhận Diện {objects.length} Vật Thể ✨</Text>
        </View>

        {/* Dynamic Multi-Color Bounding Box Rectangles Overlaid on Scanned Image */}
        {objects.map((item: any, idx: number) => {
          const box = item.bounding_box || { x: 30 + idx * 50, y: 40 + idx * 40, width: 120, height: 80 };
          const colorTheme = OBJECT_COLORS[idx % OBJECT_COLORS.length];
          const isPlaying = playingWordId === item.word_id;
          const isSelected = selectedBoxId === item.word_id;
          const isSaved = isWordSaved(item.word_id);

          // Convert 300x300 grid coordinates to relative canvas percentages
          const leftPct = Math.min(Math.max((box.x / 300) * 100, 2), 80);
          const topPct = Math.min(Math.max((box.y / 300) * 100, 4), 80);
          const widthPct = Math.min(Math.max((box.width / 300) * 100, 16), 96 - leftPct);
          const heightPct = Math.min(Math.max((box.height / 300) * 100, 12), 92 - topPct);

          const activeBorderColor = isPlaying || isSelected ? '#FFFFFF' : colorTheme.borderColor;
          const activeBgColor = isPlaying || isSelected ? colorTheme.selectedBgColor : colorTheme.bgColor;

          return (
            <Pressable
              key={item.id || idx}
              onPress={() => handlePlayAudio(item.word_id, item.word)}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                borderColor: activeBorderColor,
                backgroundColor: activeBgColor,
                borderWidth: isPlaying || isSelected ? 3 : 2,
              }}
              className={`rounded-2xl justify-between p-1 z-20 shadow-2xl backdrop-blur-xs ${
                isPlaying || isSelected ? 'scale-[1.03]' : ''
              }`}
            >
              {/* Corner Floating Object Label Tag with Distinct Theme Color */}
              <View className="self-start -mt-3.5 -ml-1">
                <Text className={`text-[10px] font-black px-2 py-0.5 rounded-md shadow-md ${colorTheme.tagBg} ${colorTheme.tagText}`}>
                  #{idx + 1} {item.word} {isSaved ? '✓' : ''}
                </Text>
              </View>

              {/* Center Target Indicator Crosshair */}
              <View className="self-center items-center justify-center opacity-60">
                <View className="w-2.5 h-2.5 rounded-full border border-white" />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Half: Vocabulary Results Sheet with Matching Theme Colors */}
      <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-3 shadow-2xl">
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

        {/* Section Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-lg font-bold text-neutralInk">Từ Vựng Nhận Diện Khoanh Vùng</Text>
            <Text className="text-xs text-neutralGray">Được phân màu tương ứng với từng vật thể</Text>
          </View>

          {/* Batch Save All Button */}
          <Pressable
            onPress={() => setItemsToSave(objects)}
            className="flex-row items-center gap-1.5 bg-orange-50 border border-orange-200 px-3.5 py-2 rounded-full active:bg-orange-100 shadow-sm"
          >
            <Plus color="#FF6B35" size={14} />
            <Text className="text-xs font-bold text-[#FF6B35]">Lưu Tất Cả Thẻ</Text>
          </Pressable>
        </View>

        {/* Word Cards List with Corresponding Colors */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="gap-3 pb-8">
            {objects.map((item: any, idx: number) => {
              const colorTheme = OBJECT_COLORS[idx % OBJECT_COLORS.length];
              const isVerb = item.pos === 'Verb';
              const isAdj = item.pos === 'Adj' || item.pos === 'Adjective';
              const badgeBg = isVerb ? 'bg-red-100 text-red-600' : isAdj ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700';
              const isPlayingThis = playingWordId === item.word_id;
              const isSelected = selectedBoxId === item.word_id;
              const isSaved = isWordSaved(item.word_id);

              return (
                <View
                  key={item.id}
                  className={`p-3 rounded-2xl border-2 flex-row justify-between items-center shadow-sm overflow-hidden ${colorTheme.cardBg} ${colorTheme.cardBorder} ${
                    isSelected ? 'scale-[1.01]' : ''
                  }`}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedBoxId(item.word_id);
                      handleOpenDetail(item);
                    }}
                    className="flex-1 flex-row items-center gap-2 mr-2 overflow-hidden"
                  >
                    {/* Object Color Identifier Pill */}
                    <View className={`w-4 h-4 rounded-full ${colorTheme.cardDot} justify-center items-center shadow-xs shrink-0`}>
                      <Text className="text-[9px] font-extrabold text-white">{idx + 1}</Text>
                    </View>

                    {/* Audio Speaker Icon Button */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(item.word_id, item.word);
                      }}
                      className={`w-9 h-9 rounded-full justify-center items-center shrink-0 ${
                        isPlayingThis ? 'bg-[#FF6B35]' : 'bg-white border border-gray-200 active:bg-gray-100'
                      }`}
                    >
                      {isPlayingThis ? (
                        <VolumeX color="#FFFFFF" size={16} />
                      ) : (
                        <Volume2 color={colorTheme.borderColor} size={16} />
                      )}
                    </Pressable>

                    <View className="flex-1 mr-1">
                      <View className="flex-row items-center gap-1.5 mb-0.5 flex-wrap">
                        <Text className="text-sm font-extrabold text-neutralInk" numberOfLines={1}>{item.word}</Text>
                        <View className={`px-1.5 py-0.5 rounded-full ${badgeBg.split(' ')[0]}`}>
                          <Text className={`text-[9px] font-bold ${badgeBg.split(' ')[1]}`}>{item.pos}</Text>
                        </View>
                      </View>
                      <Text className="text-[11px] text-neutralGray font-medium" numberOfLines={1}>{item.phonetic} • {item.meaning_vi}</Text>
                    </View>
                  </Pressable>

                  {/* Save / Saved Indicator Button */}
                  <Pressable
                    onPress={() => setItemsToSave([item])}
                    className={`px-2.5 py-1.5 rounded-xl flex-row items-center gap-1 shadow-sm shrink-0 ${
                      isSaved ? 'bg-emerald-600' : 'bg-[#FF6B35] active:bg-orange-600'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle2 color="#FFFFFF" size={13} />
                        <Text className="text-[11px] font-bold text-white">Đã Lưu</Text>
                      </>
                    ) : (
                      <>
                        <Bookmark color="#FFFFFF" size={13} fill="#FFFFFF" />
                        <Text className="text-[11px] font-bold text-white">Lưu Thẻ</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <SaveWordSheetModal
        visible={!!itemsToSave}
        itemsToSave={itemsToSave || []}
        onClose={() => setItemsToSave(null)}
      />

      {/* Word Detail In-Screen Bottom Sheet Modal */}
      <Modal
        visible={!!selectedDetailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetailItem(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setSelectedDetailItem(null)} />
          
          <View className="bg-white rounded-t-3xl p-6 border-t border-gray-100 shadow-2xl max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Sparkles color="#FF6B35" size={18} />
                <Text className="text-lg font-bold text-neutralInk">Chi Tiết Từ Vựng AI</Text>
              </View>

              <Pressable
                onPress={() => setSelectedDetailItem(null)}
                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
              >
                <X color="#64748B" size={18} />
              </Pressable>
            </View>

            {selectedDetailItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Word Header Card */}
                <View className="bg-[#F8FAF9] p-5 rounded-2xl border border-gray-100 items-center mb-4">
                  <Text className="text-2xl font-black text-neutralInk mb-1">{selectedDetailItem.word}</Text>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-sm text-neutralGray font-medium">{selectedDetailItem.phonetic}</Text>
                    <Pressable
                      onPress={() => handlePlayAudio(selectedDetailItem.word_id, selectedDetailItem.word)}
                      className="w-8 h-8 rounded-full bg-[#FF6B35] items-center justify-center active:bg-orange-600"
                    >
                      <Volume2 color="#FFFFFF" size={16} />
                    </Pressable>
                  </View>
                  <View className="bg-cyan-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-cyan-800">{selectedDetailItem.pos}</Text>
                  </View>
                </View>

                {/* Meaning Section */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-neutralGray uppercase mb-1">Nghĩa tiếng Việt</Text>
                  <View className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <Text className="text-sm font-semibold text-neutralInk">{selectedDetailItem.meaning_vi}</Text>
                  </View>
                </View>

                {/* Example Sentences */}
                {selectedDetailItem.examples && (
                  <View className="mb-6">
                    <Text className="text-xs font-bold text-neutralGray uppercase mb-1.5">Câu ví dụ ngữ cảnh</Text>
                    <View className="gap-2">
                      {selectedDetailItem.examples.easy && (
                        <View className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <Text className="text-[10px] font-bold text-orange-600 uppercase mb-0.5">Dễ (Beginner)</Text>
                          <Text className="text-xs font-medium text-slate-700">{selectedDetailItem.examples.easy}</Text>
                        </View>
                      )}
                      {selectedDetailItem.examples.medium && (
                        <View className="bg-cyan-50 p-3 rounded-xl border border-cyan-100">
                          <Text className="text-[10px] font-bold text-cyan-600 uppercase mb-0.5">Trung Bình (Medium)</Text>
                          <Text className="text-xs font-medium text-slate-700">{selectedDetailItem.examples.medium}</Text>
                        </View>
                      )}
                      {selectedDetailItem.examples.hard && (
                        <View className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                          <Text className="text-[10px] font-bold text-purple-600 uppercase mb-0.5">Nâng Cao (Advanced)</Text>
                          <Text className="text-xs font-medium text-slate-700">{selectedDetailItem.examples.hard}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Save Button */}
                <Pressable
                  onPress={() => {
                    setItemsToSave([selectedDetailItem]);
                    setSelectedDetailItem(null);
                  }}
                  className="bg-[#FF6B35] py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-md active:bg-orange-600 mb-2"
                >
                  <Bookmark color="#FFFFFF" size={16} fill="#FFFFFF" />
                  <Text className="text-sm font-bold text-white">Lưu Vào Bộ Thẻ Flashcard</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
