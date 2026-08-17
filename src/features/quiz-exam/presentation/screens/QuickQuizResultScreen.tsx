import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Menu, ChevronDown, Zap, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const QuickQuizResultScreen = () => {
  const router = useRouter();
  const { correct = '8', total = '10' } = useLocalSearchParams<{ correct?: string; total?: string }>();

  const correctNum = parseInt(correct, 10);
  const totalNum = parseInt(total, 10);
  const pct = Math.round((correctNum / totalNum) * 100);
  const xpEarned = correctNum * 10 + 5;
  const coinsEarned = correctNum > 5 ? 10 : 5;

  const [showDetails, setShowDetails] = useState(false);

  const skillBreakdown = [
    { label: 'Từ vựng', pct: 90, color: '#1E3A5F' },
    { label: 'Ngữ pháp', pct: 70, color: '#1E3A5F' },
    { label: 'Điền từ', pct: 80, color: '#1E3A5F' },
    { label: 'Ghép nối', pct: 75, color: '#1E3A5F' },
  ];

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-12 px-5 pb-3 flex-row justify-between items-center">
          <Pressable className="p-1">
            <Menu color="#1E3A5F" size={22} />
          </Pressable>
          <Text className="text-lg font-extrabold text-[#1E3A5F]">SmartEnglish AI</Text>
          <View className="w-9 h-9 rounded-full bg-gray-200 justify-center items-center">
            <Text className="text-sm">🔔</Text>
          </View>
        </View>

        {/* Celebration Hero Section */}
        <Animated.View entering={FadeInDown.delay(100)} className="items-center px-5 mb-6">
          {/* Trophy & Confetti */}
          <View className="bg-[#1E3A5F] w-full rounded-b-[40px] items-center pb-6 pt-4 mb-6">
            <Text className="text-5xl mb-2">🏆</Text>
            <Text className="text-2xl font-extrabold text-white">
              Xuất sắc! 🎉
            </Text>
          </View>

          {/* Score Circle */}
          <Animated.View entering={FadeInDown.delay(300)} className="bg-white w-44 h-44 rounded-full justify-center items-center shadow-xl border-4 border-[#1E3A5F]/10 -mt-16 mb-4">
            <Text className="text-5xl font-extrabold text-[#1E3A5F]">
              {correctNum}/{totalNum}
            </Text>
            <Text className="text-xs font-bold text-gray-500 mt-1">{pct}% chính xác</Text>
          </Animated.View>

          {/* XP + Coins Earned */}
          <View className="bg-[#EEF2FF] px-5 py-2.5 rounded-full flex-row items-center gap-2 border border-[#1E3A5F]/10">
            <Zap color="#1E3A5F" size={16} fill="#1E3A5F" />
            <Text className="text-xs font-bold text-[#1E3A5F]">
              +{xpEarned} XP đã nhận! | +{coinsEarned} Coins
            </Text>
          </View>
        </Animated.View>

        {/* Phân tích kỹ năng */}
        <Animated.View entering={FadeInDown.delay(500)} className="px-5 mb-6">
          <Text className="text-lg font-bold text-[#1E3A5F] mb-4">Phân tích kỹ năng</Text>

          <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm gap-4">
            {skillBreakdown.map((skill) => (
              <View key={skill.label}>
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-sm font-semibold text-[#1E293B]">{skill.label}</Text>
                  <Text className="text-sm font-bold text-[#1E3A5F]">{skill.pct}%</Text>
                </View>
                <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${skill.pct}%`, backgroundColor: skill.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Xem chi tiết Accordion */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-5 mb-6">
          <Pressable
            onPress={() => setShowDetails(!showDetails)}
            className="bg-white p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50"
          >
            <Text className="text-base font-bold text-[#1E293B]">Xem chi tiết</Text>
            <ChevronDown color="#94A3B8" size={20} />
          </Pressable>

          {showDetails && (
            <View className="bg-white p-4 rounded-2xl border border-gray-100 mt-2">
              <Text className="text-xs text-gray-500 leading-5">
                • Câu 1: postpone ✅{'\n'}
                • Câu 2: meticulous ✅{'\n'}
                • Câu 3: reserve ✅{'\n'}
                • Câu 4: elaborate ❌ (Đáp án: finalize){'\n'}
                • Câu 5: enhance ✅
              </Text>
            </View>
          )}
        </Animated.View>

        {/* AI Gợi ý Card */}
        <Animated.View entering={FadeInDown.delay(700)} className="px-5 mb-6">
          <View className="bg-[#EEF2FF] p-5 rounded-3xl border border-[#1E3A5F]/10 flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-full bg-[#1E3A5F] justify-center items-center mt-0.5">
              <Zap color="#FFFFFF" size={18} fill="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#1E293B] leading-5 mb-2">
                AI gợi ý: Bạn hay nhầm nhóm từ Business. Ôn thêm bộ TOEIC Business Vocab?
              </Text>
              <Pressable
                onPress={() => router.push('/(student)/learn' as any)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-xs font-bold text-[#1E3A5F]">Học ngay</Text>
                <ArrowRight color="#1E3A5F" size={14} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Bottom CTA Buttons */}
        <View className="px-5 pb-10 gap-3">
          <Pressable
            onPress={() => router.push('/(student)/home' as any)}
            className="bg-[#1E3A5F] py-4 rounded-2xl items-center shadow-md active:bg-[#162D4A]"
          >
            <Text className="text-white font-bold text-base">Về trang chủ</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="bg-white py-4 rounded-2xl items-center border-2 border-gray-200 active:bg-gray-50"
          >
            <Text className="text-[#1E3A5F] font-bold text-base">Làm lại</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
