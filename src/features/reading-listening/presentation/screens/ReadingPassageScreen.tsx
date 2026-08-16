import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePassageQuery } from '../../application/useReadingListening';
import { QuickWordLookupModal } from '@/src/features/flashcard-srs/presentation/screens/QuickWordLookupModal';

export const ReadingPassageScreen = () => {
  const { passageId } = useLocalSearchParams<{ passageId: string }>();
  const router = useRouter();
  const { data: passage, isLoading } = usePassageQuery(passageId || 'pass-101');
  const [showTranslate, setShowTranslate] = useState(false);
  const [showDictLookup, setShowDictLookup] = useState(false);

  if (isLoading || !passage) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-6">
      <View className="flex-1">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Bài Tập Đọc Hiểu</Text>
        </Pressable>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-bold text-neutralInk flex-1 mr-2">{passage.title}</Text>
          <View className="bg-secondary/20 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-secondary">{passage.cefr_level}</Text>
          </View>
        </View>

        {/* Translation Toggle */}
        <Pressable
          onPress={() => setShowTranslate(!showTranslate)}
          className="self-start bg-primary/10 border border-primary/30 px-3 py-1 rounded-full mb-4"
        >
          <Text className="text-xs font-bold text-primary">
            {showTranslate ? '🙈 Ẩn Dịch Tiếng Việt' : '👁️ Hiện Dịch Tiếng Việt'}
          </Text>
        </Pressable>

        {/* Dual Split Reader */}
        <ScrollView className="flex-1 bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm" showsVerticalScrollIndicator={false}>
          <Text className="text-base text-neutralInk leading-7 mb-4 font-medium">
            {passage.content_en}
          </Text>

          {showTranslate && (
            <View className="bg-surface p-4 rounded-xl border border-gray-200 border-dashed">
              <Text className="text-xs font-bold text-secondary mb-1">Bản Dịch Tiếng Việt:</Text>
              <Text className="text-xs text-neutralInk leading-5">{passage.content_vi}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Dictionary Tap-to-Translate Button */}
      <Pressable
        onPress={() => setShowDictLookup(true)}
        className="bg-secondary py-3.5 rounded-xl items-center shadow-md active:bg-secondary/90"
      >
        <Text className="text-white font-bold text-base">🔍 Tra Từ Trong Bài</Text>
      </Pressable>

      <QuickWordLookupModal visible={showDictLookup} onClose={() => setShowDictLookup(false)} />
    </View>
  );
};
