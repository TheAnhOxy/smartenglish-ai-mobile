import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuizSuiteQuery } from '../../application/useQuiz';

export const QuizScreen = () => {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const router = useRouter();
  const { data: quiz, isLoading } = useQuizSuiteQuery(quizId || 'quiz-grammar-01');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (isLoading || !quiz) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  const currentQ = quiz.questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === currentQ.correct_answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    return (
      <View className="flex-1 bg-surface pt-14 px-6 justify-center items-center">
        <Text className="text-6xl mb-4">🏆</Text>
        <Text className="text-2xl font-bold text-neutralInk mb-2">Hoàn Thành Bài Quiz!</Text>
        <Text className="text-base text-neutralGray mb-6">
          Điểm của bạn: <Text className="font-extrabold text-primary">{score} / {quiz.questions.length}</Text>
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="bg-primary px-8 py-3.5 rounded-xl shadow-md active:bg-primaryDark"
        >
          <Text className="text-white font-bold text-base">Hoàn Thành & Trở Về</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary font-bold text-sm">← Thoát Quiz</Text>
          </Pressable>
          <Text className="text-xs font-bold text-neutralGray">
            Câu {currentIndex + 1} / {quiz.questions.length}
          </Text>
        </View>

        {/* Linear Progress Bar */}
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </View>

        {/* Question Text */}
        <Text className="text-lg font-bold text-neutralInk mb-6 leading-7">
          {currentQ.question_text}
        </Text>

        {/* Options */}
        <View className="gap-3 mb-6">
          {currentQ.options?.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === currentQ.correct_answer;

            let btnBg = 'bg-cardWhite border-gray-200';
            let txtColor = 'text-neutralInk';

            if (isAnswered) {
              if (isCorrect) {
                btnBg = 'bg-success/10 border-success';
                txtColor = 'text-success font-bold';
              } else if (isSelected) {
                btnBg = 'bg-error/10 border-error';
                txtColor = 'text-error font-bold';
              }
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border flex-row items-center justify-between shadow-sm active:bg-gray-50 ${btnBg}`}
              >
                <Text className={`text-sm font-medium ${txtColor}`}>{opt}</Text>
                {isAnswered && isCorrect && <Text className="text-success font-bold text-sm">✓ Đúng</Text>}
                {isAnswered && isSelected && !isCorrect && <Text className="text-error font-bold text-sm">✕ Sai</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Explanation Card */}
        {isAnswered && (
          <View className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 mb-6">
            <Text className="text-xs font-bold text-secondary mb-1">💡 Giải Thích Đáp Án:</Text>
            <Text className="text-xs text-neutralInk leading-5">{currentQ.explanation_vi}</Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      {isAnswered && (
        <Pressable
          onPress={handleNext}
          className="bg-primary py-4 rounded-xl items-center shadow-md active:bg-primaryDark"
        >
          <Text className="text-white font-bold text-base">
            {currentIndex + 1 < quiz.questions.length ? 'Câu Tiếp Theo ➔' : 'Xem Kết Quả 🏆'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
