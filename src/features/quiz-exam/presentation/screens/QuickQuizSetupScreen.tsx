import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Zap,
  Minus,
  Plus,
  Check,
  ListChecks,
  PenLine,
  Sparkles,
  ArrowUpDown,
  Play,
  HelpCircle,
  Flame,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors, palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { usePulseRing } from '@/src/hooks/usePulseRing';

type QuestionType = 'trac_nghiem' | 'dien_tu' | 'ghep_noi' | 'sap_xep';

interface QuestionTypeConfig {
  key: QuestionType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accentColor: string;
  accentBg: string;
}

const QUESTION_TYPES: QuestionTypeConfig[] = [
  {
    key: 'trac_nghiem',
    label: 'Trắc nghiệm',
    desc: 'Chọn đáp án chính xác',
    icon: ListChecks,
    accentColor: '#0284C7',
    accentBg: '#E0F2FE',
  },
  {
    key: 'dien_tu',
    label: 'Điền từ',
    desc: 'Gõ từ vào chỗ trống',
    icon: PenLine,
    accentColor: '#EA580C',
    accentBg: '#FFEDD5',
  },
  {
    key: 'ghep_noi',
    label: 'Ghép nối',
    desc: 'Nối từ và nghĩa tương ứng',
    icon: Sparkles,
    accentColor: '#8B5CF6',
    accentBg: '#F3E8FF',
  },
  {
    key: 'sap_xep',
    label: 'Sắp xếp câu',
    desc: 'Ghép từ thành câu hoàn chỉnh',
    icon: ArrowUpDown,
    accentColor: '#059669',
    accentBg: '#D1FAE5',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QuestionTypeCard: React.FC<{
  typeConfig: QuestionTypeConfig;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ typeConfig, isSelected, onToggle }) => {
  const spring = usePressSpring(0.96);
  const IconComp = typeConfig.icon;

  return (
    <AnimatedPressable
      onPress={onToggle}
      onPressIn={spring.onPressIn}
      onPressOut={spring.onPressOut}
      style={[
        styles.typeCard,
        isSelected && {
          borderColor: typeConfig.accentColor,
          backgroundColor: typeConfig.accentBg,
        },
        spring.animatedStyle,
      ]}
    >
      <View style={styles.typeCardTop}>
        <View
          style={[
            styles.typeIconBox,
            { backgroundColor: isSelected ? '#FFFFFF' : typeConfig.accentBg },
          ]}
        >
          <IconComp size={20} color={typeConfig.accentColor} strokeWidth={2.5} />
        </View>

        <View
          style={[
            styles.checkCircle,
            isSelected && {
              backgroundColor: typeConfig.accentColor,
              borderColor: typeConfig.accentColor,
            },
          ]}
        >
          {isSelected && <Check color="#FFFFFF" size={12} strokeWidth={3.5} />}
        </View>
      </View>

      <Text style={[styles.typeLabel, isSelected && { color: typeConfig.accentColor }]}>
        {typeConfig.label}
      </Text>
      <Text style={styles.typeDesc}>{typeConfig.desc}</Text>
    </AnimatedPressable>
  );
};

export const QuickQuizSetupScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'trac_nghiem',
    'dien_tu',
  ]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');

  const heroBtnSpring = usePressSpring(0.96);
  const startBtnSpring = usePressSpring(0.97);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const topics = ['Tất cả', 'Du lịch', 'TOEIC', 'Công nghệ & AI', 'Giao tiếp hàng ngày'];

  const handleStartQuiz = () => {
    if (selectedTypes.length === 0) return;
    router.push({
      pathname: '/(student)/practice/quiz/play' as any,
      params: {
        types: selectedTypes.join(','),
        count: questionCount.toString(),
        topic: selectedTopic,
      },
    });
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeRow}>
            <Zap color={colors.primary} size={14} fill={colors.primary} />
            <Text style={styles.headerSubtitle}>ĐẤU TRƯỜNG THÔNG MINH</Text>
          </View>
          <Text style={styles.headerTitle}>AI Quiz Master</Text>
        </View>

        <Image
          source={{
            uri:
              currentUser?.avatar_url ||
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          style={styles.avatar}
        />
      </Animated.View>

      <View style={styles.container}>
        {/* Banner Quick Quiz Hero Gradient */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <LinearGradient
            colors={['#1E1B4B', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroHeader}>
              <View style={styles.zapIconWrap}>
                <Flame color="#F59E0B" size={20} fill="#F59E0B" />
              </View>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>THỬ THÁCH SIÊU TỐC</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Quiz Phản Xạ Hàng Ngày</Text>
            <Text style={styles.heroSub}>
              AI tự động tổng hợp 10 câu hỏi từ các bài học & bộ thẻ bạn cần ôn tập nhất hôm nay.
            </Text>

            <AnimatedPressable
              onPress={handleStartQuiz}
              onPressIn={heroBtnSpring.onPressIn}
              onPressOut={heroBtnSpring.onPressOut}
              style={[styles.heroBtn, heroBtnSpring.animatedStyle]}
            >
              <Play color={colors.primary} size={16} fill={colors.primary} />
              <Text style={styles.heroBtnText}>Bắt đầu ngay</Text>
            </AnimatedPressable>
          </LinearGradient>
        </Animated.View>

        {/* Setup Custom Quiz Section */}
        <Animated.View entering={FadeInDown.delay(140).duration(300)}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tùy Chỉnh Bài Thi</Text>
            <Text style={styles.sectionSubTitle}>Tự thiết lập dạng câu hỏi bạn muốn rèn luyện</Text>
          </View>

          {/* Question Type Selection Grid */}
          <Text style={styles.inputLabel}>Dạng câu hỏi ({selectedTypes.length} đã chọn)</Text>
          <View style={styles.typeGrid}>
            {QUESTION_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type.key);
              return (
                <QuestionTypeCard
                  key={type.key}
                  typeConfig={type}
                  isSelected={isSelected}
                  onToggle={() => toggleType(type.key)}
                />
              );
            })}
          </View>

          {/* Question Count Adjuster Stepper */}
          <Text style={styles.inputLabel}>Số lượng câu hỏi</Text>
          <View style={styles.counterRow}>
            <View>
              <Text style={styles.counterTitle}>Tổng số câu thi</Text>
              <Text style={styles.counterSub}>Thời gian dự kiến: ~{questionCount * 30}s</Text>
            </View>

            <View style={styles.counterActions}>
              <Pressable
                onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
                style={styles.countBtn}
              >
                <Minus color={palette.text} size={16} strokeWidth={2.5} />
              </Pressable>

              <Text style={styles.countText}>{questionCount}</Text>

              <Pressable
                onPress={() => setQuestionCount(Math.min(30, questionCount + 5))}
                style={styles.countBtn}
              >
                <Plus color={palette.text} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Topic Selector Chips */}
          <Text style={styles.inputLabel}>Chủ đề từ vựng</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicScroll}
            contentContainerStyle={styles.topicScrollContent}
          >
            {topics.map((topic) => {
              const isSelected = selectedTopic === topic;
              return (
                <Pressable
                  key={topic}
                  onPress={() => setSelectedTopic(topic)}
                  style={[styles.topicChip, isSelected && styles.topicChipActive]}
                >
                  <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>
                    {topic}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Main Action CTA Button */}
          <AnimatedPressable
            onPress={handleStartQuiz}
            onPressIn={startBtnSpring.onPressIn}
            onPressOut={startBtnSpring.onPressOut}
            disabled={selectedTypes.length === 0}
            style={[
              styles.startBtnWrapper,
              selectedTypes.length === 0 && { opacity: 0.5 },
              startBtnSpring.animatedStyle,
            ]}
          >
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startBtnGradient}
            >
              <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
              <Text style={styles.startBtnText}>Tạo & Bắt Đầu Bài Thi</Text>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  headerBar: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 26,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  zapIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroTagText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 19,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 16,
    lineHeight: 18,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroBtnText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionHeaderRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  sectionSubTitle: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    lineHeight: 14,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  counterTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  counterSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  counterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    minWidth: 26,
    textAlign: 'center',
  },
  topicScroll: {
    marginBottom: 28,
  },
  topicScrollContent: {
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.8)',
  },
  topicChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
  },
  topicTextActive: {
    color: '#FFFFFF',
  },
  startBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  startBtnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
