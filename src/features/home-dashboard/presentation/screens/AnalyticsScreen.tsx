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
  Bot,
  Lightbulb,
  Check,
  ChevronRight,
  ArrowRight,
  Brain,
  Award,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Svg, { Polygon, Line, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Subcomponent for Animated Chart Bar (Compliant with React Rules of Hooks)
interface ChartBarItemProps {
  item: { day: string; min: number };
  idx: number;
  barHeight: SharedValue<number>;
}

const ChartBarItem: React.FC<ChartBarItemProps> = ({ item, idx, barHeight }) => {
  const isToday = idx === 3; // T5 is highlighted matching screenshot
  const animStyle = useAnimatedStyle(() => ({
    height: `${barHeight.value}%`,
  }));

  return (
    <View style={s.chartCol}>
      <View style={s.chartBarTrack}>
        <Animated.View
          style={[
            s.chartBarFill,
            animStyle,
            { backgroundColor: isToday ? '#0EA5E9' : '#CBD5E1' },
          ]}
        />
      </View>
      <Text style={[s.chartDay, isToday && { color: '#1E3A5F', fontWeight: '800' }]}>{item.day}</Text>
    </View>
  );
};

export const AnalyticsScreen = () => {
  const router = useRouter();
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
    { day: 'T2', checked: true },
    { day: 'T3', checked: true },
    { day: 'T4', checked: true },
    { day: 'T5', checked: true },
    { day: 'T6', checked: false },
    { day: 'T7', checked: false },
    { day: 'CN', checked: false },
  ];

  const skillData = [
    { label: 'Từ Vựng', score: 85, animStyle: vocabStyle, color: '#0EA5E9' },
    { label: 'Ngữ Pháp', score: 70, animStyle: grammarStyle, color: '#38BDF8' },
    { label: 'Phát Âm', score: 78, animStyle: speakingStyle, color: '#7DD3FC' },
    { label: 'Nghe Hiểu', score: 65, animStyle: listeningStyle, color: '#BAE6FD' },
    { label: 'Viết', score: 55, animStyle: writingStyle, color: '#E0F2FE' },
  ];

  const analysisCategories = ['Tất cả', 'Ngữ pháp', 'Từ vựng', 'Phát âm', 'Lộ trình'];

  const leaderboard = [
    { rank: 1, name: 'Minh Anh', xp: 2850, avatar: 'https://i.pravatar.cc/100?img=1', trend: 'up' as const },
    { rank: 2, name: 'Hoàng Nam', xp: 2720, avatar: 'https://i.pravatar.cc/100?img=2', trend: 'up' as const },
    { rank: 3, name: 'Bạn (Minh)', xp: 2640, avatar: 'https://i.pravatar.cc/100?img=33', trend: 'up' as const, isMe: true },
    { rank: 4, name: 'Thu Hà', xp: 2410, avatar: 'https://i.pravatar.cc/100?img=5', trend: 'down' as const },
    { rank: 5, name: 'Đức Anh', xp: 2280, avatar: 'https://i.pravatar.cc/100?img=12', trend: 'down' as const },
    { rank: 6, name: 'Lan Phương', xp: 2150, avatar: 'https://i.pravatar.cc/100?img=9', trend: 'up' as const },
    { rank: 7, name: 'Quốc Bảo', xp: 1980, avatar: 'https://i.pravatar.cc/100?img=15', trend: 'down' as const },
    { rank: 8, name: 'Mai Linh', xp: 1850, avatar: 'https://i.pravatar.cc/100?img=20', trend: 'up' as const },
  ];

  const getRankBadgeBg = (rank: number) => {
    if (rank === 1) return '#0EA5E9';
    if (rank === 2) return '#38BDF8';
    if (rank === 3) return '#7DD3FC';
    return '#E0F2FE';
  };

  // Radar Pentagon Points Calculation
  // 5 vertices: Top (Từ vựng), Top-Right (Ngữ pháp), Bottom-Right (Nói), Bottom-Left (Đọc), Top-Left (Nghe)
  const cx = 100;
  const cy = 100;
  const maxR = 65;

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

  // User skill pentagon values (85%, 70%, 75%, 60%, 65%)
  const userSkillRatios = [0.85, 0.70, 0.75, 0.60, 0.65];
  const userSkillPoints = userSkillRatios
    ? userSkillRatios
        .map((ratio, i) => {
          const angle = (Math.PI / 180) * (i * 72 - 90);
          const x = cx + maxR * ratio * Math.cos(angle);
          const y = cy + maxR * ratio * Math.sin(angle);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ')
    : '';

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>SmartEnglish AI</Text>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=33' }}
            style={s.headerAvatar}
          />
        </View>

        {/* Segment Switcher */}
        <View style={s.switcherRow}>
          <Pressable
            onPress={() => setActiveTab('progress')}
            style={[s.switcherBtn, activeTab === 'progress' && s.switcherBtnActive]}
          >
            <TrendingUp color={activeTab === 'progress' ? '#1E3A5F' : '#FFFFFF'} size={15} />
            <Text style={[s.switcherText, activeTab === 'progress' && s.switcherTextActive]}>
              Tiến Độ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('analytics')}
            style={[s.switcherBtn, activeTab === 'analytics' && s.switcherBtnActive]}
          >
            <Bot color={activeTab === 'analytics' ? '#1E3A5F' : '#FFFFFF'} size={15} />
            <Text style={[s.switcherText, activeTab === 'analytics' && s.switcherTextActive]}>
              Phân Tích AI
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('ranking')}
            style={[s.switcherBtn, activeTab === 'ranking' && s.switcherBtnActive]}
          >
            <Trophy color={activeTab === 'ranking' ? '#1E3A5F' : '#FFFFFF'} size={15} />
            <Text style={[s.switcherText, activeTab === 'ranking' && s.switcherTextActive]}>
              Xếp Hạng
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: TIẾN ĐỘ HỌC TẬP (MATCHING USER SCREENSHOT) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'progress' && (
          <View>
            {/* Section Header Row */}
            <Animated.View entering={FadeInDown.delay(50)} style={s.progressSectionHeader}>
              <View style={s.progressSectionTitleWrap}>
                <Text style={{ fontSize: 16 }}>📊</Text>
                <Text style={s.progressSectionTitle}>Tiến độ học tập</Text>
              </View>

              <Pressable
                onPress={() => alert('Chọn mốc thời gian: Tuần này / Tháng này')}
                style={s.filterDropdownBtn}
              >
                <Text style={s.filterDropdownText}>{selectedFilter}</Text>
                <ChevronDown color="#64748B" size={14} />
              </Pressable>
            </Animated.View>

            {/* Streak Navy Card (Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.streakNavyCard}>
              <View style={s.streakFlameCircle}>
                <Flame color="#00BCD4" size={26} fill="#00BCD4" />
              </View>

              <Text style={s.streakMainTitle}>🔥 15 ngày liên tiếp</Text>
              <Text style={s.streakSubTitle}>Kỷ lục: 23 ngày</Text>

              {/* Day Checkboxes Row */}
              <View style={s.streakDaysRow}>
                {streakDays.map((item, idx) => (
                  <View key={idx} style={s.streakDayItem}>
                    <Text style={s.streakDayLabel}>{item.day}</Text>
                    <View style={[s.streakCheckSquare, item.checked && s.streakCheckSquareActive]}>
                      {item.checked && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* 3 Summary Stat Cards Row (Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(200)} style={s.threeStatsRow}>
              {/* Stat 1 */}
              <View style={s.threeStatCard}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>📚</Text>
                <Text style={s.threeStatVal}>127</Text>
                <Text style={s.threeStatLabel}>Từ đã thuộc</Text>
              </View>

              {/* Stat 2 */}
              <View style={s.threeStatCard}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🧠</Text>
                <Text style={s.threeStatVal}>82%</Text>
                <Text style={s.threeStatLabel}>Điểm Quiz</Text>
              </View>

              {/* Stat 3 */}
              <View style={s.threeStatCard}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>⏱</Text>
                <Text style={s.threeStatVal}>4.2h</Text>
                <Text style={s.threeStatLabel}>Thời gian</Text>
              </View>
            </Animated.View>

            {/* Biểu Đồ Kỹ Năng (Radar Pentagon Chart Card - Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(300)} style={s.card}>
              <Text style={s.cardTitleBig}>Biểu đồ kỹ năng</Text>

              <View style={s.radarContainer}>
                {/* Labels around Pentagon */}
                <Text style={[s.radarLabel, s.radarLabelTop]}>Từ vựng</Text>
                <Text style={[s.radarLabel, s.radarLabelRight]}>Ngữ pháp</Text>
                <Text style={[s.radarLabel, s.radarLabelBottomRight]}>Nói</Text>
                <Text style={[s.radarLabel, s.radarLabelBottomLeft]}>Đọc</Text>
                <Text style={[s.radarLabel, s.radarLabelLeft]}>Nghe</Text>

                <Svg height="200" width="200" viewBox="0 0 200 200">
                  {/* Grid Pentagons (3 concentric rings) */}
                  <Polygon points={getPentagonPoints(65)} fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <Polygon points={getPentagonPoints(45)} fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <Polygon points={getPentagonPoints(25)} fill="none" stroke="#E2E8F0" strokeWidth="1" />

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
                        strokeDasharray="3,3"
                      />
                    );
                  })}

                  {/* Filled User Radar Shape */}
                  <Polygon
                    points={userSkillPoints}
                    fill="rgba(14, 165, 233, 0.2)"
                    stroke="#0EA5E9"
                    strokeWidth="2.5"
                  />

                  {/* Vertex Dots */}
                  {userSkillRatios.map((ratio, i) => {
                    const angle = (Math.PI / 180) * (i * 72 - 90);
                    const x = cx + maxR * ratio * Math.cos(angle);
                    const y = cy + maxR * ratio * Math.sin(angle);
                    return <Circle key={i} cx={x} cy={y} r="3.5" fill="#0EA5E9" />;
                  })}
                </Svg>
              </View>
            </Animated.View>

            {/* Thời Gian Học Mỗi Ngày (Bar Chart Card - Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.card}>
              <Text style={s.cardTitleBig}>Thời gian học mỗi ngày</Text>

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

            {/* Điểm Quiz Tuần Này (Curved Wave Line Chart Card - Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(500)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardTitleBig}>Điểm Quiz tuần này</Text>
                <View style={s.trendBadgeGreen}>
                  <TrendingUp color="#0284C7" size={14} />
                  <Text style={s.trendBadgeGreenText}>+12% vs tuần trước</Text>
                </View>
              </View>

              {/* Smooth Curved Line Chart */}
              <View style={{ height: 120, marginTop: 10 }}>
                <Svg height="100" width={SCREEN_WIDTH - 80} viewBox="0 0 300 100">
                  <Defs>
                    <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#0EA5E9" stopOpacity="0.35" />
                      <Stop offset="1" stopColor="#0EA5E9" stopOpacity="0" />
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
                    stroke="#1E3A5F"
                    strokeWidth="3"
                  />

                  {/* Data Point Dots */}
                  <Circle cx="70" cy="60" r="3.5" fill="#1E3A5F" />
                  <Circle cx="150" cy="45" r="3.5" fill="#1E3A5F" />
                  <Circle cx="290" cy="25" r="3.5" fill="#1E3A5F" />
                </Svg>

                <View style={s.lineChartDaysRow}>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                    <Text key={d} style={s.lineChartDayText}>{d}</Text>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Bottom Link CTA: Xem Báo Cáo PDF (Matching Screenshot) */}
            <Animated.View entering={FadeInDown.delay(600)} style={s.pdfCtaWrap}>
              <Pressable
                onPress={() => alert('Xuất báo cáo PDF học tập chi tiết...')}
                style={s.pdfBtn}
              >
                <Text style={s.pdfBtnText}>Xem báo cáo đầy đủ (PDF)</Text>
                <ArrowRight color="#1E3A5F" size={16} />
              </Pressable>

              <View style={s.premiumBadgePill}>
                <Award color="#0EA5E9" size={14} />
                <Text style={s.premiumBadgePillText}>Dành riêng cho Premium</Text>
              </View>
            </Animated.View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: PHÂN TÍCH AI CHUYÊN SÂU */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <View>
            {/* Skill Breakdown Progress Bars */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardTitleBig}>Đánh Giá Năng Lực Kỹ Năng</Text>
                <BookOpen color="#0EA5E9" size={18} />
              </View>

              {skillData.map((skill) => (
                <View key={skill.label} style={s.skillItem}>
                  <View style={s.skillLabelRow}>
                    <Text style={s.skillLabel}>{skill.label}</Text>
                    <Text style={s.skillScore}>{skill.score}/100</Text>
                  </View>
                  <View style={s.skillTrack}>
                    <Animated.View
                      style={[s.skillBar, skill.animStyle, { backgroundColor: skill.color }]}
                    />
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* 🤖 AI TRỢ LÝ PHÂN TÍCH SECTION */}
            <Animated.View entering={FadeInDown.delay(200)} style={s.aiSectionHeader}>
              <View style={s.aiSectionTitleRow}>
                <View style={s.botAvatarCircle}>
                  <Bot color="#0EA5E9" size={20} />
                </View>
                <View>
                  <View style={s.onlineBadgeRow}>
                    <Text style={s.aiSectionTitle}>AI Trợ Lý Phân Tích</Text>
                    <View style={s.greenDot} />
                    <Text style={s.onlineText}>TRỰC TUYẾN</Text>
                  </View>
                  <Text style={s.aiSectionSub}>Nhận xét & Gợi ý học tập cá nhân hóa 24/7</Text>
                </View>
              </View>
            </Animated.View>

            {/* Analysis Category Filter Chips */}
            <Animated.View entering={FadeInDown.delay(250)} style={s.chipsRow}>
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

            {/* 💡 CARD 1: GỢI Ý HỌC TẬP (YELLOW CARD DESIGN) */}
            <Animated.View entering={FadeInDown.delay(300)} style={s.tipCard}>
              <View style={s.tipCardHeaderRow}>
                <Lightbulb color="#D97706" size={16} />
                <Text style={s.tipCardTitle}>Gợi ý học tập từ AI</Text>
              </View>

              <Text style={s.tipCardContent}>
                "Bạn nên luyện thêm cấu trúc <Text style={{ fontWeight: '700', color: '#92400E' }}>'Make' vs 'Do'</Text> và các cụm từ collocations trong bài thi TOEIC để tăng 15% độ chính xác."
              </Text>

              <View style={s.suggestionChipsRow}>
                <Pressable
                  onPress={() => router.push('/(student)/assistant' as any)}
                  style={s.sugChipBtn}
                >
                  <Text style={s.sugChipText}>"Hỏi AI Trợ Lý..."</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(student)/learn' as any)}
                  style={s.sugChipBtn}
                >
                  <Text style={s.sugChipText}>"Luyện 5 câu Quiz..."</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* 📝 CARD 2: BẢNG PHÂN TÍCH CHUYÊN SÂU */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.structuredCard}>
              <Text style={s.structuredMainTitle}>Phân Tích Chi Tiết Năng Lực AI</Text>

              {/* Section 1: DO / Cần Cải Thiện */}
              <View style={s.structSection}>
                <View style={s.sectionBadgeRow}>
                  <Text style={{ fontSize: 14 }}>🛠️</Text>
                  <View style={s.blueTitleBadge}>
                    <Text style={s.blueTitleBadgeText}>CẦN CẢI THIỆN: Dễ nhầm 'Make' & 'Do'</Text>
                  </View>
                </View>
                <Text style={s.sectionDesc}>
                  Dùng cho các công việc hàng ngày hoặc nhiệm vụ không tạo ra vật thể mới. Bạn thường chọn nhầm 'make homework' thay vì 'do homework'.
                </Text>
                <View style={s.exampleQuoteBox}>
                  <Text style={s.exampleQuoteText}>
                    VD: Do homework, do business, do exercise, do research.
                  </Text>
                </View>
              </View>

              <View style={s.cardDivider} />

              {/* Section 2: MAKE / Điểm Mạnh */}
              <View style={s.structSection}>
                <View style={s.sectionBadgeRow}>
                  <Text style={{ fontSize: 14 }}>✨</Text>
                  <View style={s.yellowTitleBadge}>
                    <Text style={s.yellowTitleBadgeText}>ĐIỂM MẠNH: Phát Âm & Ngữ Điệu (88%)</Text>
                  </View>
                </View>
                <Text style={s.sectionDesc}>
                  Kỹ năng phát âm từ vựng 3 âm tiết đạt chuẩn bản ngữ. Giữ vững phong độ luyện tập âm IPA trọng âm.
                </Text>
                <View style={s.exampleQuoteBox}>
                  <Text style={s.exampleQuoteText}>
                    VD: Phenomenal /fəˈnæmənəl/, Resilient /rɪˈzɪl.jənt/.
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Direct Ask AI Input Card */}
            <Animated.View entering={FadeInDown.delay(500)} style={s.askAiCard}>
              <Text style={s.askAiTitle}>💬 Bạn có thắc mắc về điểm phân tích này?</Text>
              <Pressable
                onPress={() => router.push('/(student)/assistant' as any)}
                style={s.askAiBtn}
              >
                <Text style={s.askAiBtnText}>Trò chuyện trực tiếp với AI Trợ Lý ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: XẾP HẠNG (LEADERBOARD) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'ranking' && (
          <View>
            {/* League Header */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.card}>
              <View style={s.leagueHeaderRow}>
                <View style={s.leagueLeft}>
                  <Medal color="#0EA5E9" size={20} />
                  <Text style={s.leagueTitle}>Silver League</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>2 ngày 14h còn lại</Text>
                </View>
              </View>
              <Text style={s.leagueSub}>Top 3 thăng hạng Gold League • Cuối bảng xuống hạng Bronze</Text>
            </Animated.View>

            {/* Top 3 Podium */}
            <Animated.View entering={FadeInDown.delay(200)} style={[s.card, { paddingVertical: 24 }]}>
              <View style={s.podiumRow}>
                {/* Rank 2 */}
                <View style={s.podiumCol}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>🥈</Text>
                  <Image source={{ uri: leaderboard[1].avatar }} style={[s.podiumAvatar, { borderColor: '#BAE6FD' }]} />
                  <Text style={s.podiumName}>{leaderboard[1].name}</Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[s.podiumXp, { color: '#0EA5E9' }]}>{leaderboard[1].xp} XP</Text>
                  </View>
                  <View style={[s.podiumBar, { height: 56, backgroundColor: '#BAE6FD' }]} />
                </View>

                {/* Rank 1 */}
                <View style={[s.podiumCol, { marginTop: -24 }]}>
                  <Crown color="#F59E0B" size={24} fill="#F59E0B" />
                  <Image source={{ uri: leaderboard[0].avatar }} style={[s.podiumAvatarLg, { borderColor: '#0EA5E9' }]} />
                  <Text style={[s.podiumName, { color: '#1E3A5F', fontWeight: '800' }]}>{leaderboard[0].name}</Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#0EA5E9' }]}>
                    <Text style={[s.podiumXp, { color: '#FFF' }]}>{leaderboard[0].xp} XP</Text>
                  </View>
                  <View style={[s.podiumBar, { height: 80, backgroundColor: '#0EA5E9' }]} />
                </View>

                {/* Rank 3 */}
                <View style={s.podiumCol}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>🥉</Text>
                  <Image source={{ uri: leaderboard[2].avatar }} style={[s.podiumAvatar, { borderColor: '#7DD3FC' }]} />
                  <Text style={[s.podiumName, { color: '#0EA5E9' }]}>{leaderboard[2].name}</Text>
                  <View style={[s.podiumXpBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[s.podiumXp, { color: '#1E3A5F' }]}>{leaderboard[2].xp} XP</Text>
                  </View>
                  <View style={[s.podiumBar, { height: 40, backgroundColor: '#7DD3FC' }]} />
                </View>
              </View>
            </Animated.View>

            {/* Full Leaderboard */}
            <Animated.View entering={FadeInDown.delay(350)}>
              <Text style={[s.cardTitleBig, { marginBottom: 12 }]}>Bảng Xếp Hạng Đầy Đủ</Text>
              {leaderboard.map((member) => (
                <View key={member.rank} style={[s.lbRow, member.isMe && s.lbRowMe]}>
                  <View style={s.lbLeft}>
                    <View style={[s.rankBadge, { backgroundColor: getRankBadgeBg(member.rank) }]}>
                      <Text style={[s.rankText, member.rank > 3 && { color: '#1E3A5F' }]}>#{member.rank}</Text>
                    </View>
                    <Image source={{ uri: member.avatar }} style={s.lbAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.lbName, member.isMe && { color: '#0EA5E9' }]}>{member.name}</Text>
                      <Text style={s.lbXp}>{member.xp.toLocaleString()} XP tuần này</Text>
                    </View>
                  </View>
                  <View style={[s.trendBadge, { backgroundColor: member.trend === 'up' ? '#DCFCE7' : '#FEE2E2' }]}>
                    {member.trend === 'up' ? <ChevronUp color="#16A34A" size={16} /> : <ChevronDown color="#DC2626" size={16} />}
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* Your Position */}
            <Animated.View entering={FadeInDown.delay(500)} style={s.posCard}>
              <View style={s.posRow}>
                <View style={s.posRankCircle}>
                  <Text style={s.posRankText}>#3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.posTitle}>Vị Trí Của Bạn</Text>
                  <Text style={s.posSub}>Còn 80 XP nữa để lên hạng #2. Tiếp tục cố gắng! 💪</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAF9' },
  header: { paddingTop: 48, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A5F' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#0EA5E9' },
  switcherRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4, borderRadius: 16 },
  switcherBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  switcherBtnActive: { backgroundColor: '#1E3A5F' },
  switcherText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  switcherTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Progress Section Styles (Matching Screenshot)
  progressSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  progressSectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  filterDropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: '#E2E8F0' },
  filterDropdownText: { fontSize: 11, fontWeight: '700', color: '#475569' },

  // Streak Navy Card (Matching Screenshot)
  streakNavyCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  streakFlameCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 188, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.4)',
  },
  streakMainTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  streakSubTitle: { fontSize: 11, color: '#7DD3FC', fontWeight: '600', marginBottom: 16 },
  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  streakDayItem: { alignItems: 'center', flex: 1 },
  streakDayLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  streakCheckSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  streakCheckSquareActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },

  // 3 Summary Stat Cards Row (Matching Screenshot)
  threeStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  threeStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  threeStatVal: { fontSize: 18, fontWeight: '800', color: '#1E3A5F' },
  threeStatLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },

  // Cards
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleBig: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 12 },

  // Radar Pentagon Styles
  radarContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', height: 200, marginVertical: 10 },
  radarLabel: { position: 'absolute', fontSize: 10, fontWeight: '700', color: '#475569' },
  radarLabelTop: { top: 0, alignSelf: 'center' },
  radarLabelRight: { right: 10, top: 45 },
  radarLabelBottomRight: { right: 35, bottom: 5 },
  radarLabelBottomLeft: { left: 35, bottom: 5 },
  radarLabelLeft: { left: 10, top: 45 },

  // Bar Chart
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, paddingHorizontal: 4 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBarTrack: { width: 22, height: 80, backgroundColor: '#F1F5F9', borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  chartDay: { fontSize: 10, fontWeight: '600', marginTop: 6, color: '#94A3B8' },

  // Line Chart Trend Badge
  trendBadgeGreen: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  trendBadgeGreenText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  lineChartDaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 4 },
  lineChartDayText: { fontSize: 9, fontWeight: '600', color: '#94A3B8' },

  // PDF CTA
  pdfCtaWrap: { alignItems: 'center', marginVertical: 10 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pdfBtnText: { fontSize: 14, fontWeight: '800', color: '#1E3A5F' },
  premiumBadgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: '#BAE6FD' },
  premiumBadgePillText: { fontSize: 11, fontWeight: '700', color: '#0EA5E9' },

  // Skill Items
  skillItem: { marginBottom: 14 },
  skillLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skillLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  skillScore: { fontSize: 12, fontWeight: '700', color: '#0EA5E9' },
  skillTrack: { height: 10, backgroundColor: '#EFF6FF', borderRadius: 100, overflow: 'hidden' },
  skillBar: { height: '100%', borderRadius: 100 },

  // AI Section
  aiSectionHeader: { marginTop: 6, marginBottom: 12 },
  aiSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botAvatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E0F2FE', borderWidth: 2, borderColor: '#BAE6FD', justifyContent: 'center', alignItems: 'center' },
  onlineBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  onlineText: { fontSize: 9, fontWeight: '800', color: '#22C55E', letterSpacing: 0.5 },
  aiSectionSub: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DBEAFE' },
  chipBtnActive: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#4B4033' },
  chipTextActive: { color: '#FFFFFF' },
  tipCard: { backgroundColor: '#FEF9E7', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F5E6B8', marginBottom: 16 },
  tipCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipCardTitle: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  tipCardContent: { fontSize: 13, color: '#4B4033', fontWeight: '500', lineHeight: 20, marginBottom: 12 },
  suggestionChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sugChipBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: '#E8DFD0' },
  sugChipText: { fontSize: 11, fontWeight: '600', color: '#4B4033' },
  structuredCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 16 },
  structuredMainTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 14 },
  structSection: { marginBottom: 4 },
  sectionBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  blueTitleBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  blueTitleBadgeText: { fontSize: 12, fontWeight: '800', color: '#0EA5E9' },
  yellowTitleBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yellowTitleBadgeText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  sectionDesc: { fontSize: 12, color: '#4B4033', fontWeight: '500', lineHeight: 18, marginBottom: 8 },
  exampleQuoteBox: { borderLeftWidth: 3, borderLeftColor: '#DBEAFE', paddingLeft: 10, paddingVertical: 2 },
  exampleQuoteText: { fontSize: 11, color: '#64748B', fontStyle: 'italic', lineHeight: 16 },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  askAiCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 20, alignItems: 'center' },
  askAiTitle: { fontSize: 12, fontWeight: '700', color: '#1E3A5F', marginBottom: 10 },
  askAiBtn: { backgroundColor: '#1E3A5F', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  askAiBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  // Leaderboard
  badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#0EA5E9' },
  leagueHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leagueLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leagueTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  leagueSub: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumCol: { alignItems: 'center' },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, marginBottom: 4 },
  podiumAvatarLg: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, marginBottom: 4, marginTop: 4 },
  podiumName: { fontSize: 11, fontWeight: '700', color: '#334155' },
  podiumXpBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, marginTop: 4 },
  podiumXp: { fontSize: 10, fontWeight: '800' },
  podiumBar: { width: 64, borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 8 },
  lbRow: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  lbRowMe: { borderColor: '#0EA5E9', backgroundColor: '#EFF6FF' },
  lbLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  lbAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  lbName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  lbXp: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  trendBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  posCard: { backgroundColor: '#1E3A5F', padding: 20, borderRadius: 24, marginTop: 20, marginBottom: 20 },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  posRankCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  posRankText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  posTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  posSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
});
