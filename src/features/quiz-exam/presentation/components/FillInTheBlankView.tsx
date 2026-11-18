import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Bookmark, Lightbulb, Info, X } from '@/src/components/ds/icons';
import { colors } from '@/src/theme/colors';
import { ds, dsFont } from '@/src/theme/ds';

export interface FillInTheBlankQuestionData {
  id: string;
  categoryTag?: string; // e.g. "• Điền từ • Ngữ pháp B1"
  instruction: string; // e.g. "Điền dạng đúng của động từ vào chỗ trống để hoàn thành câu:"
  sentenceBefore: string; // e.g. "She has"
  blankPlaceholder?: string; // e.g. "worked"
  sentenceAfter: string; // e.g. "in this company for five years."
  grammarHint?: string; // e.g. "Dùng dạng quá khứ phân từ (Past Participle - V3/ed) của động từ 'work' sau thì Hiện tại hoàn thành (Present Perfect)."
  wordBank?: string[]; // e.g. ["worked", "working", "works", "work"]
  correctAnswer: string;
}

interface Props {
  question: FillInTheBlankQuestionData;
  userAnswer?: string;
  onAnswerChange: (answer: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function FillInTheBlankView({
  question,
  userAnswer = '',
  onAnswerChange,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const [showHint, setShowHint] = useState(false);

  const displayBlank = userAnswer.trim() !== '' ? userAnswer : (question.blankPlaceholder && question.blankPlaceholder !== question.correctAnswer ? question.blankPlaceholder : '______');

  const handleSelectWord = (word: string) => {
    onAnswerChange(word);
  };

  const handleClear = () => {
    onAnswerChange('');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Category Tag */}
      <View style={styles.tagWrapper}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>
            {question.categoryTag || '• Điền từ • Ngữ pháp B1'}
          </Text>
        </View>
      </View>

      {/* Main Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.instructionText}>{question.instruction}</Text>
          <Pressable
            onPress={onToggleBookmark}
            style={({ pressed }) => [styles.bookmarkBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Bookmark
              size={20}
              color={isBookmarked ? ds.btn : ds.muted}
              fill={isBookmarked ? ds.btn : 'transparent'}
            />
          </Pressable>
        </View>

        {/* Sentence with Highlighted Blank Pill */}
        <View style={styles.sentenceContainer}>
          <Text style={styles.sentenceText}>
            {question.sentenceBefore}{' '}
            <View style={styles.blankPill}>
              <Text style={styles.blankPillText}>{displayBlank}</Text>
            </View>{' '}
            {question.sentenceAfter}
          </Text>
        </View>

        {/* Answer Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeaderRow}>
            <Text style={styles.inputLabel}>Câu trả lời của bạn:</Text>
            {question.grammarHint ? (
              <Pressable
                onPress={() => setShowHint((prev) => !prev)}
                style={({ pressed }) => [
                  styles.hintTriggerBtn,
                  showHint && styles.hintTriggerBtnActive,
                  pressed && styles.pressed,
                ]}
              >
                <Lightbulb size={15} color={ds.btn} />
                <Text style={styles.hintTriggerText}>Gợi ý</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Input Box */}
          <View style={styles.inputBoxContainer}>
            <TextInput
              style={styles.textInput}
              value={userAnswer}
              onChangeText={onAnswerChange}
              placeholder="Nhập từ cần điền..."
              placeholderTextColor={ds.faint}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {userAnswer.length > 0 && (
              <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
                <X size={18} color={ds.muted} />
              </Pressable>
            )}
          </View>

          {/* Grammar Hint Box */}
          {showHint && question.grammarHint ? (
            <View style={styles.hintBox}>
              <Info size={18} color={ds.btn} style={styles.hintIcon} />
              <Text style={styles.hintContentText}>
                <Text style={styles.hintBoldTitle}>Gợi ý ngữ pháp: </Text>
                {question.grammarHint}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Word Bank Section */}
      {question.wordBank && question.wordBank.length > 0 && (
        <View style={styles.wordBankSection}>
          <Text style={styles.wordBankLabel}>Hoặc chọn từ trong ngân hàng từ:</Text>
          <View style={styles.wordBankRow}>
            {question.wordBank.map((word, idx) => {
              const isSelected = userAnswer.trim().toLowerCase() === word.toLowerCase();
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectWord(word)}
                  style={({ pressed }) => [
                    styles.wordChip,
                    isSelected && styles.wordChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.wordChipText, isSelected && styles.wordChipTextSelected]}>
                    {word}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tagWrapper: {
    marginBottom: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F0FA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryTagText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#1A4B84',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    shadowColor: '#0F2A44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: dsFont.semibold,
    color: '#33465C',
    lineHeight: 22,
  },
  bookmarkBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  sentenceContainer: {
    marginBottom: 20,
  },
  sentenceText: {
    fontSize: 22,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    lineHeight: 34,
  },
  blankPill: {
    backgroundColor: '#DCEBFA',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
  },
  blankPillText: {
    fontSize: 20,
    fontFamily: dsFont.display,
    color: '#144173',
  },
  inputSection: {
    gap: 10,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: dsFont.semibold,
    color: '#5B6B7F',
  },
  hintTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF3FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  hintTriggerBtnActive: {
    backgroundColor: '#D6E8F8',
  },
  hintTriggerText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#1A4B84',
  },
  inputBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F2A44',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  clearBtn: {
    padding: 4,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F6FC',
    borderWidth: 1,
    borderColor: '#CDE1F5',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  hintIcon: {
    marginTop: 2,
  },
  hintContentText: {
    fontFamily: dsFont.body,
    flex: 1,
    fontSize: 13,
    color: '#0F2A44',
    lineHeight: 19,
  },
  hintBoldTitle: {
    fontFamily: dsFont.bold,
    color: '#144173',
  },
  wordBankSection: {
    marginTop: 4,
  },
  wordBankLabel: {
    fontSize: 13,
    fontFamily: dsFont.semibold,
    color: '#5B6B7F',
    marginBottom: 10,
  },
  wordBankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E3EAF2',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  wordChipSelected: {
    backgroundColor: '#DCEBFA',
    borderColor: '#93C0ED',
  },
  wordChipText: {
    fontSize: 15,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  wordChipTextSelected: {
    color: '#144173',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
