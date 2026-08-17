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
import { Zap, Volume2, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

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

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  const currentCard = mockStudyQueue[currentIndex];

  const advanceCard = (rating: number) => {
    // Reset values for next card
    translateX.value = 0;
    translateY.value = 0;
    flipRotation.value = 0;
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const triggerNextCard = (rating: number) => {
    runOnJS(advanceCard)(rating);
  };

  // PanResponder for smooth Touch & Swipe Gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.value = gestureState.dx;
        translateY.value = gestureState.dy * 0.3;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe Right -> Mastered / Good
          translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
            triggerNextCard(2);
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe Left -> Need Review / Again
          translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
            triggerNextCard(0);
          });
        } else {
          // Spring back to center
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
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

  // Swipe Indicator Overlays
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
          <CheckCircle2 color="#0EA5E9" size={56} />
        </View>
        <Text style={styles.completedTitle}>Đã Ôn Xong Tất Cả Thẻ!</Text>
        <Text style={styles.completedSub}>
          Thuật toán SuperMemo-2 đã tính toán và xếp lịch ôn tập phù hợp nhất cho bạn.
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
          <Text style={styles.headerSub}>Ôn tập thông minh SRS</Text>
        </View>

        <View style={styles.streakBadge}>
          <Text style={{ fontSize: 13 }}>🔥</Text>
          <Text style={styles.streakText}>4 Ngày</Text>
        </View>
      </View>

      {/* Progress Bar & Counter */}
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

      {/* Swipe Hint Banner */}
      <View style={styles.hintBanner}>
        <Text style={styles.hintText}>
          👈 Vuốt trái: <Text style={{ color: '#EF4444', fontWeight: '700' }}>Chưa thuộc</Text> | Vuốt phải: <Text style={{ color: '#10B981', fontWeight: '700' }}>Thuộc</Text> 👉
        </Text>
      </View>

      {/* Main Flashcard Viewport with Swipe Gesture */}
      <View style={styles.cardViewport}>
        <Animated.View
          style={[styles.animatedCardWrap, cardContainerStyle]}
          {...panResponder.panHandlers}
        >
          {/* Swipe Indicator Overlay: RIGHT = THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeRightOverlay, rightOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeRight}>
              <ThumbsUp color="#10B981" size={28} />
              <Text style={styles.swipeBadgeTextRight}>THUỘC</Text>
            </View>
          </Animated.View>

          {/* Swipe Indicator Overlay: LEFT = CHƯA THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeLeftOverlay, leftOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeLeft}>
              <ThumbsDown color="#EF4444" size={28} />
              <Text style={styles.swipeBadgeTextLeft}>CHƯA THUỘC</Text>
            </View>
          </Animated.View>

          {/* Card Tap to Flip */}
          <Pressable onPress={toggleFlip} style={styles.cardInnerContainer}>
            {/* FRONT CARD */}
            <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
              <View style={styles.cardHeaderTag}>
                <Sparkles color="#0EA5E9" size={14} />
                <Text style={styles.cardTagText}>{currentCard.type}</Text>
              </View>

              <View style={styles.frontCenterContent}>
                <Text style={styles.wordTitle}>{currentCard.word}</Text>
                <Text style={styles.ipaText}>{currentCard.ipa}</Text>

                {/* Speaker Audio Button */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    alert(`🔊 Đang phát âm: ${currentCard.word}`);
                  }}
                  style={styles.audioBtn}
                >
                  <Volume2 color="#FFFFFF" size={26} />
                </Pressable>
              </View>

              <View style={styles.cardFooter}>
                <RotateCcw color="#94A3B8" size={14} />
                <Text style={styles.flipHintText}>Chạm vào thẻ để xem định nghĩa</Text>
              </View>
            </Animated.View>

            {/* BACK CARD */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
              <View style={styles.cardHeaderTagBack}>
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
                <RotateCcw color="#0EA5E9" size={14} />
                <Text style={[styles.flipHintText, { color: '#0EA5E9' }]}>Chạm để quay lại mặt trước</Text>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom SM-2 Rating Buttons */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingSectionTitle}>Đánh giá mức độ ghi nhớ:</Text>
        <View style={styles.ratingRow}>
          <Pressable onPress={() => advanceCard(0)} style={[styles.rateBtn, styles.rateAgain]}>
            <Text style={[styles.rateBtnTitle, { color: '#DC2626' }]}>Chưa thuộc</Text>
            <Text style={[styles.rateBtnSub, { color: '#EF4444' }]}>Quên (&lt;1m)</Text>
          </Pressable>

          <Pressable onPress={() => advanceCard(1)} style={[styles.rateBtn, styles.rateHard]}>
            <Text style={[styles.rateBtnTitle, { color: '#D97706' }]}>Khó</Text>
            <Text style={[styles.rateBtnSub, { color: '#F59E0B' }]}>2 ngày</Text>
          </Pressable>

          <Pressable onPress={() => advanceCard(2)} style={[styles.rateBtn, styles.rateGood]}>
            <Text style={[styles.rateBtnTitle, { color: '#0284C7' }]}>Thuộc</Text>
            <Text style={[styles.rateBtnSub, { color: '#0EA5E9' }]}>4 ngày</Text>
          </Pressable>

          <Pressable onPress={() => advanceCard(3)} style={[styles.rateBtn, styles.rateEasy]}>
            <Text style={[styles.rateBtnTitle, { color: '#059669' }]}>Dễ</Text>
            <Text style={[styles.rateBtnSub, { color: '#10B981' }]}>7 ngày</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  avatarWrap: {
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
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
    fontWeight: '700',
    color: '#1E3A5F',
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 100,
  },
  hintBanner: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardViewport: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
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
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  swipeBadgeTextRight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
  },
  swipeBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  swipeBadgeTextLeft: {
    fontSize: 16,
    fontWeight: '900',
    color: '#991B1B',
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
    borderRadius: 32,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
  },
  cardBack: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  cardHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  cardHeaderTagBack: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
    textTransform: 'uppercase',
  },
  cardTagTextBack: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  frontCenterContent: {
    alignItems: 'center',
  },
  wordTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 6,
    textAlign: 'center',
  },
  ipaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
  },
  audioBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  backCenterContent: {
    width: '100%',
    alignItems: 'center',
  },
  meaningText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A5F',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 14,
  },
  exampleBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%',
    marginBottom: 10,
  },
  exampleTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  collocationBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  collocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: 8,
  },
  ratingSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  rateAgain: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  rateHard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  rateGood: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  rateEasy: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  rateBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  rateBtnSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  completedContainer: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completedIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  completedBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  completedBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
