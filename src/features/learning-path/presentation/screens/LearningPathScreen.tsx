import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  GraduationCap,
  Star,
  BookOpen,
  Crown,
  Check,
  Play,
  X,
  Flame,
  MessageCircle,
  Zap,
  Lock,
  Gift,
  Compass,
  Sparkles,
} from 'lucide-react-native';
import { MOCK_CURRICULUM, UnitNode, Chapter } from '../../data/curriculumData';
import { fetchLearningPathRoadmapApi } from '../../data/knowledgeGapApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors, palette, font } from '@/src/theme';
import { easings } from '@/src/theme/motion';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { usePulseRing } from '@/src/hooks/usePulseRing';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 48;
const NODE_SIZE = 76;
const VERTICAL_GAP = 115;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── THEMATIC CHAPTER BIOMES (PHÂN VÙNG BẢN ĐỒ THẾ GIỚI HỌC TẬP) ───
interface ChapterBiome {
  name: string;
  subtitle: string;
  gradient: [string, string];
  islandBg: string;
  islandBorder: string;
  badgeBg: string;
  badgeText: string;
  pathCompleted: string;
  chestAccent: string;
}

const CHAPTER_BIOMES: ChapterBiome[] = [
  {
    name: 'Thung Lũng Khởi Động',
    subtitle: 'Nền tảng giao tiếp cơ bản & phản xạ ban đầu',
    gradient: ['#059669', '#10B981'],
    islandBg: 'rgba(236, 253, 245, 0.7)',
    islandBorder: 'rgba(16, 185, 129, 0.25)',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    pathCompleted: '#10B981',
    chestAccent: '#059669',
  },
  {
    name: 'Vịnh Tri Thức Phản Xạ',
    subtitle: 'Từ vựng chuyên sâu & phản xạ tình huống nhanh',
    gradient: ['#1E1B4B', '#3B82F6'],
    islandBg: 'rgba(238, 242, 255, 0.7)',
    islandBorder: 'rgba(99, 102, 241, 0.25)',
    badgeBg: '#E0E7FF',
    badgeText: '#3730A3',
    pathCompleted: '#3B82F6',
    chestAccent: '#4F46E5',
  },
  {
    name: 'Hoàng Hôn Bứt Phá',
    subtitle: 'Luyện nói thực chiến & ngữ pháp tự nhiên',
    gradient: ['#D97706', '#EA580C'],
    islandBg: 'rgba(255, 251, 235, 0.7)',
    islandBorder: 'rgba(245, 158, 11, 0.25)',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    pathCompleted: '#F59E0B',
    chestAccent: '#EA580C',
  },
  {
    name: 'Đỉnh Cao Tinh Vân',
    subtitle: 'Master phản xạ AI chuẩn quốc tế',
    gradient: ['#6D28D9', '#9333EA'],
    islandBg: 'rgba(250, 245, 255, 0.7)',
    islandBorder: 'rgba(168, 85, 247, 0.25)',
    badgeBg: '#F3E8FF',
    badgeText: '#6B21A8',
    pathCompleted: '#9333EA',
    chestAccent: '#7C3AED',
  },
];

const getBiomeForChapter = (chapterNum: number): ChapterBiome => {
  const index = Math.max(0, chapterNum - 1) % CHAPTER_BIOMES.length;
  return CHAPTER_BIOMES[index];
};

// ─── AMBIENT ATMOSPHERIC BACKGROUND ───
const DynamicPathBackground = () => {
  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  useEffect(() => {
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 4200, easing: easings.inOut }),
        withTiming(-35, { duration: 4600, easing: easings.inOut })
      ),
      -1,
      true
    );

    orb2Y.value = withRepeat(
      withSequence(
        withTiming(-45, { duration: 5200, easing: easings.inOut }),
        withTiming(35, { duration: 4500, easing: easings.inOut })
      ),
      -1,
      true
    );

    orb3Y.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: easings.inOut }),
        withTiming(-30, { duration: 4900, easing: easings.inOut })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb3Y.value }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          s.ambientOrb,
          { top: 80, left: -50, width: 240, height: 240, backgroundColor: 'rgba(59, 130, 246, 0.12)' },
          orb1Style,
        ]}
      />
      <Animated.View
        style={[
          s.ambientOrb,
          { top: 400, right: -60, width: 260, height: 260, backgroundColor: 'rgba(245, 158, 11, 0.12)' },
          orb2Style,
        ]}
      />
      <Animated.View
        style={[
          s.ambientOrb,
          { top: 780, left: -20, width: 220, height: 220, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
          orb3Style,
        ]}
      />
    </View>
  );
};

// ─── TÍNH TOẠ ĐỘ X CHO SERPENTINE PATH (DUOLINGO S-CURVE) ───
const getNodeX = (index: number): number => {
  const mod = index % 4;
  if (mod === 0) return CONTENT_WIDTH * 0.5; // Giữa
  if (mod === 1) return CONTENT_WIDTH * 0.78; // Phải
  if (mod === 2) return CONTENT_WIDTH * 0.5; // Giữa
  return CONTENT_WIDTH * 0.22; // Trái
};

// ─── SVG BRANCH CONNECTORS ───
interface BranchProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCompleted: boolean;
  isUpcoming: boolean;
  completedColor: string;
}

const DuolingoBranch: React.FC<BranchProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  isCompleted,
  isUpcoming,
  completedColor,
}) => {
  const midY = (fromY + toY) / 2;
  const pathD = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
  const dotX = (fromX + toX) / 2;
  const dotY = midY;

  const strokeColor = isCompleted
    ? completedColor
    : isUpcoming
    ? colors.primarySoft
    : '#CBD5E1';

  return (
    <>
      {/* Lớp shadow stroke dày tạo chiều sâu 3D */}
      <Path
        d={pathD}
        fill="none"
        stroke={isCompleted ? `${completedColor}35` : 'rgba(203, 213, 225, 0.45)'}
        strokeWidth={14}
        strokeLinecap="round"
      />
      {/* Lớp stroke chính */}
      <Path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={isUpcoming || isCompleted ? undefined : '7, 9'}
      />
      {/* Viên ngọc trang trí ở giữa nhánh */}
      <Circle
        cx={dotX}
        cy={dotY}
        r={6}
        fill={isCompleted ? completedColor : '#FFFFFF'}
        stroke={strokeColor}
        strokeWidth={3}
      />
    </>
  );
};

// ─── TACTILE 3D DUOLINGO NODE COMPONENT ───
interface TactileNodeProps {
  unit: UnitNode;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: (unit: UnitNode) => void;
  activePulseStyle: any;
  biomeCompletedColor: string;
}

const TactileDuolingoNode: React.FC<TactileNodeProps> = ({
  unit,
  index,
  isCurrent,
  isCompleted,
  isLocked,
  onPress,
  activePulseStyle,
  biomeCompletedColor,
}) => {
  const pressDown = useSharedValue(0);

  const animatedFaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressDown.value }],
  }));

  const handlePressIn = () => {
    pressDown.value = withSpring(5, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressDown.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  // Màu sắc theo trạng thái
  const faceBg = isCompleted
    ? biomeCompletedColor
    : isCurrent
    ? colors.primary
    : isLocked
    ? '#E2E8F0'
    : '#FFFFFF';

  const baseBg = isCompleted
    ? '#047857'
    : isCurrent
    ? '#1E1B4B'
    : isLocked
    ? '#CBD5E1'
    : '#CBD5E1';

  const borderColor = isCompleted
    ? 'rgba(255, 255, 255, 0.35)'
    : isCurrent
    ? colors.streak
    : isLocked
    ? '#CBD5E1'
    : colors.primarySoft;

  return (
    <View style={s.nodeWrapper}>
      {/* Lớp đế 3D tạo độ dày đáy nổi */}
      <View style={[s.nodeBase3D, { backgroundColor: baseBg }]} />

      {/* Lớp mặt nút bấm lún */}
      <AnimatedPressable
        onPress={() => onPress(unit)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          s.nodeFace3D,
          {
            backgroundColor: faceBg,
            borderColor: borderColor,
            borderWidth: isCurrent ? 5 : 3.5,
          },
          isCurrent && activePulseStyle,
          animatedFaceStyle,
        ]}
      >
        {isCompleted ? (
          <Star color="#FFFFFF" size={30} fill="#FDE047" />
        ) : isCurrent ? (
          <GraduationCap color="#FFFFFF" size={34} />
        ) : isLocked ? (
          <Lock color="#94A3B8" size={24} />
        ) : unit.icon_type === 'speech' ? (
          <MessageCircle color={colors.primary} size={28} />
        ) : (
          <BookOpen color={colors.primary} size={28} />
        )}

        {/* Checkmark Badge cho Node hoàn thành */}
        {isCompleted && (
          <View style={[s.checkBadge, { backgroundColor: biomeCompletedColor }]}>
            <Check color="#FFFFFF" size={13} strokeWidth={3.5} />
          </View>
        )}

        {/* Crown Badge cho Node Premium */}
        {unit.is_premium && !isCompleted && (
          <View style={s.crownBadge}>
            <Crown color="#FFFFFF" size={11} />
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
};

export const LearningPathScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);
  const [curriculum, setCurriculum] = useState<Chapter[]>(MOCK_CURRICULUM);
  const [isLoading, setIsLoading] = useState(true);

  // Pulse animation cho node hiện tại
  const pulseScale = useSharedValue(1);
  const ctaSpring = usePressSpring(0.97);

  // Fetch roadmap API
  const loadRoadmap = useCallback(() => {
    const uid = currentUser?.id ? String(currentUser.id) : '1';
    fetchLearningPathRoadmapApi(uid)
      .then((milestones: any[]) => {
        if (!milestones || milestones.length === 0) return;
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

            const isDone =
              u.status === 'completed' ||
              Boolean(u.isCompleted) ||
              (u.completedLessons != null && u.completedLessons >= (u.totalLessons || 1));

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
        }
      })
      .catch((err) => console.warn('[LearningPath] API load failed:', err))
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRoadmap();
    }, [loadRoadmap])
  );

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: easings.inOut }),
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
        message="Đang đồng bộ lộ trình học phản xạ..."
        subMessage="Tải dữ liệu từ Loxera AI Cloud"
        color={colors.primary}
      />
    );
  }

  return (
    <View style={s.container}>
      <DynamicPathBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header Bar */}
        <View style={s.headerRow}>
          <View>
            <View style={s.badgeRow}>
              <Compass color={colors.primary} size={14} />
              <Text style={s.subHeader}>BẢN ĐỒ LỘ TRÌNH DUOLINGO</Text>
            </View>
            <Text style={s.mainHeader}>Hành Trình Chinh Phục</Text>
          </View>

          {!isPremium && (
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              style={s.premiumTag}
            >
              <Crown color={colors.warning} size={14} />
              <Text style={s.premiumTagText}>Mở khóa Pro</Text>
            </Pressable>
          )}
        </View>

        {/* Chapters List with Thematic Biomes */}
        {curriculum.map((chapter) => {
          const biome = getBiomeForChapter(chapter.chapter_number);
          const totalUnits = chapter.units.length;
          const chapterHeight = (totalUnits - 1) * VERTICAL_GAP + NODE_SIZE + 40;
          const isChapterAllDone =
            totalUnits > 0 && chapter.units.every((u) => u.status === 'completed');

          return (
            <View
              key={chapter.id}
              style={[
                s.chapterIsland,
                {
                  backgroundColor: biome.islandBg,
                  borderColor: biome.islandBorder,
                },
              ]}
            >
              {/* Chapter Header Banner */}
              <LinearGradient
                colors={biome.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={s.chapterBanner}
              >
                <View style={s.chapterBannerTop}>
                  <View style={[s.biomeBadge, { backgroundColor: biome.badgeBg }]}>
                    <Text style={[s.biomeBadgeText, { color: biome.badgeText }]}>
                      {biome.name}
                    </Text>
                  </View>

                  {chapter.is_premium && (
                    <View style={s.premiumBadge}>
                      <Crown color="#FFFFFF" size={10} />
                      <Text style={s.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                </View>

                <Text style={s.chapterNumberText}>Chương {chapter.chapter_number}</Text>
                <Text style={s.chapterTitle}>{chapter.title_vi}</Text>
                <Text style={s.chapterSub}>{biome.subtitle}</Text>
              </LinearGradient>

              {/* Serpentine Path Container */}
              <View style={[s.pathContainer, { height: chapterHeight }]}>
                {/* SVG Branch Layer */}
                <Svg width={CONTENT_WIDTH} height={chapterHeight} style={StyleSheet.absoluteFill}>
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
                        completedColor={biome.pathCompleted}
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

                      {/* Tactile 3D Duolingo Node */}
                      <TactileDuolingoNode
                        unit={unit}
                        index={index}
                        isCurrent={isCurrent}
                        isCompleted={isCompleted}
                        isLocked={isLocked}
                        onPress={handleNodePress}
                        activePulseStyle={activePulseStyle}
                        biomeCompletedColor={biome.pathCompleted}
                      />

                      {/* Tên bài học bên dưới node */}
                      <Text
                        style={[
                          s.nodeLabel,
                          isCurrent && s.nodeLabelCurrent,
                          isCompleted && { color: biome.pathCompleted, fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {unit.title_vi.split(':')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* End of Chapter Milestone: Rương kho báu mở khóa XP */}
              <View style={s.chestMilestoneRow}>
                <View style={[s.chestIconBox, { backgroundColor: biome.badgeBg }]}>
                  {isChapterAllDone ? (
                    <Sparkles color={biome.chestAccent} size={24} />
                  ) : (
                    <Gift color={biome.chestAccent} size={24} />
                  )}
                </View>
                <View style={s.chestInfo}>
                  <Text style={s.chestTitle}>
                    {isChapterAllDone ? '🎉 Đã Hoàn Thành Chương!' : 'Rương Thưởng Cuối Chương'}
                  </Text>
                  <Text style={s.chestSub}>
                    {isChapterAllDone
                      ? 'Bạn đã nhận trọn vẹn phần thưởng XP của chương này'
                      : 'Hoàn thành tất cả các bài học để nhận +100 XP'}
                  </Text>
                </View>
                <View style={s.xpBonusBadge}>
                  <Zap color={colors.xpDeep} size={13} fill={colors.xpDeep} />
                  <Text style={s.xpBonusText}>+100 XP</Text>
                </View>
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
                <Pressable onPress={() => setSelectedUnit(null)} style={s.closeModalBtn}>
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
                    {selectedUnit.completed_lessons} / {selectedUnit.total_lessons} Bài hoàn thành
                  </Text>
                </View>
                <View style={s.xpChip}>
                  <Zap color={colors.xpDeep} size={14} fill={colors.xpDeep} />
                  <Text style={s.xpChipText}>+{selectedUnit.xp_reward} XP</Text>
                </View>
              </View>

              {/* Start Lesson CTA */}
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  mainHeader: {
    fontSize: 22,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: `${colors.warning}60`,
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
  chapterIsland: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  chapterBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  chapterBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  biomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  biomeBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chapterNumberText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  chapterTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  chapterSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    lineHeight: 16,
  },
  pathContainer: {
    width: CONTENT_WIDTH,
    position: 'relative',
    alignSelf: 'center',
  },
  unitPositioner: {
    position: 'absolute',
    width: NODE_SIZE,
    alignItems: 'center',
  },
  nodeWrapper: {
    width: NODE_SIZE,
    height: NODE_SIZE + 6,
    position: 'relative',
    alignItems: 'center',
  },
  nodeBase3D: {
    position: 'absolute',
    bottom: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  nodeFace3D: {
    position: 'absolute',
    top: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 2.5,
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
  startTooltip: {
    position: 'absolute',
    top: -42,
    alignItems: 'center',
    zIndex: 30,
  },
  startTooltipBox: {
    backgroundColor: colors.streak,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
  nodeLabel: {
    marginTop: 8,
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
  chestMilestoneRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chestIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestInfo: {
    flex: 1,
  },
  chestTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
  },
  chestSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: colors.textSoft,
    marginTop: 2,
  },
  xpBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.xpSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  xpBonusText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.xpDeep,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
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
    fontSize: 19,
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
    backgroundColor: colors.streak,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  startLessonBtnText: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
