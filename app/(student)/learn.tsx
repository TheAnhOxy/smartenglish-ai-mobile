import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, Layers, Mic, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LearningPathScreen } from '@/src/features/learning-path/presentation/screens/LearningPathScreen';
import { DecksScreen } from '@/src/features/flashcard-srs/presentation/screens/DecksScreen';
import { SpeakingHomeScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingHomeScreen';
import { QuickQuizSetupScreen } from '@/src/features/quiz-exam/presentation/screens/QuickQuizSetupScreen';
import { colors, cardGradients } from '@/src/theme';
import { spring } from '@/src/theme/motion';

type SegmentKey = 'path' | 'decks' | 'speaking' | 'quiz';

interface TabItem {
  key: SegmentKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; fill?: string }>;
}

const TABS: TabItem[] = [
  { key: 'path', label: 'Lộ Trình', icon: Compass },
  { key: 'decks', label: 'Bộ Thẻ', icon: Layers },
  { key: 'speaking', label: 'Luyện Nói', icon: Mic },
  { key: 'quiz', label: 'Quiz', icon: Zap },
];

export default function LearnTabContainer() {
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('path');
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, 44) + 6;

  return (
    <View style={styles.container}>
      {/* Top Floating Segment Switcher Bar */}
      <View style={[styles.switcherBar, { paddingTop: safeTop }]}>
        <View style={styles.capsuleTrack}>
          {TABS.map((tab) => {
            const isActive = activeSegment === tab.key;
            const IconComp = tab.icon;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveSegment(tab.key)}
                style={styles.tabBtn}
              >
                {isActive && (
                  <LinearGradient
                    colors={['#1E1B4B', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activePillBackground}
                  />
                )}
                <View style={styles.tabContentRow}>
                  <IconComp
                    size={16}
                    color={isActive ? '#FFFFFF' : colors.textSoft}
                    fill={isActive && tab.key === 'quiz' ? '#FFFFFF' : 'none'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeSegment === 'path' && <LearningPathScreen />}
        {activeSegment === 'decks' && <DecksScreen />}
        {activeSegment === 'speaking' && <SpeakingHomeScreen />}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  capsuleTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: 20,
    position: 'relative',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activePillBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: colors.textSoft,
  },
  content: {
    flex: 1,
  },
});

