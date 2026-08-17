import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, Zap, Minus, Plus, Lock, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

type QuestionType = 'trac_nghiem' | 'dien_tu' | 'ghep_noi' | 'sap_xep';

export const QuickQuizSetupScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['trac_nghiem', 'dien_tu']);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');
  const [difficulty, setDifficulty] = useState(6);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const questionTypes: { key: QuestionType; label: string }[] = [
    { key: 'trac_nghiem', label: 'Trắc nghiệm' },
    { key: 'dien_tu', label: 'Điền từ' },
    { key: 'ghep_noi', label: 'Ghép nối' },
    { key: 'sap_xep', label: 'Sắp xếp từ' },
  ];

  const topics = ['Tất cả', 'Du lịch', 'TOEIC', 'Từ ảnh quét'];

  const handleStartQuiz = () => {
    router.push({
      pathname: '/(student)/practice/quiz/play' as any,
      params: {
        types: selectedTypes.join(','),
        count: questionCount.toString(),
        topic: selectedTopic,
        difficulty: difficulty.toString(),
      },
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#F5F7FA]" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="pt-12 px-5 pb-4 flex-row justify-between items-center">
        <View className="flex-row items-center gap-3">
          <Pressable className="p-1">
            <Menu color="#1E3A5F" size={22} />
          </Pressable>
          <View>
            <Text className="text-lg font-extrabold text-[#1E3A5F]">AI Quiz</Text>
            <Text className="text-[11px] text-gray-500 font-medium">Câu hỏi từ từ vựng của bạn</Text>
          </View>
        </View>

        <Image
          source={{
            uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          className="w-10 h-10 rounded-full border-2 border-[#1E3A5F]"
        />
      </View>

      <View className="px-5">
        {/* Quiz nhanh Banner */}
        <View className="bg-[#1E3A5F] p-5 rounded-3xl mb-6 shadow-lg">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-7 h-7 rounded-full bg-white/20 justify-center items-center">
              <Zap color="#FFFFFF" size={16} fill="#FFFFFF" />
            </View>
            <Text className="text-base font-bold text-white">Quiz nhanh</Text>
          </View>
          <Text className="text-xs text-white/80 mb-4 leading-5">
            AI chọn 10 câu từ vựng yếu của bạn
          </Text>
          <Pressable
            onPress={handleStartQuiz}
            className="bg-white py-3 px-6 rounded-xl self-start active:bg-gray-100"
          >
            <Text className="text-sm font-bold text-[#1E3A5F]">Bắt đầu ngay</Text>
          </Pressable>
        </View>

        {/* Tùy chỉnh Section */}
        <Text className="text-xl font-bold text-[#1E3A5F] mb-4">Tùy chỉnh</Text>

        {/* Chọn loại câu hỏi */}
        <Text className="text-sm font-semibold text-gray-600 mb-3">Chọn loại câu hỏi</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {questionTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.key);
            return (
              <Pressable
                key={type.key}
                onPress={() => toggleType(type.key)}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl border-2 ${
                  isSelected
                    ? 'border-[#1E3A5F] bg-white'
                    : 'border-gray-200 bg-white'
                }`}
                style={{ width: '47%' }}
              >
                <View
                  className={`w-6 h-6 rounded-md border-2 justify-center items-center ${
                    isSelected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <Text className={`text-sm font-semibold ${isSelected ? 'text-[#1E3A5F]' : 'text-gray-500'}`}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Số lượng câu hỏi Counter */}
        <View className="flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 mb-6">
          <Text className="text-sm font-semibold text-gray-600">Số lượng câu hỏi</Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
              className="w-9 h-9 rounded-full bg-[#E8EDF2] justify-center items-center active:bg-gray-300"
            >
              <Minus color="#1E3A5F" size={18} />
            </Pressable>
            <Text className="text-2xl font-extrabold text-[#1E3A5F] w-10 text-center">{questionCount}</Text>
            <Pressable
              onPress={() => setQuestionCount(Math.min(30, questionCount + 5))}
              className="w-9 h-9 rounded-full bg-[#E8EDF2] justify-center items-center active:bg-gray-300"
            >
              <Plus color="#1E3A5F" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Chủ đề Chips */}
        <Text className="text-sm font-semibold text-gray-600 mb-3">Chủ đề</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-2">
            {topics.map((topic) => (
              <Pressable
                key={topic}
                onPress={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-full border ${
                  selectedTopic === topic
                    ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedTopic === topic ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {topic}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Độ khó Slider */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-gray-600">Độ khó</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-400">Dễ</Text>
              <Text className="text-xs text-gray-400">{'>'}</Text>
              <Text className="text-xs font-bold text-[#1E3A5F]">Khó</Text>
            </View>
          </View>

          {/* Custom difficulty scale 1-10 */}
          <View className="bg-white p-4 rounded-2xl border border-gray-100">
            <View className="flex-row justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setDifficulty(level)}
                  className="items-center"
                >
                  <Text
                    className={`text-xs font-bold ${
                      level === difficulty ? 'text-[#1E3A5F]' : 'text-gray-400'
                    }`}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
            {/* Slider Track */}
            <View className="h-2 bg-gray-200 rounded-full mt-1 relative">
              <View
                className="h-2 bg-[#1E3A5F] rounded-full absolute left-0 top-0"
                style={{ width: `${(difficulty / 10) * 100}%` }}
              />
              <View
                className="w-5 h-5 rounded-full bg-[#1E3A5F] absolute -top-1.5 shadow-md border-2 border-white"
                style={{ left: `${Math.max(0, (difficulty / 10) * 100 - 5)}%` }}
              />
            </View>
          </View>
        </View>

        {/* Mô phỏng thi IELTS/TOEIC Premium */}
        <Pressable
          onPress={() => {
            if (!isPremium) {
              router.push('/(student)/profile/premium' as any);
            } else {
              handleStartQuiz();
            }
          }}
          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4 flex-row items-center gap-4"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#E8EDF2] justify-center items-center">
            <Lock color="#1E3A5F" size={22} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text className="text-base font-bold text-[#1E3A5F]">Mô phỏng thi</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-gray-500 font-medium">IELTS/TOEIC</Text>
              <View className="bg-[#FFC93C] px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-extrabold text-[#78350F]">PREMIUM</Text>
              </View>
            </View>
          </View>
          <ChevronRight color="#94A3B8" size={20} />
        </Pressable>

        {/* Tạo đề thi CTA */}
        <Pressable
          onPress={handleStartQuiz}
          className="bg-[#1E3A5F] py-4.5 rounded-2xl items-center shadow-lg mb-10 active:bg-[#162D4A]"
        >
          <Text className="text-white font-bold text-base">Tạo đề thi</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
