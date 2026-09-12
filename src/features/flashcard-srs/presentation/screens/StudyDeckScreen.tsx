import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Volume2,
  CheckCircle2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Bookmark,
  Flame,
  ArrowLeft,
} from 'lucide-react-native';
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
import { exploreWordsApi } from '../../data/vocabularyApi';
import { fetchDeckByIdApi, submitSrsReviewApi } from '../../data/deckApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 90;

export interface StudyCard {
  id: string;
  cardId?: number;
  word: string;
  ipa: string;
  type: string;
  cefrLevel?: string;
  meaning: string;
  meaningEn?: string;
  example: string;
  exampleVi?: string;
  collocation?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export const StudyDeckScreen = () => {
  const { deckId, topicId, deckName } = useLocalSearchParams<{
    deckId: string;
    topicId?: string;
    deckName?: string;
  }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [studyQueue, setStudyQueue] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [topicTitle, setTopicTitle] = useState(deckName || 'Ôn Tập Từ Vựng');

  const isSpeakerPressed = useRef(false);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  // Load real cards on mount or whenever deckId / topicId changes
  useEffect(() => {
    let isMounted = true;

    const loadCards = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setIsFlipped(false);
      translateX.value = 0;
      translateY.value = 0;
      flipRotation.value = 0;
      try {
        Speech.stop();
      } catch (_) {}

      try {
        let cards: StudyCard[] = [];
        const effectiveTopicId = topicId ? Number(topicId) : Number(deckId);

        // 1. If effectiveTopicId is a valid topic id (1-50), load words from content-service
        if (!isNaN(effectiveTopicId) && effectiveTopicId > 0 && effectiveTopicId <= 50) {
          const exploreRes = await exploreWordsApi({ topicId: effectiveTopicId, size: 200 });
          if (exploreRes.items && exploreRes.items.length > 0) {
            if (exploreRes.items[0].topicName) {
              setTopicTitle(exploreRes.items[0].topicName);
            }
            cards = exploreRes.items.map((w, idx) => ({
              id: w.id || String(idx + 1),
              word: w.word,
              ipa: w.ipaUs || w.ipaUk || '',
              type: w.partOfSpeech || 'Từ vựng',
              cefrLevel: w.cefrLevel || 'B1',
              meaning: w.definitionVi || 'Đang cập nhật nghĩa tiếng Việt',
              meaningEn: w.definitionEn || '',
              example: w.examples?.[0]?.sentenceEn || `Learn to use "${w.word}" in daily conversation.`,
              exampleVi: w.examples?.[0]?.sentenceVi || '',
              collocation: w.collocation || '',
              audioUrl: w.audioUsUrl || w.audioUkUrl,
              imageUrl: w.imageUrl,
            }));
          }
        }

        // 2. If no topic cards and deckId exists, load from learning-service personal deck
        if (cards.length === 0 && deckId) {
          const deckDetail = await fetchDeckByIdApi(deckId, currentUser?.id?.toString());
          if (deckDetail) {
            if (deckDetail.name) setTopicTitle(deckDetail.name);
            if (deckDetail.cards && deckDetail.cards.length > 0) {
              cards = deckDetail.cards.map((c, idx) => {
                const frontParts = (c.customFront || '').trim().split(/\s{2,}|\t|\//);
                const wordText = frontParts[0]?.replace('/', '').trim() || `Từ #${idx + 1}`;
                const ipaText = c.customFront?.includes('/') ? '/' + c.customFront.split('/')[1] + '/' : '';

                const backLines = (c.customBack || '').split('\n');
                const meaningText = backLines[0] || 'Nghĩa từ vựng';
                const exampleLine = backLines.find((l) =>
                  l.toLowerCase().startsWith('ví dụ:') || l.toLowerCase().startsWith('example:')
                );
                const exampleText = exampleLine ? exampleLine.replace(/^(ví dụ:|example:)\s*/i, '') : '';

                return {
                  id: String(c.id || idx + 1),
                  cardId: c.id,
                  word: wordText,
                  ipa: ipaText,
                  type: c.userNote || 'Ghi nhớ',
                  cefrLevel: 'A2',
                  meaning: meaningText,
                  meaningEn: '',
                  example: exampleText || `Use "${wordText}" in daily communication.`,
                  exampleVi: '',
                  collocation: '',
                  imageUrl: c.imageOverrideUrl,
                };
              });
            }
          }
        }

        if (isMounted) {
          setStudyQueue(cards);
        }
      } catch (err) {
        console.warn('Error loading study cards:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCards();

    return () => {
      isMounted = false;
      try {
        Speech.stop();
      } catch (_) {}
    };
  }, [deckId, topicId]);

  const currentCard = studyQueue[currentIndex];

  const playAudio = (wordToSpeak: string) => {
    try {
      setIsPlayingAudio(true);
      Speech.stop();
      Speech.speak(wordToSpeak, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.88,
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

    const card = studyQueue[currentIndex];
    if (card?.cardId) {
      submitSrsReviewApi({
        cardId: card.cardId,
        rating,
        userId: currentUser?.id?.toString(),
      }).catch((e) => console.log('SRS submit error:', e));
    }

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

  // 1. Loading State
  if (loading) {
    return (
      <View style={[styles.completedContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.completedSub, { marginTop: 16 }]}>
          Đang tải kho từ vựng {topicTitle}...
        </Text>
      </View>
    );
  }

  // 2. Empty State
  if (!loading && studyQueue.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIconBadge}>
          <BookOpen color={palette.primary} size={48} />
        </View>
        <Text style={styles.completedTitle}>Chưa có từ vựng</Text>
        <Text style={styles.completedSub}>
          Chủ đề "{topicTitle}" hiện chưa có dữ liệu từ vựng. Vui lòng quay lại và chọn chủ đề khác!
        </Text>
        <Pressable onPress={() => router.back()} style={styles.completedBtn}>
          <Text style={styles.completedBtnText}>Quay Về Bộ Thẻ</Text>
        </Pressable>
      </View>
    );
  }

  // 3. Completed State
  if (!currentCard) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIconBadge}>
          <CheckCircle2 color={palette.success} size={56} />
        </View>
        <Text style={styles.completedTitle}>Đã hoàn thành lượt ôn tập!</Text>
        <Text style={styles.completedSub}>
          Bạn đã hoàn thành {studyQueue.length} từ vựng thuộc chủ đề "{topicTitle}".
          Thuật toán SuperMemo-2 đã ghi nhận kết quả và xếp lịch ôn tập tối ưu tiếp theo cho bạn.
        </Text>
        <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={() => {
              translateX.value = 0;
              translateY.value = 0;
              flipRotation.value = 0;
              setIsFlipped(false);
              setCurrentIndex(0);
            }}
            style={[styles.completedBtn, { backgroundColor: palette.primary, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
          >
            <RotateCcw color="#FFFFFF" size={18} />
            <Text style={styles.completedBtnText}>Ôn Lại Từ Đầu</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={[styles.completedBtn, { backgroundColor: '#F1F5F9' }]}
          >
            <Text style={[styles.completedBtnText, { color: palette.text }]}>Quay Về Bộ Thẻ</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / studyQueue.length) * 100);

  return (
    <View style={styles.root}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtnWrap}>
          <ArrowLeft color={palette.text} size={22} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{topicTitle}</Text>
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
            Thẻ {currentIndex + 1}/{studyQueue.length}
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
                <View style={styles.cardHeaderTagRow}>
                  <View style={styles.cardHeaderTag}>
                    <BookOpen color={palette.primary} size={14} />
                    <Text style={styles.cardTagText}>{currentCard.type}</Text>
                  </View>
                  {!!currentCard.cefrLevel && (
                    <View style={styles.cefrBadge}>
                      <Text style={styles.cefrBadgeText}>{currentCard.cefrLevel}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.frontCenterContent}>
                  <Text style={styles.wordTitle}>{currentCard.word}</Text>
                  {!!currentCard.ipa && <Text style={styles.ipaText}>{currentCard.ipa}</Text>}
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

                  {!!currentCard.meaningEn && (
                    <Text style={styles.meaningEnText}>{currentCard.meaningEn}</Text>
                  )}

                  {!!currentCard.example && (
                    <View style={styles.exampleBox}>
                      <Text style={styles.exampleTitle}>Ví dụ:</Text>
                      <Text style={styles.exampleText}>"{currentCard.example}"</Text>
                      {!!currentCard.exampleVi && (
                        <Text style={styles.exampleViText}>{currentCard.exampleVi}</Text>
                      )}
                    </View>
                  )}

                  {!!currentCard.collocation && (
                    <View style={styles.collocationBox}>
                      <Text style={styles.collocationText}>💡 Cụm từ: {currentCard.collocation}</Text>
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
  backBtnWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  headerSub: {
    fontSize: 11,
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
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
  progressPctText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 3,
  },
  hintBanner: {
    alignItems: 'center',
    marginBottom: 8,
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
    marginVertical: 6,
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
  cardHeaderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  cefrBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cefrBadgeText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#2563EB',
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
    fontSize: 34,
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
    lineHeight: 25,
    marginBottom: 6,
  },
  meaningEnText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
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
  exampleViText: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
    marginTop: 4,
    lineHeight: 16,
  },
  collocationBox: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: '100%',
  },
  collocationText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
    textAlign: 'center',
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
    alignItems: 'center',
  },
  completedBtnText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
