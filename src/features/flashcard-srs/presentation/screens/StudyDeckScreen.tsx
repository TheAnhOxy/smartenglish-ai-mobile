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
  Alert,
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
  ChevronLeft,
  AlertCircle,
} from '@/src/components/ds/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button3D, ProgressBar, PulseRing, Reveal, Tap, feedback } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { speakText, stopSpeech } from '@/src/core/services/speechService';
import { useAuthStore } from '@/src/core/flows/authStore';
import { exploreWordsApi } from '../../data/vocabularyApi';
import { fetchDeckByIdApi, submitSrsReviewApi } from '../../data/deckApi';
import { BackButton } from '@/src/core/components/BackButton';

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
  const { currentUser, userStats } = useAuthStore();
  const insets = useSafeAreaInsets();
  const streakDays = userStats?.streak_current ?? 0;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [studyQueue, setStudyQueue] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [topicTitle, setTopicTitle] = useState(deckName || 'Ôn Tập Từ Vựng');

  const isSpeakerPressed = useRef(false);
  const isSubmittingRef = useRef(false);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  // Load real cards on mount or whenever deckId / topicId changes
  const loadCards = async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    translateX.value = 0;
    translateY.value = 0;
    flipRotation.value = 0;
    try {
      void stopSpeech();
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
        const deckDetail = await fetchDeckByIdApi(deckId);
        if (deckDetail) {
          if (deckDetail.name) setTopicTitle(deckDetail.name);
          if (deckDetail.cards && deckDetail.cards.length > 0) {
            cards = deckDetail.cards.map((c: any, idx: number) => {
              const frontParts = (c.customFront || '').trim().split(/\s{2,}|\t|\//);
              const wordText = frontParts[0]?.replace('/', '').trim() || `Từ #${idx + 1}`;
              const ipaText = c.customFront?.includes('/') ? '/' + c.customFront.split('/')[1] + '/' : '';

              const backLines = (c.customBack || '').split('\n');
              const meaningText = backLines[0] || 'Nghĩa từ vựng';
              const exampleLine = backLines.find((l: string) =>
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

      setStudyQueue(cards);
    } catch (err: any) {
      console.warn('Error loading study cards:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải dữ liệu ôn tập. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();

    return () => {
      try {
        Speech.stop();
      } catch (_) {}
    };
  }, [deckId, topicId]);

  const currentCard = studyQueue[currentIndex];

  const playAudio = (wordToSpeak: string) => {
    try {
      setIsPlayingAudio(true);
      void speakText(wordToSpeak, {
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

  const handleReviewCard = async (rating: number) => {
    if (isSubmittingRef.current) return;
    const card = studyQueue[currentIndex];
    if (!card) return;

    try {
      Speech.stop();
    } catch (_) {}

    isSubmittingRef.current = true;
    setIsSubmittingReview(true);

    try {
      if (card.cardId) {
        await submitSrsReviewApi({
          cardId: card.cardId,
          rating,
        });
      }

      // Backend confirmed! Now reset card transforms and advance to next card
      feedback.rate(rating >= 2);
      translateX.value = 0;
      translateY.value = 0;
      flipRotation.value = 0;
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err: any) {
      console.warn('SRS review failed:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gửi kết quả ôn tập. Vui lòng kiểm tra kết nối mạng và thử lại.';
      feedback.wrong();
      Alert.alert('Lỗi gửi đánh giá SRS', errMsg);
      // Restore card to center so user can retry
      translateX.value = withSpring(0, { damping: 12, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 150 });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmittingReview(false);
    }
  };

  advanceCardRef.current = handleReviewCard;

  // PanResponder for smooth Touch & Swipe Gesture with submission locking
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isSubmittingRef.current) return false;
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isSubmittingRef.current) return;
        translateX.value = gestureState.dx;
        translateY.value = gestureState.dy * 0.3;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isSubmittingRef.current) {
          translateX.value = withSpring(0, { damping: 12, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 12, stiffness: 150 });
          return;
        }
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
    feedback.flip();
    if (isFlipped) {
      flipRotation.value = withSpring(0, { damping: 14, stiffness: 160 });
      setIsFlipped(false);
    } else {
      flipRotation.value = withSpring(180, { damping: 14, stiffness: 160 });
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

  const studyFinished = !loading && !error && studyQueue.length > 0 && !currentCard;
  useEffect(() => {
    if (studyFinished) feedback.fanfare();
  }, [studyFinished]);

  // 1. Loading State
  if (loading) {
    return (
      <View style={[styles.completedContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={ds.btn} />
        <Text style={[styles.completedSub, { marginTop: 12 }]}>
          Đang tải dữ liệu thẻ ôn tập...
        </Text>
      </View>
    );
  }

  // 2. Error State with Retry
  if (!loading && error) {
    return (
      <View style={styles.completedContainer}>
        <Reveal style={{ alignItems: 'center', width: '100%' }}>
          <View style={[styles.completedIconBadge, { backgroundColor: ds.redSoft }]}>
            <AlertCircle color={ds.red} size={44} />
          </View>
          <Text style={styles.completedTitle}>Lỗi kết nối máy chủ</Text>
          <Text style={styles.completedSub}>{error}</Text>
          <View style={styles.completedActions}>
            <Button3D label="Thử lại" onPress={loadCards} icon={<RotateCcw color={ds.white} size={20} />} />
            <Button3D label="Quay về bộ thẻ" variant="light" onPress={() => router.back()} />
          </View>
        </Reveal>
      </View>
    );
  }

  // 3. Empty State (Genuinely 0 cards from server)
  if (!loading && !error && studyQueue.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <Reveal style={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.completedIconBadge}>
            <BookOpen color={ds.btn} size={44} />
          </View>
          <Text style={styles.completedTitle}>Chưa có từ vựng</Text>
          <Text style={styles.completedSub}>
            Chủ đề hoặc bộ thẻ "{topicTitle}" hiện chưa có dữ liệu từ vựng. Vui lòng quay lại và chọn bộ thẻ khác!
          </Text>
          <View style={styles.completedActions}>
            <Button3D label="Quay về bộ thẻ" onPress={() => router.back()} />
          </View>
        </Reveal>
      </View>
    );
  }

  // 3. Completed State
  if (!currentCard) {
    return (
      <View style={styles.completedContainer}>
        <Reveal style={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.doneBadgeWrap}>
            <PulseRing size={112} color={ds.green} />
            <View style={styles.doneBadge}>
              <CheckCircle2 color={ds.white} size={56} fill="none" />
            </View>
          </View>
          <Text style={styles.completedTitle}>Đã hoàn thành lượt ôn tập!</Text>
          <Text style={styles.completedSub}>
            Bạn đã hoàn thành {studyQueue.length} từ vựng thuộc chủ đề "{topicTitle}".
            Thuật toán SuperMemo-2 đã ghi nhận kết quả và xếp lịch ôn tập tối ưu tiếp theo cho bạn.
          </Text>
          <View style={styles.completedActions}>
            <Button3D
              label="Ôn lại từ đầu"
              icon={<RotateCcw color={ds.white} size={20} />}
              onPress={() => {
                translateX.value = 0;
                translateY.value = 0;
                flipRotation.value = 0;
                setIsFlipped(false);
                setCurrentIndex(0);
              }}
            />
            <Button3D label="Quay về bộ thẻ" variant="light" onPress={() => router.back()} />
          </View>
        </Reveal>
      </View>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / studyQueue.length) * 100);
  const remaining = studyQueue.length - currentIndex - 1;

  return (
    <View style={[styles.root, { paddingTop: (insets.top || 20) + 8, paddingBottom: (insets.bottom || 12) + 12 }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Tap onPress={() => router.back()} style={styles.backBtnWrap} accessibilityLabel="Quay lại">
          <ChevronLeft color={ds.ink} size={24} />
        </Tap>
        <BackButton onPress={() => router.back()} />

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{topicTitle}</Text>
          <Text style={styles.headerSub}>Ôn tập thuật toán SM-2</Text>
        </View>

        <View style={styles.streakBadge}>
          <Flame color={ds.amberDeep} size={18} />
          <Text style={styles.streakText}>{streakDays} ngày</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <ProgressBar value={progressPct / 100} color={ds.sky} height={12} style={{ flex: 1 }} />
        <Text style={styles.progressText}>
          {currentIndex + 1}/{studyQueue.length}
        </Text>
      </View>

      {/* Hint Banner */}
      <View style={styles.hintBanner}>
        <View style={[styles.hintDot, { backgroundColor: ds.red }]} />
        <Text style={styles.hintText}>Vuốt trái: chưa thuộc</Text>
        <View style={styles.hintSep} />
        <View style={[styles.hintDot, { backgroundColor: ds.green }]} />
        <Text style={styles.hintText}>Vuốt phải: thuộc</Text>
      </View>

      {/* Card Viewport */}
      <View style={styles.cardViewport}>
        {/* Thẻ xếp chồng phía sau tạo chiều sâu */}
        {remaining > 1 ? <View pointerEvents="none" style={[styles.stackCard, styles.stackCard2]} /> : null}
        {remaining > 0 ? <View pointerEvents="none" style={[styles.stackCard, styles.stackCard1]} /> : null}

        <Animated.View
          style={[styles.animatedCardWrap, cardContainerStyle]}
          {...panResponder.panHandlers}
        >
          {/* Swipe Indicator: RIGHT = THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeRightOverlay, rightOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeRight}>
              <ThumbsUp color={ds.green} size={24} />
              <Text style={styles.swipeBadgeTextRight}>THUỘC</Text>
            </View>
          </Animated.View>

          {/* Swipe Indicator: LEFT = CHƯA THUỘC */}
          <Animated.View style={[styles.swipeOverlay, styles.swipeLeftOverlay, leftOverlayStyle]} pointerEvents="none">
            <View style={styles.swipeBadgeLeft}>
              <ThumbsDown color={ds.red} size={24} />
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
                    <BookOpen color={ds.btn} size={16} />
                    <Text style={styles.cardTagText}>{currentCard.type}</Text>
                  </View>
                  {!!currentCard.cefrLevel && (
                    <View style={styles.cefrBadge}>
                      <Text style={styles.cefrBadgeText}>{currentCard.cefrLevel}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.frontCenterContent}>
                  <Text style={styles.wordTitle} adjustsFontSizeToFit numberOfLines={2}>{currentCard.word}</Text>
                  {!!currentCard.ipa && <Text style={styles.ipaText}>{currentCard.ipa}</Text>}
                </View>

                <View style={styles.cardFooter}>
                  <RotateCcw color={ds.muted} size={16} />
                  <Text style={styles.flipHintText}>Chạm vào thẻ để lật xem định nghĩa</Text>
                </View>
              </Pressable>
            </Animated.View>

            {/* BACK CARD */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
              <Pressable onPress={toggleFlip} style={styles.cardBackgroundTapArea}>
                <View style={styles.cardHeaderTagBack}>
                  <Bookmark color={ds.skyLight} size={16} />
                  <Text style={styles.cardTagTextBack}>ĐỊNH NGHĨA & VÍ DỤ</Text>
                </View>

                <View style={styles.backCenterContent}>
                  <Text style={styles.meaningText}>{currentCard.meaning}</Text>

                  {!!currentCard.meaningEn && (
                    <Text style={styles.meaningEnText}>{currentCard.meaningEn}</Text>
                  )}

                  {!!currentCard.example && (
                    <View style={styles.exampleBox}>
                      <Text style={styles.exampleTitle}>Ví dụ</Text>
                      <Text style={styles.exampleText}>"{currentCard.example}"</Text>
                      {!!currentCard.exampleVi && (
                        <Text style={styles.exampleViText}>{currentCard.exampleVi}</Text>
                      )}
                    </View>
                  )}

                  {!!currentCard.collocation && (
                    <View style={styles.collocationBox}>
                      <Text style={styles.collocationText}>Cụm từ: {currentCard.collocation}</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.cardFooter, styles.cardFooterBack]}>
                  <RotateCcw color={ds.skyLight} size={16} />
                  <Text style={[styles.flipHintText, { color: ds.skyLight }]}>Chạm để quay lại mặt trước</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Speaker Button */}
      {!isFlipped && currentCard && (
        <View style={styles.speakerRow}>
          <View style={styles.speakerWrap}>
            <PulseRing size={56} color={ds.sky} active={isPlayingAudio} />
            <View style={styles.speakerEdge} />
            <Pressable
              onPressIn={handleSpeakerPress}
              style={[styles.speakerBtn, isPlayingAudio && styles.speakerBtnActive]}
              accessibilityLabel="Nghe phát âm"
            >
              <Volume2 color={ds.white} size={26} fill="none" />
            </Pressable>
          </View>
          <Text style={styles.speakerHint}>
            {isPlayingAudio ? 'Đang phát...' : 'Nghe phát âm'}
          </Text>
        </View>
      )}

      {/* Rating Buttons */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingSectionTitle}>
          {isSubmittingReview ? 'Đang lưu kết quả SRS...' : 'Mức độ nhớ từ này'}
        </Text>
        <View style={styles.ratingRow}>
          <RateButton label="Chưa thuộc" sub="<1m" bg={ds.red} edge={ds.redEdge} disabled={isSubmittingReview} onPress={() => advanceCardRef.current(0)} />
          <RateButton label="Khó" sub="2 ngày" bg={ds.amber} edge={ds.amberDeep} fg={ds.ink} disabled={isSubmittingReview} onPress={() => advanceCardRef.current(1)} />
          <RateButton label="Thuộc" sub="4 ngày" bg={ds.btn} edge={ds.btnEdge} disabled={isSubmittingReview} onPress={() => advanceCardRef.current(2)} />
          <RateButton label="Dễ" sub="7 ngày" bg={ds.green} edge={ds.greenEdge} disabled={isSubmittingReview} onPress={() => advanceCardRef.current(3)} />
        </View>
      </View>
    </View>
  );
};

/** Nút đánh giá SRS kiểu 3D: lún xuống khi nhấn */
const RateButton: React.FC<{
  label: string;
  sub: string;
  bg: string;
  edge: string;
  fg?: string;
  disabled?: boolean;
  onPress: () => void;
}> = ({ label, sub, bg, edge, fg = ds.white, disabled, onPress }) => {
  const [down, setDown] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[styles.rateBtnOuter, disabled && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.rateBtnEdge, { backgroundColor: edge }]} />
      <View style={[styles.rateBtn, { backgroundColor: bg, transform: [{ translateY: down ? 3 : 0 }] }]}>
        <Text style={[styles.rateBtnTitle, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
        <Text style={[styles.rateBtnSub, { color: fg }]}>{sub}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.bg,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtnWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: dsSize.md,
    fontFamily: dsFont.display,
    color: ds.ink,
  },
  headerSub: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.medium,
    color: ds.muted,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ds.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.amberText,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressText: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.bold,
    color: ds.muted,
    minWidth: 44,
    textAlign: 'right',
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hintDot: { width: 7, height: 7, borderRadius: 4 },
  hintSep: { width: 1, height: 12, backgroundColor: ds.lineStrong, marginHorizontal: 6 },
  hintText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.medium,
    color: ds.muted,
  },
  cardViewport: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  stackCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    maxHeight: 380,
    borderRadius: dsRadius.xl,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  stackCard1: { transform: [{ translateY: 12 }, { scale: 0.95 }], opacity: 0.9 },
  stackCard2: { transform: [{ translateY: 24 }, { scale: 0.9 }], opacity: 0.6 },
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
    backgroundColor: ds.greenSoft,
    borderWidth: 2.5,
    borderColor: ds.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    transform: [{ rotate: '8deg' }],
  },
  swipeBadgeTextRight: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.displayHeavy,
    color: ds.green,
    letterSpacing: 1,
  },
  swipeBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ds.redSoft,
    borderWidth: 2.5,
    borderColor: ds.red,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    transform: [{ rotate: '-8deg' }],
  },
  swipeBadgeTextLeft: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.displayHeavy,
    color: ds.red,
    letterSpacing: 1,
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
    borderRadius: dsRadius.xl,
    overflow: 'hidden',
    ...dsShadow.lift,
  },
  cardFront: {
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 6,
    borderBottomColor: ds.lineStrong,
  },
  cardBack: {
    backgroundColor: ds.ink,
    borderBottomWidth: 6,
    borderBottomColor: '#07182A',
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
    backgroundColor: ds.skySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  cefrBadge: {
    backgroundColor: ds.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  cefrBadgeText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.amberText,
  },
  cardHeaderTagBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ds.onInkFaint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  cardTagText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.semibold,
    color: ds.btn,
  },
  cardTagTextBack: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.skyLight,
    letterSpacing: 0.8,
  },
  frontCenterContent: {
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  wordTitle: {
    fontSize: dsSize.display,
    fontFamily: dsFont.displayHeavy,
    color: ds.ink,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  ipaText: {
    fontSize: dsSize.md,
    fontFamily: dsFont.medium,
    color: ds.muted,
    marginBottom: 8,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  speakerWrap: { width: 56, height: 60, alignItems: 'center' },
  speakerEdge: { position: 'absolute', top: 4, width: 56, height: 56, borderRadius: 28, backgroundColor: ds.btnEdge },
  speakerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.btn,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerBtnActive: {
    backgroundColor: ds.sky,
    transform: [{ translateY: 2 }],
  },
  speakerHint: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.semibold,
    color: ds.muted,
  },
  backCenterContent: {
    width: '100%',
    alignItems: 'center',
  },
  meaningText: {
    fontSize: dsSize.lg,
    fontFamily: dsFont.display,
    color: ds.white,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 6,
  },
  meaningEnText: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.body,
    color: ds.onInk,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: ds.onInkFaint,
    padding: 14,
    borderRadius: dsRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: ds.sky,
    width: '100%',
    marginBottom: 8,
  },
  exampleTitle: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.skyLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  exampleText: {
    fontSize: dsSize.sm + 1,
    fontFamily: dsFont.medium,
    color: ds.white,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  exampleViText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.body,
    color: ds.onInk,
    marginTop: 4,
    lineHeight: 17,
  },
  collocationBox: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '100%',
  },
  collocationText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.semibold,
    color: '#FCD34D',
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: ds.bg,
  },
  cardFooterBack: { backgroundColor: ds.onInkFaint },
  flipHintText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.medium,
    color: ds.muted,
  },
  ratingSection: {
    marginTop: 6,
  },
  ratingSectionTitle: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.muted,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtnOuter: { flex: 1, height: 62 },
  rateBtnEdge: { position: 'absolute', left: 0, right: 0, top: 4, height: 58, borderRadius: dsRadius.md },
  rateBtn: {
    height: 58,
    borderRadius: dsRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rateBtnTitle: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.bold,
  },
  rateBtnSub: {
    fontSize: 11,
    fontFamily: dsFont.medium,
    opacity: 0.85,
    marginTop: 2,
  },
  completedContainer: {
    flex: 1,
    backgroundColor: ds.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completedActions: { width: '100%', gap: 12, marginTop: 8 },
  completedIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: ds.skySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  doneBadgeWrap: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: ds.green,
    borderBottomWidth: 6,
    borderBottomColor: ds.greenEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    fontSize: dsSize.xl,
    fontFamily: dsFont.displayHeavy,
    color: ds.ink,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  completedSub: {
    fontSize: dsSize.sm + 1,
    fontFamily: dsFont.body,
    color: ds.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
});
