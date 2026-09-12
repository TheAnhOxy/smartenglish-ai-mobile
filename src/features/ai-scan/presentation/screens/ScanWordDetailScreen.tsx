import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Lock, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { speakText } from '@/src/core/services/speechService';

export const ScanWordDetailScreen = () => {
  const router = useRouter();
  const { wordItem } = useLocalSearchParams<{ wordItem?: string }>();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';
  const [activeTab, setActiveTab] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<number | null>(null);

  const parsed = wordItem ? JSON.parse(wordItem) : null;
  const word = parsed?.word || 'Ubiquitous';
  const phonetic = parsed?.phonetic || '/juːˈbɪkwɪtəs/';
  const pos = parsed?.pos || 'Adjective';
  const meaning_vi = parsed?.meaning_vi || 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi.';
  const examples = parsed?.examples || {
    easy: `This object is very common in everyday life.`,
    medium: `Mobile phones and AI cameras have become ubiquitous around the world.`,
    hard: `The ubiquitous presence of smart devices transforms contemporary learning environments.`
  };

  const currentExample = activeTab === 'beginner' 
    ? examples.easy 
    : activeTab === 'intermediate' 
    ? examples.medium 
    : examples.hard;

  const handleTabPress = (tab: 'beginner' | 'intermediate' | 'advanced') => {
    if (tab !== 'beginner' && !isPremium) {
      router.push('/(student)/profile/premium' as any);
      return;
    }
    setActiveTab(tab);
  };

  const handlePlayWord = () => {
    setIsPlayingWord(true);
    speakText(word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setIsPlayingWord(false),
      onError: () => setIsPlayingWord(false),
    });
  };

  const handlePlaySentence = (sentence: string, index: number) => {
    setPlayingSentenceIndex(index);
    speakText(sentence, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlayingSentenceIndex(null),
      onError: () => setPlayingSentenceIndex(null),
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(student)/practice/scan/result' as any);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center mb-6">
          <Pressable onPress={handleBack} className="flex-row items-center gap-2">
            <ArrowLeft color="#1E293B" size={20} />
            <Text className="text-xl font-bold text-[#FF6B35]">Chi Tiết Từ Vựng AI</Text>
          </Pressable>

          {/* Top Gamification Stats Badges */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">🔥</Text>
              <Text className="text-xs font-bold text-neutralInk">7</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">💰</Text>
              <Text className="text-xs font-bold text-neutralInk">1200</Text>
            </View>
          </View>
        </View>

        {/* Word Header Card */}
        <View className="bg-white p-6 rounded-3xl border border-gray-100 items-center shadow-sm mb-6">
          <Text className="text-3xl font-extrabold text-neutralInk mb-2">{word}</Text>
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-sm text-neutralGray font-medium">{phonetic}</Text>
            <Pressable
              onPress={handlePlayWord}
              className={`w-9 h-9 rounded-full justify-center items-center ${
                isPlayingWord ? 'bg-[#FF6B35]' : 'bg-[#E0F2FE] active:bg-cyan-200'
              }`}
            >
              <Volume2 color={isPlayingWord ? '#FFFFFF' : '#0284C7'} size={18} />
            </Pressable>
          </View>

          <View className="bg-[#E0F2FE] px-4 py-1.5 rounded-full">
            <Text className="text-xs font-bold text-[#0284C7]">{pos}</Text>
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
          <Text className="text-sm font-bold text-neutralInk mb-2">Định Nghĩa Tiếng Việt</Text>
          <Text className="text-xs text-neutralGray font-medium leading-5">
            {meaning_vi}
          </Text>
        </View>

        {/* Examples Card */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-bold text-neutralInk">Câu Ví Dụ Ngữ Cảnh</Text>
            <Sparkles color="#FF6B35" size={16} />
          </View>

          <View className="gap-3">
            <View className="bg-surface p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center">
              <Text className="text-xs text-neutralInk leading-5 font-medium flex-1 mr-3">
                {currentExample}
              </Text>
              <Pressable
                onPress={() => handlePlaySentence(currentExample, 1)}
                className={`w-8 h-8 rounded-full justify-center items-center ${
                  playingSentenceIndex === 1 ? 'bg-[#FF6B35]' : 'bg-[#E0F2FE] active:bg-cyan-200'
                }`}
              >
                <Volume2 color={playingSentenceIndex === 1 ? '#FFFFFF' : '#0284C7'} size={16} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
