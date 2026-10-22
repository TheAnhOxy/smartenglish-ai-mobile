import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Flame,
  Zap,
  Clock,
  BookOpen,
  TrendingUp,
  Trophy,
  Medal,
  ChevronUp,
  ChevronDown,
  Crown,
  Sparkles,
  Lightbulb,
  Check,
  ChevronRight,
  ArrowRight,
  Award,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Compass,
  Users,
  Globe,
  RotateCcw,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Polygon, Line, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  fetchProgressStatsApi,
  fetchAiAssessmentApi,
  fetchLeaderboardApi,
  StudentProgressData,
  StudentAssessmentData,
  LeaderboardData,
  RemedialQuiz,
} from '../../data/analyticsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Subcomponent for Animated Chart Bar (7-day time distribution)
interface ChartBarItemProps {
  item: { dayLabel: string; minutes: number; isToday: boolean };
  idx: number;
  barHeight: SharedValue<number>;
}

const ChartBarItem: React.FC<ChartBarItemProps> = ({ item, idx, barHeight }) => {
  const animStyle = useAnimatedStyle(() => ({
    height: `${barHeight.value}%`,
  }));

  return (
    <View style={s.chartCol}>
      {item.isToday && (
        <View style={s.todayTooltip}>
          <Text style={s.todayTooltipText}>{item.minutes}p</Text>
        </View>
      )}
      <View style={s.chartBarTrack}>
        <Animated.View
          style={[
            s.chartBarFill,
            animStyle,
            { backgroundColor: item.isToday ? colors.secondary : palette.border },
          ]}
        />
      </View>
      <Text style={[s.chartDay, item.isToday && s.chartDayActive]}>{item.dayLabel}</Text>
    </View>
  );
};

export const AnalyticsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'progress' | 'analytics' | 'ranking'>('progress');
  const [rankingSubTab, setRankingSubTab] = useState<'global' | 'friends'>('global');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real backend data states
  const [progressData, setProgressData] = useState<StudentProgressData | null>(null);
  const [assessmentData, setAssessmentData] = useState<StudentAssessmentData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);

  // Interactive Remedial Practice state
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Animated progress bars for skills
  const vocabWidth = useSharedValue(0);
  const grammarWidth = useSharedValue(0);
  const speakingWidth = useSharedValue(0);
  const listeningWidth = useSharedValue(0);
  const readingWidth = useSharedValue(0);

  // Animated bar heights for 7-day chart
  const barHeights = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

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

      // Animate Skill bars
      const skills = prog.skillRadarScores;
      vocabWidth.value = withTiming(skills.vocabulary || 10, { duration: 800 });
      grammarWidth.value = withTiming(skills.grammar || 10, { duration: 900 });
      speakingWidth.value = withTiming(skills.speaking || 10, { duration: 1000 });
      listeningWidth.value = withTiming(skills.listening || 10, { duration: 1100 });
      readingWidth.value = withTiming(skills.reading || 10, { duration: 1200 });

      // Animate 7-day Chart bars
      const maxMins = Math.max(1, ...(prog.weeklyChart?.map((d) => d.minutes) || [1]));
      prog.weeklyChart?.forEach((item, idx) => {
        if (idx < 7) {
          const pct = Math.max(8, Math.min(100, Math.round((item.minutes / maxMins) * 90)));
          barHeights[idx].value = withSpring(pct, { damping: 12, stiffness: 90 });
        }
      });
    } catch (err) {
      console.error('[AnalyticsScreen] Load data failed:', err);
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

  const vocabStyle = useAnimatedStyle(() => ({ width: `${vocabWidth.value}%` }));
  const grammarStyle = useAnimatedStyle(() => ({ width: `${grammarWidth.value}%` }));
  const speakingStyle = useAnimatedStyle(() => ({ width: `${speakingWidth.value}%` }));
  const listeningStyle = useAnimatedStyle(() => ({ width: `${listeningWidth.value}%` }));
  const readingStyle = useAnimatedStyle(() => ({ width: `${readingWidth.value}%` }));

  // Radar Pentagon Points Calculation (dynamic based on real scores)
  const cx = 110;
  const cy = 105;
  const maxR = 68;

  const getPentagonPoints = (r: number) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 180) * (i * 72 - 90);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  const radarScores = progressData?.skillRadarScores || {
    vocabulary: 0,
    grammar: 0,
    speaking: 0,
    reading: 0,
    listening: 0,
  };

  // Convert 0-100 score to 0.1 - 1.0 ratio
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
      const x = cx + maxR * ratio * Math.cos(angle);
      const y = cy + maxR * ratio * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const getSkillLevelStr = (score: number) => {
    if (score >= 80) return 'B2 Cao cấp';
    if (score >= 60) return 'B1 Khá';
    if (score >= 40) return 'A2 Trung bình';
    return 'A1 Khởi đầu';
  };

  const skillData = [
    {
      label: 'Từ Vựng',
      score: radarScores.vocabulary,
      level: getSkillLevelStr(radarScores.vocabulary),
      animStyle: vocabStyle,
      color: '#0EA5E9',
    },
    {
      label: 'Ngữ Pháp',
      score: radarScores.grammar,
      level: getSkillLevelStr(radarScores.grammar),
      animStyle: grammarStyle,
      color: '#2563A8',
    },
    {
      label: 'Phát Âm & Nói',
      score: radarScores.speaking,
      level: getSkillLevelStr(radarScores.speaking),
      animStyle: speakingStyle,
      color: '#059669',
    },
    {
      label: 'Nghe Hiểu',
      score: radarScores.listening,
      level: getSkillLevelStr(radarScores.listening),
      animStyle: listeningStyle,
      color: '#7C3AED',
    },
    {
      label: 'Đọc Hiểu',
      score: radarScores.reading,
      level: getSkillLevelStr(radarScores.reading),
      animStyle: readingStyle,
      color: '#D97706',
    },
  ];

  const safeTop = (insets.top || 16) + 8;

  // Active remedial quiz handling
  const remedialList = assessmentData?.remedialQuizzes || [];
  const currentQuiz: RemedialQuiz | undefined = remedialList[activeQuizIndex];

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return; // Prevent changing after selection
    setSelectedOption(opt);
    setShowExplanation(true);
    if (currentQuiz && opt.trim().toLowerCase().startsWith(currentQuiz.correctAnswer.trim().toLowerCase()) ||
        (currentQuiz && opt.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase())) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (activeQuizIndex < remedialList.length - 1) {
      setActiveQuizIndex((prev) => prev + 1);
    } else {
      setActiveQuizIndex(0); // restart or loop
    }
  };

  // Leaderboard data
  const rankList = leaderboardData?.rankList || [];
  const top1 = rankList[0];
  const top2 = rankList[1];
  const top3 = rankList[2];
  const restRankList = rankList.slice(3);

  return (
    <View style={s.root}>
      {/* Header Bar */}
      <View style={[s.header, { paddingTop: safeTop }]}>
        {/* Segment Switcher Bar */}
        <View style={s.switcherRow}>
          <Pressable
            onPress={() => setActiveTab('progress')}
            style={[s.switcherBtn, activeTab === 'progress' && s.switcherBtnActive]}
          >
            <TrendingUp color={activeTab === 'progress' ? '#FFFFFF' : palette.textSoft} size={15} />
            <Text style={[s.switcherText, activeTab === 'progress' && s.switcherTextActive]}>
              Tiến Độ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('analytics')}
            style={[s.switcherBtn, activeTab === 'analytics' && s.switcherBtnActive]}
          >
            <Sparkles color={activeTab === 'analytics' ? '#FFFFFF' : palette.textSoft} size={15} />
            <Text style={[s.switcherText, activeTab === 'analytics' && s.switcherTextActive]}>
              Đánh Giá
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('ranking')}
            style={[s.switcherBtn, activeTab === 'ranking' && s.switcherBtnActive]}
          >
            <Trophy color={activeTab === 'ranking' ? '#FFFFFF' : palette.textSoft} size={15} />
            <Text style={[s.switcherText, activeTab === 'ranking' && s.switcherTextActive]}>
              Xếp Hạng
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />}
      >
        {isLoading && !progressData ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={{ marginTop: 12, color: palette.textSoft, fontFamily: font.family }}>
              Đang tải dữ liệu học tập thực tế...
            </Text>
          </View>
        ) : null}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: TIẾN ĐỘ HỌC TẬP (PROGRESS) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'progress' && progressData && (
          <View>
            {/* Header Lựa Chọn Thời Gian */}
            <Animated.View entering={FadeInDown.delay(50)} style={s.progressSectionHeader}>
              <View style={s.progressSectionTitleWrap}>
                <BarChart3 color={palette.primary} size={18} />
                <Text style={s.progressSectionTitle}>Chỉ số học tập thực tế</Text>
              </View>

              <View style={s.filterDropdownBtn}>
                <Text style={s.filterDropdownText}>Tuần này</Text>
              </View>
            </Animated.View>

            {/* Streak Card Rực Rỡ với Gradient Cam Lửa */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.streakWrapper}>
              <ExpoLinearGradient
                colors={['#FF7A45', '#E8592A', '#C2410C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.streakGradient}
              >
                <View style={s.streakTopLine}>
                  <View style={s.streakFlameCircle}>
                    <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
                  </View>
                  <View style={s.streakHeaderRight}>
                    <Text style={s.streakMainTitle}>
                      {progressData.streakDays > 0
                        ? `${progressData.streakDays} ngày liên tiếp!`
                        : 'Bắt đầu chuỗi ngày học!'}
                    </Text>
                    <Text style={s.streakSubTitle}>
                      {progressData.streakDays > 0
                        ? 'Duy trì học mỗi ngày để giữ vững chuỗi phong độ 🔥'
                        : 'Học bài mỗi ngày để thắp sáng chuỗi lửa đầu tiên! 🔥'}
                    </Text>
                  </View>
                </View>

                {/* 7 Days Row */}
                <View style={s.streakDaysRow}>
                  {progressData.weeklyChart.map((item, idx) => {
                    const isChecked = item.minutes > 0;
                    return (
                      <View key={idx} style={s.streakDayItem}>
                        <Text style={[s.streakDayLabel, item.isToday && s.streakDayLabelToday]}>
                          {item.dayLabel}
                        </Text>
                        <View
                          style={[
                            s.streakCheckSquare,
                            isChecked && s.streakCheckSquareActive,
                            item.isToday && s.streakCheckSquareToday,
                          ]}
                        >
                          {isChecked ? (
                            <Check color="#FFFFFF" size={13} strokeWidth={3} />
                          ) : (
                            <View style={s.streakUncheckedDot} />
                          )}
                        </View>
                        {item.isToday && <View style={s.todayDotIndicator} />}
                      </View>
                    );
                  })}
                </View>

                {/* Milestone Next Goal */}
                <View style={s.streakNextGoalRow}>
                  <Award color="#FFE7DB" size={14} />
                  <Text style={s.streakNextGoalText}>
                    {progressData.streakDays > 0
                      ? `Đã tích lũy ${progressData.streakDays} ngày học. Mục tiêu kế tiếp: ${progressData.streakDays + 3} ngày 🏅`
                      : 'Hoàn thành 1 bài học hôm nay để kích hoạt chuỗi Streak!'}
                  </Text>
                </View>
              </ExpoLinearGradient>
            </Animated.View>

            {/* 4 Thẻ Chỉ Số Nhanh (Grid 2x2) */}
            <Animated.View entering={FadeInDown.delay(180)} style={s.statsGrid}>
              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <BookOpen color="#0284C7" size={18} />
                </View>
                <Text style={s.statVal}>{progressData.masteredWords}</Text>
                <Text style={s.statLabel}>Từ đã thành thạo</Text>
                <Text style={s.statTrendGreen}>Tổng {progressData.totalWordsLearned} từ SRS</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Target color="#D97706" size={18} />
                </View>
                <Text style={s.statVal}>{progressData.quizAccuracyPct}%</Text>
                <Text style={s.statLabel}>Độ chính xác Quiz</Text>
                <Text style={s.statTrendGreen}>{progressData.totalQuizCount} bài đã giải</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Clock color="#7C3AED" size={18} />
                </View>
                <Text style={s.statVal}>
                  {(progressData.totalStudyMinutes / 60).toFixed(1)}h
                </Text>
                <Text style={s.statLabel}>Thời gian học</Text>
                <Text style={s.statTrendNeutral}>Tuần này: {progressData.weeklyMinutes} phút</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Zap color="#16A34A" size={18} fill="#16A34A" />
                </View>
                <Text style={s.statVal}>{progressData.avgResponseTimeSec}s</Text>
                <Text style={s.statLabel}>Tốc độ phản xạ</Text>
                <Text style={s.statTrendGreen}>
                  {progressData.avgResponseTimeSec > 0 ? 'Thời gian trả lời TB' : 'Chưa có lượt thi'}
                </Text>
              </View>
            </Animated.View>

            {/* BIỂU ĐỒ 1: RADAR PENTAGON (MẠNG NHỆN 5 KỸ NĂNG) */}
            <Animated.View entering={FadeInDown.delay(260)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <View>
                  <Text style={s.cardTitleBig}>Biểu đồ mạng nhện kỹ năng</Text>
                  <Text style={s.cardSub}>Đánh giá thực tế 5 trụ cột ngôn ngữ</Text>
                </View>
                <View style={s.pillBadge}>
                  <Text style={s.pillBadgeText}>Dữ liệu thật</Text>
                </View>
              </View>

              <View style={s.radarContainer}>
                {/* Labels around Pentagon */}
                <Text style={[s.radarLabel, s.radarLabelTop]}>
                  Từ vựng ({radarScores.vocabulary}%)
                </Text>
                <Text style={[s.radarLabel, s.radarLabelRight]}>
                  Ngữ pháp ({radarScores.grammar}%)
                </Text>
                <Text style={[s.radarLabel, s.radarLabelBottomRight]}>
                  Nói ({radarScores.speaking}%)
                </Text>
                <Text style={[s.radarLabel, s.radarLabelBottomLeft]}>
                  Đọc ({radarScores.reading}%)
                </Text>
                <Text style={[s.radarLabel, s.radarLabelLeft]}>
                  Nghe ({radarScores.listening}%)
                </Text>

                <Svg height="210" width="220" viewBox="0 0 220 210">
                  <Defs>
                    <LinearGradient id="radarFillGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#00B0F0" stopOpacity="0.45" />
                      <Stop offset="1" stopColor="#1F4E79" stopOpacity="0.15" />
                    </LinearGradient>
                  </Defs>

                  {/* Concentric rings */}
                  <Polygon points={getPentagonPoints(68)} fill="none" stroke="#E2E8F0" strokeWidth="1.2" />
                  <Polygon points={getPentagonPoints(48)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                  <Polygon points={getPentagonPoints(28)} fill="none" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />

                  {/* Radial Axis Lines */}
                  {[0, 72, 144, 216, 288].map((deg, i) => {
                    const rad = (Math.PI / 180) * (deg - 90);
                    return (
                      <Line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + maxR * Math.cos(rad)}
                        y2={cy + maxR * Math.sin(rad)}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    );
                  })}

                  {/* Filled User Polygon */}
                  <Polygon
                    points={userSkillPoints}
                    fill="url(#radarFillGrad)"
                    stroke="#00B0F0"
                    strokeWidth="2.5"
                  />

                  {/* Vertex Dots */}
                  {userSkillRatios.map((ratio, i) => {
                    const angle = (Math.PI / 180) * (i * 72 - 90);
                    const x = cx + maxR * ratio * Math.cos(angle);
                    const y = cy + maxR * ratio * Math.sin(angle);
                    return <Circle key={i} cx={x} cy={y} r="4" fill="#1F4E79" stroke="#00B0F0" strokeWidth="2" />;
                  })}
                </Svg>
              </View>
            </Animated.View>

            {/* BIỂU ĐỒ 2: CEFR SKILL MASTERY BARS */}
            <Animated.View entering={FadeInDown.delay(320)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardTitleBig}>Chi tiết mức độ thành thạo</Text>
                <Compass color={palette.primary} size={18} />
              </View>

              <View style={s.skillBarsWrap}>
                {skillData.map((item) => (
                  <View key={item.label} style={s.masteryItem}>
                    <View style={s.masteryHeader}>
                      <Text style={s.masteryLabel}>{item.label}</Text>
                      <View style={s.masteryScoreRow}>
                        <Text style={[s.masteryLevel, { color: item.color }]}>{item.level}</Text>
                        <Text style={s.masteryScore}>{item.score}%</Text>
                      </View>
                    </View>
                    <View style={s.masteryTrack}>
                      <Animated.View
                        style={[s.masteryFill, item.animStyle, { backgroundColor: item.color }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* BIỂU ĐỒ 3: THỜI LƯỢNG HỌC 7 NGÀY (CỘT ĐỘNG) */}
            <Animated.View entering={FadeInDown.delay(380)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <View>
                  <Text style={s.cardTitleBig}>Phân bổ thời gian học 7 ngày</Text>
                  <Text style={s.cardSub}>Tổng tuần: {progressData.weeklyMinutes} phút</Text>
                </View>
                <View style={s.trendBadgeBlue}>
                  <Text style={s.trendBadgeBlueText}>{progressData.lessonsCompleted} bài hoàn thành</Text>
                </View>
              </View>

              <View style={s.chartRow}>
                {progressData.weeklyChart.map((item, idx) => (
                  <ChartBarItem
                    key={idx}
                    item={item}
                    idx={idx}
                    barHeight={barHeights[idx] || barHeights[0]}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ĐÁNH GIÁ NĂNG LỰC & GỢI Ý THÔNG MINH AI (ASSESSMENT) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && assessmentData && (
          <View>
            {/* Thẻ Điểm Năng Lực Tổng Quát */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.overviewScoreCard}>
              <ExpoLinearGradient
                colors={['#1F4E79', '#2563A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.overviewGradient}
              >
                <View style={s.overviewScoreLeft}>
                  <Text style={s.overviewScoreSub}>Chỉ số thông thạo AI Audit</Text>
                  <Text style={s.overviewScoreMain}>
                    {assessmentData.overallMasteryScore}
                    <Text style={s.overviewScoreMax}>/100</Text>
                  </Text>
                  <View style={s.overviewCefrBadge}>
                    <Text style={s.overviewCefrText}>{assessmentData.levelClassification}</Text>
                  </View>
                </View>

                <View style={s.overviewScoreRight}>
                  <Sparkles color="#FFE7DB" size={32} />
                  <Text style={s.overviewGrowth}>
                    {assessmentData.totalMistakesRecorded} lỗi sai đã ghi nhận
                  </Text>
                </View>
              </ExpoLinearGradient>
            </Animated.View>

            {/* GỢI Ý THÔNG MINH TỪ TRỢ LÝ AI DỰA TRÊN LỊCH SỬ BÀI HỌC */}
            <Animated.View entering={FadeInDown.delay(180)} style={s.tipCard}>
              <View style={s.tipCardHeaderRow}>
                <View style={s.tipIconBox}>
                  <Lightbulb color="#D97706" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipCardTitle}>Nhận xét từ AI Assistant</Text>
                  <Text style={s.tipCardSub}>
                    Audit dựa trên {assessmentData.completedLessonsCount} bài học & {assessmentData.vocabularyReviewedCount} từ vựng
                  </Text>
                </View>
              </View>

              <Text style={s.tipCardContent}>
                {assessmentData.summaryInsight || 'Đang cập nhật đánh giá học lực...'}
              </Text>
            </Animated.View>

            {/* MA TRẬN: LỖ HỔNG CẦN KHẮC PHỤC (WEAKNESSES) & ĐIỂM MẠNH (STRENGTHS) */}
            <Animated.View entering={FadeInDown.delay(260)} style={s.matrixContainer}>
              <Text style={s.matrixTitle}>Phân Tích Chi Tiết Lỗi Sai & Điểm Yếu</Text>

              {/* Box 1: Cần Cải Thiện */}
              <View style={s.matrixBoxWarning}>
                <View style={s.matrixBoxHeader}>
                  <AlertCircle color="#DC2626" size={18} />
                  <Text style={s.matrixWarningTitle}>LỖ HỔNG GHI NHẬN TỪ BÀI TẬP</Text>
                </View>

                {assessmentData.weaknesses.map((w, idx) => (
                  <View key={w.id || idx} style={s.pitfallItem}>
                    <Text style={s.pitfallHeader}>
                      {idx + 1}. {w.ruleName} ({w.category})
                    </Text>
                    <Text style={s.pitfallDesc}>{w.description}</Text>
                    {w.correctiveRule ? (
                      <View style={s.pitfallExample}>
                        <Text style={s.pitfallExampleText}>💡 Quy tắc: {w.correctiveRule}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}

                {/* Từ vựng SRS hay quên */}
                {assessmentData.weakVocabulary && assessmentData.weakVocabulary.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[s.pitfallHeader, { color: '#DC2626' }]}>
                      ⚠️ Từ vựng SRS có tỷ lệ quên cao:
                    </Text>
                    {assessmentData.weakVocabulary.slice(0, 4).map((wv, i) => (
                      <Text key={i} style={[s.pitfallDesc, { marginLeft: 8, marginTop: 2 }]}>
                        • <Text style={{ fontWeight: '700' }}>{wv.word}</Text>: {wv.meaning} (quên {wv.lapsesCount} lần)
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Box 2: Điểm Mạnh */}
              <View style={s.matrixBoxSuccess}>
                <View style={s.matrixBoxHeader}>
                  <CheckCircle2 color="#16A34A" size={18} />
                  <Text style={s.matrixSuccessTitle}>ĐIỂM MẠNH ĐÃ LÀM CHỦ</Text>
                </View>

                {assessmentData.strengths.map((str, idx) => (
                  <View key={idx} style={s.pitfallItem}>
                    <Text style={s.strengthHeader}>
                      {idx + 1}. {str}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* BÀI TẬP CỦNG CỐ AI TRỰC TIẾP (INTERACTIVE REMEDIAL PRACTICE) */}
            {currentQuiz && (
              <Animated.View entering={FadeInDown.delay(340)} style={s.remedialCard}>
                <View style={s.remedialHeaderRow}>
                  <View style={s.remedialBadge}>
                    <Zap color="#D97706" size={14} fill="#D97706" />
                    <Text style={s.remedialBadgeText}>
                      Luyện Tập Lỗi Sai ({activeQuizIndex + 1}/{remedialList.length})
                    </Text>
                  </View>
                  <Text style={s.remedialTopic}>{currentQuiz.targetTopic}</Text>
                </View>

                <Text style={s.remedialQuestion}>{currentQuiz.question}</Text>

                {/* Options list */}
                <View style={s.remedialOptionsWrap}>
                  {currentQuiz.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect =
                      opt.trim().toLowerCase().startsWith(currentQuiz.correctAnswer.trim().toLowerCase()) ||
                      opt.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase();

                    let optionBorder = palette.border;
                    let optionBg = palette.surface;
                    let textColor = palette.text;

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        optionBorder = '#16A34A';
                        optionBg = '#DCFCE7';
                        textColor = '#16A34A';
                      } else if (isSelected) {
                        optionBorder = '#DC2626';
                        optionBg = '#FEE2E2';
                        textColor = '#DC2626';
                      }
                    }

                    return (
                      <Pressable
                        key={oIdx}
                        onPress={() => handleSelectOption(opt)}
                        style={[
                          s.remedialOptionBtn,
                          { borderColor: optionBorder, backgroundColor: optionBg },
                        ]}
                      >
                        <Text style={[s.remedialOptionText, { color: textColor }]}>{opt}</Text>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 color="#16A34A" size={18} />
                        )}
                        {selectedOption !== null && isSelected && !isCorrect && (
                          <AlertCircle color="#DC2626" size={18} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Explanation */}
                {showExplanation && (
                  <View style={s.remedialExplainBox}>
                    <Text style={s.remedialExplainTitle}>💡 Lời giải chi tiết:</Text>
                    <Text style={s.remedialExplainText}>{currentQuiz.explanation}</Text>
                    <Pressable onPress={handleNextQuiz} style={s.remedialNextBtn}>
                      <Text style={s.remedialNextBtnText}>
                        {activeQuizIndex < remedialList.length - 1 ? 'Câu tiếp theo ➔' : 'Luyện lại từ đầu ↺'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: BẢNG XẾP HẠNG (LEADERBOARD) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ranking' && leaderboardData && (
          <View>
            {/* Sub-tab Switcher: Toàn Hệ Thống vs Bạn Bè */}
            <View style={s.subTabRow}>
              <Pressable
                onPress={() => setRankingSubTab('global')}
                style={[s.subTabBtn, rankingSubTab === 'global' && s.subTabBtnActive]}
              >
                <Globe color={rankingSubTab === 'global' ? '#FFFFFF' : palette.textSoft} size={14} />
                <Text style={[s.subTabBtnText, rankingSubTab === 'global' && s.subTabBtnTextActive]}>
                  Toàn hệ thống (Top 10)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRankingSubTab('friends')}
                style={[s.subTabBtn, rankingSubTab === 'friends' && s.subTabBtnActive]}
              >
                <Users color={rankingSubTab === 'friends' ? '#FFFFFF' : palette.textSoft} size={14} />
                <Text style={[s.subTabBtnText, rankingSubTab === 'friends' && s.subTabBtnTextActive]}>
                  Bạn chung / Bạn bè
                </Text>
              </Pressable>
            </View>

            {/* League Header Card */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.card}>
              <View style={s.leagueHeaderRow}>
                <View style={s.leagueLeft}>
                  <Medal color="#0EA5E9" size={22} />
                  <View>
                    <Text style={s.leagueTitle}>{leaderboardData.leagueName}</Text>
                    <Text style={s.leagueSub}>
                      Tuần thi đấu #{leaderboardData.weekNumber} • Điểm xếp hạng tuần hiện tại
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* BỤC PODIUM 3D (TOP 1, 2, 3) */}
            {top1 && (
              <Animated.View entering={FadeInDown.delay(200)} style={s.podiumCard}>
                <Text style={s.podiumCardTitle}>Vinh Danh Top 3 Tuần Này</Text>

                <View style={s.podiumRow}>
                  {/* Rank 2 (Silver) */}
                  {top2 ? (
                    <View style={s.podiumCol}>
                      <View style={s.podiumMedalBadge}>
                        <Text style={{ fontSize: 20 }}>🥈</Text>
                      </View>
                      <Image
                        source={{
                          uri:
                            top2.avatarUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
                        }}
                        style={[s.podiumAvatar, { borderColor: '#94A3B8' }]}
                      />
                      <Text style={s.podiumName} numberOfLines={1}>
                        {top2.displayName || top2.username}
                      </Text>
                      <View style={[s.podiumXpBadge, { backgroundColor: '#F1F5F9' }]}>
                        <Text style={[s.podiumXp, { color: '#475569' }]}>{top2.weeklyXp} XP</Text>
                      </View>
                      <ExpoLinearGradient colors={['#CBD5E1', '#94A3B8']} style={[s.podiumBar, { height: 65 }]}>
                        <Text style={s.podiumBarNum}>#2</Text>
                      </ExpoLinearGradient>
                    </View>
                  ) : (
                    <View style={s.podiumCol} />
                  )}

                  {/* Rank 1 (Gold - Center) */}
                  <View style={[s.podiumCol, { marginTop: -20 }]}>
                    <View style={s.podiumCrownBadge}>
                      <Crown color="#F59E0B" size={26} fill="#F59E0B" />
                    </View>
                    <Image
                      source={{
                        uri:
                          top1.avatarUrl ||
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                      }}
                      style={[s.podiumAvatarLg, { borderColor: '#F59E0B' }]}
                    />
                    <Text
                      style={[s.podiumName, { color: palette.primary, fontWeight: '800' }]}
                      numberOfLines={1}
                    >
                      {top1.displayName || top1.username}
                    </Text>
                    <View style={[s.podiumXpBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[s.podiumXp, { color: '#D97706' }]}>{top1.weeklyXp} XP</Text>
                    </View>
                    <ExpoLinearGradient
                      colors={['#FBBF24', '#F59E0B', '#D97706']}
                      style={[s.podiumBar, { height: 95 }]}
                    >
                      <Text style={[s.podiumBarNum, { color: '#FFFFFF' }]}>#1</Text>
                    </ExpoLinearGradient>
                  </View>

                  {/* Rank 3 (Bronze) */}
                  {top3 ? (
                    <View style={s.podiumCol}>
                      <View style={s.podiumMedalBadge}>
                        <Text style={{ fontSize: 20 }}>🥉</Text>
                      </View>
                      <Image
                        source={{
                          uri:
                            top3.avatarUrl ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                        }}
                        style={[s.podiumAvatar, { borderColor: '#F97316' }]}
                      />
                      <Text
                        style={[s.podiumName, { color: colors.secondary, fontWeight: '800' }]}
                        numberOfLines={1}
                      >
                        {top3.displayName || top3.username}
                      </Text>
                      <View style={[s.podiumXpBadge, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[s.podiumXp, { color: palette.primary }]}>{top3.weeklyXp} XP</Text>
                      </View>
                      <ExpoLinearGradient colors={['#FDBA74', '#FB923C']} style={[s.podiumBar, { height: 50 }]}>
                        <Text style={s.podiumBarNum}>#3</Text>
                      </ExpoLinearGradient>
                    </View>
                  ) : (
                    <View style={s.podiumCol} />
                  )}
                </View>
              </Animated.View>
            )}

            {/* DANH SÁCH BẢNG XẾP HẠNG ĐẦY ĐỦ */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text style={[s.cardTitleBig, { marginBottom: 12, marginTop: 8 }]}>
                {rankingSubTab === 'global' ? 'Top 10 Hệ Thống' : 'Danh Sách Bạn Bè'}
              </Text>

              {rankList.length === 0 ? (
                <View style={[s.card, { alignItems: 'center', paddingVertical: 32 }]}>
                  <Users color={palette.textSoft} size={36} />
                  <Text style={{ color: palette.textSoft, marginTop: 8, fontFamily: font.family }}>
                    Chưa có học viên nào trong bảng xếp hạng này.
                  </Text>
                </View>
              ) : null}

              {rankList.map((member) => (
                <View key={member.userId} style={[s.lbRow, member.isMe && s.lbRowMe]}>
                  <View style={s.lbLeft}>
                    <View
                      style={[
                        s.rankBadge,
                        member.rank === 1 && { backgroundColor: '#FEF3C7' },
                        member.rank === 2 && { backgroundColor: '#F1F5F9' },
                        member.rank === 3 && { backgroundColor: '#FFEDD5' },
                      ]}
                    >
                      <Text
                        style={[
                          s.rankText,
                          member.rank === 1 && { color: '#D97706' },
                          member.rank === 2 && { color: '#475569' },
                          member.rank === 3 && { color: '#C2410C' },
                        ]}
                      >
                        #{member.rank}
                      </Text>
                    </View>

                    <Image
                      source={{
                        uri:
                          member.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                      }}
                      style={s.lbAvatar}
                    />

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[s.lbName, member.isMe && { color: colors.secondary, fontWeight: '800' }]}
                          numberOfLines={1}
                        >
                          {member.displayName || member.username}
                        </Text>
                        {member.isMe && (
                          <View style={s.meBadge}>
                            <Text style={s.meBadgeText}>BẠN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.lbXp}>{member.weeklyXp.toLocaleString()} XP tuần này</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      s.trendBadge,
                      member.trend === 'up' && { backgroundColor: '#DCFCE7' },
                      member.trend === 'down' && { backgroundColor: '#FEE2E2' },
                      member.trend === 'same' && { backgroundColor: '#F1F5F9' },
                    ]}
                  >
                    {member.trend === 'up' && <ChevronUp color="#16A34A" size={14} />}
                    {member.trend === 'down' && <ChevronDown color="#DC2626" size={14} />}
                    <Text
                      style={[
                        s.trendText,
                        member.trend === 'up' && { color: '#16A34A' },
                        member.trend === 'down' && { color: '#DC2626' },
                      ]}
                    >
                      {member.delta || '0'}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* THẺ VỊ TRÍ CÁ NHÂN NỔI BẬT GHIM Ở ĐÁY */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.posCard}>
              <View style={s.posRow}>
                <View style={s.posRankCircle}>
                  <Text style={s.posRankText}>
                    {leaderboardData.userRank > 0 ? `#${leaderboardData.userRank}` : '-'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.posTitle}>Vị Trí Của Bạn: Hạng {leaderboardData.userRank || 'chưa xếp'}</Text>
                  <Text style={s.posSub}>
                    Bạn đang có {leaderboardData.userWeeklyXp} XP tuần này. Học ngay để thăng hạng!
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/(student)/practice' as any)}
                  style={s.posCtaBtn}
                >
                  <Text style={s.posCtaBtnText}>Luyện Tập</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  switcherRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 16,
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  switcherBtnActive: {
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  switcherText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },
  switcherTextActive: {
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  // Sub Tab Switcher
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subTabBtnActive: {
    backgroundColor: colors.secondary,
  },
  subTabBtnText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },
  subTabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Progress Section
  progressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSectionTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  filterDropdownBtn: {
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterDropdownText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },

  // Streak Card
  streakWrapper: {
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  streakGradient: {
    borderRadius: 24,
    padding: 18,
  },
  streakTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  streakFlameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakHeaderRight: {
    flex: 1,
  },
  streakMainTitle: {
    fontSize: 19,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakSubTitle: {
    fontSize: 11,
    fontFamily: font.family,
    color: '#FFE7DB',
    marginTop: 2,
  },
  streakDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  streakDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakDayLabel: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 6,
  },
  streakDayLabelToday: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  streakCheckSquare: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCheckSquareActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  streakCheckSquareToday: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  streakUncheckedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  todayDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  streakNextGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  streakNextGoalText: {
    fontSize: 11,
    fontFamily: font.family,
    color: '#FFFFFF',
  },

  // 4 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statVal: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  statTrendGreen: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 4,
  },
  statTrendNeutral: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
    marginTop: 4,
  },

  // Card Base
  card: {
    backgroundColor: palette.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleBig: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  cardSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },

  // Radar Styles
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 230,
    marginVertical: 4,
  },
  radarLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },
  radarLabelTop: { top: 0, alignSelf: 'center' },
  radarLabelRight: { right: 8, top: 50 },
  radarLabelBottomRight: { right: 20, bottom: 8 },
  radarLabelBottomLeft: { left: 20, bottom: 8 },
  radarLabelLeft: { left: 8, top: 50 },

  // CEFR Mastery Bars
  skillBarsWrap: {
    gap: 12,
    marginTop: 8,
  },
  masteryItem: {
    gap: 6,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masteryLabel: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  masteryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masteryLevel: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
  },
  masteryScore: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  masteryTrack: {
    height: 7,
    backgroundColor: palette.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    borderRadius: 4,
  },

  // 7-Day Chart Styles
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  todayTooltip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  todayTooltipText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chartBarTrack: {
    width: 22,
    height: 100,
    justifyContent: 'flex-end',
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartDay: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
    marginTop: 8,
  },
  chartDayActive: {
    color: colors.secondary,
    fontWeight: '800',
  },
  trendBadgeBlue: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendBadgeBlueText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },

  // TAB 2: ANALYTICS OVERVIEW
  overviewScoreCard: {
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  overviewGradient: {
    padding: 20,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewScoreLeft: {
    flex: 1,
  },
  overviewScoreSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  overviewScoreMain: {
    fontSize: 36,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  overviewScoreMax: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  overviewCefrBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  overviewCefrText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewScoreRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewGrowth: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: '#FFE7DB',
    marginTop: 4,
  },

  // Smart Tip
  tipCard: {
    backgroundColor: '#FFFBEB',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  tipCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCardTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#92400E',
  },
  tipCardSub: {
    fontSize: 10,
    fontFamily: font.family,
    color: '#B45309',
  },
  tipCardContent: {
    fontSize: 13,
    fontFamily: font.family,
    color: '#78350F',
    lineHeight: 20,
  },

  // Matrix
  matrixContainer: {
    marginBottom: 16,
  },
  matrixTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 10,
  },
  matrixBoxWarning: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  matrixBoxSuccess: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  matrixBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  matrixWarningTitle: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  matrixSuccessTitle: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  pitfallItem: {
    marginBottom: 10,
  },
  pitfallHeader: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 2,
  },
  strengthHeader: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  pitfallDesc: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  pitfallExample: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  pitfallExampleText: {
    fontSize: 11,
    fontFamily: font.family,
    color: '#334155',
    fontStyle: 'italic',
  },

  // Remedial Quiz Card
  remedialCard: {
    backgroundColor: palette.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  remedialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  remedialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remedialBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#D97706',
  },
  remedialTopic: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    fontWeight: '600',
  },
  remedialQuestion: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 14,
    lineHeight: 22,
  },
  remedialOptionsWrap: {
    gap: 8,
    marginBottom: 14,
  },
  remedialOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  remedialOptionText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    flex: 1,
  },
  remedialExplainBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  remedialExplainTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.primary,
    marginBottom: 4,
  },
  remedialExplainText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  remedialNextBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  remedialNextBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
  },

  // TAB 3: RANKING & LEAGUE
  leagueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  leagueTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  leagueSub: {
    fontSize: 10,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },

  // Podium
  podiumCard: {
    backgroundColor: palette.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  podiumCardTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumCrownBadge: {
    marginBottom: 4,
  },
  podiumMedalBadge: {
    marginBottom: 4,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    marginBottom: 6,
  },
  podiumAvatarLg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    marginBottom: 6,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4,
  },
  podiumXpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  podiumXp: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBarNum: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Full Leaderboard
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
  },
  lbRowMe: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  lbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.textSoft,
  },
  lbAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  lbName: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  meBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  meBadgeText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lbXp: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
  },

  // Position Card
  posCard: {
    backgroundColor: palette.primary,
    padding: 16,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  posRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  posRankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posRankText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  posTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  posSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  posCtaBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  posCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
  },
});
