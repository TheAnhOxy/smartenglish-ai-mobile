import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import {
  Volume2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Camera,
  Activity,
  CheckCircle,
} from 'lucide-react-native';
import { colors } from '../../../../theme/colors';

export interface ListeningPhotoQuestion {
  id: string | number;
  questionNumber: number;
  totalQuestions: number;
  partName?: string;
  partNumber?: number;
  partTitle?: string;
  photoUrl?: string;
  audioDurationSeconds?: number;
  audioCurrentSeconds?: number;
  instructionTitle?: string;
  instructionSub?: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    statement: string;
    subtext: string;
  }[];
  selectedKey?: string | null;
  isBookmarked?: boolean;
}

interface ListeningPhotoViewProps {
  question: ListeningPhotoQuestion;
  onSelectOption: (key: string) => void;
  onToggleBookmark?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  showFooterNav?: boolean;
}

export const ListeningPhotoView: React.FC<ListeningPhotoViewProps> = ({
  question,
  onSelectOption,
  onToggleBookmark,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = true,
  showFooterNav = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(question.audioCurrentSeconds || 8);
  const totalSeconds = question.audioDurationSeconds || 18;

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

  const progressPercent = Math.min(100, Math.round((seconds / totalSeconds) * 100));

  const photoUri =
    question.photoUrl ||
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';

  return (
    <View style={styles.container}>
      {/* Photo Container with badge */}
      <View style={styles.imageCard}>
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.photoBadge}>
          <Camera size={13} color="#FFFFFF" />
          <Text style={styles.photoBadgeText}>
            Ảnh #{question.questionNumber < 10 ? `0${question.questionNumber}` : question.questionNumber}
          </Text>
        </View>
      </View>

      {/* Audio Player Card */}
      <View style={styles.playerCard}>
        <View style={styles.playerRow}>
          <Pressable
            onPress={() => setIsPlaying(!isPlaying)}
            style={({ pressed }) => [styles.speakerBtn, pressed && styles.pressed]}
          >
            <Volume2 size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.sliderSection}>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(seconds)}</Text>
              <Text style={styles.timeTotalText}>{formatTime(totalSeconds)}</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          <View style={styles.equalizerWrap}>
            <Activity size={18} color={isPlaying ? '#1E3A8A' : '#64748B'} />
          </View>
        </View>

        <View style={styles.playerFooterRow}>
          <View style={styles.footnoteLeft}>
            <View style={styles.cyanDot} />
            <Text style={styles.footnoteText}>Chỉ được nghe 1 lần tự động</Text>
          </View>
          <Text style={styles.footnoteRight}>Chuẩn ETS TOEIC</Text>
        </View>
      </View>

      {/* Instruction Section */}
      <View style={styles.instructionWrap}>
        <Text style={styles.promptTitle}>
          {question.instructionTitle || 'Chọn câu mô tả đúng nhất cho bức ảnh trên.'}
        </Text>
        <Text style={styles.promptSub}>
          {question.instructionSub ||
            'Lắng nghe 4 phát biểu (A), (B), (C), (D) trong đoạn băng và chọn phương án chính xác.'}
        </Text>
      </View>

      {/* Options List A, B, C, D */}
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
              <View style={styles.optionContentLeft}>
                <View style={[styles.keyCircle, isSelected && styles.keyCircleSelected]}>
                  <Text style={[styles.keyText, isSelected && styles.keyTextSelected]}>
                    {opt.key}
                  </Text>
                </View>

                <View style={styles.optionTexts}>
                  <Text style={[styles.statementText, isSelected && styles.statementTextSelected]}>
                    {opt.statement}
                  </Text>
                  <Text style={styles.subtext}>{opt.subtext}</Text>
                </View>
              </View>

              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Sub Action Row */}
      <View style={styles.subActionRow}>
        <Pressable
          onPress={onToggleBookmark}
          style={({ pressed }) => [
            styles.bookmarkBtn,
            question.isBookmarked && styles.bookmarkBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <Bookmark
            size={16}
            color={question.isBookmarked ? '#1E3A8A' : '#475569'}
            fill={question.isBookmarked ? '#1E3A8A' : 'none'}
          />
          <Text
            style={[
              styles.bookmarkText,
              question.isBookmarked && styles.bookmarkTextActive,
            ]}
          >
            Đánh dấu xem lại
          </Text>
        </Pressable>

        <View style={styles.hintTouchWrap}>
          <Text style={styles.hintTouchText}>👆 Chạm để chọn câu trả lời</Text>
        </View>
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
  imageCard: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderSection: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeTotalText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 3,
  },
  equalizerWrap: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  playerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  footnoteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
  },
  footnoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footnoteRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  instructionWrap: {
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 4,
  },
  promptSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  keyCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCircleSelected: {
    backgroundColor: '#1E3A8A',
  },
  keyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  keyTextSelected: {
    color: '#FFFFFF',
  },
  optionTexts: {
    flex: 1,
  },
  statementText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statementTextSelected: {
    color: '#1E3A8A',
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1E3A8A',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E3A8A',
  },
  subActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  bookmarkBtnActive: {
    backgroundColor: '#EFF6FF',
  },
  bookmarkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bookmarkTextActive: {
    color: '#1E3A8A',
  },
  hintTouchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintTouchText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
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
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1E3A8A',
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
