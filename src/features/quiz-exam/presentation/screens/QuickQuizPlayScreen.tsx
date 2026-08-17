import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Volume2, CheckCircle2 } from 'lucide-react-native';

interface QuizQuestion {
  id: string;
  category_badge: string;
  instruction: string;
  sentence_before: string;
  blank: string;
  sentence_after: string;
  hint: string;
  options: { label: string; value: string }[];
  correct: string;
}

export const QuickQuizPlayScreen = () => {
  const router = useRouter();

  const mockQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      category_badge: 'Từ vựng TOEIC',
      instruction: 'Choose the word that best completes the sentence:',
      sentence_before: 'The manager asked the team to',
      blank: '______',
      sentence_after: 'the project report before Friday.',
      hint: '',
      options: [
        { label: 'A', value: 'finalize' },
        { label: 'B', value: 'generate' },
        { label: 'C', value: 'eliminate' },
        { label: 'D', value: 'navigate' },
      ],
      correct: 'finalize',
    },
    {
      id: 'q2',
      category_badge: 'Từ vựng TOEIC',
      instruction: 'Choose the word that best completes the sentence:',
      sentence_before: 'She is known for her',
      blank: '______',
      sentence_after: 'attention to detail in every project.',
      hint: '',
      options: [
        { label: 'A', value: 'meticulous' },
        { label: 'B', value: 'elaborate' },
        { label: 'C', value: 'negotiate' },
        { label: 'D', value: 'distribute' },
      ],
      correct: 'meticulous',
    },
    {
      id: 'q3',
      category_badge: 'Du lịch',
      instruction: 'Choose the word that best completes the sentence:',
      sentence_before: 'We need to',
      blank: '______',
      sentence_after: 'a hotel room for our vacation next month.',
      hint: '',
      options: [
        { label: 'A', value: 'postpone' },
        { label: 'B', value: 'reserve' },
        { label: 'C', value: 'negotiate' },
        { label: 'D', value: 'distribute' },
      ],
      correct: 'reserve',
    },
    {
      id: 'q4',
      category_badge: 'Từ vựng TOEIC',
      instruction: 'Choose the word that best completes the sentence:',
      sentence_before: 'The company decided to',
      blank: '______',
      sentence_after: 'its expansion plans due to budget cuts.',
      hint: '',
      options: [
        { label: 'A', value: 'postpone' },
        { label: 'B', value: 'elaborate' },
        { label: 'C', value: 'negotiate' },
        { label: 'D', value: 'distribute' },
      ],
      correct: 'postpone',
    },
    {
      id: 'q5',
      category_badge: 'Business',
      instruction: 'Choose the word that best completes the sentence:',
      sentence_before: 'The new policy will',
      blank: '______',
      sentence_after: 'employee productivity across all departments.',
      hint: '',
      options: [
        { label: 'A', value: 'enhance' },
        { label: 'B', value: 'postpone' },
        { label: 'C', value: 'distribute' },
        { label: 'D', value: 'negotiate' },
      ],
      correct: 'enhance',
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timer, setTimer] = useState(90);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalQ = mockQuestions.length;
  const question = mockQuestions[currentIdx];
  const progressPct = ((currentIdx + 1) / totalQ) * 100;
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const handleNext = () => {
    if (selectedAnswer === question.correct) {
      setCorrectCount((c) => c + 1);
    }

    if (currentIdx + 1 >= totalQ) {
      const finalCorrect = selectedAnswer === question.correct ? correctCount + 1 : correctCount;
      router.replace({
        pathname: '/(student)/practice/quiz/result' as any,
        params: { correct: finalCorrect.toString(), total: totalQ.toString() },
      });
    } else {
      setSelectedAnswer(null);
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <View className="flex-1 bg-white pt-12 px-5 justify-between pb-8">
      {/* Top Bar: Close, Progress Counter, Timer */}
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <X color="#475569" size={22} />
          </Pressable>
          <Text className="text-sm font-bold text-[#1E3A5F]">
            Câu {currentIdx + 1}/{totalQ}
          </Text>
          <View className="bg-[#FF6B35] px-3 py-1.5 rounded-full flex-row items-center gap-1">
            <Text className="text-[11px] font-bold text-white">⏱</Text>
            <Text className="text-xs font-extrabold text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <View
            className="h-full bg-[#1E3A5F] rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </View>

        {/* Question Card */}
        <View className="bg-[#F5F7FA] p-5 rounded-3xl border border-gray-100 mb-6">
          {/* Category Badge & Speaker */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-[#1E3A5F] px-3 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-white">{question.category_badge}</Text>
            </View>
            <Pressable className="p-1">
              <Volume2 color="#94A3B8" size={20} />
            </Pressable>
          </View>

          {/* Instruction */}
          <Text className="text-xs text-gray-500 font-medium mb-3">{question.instruction}</Text>

          {/* Sentence with Blank */}
          <Text className="text-xl font-bold text-[#1E293B] leading-8">
            {question.sentence_before}{' '}
            <Text className="text-[#1E3A5F] underline">{question.blank}</Text>{' '}
            {question.sentence_after}
          </Text>

          {/* Hint when answer selected */}
          {selectedAnswer && (
            <View className="bg-white/80 p-3 rounded-xl border border-gray-100 mt-4 flex-row items-start gap-2">
              <Text className="text-gray-400">ⓘ</Text>
              <Text className="text-xs text-gray-600 flex-1 leading-5">
                Bạn đã chọn một phương án. Nhấn "Tiếp theo" để kiểm tra kết quả.
              </Text>
            </View>
          )}
        </View>

        {/* Answer Options */}
        <View className="gap-3">
          {question.options.map((opt) => {
            const isSelected = selectedAnswer === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelectedAnswer(opt.value)}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${
                  isSelected
                    ? 'border-[#1E3A5F] bg-[#EEF2FF]'
                    : 'border-gray-100 bg-white'
                } active:bg-gray-50`}
              >
                <View
                  className={`w-9 h-9 rounded-full justify-center items-center mr-4 ${
                    isSelected ? 'bg-[#1E3A5F]' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isSelected ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </View>
                <Text
                  className={`text-base font-semibold flex-1 ${
                    isSelected ? 'text-[#1E3A5F]' : 'text-[#1E293B]'
                  }`}
                >
                  {opt.value}
                </Text>
                {isSelected && <CheckCircle2 color="#1E3A5F" size={22} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Next Button */}
      <Pressable
        onPress={handleNext}
        disabled={!selectedAnswer}
        className={`py-4.5 rounded-2xl items-center shadow-md flex-row justify-center gap-2 ${
          selectedAnswer ? 'bg-[#1E3A5F] active:bg-[#162D4A]' : 'bg-gray-200'
        }`}
      >
        <Text className={`font-bold text-base ${selectedAnswer ? 'text-white' : 'text-gray-400'}`}>
          Tiếp theo
        </Text>
        <Text className={`font-bold text-base ${selectedAnswer ? 'text-white' : 'text-gray-400'}`}>→</Text>
      </Pressable>
    </View>
  );
};
