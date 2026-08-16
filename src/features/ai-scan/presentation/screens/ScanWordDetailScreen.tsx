import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Sparkles, Lock } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export const ScanWordDetailScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';
  const [activeTab, setActiveTab] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const handleTabPress = (tab: 'beginner' | 'intermediate' | 'advanced') => {
    if (tab !== 'beginner' && !isPremium) {
      router.push('/(student)/profile/premium' as any);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center mb-6">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
            <ArrowLeft color="#1E293B" size={20} />
            <Text className="text-xl font-bold text-[#FF6B35]">Word Detail</Text>
          </Pressable>

          {/* Top Gamification Stats Badges */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">🔥</Text>
              <Text className="text-xs font-bold text-neutralInk">7</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">❤️</Text>
              <Text className="text-xs font-bold text-neutralInk">5</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">💰</Text>
              <Text className="text-xs font-bold text-neutralInk">1200</Text>
            </View>
          </View>
        </View>

        {/* Word Header Card */}
        <View className="bg-white p-6 rounded-3xl border border-gray-100 items-center shadow-sm mb-6">
          <Text className="text-3xl font-extrabold text-neutralInk mb-2">Ubiquitous</Text>
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-sm text-neutralGray font-medium">/juːˈbɪkwɪtəs/</Text>
            <Pressable className="w-8 h-8 rounded-full bg-[#E0F2FE] justify-center items-center active:bg-cyan-200">
              <Volume2 color="#0284C7" size={16} />
            </Pressable>
          </View>

          <View className="bg-[#E0F2FE] px-4 py-1.5 rounded-full">
            <Text className="text-xs font-bold text-[#0284C7]">Adjective</Text>
          </View>
        </View>

        {/* Difficulty Level Tabs (Segmented Controls) */}
        <View className="flex-row bg-[#F1F5F9] p-1.5 rounded-2xl mb-6 border border-gray-200">
          <Pressable
            onPress={() => handleTabPress('beginner')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === 'beginner' ? 'bg-[#FF6B35] shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'beginner' ? 'text-white' : 'text-neutralGray'}`}>
              Beginner
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('intermediate')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1 ${
              activeTab === 'intermediate' ? 'bg-[#FF6B35] shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'intermediate' ? 'text-white' : 'text-neutralGray'}`}>
              Intermediate
            </Text>
            {!isPremium && <Lock color="#94A3B8" size={12} />}
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('advanced')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1 ${
              activeTab === 'advanced' ? 'bg-[#FF6B35] shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'advanced' ? 'text-white' : 'text-neutralGray'}`}>
              Advanced
            </Text>
            {!isPremium && <Lock color="#94A3B8" size={12} />}
          </Pressable>
        </View>

        {/* Meaning Card */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-5 shadow-sm">
          <Text className="text-sm font-bold text-neutralInk mb-2">Meaning</Text>
          <Text className="text-xs text-neutralGray font-medium leading-5">
            Found or existing everywhere. (Có mặt ở khắp mọi nơi, phổ biến rộng rãi).
          </Text>
        </View>

        {/* Examples Card */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm">
          <Text className="text-sm font-bold text-neutralInk mb-3">” Examples</Text>

          <View className="gap-3">
            <View className="bg-surface p-3.5 rounded-2xl border border-gray-100">
              <Text className="text-xs text-neutralInk leading-5 font-medium">
                Mobile phones are now <Text className="font-bold text-[#FF6B35]">ubiquitous</Text>.
              </Text>
            </View>

            <View className="bg-surface p-3.5 rounded-2xl border border-gray-100">
              <Text className="text-xs text-neutralInk leading-5 font-medium">
                Coffee shops seem to be <Text className="font-bold text-[#FF6B35]">ubiquitous</Text> in this city.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
