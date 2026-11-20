import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Svg, {
  Polygon,
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

type TabKey = "progress" | "analytics" | "ranking";

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
const MEDAL_SOFT = [ds.amberSoft, ds.line, ds.redSoft] as const;

// ───── Cột biểu đồ 7 ngày: mọc lên bằng lò xo ─────
const WeekBar: React.FC<{
  pct: number;
  minutes: number;
  label: string;
  isToday: boolean;
  index: number;
}> = ({ pct, minutes, label, isToday, index }) => {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(
      index * 60,
      withSpring(pct, { damping: 14, stiffness: 120 }),
    );
  }, [h, index, pct]);
  const barStyle = useAnimatedStyle(() => ({ height: `${h.value}%` }));
  return (
    <View style={s.barCol}>
      <Text style={[s.barValue, isToday && { color: ds.btn }]}>
        {minutes > 0 ? `${minutes}p` : ""}
      </Text>
      <View style={s.barTrack}>
        <Animated.View
          style={[
            s.barFill,
            { backgroundColor: isToday ? ds.btn : ds.skyLight },
            barStyle,
          ]}
        />
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
}> = ({ icon: Icon, tint, tone, value, label, hint }) => (
  <View style={s.statTile}>
    <View style={[s.statIcon, { backgroundColor: tone }]}>
      <Icon size={20} color={tint} />
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
}> = ({ title, sub, right, children, style }) => (
  <View style={[s.card, style]}>
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
const ScoreRing: React.FC<{ score: number; size?: number }> = ({
  score,
  size = 96,
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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ds.onInkFaint}
          strokeWidth={stroke}
          fill="none"
        />
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ds.amber}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <Text style={s.ringValue}>{score}</Text>
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
}> = ({ member, place, height, delay }) => {
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
  return (
    <View style={s.podiumCol}>
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
          { borderColor: MEDAL[place] },
          big && s.podiumAvatarRingBig,
        ]}
      >
        <UserAvatar uri={member.avatarUrl} size={big ? 56 : 46} />
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
        style={[s.podiumBar, { backgroundColor: MEDAL[place] }, barStyle]}
      >
        <Medal size={16} color={place === 1 ? ds.ink : ds.white} />
        <Text style={[s.podiumPlace, place === 1 && { color: ds.ink }]}>
          {place + 1}
        </Text>
      </Animated.View>
    </View>
  );
};

export const AnalyticsScreen = () => {
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
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);

  // Bài luyện lỗi sai tương tác
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const uid = currentUser?.id ? String(currentUser.id) : undefined;
      const [prog, assess, lb] = await Promise.all([
        fetchProgressStatsApi(uid),
        fetchAiAssessmentApi(uid),
        fetchLeaderboardApi(rankingSubTab, uid),
      ]);
      setProgressData(prog);
      setAssessmentData(assess);
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
    <View style={s.root}>
      {/* Thanh chuyển tab dạng pill */}
      <View style={[s.header, { paddingTop: safeTop }]}>
        <Text style={dsText.h1}>Thống kê</Text>
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
                  colors={[ds.ink, ds.btnEdge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.heroGlow} />
                <View style={s.heroTop}>
                  <View style={s.flameBox}>
                    <Flame size={30} color={ds.amber} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heroBig}>
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
                  {progressData.weeklyChart.map((item, idx) => {
                    const done = item.minutes > 0;
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
                          ]}
                        >
                          {done ? <Check size={14} color={ds.ink} /> : null}
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
                  hint={`Tổng ${progressData.totalWordsLearned} từ SRS`}
                />
                <StatTile
                  icon={Target}
                  tint={ds.amberText}
                  tone={ds.amberSoft}
                  value={`${progressData.quizAccuracyPct}%`}
                  label="Độ chính xác"
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
                  hint={`Tuần này ${progressData.weeklyMinutes} phút`}
                />
                <StatTile
                  icon={Zap}
                  tint={ds.green}
                  tone={ds.greenSoft}
                  value={`${progressData.avgResponseTimeSec}s`}
                  label="Tốc độ phản xạ"
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
        {activeTab === "analytics" && assessmentData ? (
          <View style={s.stack}>
            <Reveal>
              <View style={s.hero}>
                <ExpoLinearGradient
                  colors={[ds.ink, ds.btnEdge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.heroGlow} />
                <View style={s.scoreRow}>
                  <ScoreRing score={assessmentData.overallMasteryScore} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.heroKicker}>Chỉ số thông thạo</Text>
                    <View style={s.levelTag}>
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
              <View style={[s.card, s.insightCard]}>
                <View style={s.insightHead}>
                  <View
                    style={[
                      s.statIcon,
                      { backgroundColor: ds.amberSoft, marginBottom: 0 },
                    ]}
                  >
                    <Lightbulb size={20} color={ds.amberText} />
                  </View>
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
                            stopColor={ds.sky}
                            stopOpacity="0.45"
                          />
                          <Stop
                            offset="1"
                            stopColor={ds.btn}
                            stopOpacity="0.15"
                          />
                        </LinearGradient>
                      </Defs>
                      <Polygon
                        points={getPentagonPoints(72)}
                        fill={ds.bg}
                        stroke={ds.line}
                        strokeWidth="1.5"
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
                        stroke={ds.sky}
                        strokeWidth="2.5"
                      />
                      {userSkillRatios.map((ratio, i) => {
                        const angle = (Math.PI / 180) * (i * 72 - 90);
                        return (
                          <Circle
                            key={i}
                            cx={cx + maxR * ratio * Math.cos(angle)}
                            cy={cy + maxR * ratio * Math.sin(angle)}
                            r="4.5"
                            fill={ds.white}
                            stroke={ds.btn}
                            strokeWidth="2.5"
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
                  colors={[ds.ink, ds.btnEdge]}
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
                  <View style={[s.card, s.podiumCard]}>
                    <Text style={s.cardTitle}>Vinh danh tuần này</Text>
                    <View style={s.podiumRow}>
                      <PodiumCol
                        member={top2}
                        place={1}
                        height={74}
                        delay={200}
                      />
                      <PodiumCol
                        member={top1}
                        place={0}
                        height={104}
                        delay={0}
                      />
                      <PodiumCol
                        member={top3}
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
  tabActive: { backgroundColor: ds.ink },
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
