import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Bookmark, CheckCircle2 } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';

export interface MultipleChoiceQuestionData {
  id: string;
  categoryTag?: string; // e.g. "Trắc nghiệm • Ngữ pháp"
  instruction?: string; // e.g. "Chọn đáp án đúng nhất để hoàn thành câu sau:"
  questionText: string;
  options: Array<{ key: string; label: string; text: string }>;
  explanationVi?: string;
}

interface Props {
  question: MultipleChoiceQuestionData;
  selectedOption?: string;
  onSelectOption: (key: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function MultipleChoiceView({
  question,
  selectedOption,
  onSelectOption,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Category Tag */}
      <View style={styles.tagWrapper}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>
            {question.categoryTag || '• Trắc nghiệm • Ngữ pháp'}
          </Text>
        </View>
      </View>

      {/* Main Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.instructionText}>
            {question.instruction || 'Chọn đáp án chính xác nhất:'}
          </Text>
          <Pressable
            onPress={onToggleBookmark}
            style={({ pressed }) => [styles.bookmarkBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Bookmark
              size={20}
              color={isBookmarked ? colors.primary : colors.textSoft}
              fill={isBookmarked ? colors.primary : 'transparent'}
            />
          </Pressable>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{question.questionText}</Text>
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        {question.options.map((opt) => {
          const isSelected = selectedOption === opt.key;

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
              {/* Option Key Badge (A, B, C, D) */}
              <View
                style={[
                  styles.optionKeyCircle,
                  isSelected && styles.optionKeyCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionKeyText,
                    isSelected && styles.optionKeyTextSelected,
                  ]}
                >
                  {opt.label || opt.key}
                </Text>
              </View>

              {/* Option Text */}
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {opt.text}
              </Text>

              {/* Selected Checkmark or Radio */}
              {isSelected ? (
                <CheckCircle2 size={20} color="#1A4B84" />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </Pressable>
          );
        })}
      </View>
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
    fontWeight: '700',
    color: '#1A4B84',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
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
    marginBottom: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 20,
  },
  bookmarkBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#1A4B84',
    backgroundColor: '#F0F6FC',
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
    backgroundColor: '#1A4B84',
  },
  optionKeyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  optionKeyTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#0F3D6B',
    fontWeight: '700',
  },
  radioEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
