import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Volume2, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown, BookOpen, Bookmark, Flame } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { useAuthStore } from '@/src/core/flows/authStore';
import { palette, font } from '@/src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 90;

export const StudyDeckScreen = () => {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const mockStudyQueue = [
    {
      id: '1',
      word: 'Resilient',
      ipa: '/rɪˈzɪl.jənt/',
      type: 'Adjective',
      meaning: 'Kiên cường, có khả năng phục hồi nhanh chóng sau khó khăn',
      example: 'She remained resilient despite facing major financial challenges.',
      collocation: 'Resilient spirit / Resilient economy',
    },
    {
      id: '2',
      word: 'Ubiquitous',
      ipa: '/juːˈbɪk.wɪ.təs/',
      type: 'Adjective',
      meaning: 'Có mặt ở khắp mọi nơi, vô cùng phổ biến rộng rãi',
      example: 'Smartphones have become ubiquitous in modern daily life.',
      collocation: 'Ubiquitous presence / Ubiquitous technology',
    },
    {
      id: '3',
      word: 'Meticulous',
      ipa: '/mɪˈtɪk.jə.ləs/',
      type: 'Adjective',
      meaning: 'Tỉ mỉ, cẩn thận kỹ lưỡng từng chi tiết nhỏ nhất',
      example: 'He is meticulous about keeping his research notes organized.',
      collocation: 'Meticulous planning / Meticulous attention',
    },
    {
      id: '4',
      word: 'Pragmatic',
      ipa: '/præɡˈmæt.ɪk/',
      type: 'Adjective',
      meaning: 'Thực tế, thực dụng, coi trọng hiệu quả hơn lý thuyết',
      example: 'We need a pragmatic approach to solve this complex issue.',
      collocation: 'Pragmatic decision / Pragmatic solution',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isSpeakerPressed = useRef(false);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  const currentCard = mockStudyQueue[currentIndex];

  const playAudio = (wordToSpeak: string) => {
    try {
      setIsPlayingAudio(true);
      Speech.stop();
      Speech.speak(wordToSpeak, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    } catch (err) {
      console.log('Speech playback error:', err);
      setIsPlayingAudio(false);
    }
  };

  const handleSpeakerPress = () => {
    if (!currentCard) return;
    isSpeakerPressed.current = true;
    playAudio(currentCard.word);
    setTimeout(() => {
      isSpeakerPressed.current = false;
    }, 600);
  };

  const handleCardTapToFlip = () => {
    if (isSpeakerPressed.current) return;
    toggleFlip();
  };

  const advanceCardRef = useRef((rating: number) => {});
  advanceCardRef.current = (rating: number) => {
    try {
      Speech.stop();
    } catch (_) {}
    translateX.value = 0;
    translateY.value = 0;
    flipRotation.value = 0;
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  // PanResponder for smooth Touch & Swipe Gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.value = gestureState.dx;
        translateY.value = gestureState.dy * 0.3;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 220 }, () => {
            'worklet';
            runOnJS(advanceCardRef.current)(2);
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 220 }, () => {
            'worklet';
            runOnJS(advanceCardRef.current)(0);
          });
        } else {
          translateX.value = withSpring(0, { damping: 12, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 12, stiffness: 150 });
        }
      },
    })
  ).current;

  const toggleFlip = () => {
    if (isFlipped) {
      flipRotation.value = withTiming(0, { duration: 280 });
      setIsFlipped(false);
    } else {
      flipRotation.value = withTiming(180, { duration: 280 });
      setIsFlipped(true);
    }
  };

  // Card transform styles
  const cardContainerStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-200, 200], [-12, 12]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotateZ}deg` },
      ],
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [20, 120], [0, 1], 'clamp');
    return { opacity };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-120, -20], [1, 0], 'clamp');
    return { opacity };
  });

  if (!currentCard) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIconBadge}>
          <CheckCircle2 color={palette.primary} size={56} />
        </View>
        <Text style={styles.completedTitle}>Đã hoàn thành lượt ôn tập!</Text>
        <Text style={styles.completedSub}>
          Thuật toán SuperMemo-2 đã sắp xếp lịch ôn tiếp theo cho bộ từ vựng này.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.completedBtn}
        >
          <Text style={styles.completedBtnText}>Quay Về Bộ Thẻ</Text>
        </Pressable>
      </View>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / mockStudyQueue.length) * 100);

  return (
    <View style={styles.root}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.avatarWrap}>
          <Image
            source={{
              uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
            }}
            style={styles.avatar}
          />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Loxera Flashcard</Text>
          <Text style={styles.headerSub}>Ôn tập thuật toán SM-2</Text>
        </View>

        <View style={styles.streakBadge}>
          <Flame color={palette.accent} size={14} fill={palette.accent} />
          <Text style={styles.streakText}>4 Ngày</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Thẻ {currentIndex + 1}/{mockStudyQueue.length}
          </Text>
          <Text style={styles.progressPctText}>{progressPct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Hint Banner */}
      <View style={styles.hintBanner}>
        <Text style={styles.hintText}>
          👈 Vuốt trái: <Text style={{ color: palette.danger, fontWeight: '700' }}>Chưa thuộc</Text> | Vuốt phải: <Text style={{ color: palette.success, fontWeight: '700' }}>Thuộc</Text> 👉
        </Text>
      </View>

      {/* Card Viewport */}
      <View style={styles.cardViewport}>
        <Animated.View
          style={[styles.animatedCardWrap, cardContainerStyle]}
          {...panResponder.panHandlers}
        >
          {/* Swipe Indicator: RIGHT = THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeRightOverlay, rightOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeRight}>
              <ThumbsUp color={palette.success} size={24} />
              <Text style={styles.swipeBadgeTextRight}>THUỘC</Text>
            </View>
          </Animated.View>

          {/* Swipe Indicator: LEFT = CHƯA THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeLeftOverlay, leftOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeLeft}>
              <ThumbsDown color={palette.danger} size={24} />
              <Text style={styles.swipeBadgeTextLeft}>CHƯA THUỘC</Text>
            </View>
          </Animated.View>

          {/* Card Container */}
          <View style={styles.cardInnerContainer}>
            {/* FRONT CARD */}
            <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
              <Pressable onPress={handleCardTapToFlip} style={styles.cardBackgroundTapArea}>
                <View style={styles.cardHeaderTag}>
                  <BookOpen color={palette.primary} size={14} />
                  <Text style={styles.cardTagText}>{currentCard.type}</Text>
                </View>

                <View style={styles.frontCenterContent}>
                  <Text style={styles.wordTitle}>{currentCard.word}</Text>
                  <Text style={styles.ipaText}>{currentCard.ipa}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <RotateCcw color={palette.textSoft} size={14} />
                  <Text style={styles.flipHintText}>Chạm vào thẻ để lật xem định nghĩa</Text>
                </View>
              </Pressable>
            </Animated.View>

            {/* BACK CARD */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
              <Pressable onPress={toggleFlip} style={styles.cardBackgroundTapArea}>
                <View style={styles.cardHeaderTagBack}>
                  <Bookmark color={palette.primary} size={14} />
                  <Text style={styles.cardTagTextBack}>ĐỊNH NGHĨA & VÍ DỤ</Text>
                </View>

                <View style={styles.backCenterContent}>
                  <Text style={styles.meaningText}>{currentCard.meaning}</Text>

                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleTitle}>Ví dụ:</Text>
                    <Text style={styles.exampleText}>"{currentCard.example}"</Text>
                  </View>

                  {currentCard.collocation && (
                    <View style={styles.collocationBox}>
                      <Text style={styles.collocationText}>💡 Collocation: {currentCard.collocation}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <RotateCcw color={palette.primary} size={14} />
                  <Text style={[styles.flipHintText, { color: palette.primary }]}>Chạm để quay lại mặt trước</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Speaker Button */}
      {!isFlipped && currentCard && (
        <View style={styles.speakerRow}>
          <Pressable
            onPressIn={handleSpeakerPress}
            style={[styles.speakerBtn, isPlayingAudio && styles.speakerBtnActive]}
          >
            <Volume2 color="#FFFFFF" size={22} />
          </Pressable>
          <Text style={styles.speakerHint}>
            {isPlayingAudio ? 'Đang phát...' : 'Nghe phát âm'}
          </Text>
        </View>
      )}

      {/* Rating Buttons */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingSectionTitle}>Mức độ nhớ từ này:</Text>
        <View style={styles.ratingRow}>
          <Pressable onPress={() => advanceCardRef.current(0)} style={[styles.rateBtn, styles.rateAgain]}>
            <Text style={[styles.rateBtnTitle, { color: palette.danger }]}>Chưa thuộc</Text>
            <Text style={styles.rateBtnSub}>&lt;1m</Text>
          </Pressable>

          <Pressable onPress={() => advanceCardRef.current(1)} style={[styles.rateBtn, styles.rateHard]}>
            <Text style={[styles.rateBtnTitle, { color: palette.warning }]}>Khó</Text>
            <Text style={styles.rateBtnSub}>2 ngày</Text>
          </Pressable>

          <Pressable onPress={() => advanceCardRef.current(2)} style={[styles.rateBtn, styles.rateGood]}>
            <Text style={[styles.rateBtnTitle, { color: palette.primary }]}>Thuộc</Text>
            <Text style={styles.rateBtnSub}>4 ngày</Text>
          </Pressable>

          <Pressable onPress={() => advanceCardRef.current(3)} style={[styles.rateBtn, styles.rateEasy]}>
            <Text style={[styles.rateBtnTitle, { color: palette.success }]}>Dễ</Text>
            <Text style={styles.rateBtnSub}>7 ngày</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrap: {
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.primarySoft,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(67, 59, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  progressPctText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: palette.primarySoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 3,
  },
  hintBanner: {
    backgroundColor: palette.surface,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  hintText: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  cardViewport: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  animatedCardWrap: {
    width: '100%',
    height: '100%',
    maxHeight: 380,
    position: 'relative',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
  },
  swipeRightOverlay: {
    right: 20,
  },
  swipeLeftOverlay: {
    left: 20,
  },
  swipeBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31, 174, 122, 0.15)',
    borderWidth: 2,
    borderColor: palette.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  swipeBadgeTextRight: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.success,
  },
  swipeBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 84, 63, 0.15)',
    borderWidth: 2,
    borderColor: palette.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  swipeBadgeTextLeft: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.danger,
  },
  cardInnerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardFront: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardBack: {
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.primarySoft,
  },
  cardBackgroundTapArea: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardHeaderTagBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardTagText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  cardTagTextBack: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  frontCenterContent: {
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  wordTitle: {
    fontSize: 36,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
  ipaText: {
    fontSize: 16,
    fontFamily: font.family,
    color: palette.textSoft,
    marginBottom: 8,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  speakerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  speakerBtnActive: {
    backgroundColor: palette.accent,
    transform: [{ scale: 1.05 }],
  },
  speakerHint: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  backCenterContent: {
    width: '100%',
    alignItems: 'center',
  },
  meaningText: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: palette.bg,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    width: '100%',
    marginBottom: 8,
  },
  exampleTitle: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  collocationBox: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  collocationText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  flipHintText: {
    fontSize: 11,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  ratingSection: {
    marginTop: 6,
  },
  ratingSectionTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  rateAgain: {
    backgroundColor: 'rgba(225, 84, 63, 0.08)',
    borderColor: 'rgba(225, 84, 63, 0.2)',
  },
  rateHard: {
    backgroundColor: 'rgba(227, 166, 62, 0.08)',
    borderColor: 'rgba(227, 166, 62, 0.2)',
  },
  rateGood: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.border,
  },
  rateEasy: {
    backgroundColor: 'rgba(31, 174, 122, 0.08)',
    borderColor: 'rgba(31, 174, 122, 0.2)',
  },
  rateBtnTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
  },
  rateBtnSub: {
    fontSize: 10,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 2,
  },
  completedContainer: {
    flex: 1,
    backgroundColor: palette.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completedIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  completedSub: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.textSoft,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  completedBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  completedBtnText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
  },
});

