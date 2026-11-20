import React, { useEffect } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Ba lớp cùng khung ảnh (tách từ LoxeraFront.png): đuôi nằm dưới thân, tay nằm trên thân.
const BODY = require('@/assets/images/mascot/fox-body.png');
const TAIL = require('@/assets/images/mascot/fox-tail.png');
const ARM = require('@/assets/images/mascot/fox-arm.png');

/** Tỉ lệ khung ảnh linh vật (rộng / cao). */
const RATIO = 371 / 495;
/** Điểm xoay: gốc đuôi ở hông, vai của cánh tay đang giơ (theo % khung ảnh). */
const TAIL_ORIGIN = '33% 79%';
const ARM_ORIGIN = '80% 49%';

interface AnimatedFoxMascotProps {
  /** Chiều cao linh vật (px). */
  size?: number;
  /** Nhảy vào khi xuất hiện. */
  entrance?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Linh vật cáo Loxera chuyển động: nhún thở, vẫy đuôi, vẫy tay chào. */
export const AnimatedFoxMascot: React.FC<AnimatedFoxMascotProps> = ({ size = 220, entrance = true, style }) => {
  const width = size * RATIO;
  // Ảnh require() mặc định lấy kích thước gốc, phải ghi rõ để co đúng khung
  const layerSize = { width, height: size };

  const enter = useSharedValue(entrance ? 0 : 1);
  const bob = useSharedValue(0);
  const tail = useSharedValue(0);
  const arm = useSharedValue(0);

  useEffect(() => {
    if (entrance) enter.value = withSpring(1, { damping: 11, stiffness: 120, mass: 0.9 });

    bob.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    // Vẫy tay 3 nhịp rồi nghỉ, lặp lại
    const wave = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(-0.4, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(-0.4, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) }),
      withDelay(1400, withTiming(0, { duration: 1 })),
    );
    arm.value = withDelay(entrance ? 500 : 0, withRepeat(wave, -1, false));

    return () => {
      cancelAnimation(bob);
      cancelAnimation(tail);
      cancelAnimation(arm);
    };
  }, [arm, bob, enter, entrance, tail]);

  const wrapStyle = useAnimatedStyle(() => {
    // Nhảy lên từ dưới, hơi bẹp lúc tiếp đất rồi bật lại
    const lift = (1 - enter.value) * size * 0.6;
    const squash = 1 + (1 - enter.value) * 0.08;
    return {
      opacity: Math.min(1, enter.value * 1.6),
      transform: [
        { translateY: lift - bob.value * size * 0.035 },
        { scaleX: squash },
        { scaleY: 2 - squash + bob.value * 0.012 },
      ],
    };
  });

  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tail.value * 9}deg` }],
  }));

  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-arm.value * 16}deg` }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + bob.value * 0.06 - (1 - enter.value) * 0.18,
    transform: [{ scaleX: 1 - bob.value * 0.12 }],
  }));

  return (
    <View style={[{ width, height: size + size * 0.06 }, style]} pointerEvents="none">
      <Animated.View style={[s.shadow, { width: width * 0.62, height: size * 0.06, left: width * 0.22, top: size * 0.98 }, shadowStyle]} />
      <Animated.View style={[{ width, height: size }, wrapStyle, s.wrapOrigin]}>
        <Animated.Image source={TAIL} style={[s.layer, layerSize, { transformOrigin: TAIL_ORIGIN }, tailStyle]} resizeMode="contain" />
        <Image source={BODY} style={[s.layer, layerSize]} resizeMode="contain" />
        <Animated.Image source={ARM} style={[s.layer, layerSize, { transformOrigin: ARM_ORIGIN }, armStyle]} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  wrapOrigin: { transformOrigin: '50% 100%' },
  layer: { position: 'absolute', top: 0, left: 0 },
  shadow: { position: 'absolute', borderRadius: 999, backgroundColor: '#000000' },
});
