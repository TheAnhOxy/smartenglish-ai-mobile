import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Volume2, CheckCircle2, AlertCircle, Clock } from 'lucide-react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { usePressSpring } from '@/src/hooks/usePressSpring';

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

  const shakeOffset = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalQ = mockQuestions.length;
  const question = mockQuestions[currentIdx];
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleSelectOption = (value: string) => {
    setSelectedAnswer(value);
    if (value !== question.correct) {
      triggerShake();
    }
  };

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

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  return (
    <View style={styles.root}>
      <View>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X color={palette.text} size={20} />
          </Pressable>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {mockQuestions.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentIdx && styles.dotActive,
                  idx < currentIdx && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Timer Badge */}
          <View style={styles.timerBadge}>
            <Clock color="#FFFFFF" size={12} />
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Animated Question Card Container */}
        <Animated.View
          key={question.id}
          entering={FadeInRight.duration(280)}
          exiting={FadeOutLeft.duration(200)}
          style={[styles.questionCard, animatedShakeStyle]}
        >
          {/* Category Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{question.category_badge}</Text>
            </View>
            <Pressable style={styles.audioBtn}>
              <Volume2 color={palette.textSoft} size={18} />
            </Pressable>
          </View>

          {/* Instruction */}
          <Text style={styles.instructionText}>{question.instruction}</Text>

          {/* Sentence with Blank */}
          <Text style={styles.sentenceText}>
            {question.sentence_before}{' '}
            <Text style={styles.blankText}>{question.blank}</Text>{' '}
            {question.sentence_after}
          </Text>
        </Animated.View>

        {/* Options List */}
        <View style={styles.optionsWrap}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt.value;
            const isCorrect = opt.value === question.correct;
            const showFeedback = selectedAnswer !== null;

            let cardStyle: any = styles.optionItem;
            let textStyle: any = styles.optionText;
            let badgeStyle: any = styles.optBadge;
            let badgeTextStyle: any = styles.optBadgeText;

            if (showFeedback) {
              if (isSelected && isCorrect) {
                cardStyle = [styles.optionItem, styles.optionCorrect];
                textStyle = [styles.optionText, styles.optionTextCorrect];
                badgeStyle = [styles.optBadge, styles.optBadgeCorrect];
                badgeTextStyle = [styles.optBadgeText, styles.optBadgeTextActive];
              } else if (isSelected && !isCorrect) {
                cardStyle = [styles.optionItem, styles.optionWrong];
                textStyle = [styles.optionText, styles.optionTextWrong];
                badgeStyle = [styles.optBadge, styles.optBadgeWrong];
                badgeTextStyle = [styles.optBadgeText, styles.optBadgeTextActive];
              } else if (!isSelected && isCorrect) {
                cardStyle = [styles.optionItem, styles.optionCorrectHint];
              } else {
                cardStyle = [styles.optionItem, styles.optionDimmed];
              }
            } else if (isSelected) {
              cardStyle = [styles.optionItem, styles.optionSelected];
              badgeStyle = [styles.optBadge, styles.optBadgeActive];
              badgeTextStyle = [styles.optBadgeText, styles.optBadgeTextActive];
            }

            return (
              <Animated.View
                key={opt.value}
                entering={FadeInDown.delay(100 + idx * 40).duration(200)}
              >
                <Pressable
                  onPress={() => handleSelectOption(opt.value)}
                  style={cardStyle}
                >
                  <View style={badgeStyle}>
                    <Text style={badgeTextStyle}>{opt.label}</Text>
                  </View>
                  <Text style={textStyle}>{opt.value}</Text>
                  {showFeedback && isSelected && isCorrect && (
                    <CheckCircle2 color={palette.success} size={20} />
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <AlertCircle color={palette.danger} size={20} />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Bottom Next Button */}
      <Pressable
        onPress={handleNext}
        disabled={!selectedAnswer}
        style={[styles.nextBtn, !selectedAnswer && styles.nextBtnDisabled]}
      >
        <Text style={[styles.nextBtnText, !selectedAnswer && styles.nextBtnTextDisabled]}>
          Tiếp theo →
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: palette.primary,
  },
  dotCompleted: {
    backgroundColor: palette.accent,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  timerText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  audioBtn: {
    padding: 4,
  },
  instructionText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
    marginBottom: 10,
  },
  sentenceText: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    lineHeight: 28,
  },
  blankText: {
    color: palette.primary,
    textDecorationLine: 'underline',
  },
  optionsWrap: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  optionSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  optionCorrect: {
    borderColor: palette.success,
    backgroundColor: '#ECFDF5',
  },
  optionCorrectHint: {
    borderColor: palette.success,
    borderStyle: 'dashed',
  },
  optionWrong: {
    borderColor: palette.danger,
    backgroundColor: '#FEF2F2',
  },
  optionDimmed: {
    opacity: 0.45,
  },
  optBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optBadgeActive: {
    backgroundColor: palette.primary,
  },
  optBadgeCorrect: {
    backgroundColor: palette.success,
  },
  optBadgeWrong: {
    backgroundColor: palette.danger,
  },
  optBadgeText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },
  optBadgeTextActive: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
    flex: 1,
  },
  optionTextCorrect: {
    color: palette.success,
    fontWeight: '700',
  },
  optionTextWrong: {
    color: palette.danger,
    fontWeight: '700',
  },
  nextBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: palette.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextBtnTextDisabled: {
    color: palette.textSoft,
  },
});
