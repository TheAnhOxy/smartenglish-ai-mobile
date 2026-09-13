import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image as RNImage,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Plus,
  Bookmark,
  CheckCircle2,
  Sparkles,
  ChevronUp,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeInDown,
  FadeIn,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Svg, { Path, Defs, Filter, FeDropShadow } from 'react-native-svg';
import { SaveWordSheetModal } from './SaveWordSheetModal';
import { speakText, stopSpeech } from '@/src/core/services/speechService';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';
import { colors, font } from '@/src/theme';
import { spring, timing } from '@/src/theme/motion';
import { detectionPalette, getDetectionColor } from '@/src/theme/detection';
import { usePressSpring } from '@/src/hooks/usePressSpring';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.44);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── L-Bracket SVG Corner Generator for Bounding Box ───
const CornerBracketBox: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isSelected: boolean;
  cornerLength?: number;
}> = ({ x, y, width, height, color, isSelected, cornerLength = 18 }) => {
  const cLen = Math.min(cornerLength, width * 0.35, height * 0.35);
  const strokeWidth = isSelected ? 3.5 : 2.5;

  // 4 L-shaped corners path: Top-Left, Top-Right, Bottom-Left, Bottom-Right
  const pathD = `
    M ${x} ${y + cLen} L ${x} ${y} L ${x + cLen} ${y}
    M ${x + width - cLen} ${y} L ${x + width} ${y} L ${x + width} ${y + cLen}
    M ${x} ${y + height - cLen} L ${x} ${y + height} L ${x + cLen} ${y + height}
    M ${x + width - cLen} ${y + height} L ${x + width} ${y + height} L ${x + width} ${y + height - cLen}
  `;

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={IMAGE_HEIGHT}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {/* Soft Glow Shadow behind bracket */}
      <Path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 4}
        strokeOpacity={isSelected ? 0.4 : 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crisp Main Corner Bracket Line */}
      <Path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ScanResultScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { imageUri, scanData } = useLocalSearchParams<{ imageUri?: string; scanData?: string }>();
  const { savedWords } = useDeckStore();

  const [itemsToSave, setItemsToSave] = useState<any[] | null>(null);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedConfirmToast, setSavedConfirmToast] = useState<string | null>(null);

  // Bottom Sheet Gesture & Drag Position
  // translateY: 0 (default expanded), > 0 (dragged down)
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);

  // Animation stagger values for synchronized box and card reveal
  const revealProgress = useSharedValue(0);

  const backSpring = usePressSpring(0.92);
  const saveAllSpring = usePressSpring(0.95);

  const parsed = scanData ? JSON.parse(scanData) : null;
  const rawObjects = parsed?.objects || [
    {
      id: '1',
      word_id: 'w-laptop',
      word: 'Laptop',
      phonetic: '/ˈlæp.tɑːp/',
      pos: 'Noun',
      meaning_vi: 'Máy tính xách tay',
      bounding_box: { x: 45, y: 80, width: 170, height: 130 },
      examples: { easy: 'She is working on her laptop.' },
    },
    {
      id: '2',
      word_id: 'w-coffee-cup',
      word: 'Coffee Cup',
      phonetic: '/ˈkɑː.fi kʌp/',
      pos: 'Noun',
      meaning_vi: 'Tách cà phê',
      bounding_box: { x: 190, y: 110, width: 90, height: 95 },
      examples: { easy: 'A hot coffee cup sits on the desk.' },
    },
    {
      id: '3',
      word_id: 'w-water-bottle',
      word: 'Water Bottle',
      phonetic: '/ˈwɑː.tər ˌbɑː.t̬əl/',
      pos: 'Noun',
      meaning_vi: 'Chai nước lọc',
      bounding_box: { x: 140, y: 25, width: 75, height: 85 },
      examples: { easy: 'Stay hydrated with a water bottle.' },
    },
  ];

  const objects = rawObjects.slice(0, 5);
  const displayImageUri = imageUri || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800';

  useEffect(() => {
    // Trigger staggered reveal
    revealProgress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const handlePlayAudio = (wordId: string, wordText: string) => {
    setSelectedBoxId(wordId);
    if (playingWordId === wordId) {
      stopSpeech();
      setPlayingWordId(null);
      return;
    }

    setPlayingWordId(wordId);
    speakText(wordText, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlayingWordId(null),
      onError: () => setPlayingWordId(null),
    });
  };

  const isWordSaved = (wordId: string) => {
    return savedWords.some((w) => w.word_id === wordId);
  };

  // ─── Direct Save All (No jumping / bounce animation) ───
  const handleBatchSaveAll = () => {
    setItemsToSave(objects);
  };

  // ─── Bottom Sheet Gesture Drag ───
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow dragging downwards only; rubber-band resist if dragging upwards
      if (event.translationY < 0) {
        translateY.value = contextY.value + event.translationY * 0.25;
      } else {
        translateY.value = contextY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 600) {
        // Snap partially down (collapsed preview)
        translateY.value = withSpring(180, spring.gentle);
      } else {
        // Snap back to fully expanded top
        translateY.value = withSpring(0, spring.gentle);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ─── SAFE AREA AWARE BOUNDING BOX COORDINATE CONVERSION ───
  const TOP_SAFE_BOUNDARY = insets.top + 48; // Space reserved for back button / header

  return (
    <GestureHandlerRootView style={s.root}>
      <View style={s.container}>
        {/* ─── Top View: Scanned Photo with Skia/SVG Corner Brackets ─── */}
        <View style={s.imageContainer}>
          <RNImage
            source={{ uri: displayImageUri }}
            style={s.imageBackground}
            resizeMode="cover"
          />

          {/* Top Bar Floating Controls */}
          <View style={[s.floatingHeader, { top: insets.top + 8 }]}>
            <AnimatedPressable
              onPress={() => router.back()}
              onPressIn={backSpring.onPressIn}
              onPressOut={backSpring.onPressOut}
              style={[s.backBtn, backSpring.animatedStyle]}
            >
              <ArrowLeft color="#FFFFFF" size={20} />
            </AnimatedPressable>

            {/* Object Count Badge */}
            <View style={s.countBadge}>
              <View style={s.countDot} />
              <Text style={s.countBadgeText}>
                {objects.length} vật thể nhận diện
              </Text>
            </View>
          </View>

          {/* ─── Bounding Boxes & Dynamic Label Pills ─── */}
          {objects.map((item: any, idx: number) => {
            const boxData = item.bounding_box || {
              x: 40 + idx * 50,
              y: 50 + idx * 40,
              width: 120,
              height: 90,
            };
            const colorTheme = getDetectionColor(idx);
            const isPlaying = playingWordId === item.word_id;
            const isSelected = selectedBoxId === item.word_id;
            const isSaved = isWordSaved(item.word_id);

            // Convert to absolute pixel coordinates inside image container
            const boxX = Math.max(
              12,
              Math.min((boxData.x / 300) * SCREEN_WIDTH, SCREEN_WIDTH - 90)
            );
            const boxY = Math.max(
              TOP_SAFE_BOUNDARY,
              Math.min((boxData.y / 300) * IMAGE_HEIGHT, IMAGE_HEIGHT - 70)
            );
            const boxWidth = Math.max(
              65,
              Math.min((boxData.width / 300) * SCREEN_WIDTH, SCREEN_WIDTH - boxX - 12)
            );
            const boxHeight = Math.max(
              50,
              Math.min((boxData.height / 300) * IMAGE_HEIGHT, IMAGE_HEIGHT - boxY - 12)
            );

            // ─── DYNAMIC SAFE-AREA LABEL POSITIONING LOGIC ───
            // Solves the exact bug where labels overflowed status bar / clock:
            const LABEL_HEIGHT = 26;
            let labelTop = boxY - LABEL_HEIGHT - 5;
            let isInside = false;

            // If label would collide with top safe area or header, put it INSIDE the box!
            if (labelTop < TOP_SAFE_BOUNDARY + 6) {
              labelTop = boxY + 6;
              isInside = true;
            }

            // Clamp horizontally to prevent clipping off screen edges
            const labelLeft = Math.max(8, Math.min(boxX, SCREEN_WIDTH - 150));

            return (
              <React.Fragment key={item.id || item.word_id || idx}>
                {/* SVG Corner-Bracket Style Box */}
                <CornerBracketBox
                  x={boxX}
                  y={boxY}
                  width={boxWidth}
                  height={boxHeight}
                  color={colorTheme.stroke}
                  isSelected={isPlaying || isSelected}
                />

                {/* Touch Hit Area */}
                <Pressable
                  onPress={() => handlePlayAudio(item.word_id, item.word)}
                  style={[
                    s.boxHitArea,
                    {
                      left: boxX,
                      top: boxY,
                      width: boxWidth,
                      height: boxHeight,
                      zIndex: isSelected ? 40 : 20,
                    },
                  ]}
                />

                {/* Dynamic Safe-Positioned Label Pill */}
                <AnimatedPressable
                  entering={FadeIn.delay(120 * idx).duration(260)}
                  onPress={() => handlePlayAudio(item.word_id, item.word)}
                  style={[
                    s.labelPill,
                    {
                      left: labelLeft,
                      top: labelTop,
                      backgroundColor: colorTheme.soft,
                      borderColor: colorTheme.stroke,
                      zIndex: isSelected ? 50 : 30,
                    },
                    (isPlaying || isSelected) && s.labelPillActive,
                  ]}
                >
                  <View
                    style={[
                      s.labelNumberCircle,
                      { backgroundColor: colorTheme.stroke },
                    ]}
                  >
                    <Text style={s.labelNumberText}>{idx + 1}</Text>
                  </View>
                  <Text
                    style={[s.labelText, { color: colorTheme.stroke }]}
                    numberOfLines={1}
                  >
                    {item.word}
                  </Text>
                  {isSaved && (
                    <Text style={[s.labelSavedTick, { color: colorTheme.stroke }]}>
                      ✓
                    </Text>
                  )}
                </AnimatedPressable>
              </React.Fragment>
            );
          })}
        </View>

        {/* ─── Bottom Sheet: Vocabulary List with Gesture Drag ─── */}
        <Animated.View style={[s.bottomSheet, animatedSheetStyle]}>
          {/* Pan Drag Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={s.dragHandleBar}>
              <View style={s.dragIndicator} />
            </View>
          </GestureDetector>

          {/* Header Row */}
          <View style={s.sheetHeaderRow}>
            <View>
              <Text style={s.sheetTitle}>Từ Vựng Phát Hiện</Text>
              <Text style={s.sheetSub}>Nhấn vào thẻ hoặc khung để nghe phát âm</Text>
            </View>

            {/* Batch Save All Button */}
            <AnimatedPressable
              onPress={handleBatchSaveAll}
              onPressIn={saveAllSpring.onPressIn}
              onPressOut={saveAllSpring.onPressOut}
              style={[s.saveAllBtn, saveAllSpring.animatedStyle]}
            >
              <Plus color={colors.primary} size={15} />
              <Text style={s.saveAllText}>Lưu Tất Cả</Text>
            </AnimatedPressable>
          </View>

          {/* Cards List: Surface White, 3px Left Border, Color Dot */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.cardsScrollContent}
          >
            {objects.map((item: any, idx: number) => {
              const colorTheme = getDetectionColor(idx);
              const isPlayingThis = playingWordId === item.word_id;
              const isSelected = selectedBoxId === item.word_id;
              const isSaved = isWordSaved(item.word_id);

              return (
                <Animated.View
                  key={item.id || item.word_id || idx}
                  entering={FadeInDown.delay(120 * idx).duration(300)}
                  style={[
                    s.vocabCard,
                    { borderLeftColor: colorTheme.stroke },
                    isSelected && s.vocabCardSelected,
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedBoxId(item.word_id);
                      handlePlayAudio(item.word_id, item.word);
                    }}
                    style={s.vocabCardMain}
                  >
                    {/* Number Identifier Dot */}
                    <View
                      style={[
                        s.indexBadge,
                        { backgroundColor: colorTheme.stroke },
                      ]}
                    >
                      <Text style={s.indexBadgeText}>{idx + 1}</Text>
                    </View>

                    {/* Audio Speaker Button */}
                    <Pressable
                      onPress={() => handlePlayAudio(item.word_id, item.word)}
                      style={[
                        s.speakerBtn,
                        { backgroundColor: colorTheme.soft },
                        isPlayingThis && { backgroundColor: colorTheme.stroke },
                      ]}
                    >
                      {isPlayingThis ? (
                        <VolumeX color="#FFFFFF" size={17} />
                      ) : (
                        <Volume2 color={colorTheme.stroke} size={17} />
                      )}
                    </Pressable>

                    {/* Vocabulary Content */}
                    <View style={s.wordContent}>
                      <View style={s.wordTitleRow}>
                        <Text style={s.wordHeading} numberOfLines={1}>
                          {item.word}
                        </Text>
                        <View
                          style={[
                            s.posChip,
                            { backgroundColor: colorTheme.soft },
                          ]}
                        >
                          <Text
                            style={[s.posChipText, { color: colorTheme.stroke }]}
                          >
                            {item.pos || 'Noun'}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.phoneticText} numberOfLines={1}>
                        {item.phonetic} • {item.meaning_vi}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Single Item Save Button */}
                  <Pressable
                    onPress={() => setItemsToSave([item])}
                    style={[
                      s.cardSaveBtn,
                      isSaved && s.cardSaveBtnDone,
                    ]}
                  >
                    {isSaved ? (
                      <CheckCircle2 color={colors.success} size={16} />
                    ) : (
                      <Bookmark color={colors.textSoft} size={16} />
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Save Word Modal for Deck Integration */}
        {itemsToSave && (
          <SaveWordSheetModal
            visible={!!itemsToSave}
            itemsToSave={itemsToSave}
            onClose={() => setItemsToSave(null)}
            onSaved={(deckName) => {
              setItemsToSave(null);
              setSavedConfirmToast(`Đã lưu từ vựng vào bộ thẻ "${deckName}"! ✨`);
              setTimeout(() => setSavedConfirmToast(null), 3000);
            }}
          />
        )}

        {/* Confirmation Toast */}
        {savedConfirmToast && (
          <Animated.View entering={FadeIn.duration(200)} style={s.toastPill}>
            <CheckCircle2 color="#FFFFFF" size={16} />
            <Text style={s.toastText}>{savedConfirmToast}</Text>
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090A10',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0A0B12',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(10, 10, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 10, 16, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  boxHitArea: {
    position: 'absolute',
  },
  labelPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  labelPillActive: {
    transform: [{ scale: 1.05 }],
  },
  labelNumberCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelNumberText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  labelText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  labelSavedTick: {
    fontSize: 11,
    fontWeight: '900',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dragHandleBar: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: colors.textSoft,
    marginTop: 2,
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
  },
  saveAllText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.primary,
  },
  cardsScrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  vocabCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vocabCardSelected: {
    borderColor: colors.primary,
    shadowOpacity: 0.08,
  },
  vocabCardFlyAway: {
    transform: [{ translateY: 20 }, { scale: 0.9 }],
    opacity: 0,
  },
  vocabCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  indexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  speakerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordContent: {
    flex: 1,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  wordHeading: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '800',
    color: colors.text,
  },
  posChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  posChipText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '700',
  },
  phoneticText: {
    fontSize: 12,
    fontFamily: font.family,
    color: colors.textSoft,
  },
  cardSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSaveBtnDone: {
    backgroundColor: colors.successSoft,
  },
  toastPill: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
