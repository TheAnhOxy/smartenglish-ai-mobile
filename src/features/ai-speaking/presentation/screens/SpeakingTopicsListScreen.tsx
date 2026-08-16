import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Coffee, Plane, Briefcase, Sparkles, ChevronRight, Zap, PlayCircle, Lock } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export interface SpeakingTopicItem {
  id: string;
  unit_number: number;
  title_vi: string;
  title_en: string;
  scenario_name: string;
  category: 'cafe' | 'travel' | 'business' | 'pronunciation';
  is_premium: boolean;
  total_phrases: number;
  completed_phrases: number;
  icon: any;
  color_bg: string;
  color_text: string;
}

export const SpeakingTopicsListScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const topics: SpeakingTopicItem[] = [
    {
      id: 'topic-1',
      unit_number: 1,
      title_vi: 'Unit 1: Phát Âm Từ Đơn & Ngữ Âm IPA',
      title_en: 'Single Word Pronunciation & Phonetics',
      scenario_name: 'PHONETIC PRACTICE',
      category: 'pronunciation',
      is_premium: false,
      total_phrases: 15,
      completed_phrases: 12,
      icon: Mic,
      color_bg: 'bg-orange-100',
      color_text: '#FF6B35'
    },
    {
      id: 'topic-2',
      unit_number: 3,
      title_vi: 'Unit 3: Gọi Đồ Ăn & Cà Phê',
      title_en: 'Ordering Food & Coffee',
      scenario_name: 'CAFE SCENARIO',
      category: 'cafe',
      is_premium: false,
      total_phrases: 10,
      completed_phrases: 4,
      icon: Coffee,
      color_bg: 'bg-amber-100',
      color_text: '#D97706'
    },
    {
      id: 'topic-3',
      unit_number: 4,
      title_vi: 'Unit 4: Giao Tiếp Sân Bay & Khách Sạn',
      title_en: 'Airport & Hotel Check-in',
      scenario_name: 'TRAVEL SCENARIO',
      category: 'travel',
      is_premium: false,
      total_phrases: 12,
      completed_phrases: 0,
      icon: Plane,
      color_bg: 'bg-cyan-100',
      color_text: '#0284C7'
    },
    {
      id: 'topic-4',
      unit_number: 5,
      title_vi: 'Unit 5: Phỏng Vấn & Thuyết Trình Văn Phòng 👑',
      title_en: 'Office Interview & Presentation',
      scenario_name: 'BUSINESS SCENARIO',
      category: 'business',
      is_premium: true,
      total_phrases: 20,
      completed_phrases: 0,
      icon: Briefcase,
      color_bg: 'bg-purple-100',
      color_text: '#7C3AED'
    }
  ];

  const handleSelectTopic = (topic: SpeakingTopicItem) => {
    if (topic.is_premium && !isPremium) {
      router.push('/(student)/profile/premium' as any);
      return;
    }

    if (topic.category === 'pronunciation') {
      router.push('/(student)/practice/speaking/single-practice' as any);
    } else {
      router.push({
        pathname: '/(student)/practice/speaking/unit-roleplay' as any,
        params: { topicId: topic.id, scenarioName: topic.scenario_name }
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#F8FAF9] pt-12 px-6 pb-8" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center gap-3">
          <Image
            source={{
              uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
            }}
            className="w-10 h-10 rounded-full border border-gray-200"
          />
          <View>
            <Text className="text-xs font-bold text-neutralGray uppercase">Luyện Nói Phản Xạ</Text>
            <Text className="text-lg font-bold text-neutralInk">Chủ Đề & Unit</Text>
          </View>
        </View>

        <View className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 flex-row items-center gap-1">
          <Zap color="#FF6B35" size={14} fill="#FF6B35" />
          <Text className="text-xs font-bold text-[#FF6B35]">🔥 12 Days</Text>
        </View>
      </View>

      {/* Intro Card */}
      <View className="bg-[#FF6B35] p-5 rounded-3xl mb-6 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base font-bold text-white">🗣️ Luyện Phát Âm & Phản Xạ AI</Text>
          <Sparkles color="#FFFFFF" size={20} />
        </View>
        <Text className="text-xs text-white/90 leading-5">
          Chọn một chủ đề hoặc Unit bên dưới để bắt đầu chấm điểm âm tiết IPA & hội thoại trực tiếp với AI!
        </Text>
      </View>

      {/* Topics List */}
      <Text className="text-sm font-bold text-neutralInk mb-3">Danh Sách Chủ Đề Luyện Nói</Text>
      <View className="gap-4 pb-12">
        {topics.map((topic) => {
          const IconComp = topic.icon;
          const isLocked = topic.is_premium && !isPremium;

          return (
            <Pressable
              key={topic.id}
              onPress={() => handleSelectTopic(topic)}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-4 flex-1 mr-2">
                <View className={`w-13 h-13 rounded-2xl ${topic.color_bg} justify-center items-center`}>
                  <IconComp color={topic.color_text} size={24} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider">
                      🔴 {topic.scenario_name}
                    </Text>
                    {isLocked && <Lock color="#94A3B8" size={12} />}
                  </View>
                  <Text className="text-base font-bold text-neutralInk mb-0.5">{topic.title_vi}</Text>
                  <Text className="text-xs text-neutralGray font-medium">{topic.title_en}</Text>
                </View>
              </View>

              <View className="items-center">
                <View className="w-9 h-9 rounded-full bg-gray-100 justify-center items-center mb-1">
                  <PlayCircle color={topic.color_text} size={20} />
                </View>
                <Text className="text-[10px] font-bold text-neutralGray">
                  {topic.completed_phrases}/{topic.total_phrases}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};
