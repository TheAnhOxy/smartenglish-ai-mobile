import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const TOPIC_CHIPS = [
  { id: 'tech', name: 'Công Nghệ & AI', emoji: '💻' },
  { id: 'business', name: 'Kinh Doanh & Khởi Nghiệp', emoji: '💼' },
  { id: 'travel', name: 'Du Lịch & Văn Hóa', emoji: '✈️' },
  { id: 'daily', name: 'Đời Sống Hàng Ngày', emoji: '☕' },
  { id: 'academic', name: 'Học Thuật IELTS', emoji: '🎓' },
  { id: 'science', name: 'Khoa Học Vũ Trụ', emoji: '🚀' },
];

const LENGTH_OPTIONS = [
  { id: 'short', label: 'Ngắn (~150 từ)', time: '2-3 phút' },
  { id: 'medium', label: 'Vừa (~300 từ)', time: '5-7 phút' },
  { id: 'long', label: 'Dài (~500 từ)', time: '10+ phút' },
];

export const ReadingGeneratorScreen = () => {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['tech']);
  const [selectedLength, setSelectedLength] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      router.push('/(student)/practice/reading/passage-101' as any);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Thư Viện Bài Đọc</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">Tạo Bài Đọc Theo Chủ Đề ⚡</Text>
        <Text className="text-xs text-neutralGray mb-6">Tùy biến bài đọc hiểu chuẩn CEFR phù hợp với sở thích của bạn</Text>

        {/* Section 1: Topics */}
        <Text className="text-sm font-bold text-neutralInk mb-3">1. Chọn Chủ Đề Yêu Thích (Có thể chọn nhiều)</Text>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {TOPIC_CHIPS.map((chip) => {
            const active = selectedTopics.includes(chip.id);
            return (
              <Pressable
                key={chip.id}
                onPress={() => toggleTopic(chip.id)}
                className={`px-4 py-2.5 rounded-2xl border flex-row items-center gap-2 ${
                  active ? 'bg-primary border-primary shadow-sm' : 'bg-cardWhite border-gray-200'
                }`}
              >
                <Text className="text-sm">{chip.emoji}</Text>
                <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-neutralInk'}`}>
                  {chip.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section 2: Length */}
        <Text className="text-sm font-bold text-neutralInk mb-3">2. Độ Dài Bài Đọc</Text>
        <View className="gap-2.5 mb-8">
          {LENGTH_OPTIONS.map((opt) => {
            const active = selectedLength === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedLength(opt.id)}
                className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                  active ? 'bg-secondary/10 border-secondary' : 'bg-cardWhite border-gray-100'
                }`}
              >
                <View>
                  <Text className={`text-sm font-bold ${active ? 'text-secondary' : 'text-neutralInk'}`}>
                    {opt.label}
                  </Text>
                  <Text className="text-xs text-neutralGray mt-0.5">Thời gian ước tính: {opt.time}</Text>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    active ? 'border-secondary bg-secondary' : 'border-gray-300'
                  }`}
                >
                  {active && <View className="w-2 h-2 rounded-full bg-white" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Submit */}
      <View className="pt-2">
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          className="bg-primary py-4 rounded-2xl items-center shadow-sm active:bg-primaryDark flex-row justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-white font-bold text-base">Đang Tạo Bài Đọc Tối Ưu...</Text>
            </>
          ) : (
            <Text className="text-white font-bold text-base">Tạo Bài Đọc Mới Cho Bạn ➔</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
