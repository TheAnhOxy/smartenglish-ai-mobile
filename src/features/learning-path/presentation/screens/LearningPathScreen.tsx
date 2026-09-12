import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { GraduationCap, Star, BookOpen, Crown, Check, Sparkles, Play, X } from 'lucide-react-native';
import { MOCK_CURRICULUM, UnitNode, Chapter } from '../../data/curriculumData';
import { fetchLearningPathRoadmapApi } from '../../data/knowledgeGapApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LearningPathScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);
  const [curriculum, setCurriculum] = useState<Chapter[]>(MOCK_CURRICULUM);
  const [isLoading, setIsLoading] = useState(true);

  // Active Node Pulse Animation
  const pulseScale = useSharedValue(1);  // Fetch roadmap from backend; fall back to local mock data if unavailable
  useEffect(() => {
    let cancelled = false;
    fetchLearningPathRoadmapApi(currentUser?.id?.toString())
      .then((milestones: any[]) => {
        if (cancelled || !milestones || milestones.length === 0) return;
        // Map backend milestones to Chapter/Unit structure
        const mapped: Chapter[] = milestones.map((m: any, idx: number) => ({
          id: String(m.id || `ch-${idx + 1}`),
          chapter_number: m.chapterNumber || idx + 1,
          title_vi: m.titleVi || m.title || `Chương ${idx + 1}`,
          title_en: m.titleEn || m.title || `Chapter ${idx + 1}`,
          is_premium: Boolean(m.isPremium),
          units: (m.units || m.modules || []).map((u: any, uIdx: number) => ({
            id: String(u.id || `u-${idx * 10 + uIdx + 1}`),
            unit_number: u.unitNumber || uIdx + 1,
            title_vi: u.titleVi || u.nameVi || u.title || `Unit ${uIdx + 1}`,
            title_en: u.titleEn || u.nameEn || u.title || `Unit ${uIdx + 1}`,
            description_vi: u.descriptionVi || u.description || '',
            is_premium: Boolean(u.isPremium),
            status: (u.status || (u.isCompleted ? 'completed' : uIdx === 0 ? 'current' : 'unlocked')).toLowerCase() as UnitNode['status'],
            icon_type: (u.iconType || (['star', 'grad', 'book', 'speech', 'crown'] as const)[uIdx % 5]),
            total_lessons: Number(u.totalLessons || 5),
            completed_lessons: Number(u.completedLessons || (u.isCompleted ? 5 : 0)),
            xp_reward: Number(u.xpReward || 50)
          }))
        }));
        if (mapped.length > 0 && mapped.some((c) => c.units.length > 0)) {
          setCurriculum(mapped);
        }
      })
      .catch((err) => console.warn('[LearningPath] API load failed:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Active Node Pulse Animation
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const activePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleNodePress = (unit: UnitNode) => {
    if (unit.is_premium && !isPremium) {
      router.push('/(student)/profile/premium' as any);
      return;
    }
    setSelectedUnit(unit);
  };

  const handleStartLesson = (unitId: string) => {
    setSelectedUnit(null);
    router.push(`/(student)/lesson/${unitId}` as any);
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.subHeader}>LỘ TRÌNH HỌC PHẢN XẠ</Text>
            <Text style={s.mainHeader}>Chương & Bài Học</Text>
          </View>

          {!isPremium && (
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              style={s.premiumTag}
            >
              <Crown color={palette.warning} size={14} />
              <Text style={s.premiumTagText}>Mở khóa Premium</Text>
            </Pressable>
          )}
        </View>

        {/* Chapters List */}
        {curriculum.map((chapter) => (
          <View key={chapter.id} style={s.chapterSection}>
            {/* Chapter Header Banner */}
            <View style={s.chapterBanner}>
              <View style={s.chapterBannerLeft}>
                <View style={s.chapterBadgeRow}>
                  <Text style={s.chapterNumber}>Chương {chapter.chapter_number}</Text>
                  {chapter.is_premium && (
                    <View style={s.premiumBadge}>
                      <Text style={s.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                </View>
                <Text style={s.chapterTitle}>{chapter.title_vi}</Text>
              </View>
            </View>

            {/* Units Path Nodes (Serpentine Layout) */}
            <View style={s.nodesContainer}>
              {chapter.units.map((unit, index) => {
                const isCompleted = unit.status === 'completed';
                const isCurrent = unit.status === 'current';
                const isLocked = unit.is_premium && !isPremium;

                const alignStyle =
                  index % 4 === 0
                    ? s.alignCenter
                    : index % 4 === 1
                    ? s.alignRight
                    : index % 4 === 2
                    ? s.alignCenter
                    : s.alignLeft;

                return (
                  <View key={unit.id} style={s.unitWrapper}>
                    {/* Floating "Start Here!" Badge for Current Active Node */}
                    {isCurrent && (
                      <Animated.View style={[s.startTooltip, activePulseStyle]}>
                        <View style={s.startTooltipBox}>
                          <Sparkles color="#FFFFFF" size={12} />
                          <Text style={s.startTooltipText}>Bắt đầu ở đây!</Text>
                        </View>
                        <View style={s.tooltipArrow} />
                      </Animated.View>
                    )}

                    <View style={[s.nodeRow, alignStyle]}>
                      {/* Node Interactive Circle Button */}
                      <AnimatedPressable
                        onPress={() => handleNodePress(unit)}
                        style={[
                          s.nodeCircle,
                          isCompleted && s.completedNode,
                          isCurrent && s.currentNode,
                          isCurrent && activePulseStyle,
                          isLocked && s.lockedNode,
                        ]}
                      >
                        {isCompleted ? (
                          <Star color="#FFFFFF" size={28} fill="#FFFFFF" />
                        ) : isCurrent ? (
                          <GraduationCap color="#FFFFFF" size={32} />
                        ) : isLocked ? (
                          <Crown color={palette.textSoft} size={26} />
                        ) : (
                          <BookOpen color={palette.primary} size={26} />
                        )}

                        {/* Completed Checkmark Badge */}
                        {isCompleted && (
                          <View style={s.checkBadge}>
                            <Check color="#FFFFFF" size={12} strokeWidth={3} />
                          </View>
                        )}

                        {/* Premium Crown Badge */}
                        {unit.is_premium && (
                          <View style={s.crownBadge}>
                            <Crown color="#FFFFFF" size={12} />
                          </View>
                        )}
                      </AnimatedPressable>

                      {/* Side Info Banner Card for Active/Selected Units */}
                      {isCurrent ? (
                        <View style={s.activeUnitCard}>
                          <Text style={s.activeUnitTitle}>{unit.title_vi}</Text>
                          <Text style={s.activeUnitSub} numberOfLines={2}>
                            {unit.description_vi}
                          </Text>
                        </View>
                      ) : (
                        <Text style={s.unitShortTitle}>
                          {unit.title_vi.split(':')[0]}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal visible={!!selectedUnit} transparent animationType="fade">
        <View style={s.modalOverlay}>
          {selectedUnit && (
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>
                    {selectedUnit.is_premium ? 'Premium 👑' : 'Miễn Phí'}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedUnit(null)} style={s.closeModalBtn}>
                  <X color={palette.textSoft} size={20} />
                </Pressable>
              </View>

              <Text style={s.modalTitle}>{selectedUnit.title_vi}</Text>
              <Text style={s.modalSubtitle}>{selectedUnit.title_en}</Text>
              <Text style={s.modalDesc}>
                {selectedUnit.description_vi}
              </Text>

              <View style={s.modalProgressRow}>
                <View>
                  <Text style={s.modalProgressLabel}>Tiến độ bài học</Text>
                  <Text style={s.modalProgressVal}>
                    {selectedUnit.completed_lessons} / {selectedUnit.total_lessons} Bài đã hoàn thành
                  </Text>
                </View>
                <View style={s.xpChip}>
                  <Text style={s.xpChipText}>+{selectedUnit.xp_reward} XP</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleStartLesson(selectedUnit.id)}
                style={s.startLessonBtn}
              >
                <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
                <Text style={s.startLessonBtnText}>Bắt Đầu Học Ngay</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
    letterSpacing: 0.5,
  },
  mainHeader: {
    fontSize: 22,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(227, 166, 62, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(227, 166, 62, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  premiumTagText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.warning,
  },
  chapterSection: {
    marginBottom: 28,
  },
  chapterBanner: {
    backgroundColor: palette.primary,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  chapterBannerLeft: {
    flex: 1,
  },
  chapterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chapterNumber: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  premiumBadge: {
    backgroundColor: palette.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chapterTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nodesContainer: {
    alignItems: 'center',
  },
  unitWrapper: {
    marginVertical: 16,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  startTooltip: {
    position: 'absolute',
    top: -36,
    alignItems: 'center',
    zIndex: 20,
  },
  startTooltipBox: {
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startTooltipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: palette.accent,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  alignCenter: {
    alignSelf: 'center',
  },
  alignRight: {
    alignSelf: 'flex-end',
    marginRight: 32,
  },
  alignLeft: {
    alignSelf: 'flex-start',
    marginLeft: 32,
  },
  nodeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surface,
    borderWidth: 4,
    borderColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  completedNode: {
    backgroundColor: palette.primary,
    borderColor: palette.primarySoft,
  },
  currentNode: {
    backgroundColor: palette.primary,
    borderColor: palette.accent,
    borderWidth: 6,
  },
  lockedNode: {
    backgroundColor: palette.bg,
    borderColor: palette.border,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  crownBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.warning,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeUnitCard: {
    backgroundColor: palette.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: 180,
  },
  activeUnitTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 2,
  },
  activeUnitSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  unitShortTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 21, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: palette.surface,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTag: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalTagText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.textSoft,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.text,
    backgroundColor: palette.bg,
    padding: 14,
    borderRadius: 14,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalProgressRow: {
    backgroundColor: palette.bg,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProgressLabel: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  modalProgressVal: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  xpChip: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpChipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  startLessonBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startLessonBtnText: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
