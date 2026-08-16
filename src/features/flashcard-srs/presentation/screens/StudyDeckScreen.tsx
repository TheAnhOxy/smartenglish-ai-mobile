import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDeckDueCardsQuery, useRateCardMutation } from '../../application/useFlashcardSrs';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { SrsRating } from '@/src/core/types/schema';

export const StudyDeckScreen = () => {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { data: studyQueue, isLoading } = useDeckDueCardsQuery(deckId || 'deck-toeic-essential');
  const { mutate: rateCard } = useRateCardMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipRotation = useSharedValue(0);

  const toggleFlip = () => {
    if (isFlipped) {
      flipRotation.value = withTiming(0, { duration: 300 });
      setIsFlipped(false);
    } else {
      flipRotation.value = withTiming(180, { duration: 300 });
      setIsFlipped(true);
    }
  };

  const handleRate = (rating: SrsRating) => {
    if (!studyQueue || currentIndex >= studyQueue.length) return;

    const currentItem = studyQueue[currentIndex];
    rateCard({ srsStateId: currentItem.srsState.id, rating });

    // Reset flip & advance to next card
    flipRotation.value = 0;
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden'
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden'
    };
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  const currentItem = studyQueue && currentIndex < studyQueue.length ? studyQueue[currentIndex] : null;

  if (!currentItem) {
    return (
      <View className="flex-1 bg-surface justify-center items-center px-6">
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-2xl font-bold text-neutralInk text-center mb-2">
          Đã Ôn Xong Tất Cả Thẻ Hợp Lệ Hôm Nay!
        </Text>
        <Text className="text-xs text-neutralGray text-center mb-8 px-4 leading-5">
          Thuật toán SuperMemo-2 đã cập nhật lịch hẹn cho lượt ôn tiếp theo của bạn.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary px-8 py-3.5 rounded-xl shadow-md active:bg-primaryDark"
        >
          <Text className="text-white font-bold text-base">Quay Về Danh Sách Thẻ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      {/* Top Header Bar */}
      <View>
        <View className="flex-row justify-between items-center mb-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary font-bold text-sm">← Thoát Ôn Thẻ</Text>
          </Pressable>
          <Text className="text-xs font-bold text-neutralGray">
            Thẻ {currentIndex + 1} / {studyQueue?.length || 1}
          </Text>
        </View>

        {/* 3D Flip Card Container */}
        <Pressable onPress={toggleFlip} className="w-full h-80 my-4 relative">
          {/* Front Card */}
          <Animated.View
            className="w-full h-full bg-cardWhite p-6 rounded-3xl border border-gray-200 justify-center items-center shadow-lg absolute inset-0"
            style={frontAnimatedStyle}
          >
            <Text className="text-3xl font-extrabold text-neutralInk mb-2 text-center">
              {currentItem.word?.word || currentItem.card.custom_front || 'Word'}
            </Text>
            <Text className="text-sm font-semibold text-secondary mb-4">
              {currentItem.word?.ipa_us || '/.../'}
            </Text>
            <Text className="text-xs text-neutralGray italic">Chạm vào thẻ để xem mặt sau</Text>
          </Animated.View>

          {/* Back Card */}
          <Animated.View
            className="w-full h-full bg-secondary/5 p-6 rounded-3xl border-2 border-secondary justify-center items-center shadow-lg absolute inset-0"
            style={backAnimatedStyle}
          >
            <Text className="text-xl font-bold text-secondary mb-3 text-center">
              {currentItem.word?.part_of_speech ? `(${currentItem.word.part_of_speech})` : ''}
            </Text>
            <Text className="text-base text-neutralInk font-medium text-center mb-4 leading-6">
              {currentItem.word?.word || currentItem.card.custom_back || 'Nghĩa từ vựng'}
            </Text>
            {currentItem.card.user_note && (
              <View className="bg-cardWhite p-3 rounded-xl border border-gray-100 w-full">
                <Text className="text-[11px] text-neutralGray italic">💡 Ghi chú: {currentItem.card.user_note}</Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* 4 SM-2 Rating Buttons */}
      <View className="gap-2">
        <Text className="text-center text-xs font-semibold text-neutralGray mb-1">
          {isFlipped ? 'Đánh giá mức độ nhớ của bạn theo SM-2:' : 'Lật mặt sau để chọn mức đánh giá'}
        </Text>
        <View className="flex-row gap-2">
          {/* Again (0) */}
          <Pressable
            onPress={() => handleRate(0)}
            className="flex-1 bg-error py-3 rounded-xl items-center shadow-sm active:opacity-80"
          >
            <Text className="text-white font-bold text-xs">Quên (0)</Text>
            <Text className="text-white/80 text-[10px] mt-0.5">Học lại</Text>
          </Pressable>

          {/* Hard (1) */}
          <Pressable
            onPress={() => handleRate(1)}
            className="flex-1 bg-warning py-3 rounded-xl items-center shadow-sm active:opacity-80"
          >
            <Text className="text-white font-bold text-xs">Khó (1)</Text>
            <Text className="text-white/80 text-[10px] mt-0.5">3 ngày</Text>
          </Pressable>

          {/* Good (2) */}
          <Pressable
            onPress={() => handleRate(2)}
            className="flex-1 bg-success py-3 rounded-xl items-center shadow-sm active:opacity-80"
          >
            <Text className="text-white font-bold text-xs">Tốt (2)</Text>
            <Text className="text-white/80 text-[10px] mt-0.5">6 ngày</Text>
          </Pressable>

          {/* Easy (3) */}
          <Pressable
            onPress={() => handleRate(3)}
            className="flex-1 bg-secondary py-3 rounded-xl items-center shadow-sm active:opacity-80"
          >
            <Text className="text-white font-bold text-xs">Dễ (3)</Text>
            <Text className="text-white/80 text-[10px] mt-0.5">14 ngày</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
