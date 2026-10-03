import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  StyleSheet,
} from 'react-native';
import Animated, { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ScanText,
  Aperture,
  BookOpen,
  MessageSquare,
  BrainCircuit,
  Zap,
  ChevronRight,
  Compass,
  Flame,
  CheckCircle2,
  Volume2,
  Bookmark,
  Coins,
  Target,
  Sparkles,
  Timer,
  Play,
  Gift,
  Award,
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { speakText } from '@/src/core/services/speechService';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';
import { colors, palette, font } from '@/src/theme';
import { cardGradients, cardShadowColors, heroGradient } from '@/src/theme/gradients';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { useStaggerReveal } from '@/src/hooks/useStaggerReveal';
import { usePulseRing } from '@/src/hooks/usePulseRing';
import { useCountUp } from '@/src/hooks/useCountUp';

const AnimatedText = Animated.createAnimatedComponent(Text);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// GradientCard: card tính năng với gradient màu riêng và icon trắng
type GradientCardProps = {
  gradient: readonly [string, string];
  shadowColor: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  animatedStyle: object;
  onPressIn: () => void;
  onPressOut: () => void;
};
function GradientCard({ gradient, shadowColor, icon, label, onPress, animatedStyle, onPressIn, onPressOut }: GradientCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[s.gradientCardWrap, { shadowColor }, animatedStyle]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientCardInner}
      >
        <View style={s.gradientIconBox}>{icon}</View>
        <Text style={s.gradientCardLabel}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, userStats } = useAuthStore();
  const { saveWordsToDeck } = useDeckStore();

  const [isPlayingDailyWord, setIsPlayingDailyWord] = useState(false);
  const [isDailyWordSaved, setIsDailyWordSaved] = useState(false);

  // Greeting theo giờ
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Buổi sáng' : hour < 18 ? '☀️ Buổi chiều' : '🌙 Buổi tối';

  // Pulse ring cho avatar
  const { ringStyle } = usePulseRing(true);

  // XP count-up: sync DerivedValue -> React state
  const [displayXp, setDisplayXp] = useState(0);
  const animatedXp = useCountUp(userStats?.xp_total ?? 0, 800);
  useAnimatedReaction(
    () => animatedXp.value,
    (current) => runOnJS(setDisplayXp)(current)
  );

  // Motion Springs — grid cards dùng 0.93 cho cảm giác chắc hơn
  const scanSpring = usePressSpring(0.93);
  const flashcardSpring = usePressSpring(0.93);
  const chatSpring = usePressSpring(0.93);
  const quizSpring = usePressSpring(0.93);
  const heroSpring = usePressSpring(0.98);
  const continueSpring = usePressSpring(0.98);
  const blitzSpring = usePressSpring(0.97);

  // Stagger Animations
  const animHeader = useStaggerReveal(0, 50);
  const animStats = useStaggerReveal(1, 50);
  const animHero = useStaggerReveal(2, 50);
  const animGrid = useStaggerReveal(3, 50);
  const animQuests = useStaggerReveal(4, 50);
  const animDaily = useStaggerReveal(5, 50);
  const animBlitz = useStaggerReveal(6, 50);

  // Daily Quests Data & State
  type DailyQuest = {
    id: string;
    icon: string;
    title: string;
    current: number;
    target: number;
    xp: number;
    unit: string;
    claimed: boolean;
    route: string;
  };

  const [quests, setQuests] = useState<DailyQuest[]>([
    {
      id: 'q1',
      icon: '🗂️',
      title: 'Ôn tập thẻ Flashcard SRS',
      current: 8,
      target: 10,
      xp: 20,
      unit: 'thẻ',
      claimed: false,
      route: '/(student)/review',
    },
    {
      id: 'q2',
      icon: '🎯',
      title: 'Hoàn thành 1 bài Quiz đạt 80%+',
      current: 1,
      target: 1,
      xp: 30,
      unit: 'bài',
      claimed: false,
      route: '/(student)/practice/quiz/quiz-101',
    },
    {
      id: 'q3',
      icon: '🎙️',
      title: 'Luyện phát âm & giao tiếp',
      current: 3,
      target: 3,
      xp: 25,
      unit: 'phút',
      claimed: true,
      route: '/(student)/learn',
    },
  ]);

  const handleClaimQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, claimed: true } : q))
    );
  };

  const completedQuestsCount = quests.filter((q) => q.current >= q.target).length;

  // Featured Daily Word
  const dailyWord = {
    word_id: 'w-ubiquitous-today',
    word: 'Ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    pos: 'Adj',
    meaning_vi: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi',
    example: 'Mobile phones and AI tools have become ubiquitous in daily life.',
    example_vi: 'Điện thoại di động và các công cụ AI đã trở nên phổ biến khắp nơi trong đời sống.',
  };

  const handlePlayDailyWord = () => {
    setIsPlayingDailyWord(true);
    speakText(dailyWord.word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setIsPlayingDailyWord(false),
      onError: () => setIsPlayingDailyWord(false),
    });
  };

  const handleSaveDailyWord = () => {
    saveWordsToDeck('deck-1', [dailyWord]);
    setIsDailyWordSaved(true);
  };

  const safeTop = Math.max(insets.top, 48) + 12;

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.contentContainer, { paddingTop: safeTop }]} showsVerticalScrollIndicator={false}>
      {/* Top Header Row */}
      <Animated.View style={[s.headerRow, animHeader]}>
        <Pressable onPress={() => router.push('/(student)/profile' as any)} style={s.profileTouch}>
          {/* Avatar + pulse ring */}
          <View style={s.avatarContainer}>
            <Animated.View style={[s.avatarRing, ringStyle]} />
            <Image
              source={{
                uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
              }}
              style={s.avatar}
            />
          </View>
          <View>
            <Text style={s.greetingText}>{greeting}, {currentUser?.display_name || 'Học Viên'}</Text>
            <Text style={s.brandTitle}>Loxera English</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(student)/notifications' as any)}
          style={s.bellBtn}
        >
          <Bell color={palette.textSoft} size={20} />
          <View style={s.bellBadge} />
        </Pressable>
      </Animated.View>

      {/* Stats Bar — Họ màu ấm tách biệt với Brand */}
      <Animated.View style={[s.statsBar, animStats]}>
        {/* Streak: Lửa cam + nền streakSoft */}
        <View style={s.streakChip}>
          <Flame color={colors.streak} size={18} fill={colors.streak} />
          <Text style={s.streakText}>{userStats?.streak_current ?? 0} ngày</Text>
        </View>

        {/* XP Progress: Vàng-cam + count-up animation */}
        <View style={s.xpSection}>
          <View style={s.xpRow}>
            <Zap color={colors.xpDeep} size={14} fill={colors.xpDeep} />
            <Text style={s.xpText}>{displayXp.toLocaleString('vi-VN')} XP</Text>
            <Text style={s.levelTag}>LVL {userStats?.level ?? 1}</Text>
          </View>
          <View style={s.xpProgressBg}>
            <View style={[s.xpProgressFill, { width: `${Math.min(((userStats?.xp_this_week ?? 0) / Math.max((userStats?.level ?? 1) * 500, 100)) * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Coins: Vàng kim + nền coinSoft */}
        <View style={s.coinChip}>
          <Coins color={colors.coin} size={16} />
          <Text style={s.coinText}>{userStats?.coins ?? 0}</Text>
        </View>
      </Animated.View>

      {/* HERO FEATURED BANNER: Brand gradient */}
      <Animated.View style={animHero}>
        <AnimatedPressable
          onPress={() => router.push('/(student)/practice/scan' as any)}
          onPressIn={heroSpring.onPressIn}
          onPressOut={heroSpring.onPressOut}
          style={[s.heroBannerWrapper, heroSpring.animatedStyle]}
        >
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.heroBannerGradient}
          >
            <View style={s.heroContent}>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>✨ Tính năng nổi bật</Text>
              </View>

              <Text style={s.heroTitle}>Khám phá từ vựng qua ảnh</Text>
              <Text style={s.heroSub}>
                Chụp hoặc tải ảnh vật thể để tự động tạo thẻ ghi nhớ.
              </Text>

              <View style={s.heroCta}>
                <Aperture color={palette.primary} size={16} />
                <Text style={s.heroCtaText}>Thử ngay</Text>
              </View>
            </View>

            <View style={s.mascotWrap}>
              <LoxeraFoxMascot size={110} showGlow={false} showBook={false} animated />
            </View>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      {/* 4 Quick Action Cards Grid — gradient màu riêng mỗi card */}
      <Animated.View style={animGrid}>
        <Text style={s.sectionHeader}>Tính năng</Text>
        <View style={s.gridRow}>
          <GradientCard
            gradient={cardGradients.scan}
            shadowColor={cardShadowColors.scan}
            icon={<ScanText color="#FFFFFF" size={24} strokeWidth={2} />}
            label="Quét Ảnh"
            onPress={() => router.push('/(student)/practice/scan' as any)}
            animatedStyle={scanSpring.animatedStyle}
            onPressIn={scanSpring.onPressIn}
            onPressOut={scanSpring.onPressOut}
          />
          <GradientCard
            gradient={cardGradients.flashcard}
            shadowColor={cardShadowColors.flashcard}
            icon={<BookOpen color="#FFFFFF" size={24} strokeWidth={2} />}
            label="Flashcard"
            onPress={() => router.push('/(student)/review' as any)}
            animatedStyle={flashcardSpring.animatedStyle}
            onPressIn={flashcardSpring.onPressIn}
            onPressOut={flashcardSpring.onPressOut}
          />
          <GradientCard
            gradient={cardGradients.chat}
            shadowColor={cardShadowColors.chat}
            icon={<MessageSquare color="#FFFFFF" size={24} strokeWidth={2} />}
            label="Hội Thoại"
            onPress={() => router.push('/(student)/assistant' as any)}
            animatedStyle={chatSpring.animatedStyle}
            onPressIn={chatSpring.onPressIn}
            onPressOut={chatSpring.onPressOut}
          />
          <GradientCard
            gradient={cardGradients.quiz}
            shadowColor={cardShadowColors.quiz}
            icon={<BrainCircuit color="#FFFFFF" size={24} strokeWidth={2} />}
            label="Kiểm Tra"
            onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
            animatedStyle={quizSpring.animatedStyle}
            onPressIn={quizSpring.onPressIn}
            onPressOut={quizSpring.onPressOut}
          />
        </View>
      </Animated.View>

      {/* Daily Quests Section (Nhiệm vụ hàng ngày) */}
      <Animated.View style={[s.questsCard, animQuests]}>
        <View style={s.questsHeaderRow}>
          <View style={s.questsHeaderLeft}>
            <View style={s.targetIconWrap}>
              <Target color={palette.primary} size={18} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={s.questsHeaderTitle}>Nhiệm vụ hôm nay</Text>
              <Text style={s.questsHeaderSub}>{completedQuestsCount}/3 nhiệm vụ đã hoàn thành</Text>
            </View>
          </View>

          <View style={s.questsRewardPill}>
            <Gift color={colors.xpDeep} size={14} />
            <Text style={s.questsRewardText}>+75 XP</Text>
          </View>
        </View>

        {/* Quests List */}
        <View style={s.questList}>
          {quests.map((quest) => {
            const isDone = quest.current >= quest.target;
            const progressPct = Math.min((quest.current / quest.target) * 100, 100);

            return (
              <View key={quest.id} style={s.questItem}>
                <View style={s.questIconBox}>
                  <Text style={{ fontSize: 20 }}>{quest.icon}</Text>
                </View>

                <View style={s.questCenter}>
                  <Text style={s.questTitle} numberOfLines={1}>{quest.title}</Text>
                  <View style={s.questProgressRow}>
                    <View style={s.questProgressBg}>
                      <View style={[s.questProgressFill, { width: `${progressPct}%`, backgroundColor: isDone ? palette.success : palette.primary }]} />
                    </View>
                    <Text style={s.questProgressLabel}>{quest.current}/{quest.target} {quest.unit}</Text>
                  </View>
                </View>

                {quest.claimed ? (
                  <View style={s.questClaimedBadge}>
                    <CheckCircle2 color={palette.success} size={14} />
                    <Text style={s.questClaimedText}>Đã nhận</Text>
                  </View>
                ) : isDone ? (
                  <Pressable
                    onPress={() => handleClaimQuest(quest.id)}
                    style={s.questClaimBtn}
                  >
                    <Zap color="#FFFFFF" size={12} fill="#FFFFFF" />
                    <Text style={s.questClaimBtnText}>+{quest.xp} XP</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => router.push(quest.route as any)}
                    style={s.questGoBtn}
                  >
                    <Text style={s.questGoBtnText}>Làm</Text>
                    <ChevronRight color={palette.primary} size={13} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* ⚡ Blitz 60s Mini Challenge Banner */}
      <Animated.View style={animBlitz}>
        <AnimatedPressable
          onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
          onPressIn={blitzSpring.onPressIn}
          onPressOut={blitzSpring.onPressOut}
          style={[s.blitzBannerWrap, blitzSpring.animatedStyle]}
        >
          <LinearGradient
            colors={['#7C3AED', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.blitzBannerInner}
          >
            <View style={s.blitzLeftCol}>
              <View style={s.blitzTag}>
                <Timer color="#FFFFFF" size={12} />
                <Text style={s.blitzTagText}>Thử thách chớp nhoáng</Text>
              </View>
              <Text style={s.blitzTitle}>⚡ Blitz 60 Giây — Phản Xạ Từ</Text>
              <Text style={s.blitzSub}>Đoán nhanh 10 từ vựng để nhân đôi điểm XP!</Text>
            </View>

            <View style={s.blitzPlayBtn}>
              <Play color="#7C3AED" size={16} fill="#7C3AED" />
              <Text style={s.blitzPlayText}>Chơi</Text>
            </View>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      {/* Daily Vocabulary Card (Nâng cấp tương tác) */}
      <Animated.View style={[s.dailyCard, animDaily]}>
        <View style={s.dailyTopRow}>
          <View style={s.dailyTag}>
            <Sparkles color={palette.primary} size={13} />
            <Text style={s.dailyTagText}>Từ vựng hôm nay</Text>
          </View>

          <Pressable
            onPress={handlePlayDailyWord}
            style={[
              s.audioBtn,
              isPlayingDailyWord && s.audioBtnActive
            ]}
          >
            <Volume2 color={isPlayingDailyWord ? '#FFFFFF' : palette.primary} size={18} />
          </Pressable>
        </View>

        <View style={s.wordRow}>
          <View style={s.wordTitleWrap}>
            <Text style={s.wordText}>{dailyWord.word}</Text>
            <View style={s.posTag}>
              <Text style={s.posText}>{dailyWord.pos}</Text>
            </View>
          </View>

          <Pressable
            onPress={handleSaveDailyWord}
            style={[
              s.saveBtn,
              isDailyWordSaved && s.saveBtnActive
            ]}
          >
            {isDailyWordSaved ? (
              <>
                <CheckCircle2 color={palette.success} size={14} />
                <Text style={s.saveBtnTextSaved}>Đã Lưu</Text>
              </>
            ) : (
              <>
                <Bookmark color="#FFFFFF" size={14} fill="#FFFFFF" />
                <Text style={s.saveBtnText}>Lưu Thẻ</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={s.phoneticText}>{dailyWord.phonetic} • <Text style={s.meaningText}>{dailyWord.meaning_vi}</Text></Text>
        
        <View style={s.exampleBox}>
          <Text style={s.exampleText}>"{dailyWord.example}"</Text>
          <Text style={s.exampleViText}>➔ {dailyWord.example_vi}</Text>
        </View>
      </Animated.View>

      {/* Continue Learning Section */}
      <View style={s.sectionRow}>
        <Text style={s.sectionHeader}>Tiếp tục học</Text>
        <Pressable onPress={() => router.push('/(student)/learn' as any)}>
          <Text style={s.seeAllText}>Xem tất cả</Text>
        </Pressable>
      </View>

      <AnimatedPressable
        onPress={() => router.push('/(student)/review/decks/d-1/study' as any)}
        onPressIn={continueSpring.onPressIn}
        onPressOut={continueSpring.onPressOut}
        style={[s.continueCard, continueSpring.animatedStyle]}
      >
        <View style={s.continueLeft}>
          <View style={s.continueIconCircle}>
            <Compass color={palette.primary} size={22} />
          </View>
          <View style={s.continueTextWrap}>
            <Text style={s.continueTitle}>Từ vựng Du lịch — Bộ 3</Text>
            <Text style={s.continueSub}>18/50 từ đã học</Text>
          </View>
        </View>

        <View style={s.continueCtaBtn}>
          <Text style={s.continueCtaText}>Tiếp tục</Text>
        </View>
      </AnimatedPressable>

      {/* Live Class Notification */}
      <Pressable
        onPress={() => router.push('/(student)/profile/classes' as any)}
        style={s.liveCard}
      >
        <View style={s.liveLeft}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' }}
            style={s.liveAvatar}
          />
          <View>
            <Text style={s.liveBadge}>● TRỰC TIẾP</Text>
            <Text style={s.liveTitle}>Lớp của Cô Sarah: Giao tiếp</Text>
          </View>
        </View>

        <ChevronRight color={palette.textSoft} size={20} />
      </Pressable>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,   // overridden dynamically via insets
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
  profileTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: colors.secondary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: palette.primarySoft,
  },
  greetingText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.danger,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statsBar: {
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.streakSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.streakDeep,
  },
  xpSection: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  xpText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.xpDeep,
  },
  levelTag: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '600',
    color: colors.textSoft,
  },
  xpProgressBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.xpSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: colors.xp,
    borderRadius: 3,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.coinSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  coinText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.coin,
  },
  heroBannerWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  heroBannerGradient: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    marginRight: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 26,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 17,
  },
  heroCta: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCtaText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  // Gradient card styles
  gradientCardWrap: {
    width: '48%',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientCardInner: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  gradientIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gradientCardLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dailyCard: {
    backgroundColor: palette.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 24,
  },
  dailyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dailyTagText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  audioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnActive: {
    backgroundColor: palette.primary,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordText: {
    fontSize: 32,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: -0.5,
  },
  posTag: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  posText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  saveBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveBtnActive: {
    backgroundColor: 'rgba(31, 174, 122, 0.12)',
  },
  saveBtnText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveBtnTextSaved: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.success,
  },
  phoneticText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.textSoft,
    marginBottom: 8,
  },
  // Daily Quests Styles
  questsCard: {
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  questsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  questsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questsHeaderTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  questsHeaderSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  questsRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.xpSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.xpBorder,
  },
  questsRewardText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.xpDeep,
  },
  questList: {
    gap: 10,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.bg,
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  questIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCenter: {
    flex: 1,
  },
  questTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 4,
  },
  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questProgressBg: {
    flex: 1,
    height: 5,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questProgressLabel: {
    fontSize: 10,
    fontFamily: font.family,
    color: palette.textSoft,
    fontWeight: '600',
  },
  questClaimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  questClaimedText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.success,
  },
  questClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.xpDeep,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  questClaimBtnText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: palette.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  questGoBtnText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },

  // Blitz Banner Styles
  blitzBannerWrap: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  blitzBannerInner: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blitzLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  blitzTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  blitzTagText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  blitzTitle: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  blitzSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  blitzPlayBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  blitzPlayText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#7C3AED',
  },

  meaningText: {
    color: palette.text,
    fontWeight: '600',
  },
  exampleBox: {
    backgroundColor: palette.bg,
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.text,
    fontStyle: 'italic',
  },
  exampleViText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  continueCard: {
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  continueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  continueIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTextWrap: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  continueSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  continueCtaBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  continueCtaText: {
    color: '#FFFFFF',
    fontFamily: font.family,
    fontWeight: '600',
    fontSize: 12,
  },
  liveCard: {
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  liveAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  liveBadge: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.danger,
    marginBottom: 2,
  },
  liveTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
});

