import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { fetchPlacementTestApi, submitPlacementTestApi } from '../../data/onboardingApi';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { X, ChevronRight, Check, AlertCircle, RefreshCw } from 'lucide-react-native';

export const PlacementTestScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    attemptId,
    examId,
    questions,
    currentQuestionIndex,
    answers,
    isLoading,
    error,
    setSession,
    setAnswer,
    setQuestionIndex,
    setResult,
    setLoading,
    setError,
  } = useOnboardingStore();

  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await fetchPlacementTestApi();
      setSession(session);
      startTimeRef.current = Date.now();
    } catch (err: any) {
      setError(err?.message || 'Không thể tải đề kiểm tra. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length === 0) {
      loadQuestions();
    }
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLast = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progressPct}%` as any, { duration: 350 }),
  }));

  const handleSelectOption = (optionId: string, optionText: string) => {
    if (!currentQuestion) return;
    // Lưu ID hoặc text được chọn
    const chosenValue = optionId || optionText;
    setAnswer(currentQuestion.id, chosenValue);
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion) return;

    if (currentQuestionIndex < totalQuestions - 1) {
      setQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsSubmitting(true);
      try {
        const timeSpentSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
        const res = await submitPlacementTestApi({
          attemptId: attemptId || undefined,
          examId: examId || undefined,
          answers,
          timeSpentSeconds,
        });
        setResult(res);
        router.replace('/(auth)/placement-result' as any);
      } catch (submitErr: any) {
        setError(submitErr?.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const safeTop = (insets.top || 16) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  // Trạng thái Loading thống nhất
  if (isLoading) {
    return (
      <View style={[s.centerContainer, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
        <View style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.stateTitle}>Đang tải bài kiểm tra đầu vào</Text>
          <Text style={s.stateDesc}>Hệ thống đang chuẩn bị bộ câu hỏi chẩn đoán 4 kỹ năng...</Text>
        </View>
      </View>
    );
  }

  // Trạng thái Error & Retry thống nhất
  if (error && questions.length === 0) {
    return (
      <View style={[s.centerContainer, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
        <View style={s.stateCard}>
          <View style={s.errorIconCircle}>
            <AlertCircle color={colors.danger} size={32} strokeWidth={2} />
          </View>
          <Text style={s.stateTitle}>Không Thể Tải Dữ Liệu</Text>
          <Text style={s.stateDesc}>{error}</Text>
          <TouchableOpacity
            onPress={loadQuestions}
            activeOpacity={0.85}
            style={s.retryBtn}
          >
            <RefreshCw color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={s.retryBtnText}>Thử Lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={[s.container, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Header */}
        <View style={s.topRow}>
          <Text style={s.topLabel}>Placement Test</Text>
          <Text style={s.questionCounter}>
            {currentQuestionIndex + 1} / {totalQuestions}
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
          <Text style={s.categoryText}>{currentQuestion.category.toUpperCase()}</Text>
        </View>

        {/* Question Text */}
        <Text style={s.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={s.optionsList}>
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt.id || selectedAnswer === opt.text;
            return (
              <Pressable
                key={opt.id || idx}
                onPress={() => handleSelectOption(opt.id, opt.text)}
                style={[s.optionBtn, isSelected && s.optionBtnSelected]}
              >
                <View style={s.optionContent}>
                  {opt.id && opt.id.length <= 2 && (
                    <Text style={[s.optionLetter, isSelected && s.optionLetterSelected]}>
                      {opt.id}.
                    </Text>
                  )}
                  <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                    {opt.text}
                  </Text>
                </View>
                <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                  {isSelected && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Next / Submit Button */}
      <View style={s.footer}>
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
      </View>

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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSoft,
    marginRight: 8,
  },
  optionLetterSelected: {
    color: colors.primary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
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
