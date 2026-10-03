import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  Play,
  Pause,
  Headphones,
  Activity,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
} from 'lucide-react-native';
import { colors } from '../../../../theme/colors';

export interface GroupStepItem {
  number: number;
  isAnswered: boolean;
}

export interface ListeningGroupQuestion {
  id: string | number;
  questionNumber: number;
  totalQuestions: number;
  groupRangeText: string; // e.g. "Nhóm câu 12–14"
  groupAudioBadge: string; // e.g. "Hội thoại câu 12–14"
  audioDurationSeconds?: number;
  audioCurrentSeconds?: number;
  groupSteps: GroupStepItem[]; // e.g. [{ number: 12, isAnswered: true }, { number: 13, isAnswered: false }, { number: 14, isAnswered: false }]
  questionPrompt: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  selectedKey?: string | null;
  isBookmarked?: boolean;
}

interface ListeningGroupViewProps {
  question: ListeningGroupQuestion;
  onSelectOption: (key: string) => void;
  onSelectStepQuestion?: (questionNumber: number) => void;
  onToggleBookmark?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  showFooterNav?: boolean;
}

// Waveform bar heights array to render realistic sound bars
const WAVE_BARS = [
  12, 22, 16, 28, 36, 24, 32, 40, 28, 35, 42, 30, 20, 34, 40, 26, 32, 20, 16, 22, 18, 12,
];

export const ListeningGroupView: React.FC<ListeningGroupViewProps> = ({
  question,
  onSelectOption,
  onSelectStepQuestion,
  onToggleBookmark,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = true,
  showFooterNav = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [seconds, setSeconds] = useState(question.audioCurrentSeconds || 24);
  const totalSeconds = question.audioDurationSeconds || 46;

  useEffect(() => {
    let interval: any = null;
    if (isPlaying && seconds < totalSeconds) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, seconds, totalSeconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressFraction = seconds / totalSeconds;
  const activeBarCount = Math.floor(progressFraction * WAVE_BARS.length);

  return (
    <View style={styles.container}>
      {/* Audio Player Card with Waveform */}
      <View style={styles.audioPlayerCard}>
        {/* Top Badges */}
        <View style={styles.audioBadgeRow}>
          <View style={styles.dialogBadge}>
            <Headphones size={13} color="#1E40AF" />
            <Text style={styles.dialogBadgeText}>{question.groupAudioBadge || 'Hội thoại câu 12–14'}</Text>
          </View>
          <View style={styles.playingBadge}>
            <Activity size={13} color="#0284C7" />
            <Text style={styles.playingBadgeText}>Đang phát âm thanh</Text>
          </View>
        </View>

        {/* Player Container */}
        <View style={styles.playerInnerBox}>
          <View style={styles.playerMainRow}>
            {/* Play/Pause Button */}
            <Pressable
              onPress={() => setIsPlaying(!isPlaying)}
              style={({ pressed }) => [styles.playPauseBtn, pressed && styles.pressed]}
            >
              {isPlaying ? (
                <Pause size={20} color="#FFFFFF" />
              ) : (
                <Play size={20} color="#FFFFFF" />
              )}
            </Pressable>

            {/* Sound Waveform Visualization */}
            <View style={styles.waveFormArea}>
              <View style={styles.waveBarsRow}>
                {WAVE_BARS.map((h, idx) => {
                  const isBarActive = idx <= activeBarCount;
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

              {/* Progress slider bar under waveform */}
              <View style={styles.miniProgressTrack}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${Math.round(progressFraction * 100)}%` },
                  ]}
                />
              </View>

              <View style={styles.timeLabelsRow}>
                <Text style={styles.timeCurrentText}>{formatTime(seconds)}</Text>
                <Text style={styles.timeTotalText}>{formatTime(totalSeconds)}</Text>
              </View>
            </View>
          </View>

          {/* Info note */}
          <View style={styles.audioInfoRow}>
            <Info size={13} color="#64748B" />
            <Text style={styles.audioInfoText}>
              Đoạn băng phát tự động 1 lần theo chuẩn ETS · Không có transcript
            </Text>
          </View>
        </View>
      </View>

      {/* Question Group Stepper Card */}
      <View style={styles.groupStepperCard}>
        <View style={styles.stepperLeft}>
          <Text style={styles.groupTitleText}>{question.groupRangeText || 'Nhóm câu 12–14'}</Text>
          <Text style={styles.groupSubText}>
            Đang làm câu {question.questionNumber}
          </Text>
        </View>

        <View style={styles.stepperCirclesRow}>
          {question.groupSteps.map((step) => {
            const isCurrent = step.number === question.questionNumber;
            const isDone = step.isAnswered && !isCurrent;

            return (
              <Pressable
                key={step.number}
                onPress={() => onSelectStepQuestion && onSelectStepQuestion(step.number)}
                style={({ pressed }) => [
                  styles.stepCircleBase,
                  isCurrent && styles.stepCircleCurrent,
                  isDone && styles.stepCircleDone,
                  pressed && styles.pressed,
                ]}
              >
                {isDone ? (
                  <Check size={16} color="#475569" />
                ) : (
                  <Text
                    style={[
                      styles.stepText,
                      isCurrent && styles.stepTextCurrent,
                      !isCurrent && !isDone && styles.stepTextPending,
                    ]}
                  >
                    {step.number}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Question Prompt Card */}
      <View style={styles.promptCard}>
        <View style={styles.promptHeaderRow}>
          <View style={styles.questionNumBadge}>
            <Text style={styles.questionNumBadgeText}>
              Câu hỏi {question.questionNumber}
            </Text>
          </View>

          <Pressable
            onPress={onToggleBookmark}
            style={({ pressed }) => [
              styles.bookmarkBtn,
              question.isBookmarked && styles.bookmarkBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Bookmark
              size={15}
              color={question.isBookmarked ? '#1E3A8A' : '#475569'}
              fill={question.isBookmarked ? '#1E3A8A' : 'none'}
            />
            <Text
              style={[
                styles.bookmarkBtnText,
                question.isBookmarked && styles.bookmarkBtnTextActive,
              ]}
            >
              Đánh dấu xem lại
            </Text>
          </Pressable>
        </View>

        <Text style={styles.questionPromptTitle}>{question.questionPrompt}</Text>
      </View>

      {/* 4 Choices */}
      <View style={styles.optionsList}>
        {question.options.map((opt) => {
          const isSelected = question.selectedKey === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelectOption(opt.key)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.optionKeyCircle, isSelected && styles.optionKeyCircleSelected]}>
                <Text style={[styles.optionKeyText, isSelected && styles.optionKeyTextSelected]}>
                  {opt.key}
                </Text>
              </View>

              <Text style={[styles.optionStatement, isSelected && styles.optionStatementSelected]}>
                {opt.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Navigation Footer */}
      {showFooterNav && (
        <View style={styles.navRow}>
          <Pressable
            onPress={onPrev}
            disabled={!hasPrev}
            style={({ pressed }) => [
              styles.navBtnPrev,
              !hasPrev && styles.navBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={18} color={hasPrev ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.navBtnPrevText, !hasPrev && styles.textDisabled]}>
              Câu trước
            </Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            style={({ pressed }) => [styles.navBtnNext, pressed && styles.pressed]}
          >
            <Text style={styles.navBtnNextText}>
              {hasNext ? 'Tiếp' : 'Hoàn tất'}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  audioPlayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  audioBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dialogBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dialogBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  playingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  playerInnerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  playPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F2C59',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F2C59',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  waveFormArea: {
    flex: 1,
  },
  waveBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    marginBottom: 6,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  waveBarActive: {
    backgroundColor: '#0F2C59',
  },
  waveBarInactive: {
    backgroundColor: '#CBD5E1',
  },
  miniProgressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#0F2C59',
    borderRadius: 2,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeCurrentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeTotalText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  audioInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  audioInfoText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    flex: 1,
  },
  groupStepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  stepperLeft: {
    flex: 1,
  },
  groupTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  groupSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepperCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircleBase: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCurrent: {
    backgroundColor: '#0F2C59',
    borderWidth: 3,
    borderColor: '#93C5FD',
  },
  stepCircleDone: {
    backgroundColor: '#E2E8F0',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepTextPending: {
    color: '#475569',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  questionNumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookmarkBtnActive: {
    backgroundColor: '#EFF6FF',
  },
  bookmarkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bookmarkBtnTextActive: {
    color: '#1E3A8A',
  },
  questionPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  optionsList: {
    gap: 10,
    marginBottom: 18,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  optionKeyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionKeyCircleSelected: {
    backgroundColor: '#0F2C59',
  },
  optionKeyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  optionKeyTextSelected: {
    color: '#FFFFFF',
  },
  optionStatement: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    lineHeight: 21,
  },
  optionStatementSelected: {
    color: '#0F2C59',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtnPrev: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  navBtnPrevText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  textDisabled: {
    color: '#94A3B8',
  },
  navBtnNext: {
    flex: 1.3,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0F2C59',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0F2C59',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  navBtnNextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
