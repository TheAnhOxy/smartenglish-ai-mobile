import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  useAnimatedScrollHandler,
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { UnitNode, Chapter } from '../../data/curriculumData';
import { fetchLearningPathRoadmapApi, isSystemCourse } from '../../data/knowledgeGapApi';
import { LEVEL_FILTERS, defaultLevelFilter, resolveChaptersForLevel, type LevelFilter } from '../../application/courseLevel';
import { useLearnerLevel } from '../../application/useTeacherCourses';
import { TeacherCoursesShowcase } from '../components/TeacherCoursesShowcase';
import { normalizeCefr, sortByLevelCloseness } from '@/src/features/onboarding/application/learnerLevel';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors, palette, font } from '@/src/theme';
import { easings } from '@/src/theme/motion';
import { usePulseRing } from '@/src/hooks/usePulseRing';
import { TabLoadingState } from '@/src/components/ui/TabLoadingState';
import { hasActivePremium } from '@/src/core/utils/plan';
import { Garland, GiftBox, Snowman, XmasTree } from '@/src/components/xmas/XmasArt';
import { useXmasActive } from '@/src/core/services/xmas';
import { getWinterWorld, WINTER, type WinterDecor } from '../winter/winterWorlds';
import { WinterBackdrop } from '../winter/WinterBackdrop';
import { WinterDecorItem, SantaHat } from '../winter/WinterArt';
import { GoldShimmer, IceCrystals, NodeGlow, OrbitSparkles, SnowCap, WinterBannerDeco, WinterBranch } from '../winter/WinterPath';
import { dk } from '@/src/theme/themeMode';

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
    // overflow hidden: quả cầu trang trí (top 780) không được tràn ra ngoài, nếu không khung tab chung bị cuộn
    // khi focus ô nhập ở màn khác (vd. Hội thoại AI bị đẩy lên 74px)
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
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
  /** Kiểu bản đồ mùa đông (giao diện tối + Giáng sinh). */
  winter?: boolean;
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
  winter = false,
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

  // Bản đồ mùa đông: hoàn thành = emerald viền vàng; hiện tại = xanh sapphire viền cyan; khoá = băng giá
  const w = winter
    ? {
        face: isCompleted ? '#059669' : isCurrent ? '#1D4ED8' : isLocked ? '#1E2B45' : '#172554',
        base: isCompleted ? '#064E3B' : isCurrent ? '#172554' : isLocked ? '#0F172A' : '#0B1730',
        border: unit.is_premium && !isCompleted ? WINTER.gold : isCompleted ? WINTER.gold : isCurrent ? WINTER.cyan : isLocked ? 'rgba(147,197,253,0.45)' : WINTER.ice,
      }
    : null;

  return (
    <View style={s.nodeWrapper}>
      {winter && (isCurrent || isCompleted) ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          <NodeGlow size={NODE_SIZE} color={isCurrent ? WINTER.cyan : WINTER.gold} strong={isCurrent} />
        </View>
      ) : null}
      {/* Lớp đế 3D tạo độ dày đáy nổi */}
      <View style={[s.nodeBase3D, { backgroundColor: w ? w.base : baseBg }]} />

      {/* Lớp mặt nút bấm lún */}
      <AnimatedPressable
        onPress={() => onPress(unit)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          s.nodeFace3D,
          {
            backgroundColor: w ? w.face : faceBg,
            borderColor: w ? w.border : borderColor,
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
          <Lock color={winter ? WINTER.ice : '#94A3B8'} size={24} />
        ) : unit.icon_type === 'speech' ? (
          <MessageCircle color={colors.primary} size={28} />
        ) : (
          <BookOpen color={colors.primary} size={28} />
        )}

        {winter && isLocked ? <IceCrystals size={NODE_SIZE} /> : null}

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

      {winter && isCompleted ? <SnowCap size={NODE_SIZE} /> : null}
      {winter && unit.is_premium && !isCompleted ? <GoldShimmer size={NODE_SIZE} /> : null}
      {winter && isCurrent ? (
        <>
          <OrbitSparkles size={NODE_SIZE} />
          <SantaHat size={30} style={{ position: 'absolute', top: -20, left: NODE_SIZE / 2 - 6, transform: [{ rotate: '18deg' }] }} />
        </>
      ) : null}
    </View>
  );
};

// ─── TRANG TRÍ GIÁNG SINH DỌC ĐƯỜNG ĐI ───
// Đặt ở khoảng trống hai mép, phía đối diện nút bài học cùng hàng → không che nút / tên bài.
const XmasPathDecor: React.FC<{ index: number; chapterNumber: number; kinds?: WinterDecor[] }> = ({ index, chapterNumber, kinds }) => {
  const mod = index % 4;
  const leftSide = mod === 1 ? true : mod === 3 ? false : (Math.floor(index / 2) + chapterNumber) % 2 === 0;
  const kind = (index + chapterNumber) % 3;
  const top = index * VERTICAL_GAP + 4;
  const pos = leftSide ? { left: 0 } : { right: 0 };
  return (
    <View pointerEvents="none" style={[s.xmasDecor, { top }, pos]}>
      {kinds && kinds.length ? (
        <WinterDecorItem kind={kinds[(index + chapterNumber) % kinds.length]} delay={index * 350} />
      ) : kind === 0 ? (
        <XmasTree size={42} delay={index * 300} />
      ) : kind === 1 ? (
        <Snowman size={38} delay={index * 300} />
      ) : (
        <View style={{ alignItems: 'center', paddingTop: 18 }}>
          <GiftBox size={30} color={index % 2 ? '#0EA5E9' : '#E11D48'} delay={index * 300} />
        </View>
      )}
    </View>
  );
};

export const LearningPathScreen = () => {
  // Bản đồ "Christmas Winter Adventure": chỉ ở giao diện tối khi bật trang trí Giáng sinh
  const xmas = useXmasActive();
  const winter = xmas;
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = hasActivePremium(currentUser);

  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);
  const [curriculum, setCurriculum] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Trình độ dùng để lọc: kết quả bài đầu vào mà lộ trình trả về, sau đó tới hồ sơ học viên
  const { level: profileLevel, needsPlacement } = useLearnerLevel();
  const learnerLevel = useMemo(
    () => normalizeCefr(curriculum.find((c) => c.placement_level)?.placement_level) ?? profileLevel,
    [curriculum, profileLevel],
  );
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL');
  const [filterTouched, setFilterTouched] = useState(false);
  useEffect(() => {
    if (!filterTouched) setLevelFilter(defaultLevelFilter(learnerLevel));
  }, [learnerLevel, filterTouched]);
  const pickLevel = (f: LevelFilter) => {
    setFilterTouched(true);
    setLevelFilter(f);
  };
  const { chapters: visibleChapters, fallbackLevel } = useMemo(() => {
    const resolved = resolveChaptersForLevel(curriculum, levelFilter, learnerLevel);
    // Xem tất cả: chương gần trình độ học viên đứng trước, các trình độ khác xếp sau
    return levelFilter === 'ALL'
      ? { ...resolved, chapters: sortByLevelCloseness(resolved.chapters, learnerLevel, (c) => c.cefr_level) }
      : resolved;
  }, [curriculum, levelFilter, learnerLevel]);
  const myFilter = learnerLevel ? defaultLevelFilter(learnerLevel) : null;
  const levelChips: LevelFilter[] = myFilter
    ? [myFilter, 'ALL', ...LEVEL_FILTERS.filter((l) => l !== myFilter)]
    : ['ALL', ...LEVEL_FILTERS];

  // Pulse animation cho node hiện tại
  const pulseScale = useSharedValue(1);

  // Fetch roadmap API
  const loadRoadmap = useCallback(() => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');
    const uid = currentUser?.id ? String(currentUser.id) : undefined;
    fetchLearningPathRoadmapApi(uid)
      .then((milestones: any[]) => {
        const validMilestones = (milestones || []).filter(isSystemCourse);
        if (!validMilestones || validMilestones.length === 0) {
          setCurriculum([]);
          return;
        }
        const mapped: Chapter[] = validMilestones.map((m: any, idx: number) => ({
          id: String(m.id || `ch-${idx + 1}`),
          chapter_number: m.chapterNumber || idx + 1,
          title_vi: m.titleVi || m.title || `Chương ${idx + 1}`,
          title_en: m.titleEn || m.title || `Chapter ${idx + 1}`,
          is_premium: Boolean(m.isPremium),
          placement_start: Boolean(m.placementStart),
          below_placement: Boolean(m.belowPlacementLevel),
          placement_level: m.placementCefrLevel ?? null,
          cefr_level: m.targetCefrLevel ?? m.cefrLevelMin ?? null,
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
        setCurriculum(mapped);
      })
      .catch((err) => {
        console.warn('[LearningPath] API load failed:', err);
        setIsError(true);
        setErrorMessage(err?.message || 'Không thể kết nối đến máy chủ lộ trình học.');
        setCurriculum([]);
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
      router.push({ pathname: '/(student)/profile/premium', params: { from: 'learn' } } as any);
      return;
    }
    setSelectedUnit(unit);
  };

  const handleStartLesson = (unitId: string) => {
    setSelectedUnit(null);
    router.push(`/(student)/lesson/${unitId}` as any);
  };

  return (
    <View style={[s.container, winter && { backgroundColor: WINTER.midnight }]}>
      {winter ? <WinterBackdrop scrollY={scrollY} /> : <DynamicPathBackground />}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Header Bar */}
        <View style={s.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={s.badgeRow}>
              <Compass color={colors.primary} size={14} />
              <Text style={s.subHeader}>LỘ TRÌNH HỌC TẬP</Text>
            </View>
            <Text style={s.mainHeader} numberOfLines={1}>Hành Trình Chinh Phục</Text>
          </View>

          {!isPremium && (
            <Pressable
              onPress={() => router.push({ pathname: '/(student)/profile/premium', params: { from: 'learn' } } as any)}
              style={[s.premiumTag, winter && s.winterPro]}
            >
              <Crown color={winter ? WINTER.midnight : colors.warning} size={14} />
              <Text style={[s.premiumTagText, winter && { color: WINTER.midnight }]}>Mở khóa Pro</Text>
            </Pressable>
          )}
        </View>

        {xmas ? <Garland width={CONTENT_WIDTH} style={{ marginTop: -4, marginBottom: 6 }} /> : null}

        {/* Chưa làm test đầu vào: mời làm trước để lộ trình bắt đầu đúng trình độ */}
        {needsPlacement ? (
          <Pressable
            onPress={() => router.push('/(student)/placement' as never)}
            style={s.placementCta}
            accessibilityRole="button"
            accessibilityLabel="Làm bài kiểm tra đầu vào"
          >
            <View style={s.placementCtaIcon}>
              <Compass color="#FFFFFF" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.placementCtaTitle}>Làm bài kiểm tra đầu vào</Text>
              <Text style={s.placementCtaSub}>Khoảng 3 phút để AI xác định trình độ và xếp lộ trình phù hợp cho bạn</Text>
            </View>
          </Pressable>
        ) : null}

        {!isLoading && !isError && curriculum.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.levelChips}>
            {levelChips.map((f) => {
              const active = levelFilter === f;
              const label = f === 'ALL' ? 'Tất cả trình độ' : f === myFilter ? `${f} · Trình độ của bạn` : f;
              return (
                <Pressable
                  key={f}
                  onPress={() => pickLevel(f)}
                  style={[s.levelChip, active && s.levelChipActive, winter && (active ? s.winterChipActive : s.winterChip)]}
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={f === 'ALL' ? 'Xem lộ trình mọi trình độ' : `Lộ trình trình độ ${f}`}
                >
                  <Text style={[s.levelChipText, active && s.levelChipTextActive, winter && { color: active ? WINTER.midnight : WINTER.ice }]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {isLoading ? (
          <TabLoadingState message="Đang tải lộ trình học..." />
        ) : isError ? (
          <View style={{ backgroundColor: dk('#FFFFFF', 'bg'), borderRadius: 20, padding: 24, marginHorizontal: 4, marginTop: 24, alignItems: 'center', borderWidth: 1, borderColor: dk('#FEE2E2', 'border'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: dk('#FEF2F2', 'bg'), alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <AlertCircle color="#EF4444" size={28} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: dk('#1E293B', 'text'), marginBottom: 6, textAlign: 'center' }}>
              Không thể tải lộ trình học
            </Text>
            <Text style={{ fontSize: 13, color: dk('#64748B', 'text'), textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 12 }}>
              {errorMessage || 'Đã có lỗi xảy ra khi kết nối đến dịch vụ học tập. Vui lòng kiểm tra lại kết nối mạng.'}
            </Text>
            <Pressable
              onPress={loadRoadmap}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 8 }}
            >
              <RefreshCw color="#FFFFFF" size={16} />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Thử lại</Text>
            </Pressable>
          </View>
        ) : curriculum.length === 0 ? (
          <View style={{ backgroundColor: dk('#FFFFFF', 'bg'), borderRadius: 20, padding: 28, marginHorizontal: 4, marginTop: 24, alignItems: 'center', borderWidth: 1, borderColor: dk('#E2E8F0', 'border'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: dk('#EFF6FF', 'bg'), alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Compass color="#3B82F6" size={28} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: dk('#1E293B', 'text'), marginBottom: 6, textAlign: 'center' }}>
              Chưa có dữ liệu lộ trình học
            </Text>
            <Text style={{ fontSize: 13, color: dk('#64748B', 'text'), textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 }}>
              Hệ thống chưa có khóa học tiêu chuẩn hoặc đang được cập nhật. Bạn có thể làm bài kiểm tra đầu vào để hệ thống sắp xếp bài học phù hợp.
            </Text>
            <Pressable
              onPress={() => router.push('/(student)/placement' as never)}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Làm bài kiểm tra</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !isError && fallbackLevel ? (
          <Text style={s.levelNote}>
            Chưa có chương ở trình độ {levelFilter}, bạn có thể bắt đầu từ trình độ gần nhất {fallbackLevel}.
          </Text>
        ) : null}

        {isLoading || isError || curriculum.length === 0 ? null : visibleChapters.length === 0 ? (
          <View style={s.levelEmpty}>
            <Text style={s.levelEmptyTitle}>Chưa có chương nào ở trình độ {levelFilter}</Text>
            <Pressable onPress={() => pickLevel('ALL')} hitSlop={8}>
              <Text style={s.levelLink}>Xem tất cả trình độ</Text>
            </Pressable>
          </View>
        ) : (
          visibleChapters.map((chapter) => {
          const biome = getBiomeForChapter(chapter.chapter_number);
          const world = getWinterWorld(chapter.chapter_number);
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
                winter && s.winterIsland,
              ]}
            >
              {/* Chapter Header Banner */}
              <LinearGradient
                colors={winter ? world.banner : biome.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={[s.chapterBanner, xmas && s.chapterBannerXmas, winter && [s.winterBanner, { borderColor: `${world.accent}77`, shadowColor: world.accent }]]}
              >
                {winter ? <WinterBannerDeco width={CONTENT_WIDTH} accent={world.accent} /> : null}
                {xmas ? (
                  <View pointerEvents="none" style={s.bannerXmas}>
                    <Snowman size={40} delay={chapter.chapter_number * 200} />
                    <XmasTree size={50} delay={chapter.chapter_number * 350} />
                  </View>
                ) : null}
                <View style={s.chapterBannerTop}>
                  <View style={[s.biomeBadge, { backgroundColor: winter ? 'rgba(255,255,255,0.12)' : biome.badgeBg }]}>
                    <Text style={[s.biomeBadgeText, { color: winter ? world.accent : biome.badgeText }]}>
                      {winter ? world.name : biome.name}
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
                {chapter.placement_start || chapter.below_placement ? (
                  <View style={s.placementChip}>
                    <Text style={s.placementChipText}>
                      {chapter.placement_start
                        ? `Bắt đầu từ đây theo trình độ ${chapter.placement_level ?? ''}`.trim()
                        : 'Dưới trình độ của bạn, có thể ôn lại'}
                    </Text>
                  </View>
                ) : null}
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

                    if (winter) {
                      return (
                        <WinterBranch
                          key={`branch-${unit.id}-${nextUnit.id}`}
                          fromX={fromX}
                          fromY={fromY}
                          toX={toX}
                          toY={toY}
                          isCompleted={isCompleted}
                          isUpcoming={isUpcoming}
                        />
                      );
                    }
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

                {/* Trang trí Giáng sinh hai bên đường đi */}
                {xmas
                  ? chapter.units.map((unit, index) => (
                      <XmasPathDecor key={`xmas-${unit.id}`} index={index} chapterNumber={chapter.chapter_number} kinds={winter ? world.decor : undefined} />
                    ))
                  : null}

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
                        <Animated.View style={[s.startTooltip, winter && s.winterTooltipWrap, activePulseStyle]}>
                          <View style={[s.startTooltipBox, winter && s.winterTooltip]}>
                            <Flame color="#FFFFFF" size={13} fill="#FFFFFF" />
                            <Text style={s.startTooltipText} numberOfLines={1}>Bắt đầu ở đây!</Text>
                          </View>
                          <View style={[s.tooltipArrow, winter && { borderTopColor: WINTER.red }]} />
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
                        winter={winter}
                      />

                      {/* Tên bài học bên dưới node */}
                      <Text
                        style={[
                          s.nodeLabel,
                          isCurrent && s.nodeLabelCurrent,
                          isCompleted && { color: biome.pathCompleted, fontWeight: '800' },
                          winter && s.winterLabel,
                          winter && isCompleted && { color: WINTER.gold },
                          winter && isCurrent && { color: WINTER.cyan },
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
              <View style={[s.chestMilestoneRow, winter && [s.winterChest, { borderColor: `${WINTER.gold}55` }]]}>
                <View style={[s.chestIconBox, { backgroundColor: biome.badgeBg }]}>
                  {isChapterAllDone ? (
                    <Sparkles color={biome.chestAccent} size={24} />
                  ) : (
                    <Gift color={biome.chestAccent} size={24} />
                  )}
                </View>
                <View style={s.chestInfo}>
                  <Text style={s.chestTitle}>
                    {isChapterAllDone ? 'Đã Hoàn Thành Chương!' : 'Rương Thưởng Cuối Chương'}
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
        }))}

        {!isLoading && !isError && curriculum.length > 0 && levelFilter !== 'ALL' && visibleChapters.length > 0 ? (
          <Pressable onPress={() => pickLevel('ALL')} style={s.levelMore} hitSlop={8} accessibilityLabel="Xem lộ trình các trình độ khác">
            <Text style={s.levelLink}>Xem lộ trình các trình độ khác</Text>
          </Pressable>
        ) : null}

        {!isLoading ? (
          <View style={s.teacherCourses}>
            <TeacherCoursesShowcase />
          </View>
        ) : null}
      </Animated.ScrollView>

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
                    {selectedUnit.is_premium ? 'Gói Premium' : 'Miễn Phí'}
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
              {/* Pressable thường: AnimatedPressable của Reanimated không nhận Animated.Value của RN (gây lỗi transform) */}
              <Pressable
                onPress={() => handleStartLesson(selectedUnit.id)}
                style={({ pressed }) => [s.startLessonBtn, pressed && { transform: [{ scale: 0.97 }] }]}
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
    backgroundColor: colors.bg,
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexShrink: 0,
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
  levelChips: {
    gap: 8,
    paddingBottom: 14,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  levelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelChipText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.text,
  },
  levelChipTextActive: {
    color: '#FFFFFF',
  },
  levelNote: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: colors.textSoft,
    marginBottom: 12,
  },
  levelEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  levelEmptyTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  levelLink: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.primary,
  },
  levelMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  teacherCourses: {
    marginTop: 8,
    marginBottom: 24,
  },
  placementChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  placementChipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
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
  placementCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  placementCtaIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  placementCtaTitle: { fontSize: 15, fontFamily: font.family, fontWeight: '800', color: '#FFFFFF' },
  placementCtaSub: { fontSize: 12, fontFamily: font.family, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 17 },
  xmasDecor: { position: 'absolute', width: 56, alignItems: 'center' },
  winterIsland: { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  winterBanner: { marginBottom: 40, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  winterChip: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(147,197,253,0.28)' },
  winterChipActive: { backgroundColor: '#67E8F9', borderColor: '#93C5FD' },
  winterPro: { backgroundColor: '#FBBF24', borderColor: '#FDE68A' },
  winterTooltip: { backgroundColor: '#DC2626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', shadowColor: '#EF4444' },
  winterTooltipWrap: { width: 170, left: (NODE_SIZE - 170) / 2, top: -48 },
  winterLabel: { color: '#C9D7E8', textShadowColor: 'rgba(6,13,31,0.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  winterChest: { backgroundColor: 'rgba(19,31,53,0.85)' },
  chapterBannerXmas: { paddingRight: 104 },
  bannerXmas: { position: 'absolute', right: 8, bottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
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
