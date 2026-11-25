import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { getPracticeUpdatedAt } from "@/src/core/flows/practiceActivity";
import { BackButton } from "@/src/core/components/BackButton";
import Svg, {
  Polygon,
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import {
  ChevronUp,
  ChevronDown,
  Crown,
  Globe,
  Medal,
  TrendingUp,
} from "lucide-react-native";
import {
  AlertCircle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "@/src/components/ds/icons";
import { ProgressBar, Reveal, Tap, dsText } from "@/src/components/ds";
import { ds, dsFont, dsRadius, dsShadow, dsSize } from "@/src/theme/ds";
import { useAuthStore } from "@/src/core/flows/authStore";
import { UserAvatar } from "@/src/core/components/UserAvatar";
import { AnimatedFoxMascot } from "@/src/core/components/AnimatedFoxMascot";
import { TabLoadingState } from "@/src/components/ui/TabLoadingState";
import { FoxRunLoader } from "@/src/core/components/FoxRunLoader";
import {
  fetchProgressStatsApi,
  fetchAiAssessmentApi,
  fetchLeaderboardApi,
  StudentProgressData,
  StudentAssessmentData,
  LeaderboardData,
  LeaderboardMember,
  RemedialQuiz,
} from "../../data/analyticsApi";
import { PracticeFeedbackOverview } from '@/src/features/practice-feedback/presentation/components/PracticeFeedbackOverview';
import { ChristmasScene, type ChristmasSceneKey } from '@/src/components/xmas/ChristmasScenes';
import { useXmasActive } from '@/src/core/services/xmas';
import { Campfire, METRIC_TONE, MetricArt, type MetricKind } from '@/src/components/xmas/ExpeditionArt';
import { SnowCorner } from '@/src/components/xmas/WinterUI';
import { Mountains } from '@/src/features/learning-path/presentation/winter/WinterBackdrop';
import { SantaHat } from '@/src/features/learning-path/presentation/winter/WinterArt';
import { ShimmerSweep, SnowEdge, SparkleRing, glassCard } from '@/src/components/xmas/WinterUI';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { dk } from '@/src/theme/themeMode';

type TabKey = "progress" | "analytics" | "ranking";

/** Tiến độ = Hành trình núi tuyết · Đánh giá = Đài quan sát pha lê · Xếp hạng = Lễ hội nhà vô địch. */
const TAB_SCENE: Record<TabKey, ChristmasSceneKey> = { progress: "expedition", analytics: "observatory", ranking: "festival" };

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "progress", label: "Tiến độ", icon: TrendingUp },
  { key: "analytics", label: "Đánh giá", icon: Sparkles },
  { key: "ranking", label: "Xếp hạng", icon: Trophy },
];

/** Màu huy chương top 3: vàng, bạc, đồng. */
const MEDAL = [ds.amber, ds.lineStrong, ds.heart] as const;
/** Bục vinh danh Giáng sinh: vàng kim · bạc băng · đồng ấm. */
const XMAS_MEDAL = ['#FBBF24', '#CBD5E1', '#CD7F32'] as const;
const MEDAL_SOFT = [ds.amberSoft, ds.line, ds.redSoft] as const;

// ───── Cột biểu đồ 7 ngày: mọc lên bằng lò xo ─────
const WeekBar: React.FC<{
  pct: number;
  minutes: number;
  label: string;
  isToday: boolean;
  index: number;
  /** Biểu đồ pha lê băng (Giáng sinh). */
  xmas?: boolean;
}> = ({ pct, minutes, label, isToday, index, xmas = false }) => {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(
      index * 60,
      // Giáng sinh: 0 phút là đúng 0 — không vẽ cột giả để trang trí
      withSpring(xmas && minutes <= 0 ? 0 : pct, { damping: 14, stiffness: 120 }),
    );
  }, [h, index, pct, xmas, minutes]);
  const barStyle = useAnimatedStyle(() => ({ height: `${h.value}%` }));
  return (
    <View style={s.barCol}>
      <Text style={[s.barValue, isToday && { color: ds.btn }, xmas && { color: isToday ? '#FCD34D' : '#BAE6FD' }]}>
        {minutes > 0 ? `${minutes}p` : ""}
      </Text>
      <View style={[s.barTrack, xmas && { backgroundColor: 'rgba(186,230,253,0.08)', borderWidth: 1, borderColor: 'rgba(186,230,253,0.15)' }]}>
        <Animated.View
          style={[
            s.barFill,
            { backgroundColor: isToday ? ds.btn : ds.skyLight },
            xmas && { overflow: 'hidden', backgroundColor: 'transparent', shadowColor: isToday ? '#FBBF24' : '#67E8F9', shadowOpacity: 0.9, shadowRadius: 8 },
            barStyle,
          ]}
        >
          {xmas ? (
            <>
              <ExpoGradient
                colors={isToday ? ['#FDE68A', '#FBBF24', '#B45309'] : ['#E0F2FE', '#67E8F9', '#1D4ED8']}
                style={StyleSheet.absoluteFill}
              />
              {/* Mặt cắt pha lê: vệt sáng dọc bên trái cột */}
              <View style={{ position: 'absolute', left: 2, top: 2, bottom: 2, width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' }} />
            </>
          ) : null}
        </Animated.View>
      </View>
      <Text style={[s.barDay, isToday && s.barDayToday]}>{label}</Text>
    </View>
  );
};

// ───── Ô chỉ số ─────
const StatTile: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tint: string;
  tone: string;
  value: string;
  label: string;
  hint: string;
  /** Giáng sinh: thẻ kính + minh hoạ riêng theo chỉ số. */
  xmasKind?: MetricKind;
}> = ({ icon: Icon, tint, tone, value, label, hint, xmasKind }) => (
  <View
    style={[
      s.statTile,
      xmasKind ? { backgroundColor: 'rgba(11,23,48,0.9)', borderColor: `${METRIC_TONE[xmasKind].glow}66`, overflow: 'hidden' } : null,
    ]}
  >
    {xmasKind ? (
      <>
        <ExpoGradient colors={METRIC_TONE[xmasKind].tint} style={StyleSheet.absoluteFill} />
        <SnowCorner size={34} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: 8 }}>
          <MetricArt kind={xmasKind} size={48} />
        </View>
      </>
    ) : null}
    <View style={[s.statIcon, { backgroundColor: tone }]}>
      <Icon size={20} color={xmasKind ? METRIC_TONE[xmasKind].glow : tint} />
    </View>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={s.statHint} numberOfLines={1}>
      {hint}
    </Text>
  </View>
);

// ───── Thẻ trắng có tiêu đề ─────
const Card: React.FC<{
  title?: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: object;
  /** Lớp nền trang trí phía sau nội dung thẻ. */
  backdrop?: React.ReactNode;
}> = ({ title, sub, right, children, style, backdrop }) => (
  <View style={[s.card, style]}>
    {backdrop}
    {title ? (
      <View style={s.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
        </View>
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

// ───── Vòng điểm tổng (SVG) ─────
const ScoreRing: React.FC<{ score: number; size?: number; xmas?: boolean }> = ({
  score,
  size = 96,
  xmas = false,
}) => {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {xmas ? (
          <Defs>
            <LinearGradient id="crystalRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#22D3EE" />
              <Stop offset="0.55" stopColor="#A78BFA" />
              <Stop offset="1" stopColor="#FCD34D" />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={xmas ? 'rgba(165,180,252,0.18)' : ds.onInkFaint}
          strokeWidth={stroke}
          fill="none"
        />
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={xmas ? 'url(#crystalRing)' : ds.amber}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      {xmas ? <SparkleRing size={size} color="#A5F3FC" /> : null}
      <Text style={[s.ringValue, xmas && { color: '#F1F5F9', textShadowColor: '#22D3EE', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } }]}>{score}</Text>
      <Text style={s.ringMax}>/100</Text>
    </View>
  );
};

// ───── Hàng bảng xếp hạng ─────
const RankRow: React.FC<{ member: LeaderboardMember }> = ({ member }) => {
  const top = member.rank >= 1 && member.rank <= 3 ? member.rank - 1 : -1;
  return (
    <View style={[s.rankRow, member.isMe && s.rankRowMe]}>
      <View
        style={[s.rankNum, top >= 0 && { backgroundColor: MEDAL_SOFT[top] }]}
      >
        <Text style={[s.rankNumText, top >= 0 && { color: ds.ink }]}>
          {member.rank}
        </Text>
      </View>
      <UserAvatar uri={member.avatarUrl} size={40} style={s.rankAvatar} />
      <View style={{ flex: 1 }}>
        <View style={s.rankNameRow}>
          <Text
            style={[s.rankName, member.isMe && { color: ds.btn }]}
            numberOfLines={1}
          >
            {member.displayName || member.username}
          </Text>
          {member.isMe ? (
            <View style={s.meTag}>
              <Text style={s.meTagText}>Bạn</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.rankXp}>
          {member.weeklyXp.toLocaleString("vi-VN")} XP tuần này
        </Text>
      </View>
      <View
        style={[
          s.trend,
          member.trend === "up" && { backgroundColor: ds.greenSoft },
          member.trend === "down" && { backgroundColor: ds.redSoft },
        ]}
      >
        {member.trend === "up" ? (
          <ChevronUp color={ds.green} size={14} />
        ) : null}
        {member.trend === "down" ? (
          <ChevronDown color={ds.red} size={14} />
        ) : null}
        <Text
          style={[
            s.trendText,
            member.trend === "up" && { color: ds.greenText },
            member.trend === "down" && { color: ds.redText },
          ]}
        >
          {member.delta || "0"}
        </Text>
      </View>
    </View>
  );
};

// ───── Cột bục vinh danh ─────
const PodiumCol: React.FC<{
  member?: LeaderboardMember;
  place: 0 | 1 | 2;
  height: number;
  delay: number;
  /** Sân khấu vinh danh Giáng sinh (giao diện tối). */
  xmas?: boolean;
}> = ({ member, place, height, delay, xmas = false }) => {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 110 }),
    );
  }, [delay, grow]);
  const barStyle = useAnimatedStyle(() => ({ height: height * grow.value }));
  if (!member) return <View style={s.podiumCol} />;
  const big = place === 0;
  // Vàng kim · bạc băng · đồng ấm
  const tone = xmas ? XMAS_MEDAL[place] : MEDAL[place];
  return (
    <View style={s.podiumCol}>
      {xmas && big ? (
        <ExpoGradient
          pointerEvents="none"
          colors={['rgba(253,224,71,0.32)', 'rgba(253,224,71,0)']}
          style={{ position: 'absolute', top: -30, width: 120, height: 170, borderTopLeftRadius: 60, borderTopRightRadius: 60 }}
        />
      ) : null}
      {big ? (
        <Crown
          color={ds.amber}
          fill={ds.amber}
          size={24}
          style={{ marginBottom: 2 }}
        />
      ) : null}
      <View
        style={[
          s.podiumAvatarRing,
          { borderColor: tone },
          big && s.podiumAvatarRingBig,
          xmas && { shadowColor: tone, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
        ]}
      >
        <UserAvatar uri={member.avatarUrl} size={big ? 56 : 46} />
        {xmas ? <SparkleRing size={big ? 64 : 54} color={tone} /> : null}
      </View>
      <Text
        style={[s.podiumName, member.isMe && { color: ds.btn }]}
        numberOfLines={1}
      >
        {member.displayName || member.username}
      </Text>
      <Text style={s.podiumXp}>
        {member.weeklyXp.toLocaleString("vi-VN")} XP
      </Text>
      <Animated.View
        style={[s.podiumBar, { backgroundColor: tone }, xmas && { overflow: 'hidden' }, barStyle]}
      >
        {xmas ? <SnowEdge /> : null}
        {xmas && big ? <ShimmerSweep width={110} every={2600} /> : null}
        <Medal size={16} color={place === 1 ? ds.ink : ds.white} />
        <Text style={[s.podiumPlace, place === 1 && { color: ds.ink }]}>
          {place + 1}
        </Text>
      </Animated.View>
    </View>
  );
};

const XMAS_GLASS_ICE = { backgroundColor: 'rgba(11,23,48,0.9)', borderColor: 'rgba(186,230,253,0.3)', overflow: 'hidden' as const };

/** Nền thẻ biểu đồ: bóng núi tuyết mờ + vài ngôi sao (ngoài vùng cột). */
const ChartBackdrop: React.FC = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.35 }}>
      <Mountains width={360} height={90} color={dk('#1E3A5F', 'text')} peaks={[0.3, 0.7, 0.45, 0.9, 0.5, 0.75, 0.35]} snow />
    </View>
    {[0.62, 0.74, 0.86].map((fx, i) => (
      <View key={fx} style={{ position: 'absolute', left: `${fx * 100}%`, top: 16 + i * 8, width: 2, height: 2, borderRadius: 1, backgroundColor: dk('#F1F5F9', 'bg'), opacity: 0.6 }} />
    ))}
  </View>
);

/** `showBack`: mở như màn chi tiết (route /analytics) thì có nút quay lại; ở tab Thống kê thì không. */
export const AnalyticsScreen = ({ showBack = false }: { showBack?: boolean }) => {
  const xmas = useXmasActive();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("progress");
  const [rankingSubTab, setRankingSubTab] = useState<"global" | "friends">(
    "global",
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Dữ liệu thật từ backend
  const [progressData, setProgressData] = useState<StudentProgressData | null>(
    null,
  );
  const [assessmentData, setAssessmentData] =
    useState<StudentAssessmentData | null>(null);
  const [assessmentFailed, setAssessmentFailed] = useState(false);
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);

  // Bài luyện lỗi sai tương tác
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const loadedAt = useRef(0);
  const loadData = useCallback(async () => {
    loadedAt.current = Date.now();
    try {
      const uid = currentUser?.id ? String(currentUser.id) : undefined;
      // Đánh giá AI gọi Gemini nên chậm (10–50s): tải riêng để Tiến độ/Xếp hạng hiện ngay
      // và lỗi của nó không làm hỏng cả màn.
      setAssessmentFailed(false);
      fetchAiAssessmentApi(uid)
        .then(setAssessmentData)
        .catch((err) => {
          console.warn("[AnalyticsScreen] AI assessment failed:", err);
          setAssessmentFailed(true);
        });
      const [prog, lb] = await Promise.all([
        fetchProgressStatsApi(uid),
        fetchLeaderboardApi(rankingSubTab, uid),
      ]);
      setProgressData(prog);
      setLeaderboardData(lb);
      setLoadFailed(false);
    } catch (err) {
      console.error("[AnalyticsScreen] Load data failed:", err);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id, rankingSubTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Vừa làm bài / được AI chấm ở màn khác: mở lại tab thì tải lại số liệu và Đánh giá AI
  useFocusEffect(
    useCallback(() => {
      if (loadedAt.current > 0 && getPracticeUpdatedAt() > loadedAt.current) loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSwitchRankingSubTab = async (subTab: "global" | "friends") => {
    setRankingSubTab(subTab);
    try {
      const uid = currentUser?.id ? String(currentUser.id) : undefined;
      const lb = await fetchLeaderboardApi(subTab, uid);
      setLeaderboardData(lb);
    } catch (err) {
      console.warn("[AnalyticsScreen] fetchLeaderboardApi failed:", err);
    }
  };

  // Radar ngũ giác theo điểm thật
  const cx = 120;
  const cy = 110;
  const maxR = 72;
  const getPentagonPoints = (r: number) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 180) * (i * 72 - 90);
      points.push(
        `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`,
      );
    }
    return points.join(" ");
  };

  const radarScores = progressData?.skillRadarScores || {
    vocabulary: 0,
    grammar: 0,
    speaking: 0,
    reading: 0,
    listening: 0,
  };
  const userSkillRatios = [
    Math.max(0.12, (radarScores.vocabulary || 0) / 100),
    Math.max(0.12, (radarScores.grammar || 0) / 100),
    Math.max(0.12, (radarScores.speaking || 0) / 100),
    Math.max(0.12, (radarScores.reading || 0) / 100),
    Math.max(0.12, (radarScores.listening || 0) / 100),
  ];
  const userSkillPoints = userSkillRatios
    .map((ratio, i) => {
      const angle = (Math.PI / 180) * (i * 72 - 90);
      return `${(cx + maxR * ratio * Math.cos(angle)).toFixed(1)},${(cy + maxR * ratio * Math.sin(angle)).toFixed(1)}`;
    })
    .join(" ");

  const getSkillLevelStr = (score: number) => {
    if (score >= 80) return "B2 Cao cấp";
    if (score >= 60) return "B1 Khá";
    if (score >= 40) return "A2 Trung bình";
    return "A1 Khởi đầu";
  };

  const skillData = [
    { label: "Từ vựng", score: radarScores.vocabulary, color: ds.sky },
    { label: "Ngữ pháp", score: radarScores.grammar, color: ds.btn },
    { label: "Phát âm & Nói", score: radarScores.speaking, color: ds.green },
    { label: "Nghe hiểu", score: radarScores.listening, color: ds.heart },
    { label: "Đọc hiểu", score: radarScores.reading, color: ds.amber },
  ].map((x) => ({ ...x, level: getSkillLevelStr(x.score) }));

  const safeTop = (insets.top || 16) + 8;

  const remedialList = assessmentData?.remedialQuizzes || [];
  const currentQuiz: RemedialQuiz | undefined = remedialList[activeQuizIndex];

  const isCorrectOption = (opt: string, quiz: RemedialQuiz) =>
    opt
      .trim()
      .toLowerCase()
      .startsWith(quiz.correctAnswer.trim().toLowerCase()) ||
    opt.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return; // Không cho đổi sau khi đã chọn
    setSelectedOption(opt);
    setShowExplanation(true);
    if (currentQuiz && isCorrectOption(opt, currentQuiz)) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (activeQuizIndex < remedialList.length - 1) {
      setActiveQuizIndex((prev) => prev + 1);
    } else {
      setActiveQuizIndex(0);
    }
  };

  const rankList = leaderboardData?.rankList || [];
  const [top1, top2, top3] = rankList;
  const restRankList = rankList.slice(3);

  const maxMins = Math.max(
    1,
    ...(progressData?.weeklyChart?.map((d) => d.minutes) || [1]),
  );
  const studiedDays =
    progressData?.weeklyChart?.filter((d) => d.minutes > 0).length ?? 0;

  return (
    <View style={[s.root, xmas && { backgroundColor: 'transparent' }]}>
      {/* Giáng sinh (giao diện tối): mỗi tab một khung cảnh, đổi tab thì cảnh mờ dần sang nhau */}
      {xmas ? <ChristmasScene scene={TAB_SCENE[activeTab]} /> : null}
      {/* Thanh chuyển tab dạng pill */}
      <View style={[s.header, { paddingTop: safeTop }, xmas && { backgroundColor: 'transparent' }]}>
        <View style={s.titleRow}>
          {showBack ? <BackButton /> : null}
          <Text style={dsText.h1}>Thống kê</Text>
        </View>
        <View style={s.tabs}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[s.tab, active && s.tabActive]}
                accessibilityState={{ selected: active }}
              >
                <Icon size={16} color={active ? ds.white : ds.muted} />
                <Text style={[s.tabText, active && s.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.content,
          { paddingBottom: (insets.bottom || 12) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ds.btn]}
          />
        }
      >
        {isLoading && !progressData ? (
          <TabLoadingState message="Đang tải dữ liệu học tập..." />
        ) : null}

        {!isLoading && loadFailed && !progressData ? (
          <View style={s.stateBox}>
            <AlertCircle size={30} color={ds.red} />
            <Text style={s.stateTitle}>Không tải được thống kê</Text>
            <Text style={s.stateHint}>Kiểm tra kết nối mạng rồi thử lại.</Text>
            <Pressable onPress={onRefresh} style={s.retryBtn}>
              <Text style={s.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ═══════════ TAB 1: TIẾN ĐỘ ═══════════ */}
        {activeTab === "progress" && progressData ? (
          <View style={s.stack}>
            <Reveal>
              <View style={s.hero}>
                <ExpoLinearGradient
                  colors={xmas ? ['#050F24', '#172554', '#3B1D0A'] : [ds.hero, ds.btnEdge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {xmas ? (
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {/* Khu cắm trại: rừng thông + đồi tuyết phía sau, lều nhỏ */}
                    <Svg width="100%" height={70} viewBox="0 0 400 70" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, top: 4 }}>
                      <Path d="M250 70 L262 30 L274 70 Z M270 70 L284 18 L298 70 Z M330 70 L342 34 L354 70 Z M350 70 L364 22 L378 70 Z" fill="rgba(11,27,54,0.85)" />
                      <Path d="M300 70 L318 44 L336 70 Z" fill="#9A3412" />
                      <Path d="M318 44 L318 70" stroke="#FDE68A" strokeWidth={2} />
                    </Svg>
                  </View>
                ) : (
                  <View style={s.heroGlow} />
                )}
                <View style={s.heroTop}>
                  {xmas ? (
                    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Campfire size={58} />
                    </View>
                  ) : (
                    <View style={s.flameBox}>
                      <Flame size={30} color={ds.amber} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.heroBig, xmas && { color: '#FDE68A', textShadowColor: '#FB923C', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } }]}>
                      {progressData.streakDays}
                      <Text style={s.heroUnit}> ngày liên tiếp</Text>
                    </Text>
                    <Text style={s.heroSub}>
                      {progressData.streakDays > 0
                        ? "Giữ nhịp mỗi ngày để chuỗi lửa không tắt"
                        : "Học một bài hôm nay để thắp chuỗi lửa đầu tiên"}
                    </Text>
                  </View>
                </View>

                <View style={s.weekRow}>
                  {/* Con đường tuyết nối 7 trạm dừng */}
                  {xmas ? <View pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 4, borderRadius: 2, backgroundColor: 'rgba(241,245,249,0.25)' }} /> : null}
                  {progressData.weeklyChart.map((item, idx) => {
                    const done = item.minutes > 0;
                    const todayIdx = progressData.weeklyChart.findIndex((d) => d.isToday);
                    const future = todayIdx >= 0 && idx > todayIdx;
                    return (
                      <View key={idx} style={s.weekItem}>
                        <Text
                          style={[
                            s.weekLabel,
                            item.isToday && { color: ds.white },
                          ]}
                        >
                          {item.dayLabel}
                        </Text>
                        <View
                          style={[
                            s.weekDot,
                            done && s.weekDotDone,
                            item.isToday && s.weekDotToday,
                            xmas && (done
                              ? { backgroundColor: '#FBBF24', borderColor: '#FDE68A', shadowColor: '#FB923C', shadowOpacity: 1, shadowRadius: 10 }
                              : item.isToday
                                ? { backgroundColor: 'rgba(103,232,249,0.15)', borderColor: '#67E8F9', borderWidth: 2, shadowColor: '#67E8F9', shadowOpacity: 0.9, shadowRadius: 8 }
                                : future
                                  ? { backgroundColor: 'rgba(51,65,85,0.5)', borderColor: 'rgba(148,163,184,0.25)' }
                                  : { backgroundColor: 'rgba(241,245,249,0.12)', borderColor: 'rgba(241,245,249,0.55)' }),
                          ]}
                        >
                          {done ? (xmas ? <Flame size={15} color={dk('#7C2D12', 'text')} fill="#FB923C" /> : <Check size={14} color={ds.ink} />) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={s.heroGoal}>
                  <Award size={15} color={ds.amber} />
                  <Text style={s.heroGoalText}>
                    {progressData.streakDays > 0
                      ? `Mục tiêu kế tiếp: ${progressData.streakDays + 3} ngày · tuần này đã học ${studiedDays}/7 ngày`
                      : "Hoàn thành 1 bài học hôm nay để bắt đầu chuỗi"}
                  </Text>
                </View>
              </View>
            </Reveal>

            <Reveal delay={80}>
              <View style={s.grid}>
                <StatTile
                  icon={BookOpen}
                  tint={ds.btn}
                  tone={ds.skySoft}
                  value={String(progressData.masteredWords)}
                  label="Từ đã thành thạo"
                  xmasKind={xmas ? "mastered" : undefined}
                  hint={`Tổng ${progressData.totalWordsLearned} từ SRS`}
                />
                <StatTile
                  icon={Target}
                  tint={ds.amberText}
                  tone={ds.amberSoft}
                  value={`${progressData.quizAccuracyPct}%`}
                  label="Độ chính xác"
                  xmasKind={xmas ? "accuracy" : undefined}
                  hint={`${progressData.totalQuizCount} bài đã làm`}
                />
              </View>
            </Reveal>
            <Reveal delay={140}>
              <View style={s.grid}>
                <StatTile
                  icon={Clock}
                  tint={ds.heart}
                  tone={ds.redSoft}
                  value={`${(progressData.totalStudyMinutes / 60).toFixed(1)}h`}
                  label="Thời gian học"
                  xmasKind={xmas ? "time" : undefined}
                  hint={`Tuần này ${progressData.weeklyMinutes} phút`}
                />
                <StatTile
                  icon={Zap}
                  tint={ds.green}
                  tone={ds.greenSoft}
                  value={`${progressData.avgResponseTimeSec}s`}
                  label="Tốc độ phản xạ"
                  xmasKind={xmas ? "speed" : undefined}
                  hint={
                    progressData.avgResponseTimeSec > 0
                      ? "Thời gian trả lời TB"
                      : "Chưa có lượt thi"
                  }
                />
              </View>
            </Reveal>

            <Reveal delay={200}>
              <Card
                title="Thời gian học 7 ngày"
                sub={`Tổng tuần ${progressData.weeklyMinutes} phút`}
                style={xmas ? XMAS_GLASS_ICE : undefined}
                backdrop={xmas ? <ChartBackdrop /> : undefined}
                right={
                  <View style={s.pill}>
                    <Text style={s.pillText}>
                      {progressData.lessonsCompleted} bài xong
                    </Text>
                  </View>
                }
              >
                <View style={s.chart}>
                  {progressData.weeklyChart.slice(0, 7).map((item, idx) => (
                    <WeekBar
                      key={idx}
                      index={idx}
                      label={item.dayLabel}
                      minutes={item.minutes}
                      isToday={item.isToday}
                      xmas={xmas}
                      pct={Math.max(
                        6,
                        Math.min(
                          100,
                          Math.round((item.minutes / maxMins) * 92),
                        ),
                      )}
                    />
                  ))}
                </View>
              </Card>
            </Reveal>
          </View>
        ) : null}

        {/* ═══════════ TAB 2: ĐÁNH GIÁ ═══════════ */}
        {/* Tổng quan AI chấm từ các buổi luyện: tải riêng, không chờ API đánh giá lịch sử học */}
        {activeTab === "analytics" ? (
          <View style={{ marginBottom: 14 }}>
            <PracticeFeedbackOverview />
          </View>
        ) : null}
        {activeTab === "analytics" && assessmentData ? (
          <View style={s.stack}>
            <Reveal>
              <View style={s.hero}>
                <ExpoLinearGradient
                  colors={xmas ? ['#0B1026', '#312E81', '#1E1B4B'] : [ds.hero, ds.btnEdge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {xmas ? (
                  <Svg pointerEvents="none" width={90} height={120} viewBox="0 0 40 100" style={{ position: 'absolute', right: 6, bottom: -10, opacity: 0.35 }}>
                    <Polygon points="20,0 38,30 30,100 10,100 2,30" fill="#A78BFA" />
                    <Polygon points="20,0 38,30 20,100" fill="#FFFFFF" opacity={0.25} />
                  </Svg>
                ) : (
                  <View style={s.heroGlow} />
                )}
                <View style={s.scoreRow}>
                  <ScoreRing score={assessmentData.overallMasteryScore} xmas={xmas} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.heroKicker}>Chỉ số thông thạo</Text>
                    <View style={[s.levelTag, xmas && { backgroundColor: 'rgba(167,139,250,0.25)', borderWidth: 1, borderColor: dk('#A5F3FC', 'border') }]}>
                      <Text style={s.levelTagText}>
                        {assessmentData.levelClassification}
                      </Text>
                    </View>
                    <Text style={s.heroSub}>
                      {assessmentData.completedLessonsCount} bài học ·{" "}
                      {assessmentData.vocabularyReviewedCount} từ đã ôn ·{" "}
                      {assessmentData.totalMistakesRecorded} lỗi ghi nhận
                    </Text>
                  </View>
                </View>
              </View>
            </Reveal>

            <Reveal delay={80}>
              <View style={[s.card, s.insightCard, xmas && { backgroundColor: 'rgba(30,27,75,0.92)', borderColor: 'rgba(167,139,250,0.55)' }]}>
                <View style={s.insightHead}>
                  {xmas ? (
                    /* Quả cầu pha lê AI đội mũ Noel */
                    <View style={{ width: 44, height: 44 }}>
                      <ExpoGradient colors={['#A5F3FC', '#22D3EE', '#7C3AED']} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      <View style={{ position: 'absolute', left: 10, top: 8, width: 10, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                      <SantaHat size={22} style={{ position: 'absolute', top: -12, right: -6, transform: [{ rotate: '20deg' }] }} />
                    </View>
                  ) : (
                    <View
                      style={[
                        s.statIcon,
                        { backgroundColor: ds.amberSoft, marginBottom: 0 },
                      ]}
                    >
                      <Lightbulb size={20} color={ds.amberText} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>Nhận xét từ AI</Text>
                    <Text style={s.cardSub}>Dựa trên lịch sử học của bạn</Text>
                  </View>
                </View>
                <Text style={s.insightText}>
                  {assessmentData.summaryInsight ||
                    "Đang cập nhật đánh giá học lực..."}
                </Text>
              </View>
            </Reveal>

            {progressData ? (
              <Reveal delay={140}>
                <Card
                  title="Bản đồ 5 kỹ năng"
                  style={xmas ? { backgroundColor: 'rgba(30,27,75,0.9)', borderColor: 'rgba(165,180,252,0.35)' } : undefined}
                  sub="Điểm thật từ bài làm của bạn"
                >
                  <View style={s.radarBox}>
                    <Svg height="220" width="240" viewBox="0 0 240 220">
                      <Defs>
                        <LinearGradient
                          id="radarFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor={xmas ? '#22D3EE' : ds.sky}
                            stopOpacity="0.45"
                          />
                          <Stop
                            offset="1"
                            stopColor={xmas ? '#A78BFA' : ds.btn}
                            stopOpacity={xmas ? '0.3' : '0.15'}
                          />
                        </LinearGradient>
                      </Defs>
                      <Polygon
                        points={getPentagonPoints(72)}
                        fill={xmas ? 'rgba(11,16,38,0.55)' : ds.bg}
                        stroke={xmas ? 'rgba(165,180,252,0.45)' : ds.line}
                        strokeWidth="1.5"
                        strokeDasharray={xmas ? '3,4' : undefined}
                      />
                      <Polygon
                        points={getPentagonPoints(50)}
                        fill="none"
                        stroke={ds.line}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <Polygon
                        points={getPentagonPoints(28)}
                        fill="none"
                        stroke={ds.line}
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                      {[0, 72, 144, 216, 288].map((deg, i) => {
                        const rad = (Math.PI / 180) * (deg - 90);
                        return (
                          <Line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={cx + maxR * Math.cos(rad)}
                            y2={cy + maxR * Math.sin(rad)}
                            stroke={ds.lineStrong}
                            strokeWidth="1"
                            strokeDasharray="2,3"
                          />
                        );
                      })}
                      <Polygon
                        points={userSkillPoints}
                        fill="url(#radarFill)"
                        stroke={xmas ? '#22D3EE' : ds.sky}
                        strokeWidth="2.5"
                      />
                      {userSkillRatios.map((ratio, i) => {
                        const angle = (Math.PI / 180) * (i * 72 - 90);
                        return (
                          <Circle
                            key={i}
                            cx={cx + maxR * ratio * Math.cos(angle)}
                            cy={cy + maxR * ratio * Math.sin(angle)}
                            r={xmas ? '5' : '4.5'}
                            fill={xmas ? '#FDE68A' : ds.white}
                            stroke={xmas ? 'rgba(253,230,138,0.35)' : ds.btn}
                            strokeWidth={xmas ? '6' : '2.5'}
                          />
                        );
                      })}
                    </Svg>
                    <Text
                      style={[s.radarLabel, { top: 0, alignSelf: "center" }]}
                    >
                      Từ vựng {radarScores.vocabulary}%
                    </Text>
                    <Text style={[s.radarLabel, { top: 78, right: 0 }]}>
                      Ngữ pháp {radarScores.grammar}%
                    </Text>
                    <Text style={[s.radarLabel, { top: 186, right: 56 }]}>
                      Nói {radarScores.speaking}%
                    </Text>
                    <Text style={[s.radarLabel, { top: 186, left: 64 }]}>
                      Đọc {radarScores.reading}%
                    </Text>
                    <Text style={[s.radarLabel, { top: 78, left: 0 }]}>
                      Nghe {radarScores.listening}%
                    </Text>
                  </View>

                  <View style={s.skillList}>
                    {skillData.map((item) => (
                      <View key={item.label} style={s.skillItem}>
                        <View style={s.skillHead}>
                          <View
                            style={[
                              s.skillDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={s.skillLabel}>{item.label}</Text>
                          <Text style={s.skillLevel}>{item.level}</Text>
                          <Text style={s.skillScore}>{item.score}%</Text>
                        </View>
                        <ProgressBar
                          value={(item.score || 0) / 100}
                          color={item.color}
                          height={8}
                        />
                      </View>
                    ))}
                  </View>
                </Card>
              </Reveal>
            ) : null}

            <Reveal delay={200}>
              <View style={[s.card, s.accentCard, { borderLeftColor: ds.red }]}>
                <View style={s.insightHead}>
                  <AlertCircle size={20} color={ds.red} />
                  <Text style={s.cardTitle}>Lỗ hổng cần khắc phục</Text>
                </View>
                {assessmentData.weaknesses.length === 0 &&
                (assessmentData.weakVocabulary?.length ?? 0) === 0 ? (
                  <Text style={s.muted}>
                    Chưa ghi nhận lỗi sai nào. Tiếp tục làm bài để AI phân tích
                    chính xác hơn.
                  </Text>
                ) : null}
                {assessmentData.weaknesses.map((w, idx) => (
                  <View key={w.id || idx} style={s.issue}>
                    <Text style={s.issueTitle}>
                      {w.ruleName}{" "}
                      <Text style={s.issueCat}>· {w.category}</Text>
                    </Text>
                    <Text style={s.issueDesc}>{w.description}</Text>
                    {w.correctiveRule ? (
                      <View style={s.ruleBox}>
                        <Text style={s.ruleText}>
                          Quy tắc: {w.correctiveRule}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
                {assessmentData.weakVocabulary &&
                assessmentData.weakVocabulary.length > 0 ? (
                  <View style={s.issue}>
                    <Text style={s.issueTitle}>Từ hay quên</Text>
                    <View style={s.wordChips}>
                      {assessmentData.weakVocabulary
                        .slice(0, 6)
                        .map((wv, i) => (
                          <View key={i} style={s.wordChip}>
                            <Text style={s.wordChipWord}>{wv.word}</Text>
                            <Text style={s.wordChipMeta}>
                              {wv.meaning} · quên {wv.lapsesCount} lần
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </Reveal>

            <Reveal delay={240}>
              <View
                style={[s.card, s.accentCard, { borderLeftColor: ds.green }]}
              >
                <View style={s.insightHead}>
                  <CheckCircle2 size={20} color={ds.green} />
                  <Text style={s.cardTitle}>Điểm mạnh đã làm chủ</Text>
                </View>
                {assessmentData.strengths.length === 0 ? (
                  <Text style={s.muted}>
                    Chưa đủ dữ liệu để xác định điểm mạnh.
                  </Text>
                ) : (
                  <View style={s.wordChips}>
                    {assessmentData.strengths.map((str, idx) => (
                      <View key={idx} style={s.strengthChip}>
                        <Check size={13} color={ds.greenText} />
                        <Text style={s.strengthText}>{str}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Reveal>

            {currentQuiz ? (
              <Reveal delay={280}>
                <Card
                  title="Luyện lại lỗi sai"
                  sub={`${currentQuiz.targetTopic} · câu ${activeQuizIndex + 1}/${remedialList.length} · đúng ${quizScore}`}
                  right={<Zap size={20} color={ds.amberDeep} />}
                >
                  <Text style={s.quizQ}>{currentQuiz.question}</Text>
                  <View style={{ gap: 8 }}>
                    {currentQuiz.options.map((opt, oIdx) => {
                      const isSelected = selectedOption === opt;
                      const correct = isCorrectOption(opt, currentQuiz);
                      const answered = selectedOption !== null;
                      return (
                        <Tap
                          key={oIdx}
                          onPress={() => handleSelectOption(opt)}
                          disabled={answered}
                          style={[
                            s.option,
                            answered && correct && s.optionCorrect,
                            answered && isSelected && !correct && s.optionWrong,
                          ]}
                          scaleTo={0.98}
                        >
                          <Text
                            style={[
                              s.optionText,
                              answered && correct && { color: ds.greenText },
                              answered &&
                                isSelected &&
                                !correct && { color: ds.redText },
                            ]}
                          >
                            {opt}
                          </Text>
                          {answered && correct ? (
                            <CheckCircle2 size={18} color={ds.green} />
                          ) : null}
                          {answered && isSelected && !correct ? (
                            <AlertCircle size={18} color={ds.red} />
                          ) : null}
                        </Tap>
                      );
                    })}
                  </View>
                  {showExplanation ? (
                    <View style={s.explain}>
                      <Text style={s.explainTitle}>Lời giải</Text>
                      <Text style={s.explainText}>
                        {currentQuiz.explanation}
                      </Text>
                      <Pressable onPress={handleNextQuiz} style={s.nextBtn}>
                        <Text style={s.nextBtnText}>
                          {activeQuizIndex < remedialList.length - 1
                            ? "Câu tiếp theo"
                            : "Luyện lại từ đầu"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Card>
              </Reveal>
            ) : null}
          </View>
        ) : null}
        {activeTab === "analytics" && !assessmentData ? (
          <View style={[s.card, { alignItems: "center", gap: 10 }]}>
            {assessmentFailed ? (
              <>
                <Text style={s.cardSub}>Chưa tải được đánh giá lịch sử học.</Text>
                <Pressable onPress={onRefresh} style={s.retryBtn}>
                  <Text style={s.retryText}>Thử lại</Text>
                </Pressable>
              </>
            ) : (
              <FoxRunLoader message="AI đang phân tích lịch sử học của bạn..." size={56} />
            )}
          </View>
        ) : null}

        {/* ═══════════ TAB 3: XẾP HẠNG ═══════════ */}
        {activeTab === "ranking" && leaderboardData ? (
          <View style={s.stack}>
            <View style={s.subTabs}>
              {(["global", "friends"] as const).map((key) => {
                const active = rankingSubTab === key;
                const Icon = key === "global" ? Globe : Users;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleSwitchRankingSubTab(key)}
                    style={[s.subTab, active && s.subTabActive]}
                  >
                    <Icon size={15} color={active ? ds.ink : ds.muted} />
                    <Text style={[s.subTabText, active && s.subTabTextActive]}>
                      {key === "global" ? "Toàn hệ thống" : "Bạn bè"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Reveal>
              <View style={[s.hero, s.leagueHero]}>
                <ExpoLinearGradient
                  colors={[ds.hero, ds.btnEdge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.heroGlow} />
                <View style={s.leagueIcon}>
                  <Trophy size={26} color={ds.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroKicker}>
                    Tuần thi đấu #{leaderboardData.weekNumber}
                  </Text>
                  <Text style={s.leagueName} numberOfLines={2}>
                    {leaderboardData.leagueName}
                  </Text>
                </View>
                <View style={s.myRankBox}>
                  <Text style={s.myRankValue}>
                    {leaderboardData.userRank > 0
                      ? `#${leaderboardData.userRank}`
                      : "–"}
                  </Text>
                  <Text style={s.myRankLabel}>Hạng của bạn</Text>
                </View>
              </View>
            </Reveal>

            {rankList.length === 0 ? (
              <View style={[s.card, s.emptyBox]}>
                <AnimatedFoxMascot size={110} />
                <Text style={s.stateTitle}>Bảng xếp hạng còn trống</Text>
                <Text style={s.stateHint}>
                  {rankingSubTab === "friends"
                    ? "Kết bạn để cùng thi đua mỗi tuần."
                    : "Hãy là người đầu tiên ghi điểm tuần này!"}
                </Text>
              </View>
            ) : (
              <>
                <Reveal delay={80}>
                  <View style={[s.card, s.podiumCard, xmas && glassCard('rgba(251,191,36,0.35)')]}>
                    <Text style={s.cardTitle}>Vinh danh tuần này</Text>
                    <View style={s.podiumRow}>
                      <PodiumCol
                        member={top2}
                        xmas={xmas}
                        place={1}
                        height={74}
                        delay={200}
                      />
                      <PodiumCol
                        member={top1}
                        xmas={xmas}
                        place={0}
                        height={104}
                        delay={0}
                      />
                      <PodiumCol
                        member={top3}
                        xmas={xmas}
                        place={2}
                        height={56}
                        delay={350}
                      />
                    </View>
                  </View>
                </Reveal>

                {restRankList.length > 0 ? (
                  <Reveal delay={140}>
                    <View style={[s.card, { paddingVertical: 6 }]}>
                      {/* Tối đa 10 người nên render trực tiếp trong ScrollView, không cần FlatList lồng */}
                      {restRankList.map((member) => (
                        <RankRow key={member.userId} member={member} />
                      ))}
                    </View>
                  </Reveal>
                ) : null}
              </>
            )}

            <View style={s.posCard}>
              <View style={s.posRank}>
                <Text style={s.posRankText}>
                  {leaderboardData.userRank > 0
                    ? `#${leaderboardData.userRank}`
                    : "–"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.posTitle}>
                  {leaderboardData.userRank > 0
                    ? `Bạn đang hạng ${leaderboardData.userRank}`
                    : "Bạn chưa có hạng"}
                </Text>
                <Text style={s.posSub}>
                  {leaderboardData.userWeeklyXp.toLocaleString("vi-VN")} XP tuần
                  này · học thêm để thăng hạng
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(student)/learn",
                    params: { tab: "quiz" },
                  } as never)
                }
                style={s.posBtn}
              >
                <Text style={s.posBtnText}>Luyện tập</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const CARD_EDGE = {
  backgroundColor: ds.card,
  borderRadius: dsRadius.lg,
  borderWidth: 1.5,
  borderColor: ds.line,
  borderBottomWidth: 4,
} as const;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: ds.bg,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: ds.card,
    borderRadius: dsRadius.full,
    padding: 4,
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: dsRadius.full,
  },
  tabActive: { backgroundColor: ds.hero },
  tabText: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.sm,
    color: ds.muted,
  },
  tabTextActive: { color: ds.white },

  content: { paddingHorizontal: 20, paddingTop: 4 },
  stack: { gap: 14 },

  // Thẻ nổi bật nền navy
  hero: {
    borderRadius: dsRadius.xl,
    padding: 18,
    overflow: "hidden",
    gap: 16,
    ...dsShadow.lift,
  },
  heroGlow: {
    position: "absolute",
    right: -50,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: ds.onInkFaint,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  flameBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: ds.onInkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBig: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.display,
    color: ds.white,
    lineHeight: 44,
  },
  heroUnit: {
    fontFamily: dsFont.display,
    fontSize: dsSize.md,
    color: ds.onInk,
  },
  heroSub: {
    fontFamily: dsFont.body,
    fontSize: dsSize.xs,
    color: ds.onInk,
    lineHeight: 18,
  },
  heroKicker: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.xs,
    color: ds.skyLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekItem: { alignItems: "center", gap: 6 },
  weekLabel: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.xs,
    color: ds.onInk,
  },
  weekDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: ds.onInkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDotDone: { backgroundColor: ds.amber },
  weekDotToday: { borderWidth: 2, borderColor: ds.white },
  heroGoal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ds.onInkFaint,
    borderRadius: dsRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroGoalText: {
    flex: 1,
    fontFamily: dsFont.medium,
    fontSize: dsSize.xs,
    color: ds.white,
  },

  // Ô chỉ số
  grid: { flexDirection: "row", gap: 12 },
  statTile: { flex: 1, padding: 14, ...CARD_EDGE },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.xl,
    color: ds.ink,
  },
  statLabel: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.sm,
    color: ds.ink,
    marginTop: 2,
  },
  statHint: {
    fontFamily: dsFont.body,
    fontSize: dsSize.xs,
    color: ds.muted,
    marginTop: 2,
  },

  // Thẻ chung
  card: { padding: 16, ...CARD_EDGE },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink },
  cardSub: {
    fontFamily: dsFont.body,
    fontSize: dsSize.xs,
    color: ds.muted,
    marginTop: 2,
  },
  pill: {
    backgroundColor: ds.skySoft,
    borderRadius: dsRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.btn },
  muted: {
    fontFamily: dsFont.body,
    fontSize: dsSize.sm,
    color: ds.muted,
    lineHeight: 20,
  },

  // Biểu đồ cột
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 150,
  },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barValue: {
    fontFamily: dsFont.bold,
    fontSize: 10,
    color: ds.muted,
    height: 14,
  },
  barTrack: {
    width: 22,
    height: 100,
    borderRadius: 8,
    backgroundColor: ds.bg,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 8 },
  barDay: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.muted },
  barDayToday: { color: ds.btn, fontFamily: dsFont.bold },

  // Đánh giá
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ringValue: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.xxl,
    color: ds.white,
    lineHeight: 34,
  },
  ringMax: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.onInk },
  levelTag: {
    alignSelf: "flex-start",
    backgroundColor: ds.amber,
    borderRadius: dsRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelTagText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  insightCard: { gap: 12, borderBottomColor: ds.amber },
  insightHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  insightText: {
    fontFamily: dsFont.body,
    fontSize: dsSize.sm,
    color: ds.inkSoft,
    lineHeight: 21,
  },
  radarBox: {
    alignSelf: "center",
    width: 280,
    height: 212,
    alignItems: "center",
    justifyContent: "center",
  },
  radarLabel: {
    position: "absolute",
    fontFamily: dsFont.semibold,
    fontSize: 11,
    color: ds.inkSoft,
  },
  skillList: { gap: 12, marginTop: 8 },
  skillItem: { gap: 6 },
  skillHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  skillDot: { width: 10, height: 10, borderRadius: 5 },
  skillLabel: {
    flex: 1,
    fontFamily: dsFont.semibold,
    fontSize: dsSize.sm,
    color: ds.ink,
  },
  skillLevel: {
    fontFamily: dsFont.medium,
    fontSize: dsSize.xs,
    color: ds.muted,
  },
  skillScore: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.ink,
    minWidth: 38,
    textAlign: "right",
  },
  accentCard: { borderLeftWidth: 4, gap: 10 },
  issue: { gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: ds.line },
  issueTitle: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  issueCat: { fontFamily: dsFont.medium, color: ds.muted },
  issueDesc: {
    fontFamily: dsFont.body,
    fontSize: dsSize.sm,
    color: ds.inkSoft,
    lineHeight: 20,
  },
  ruleBox: {
    backgroundColor: ds.bg,
    borderRadius: dsRadius.sm,
    padding: 10,
    marginTop: 4,
  },
  ruleText: {
    fontFamily: dsFont.medium,
    fontSize: dsSize.xs,
    color: ds.ink,
    lineHeight: 18,
  },
  wordChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  wordChip: {
    backgroundColor: ds.redSoft,
    borderRadius: dsRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipWord: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.redText,
  },
  wordChipMeta: { fontFamily: dsFont.body, fontSize: 11, color: ds.inkSoft },
  strengthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ds.greenSoft,
    borderRadius: dsRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  strengthText: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.xs,
    color: ds.greenText,
  },
  quizQ: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.base,
    color: ds.ink,
    lineHeight: 22,
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 13,
    borderRadius: dsRadius.md,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: ds.bg,
  },
  optionCorrect: { borderColor: ds.green, backgroundColor: ds.greenSoft },
  optionWrong: { borderColor: ds.red, backgroundColor: ds.redSoft },
  optionText: {
    flex: 1,
    fontFamily: dsFont.medium,
    fontSize: dsSize.sm,
    color: ds.ink,
  },
  explain: {
    marginTop: 12,
    padding: 12,
    borderRadius: dsRadius.md,
    backgroundColor: ds.skySoft,
    gap: 6,
  },
  explainTitle: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.btn },
  explainText: {
    fontFamily: dsFont.body,
    fontSize: dsSize.sm,
    color: ds.inkSoft,
    lineHeight: 20,
  },
  nextBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: ds.btn,
    borderRadius: dsRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextBtnText: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.white,
  },

  // Xếp hạng
  subTabs: { flexDirection: "row", gap: 8 },
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: dsRadius.full,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: ds.card,
  },
  subTabActive: { backgroundColor: ds.amberSoft, borderColor: ds.amber },
  subTabText: {
    fontFamily: dsFont.semibold,
    fontSize: dsSize.sm,
    color: ds.muted,
  },
  subTabTextActive: { color: ds.ink },
  leagueHero: { flexDirection: "row", alignItems: "center", gap: 14 },
  leagueIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: ds.onInkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueName: {
    fontFamily: dsFont.display,
    fontSize: dsSize.base,
    color: ds.white,
    marginTop: 2,
    lineHeight: 21,
  },
  myRankBox: {
    alignItems: "center",
    backgroundColor: ds.onInkFaint,
    borderRadius: dsRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myRankValue: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.lg,
    color: ds.amber,
  },
  myRankLabel: { fontFamily: dsFont.medium, fontSize: 10, color: ds.onInk },
  podiumCard: { gap: 6 },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  podiumCol: { flex: 1, alignItems: "center" },
  podiumAvatarRing: {
    borderWidth: 3,
    borderRadius: 999,
    padding: 2,
    backgroundColor: ds.card,
  },
  podiumAvatarRingBig: { borderWidth: 4 },
  podiumName: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.xs,
    color: ds.ink,
    marginTop: 6,
    maxWidth: "100%",
  },
  podiumXp: {
    fontFamily: dsFont.medium,
    fontSize: 11,
    color: ds.muted,
    marginBottom: 6,
  },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "hidden",
  },
  podiumPlace: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.lg,
    color: ds.white,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: dsRadius.md,
  },
  rankRowMe: { backgroundColor: ds.skySoft, paddingHorizontal: 10 },
  rankNum: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: ds.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumText: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.muted,
  },
  rankAvatar: { borderWidth: 2, borderColor: ds.line },
  rankNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rankName: {
    flexShrink: 1,
    fontFamily: dsFont.bold,
    fontSize: dsSize.sm,
    color: ds.ink,
  },
  rankXp: {
    fontFamily: dsFont.body,
    fontSize: dsSize.xs,
    color: ds.muted,
    marginTop: 2,
  },
  meTag: {
    backgroundColor: ds.btn,
    borderRadius: dsRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  meTagText: { fontFamily: dsFont.bold, fontSize: 10, color: ds.white },
  trend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: dsRadius.full,
    backgroundColor: ds.bg,
  },
  trendText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.muted },
  posCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    ...CARD_EDGE,
    borderColor: ds.sky,
    borderBottomColor: ds.btn,
  },
  posRank: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ds.skySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  posRankText: {
    fontFamily: dsFont.displayHeavy,
    fontSize: dsSize.base,
    color: ds.btn,
  },
  posTitle: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink },
  posSub: {
    fontFamily: dsFont.body,
    fontSize: dsSize.xs,
    color: ds.muted,
    marginTop: 2,
  },
  posBtn: {
    backgroundColor: ds.btn,
    borderRadius: dsRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  posBtnText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.white },

  // Trạng thái
  stateBox: { alignItems: "center", gap: 8, paddingVertical: 48 },
  emptyBox: { alignItems: "center", gap: 6, paddingVertical: 24 },
  stateTitle: {
    fontFamily: dsFont.display,
    fontSize: dsSize.md,
    color: ds.ink,
    textAlign: "center",
  },
  stateHint: {
    fontFamily: dsFont.body,
    fontSize: dsSize.sm,
    color: ds.muted,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: ds.btn,
    borderRadius: dsRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
});
