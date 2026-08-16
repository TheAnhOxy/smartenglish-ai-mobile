import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Camera, BookOpen, Bot, HelpCircle, ChevronRight, Compass } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export const HomeScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-[#F8FAF9] pt-14 px-5" showsVerticalScrollIndicator={false}>
      {/* Top Header Section */}
      <View className="flex-row justify-between items-center mb-5">
        <Pressable onPress={() => router.push('/(student)/profile' as any)} className="flex-row items-center gap-3">
          <Image
            source={{
              uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
            }}
            className="w-11 h-11 rounded-full border border-gray-200"
          />
          <View>
            <Text className="text-xs text-neutralGray font-medium">Chào buổi sáng, {currentUser?.display_name || 'Minh'}! 👋</Text>
            <Text className="text-base font-bold text-[#4F46E5]">SmartEnglish AI</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(student)/notifications' as any)}
          className="w-10 h-10 rounded-full bg-white border border-gray-100 items-center justify-center relative active:bg-gray-50 shadow-sm"
        >
          <Bell color="#475569" size={20} />
          <View className="w-2.5 h-2.5 rounded-full bg-error absolute top-2 right-2 border-2 border-white" />
        </Pressable>
      </View>

      {/* Top Stats Bar (White Pill Card) */}
      <View className="bg-white p-3.5 rounded-2xl border border-gray-100 flex-row items-center justify-between shadow-sm mb-5">
        {/* Streak */}
        <View className="flex-row items-center gap-1.5">
          <Text className="text-lg">🔥</Text>
          <Text className="text-xs font-bold text-neutralInk">15 ngày</Text>
        </View>

        {/* XP Progress */}
        <View className="flex-1 px-4 items-center">
          <View className="flex-row items-center gap-1 mb-1">
            <Text className="text-xs font-extrabold text-[#4F46E5]">1.240 XP</Text>
            <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">SCHOLAR LVL 8</Text>
          </View>
          <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <View className="h-full bg-[#FF6B35] rounded-full" style={{ width: '65%' }} />
          </View>
        </View>

        {/* Coins */}
        <View className="flex-row items-center gap-1.5">
          <Text className="text-lg">💰</Text>
          <Text className="text-xs font-bold text-neutralInk">320</Text>
        </View>
      </View>

      {/* Daily Challenge Card (Vibrant Purple/Indigo Banner) */}
      <View className="bg-[#4F46E5] p-5 rounded-3xl mb-5 shadow-lg relative overflow-hidden">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-white">Thử thách hôm nay</Text>
          <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
            <Text className="text-xs font-bold text-white">0/3 hoàn thành</Text>
          </View>
        </View>

        {/* Checklist */}
        <View className="gap-2.5">
          <Pressable
            onPress={() => router.push('/(student)/review' as any)}
            className="flex-row items-center gap-2.5"
          >
            <View className="w-5 h-5 rounded-full border-2 border-white/80 justify-center items-center" />
            <Text className="text-sm font-semibold text-white">Học 5 từ mới</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(student)/practice/scan' as any)}
            className="flex-row items-center gap-2.5"
          >
            <View className="w-5 h-5 rounded-full border-2 border-white/80 justify-center items-center" />
            <Text className="text-sm font-semibold text-white">Quét 1 ảnh</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
            className="flex-row items-center gap-2.5"
          >
            <View className="w-5 h-5 rounded-full border-2 border-white/80 justify-center items-center" />
            <Text className="text-sm font-semibold text-white">Quiz 10 câu</Text>
          </Pressable>
        </View>
      </View>

      {/* 4 Feature Quick Shortcut Grid (2x2 Grid) */}
      <View className="flex-row flex-wrap gap-3.5 mb-5">
        {/* Shortcut 1: Quét ảnh */}
        <Pressable
          onPress={() => router.push('/(student)/practice/scan' as any)}
          className="w-[47.5%] bg-white p-4 rounded-2xl border border-gray-100 items-center shadow-sm active:bg-gray-50"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#CFFAFE] items-center justify-center mb-2.5">
            <Camera color="#0891B2" size={24} />
          </View>
          <Text className="text-xs font-bold text-neutralInk">📷 Quét ảnh</Text>
        </Pressable>

        {/* Shortcut 2: Flashcard */}
        <Pressable
          onPress={() => router.push('/(student)/review' as any)}
          className="w-[47.5%] bg-white p-4 rounded-2xl border border-gray-100 items-center shadow-sm active:bg-gray-50"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#CFFAFE] items-center justify-center mb-2.5">
            <BookOpen color="#0891B2" size={24} />
          </View>
          <Text className="text-xs font-bold text-neutralInk">🎴 Flashcard</Text>
        </Pressable>

        {/* Shortcut 3: AI Chat */}
        <Pressable
          onPress={() => router.push('/(student)/assistant' as any)}
          className="w-[47.5%] bg-white p-4 rounded-2xl border border-gray-100 items-center shadow-sm active:bg-gray-50"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#CFFAFE] items-center justify-center mb-2.5">
            <Bot color="#0891B2" size={24} />
          </View>
          <Text className="text-xs font-bold text-neutralInk">🤖 AI Chat</Text>
        </Pressable>

        {/* Shortcut 4: Quiz */}
        <Pressable
          onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
          className="w-[47.5%] bg-white p-4 rounded-2xl border border-gray-100 items-center shadow-sm active:bg-gray-50"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#CFFAFE] items-center justify-center mb-2.5">
            <HelpCircle color="#0891B2" size={24} />
          </View>
          <Text className="text-xs font-bold text-neutralInk">🧠 Quiz</Text>
        </Pressable>
      </View>

      {/* Continue Learning Section */}
      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-bold text-[#4F46E5]">Tiếp tục học</Text>
          <Pressable onPress={() => router.push('/(student)/learn' as any)}>
            <Text className="text-xs font-bold text-[#06B6D4]">Xem tất cả</Text>
          </Pressable>
        </View>

        <View className="bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-12 h-12 rounded-2xl bg-[#CFFAFE] items-center justify-center">
              <Compass color="#0891B2" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-neutralInk">Từ vựng Du lịch — Bộ 3</Text>
              <Text className="text-xs text-neutralGray mt-0.5">18/50 từ đã học</Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(student)/review/decks/d-1/study' as any)}
            className="bg-[#4F46E5] px-4 py-2.5 rounded-xl shadow-sm active:bg-[#4338CA]"
          >
            <Text className="text-white font-bold text-xs">Tiếp tục</Text>
          </Pressable>
        </View>
      </View>

      {/* Live Teacher Announcement Card */}
      <Pressable
        onPress={() => router.push('/(student)/profile/classes' as any)}
        className="bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center justify-between shadow-sm mb-12 active:bg-gray-50"
      >
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View className="relative">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' }}
              className="w-12 h-12 rounded-full border border-gray-200"
            />
            <View className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white absolute bottom-0 right-0" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1 mb-0.5">
              <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wide">🔴 TRỰC TIẾP</Text>
            </View>
            <Text className="text-sm font-bold text-neutralInk">Lớp của Cô Sarah: Giao tiếp</Text>
          </View>
        </View>

        <ChevronRight color="#94A3B8" size={20} />
      </Pressable>
    </ScrollView>
  );
};
