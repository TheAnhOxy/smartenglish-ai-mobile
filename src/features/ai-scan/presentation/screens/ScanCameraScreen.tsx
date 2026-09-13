import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image as RNImage,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  HelpCircle,
  Image as ImageIcon,
  Flashlight,
  Scan,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { submitScanImageApi } from '../../data/scanApi';
import { colors, font } from '@/src/theme';
import { usePressSpring } from '@/src/hooks/usePressSpring';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_WIDTH - 48, 330);
const CORNER_SIZE = 34;
const CORNER_WIDTH = 3.5;
const CORNER_RADIUS = 16;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Scan Line Beam Component (ScanProcessing) ───
const ScanLaserBeam = ({ height }: { height: number }) => {
  const translateY = useSharedValue(-40);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(height + 40, {
        duration: 1300,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.laserBeamContainer,
        { width: VIEWFINDER_SIZE },
        animatedStyle,
      ]}
    >
      {/* Soft Glow Gradient Veil */}
      <View style={s.laserVeil} />
      {/* Crisp Main Laser Line */}
      <View style={s.laserLine} />
    </Animated.View>
  );
};

export const ScanCameraScreen = () => {
  const router = useRouter();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [detectedTargetActive, setDetectedTargetActive] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);

  // Springs for interactive buttons
  const shutterSpring = usePressSpring(0.94);
  const flashSpring = usePressSpring(0.92);
  const gallerySpring = usePressSpring(0.92);
  const backSpring = usePressSpring(0.92);

  // ─── Viewfinder Breathing Animation (Scale 1.03 -> 1 with smooth sine, cycle 2.2s) ───
  const breatheScale = useSharedValue(1);
  // Bracket highlight color animation (neutral -> primary highlight)
  const bracketHighlight = useSharedValue(0);
  // Shutter button periodic pulse ring (once every 3s)
  const shutterRingPulse = useSharedValue(1);
  const shutterRingOpacity = useSharedValue(0);

  // Processing stage messages
  const STAGE_TEXTS = [
    'Đang phân tích khung hình...',
    'Đang nhận diện vật thể AI...',
    'Đang tra từ vựng & ngữ cảnh...',
  ];

  useFocusEffect(
    useCallback(() => {
      setCapturedImageUri(null);
      setIsScanning(false);
      setProcessingStage(0);
    }, [])
  );

  // Start breathing animation
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.028, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Subtle edge-detection simulation: after 1.5s in viewfinder, highlight brackets to signal object locked
    const timer = setTimeout(() => {
      setDetectedTargetActive(true);
      bracketHighlight.value = withTiming(1, { duration: 300 });
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  // Periodic Shutter Ring Pulse: 1 subtle pulse every 3 seconds
  useEffect(() => {
    const triggerPulse = () => {
      shutterRingPulse.value = 1;
      shutterRingOpacity.value = 0.8;

      shutterRingPulse.value = withTiming(1.32, { duration: 750, easing: Easing.out(Easing.quad) });
      shutterRingOpacity.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.quad) });
    };

    triggerPulse();
    const interval = setInterval(triggerPulse, 3200);
    return () => clearInterval(interval);
  }, []);

  const animatedViewfinderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isScanning ? 1 : breatheScale.value }],
  }));

  const animatedShutterRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterRingPulse.value }],
    opacity: shutterRingOpacity.value,
  }));

  const processAndNavigate = async (uri: string, base64?: string | null) => {
    setIsScanning(true);
    setCapturedImageUri(uri);
    setProcessingStage(0);

    // Multi-stage text pipeline progression with smooth crossfade
    const stage1Timer = setTimeout(() => setProcessingStage(1), 600);
    const stage2Timer = setTimeout(() => setProcessingStage(2), 1400);

    try {
      const scanResult = await submitScanImageApi(base64 || undefined, 'object');

      // Finish & transition smoothly to results
      setTimeout(() => {
        setIsScanning(false);
        router.push({
          pathname: '/(student)/practice/scan/result' as any,
          params: {
            imageUri: uri,
            scanData: JSON.stringify(scanResult),
          },
        });
      }, 1900);
    } catch (err) {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      setIsScanning(false);
      Alert.alert('Lỗi Quét AI', 'Không thể phân tích ảnh lúc này. Vui lòng thử lại.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần Quyền Camera', 'Vui lòng cấp quyền camera trong Cài đặt để quét từ vựng.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndNavigate(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Thông báo', 'Không thể mở camera. Bạn có thể chọn ảnh từ thư viện.');
    }
  };

  const handlePickLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần Quyền Thư Viện', 'Vui lòng cấp quyền thư viện để chọn ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndNavigate(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Library pick error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện.');
    }
  };

  const bracketColor = detectedTargetActive ? colors.primary : 'rgba(255, 255, 255, 0.85)';

  return (
    <View style={s.container}>
      {/* ─── Top Header Bar ─── */}
      <View style={s.topBar}>
        <AnimatedPressable
          onPress={() => router.back()}
          onPressIn={backSpring.onPressIn}
          onPressOut={backSpring.onPressOut}
          style={[s.iconCircleBtn, backSpring.animatedStyle]}
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </AnimatedPressable>

        {/* Minimalist AI Lens Title Badge */}
        <View style={s.titleBadge}>
          <Sparkles color="#FFFFFF" size={14} />
          <Text style={s.titleBadgeText}>AI Object Scanner</Text>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Hướng Dẫn Quét Từ Vựng',
              'Đặt vật thể (sách, chai nước, laptop...) vào giữa khung ngắm hoặc chọn ảnh từ thư viện. AI sẽ nhận diện tối đa 5 vật thể và tạo thẻ flashcard học tập.'
            )
          }
          style={s.iconCircleBtn}
        >
          <HelpCircle color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      {/* ─── Central Viewfinder Area ─── */}
      <View style={s.viewfinderWrapper}>
        <Animated.View style={[s.viewfinderBox, animatedViewfinderStyle]}>
          {/* Captured Image Preview (SÁNG RÕ trong lúc quét, không tối om) */}
          {capturedImageUri ? (
            <RNImage
              source={{ uri: capturedImageUri }}
              style={s.capturedImage}
              resizeMode="cover"
            />
          ) : (
            /* Live Camera Aim Space — Dark glass translucent background */
            <View style={s.cameraAimSpace}>
              {/* Target lock hint tag */}
              {detectedTargetActive && (
                <Animated.View entering={FadeIn.duration(250)} style={s.lockBadge}>
                  <CheckCircle2 color={colors.primary} size={13} />
                  <Text style={s.lockBadgeText}>Đã khóa mục tiêu</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* ─── PURE CORNER-ONLY BRACKETS (Google Lens Style) ─── */}
          {/* Top-Left */}
          <View
            style={[
              s.cornerBracket,
              s.cornerTL,
              { borderColor: bracketColor },
            ]}
          />
          {/* Top-Right */}
          <View
            style={[
              s.cornerBracket,
              s.cornerTR,
              { borderColor: bracketColor },
            ]}
          />
          {/* Bottom-Left */}
          <View
            style={[
              s.cornerBracket,
              s.cornerBL,
              { borderColor: bracketColor },
            ]}
          />
          {/* Bottom-Right */}
          <View
            style={[
              s.cornerBracket,
              s.cornerBR,
              { borderColor: bracketColor },
            ]}
          />

          {/* ─── REAL SCAN LINE OVERLAY (Khi đang xử lý ảnh vừa chụp) ─── */}
          {isScanning && <ScanLaserBeam height={VIEWFINDER_SIZE} />}
        </Animated.View>

        {/* Dynamic Multi-Step Pipeline Text Bar */}
        {isScanning ? (
          <View style={s.processingPill}>
            <View style={s.spinnerDot} />
            <Text style={s.processingText}>
              {STAGE_TEXTS[processingStage]}
            </Text>
          </View>
        ) : (
          <Text style={s.viewfinderHint}>
            Căn chỉnh vật thể vào khung ngắm để AI nhận diện
          </Text>
        )}
      </View>

      {/* ─── Bottom Shutter & Tool Controls ─── */}
      <View style={s.bottomControls}>
        <View style={s.controlsRow}>
          {/* Flash Toggle */}
          <AnimatedPressable
            onPress={() => setIsFlashOn(!isFlashOn)}
            onPressIn={flashSpring.onPressIn}
            onPressOut={flashSpring.onPressOut}
            style={[
              s.auxToolBtn,
              isFlashOn && s.auxToolBtnActive,
              flashSpring.animatedStyle,
            ]}
          >
            <Flashlight color={isFlashOn ? colors.primary : '#FFFFFF'} size={22} />
          </AnimatedPressable>

          {/* Shutter Capture Button with 3s Periodic Pulse Ring */}
          <View style={s.shutterContainer}>
            {/* Ambient Pulse Ring */}
            {!isScanning && (
              <Animated.View style={[s.pulseRing, animatedShutterRingStyle]} />
            )}

            <AnimatedPressable
              onPress={handleCaptureCamera}
              disabled={isScanning}
              onPressIn={shutterSpring.onPressIn}
              onPressOut={shutterSpring.onPressOut}
              style={[s.shutterOuterBtn, shutterSpring.animatedStyle]}
            >
              <View style={s.shutterInnerCircle}>
                <Scan color="#FFFFFF" size={28} />
              </View>
            </AnimatedPressable>
          </View>

          {/* Image Library Picker */}
          <AnimatedPressable
            onPress={handlePickLibrary}
            disabled={isScanning}
            onPressIn={gallerySpring.onPressIn}
            onPressOut={gallerySpring.onPressOut}
            style={[s.auxToolBtn, gallerySpring.animatedStyle]}
          >
            <ImageIcon color="#FFFFFF" size={22} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 30,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  titleBadgeText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  viewfinderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  viewfinderBox: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(25, 26, 40, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  cameraAimSpace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lockBadgeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: colors.text,
  },
  cornerBracket: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    zIndex: 20,
  },
  cornerTL: {
    top: 10,
    left: 10,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 10,
    right: 10,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: CORNER_RADIUS,
  },
  laserBeamContainer: {
    position: 'absolute',
    left: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  laserVeil: {
    position: 'absolute',
    width: '100%',
    height: 38,
    backgroundColor: colors.primarySoft,
    opacity: 0.28,
  },
  laserLine: {
    width: '100%',
    height: 2.5,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  processingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  processingText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  viewfinderHint: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  bottomControls: {
    paddingHorizontal: 28,
    zIndex: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auxToolBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  auxToolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: colors.primary,
  },
  shutterContainer: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  shutterOuterBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
