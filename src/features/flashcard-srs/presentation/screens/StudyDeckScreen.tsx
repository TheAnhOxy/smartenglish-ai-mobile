import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Zap, Volume2, ArrowLeft, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

export const StudyDeckScreen = () => {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  // Mock study queue for SRS Runner matching Screenshot 2
  const mockStudyQueue = [
    { id: '1', word: 'Resilient', ipa: '/rɪˈzɪl.jənt/', meaning: 'Kiên cường, có khả năng phục hồi nhanh chóng', example: 'She remained resilient despite facing major financial challenges.' },
    { id: '2', word: 'Ubiquitous', ipa: '/juːˈbɪk.wɪ.təs/', meaning: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi', example: 'Smartphones have become ubiquitous in modern society.' },
    { id: '3', word: 'Meticulous', ipa: '/mɪˈtɪk.jə.ləs/', meaning: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ', example: 'He is meticulous about keeping his office desk organized.' },
    { id: '4', word: 'Pragmatic', ipa: '/præɡˈmæt.ɪk/', meaning: 'Thực tế, thực dụng, trọng hiệu quả', example: 'We need a pragmatic approach to solve this technical issue.' }
  ];

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

  const handleRate = (ratingScore: number) => {
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

  const currentCard = mockStudyQueue[currentIndex];

  if (!currentCard) {
    return (
      <View className="flex-1 bg-[#F8FAF9] justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-100 justify-center items-center mb-4">
          <CheckCircle2 color="#FF6B35" size={48} />
        </View>
        <Text className="text-2xl font-bold text-neutralInk text-center mb-2">
          Đã Ôn Xong Tất Cả Thẻ Hôm Nay!
        </Text>
        <Text className="text-xs text-neutralGray text-center mb-8 px-4 leading-5">
          Thuật toán SuperMemo-2 đã cập nhật lịch hẹn cho lượt ôn tiếp theo của bạn.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#FF6B35] px-8 py-4 rounded-2xl shadow-md active:bg-orange-600"
        >
          <Text className="text-white font-bold text-base">Quay Về Danh Sách Thẻ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 justify-between pb-8">
      <View>
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center mb-4">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
            <Image
              source={{
                uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
              }}
              className="w-10 h-10 rounded-full border border-gray-200"
            />
          </Pressable>

          <Text className="text-xl font-extrabold text-[#9A2C00] tracking-tight">SmartEnglish AI</Text>

          <View className="w-10 h-10 rounded-full bg-orange-50 justify-center items-center">
            <Zap color="#C23B00" size={22} fill="#C23B00" />
          </View>
        </View>

        {/* Dual Color Progress Bar */}
        <View className="h-2 bg-[#A5F3FC]/50 rounded-full overflow-hidden mb-2">
          <View
            className="h-full bg-[#FF6B35] rounded-full"
            style={{ width: `${Math.round(((currentIndex + 1) / mockStudyQueue.length) * 100)}%` }}
          />
        </View>

        {/* Review Status Sub-header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xs font-semibold text-neutralGray">
            Reviewing: {currentIndex + 12}/{mockStudyQueue.length + 21}
          </Text>
          <Text className="text-xs font-semibold text-neutralGray">
            Daily Streak: 🔥 4 Days
          </Text>
        </View>

        {/* 3D Flip Card Container matching Screenshot 2 */}
        <Pressable onPress={toggleFlip} className="w-full h-96 relative my-2">
          {/* Front Card */}
          <Animated.View
            className="w-full h-full bg-white p-8 rounded-3xl border border-gray-100 justify-between items-center shadow-xl absolute inset-0"
            style={frontAnimatedStyle}
          >
            <View />

            {/* Word & Phonetic Header */}
            <View className="items-center">
              <Text className="text-4xl font-extrabold text-[#1E293B] mb-2 text-center">
                {currentCard.word}
              </Text>
              <Text className="text-base font-semibold text-neutralGray mb-6 text-center">
                {currentCard.ipa}
              </Text>

              {/* Large Orange Speaker Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  alert(`Đang phát âm: ${currentCard.word}`);
                }}
                className="w-16 h-16 rounded-full bg-[#FF6B35] justify-center items-center shadow-lg active:scale-95"
              >
                <Volume2 color="#FFFFFF" size={28} />
              </Pressable>
            </View>

            {/* Divider Line & Hint Footer */}
            <View className="w-full border-t border-gray-100 pt-4 items-center">
              <Text className="text-xs text-neutralGray font-medium">Tap card to flip</Text>
            </View>
          </Animated.View>

          {/* Back Card (Flipped) */}
          <Animated.View
            className="w-full h-full bg-cyan-50/60 p-8 rounded-3xl border-2 border-[#00BCD4] justify-between items-center shadow-xl absolute inset-0"
            style={backAnimatedStyle}
          >
            <View className="items-center">
              <Text className="text-xs font-bold text-[#0284C7] uppercase tracking-wider mb-2">Định Nghĩa</Text>
              <Text className="text-xl font-bold text-neutralInk text-center leading-7 mb-4">
                {currentCard.meaning}
              </Text>
            </View>

            <View className="bg-white p-4 rounded-2xl border border-cyan-200/60 w-full mb-4">
              <Text className="text-xs text-neutralGray italic leading-5">
                "{currentCard.example}"
              </Text>
            </View>

            <Text className="text-xs text-neutralGray font-medium">Chạm để quay lại mặt trước</Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Bottom 4 SM-2 Grading Buttons matching Screenshot 2 */}
      <View>
        <Text className="text-center text-xs font-bold text-neutralInk mb-3">
          How well did you know this?
        </Text>

        <View className="flex-row gap-2.5">
          {/* Again (<1m) */}
          <Pressable
            onPress={() => handleRate(0)}
            className="flex-1 bg-[#FEE2E2] py-3.5 rounded-2xl items-center border border-red-200 active:bg-red-200"
          >
            <Text className="text-xs font-bold text-[#B91C1C]">Again</Text>
            <Text className="text-[10px] text-[#B91C1C]/80 mt-0.5">&lt; 1m</Text>
          </Pressable>

          {/* Hard (2d) */}
          <Pressable
            onPress={() => handleRate(1)}
            className="flex-1 bg-[#FEF3C7] py-3.5 rounded-2xl items-center border border-amber-200 active:bg-amber-200"
          >
            <Text className="text-xs font-bold text-[#B45309]">Hard</Text>
            <Text className="text-[10px] text-[#B45309]/80 mt-0.5">2d</Text>
          </Pressable>

          {/* Good (4d) */}
          <Pressable
            onPress={() => handleRate(2)}
            className="flex-1 bg-[#CFFAFE] py-3.5 rounded-2xl items-center border border-cyan-200 active:bg-cyan-200"
          >
            <Text className="text-xs font-bold text-[#0F766E]">Good</Text>
            <Text className="text-[10px] text-[#0F766E]/80 mt-0.5">4d</Text>
          </Pressable>

          {/* Easy (7d) */}
          <Pressable
            onPress={() => handleRate(3)}
            className="flex-1 bg-[#A5F3FC] py-3.5 rounded-2xl items-center border border-cyan-300 active:bg-cyan-300"
          >
            <Text className="text-xs font-bold text-[#0E7490]">Easy</Text>
            <Text className="text-[10px] text-[#0E7490]/80 mt-0.5">7d</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
