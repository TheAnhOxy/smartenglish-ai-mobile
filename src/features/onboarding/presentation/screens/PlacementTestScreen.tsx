import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { MOCK_PLACEMENT_QUESTIONS, submitPlacementTestApi } from '../../data/onboardingApi';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const PlacementTestScreen = () => {
  const router = useRouter();
  const { currentQuestionIndex, answers, setAnswer, setQuestionIndex, setResult } = useOnboardingStore();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = MOCK_PLACEMENT_QUESTIONS[currentQuestionIndex];
  const progressPct = ((currentQuestionIndex + 1) / MOCK_PLACEMENT_QUESTIONS.length) * 100;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progressPct}%`, { duration: 300 })
  }));

  const handleSelectOption = (option: string) => {
    setAnswer(currentQuestion.id, option);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < MOCK_PLACEMENT_QUESTIONS.length - 1) {
      setQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Final Question -> Submit
      setIsSubmitting(true);
      const res = await submitPlacementTestApi(answers);
      setResult(res);
      setIsSubmitting(false);
      router.replace('/(auth)/placement-result' as any);
    }
  };

  const selectedAnswer = answers[currentQuestion.id];

  return (
    <View className="flex-1 bg-surface px-6 pt-14 pb-10 justify-between">
      {/* Header with Exit Cross & Continuous Top Progress Bar */}
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-bold text-secondary uppercase tracking-wider">
            Placement Test
          </Text>
          <Pressable onPress={() => setShowExitModal(true)} className="p-2">
            <Text className="text-lg font-bold text-neutralGray">✕</Text>
          </Pressable>
        </View>

        {/* Continuous Linear Progress Bar */}
        <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-6">
          <Animated.View className="h-full bg-secondary rounded-full" style={animatedProgressStyle} />
        </View>

        {/* Question Category Badge */}
        <View className="self-start bg-secondary/10 px-3 py-1 rounded-full mb-3">
          <Text className="text-xs font-bold text-secondary uppercase">
            {currentQuestion.category}
          </Text>
        </View>

        {/* Question Title */}
        <Text className="text-lg font-bold text-neutralInk mb-6 leading-7">
          {currentQuestion.question}
        </Text>

        {/* Options List */}
        <View className="gap-3">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            return (
              <Pressable
                key={idx}
                onPress={() => handleSelectOption(opt)}
                className={`p-4 rounded-xl border flex-row items-center justify-between active:opacity-80 ${
                  isSelected ? 'bg-primary/10 border-primary shadow-sm' : 'bg-cardWhite border-gray-200'
                }`}
              >
                <Text className={`font-semibold text-base ${isSelected ? 'text-primary' : 'text-neutralInk'}`}>
                  {opt}
                </Text>
                <View
                  className={`w-5 h-5 rounded-full border items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Next / Submit Button */}
      <Pressable
        onPress={handleNextQuestion}
        disabled={!selectedAnswer || isSubmitting}
        className={`py-4 rounded-xl items-center shadow-md ${
          selectedAnswer && !isSubmitting ? 'bg-primary active:bg-primaryDark' : 'bg-gray-300'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text className="text-white font-bold text-lg">
            {currentQuestionIndex === MOCK_PLACEMENT_QUESTIONS.length - 1 ? 'Nộp Bài' : 'Câu Tiếp Theo'}
          </Text>
        )}
      </Pressable>

      {/* Custom Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-cardWhite p-6 rounded-2xl w-full">
            <Text className="text-xl font-bold text-neutralInk mb-2">Thoát Bài Kiểm Tra?</Text>
            <Text className="text-sm text-neutralGray mb-6">
              Kết quả bài kiểm tra của bạn sẽ không được lưu. Bạn có chắc chắn muốn thoát?
            </Text>
            <View className="flex-row gap-3 justify-end">
              <Pressable
                onPress={() => setShowExitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200"
              >
                <Text className="font-semibold text-neutralInk">Làm Tiếp</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowExitModal(false);
                  router.back();
                }}
                className="px-4 py-2.5 rounded-xl bg-error"
              >
                <Text className="font-bold text-white">Thoát</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
