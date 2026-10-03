import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Subcomponent for Animated Chart Bar (7-day time distribution)
interface ChartBarItemProps {
  item: { day: string; min: number };
  idx: number;
  barHeight: SharedValue<number>;
}

const ChartBarItem: React.FC<ChartBarItemProps> = ({ item, idx, barHeight }) => {
  const isToday = idx === 3; // T5 is today
  const animStyle = useAnimatedStyle(() => ({
    height: `${barHeight.value}%`,
  }));

  return (
    <View style={s.chartCol}>
      {isToday && (
        <View style={s.todayTooltip}>
          <Text style={s.todayTooltipText}>{item.min}p</Text>
        </View>
      )}
      <View style={s.chartBarTrack}>
        <Animated.View
          style={[
            s.chartBarFill,
            animStyle,
            { backgroundColor: isToday ? colors.secondary : palette.border },
          ]}
        />
      </View>
      <Text style={[s.chartDay, isToday && s.chartDayActive]}>{item.day}</Text>
    </View>
  );
};

export const AnalyticsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'progress' | 'analytics' | 'ranking'>('progress');
  const [selectedFilter, setSelectedFilter] = useState('Tuần này');
  const [selectedAnalysisCategory, setSelectedAnalysisCategory] = useState('Tất cả');

  // Animated progress bars for skills
  const vocabWidth = useSharedValue(0);
  const grammarWidth = useSharedValue(0);
  const speakingWidth = useSharedValue(0);
  const listeningWidth = useSharedValue(0);
  const writingWidth = useSharedValue(0);

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

  useEffect(() => {
    // Skill bars animation
    vocabWidth.value = withTiming(85, { duration: 800 });
    grammarWidth.value = withTiming(70, { duration: 900 });
    speakingWidth.value = withTiming(78, { duration: 1000 });
    listeningWidth.value = withTiming(65, { duration: 1100 });
    writingWidth.value = withTiming(55, { duration: 1200 });

    // Chart bars animation
    const chartVals = [35, 45, 25, 80, 55, 40, 60];
    chartVals.forEach((val, idx) => {
      barHeights[idx].value = withSpring(val, { damping: 12, stiffness: 90 });
    });
  }, []);

  const vocabStyle = useAnimatedStyle(() => ({ width: `${vocabWidth.value}%` }));
  const grammarStyle = useAnimatedStyle(() => ({ width: `${grammarWidth.value}%` }));
  const speakingStyle = useAnimatedStyle(() => ({ width: `${speakingWidth.value}%` }));
  const listeningStyle = useAnimatedStyle(() => ({ width: `${listeningWidth.value}%` }));
  const writingStyle = useAnimatedStyle(() => ({ width: `${writingWidth.value}%` }));

  const weeklyData = [
    { day: 'T2', min: 25 },
    { day: 'T3', min: 40 },
    { day: 'T4', min: 15 },
    { day: 'T5', min: 50 },
    { day: 'T6', min: 30 },
    { day: 'T7', min: 20 },
    { day: 'CN', min: 35 },
  ];

  const streakDays = [
    { day: 'T2', checked: true, isToday: false },
    { day: 'T3', checked: true, isToday: false },
    { day: 'T4', checked: true, isToday: false },
    { day: 'T5', checked: true, isToday: true },
    { day: 'T6', checked: false, isToday: false },
    { day: 'T7', checked: false, isToday: false },
    { day: 'CN', checked: false, isToday: false },
  ];

  const skillData = [
    { label: 'Từ Vựng', score: 85, level: 'B2 Cao cấp', animStyle: vocabStyle, color: '#0EA5E9', bgSoft: '#E0F2FE' },
    { label: 'Ngữ Pháp', score: 70, level: 'B1 Trung cấp', animStyle: grammarStyle, color: '#2563A8', bgSoft: '#DBEAFE' },
    { label: 'Phát Âm & Nói', score: 78, level: 'B1+ Khá', animStyle: speakingStyle, color: '#059669', bgSoft: '#D1FAE5' },
    { label: 'Nghe Hiểu', score: 65, level: 'B1 Trung cấp', animStyle: listeningStyle, color: '#7C3AED', bgSoft: '#EDE9FE' },
    { label: 'Kỹ Năng Viết', score: 55, level: 'A2 Cơ bản', animStyle: writingStyle, color: '#D97706', bgSoft: '#FEF3C7' },
  ];

  const analysisCategories = ['Tất cả', 'Ngữ pháp', 'Từ vựng', 'Phát âm', 'Lộ trình'];

  const leaderboard = [
    { rank: 1, name: 'Minh Anh', xp: 2850, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', trend: 'up' as const, delta: '+2' },
    { rank: 2, name: 'Hoàng Nam', xp: 2720, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120', trend: 'same' as const, delta: '0' },
    { rank: 3, name: 'Bạn (Minh)', xp: 2640, avatar: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120', trend: 'up' as const, delta: '+1', isMe: true },
    { rank: 4, name: 'Thu Hà', xp: 2410, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', trend: 'down' as const, delta: '-1' },
    { rank: 5, name: 'Đức Anh', xp: 2280, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', trend: 'down' as const, delta: '-1' },
    { rank: 6, name: 'Lan Phương', xp: 2150, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120', trend: 'up' as const, delta: '+3' },
    { rank: 7, name: 'Quốc Bảo', xp: 1980, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120', trend: 'down' as const, delta: '-2' },
    { rank: 8, name: 'Mai Linh', xp: 1850, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', trend: 'up' as const, delta: '+1' },
  ];

  // Radar Pentagon Points Calculation
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

  const userSkillRatios = [0.85, 0.70, 0.78, 0.65, 0.55];
  const userSkillPoints = userSkillRatios
    .map((ratio, i) => {
      const angle = (Math.PI / 180) * (i * 72 - 90);
      const x = cx + maxR * ratio * Math.cos(angle);
      const y = cy + maxR * ratio * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const safeTop = Math.max(insets.top, 48) + 12;

  return (
    <View style={s.root}>
      {/* Header Bar */}
      <View style={[s.header, { paddingTop: safeTop }]}>
        <View style={s.headerTopRow}>
          <View>
            <Text style={s.brandSub}>Thống kê & Năng lực</Text>
            <Text style={s.headerTitle}>Trung Tâm Tiến Độ</Text>
          </View>
          <Image
            source={{ uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120' }}
            style={s.headerAvatar}
          />
        </View>

        {/* Segment Switcher Bar — HOÀN TOÀN BỎ ICON ROBOT THEO YÊU CẦU */}
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

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: TIẾN ĐỘ HỌC TẬP (PROGRESS) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'progress' && (
          <View>
            {/* Header Lựa Chọn Thời Gian */}
            <Animated.View entering={FadeInDown.delay(50)} style={s.progressSectionHeader}>
              <View style={s.progressSectionTitleWrap}>
                <BarChart3 color={palette.primary} size={18} />
                <Text style={s.progressSectionTitle}>Chỉ số học tập</Text>
              </View>

              <Pressable
                onPress={() => setSelectedFilter(selectedFilter === 'Tuần này' ? 'Tháng này' : 'Tuần này')}
                style={s.filterDropdownBtn}
              >
                <Text style={s.filterDropdownText}>{selectedFilter}</Text>
                <ChevronDown color={palette.textSoft} size={14} />
              </Pressable>
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
                    <Text style={s.streakMainTitle}>15 ngày liên tiếp!</Text>
                    <Text style={s.streakSubTitle}>Kỷ lục cá nhân: 23 ngày • Giữ vững phong độ 🔥</Text>
                  </View>
                </View>

                {/* 7 Days Row */}
                <View style={s.streakDaysRow}>
                  {streakDays.map((item, idx) => (
                    <View key={idx} style={s.streakDayItem}>
                      <Text style={[s.streakDayLabel, item.isToday && s.streakDayLabelToday]}>
                        {item.day}
                      </Text>
                      <View
                        style={[
                          s.streakCheckSquare,
                          item.checked && s.streakCheckSquareActive,
                          item.isToday && s.streakCheckSquareToday,
                        ]}
                      >
                        {item.checked ? (
                          <Check color="#FFFFFF" size={13} strokeWidth={3} />
                        ) : (
                          <View style={s.streakUncheckedDot} />
                        )}
                      </View>
                      {item.isToday && <View style={s.todayDotIndicator} />}
                    </View>
                  ))}
                </View>

                {/* Milestone Next Goal */}
                <View style={s.streakNextGoalRow}>
                  <Award color="#FFE7DB" size={14} />
                  <Text style={s.streakNextGoalText}>
                    Còn 2 ngày nữa để mở khóa huy hiệu <Text style={{ fontWeight: '800' }}>Tuần Vàng 🏅</Text>
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
                <Text style={s.statVal}>127</Text>
                <Text style={s.statLabel}>Từ đã thuộc</Text>
                <Text style={s.statTrendGreen}>+14 từ tuần này</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Target color="#D97706" size={18} />
                </View>
                <Text style={s.statVal}>82%</Text>
                <Text style={s.statLabel}>Độ chính xác Quiz</Text>
                <Text style={s.statTrendGreen}>+5% vs tuần trước</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Clock color="#7C3AED" size={18} />
                </View>
                <Text style={s.statVal}>4.2h</Text>
                <Text style={s.statLabel}>Thời gian học</Text>
                <Text style={s.statTrendNeutral}>Mục tiêu: 5.0h</Text>
              </View>

              <View style={s.statBox}>
                <View style={[s.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Zap color="#16A34A" size={18} fill="#16A34A" />
                </View>
                <Text style={s.statVal}>1.8s</Text>
                <Text style={s.statLabel}>Tốc độ phản xạ</Text>
                <Text style={s.statTrendGreen}>Top 15% học viên</Text>
              </View>
            </Animated.View>

            {/* BIỂU ĐỒ 1: RADAR PENTAGON (MẠNG NHỆN 5 KỸ NĂNG) */}
            <Animated.View entering={FadeInDown.delay(260)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <View>
                  <Text style={s.cardTitleBig}>Biểu đồ mạng nhện kỹ năng</Text>
                  <Text style={s.cardSub}>Đánh giá toàn diện 5 trụ cột ngôn ngữ</Text>
                </View>
                <View style={s.pillBadge}>
                  <Text style={s.pillBadgeText}>B1 Independent</Text>
                </View>
              </View>

              <View style={s.radarContainer}>
                {/* Labels around Pentagon */}
                <Text style={[s.radarLabel, s.radarLabelTop]}>Từ vựng (85%)</Text>
                <Text style={[s.radarLabel, s.radarLabelRight]}>Ngữ pháp (70%)</Text>
                <Text style={[s.radarLabel, s.radarLabelBottomRight]}>Nói (78%)</Text>
                <Text style={[s.radarLabel, s.radarLabelBottomLeft]}>Đọc (65%)</Text>
                <Text style={[s.radarLabel, s.radarLabelLeft]}>Nghe (55%)</Text>

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

            {/* BIỂU ĐỒ 3: THỜI GIAN HỌC 7 NGÀY (BAR CHART) */}
            <Animated.View entering={FadeInDown.delay(380)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <View>
                  <Text style={s.cardTitleBig}>Thời gian học mỗi ngày</Text>
                  <Text style={s.cardSub}>Tổng 210 phút trong 7 ngày qua</Text>
                </View>
                <View style={s.trendBadgeGreen}>
                  <TrendingUp color="#059669" size={13} />
                  <Text style={s.trendBadgeGreenText}>+18%</Text>
                </View>
              </View>

              <View style={s.chartRow}>
                {weeklyData.map((item, idx) => (
                  <ChartBarItem
                    key={idx}
                    item={item}
                    idx={idx}
                    barHeight={barHeights[idx]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* BIỂU ĐỒ 4: ĐIỂM QUIZ TUẦN NÀY (CURVED WAVE LINE CHART) */}
            <Animated.View entering={FadeInDown.delay(440)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <View>
                  <Text style={s.cardTitleBig}>Xu hướng điểm Quiz</Text>
                  <Text style={s.cardSub}>Độ ổn định tăng dần qua các bài thi</Text>
                </View>
                <View style={s.trendBadgeBlue}>
                  <Text style={s.trendBadgeBlueText}>TB: 82%</Text>
                </View>
              </View>

              <View style={{ height: 130, marginTop: 14 }}>
                <Svg height="100" width={SCREEN_WIDTH - 80} viewBox="0 0 300 100">
                  <Defs>
                    <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#00B0F0" stopOpacity="0.4" />
                      <Stop offset="1" stopColor="#00B0F0" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>

                  {/* Gradient Area Fill */}
                  <Path
                    d="M 10,75 Q 50,65 90,55 T 170,45 T 250,55 T 290,25 L 290,100 L 10,100 Z"
                    fill="url(#waveGrad)"
                  />

                  {/* Curved Wave Line */}
                  <Path
                    d="M 10,75 Q 50,65 90,55 T 170,45 T 250,55 T 290,25"
                    fill="none"
                    stroke="#1F4E79"
                    strokeWidth="3.2"
                  />

                  {/* Data Points */}
                  <Circle cx="10" cy="75" r="3.5" fill="#1F4E79" />
                  <Circle cx="90" cy="55" r="3.5" fill="#1F4E79" />
                  <Circle cx="170" cy="45" r="4.5" fill="#00B0F0" stroke="#FFFFFF" strokeWidth="2" />
                  <Circle cx="250" cy="55" r="3.5" fill="#1F4E79" />
                  <Circle cx="290" cy="25" r="5" fill="#1F4E79" stroke="#00B0F0" strokeWidth="2" />
                </Svg>

                <View style={s.lineChartDaysRow}>
                  {['T2 (65%)', 'T3 (70%)', 'T4 (75%)', 'T5 (85%)', 'T6 (80%)', 'T7 (82%)', 'CN (92%)'].map((d, i) => (
                    <Text key={i} style={[s.lineChartDayText, i === 3 && { color: colors.secondary, fontWeight: '800' }]}>
                      {d.split(' ')[0]}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Báo Cáo Chi Tiết PDF */}
            <Animated.View entering={FadeInDown.delay(500)} style={s.pdfCtaWrap}>
              <Pressable
                onPress={() => alert('Đang xuất báo cáo chi tiết quá trình học tập...')}
                style={s.pdfBtn}
              >
                <View style={s.pdfBtnLeft}>
                  <FileText color={palette.primary} size={18} />
                  <Text style={s.pdfBtnText}>Xuất báo cáo năng lực chi tiết (PDF)</Text>
                </View>
                <ArrowRight color={palette.primary} size={16} />
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ĐÁNH GIÁ NĂNG LỰC & GỢI Ý THÔNG MINH (ANALYTICS) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
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
                  <Text style={s.overviewScoreSub}>Chỉ số thông thạo</Text>
                  <Text style={s.overviewScoreMain}>74<Text style={s.overviewScoreMax}>/100</Text></Text>
                  <View style={s.overviewCefrBadge}>
                    <Text style={s.overviewCefrText}>Tương đương B1 (TOEIC 550-650)</Text>
                  </View>
                </View>

                <View style={s.overviewScoreRight}>
                  <Sparkles color="#FFE7DB" size={32} />
                  <Text style={s.overviewGrowth}>+8 điểm trong tháng</Text>
                </View>
              </ExpoLinearGradient>
            </Animated.View>

            {/* Bộ Lọc Danh Mục Phân Tích */}
            <Animated.View entering={FadeInDown.delay(180)} style={s.chipsRow}>
              {analysisCategories.map((cat) => {
                const isSelected = selectedAnalysisCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedAnalysisCategory(cat)}
                    style={[s.chipBtn, isSelected && s.chipBtnActive]}
                  >
                    <Text style={[s.chipText, isSelected && s.chipTextActive]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </Animated.View>

            {/* GỢI Ý THÔNG MINH (SMART TIPS CARD) */}
            <Animated.View entering={FadeInDown.delay(260)} style={s.tipCard}>
              <View style={s.tipCardHeaderRow}>
                <View style={s.tipIconBox}>
                  <Lightbulb color="#D97706" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipCardTitle}>Gợi ý trọng tâm hôm nay</Text>
                  <Text style={s.tipCardSub}>Dựa trên lịch sử bài tập gần nhất</Text>
                </View>
              </View>

              <Text style={s.tipCardContent}>
                "Bạn thường nhầm lẫn giữa <Text style={{ fontWeight: '700', color: '#B45309' }}>'Make' vs 'Do'</Text> trong các cụm collocations công sở. Luyện 5 câu trắc nghiệm chuyên đề này sẽ giúp tăng 15% điểm ngữ pháp."
              </Text>

              <View style={s.suggestionChipsRow}>
                <Pressable
                  onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
                  style={s.sugChipBtnPrimary}
                >
                  <Zap color="#FFFFFF" size={13} fill="#FFFFFF" />
                  <Text style={s.sugChipPrimaryText}>Luyện 5 câu Quiz ngay</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(student)/learn' as any)}
                  style={s.sugChipBtnSecondary}
                >
                  <Text style={s.sugChipSecondaryText}>Xem lý thuyết</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* MA TRẬN: CẦN CẢI THIỆN & ĐIỂM MẠNH */}
            <Animated.View entering={FadeInDown.delay(340)} style={s.matrixContainer}>
              <Text style={s.matrixTitle}>Phân Tích Chi Tiết Điểm Mạnh & Yếu</Text>

              {/* Box 1: Cần Cải Thiện */}
              <View style={s.matrixBoxWarning}>
                <View style={s.matrixBoxHeader}>
                  <AlertCircle color="#DC2626" size={18} />
                  <Text style={s.matrixWarningTitle}>LỖ HỔNG CẦN KHẮC PHỤC</Text>
                </View>
                
                <View style={s.pitfallItem}>
                  <Text style={s.pitfallHeader}>1. Collocations: 'Make' vs 'Do' (Độ chính xác: 45%)</Text>
                  <Text style={s.pitfallDesc}>Bạn hay dùng sai 'make homework' thay vì 'do homework'.</Text>
                  <View style={s.pitfallExample}>
                    <Text style={s.pitfallExampleText}>✓ Đúng: do homework, do business, make a decision.</Text>
                  </View>
                </View>

                <View style={s.pitfallItem}>
                  <Text style={s.pitfallHeader}>2. Phát âm đuôi '-ed' (Độ chính xác: 58%)</Text>
                  <Text style={s.pitfallDesc}>Dễ quên phân biệt 3 cách đọc /t/, /d/, /ɪd/ khi gặp động từ quá khứ.</Text>
                  <View style={s.pitfallExample}>
                    <Text style={s.pitfallExampleText}>✓ Wanted /ɪd/, Watched /t/, Played /d/.</Text>
                  </View>
                </View>
              </View>

              {/* Box 2: Điểm Mạnh */}
              <View style={s.matrixBoxSuccess}>
                <View style={s.matrixBoxHeader}>
                  <CheckCircle2 color="#16A34A" size={18} />
                  <Text style={s.matrixSuccessTitle}>ĐIỂM MẠNH ĐÃ LÀM CHỦ</Text>
                </View>

                <View style={s.pitfallItem}>
                  <Text style={s.strengthHeader}>1. Trọng âm từ 3 âm tiết (Độ chính xác: 88%)</Text>
                  <Text style={s.pitfallDesc}>Ngữ điệu và cách nhấn trọng âm chuẩn xác theo ngữ điệu người bản xứ.</Text>
                </View>

                <View style={s.pitfallItem}>
                  <Text style={s.strengthHeader}>2. Từ vựng chủ đề Công sở & Giao tiếp (85%)</Text>
                  <Text style={s.pitfallDesc}>Ghi nhớ xuất sắc các từ vựng SRS chủ đề Business & Travel.</Text>
                </View>
              </View>
            </Animated.View>

            {/* ĐỀ XUẤT BÀI TẬP CỦNG CỐ NGAY */}
            <Animated.View entering={FadeInDown.delay(420)} style={s.card}>
              <Text style={s.cardTitleBig}>Đề xuất bài luyện tập khắc phục</Text>
              <Text style={[s.cardSub, { marginBottom: 14 }]}>Chọn nhanh để cải thiện ngay hôm nay</Text>

              <Pressable
                onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
                style={s.recomItem}
              >
                <View style={s.recomLeft}>
                  <View style={[s.recomIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={{ fontSize: 16 }}>⚠️</Text>
                  </View>
                  <View>
                    <Text style={s.recomTitle}>Phân biệt 'Make' & 'Do' nhanh</Text>
                    <Text style={s.recomSub}>5 câu trắc nghiệm • 3 phút</Text>
                  </View>
                </View>
                <ChevronRight color={palette.textSoft} size={18} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/(student)/learn' as any)}
                style={s.recomItem}
              >
                <View style={s.recomLeft}>
                  <View style={[s.recomIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={{ fontSize: 16 }}>🎙️</Text>
                  </View>
                  <View>
                    <Text style={s.recomTitle}>Quy tắc phát âm đuôi '-ed'</Text>
                    <Text style={s.recomSub}>Bài giảng tương tác • 5 phút</Text>
                  </View>
                </View>
                <ChevronRight color={palette.textSoft} size={18} />
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: XẾP HẠNG SÔI NỔI (RANKING & LEAGUE) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ranking' && (
          <View>
            {/* League Header Card */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.card}>
              <View style={s.leagueHeaderRow}>
                <View style={s.leagueLeft}>
                  <Medal color="#0EA5E9" size={22} />
                  <View>
                    <Text style={s.leagueTitle}>Silver League — Hạng Bạc</Text>
                    <Text style={s.leagueSub}>Top 3 thăng hạng Gold League • Cuối bảng xuống hạng Bronze</Text>
                  </View>
                </View>
                <View style={s.badgeCountdown}>
                  <Clock color="#D97706" size={12} />
                  <Text style={s.badgeCountdownText}>2 ngày 14h</Text>
                </View>
              </View>

              {/* League Division Zones Bar */}
              <View style={s.leagueZoneContainer}>
                <View style={s.leagueZoneTrack}>
                  <View style={[s.leagueZoneSection, { flex: 3, backgroundColor: '#22C55E' }]} />
                  <View style={[s.leagueZoneSection, { flex: 4, backgroundColor: '#E2E8F0' }]} />
                  <View style={[s.leagueZoneSection, { flex: 3, backgroundColor: '#EF4444' }]} />
                </View>
                <View style={s.leagueZoneLabels}>
                  <Text style={[s.leagueZoneText, { color: '#16A34A' }]}>▲ Thăng hạng (Top 3)</Text>
                  <Text style={s.leagueZoneText}>An toàn</Text>
                  <Text style={[s.leagueZoneText, { color: '#DC2626' }]}>▼ Xuống hạng</Text>
                </View>
              </View>
            </Animated.View>

            {/* BỤC PODIUM 3D (TOP 1, 2, 3) */}
            <Animated.View entering={FadeInDown.delay(200)} style={s.podiumCard}>
              <Text style={s.podiumCardTitle}>Vinh danh Tuần này</Text>

              <View style={s.podiumRow}>
                {/* Rank 2 (Silver) */}
                <View style={s.podiumCol}>
                  <View style={s.podiumMedalBadge}>
                    <Text style={{ fontSize: 20 }}>🥈</Text>
                  </View>
                  <Image source={{ uri: leaderboard[1].avatar }} style={[s.podiumAvatar, { borderColor: '#94A3B8' }]} />
                  <Text style={s.podiumName} numberOfLines={1}>{leaderboard[1].name}</Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[s.podiumXp, { color: '#475569' }]}>{leaderboard[1].xp} XP</Text>
                  </View>
                  <ExpoLinearGradient
                    colors={['#CBD5E1', '#94A3B8']}
                    style={[s.podiumBar, { height: 65 }]}
                  >
                    <Text style={s.podiumBarNum}>#2</Text>
                  </ExpoLinearGradient>
                </View>

                {/* Rank 1 (Gold - Center) */}
                <View style={[s.podiumCol, { marginTop: -20 }]}>
                  <View style={s.podiumCrownBadge}>
                    <Crown color="#F59E0B" size={26} fill="#F59E0B" />
                  </View>
                  <Image source={{ uri: leaderboard[0].avatar }} style={[s.podiumAvatarLg, { borderColor: '#F59E0B' }]} />
                  <Text style={[s.podiumName, { color: palette.primary, fontWeight: '800' }]} numberOfLines={1}>
                    {leaderboard[0].name}
                  </Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[s.podiumXp, { color: '#D97706' }]}>{leaderboard[0].xp} XP</Text>
                  </View>
                  <ExpoLinearGradient
                    colors={['#FBBF24', '#F59E0B', '#D97706']}
                    style={[s.podiumBar, { height: 95 }]}
                  >
                    <Text style={[s.podiumBarNum, { color: '#FFFFFF' }]}>#1</Text>
                  </ExpoLinearGradient>
                </View>

                {/* Rank 3 (Bronze) */}
                <View style={s.podiumCol}>
                  <View style={s.podiumMedalBadge}>
                    <Text style={{ fontSize: 20 }}>🥉</Text>
                  </View>
                  <Image source={{ uri: leaderboard[2].avatar }} style={[s.podiumAvatar, { borderColor: '#F97316' }]} />
                  <Text style={[s.podiumName, { color: colors.secondary, fontWeight: '800' }]} numberOfLines={1}>
                    {leaderboard[2].name}
                  </Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[s.podiumXp, { color: palette.primary }]}>{leaderboard[2].xp} XP</Text>
                  </View>
                  <ExpoLinearGradient
                    colors={['#FDBA74', '#FB923C']}
                    style={[s.podiumBar, { height: 50 }]}
                  >
                    <Text style={s.podiumBarNum}>#3</Text>
                  </ExpoLinearGradient>
                </View>
              </View>
            </Animated.View>

            {/* DANH SÁCH BẢNG XẾP HẠNG ĐẦY ĐỦ */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text style={[s.cardTitleBig, { marginBottom: 12, marginTop: 8 }]}>Bảng Xếp Hạng Tuần</Text>
              
              {leaderboard.map((member) => (
                <View key={member.rank} style={[s.lbRow, member.isMe && s.lbRowMe]}>
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

                    <Image source={{ uri: member.avatar }} style={s.lbAvatar} />
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[s.lbName, member.isMe && { color: colors.secondary, fontWeight: '800' }]}>
                          {member.name}
                        </Text>
                        {member.isMe && (
                          <View style={s.meBadge}>
                            <Text style={s.meBadgeText}>BẠN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.lbXp}>{member.xp.toLocaleString()} XP</Text>
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
                      {member.delta}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* THẺ VỊ TRÍ CÁ NHÂN NỔI BẬT GHIM Ở ĐÁY */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.posCard}>
              <View style={s.posRow}>
                <View style={s.posRankCircle}>
                  <Text style={s.posRankText}>#3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.posTitle}>Vị Trí Của Bạn: Top 3 Thăng Hạng 🚀</Text>
                  <Text style={s.posSub}>Chỉ còn 80 XP nữa để vượt Hoàng Nam (#2). Thi 1 bài Quiz để san bằng điểm số!</Text>
                </View>
                <Pressable
                  onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
                  style={s.posCtaBtn}
                >
                  <Text style={s.posCtaBtnText}>Đua Top</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.primary,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  // Trend Badges
  trendBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendBadgeGreenText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#16A34A',
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
  lineChartDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  lineChartDayText: {
    fontSize: 10,
    fontFamily: font.family,
    color: palette.textSoft,
  },

  // PDF CTA
  pdfCtaWrap: {
    marginBottom: 20,
  },
  pdfBtn: {
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pdfBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfBtnText: {
    fontSize: 13,
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

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipBtnActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
  chipTextActive: {
    color: '#FFFFFF',
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
    fontSize: 12,
    fontFamily: font.family,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 14,
  },
  suggestionChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sugChipBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sugChipPrimaryText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sugChipBtnSecondary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sugChipSecondaryText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#B45309',
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
    fontSize: 10,
    fontFamily: font.family,
    color: '#334155',
    fontStyle: 'italic',
  },

  // Recommended Practice Items
  recomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  recomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recomIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recomTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  recomSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },

  // TAB 3: RANKING & LEAGUE
  leagueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  badgeCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCountdownText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#D97706',
  },
  leagueZoneContainer: {
    marginTop: 8,
  },
  leagueZoneTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  leagueZoneSection: {},
  leagueZoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  leagueZoneText: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
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
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  lbName: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  meBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  meBadgeText: {
    fontSize: 8,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lbXp: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },

  // Sticky Bottom User Rank Card
  posCard: {
    backgroundColor: palette.primary,
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
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
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posRankText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  posTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  posSub: {
    fontSize: 10,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  posCtaBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  posCtaBtnText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
