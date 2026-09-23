import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { MOCK_PLACEMENT_QUESTIONS, submitPlacementTestApi } from '../../data/onboardingApi';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { X, ChevronRight, Check } from 'lucide-react-native';

export const PlacementTestScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentQuestionIndex, answers, setAnswer, setQuestionIndex, setResult } = useOnboardingStore();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = MOCK_PLACEMENT_QUESTIONS[currentQuestionIndex];
  const progressPct = ((currentQuestionIndex + 1) / MOCK_PLACEMENT_QUESTIONS.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];
  const isLast = currentQuestionIndex === MOCK_PLACEMENT_QUESTIONS.length - 1;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progressPct}%` as any, { duration: 350 }),
  }));

  const handleSelectOption = (option: string) => {
    setAnswer(currentQuestion.id, option);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < MOCK_PLACEMENT_QUESTIONS.length - 1) {
      setQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsSubmitting(true);
      const res = await submitPlacementTestApi(answers);
      setResult(res);
      setIsSubmitting(false);
      router.replace('/(auth)/placement-result' as any);
    }
  };

  const safeTop = Math.max(insets.top, 48) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  return (
    <View style={[s.container, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
      {/* Header */}
      <View>
        <View style={s.topRow}>
          <Text style={s.topLabel}>Placement Test</Text>
          <Text style={s.questionCounter}>
            {currentQuestionIndex + 1} / {MOCK_PLACEMENT_QUESTIONS.length}
          </Text>
          <Pressable onPress={() => setShowExitModal(true)} style={s.closeBtn} hitSlop={8}>
            <X color={colors.textSoft} size={20} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, animatedProgressStyle]} />
        </View>

        {/* Category Badge */}
        <View style={s.categoryBadge}>
          <Text style={s.categoryText}>{currentQuestion.category}</Text>
        </View>

        {/* Question */}
        <Text style={s.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={s.optionsList}>
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            return (
              <Pressable
                key={idx}
                onPress={() => handleSelectOption(opt)}
                style={[s.optionBtn, isSelected && s.optionBtnSelected]}
              >
                <Text style={[s.optionText, isSelected && s.optionTextSelected]}>{opt}</Text>
                <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                  {isSelected && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Next / Submit Button */}
      <TouchableOpacity
        onPress={handleNextQuestion}
        disabled={!selectedAnswer || isSubmitting}
        activeOpacity={0.85}
        style={[s.ctaBtn, (!selectedAnswer || isSubmitting) && s.ctaBtnDisabled]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={[s.ctaBtnText, (!selectedAnswer || isSubmitting) && s.ctaBtnTextDisabled]}>
              {isLast ? 'Nộp Bài' : 'Câu Tiếp Theo'}
            </Text>
            <ChevronRight color={(!selectedAnswer || isSubmitting) ? '#64748B' : '#FFFFFF'} size={18} strokeWidth={2.5} />
          </>
        )}
      </TouchableOpacity>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Thoát Bài Kiểm Tra?</Text>
            <Text style={s.modalDesc}>
              Kết quả bài kiểm tra của bạn sẽ không được lưu. Bạn có chắc chắn muốn thoát?
            </Text>
            <View style={s.modalBtnsRow}>
              <Pressable
                onPress={() => setShowExitModal(false)}
                style={s.modalBtnCancel}
              >
                <Text style={s.modalBtnCancelText}>Làm Tiếp</Text>
              </Pressable>
              <Pressable
                onPress={() => { setShowExitModal(false); router.back(); }}
                style={s.modalBtnExit}
              >
                <Text style={s.modalBtnExitText}>Thoát</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSoft,
  },
  closeBtn: {
    padding: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaBtnDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ctaBtnTextDisabled: {
    color: '#94A3B8',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
    marginBottom: 24,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalBtnExit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  modalBtnExitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
