import React, { useState, useEffect, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, Layers, Mic, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LearningPathScreen } from '@/src/features/learning-path/presentation/screens/LearningPathScreen';
import { DecksScreen } from '@/src/features/flashcard-srs/presentation/screens/DecksScreen';
import { SpeakingHomeScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingHomeScreen';
import { ExamCatalogScreen } from '@/src/features/quiz-exam/presentation/screens/ExamCatalogScreen';
import { colors } from '@/src/theme';

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

const MemoizedLearningPathScreen = memo(LearningPathScreen);
const MemoizedDecksScreen = memo(DecksScreen);
const MemoizedSpeakingHomeScreen = memo(SpeakingHomeScreen);
const MemoizedExamCatalogScreen = memo(ExamCatalogScreen);

export default function LearnTabContainer() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialKey: SegmentKey =
    params.tab === 'quiz' || params.tab === 'decks' || params.tab === 'speaking' || params.tab === 'path'
      ? (params.tab as SegmentKey)
      : 'path';

  const [activeSegment, setActiveSegment] = useState<SegmentKey>(initialKey);

  // Lazy tab initialization: only mount screens when their tab is first opened.
  // This allows instant tab switching and displays the screen's loading state immediately.
  const [visitedTabs, setVisitedTabs] = useState<Record<SegmentKey, boolean>>(() => ({
    path: initialKey === 'path',
    decks: initialKey === 'decks',
    speaking: initialKey === 'speaking',
    quiz: initialKey === 'quiz',
  }));

  useEffect(() => {
    if (params.tab === 'quiz' || params.tab === 'decks' || params.tab === 'speaking' || params.tab === 'path') {
      const tabKey = params.tab as SegmentKey;
      setActiveSegment(tabKey);
      setVisitedTabs((prev) => (prev[tabKey] ? prev : { ...prev, [tabKey]: true }));
    }
  }, [params.tab]);

  const handleTabPress = (key: SegmentKey) => {
    setActiveSegment(key);
    setVisitedTabs((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const insets = useSafeAreaInsets();
  const safeTop = (insets.top || 12) + 6;

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
                onPress={() => handleTabPress(tab.key)}
                style={[styles.tabBtn, isActive ? styles.tabBtnActive : styles.tabBtnInactive]}
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
                    size={17}
                    color={isActive ? '#FFFFFF' : colors.textSoft}
                    fill={isActive && tab.key === 'quiz' ? '#FFFFFF' : 'none'}
                  />
                  {isActive && (
                    <Text
                      style={[styles.tabLabel, styles.tabLabelActive]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Screen Content with Tab State Preservation & Lazy Loading */}
      <View style={styles.content}>
        {visitedTabs.path && (
          <View style={[styles.tabPane, activeSegment === 'path' ? styles.tabPaneActive : styles.tabPaneHidden]}>
            <MemoizedLearningPathScreen />
          </View>
        )}
        {visitedTabs.decks && (
          <View style={[styles.tabPane, activeSegment === 'decks' ? styles.tabPaneActive : styles.tabPaneHidden]}>
            <MemoizedDecksScreen />
          </View>
        )}
        {visitedTabs.speaking && (
          <View style={[styles.tabPane, activeSegment === 'speaking' ? styles.tabPaneActive : styles.tabPaneHidden]}>
            <MemoizedSpeakingHomeScreen />
          </View>
        )}
        {visitedTabs.quiz && (
          <View style={[styles.tabPane, activeSegment === 'quiz' ? styles.tabPaneActive : styles.tabPaneHidden]}>
            <MemoizedExamCatalogScreen />
          </View>
        )}
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
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabBtnActive: {
    flex: 1.6,
  },
  tabBtnInactive: {
    flex: 1,
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
  tabPane: {
    flex: 1,
  },
  tabPaneActive: {
    display: 'flex',
  },
  tabPaneHidden: {
    display: 'none',
  },
});

