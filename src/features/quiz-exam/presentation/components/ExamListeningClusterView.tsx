import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Headphones,
  Volume2,
  Play,
  Pause,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Languages,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { AnswerKey, ExamQuestion } from '../../data/examAttemptApi';

export interface ExamListeningClusterViewProps {
  questions: ExamQuestion[];
  userAnswers: Record<string, AnswerKey>;
  onSelectAnswer: (questionId: string, answer: AnswerKey) => void;
  isExamMode: boolean;
  isPracticeMode: boolean;
  revealedQuestions: Record<string, boolean>;
  isWrongOnly?: boolean;
  bookmarkedIds: string[];
  onToggleBookmark: (questionId: string) => void;
  // Audio state
  isPlayingAudio: boolean;
  audioProgress: number;
  currentAudioTime: number;
  currentAudioDuration: number;
  formatAudioTime: (seconds?: number) => string;
  onToggleAudio: () => void;
  audioHasEnded?: boolean;
  // Practice mode translation & TTS
  currentTranslations?: Record<string, string> | null;
  showInlineTranslation?: boolean;
  isTranslating?: boolean;
  onToggleTranslate?: () => void;
}

const WAVE_BARS = [12, 22, 16, 28, 36, 24, 32, 40, 28, 35, 42, 30, 20, 34, 40, 26, 32, 20, 16, 22, 18, 12];

export const ExamListeningClusterView: React.FC<ExamListeningClusterViewProps> = ({
  questions,
  userAnswers,
  onSelectAnswer,
  isExamMode,
  isPracticeMode,
  revealedQuestions,
  bookmarkedIds,
  onToggleBookmark,
  isPlayingAudio,
  audioProgress,
  currentAudioTime,
  currentAudioDuration,
  formatAudioTime,
  onToggleAudio,
  audioHasEnded = false,
  currentTranslations,
  showInlineTranslation,
  isTranslating,
  onToggleTranslate,
}) => {
  const firstQ = questions[0] || ({} as ExamQuestion);
  const part = firstQ.part;
  const isPart1 = part === 'PART_1';
  const isPart2 = part === 'PART_2';
  const isMultiQuestion = questions.length > 1;

  // Waveform active bars
  const activeBarCount = Math.floor(audioProgress * WAVE_BARS.length);

  return (
    <View style={styles.container}>
      {/* ── 1. AUDIO PLAYER CARD (Dùng chung cho cả cụm) ── */}
      <View style={styles.audioPlayerCard}>
        {/* Header Badges */}
        <View style={styles.audioBadgeRow}>
          <View style={styles.dialogBadge}>
            <Headphones size={13} color="#1E40AF" />
            <Text style={styles.dialogBadgeText}>
              {firstQ.audioTitle || firstQ.groupTag || (isMultiQuestion ? `Hội thoại câu ${questions[0]?.questionNumber}–${questions[questions.length - 1]?.questionNumber}` : `Phần nghe Part ${part.replace('PART_', '')}`)}
            </Text>
          </View>

          {isExamMode ? (
            <View style={[styles.statusBadge, audioHasEnded ? styles.statusBadgeEnded : styles.statusBadgePlaying]}>
              {audioHasEnded ? (
                <>
                  <CheckCircle2 size={12} color="#059669" />
                  <Text style={styles.statusBadgeTextEnded}>Đã nghe (1 lần duy nhất)</Text>
                </>
              ) : isPlayingAudio ? (
                <>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.statusBadgeTextPlaying}>Đang phát âm thanh...</Text>
                </>
              ) : (
                <>
                  <Lock size={12} color="#475569" />
                  <Text style={styles.statusBadgeTextLocked}>Tự phát khi bắt đầu</Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.playingBadge}>
              <Text style={styles.playingBadgeText}>
                {isPlayingAudio ? '● Đang phát âm thanh' : 'Bấm để nghe'}
              </Text>
            </View>
          )}
        </View>

        {/* Part 1 Photo nếu có */}
        {isPart1 && firstQ.imageUrl && (
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: firstQ.imageUrl }}
              style={styles.photoImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Player Controls & Waveform */}
        <View style={styles.playerInnerBox}>
          <View style={styles.playerMainRow}>
            {/* Play/Pause Button - Bị khóa hoặc ẩn khi ở Exam Mode */}
            {isExamMode ? (
              <View style={[styles.playPauseBtn, styles.playPauseBtnDisabled]}>
                {audioHasEnded ? (
                  <CheckCircle2 size={20} color="#94A3B8" />
                ) : isPlayingAudio ? (
                  <Volume2 size={20} color="#FFFFFF" />
                ) : (
                  <Lock size={18} color="#FFFFFF" />
                )}
              </View>
            ) : (
              <Pressable
                onPress={onToggleAudio}
                style={({ pressed }) => [styles.playPauseBtn, pressed && styles.pressed]}
              >
                {isPlayingAudio ? (
                  <Pause size={20} color="#FFFFFF" />
                ) : (
                  <Play size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                )}
              </Pressable>
            )}

            {/* Waveform Visualization */}
            <View style={styles.waveFormArea}>
              <View style={styles.waveBarsRow}>
                {WAVE_BARS.map((h, idx) => {
                  const isBarActive = isPlayingAudio ? idx <= activeBarCount : false;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.waveBar,
                        { height: h },
                        isBarActive ? styles.waveBarActive : styles.waveBarInactive,
                      ]}
                    />
                  );
                })}
              </View>

              {/* Progress Slider */}
              <View style={styles.miniProgressTrack}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${Math.round(audioProgress * 100)}%` },
                  ]}
                />
              </View>

              {/* Time display */}
              <View style={styles.timeLabelsRow}>
                <Text style={styles.timeText}>{formatAudioTime(currentAudioTime)}</Text>
                <Text style={styles.timeText}>{formatAudioTime(currentAudioDuration)}</Text>
              </View>
            </View>
          </View>

          {/* ETS Note */}
          <View style={styles.audioInfoRow}>
            <HelpCircle size={13} color="#64748B" />
            <Text style={styles.audioInfoText}>
              {isExamMode
                ? 'Đoạn băng tự phát 1 lần theo quy chế ETS · Không thể tua hoặc nghe lại'
                : 'Chế độ luyện tập · Bạn có thể bấm nghe lại và xem transcript sau khi trả lời'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. DANH SÁCH TẤT CẢ CÂU HỎI TRONG CỤM NÀY (Q32, Q33, Q34) ── */}
      <View style={styles.questionsListWrap}>
        {questions.map((q, index) => {
          const selectedAnswer = userAnswers[q.id];
          const isRevealed = Boolean(revealedQuestions[q.id]);
          const isBookmarked = bookmarkedIds.includes(q.id);
          const isAnswered = Boolean(selectedAnswer);

          return (
            <View key={q.id} style={styles.questionCard}>
              {/* Question Card Header */}
              <View style={styles.questionCardHeaderRow}>
                <View style={styles.qNumBadgeWrap}>
                  <View style={[styles.qNumBadge, isAnswered && styles.qNumBadgeAnswered]}>
                    <Text style={styles.qNumBadgeText}>Câu {q.questionNumber}</Text>
                  </View>
                  {q.categoryTag ? (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{q.categoryTag}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.qActionsRow}>
                  {/* Translate Button (Practice Mode) */}
                  {isPracticeMode && isRevealed && onToggleTranslate ? (
                    <Pressable
                      onPress={onToggleTranslate}
                      style={[styles.translateBtn, showInlineTranslation && styles.translateBtnActive]}
                      hitSlop={6}
                    >
                      {isTranslating ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Languages size={13} color={showInlineTranslation ? colors.primary : '#475569'} />
                      )}
                      <Text style={[styles.translateBtnText, showInlineTranslation && styles.translateBtnTextActive]}>
                        {showInlineTranslation ? 'Ẩn dịch' : 'Dịch'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Bookmark Button */}
                  <Pressable
                    onPress={() => onToggleBookmark(q.id)}
                    style={styles.bookmarkBtn}
                    hitSlop={8}
                  >
                    <Bookmark
                      size={18}
                      color={isBookmarked ? '#F59E0B' : '#94A3B8'}
                      fill={isBookmarked ? '#F59E0B' : 'transparent'}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Question Text */}
              {Boolean(q.questionText) && (
                <Text style={styles.questionPromptText}>{q.questionText}</Text>
              )}

              {/* Inline Translation nếu có */}
              {isPracticeMode && isRevealed && showInlineTranslation && currentTranslations?.question ? (
                <View style={styles.translationBox}>
                  <Languages size={12} color="#2563EB" style={{ marginTop: 2 }} />
                  <Text style={styles.translationText}>{currentTranslations.question}</Text>
                </View>
              ) : null}

              {/* Options List (A, B, C, D) */}
              <View style={styles.optionsList}>
                {(q.options || []).map((opt) => {
                  const isSelected = selectedAnswer === opt.key;
                  const isCorrectAnswer = opt.key === q.correctAnswer;
                  const isWrongSelection = isSelected && !isCorrectAnswer;

                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => onSelectAnswer(q.id, opt.key)}
                      disabled={isPracticeMode && isRevealed}
                      style={({ pressed }) => [
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        isRevealed && isCorrectAnswer && styles.optionCardRevealedCorrect,
                        isRevealed && isWrongSelection && styles.optionCardRevealedWrong,
                        pressed && styles.pressed,
                      ]}
                    >
                      {/* Circle Key */}
                      <View
                        style={[
                          styles.optionKeyCircle,
                          isSelected && styles.optionKeyCircleSelected,
                          isRevealed && isCorrectAnswer && styles.optionKeyCircleRevealedCorrect,
                          isRevealed && isWrongSelection && styles.optionKeyCircleRevealedWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionKeyText,
                            isSelected && styles.optionKeyTextSelected,
                            isRevealed && (isCorrectAnswer || isWrongSelection) && { color: '#FFFFFF' },
                          ]}
                        >
                          {opt.key}
                        </Text>
                      </View>

                      {/* Option Text */}
                      <View style={styles.optionContentWrap}>
                        <Text
                          style={[
                            styles.optionLabelText,
                            isSelected && styles.optionLabelTextSelected,
                            isRevealed && isCorrectAnswer && styles.optionLabelTextRevealedCorrect,
                            isRevealed && isWrongSelection && styles.optionLabelTextRevealedWrong,
                          ]}
                        >
                          {opt.label || opt.key}
                        </Text>
                        {Boolean(opt.subLabel) && (
                          <Text style={styles.optionSubLabelText}>{opt.subLabel}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Practice Mode Explanation */}
              {isPracticeMode && isRevealed && Boolean(q.explanationVi) && (
                <View style={styles.explanationBox}>
                  <View style={styles.explanationHeaderRow}>
                    <Sparkles size={14} color="#0284C7" />
                    <Text style={styles.explanationHeaderTitle}>Giải thích chi tiết</Text>
                  </View>
                  <Text style={styles.explanationText}>{q.explanationVi}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  // Audio Player Card
  audioPlayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  audioBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dialogBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 1,
  },
  dialogBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
    fontFamily: font.family,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  statusBadgePlaying: {
    backgroundColor: '#E0F2FE',
  },
  statusBadgeEnded: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeLocked: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeTextPlaying: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: font.family,
  },
  statusBadgeTextEnded: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    fontFamily: font.family,
  },
  statusBadgeTextLocked: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    fontFamily: font.family,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  playingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  playingBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  photoWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#0F172A',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  playerInnerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playPauseBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtnDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.85,
  },
  waveFormArea: {
    flex: 1,
    gap: 6,
  },
  waveBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    height: 42,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  waveBarActive: {
    backgroundColor: '#0284C7',
  },
  waveBarInactive: {
    backgroundColor: '#CBD5E1',
  },
  miniProgressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#1E3A5F',
    borderRadius: 2,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: font.family,
  },
  audioInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  audioInfoText: {
    fontSize: 10.5,
    color: '#64748B',
    fontFamily: font.family,
    flex: 1,
    lineHeight: 15,
  },
  // Question Cards
  questionsListWrap: {
    gap: 14,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  questionCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qNumBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qNumBadgeAnswered: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  qNumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A5F',
    fontFamily: font.family,
  },
  categoryPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  qActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookmarkBtn: {
    padding: 4,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  translateBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  translateBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  translateBtnTextActive: {
    color: colors.primary,
  },
  questionPromptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    fontFamily: font.family,
  },
  translationBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  translationText: {
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18,
    flex: 1,
  },
  // Options
  optionsList: {
    gap: 9,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionCardSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#F8FAFC',
  },
  optionCardRevealedCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionCardRevealedWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionKeyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionKeyCircleSelected: {
    backgroundColor: '#1E3A5F',
  },
  optionKeyCircleRevealedCorrect: {
    backgroundColor: '#10B981',
  },
  optionKeyCircleRevealedWrong: {
    backgroundColor: '#EF4444',
  },
  optionKeyText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#475569',
    fontFamily: font.family,
  },
  optionKeyTextSelected: {
    color: '#FFFFFF',
  },
  optionContentWrap: {
    flex: 1,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 20,
    fontFamily: font.family,
  },
  optionLabelTextSelected: {
    fontWeight: '700',
    color: '#0F172A',
  },
  optionLabelTextRevealedCorrect: {
    fontWeight: '700',
    color: '#065F46',
  },
  optionLabelTextRevealedWrong: {
    fontWeight: '700',
    color: '#991B1B',
  },
  optionSubLabelText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  explanationText: {
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
