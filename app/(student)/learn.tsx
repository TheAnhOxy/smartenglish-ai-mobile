import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LearningPathScreen } from '@/src/features/learning-path/presentation/screens/LearningPathScreen';
import { DecksScreen } from '@/src/features/flashcard-srs/presentation/screens/DecksScreen';
import { SpeakingTopicsListScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingTopicsListScreen';
import { QuickQuizSetupScreen } from '@/src/features/quiz-exam/presentation/screens/QuickQuizSetupScreen';

export default function LearnTabContainer() {
  const [activeSegment, setActiveSegment] = useState<'path' | 'decks' | 'speaking' | 'quiz'>('path');

  return (
    <View style={styles.container}>
      {/* Top 4-Segment Switcher Bar */}
      <View style={styles.switcherBar}>
        <View style={styles.switcherRow}>
          <Pressable
            onPress={() => setActiveSegment('path')}
            style={[styles.segmentBtn, activeSegment === 'path' && styles.segmentActive1]}
          >
            <Text style={[styles.segmentText, activeSegment === 'path' && styles.segmentTextActive]}>
              🗺️ Lộ Trình
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('decks')}
            style={[styles.segmentBtn, activeSegment === 'decks' && styles.segmentActive2]}
          >
            <Text style={[styles.segmentText, activeSegment === 'decks' && styles.segmentTextActive]}>
              🎴 Bộ Thẻ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('speaking')}
            style={[styles.segmentBtn, activeSegment === 'speaking' && styles.segmentActive3]}
          >
            <Text style={[styles.segmentText, activeSegment === 'speaking' && styles.segmentTextActive]}>
              🗣️ Luyện Nói
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('quiz')}
            style={[styles.segmentBtn, activeSegment === 'quiz' && styles.segmentActive4]}
          >
            <Text style={[styles.segmentText, activeSegment === 'quiz' && styles.segmentTextActive]}>
              ⚡ Quiz
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
    backgroundColor: '#F8FAF9',
  },
  switcherBar: {
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switcherRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive1: {
    backgroundColor: '#4F46E5',
  },
  segmentActive2: {
    backgroundColor: '#FF6B35',
  },
  segmentActive3: {
    backgroundColor: '#00BCD4',
  },
  segmentActive4: {
    backgroundColor: '#1E3A5F',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
