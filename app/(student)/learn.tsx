import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LearningPathScreen } from '@/src/features/learning-path/presentation/screens/LearningPathScreen';
import { DecksScreen } from '@/src/features/flashcard-srs/presentation/screens/DecksScreen';
import { SpeakingTopicsListScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingTopicsListScreen';

export default function LearnTabContainer() {
  const [activeSegment, setActiveSegment] = useState<'path' | 'decks' | 'speaking'>('path');

  return (
    <View className="flex-1 bg-[#F8FAF9]">
      {/* Top 3-Segment Switcher Bar */}
      <View className="pt-12 px-4 pb-2 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row bg-gray-100 p-1 rounded-2xl">
          <Pressable
            onPress={() => setActiveSegment('path')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeSegment === 'path' ? 'bg-[#4F46E5] shadow-sm' : ''
            }`}
          >
            <Text className={`text-[11px] font-bold ${activeSegment === 'path' ? 'text-white' : 'text-gray-500'}`}>
              🗺️ Lộ Trình
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('decks')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeSegment === 'decks' ? 'bg-[#FF6B35] shadow-sm' : ''
            }`}
          >
            <Text className={`text-[11px] font-bold ${activeSegment === 'decks' ? 'text-white' : 'text-gray-500'}`}>
              🎴 Bộ Thẻ SRS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('speaking')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeSegment === 'speaking' ? 'bg-[#00BCD4] shadow-sm' : ''
            }`}
          >
            <Text className={`text-[11px] font-bold ${activeSegment === 'speaking' ? 'text-white' : 'text-gray-500'}`}>
              🗣️ Luyện Nói
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Screen Content */}
      <View className="flex-1">
        {activeSegment === 'path' ? (
          <LearningPathScreen />
        ) : activeSegment === 'decks' ? (
          <DecksScreen />
        ) : (
          <SpeakingTopicsListScreen />
        )}
      </View>
    </View>
  );
}
