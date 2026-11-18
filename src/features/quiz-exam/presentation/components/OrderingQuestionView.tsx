import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Bookmark, RotateCcw, CheckCircle2, XCircle, Sparkles } from '@/src/components/ds/icons';
import { colors } from '@/src/theme/colors';
import { ds, dsFont } from '@/src/theme/ds';

export interface OrderingQuestionData {
  id: string;
  categoryTag?: string;
  instruction?: string;
  questionText?: string;
  items?: string[]; // word/phrase tokens to order
  correctAnswer: string; // e.g. "She has been working here for years."
  explanationVi?: string;
}

interface Props {
  question: OrderingQuestionData;
  userAnswer?: string;
  onAnswerChange: (answer: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isPracticeMode?: boolean;
  isRevealed?: boolean;
}

export function OrderingQuestionView({
  question,
  userAnswer = '',
  onAnswerChange,
  isBookmarked,
  onToggleBookmark,
  isPracticeMode = false,
  isRevealed = false,
}: Props) {
  // Tokenize available words: from question.items or questionText split
  const rawTokens = useMemo(() => {
    if (Array.isArray(question.items) && question.items.length > 0) {
      return question.items;
    }
    if (question.correctAnswer) {
      // Split sentence into words and shuffle stably
      return question.correctAnswer.split(/\s+/).filter(Boolean);
    }
    return [];
  }, [question.items, question.correctAnswer]);

  // Track placed tokens by index in rawTokens
  const [placedIndices, setPlacedIndices] = useState<number[]>([]);

  useEffect(() => {
    if (userAnswer) {
      const words = userAnswer.split(/\s+/).filter(Boolean);
      const used = new Set<number>();
      const indices: number[] = [];
      for (const w of words) {
        const idx = rawTokens.findIndex((t, i) => t.toLowerCase() === w.toLowerCase() && !used.has(i));
        if (idx !== -1) {
          used.add(idx);
          indices.push(idx);
        }
      }
      setPlacedIndices(indices);
    } else {
      setPlacedIndices([]);
    }
  }, [userAnswer, rawTokens]);

  const handleTapBankToken = (index: number) => {
    if (isPracticeMode && isRevealed) return;
    if (placedIndices.includes(index)) return;
    const next = [...placedIndices, index];
    setPlacedIndices(next);
    onAnswerChange(next.map((i) => rawTokens[i]).join(' '));
  };

  const handleTapPlacedToken = (placedPosition: number) => {
    if (isPracticeMode && isRevealed) return;
    const next = placedIndices.filter((_, i) => i !== placedPosition);
    setPlacedIndices(next);
    onAnswerChange(next.map((i) => rawTokens[i]).join(' '));
  };

  const handleReset = () => {
    if (isPracticeMode && isRevealed) return;
    setPlacedIndices([]);
    onAnswerChange('');
  };

  const currentSentence = placedIndices.map((i) => rawTokens[i]).join(' ');
  const isCorrect = currentSentence.trim().toLowerCase() === (question.correctAnswer || '').trim().toLowerCase();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Category Tag */}
      <View style={styles.tagWrapper}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>
            {question.categoryTag || '• Sắp xếp câu • Ngữ pháp'}
          </Text>
        </View>
      </View>

      {/* Main Question Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.instructionText}>
            {question.instruction || 'Chạm vào các từ bên dưới theo đúng thứ tự để tạo thành câu hoàn chỉnh:'}
          </Text>
          <Pressable
            onPress={onToggleBookmark}
            style={({ pressed }) => [styles.bookmarkBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Bookmark
              size={20}
              color={isBookmarked ? ds.btn : ds.muted}
              fill={isBookmarked ? ds.btn : 'none'}
            />
          </Pressable>
        </View>

        {Boolean(question.questionText) && (
          <Text style={styles.promptText}>{question.questionText}</Text>
        )}

        {/* Placed Words Slot */}
        <View style={[styles.slotContainer, isRevealed && (isCorrect ? styles.slotCorrect : styles.slotWrong)]}>
          {placedIndices.length === 0 ? (
            <Text style={styles.slotPlaceholder}>Chạm các từ bên dưới để ghép vào đây...</Text>
          ) : (
            <View style={styles.tokensRow}>
              {placedIndices.map((tokenIdx, pos) => (
                <Pressable
                  key={`placed-${tokenIdx}-${pos}`}
                  disabled={isPracticeMode && isRevealed}
                  onPress={() => handleTapPlacedToken(pos)}
                  style={({ pressed }) => [styles.placedChip, pressed && styles.pressed]}
                >
                  <Text style={styles.placedChipText}>{rawTokens[tokenIdx]}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {placedIndices.length > 0 && !(isPracticeMode && isRevealed) && (
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={14} color={ds.muted} />
              <Text style={styles.resetBtnText}>Làm lại câu này</Text>
            </Pressable>
          )}
        </View>

        {/* Available Word Bank */}
        <Text style={styles.bankLabel}>Kho từ có sẵn:</Text>
        <View style={styles.bankRow}>
          {rawTokens.map((token, index) => {
            const isUsed = placedIndices.includes(index);
            return (
              <Pressable
                key={`bank-${index}`}
                disabled={isUsed || (isPracticeMode && isRevealed)}
                onPress={() => handleTapBankToken(index)}
                style={({ pressed }) => [
                  styles.bankChip,
                  isUsed && styles.bankChipUsed,
                  pressed && !isUsed && styles.pressed,
                ]}
              >
                <Text style={[styles.bankChipText, isUsed && styles.bankChipTextUsed]}>
                  {token}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Practice Mode Feedback */}
        {isPracticeMode && isRevealed && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={styles.feedbackTitleRow}>
              {isCorrect ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : (
                <XCircle size={18} color="#DC2626" />
              )}
              <Text style={[styles.feedbackTitle, isCorrect ? styles.feedbackTitleGreen : styles.feedbackTitleRed]}>
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </Text>
            </View>

            {!isCorrect && (
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerLabel}>Đáp án đúng:</Text>
                <Text style={styles.correctAnswerText}>{question.correctAnswer}</Text>
              </View>
            )}

            {Boolean(question.explanationVi) && (
              <View style={styles.explanationBox}>
                <View style={styles.explanationHeaderRow}>
                  <Sparkles size={14} color={ds.btn} />
                  <Text style={styles.explanationHeading}>Giải thích:</Text>
                </View>
                <Text style={styles.explanationText}>{question.explanationVi}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  tagWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
  },
  categoryTagText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#0369A1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    lineHeight: 20,
  },
  bookmarkBtn: {
    padding: 4,
  },
  promptText: {
    fontSize: 15,
    fontFamily: dsFont.semibold,
    color: '#33465C',
  },
  slotContainer: {
    minHeight: 84,
    backgroundColor: '#F4F7FB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD6E2',
    padding: 12,
    justifyContent: 'center',
    gap: 8,
  },
  slotCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
    borderStyle: 'solid',
  },
  slotWrong: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    borderStyle: 'solid',
  },
  slotPlaceholder: {
    fontFamily: dsFont.body,
    fontSize: 13,
    color: '#8597AB',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placedChip: {
    backgroundColor: ds.btn,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: ds.btn,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  placedChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: dsFont.bold,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingTop: 4,
  },
  resetBtnText: {
    fontSize: 12,
    color: ds.muted,
    fontFamily: dsFont.semibold,
  },
  bankLabel: {
    fontSize: 13,
    fontFamily: dsFont.bold,
    color: '#5B6B7F',
    marginTop: 6,
  },
  bankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  bankChipUsed: {
    opacity: 0.28,
    backgroundColor: '#E3EAF2',
    borderColor: '#CBD6E2',
  },
  bankChipText: {
    color: '#0F2A44',
    fontSize: 14,
    fontFamily: dsFont.bold,
  },
  bankChipTextUsed: {
    color: '#8597AB',
  },
  feedbackCard: {
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 4,
  },
  feedbackCorrect: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 15,
    fontFamily: dsFont.display,
  },
  feedbackTitleGreen: {
    color: '#16A34A',
  },
  feedbackTitleRed: {
    color: '#DC2626',
  },
  correctAnswerBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
    gap: 2,
  },
  correctAnswerLabel: {
    fontSize: 11,
    fontFamily: dsFont.bold,
    color: '#16A34A',
  },
  correctAnswerText: {
    fontSize: 14,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  explanationBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationHeading: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: ds.btn,
  },
  explanationText: {
    fontFamily: dsFont.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#33465C',
  },
  pressed: {
    opacity: 0.75,
  },
});
