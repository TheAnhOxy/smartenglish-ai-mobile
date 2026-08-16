import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_EXAM_SUITE } from '../../data/quizApi';

export const FullExamScreen = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleBookmark = (qId: string) => {
    if (bookmarkedIds.includes(qId)) {
      setBookmarkedIds(bookmarkedIds.filter((id) => id !== qId));
    } else {
      setBookmarkedIds([...bookmarkedIds, qId]);
    }
  };

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Timer Bar */}
        <View className="flex-row justify-between items-center mb-4">
          <Pressable onPress={() => setShowExitModal(true)} className="bg-error/10 px-3 py-1.5 rounded-full border border-error/30">
            <Text className="text-xs font-bold text-error">Thoát Bài Thi 🛑</Text>
          </Pressable>
          <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30 flex-row items-center gap-1">
            <Text className="text-xs">⏱️</Text>
            <Text className="text-xs font-extrabold text-primary">{formatTimer(timeLeft)}</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-neutralInk mb-1">{MOCK_EXAM_SUITE.title}</Text>
        <Text className="text-xs text-neutralGray mb-6">Chế độ thi thật • Tự động nộp bài khi hết giờ</Text>

        <View className="gap-6">
          {MOCK_EXAM_SUITE.questions.map((q, idx) => {
            const isBookmarked = bookmarkedIds.includes(q.id);
            const currentAns = answers[q.id];

            return (
              <View key={q.id} className="bg-cardWhite p-5 rounded-2xl border border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-sm font-bold text-primary">Câu {idx + 1}:</Text>
                  <Pressable onPress={() => toggleBookmark(q.id)} className="p-1">
                    <Text className="text-base">{isBookmarked ? '🚩' : '🏳️'}</Text>
                  </Pressable>
                </View>

                <Text className="text-sm font-bold text-neutralInk mb-4 leading-6">{q.question_text}</Text>

                <View className="gap-2">
                  {q.options?.map((opt, oIdx) => {
                    const isSelected = currentAns === opt;
                    return (
                      <Pressable
                        key={oIdx}
                        onPress={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={`p-3 rounded-xl border flex-row items-center justify-between ${
                          isSelected ? 'bg-primary/10 border-primary' : 'bg-surface border-gray-200'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${isSelected ? 'text-primary font-bold' : 'text-neutralInk'}`}>
                          {opt}
                        </Text>
                        {isSelected && <Text className="text-primary font-bold text-xs">✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <Pressable
        onPress={() => router.push('/(student)/practice/exam/result' as any)}
        className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark mt-4"
      >
        <Text className="text-white font-bold text-base">Nộp Bài Thi Ngay 📤</Text>
      </Pressable>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-cardWhite p-6 rounded-3xl w-full border border-gray-100">
            <Text className="text-xl font-bold text-neutralInk mb-2 text-center">Xác Nhận Hủy Bài Thi?</Text>
            <Text className="text-xs text-neutralGray text-center mb-6">Kết quả đang làm dở sẽ không được lưu.</Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowExitModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 items-center">
                <Text className="font-bold text-neutralInk">Tiếp Tục Thi</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowExitModal(false);
                  router.back();
                }}
                className="flex-1 py-3 rounded-xl bg-error items-center"
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
