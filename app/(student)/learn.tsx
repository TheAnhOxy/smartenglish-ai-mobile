import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningPathScreen } from '@/src/features/learning-path/presentation/screens/LearningPathScreen';
import { DecksScreen } from '@/src/features/flashcard-srs/presentation/screens/DecksScreen';
import { SpeakingTopicsListScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingTopicsListScreen';
import { QuickQuizSetupScreen } from '@/src/features/quiz-exam/presentation/screens/QuickQuizSetupScreen';
import { colors } from '@/src/theme/colors';

export default function LearnTabContainer() {
  const [activeSegment, setActiveSegment] = useState<'path' | 'decks' | 'speaking' | 'quiz'>('path');
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, 48) + 8;

  return (
    <View style={styles.container}>
      {/* Top Segment Switcher Bar */}
      <View style={[styles.switcherBar, { paddingTop: safeTop }]}>
        <View style={styles.switcherRow}>
          <Pressable
            onPress={() => setActiveSegment('path')}
            style={[styles.segmentBtn, activeSegment === 'path' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activeSegment === 'path' && styles.segmentTextActive]}>
              Lộ Trình
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('decks')}
            style={[styles.segmentBtn, activeSegment === 'decks' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activeSegment === 'decks' && styles.segmentTextActive]}>
              Bộ Thẻ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('speaking')}
            style={[styles.segmentBtn, activeSegment === 'speaking' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activeSegment === 'speaking' && styles.segmentTextActive]}>
              Luyện Nói
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('quiz')}
            style={[styles.segmentBtn, activeSegment === 'quiz' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activeSegment === 'quiz' && styles.segmentTextActive]}>
              Quiz
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeSegment === 'path' && <LearningPathScreen />}
        {activeSegment === 'decks' && <DecksScreen />}
        {activeSegment === 'speaking' && <SpeakingTopicsListScreen />}
        {activeSegment === 'quiz' && <QuickQuizSetupScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  switcherBar: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switcherRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  // Đồng nhất: tất cả active dùng navy primary
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textFaint,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
