import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  GraduationCap,
  Star,
  BookOpen,
  Crown,
  Check,
  Sparkles,
  Play,
  X,
  Flame,
  MessageCircle,
  Zap,
} from 'lucide-react-native';
import { MOCK_CURRICULUM, UnitNode, Chapter } from '../../data/curriculumData';
import { fetchLearningPathRoadmapApi } from '../../data/knowledgeGapApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors, palette, font } from '@/src/theme';
import { spring, timing, easings } from '@/src/theme/motion';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 40;
const NODE_SIZE = 72;
const VERTICAL_GAP = 110;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── DYNAMIC ANIMATED BACKGROUND ───
// Tạo các hạt ánh sáng & quầng sáng gradient trôi nhẹ nhàng trên UI thread
const DynamicPathBackground = () => {
  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3Y = useSharedValue(0);
  const orbScale = useSharedValue(1);

  useEffect(() => {
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 4000, easing: easings.inOut }),
        withTiming(-30, { duration: 4500, easing: easings.inOut })
      ),
      -1,
      true
    );

    orb2Y.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 5000, easing: easings.inOut }),
        withTiming(40, { duration: 4200, easing: easings.inOut })
      ),
      -1,
      true
    );

    orb3Y.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 3800, easing: easings.inOut }),
        withTiming(-40, { duration: 4800, easing: easings.inOut })
      ),
      -1,
      true
    );

    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3500, easing: easings.inOut }),
        withTiming(0.92, { duration: 3500, easing: easings.inOut })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }, { scale: orbScale.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }, { scale: orbScale.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb3Y.value }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Orb 1: Soft Primary Indigo Glow */}
      <Animated.View
        style={[
          s.ambientOrb,
          {
            top: 100,
            left: -40,
            width: 220,
            height: 220,
            backgroundColor: `${colors.primarySoft}60`,
          },
          orb1Style,
        ]}
      />
      {/* Orb 2: Soft Streak Orange Glow */}
      <Animated.View
        style={[
          s.ambientOrb,
          {
            top: 380,
            right: -50,
            width: 240,
            height: 240,
            backgroundColor: `${colors.streakSoft}50`,
          },
          orb2Style,
        ]}
      />
      {/* Orb 3: Soft XP Yellow Glow */}
      <Animated.View
        style={[
          s.ambientOrb,
          {
            top: 700,
            left: 20,
            width: 200,
            height: 200,
            backgroundColor: `${colors.xpSoft}60`,
          },
          orb3Style,
        ]}
      />
    </View>
  );
};

// ─── DUOLINGO PATH BRANCH CONNECTORS (SVG) ───
// Tính toạ độ X cho serpentine path (Left, Center, Right, Center...)
const getNodeX = (index: number): number => {
  const mod = index % 4;
  if (mod === 0) return CONTENT_WIDTH * 0.5; // Center
  if (mod === 1) return CONTENT_WIDTH * 0.76; // Right
  if (mod === 2) return CONTENT_WIDTH * 0.5; // Center
  return CONTENT_WIDTH * 0.24; // Left
};

interface BranchProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCompleted: boolean;
  isUpcoming: boolean;
}

const DuolingoBranch: React.FC<BranchProps> = ({ fromX, fromY, toX, toY, isCompleted, isUpcoming }) => {
  // Cubic Bezier curve control points
  const midY = (fromY + toY) / 2;
  const pathD = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  // Tọa độ điểm ngọc trang trí giữa nhánh
  const dotX = (fromX + toX) / 2;
  const dotY = midY;

  const strokeColor = isCompleted
    ? colors.success
    : isUpcoming
    ? colors.primarySoft
    : colors.border;

  return (
    <>
      {/* Background shadow stroke for depth */}
      <Path
        d={pathD}
        fill="none"
        stroke={isCompleted ? `${colors.success}30` : `${colors.border}80`}
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Main branch trunk */}
      <Path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={isUpcoming || isCompleted ? undefined : '6, 8'}
      />
      {/* Decorative leaf / stone node on branch */}
      <Circle
        cx={dotX}
        cy={dotY}
        r={5}
        fill={isCompleted ? colors.success : colors.surface}
        stroke={strokeColor}
        strokeWidth={3}
      />
    </>
  );
};

export const LearningPathScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);
  const [curriculum, setCurriculum] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Node Pulse Animation
  const pulseScale = useSharedValue(1);

  // Motion press spring hook for modal CTA
  const ctaSpring = usePressSpring(0.97);

  // Fetch roadmap from backend and refresh when focused
  const loadRoadmap = useCallback(() => {
    setIsLoading(true);
    const uid = currentUser?.id ? String(currentUser.id) : '1';
    fetchLearningPathRoadmapApi(uid)
      .then((milestones: any[]) => {
        if (!milestones || milestones.length === 0) {
          setCurriculum((prev) => (prev.length > 0 ? prev : MOCK_CURRICULUM));
          return;
        }
        const mapped: Chapter[] = milestones.map((m: any, idx: number) => ({
          id: String(m.id || `ch-${idx + 1}`),
          chapter_number: m.chapterNumber || idx + 1,
          title_vi: m.titleVi || m.title || `Chương ${idx + 1}`,
          title_en: m.titleEn || m.title || `Chapter ${idx + 1}`,
          is_premium: Boolean(m.isPremium),
          units: (m.units || m.modules || []).map((u: any, uIdx: number) => {
            let titleVi = u.titleVi || u.nameVi || u.title || `Unit ${uIdx + 1}`;
            let titleEn = u.titleEn || u.nameEn || u.title || `Unit ${uIdx + 1}`;
            let descVi = u.descriptionVi || u.description || '';

            if (titleVi.trim() === 'Unit 7:') {
              titleVi = 'Unit 7: Video & Luyện Phản Xạ Nâng Cao';
              if (!descVi) descVi = 'Luyện nghe nói phản xạ chuyên sâu qua video bài học sinh động.';
            } else if (titleVi.trim() === 'Unit 8:') {
              titleVi = 'Unit 8: Video & Đánh Giá Tổng Hợp';
              if (!descVi) descVi = 'Đánh giá toàn diện kiến thức qua bài học video tương tác chuẩn quốc tế.';
            }

            const isDone = u.status === 'completed' || Boolean(u.isCompleted) || (u.completedLessons != null && u.completedLessons >= (u.totalLessons || 1));

            return {
              id: String(u.id || `u-${idx * 10 + uIdx + 1}`),
              unit_number: u.unitNumber || uIdx + 1,
              title_vi: titleVi,
              title_en: titleEn,
              description_vi: descVi,
              is_premium: Boolean(u.isPremium),
              status: (isDone ? 'completed' : u.status || (uIdx === 0 ? 'current' : 'unlocked')).toLowerCase() as UnitNode['status'],
              icon_type: (isDone ? 'star' : u.iconType || (['star', 'grad', 'book', 'speech', 'crown'] as const)[uIdx % 5]),
              total_lessons: Number(u.totalLessons || 1),
              completed_lessons: Number(isDone ? (u.totalLessons || 1) : (u.completedLessons || 0)),
              xp_reward: Number(u.xpReward || 50),
            };
          }),
        }));
        if (mapped.length > 0 && mapped.some((c) => c.units.length > 0)) {
          setCurriculum(mapped);
        } else {
          setCurriculum(MOCK_CURRICULUM);
        }
      })
      .catch((err) => {
        console.warn('[LearningPath] API load failed:', err);
        setCurriculum((prev) => (prev.length > 0 ? prev : MOCK_CURRICULUM));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRoadmap();
    }, [loadRoadmap])
  );

  // Pulse animation for currently active unit
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: easings.inOut }),
        withTiming(1, { duration: 900, easing: easings.inOut })
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

  if (isLoading) {
    return (
      <DatabaseLoader
        fullscreen
        message="Đang tải lộ trình học phản xạ..."
        subMessage="Đồng bộ tiến độ học tập với Loxera AI Cloud"
        color={colors.primary}
      />
    );
  }

  return (
    <View style={s.container}>
      {/* Background động với các quầng sáng mềm chuyển động */}
      <DynamicPathBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Header Bar */}
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
              <Crown color={colors.warning} size={14} />
              <Text style={s.premiumTagText}>Mở khóa Premium</Text>
            </Pressable>
          )}
        </View>

        {/* Chapters List */}
        {curriculum.map((chapter) => {
          const totalUnits = chapter.units.length;
          const chapterHeight = (totalUnits - 1) * VERTICAL_GAP + NODE_SIZE + 40;

          return (
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

              {/* Serpentine Connected Path Container */}
              <View style={[s.pathContainer, { height: chapterHeight }]}>
                {/* SVG Branch Layer — Kết nối từng Unit như Duolingo */}
                <Svg
                  width={CONTENT_WIDTH}
                  height={chapterHeight}
                  style={StyleSheet.absoluteFill}
                >
                  <Defs>
                    <SvgGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.success} />
                      <Stop offset="100%" stopColor={colors.primary} />
                    </SvgGradient>
                  </Defs>

                  {chapter.units.map((unit, idx) => {
                    if (idx >= totalUnits - 1) return null;
                    const nextUnit = chapter.units[idx + 1];
                    const fromX = getNodeX(idx);
                    const fromY = idx * VERTICAL_GAP + NODE_SIZE / 2;
                    const toX = getNodeX(idx + 1);
                    const toY = (idx + 1) * VERTICAL_GAP + NODE_SIZE / 2;

                    const isCompleted =
                      unit.status === 'completed' && nextUnit.status === 'completed';
                    const isUpcoming =
                      unit.status === 'completed' || unit.status === 'current';

                    return (
                      <DuolingoBranch
                        key={`branch-${unit.id}-${nextUnit.id}`}
                        fromX={fromX}
                        fromY={fromY}
                        toX={toX}
                        toY={toY}
                        isCompleted={isCompleted}
                        isUpcoming={isUpcoming}
                      />
                    );
                  })}
                </Svg>

                {/* Unit Nodes Layer */}
                {chapter.units.map((unit, index) => {
                  const isCompleted = unit.status === 'completed';
                  const isCurrent = unit.status === 'current';
                  const isLocked = unit.is_premium && !isPremium;
                  const posX = getNodeX(index) - NODE_SIZE / 2;
                  const posY = index * VERTICAL_GAP;

                  return (
                    <View
                      key={unit.id}
                      style={[
                        s.unitPositioner,
                        {
                          left: posX,
                          top: posY,
                        },
                      ]}
                    >
                      {/* Floating Tooltip "Bắt đầu ở đây!" cho Unit hiện tại */}
                      {isCurrent && (
                        <Animated.View style={[s.startTooltip, activePulseStyle]}>
                          <View style={s.startTooltipBox}>
                            <Flame color="#FFFFFF" size={13} fill="#FFFFFF" />
                            <Text style={s.startTooltipText}>Bắt đầu ở đây!</Text>
                          </View>
                          <View style={s.tooltipArrow} />
                        </Animated.View>
                      )}

                      {/* Interactive Circular Node Button */}
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
                          <Crown color={colors.textSoft} size={24} />
                        ) : unit.icon_type === 'speech' ? (
                          <MessageCircle color={colors.primary} size={26} />
                        ) : (
                          <BookOpen color={colors.primary} size={26} />
                        )}

                        {/* Checkmark Badge for Completed */}
                        {isCompleted && (
                          <View style={s.checkBadge}>
                            <Check color="#FFFFFF" size={12} strokeWidth={3} />
                          </View>
                        )}

                        {/* Crown Badge for Premium */}
                        {unit.is_premium && (
                          <View style={s.crownBadge}>
                            <Crown color="#FFFFFF" size={11} />
                          </View>
                        )}
                      </AnimatedPressable>

                      {/* Label Text below node */}
                      <Text
                        style={[
                          s.nodeLabel,
                          isCurrent && s.nodeLabelCurrent,
                          isCompleted && s.nodeLabelCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {unit.title_vi.split(':')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal visible={!!selectedUnit} transparent animationType="fade">
        <View style={s.modalOverlay}>
          {selectedUnit && (
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View
                  style={[
                    s.modalTag,
                    selectedUnit.is_premium
                      ? { backgroundColor: colors.warningSoft }
                      : { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[
                      s.modalTagText,
                      selectedUnit.is_premium
                        ? { color: colors.warning }
                        : { color: colors.primary },
                    ]}
                  >
                    {selectedUnit.is_premium ? 'Premium 👑' : 'Miễn Phí'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedUnit(null)}
                  style={s.closeModalBtn}
                >
                  <X color={colors.textSoft} size={20} />
                </Pressable>
              </View>

              <Text style={s.modalTitle}>{selectedUnit.title_vi}</Text>
              <Text style={s.modalSubtitle}>{selectedUnit.title_en}</Text>
              <Text style={s.modalDesc}>{selectedUnit.description_vi}</Text>

              <View style={s.modalProgressRow}>
                <View>
                  <Text style={s.modalProgressLabel}>Tiến độ bài học</Text>
                  <Text style={s.modalProgressVal}>
                    {selectedUnit.completed_lessons} / {selectedUnit.total_lessons} Bài đã
                    hoàn thành
                  </Text>
                </View>
                {/* Gamification XP Chip: Warm yellow/orange */}
                <View style={s.xpChip}>
                  <Zap color={colors.xpDeep} size={14} fill={colors.xpDeep} />
                  <Text style={s.xpChipText}>+{selectedUnit.xp_reward} XP</Text>
                </View>
              </View>

              {/* Start CTA Button */}
              <AnimatedPressable
                onPress={() => handleStartLesson(selectedUnit.id)}
                onPressIn={ctaSpring.onPressIn}
                onPressOut={ctaSpring.onPressOut}
                style={[s.startLessonBtn, ctaSpring.animatedStyle]}
              >
                <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
                <Text style={s.startLessonBtnText}>Bắt Đầu Học Ngay</Text>
              </AnimatedPressable>
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
    backgroundColor: colors.bg,
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  subHeader: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  mainHeader: {
    fontSize: 22,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: `${colors.warning}50`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  premiumTagText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.warning,
  },
  chapterSection: {
    marginBottom: 32,
  },
  chapterBanner: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
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
    color: 'rgba(255, 255, 255, 0.85)',
  },
  premiumBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chapterTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pathContainer: {
    width: CONTENT_WIDTH,
    position: 'relative',
  },
  unitPositioner: {
    position: 'absolute',
    width: NODE_SIZE,
    alignItems: 'center',
  },
  startTooltip: {
    position: 'absolute',
    top: -40,
    alignItems: 'center',
    zIndex: 30,
  },
  startTooltipBox: {
    backgroundColor: colors.streak,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  startTooltipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
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
    borderTopColor: colors.streak,
  },
  nodeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  completedNode: {
    backgroundColor: colors.success,
    borderColor: colors.successSoft,
  },
  currentNode: {
    backgroundColor: colors.primary,
    borderColor: colors.streak,
    borderWidth: 5,
  },
  lockedNode: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
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
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeLabel: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: colors.textSoft,
    textAlign: 'center',
  },
  nodeLabelCurrent: {
    fontWeight: '800',
    color: colors.primary,
  },
  nodeLabelCompleted: {
    fontWeight: '700',
    color: colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 21, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalTagText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
  },
  closeModalBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: font.family,
    color: colors.textSoft,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: font.family,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    borderRadius: 14,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalProgressRow: {
    backgroundColor: colors.surfaceMuted,
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
    color: colors.textSoft,
  },
  modalProgressVal: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.text,
  },
  xpChip: {
    backgroundColor: colors.xpSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpChipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.xpDeep,
  },
  startLessonBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  startLessonBtnText: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
