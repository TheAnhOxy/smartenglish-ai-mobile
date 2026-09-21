import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ScanText,
  Aperture,
  BookOpen,
  MessageSquare,
  BrainCircuit,
  Sparkles,
  Zap,
  ChevronRight,
  Compass,
  Flame,
  CheckCircle2,
  Volume2,
  Bookmark,
  Coins,
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { LoxeraFoxMascot } from '@/src/core/components/LoxeraFoxMascot';
import { speakText } from '@/src/core/services/speechService';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';
import { colors, palette, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';
import { useStaggerReveal } from '@/src/hooks/useStaggerReveal';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, userStats } = useAuthStore();
  const { saveWordsToDeck } = useDeckStore();

  const [isPlayingDailyWord, setIsPlayingDailyWord] = useState(false);
  const [isDailyWordSaved, setIsDailyWordSaved] = useState(false);

  // Motion Springs
  const scanSpring = usePressSpring(0.97);
  const flashcardSpring = usePressSpring(0.97);
  const chatSpring = usePressSpring(0.97);
  const quizSpring = usePressSpring(0.97);
  const heroSpring = usePressSpring(0.98);
  const continueSpring = usePressSpring(0.98);

  // Stagger Animations
  const animHeader = useStaggerReveal(0, 50);
  const animStats = useStaggerReveal(1, 50);
  const animHero = useStaggerReveal(2, 50);
  const animGrid = useStaggerReveal(3, 50);
  const animDaily = useStaggerReveal(4, 50);

  // Featured Daily Word
  const dailyWord = {
    word_id: 'w-ubiquitous-today',
    word: 'Ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    pos: 'Adj',
    meaning_vi: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi',
    example: 'Mobile phones and AI tools have become ubiquitous in daily life.'
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
          <Image
            source={{
              uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
            }}
            style={s.avatar}
          />
          <View>
            <Text style={s.greetingText}>Chào buổi sáng, {currentUser?.display_name || 'Học Viên'}</Text>
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

        {/* XP Progress: Vàng-cam + nền xpSoft */}
        <View style={s.xpSection}>
          <View style={s.xpRow}>
            <Zap color={colors.xpDeep} size={14} fill={colors.xpDeep} />
            <Text style={s.xpText}>{(userStats?.xp_total ?? 0).toLocaleString('vi-VN')} XP</Text>
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

      {/* HERO FEATURED BANNER: AI Camera Scanner */}
      <Animated.View style={animHero}>
        <AnimatedPressable
          onPress={() => router.push('/(student)/practice/scan' as any)}
          onPressIn={heroSpring.onPressIn}
          onPressOut={heroSpring.onPressOut}
          style={[s.heroBanner, heroSpring.animatedStyle]}
        >
          <View style={s.heroContent}>
            <View style={s.heroBadge}>
              <Sparkles color="#FFFFFF" size={13} />
              <Text style={s.heroBadgeText}>AI Smart Scanner</Text>
            </View>

            <Text style={s.heroTitle}>Quét Ảnh Nhận Diện Từ Vựng AI</Text>
            <Text style={s.heroSub}>
              Chụp hoặc tải ảnh vật thể để AI tự động khoanh vùng & tạo thẻ ghi nhớ.
            </Text>

            <View style={s.heroCta}>
              <Aperture color={palette.primary} size={16} />
              <Text style={s.heroCtaText}>Quét Ảnh Ngay</Text>
            </View>
          </View>

          <View style={s.mascotWrap}>
            <LoxeraFoxMascot size={110} showGlow={false} showBook={false} animated />
          </View>
        </AnimatedPressable>
      </Animated.View>

      {/* 4 Quick Action Cards Grid */}
      <Animated.View style={animGrid}>
        <Text style={s.sectionHeader}>Tính năng nổi bật</Text>
        <View style={s.gridRow}>
          {/* Card 1: AI Quét Ảnh */}
          <AnimatedPressable
            onPress={() => router.push('/(student)/practice/scan' as any)}
            onPressIn={scanSpring.onPressIn}
            onPressOut={scanSpring.onPressOut}
            style={[s.gridCard, scanSpring.animatedStyle]}
          >
            <View style={s.gridIconCircle}>
              <ScanText color={palette.primary} size={22} />
            </View>
            <View style={s.gridCardTextWrap}>
              <Text style={s.gridCardTitle}>Quét Ảnh AI</Text>
              <Text style={s.gridCardSub}>Nhận diện vật thể</Text>
            </View>
          </AnimatedPressable>

          {/* Card 2: Flashcard */}
          <AnimatedPressable
            onPress={() => router.push('/(student)/review' as any)}
            onPressIn={flashcardSpring.onPressIn}
            onPressOut={flashcardSpring.onPressOut}
            style={[s.gridCard, flashcardSpring.animatedStyle]}
          >
            <View style={s.gridIconCircle}>
              <BookOpen color={palette.primary} size={22} />
            </View>
            <View style={s.gridCardTextWrap}>
              <Text style={s.gridCardTitle}>Flashcard</Text>
              <Text style={s.gridCardSub}>Ôn tập SM-2</Text>
            </View>
          </AnimatedPressable>

          {/* Card 3: AI Chat */}
          <AnimatedPressable
            onPress={() => router.push('/(student)/assistant' as any)}
            onPressIn={chatSpring.onPressIn}
            onPressOut={chatSpring.onPressOut}
            style={[s.gridCard, chatSpring.animatedStyle]}
          >
            <View style={s.gridIconCircle}>
              <MessageSquare color={palette.primary} size={22} />
            </View>
            <View style={s.gridCardTextWrap}>
              <Text style={s.gridCardTitle}>Trợ Lý AI Chat</Text>
              <Text style={s.gridCardSub}>Giao tiếp Loxera</Text>
            </View>
          </AnimatedPressable>

          {/* Card 4: Quiz */}
          <AnimatedPressable
            onPress={() => router.push('/(student)/practice/quiz/quiz-101' as any)}
            onPressIn={quizSpring.onPressIn}
            onPressOut={quizSpring.onPressOut}
            style={[s.gridCard, quizSpring.animatedStyle]}
          >
            <View style={s.gridIconCircle}>
              <BrainCircuit color={palette.primary} size={22} />
            </View>
            <View style={s.gridCardTextWrap}>
              <Text style={s.gridCardTitle}>Quiz 10 Câu</Text>
              <Text style={s.gridCardSub}>Luyện tập từ vựng</Text>
            </View>
          </AnimatedPressable>
        </View>
      </Animated.View>

      {/* Daily Vocabulary Card */}
      <Animated.View style={[s.dailyCard, animDaily]}>
        <View style={s.dailyTopRow}>
          <View style={s.dailyTag}>
            <Sparkles color={palette.primary} size={12} />
            <Text style={s.dailyTagText}>Từ Vựng Mỗi Ngày</Text>
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

        <Text style={s.phoneticText}>{dailyWord.phonetic} • {dailyWord.meaning_vi}</Text>
        <Text style={s.exampleText}>"{dailyWord.example}"</Text>
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
  heroBanner: {
    backgroundColor: palette.primary,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
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
  gridCard: {
    width: '48%',
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTextWrap: {
    flex: 1,
  },
  gridCardTitle: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  gridCardSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
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
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
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
  exampleText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.text,
    backgroundColor: palette.bg,
    padding: 12,
    borderRadius: 12,
    fontStyle: 'italic',
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

