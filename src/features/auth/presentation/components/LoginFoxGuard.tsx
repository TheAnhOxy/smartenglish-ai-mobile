import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ds } from '@/src/theme/ds';

const BODY = require('@/assets/images/mascot/fox-body.png');
const TAIL = require('@/assets/images/mascot/fox-tail.png');
const ARM = require('@/assets/images/mascot/fox-arm.png');

const RATIO = 371 / 495;
/** Màu lông và đệm chân lấy theo ảnh linh vật. */
const FUR = ds.heart;
const PAD = ds.ink;

/** Vị trí hai mắt trong khung ảnh (tỉ lệ 0..1). */
const EYES = [
  { x: 0.435, y: 0.388 },
  { x: 0.668, y: 0.328 },
] as const;
/** Bàn tay đang giơ, nơi cầm đèn pin. */
const TORCH = { x: 0.9, y: 0.5 };

export type FoxMood = 'idle' | 'shy' | 'peek';

interface LoginFoxGuardProps {
  mood: FoxMood;
  size?: number;
  /** Chiều dài chùm sáng đèn pin chiếu xuống (px). */
  beamLength?: number;
}

/** Bàn chân che mắt: lông cam, ba đệm nhỏ và một đệm lớn. */
const Paw: React.FC<{ size: number }> = ({ size }) => (
  <View style={[s.paw, { width: size, height: size * 0.82, borderRadius: size / 2 }]}>
    <View style={[s.padBig, { width: size * 0.42, height: size * 0.34, borderRadius: size * 0.2, bottom: size * 0.14 }]} />
    {[-0.26, 0, 0.26].map((dx) => (
      <View
        key={dx}
        style={[
          s.padSmall,
          {
            width: size * 0.17,
            height: size * 0.2,
            borderRadius: size * 0.1,
            top: size * (dx === 0 ? 0.12 : 0.2),
            left: size * (0.5 + dx) - size * 0.085,
          },
        ]}
      />
    ))}
  </View>
);

/** Linh vật cáo trên màn đăng nhập: che mắt khi nhập mật khẩu, bật đèn pin khi hiện mật khẩu. */
export const LoginFoxGuard: React.FC<LoginFoxGuardProps> = ({ mood, size = 150, beamLength = 230 }) => {
  const width = size * RATIO;
  const layer = { width, height: size };
  const pawSize = size * 0.24;

  const bob = useSharedValue(0);
  const tail = useSharedValue(0);
  const cover = useSharedValue(0); // 0: tay hạ, 1: che kín mắt
  const torch = useSharedValue(0); // 0: tắt, 1: bật
  const sweep = useSharedValue(0);
  const flicker = useSharedValue(1);

  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    sweep.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(bob);
      cancelAnimation(tail);
      cancelAnimation(sweep);
    };
  }, [bob, sweep, tail]);

  useEffect(() => {
    cover.value = withSpring(mood === 'shy' ? 1 : 0, { damping: 14, stiffness: 170 });
    torch.value = withTiming(mood === 'peek' ? 1 : 0, { duration: mood === 'peek' ? 260 : 180 });
    if (mood === 'peek') {
      // Đèn chập chờn một nhịp lúc bật cho sinh động
      flicker.value = withSequence(
        withTiming(0.3, { duration: 70 }),
        withTiming(1, { duration: 90 }),
        withTiming(0.55, { duration: 60 }),
        withTiming(1, { duration: 120 }),
      );
    }
  }, [cover, flicker, mood, torch]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * size * 0.03 }],
  }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tail.value * 8}deg` }] }));
  // Khi che mắt thì cánh tay nghiêng vào phía mặt; khi soi đèn thì hơi hạ xuống
  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-cover.value * 18 - torch.value * 6}deg` }],
  }));
  const leftPaw = useAnimatedStyle(() => ({
    opacity: Math.min(1, cover.value * 1.4),
    transform: [{ translateY: (1 - cover.value) * size * 0.55 }, { rotate: `${-(14 + (1 - cover.value) * 25)}deg` }],
  }));
  const rightPaw = useAnimatedStyle(() => ({
    opacity: Math.min(1, cover.value * 1.4),
    transform: [{ translateY: (1 - cover.value) * size * 0.55 }, { rotate: `${14 + (1 - cover.value) * 25}deg` }],
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: torch.value * flicker.value,
    transform: [{ rotate: `${10 + sweep.value * 12}deg` }, { scaleY: 0.6 + torch.value * 0.4 }],
  }));
  const torchStyle = useAnimatedStyle(() => ({
    opacity: torch.value,
    transform: [{ scale: 0.6 + torch.value * 0.4 }, { rotate: `${-8 + sweep.value * 16}deg` }],
  }));

  const beamWidth = beamLength * 0.9;

  return (
    <View style={{ width, height: size }} pointerEvents="none">
      <Animated.View style={[{ width, height: size }, wrapStyle]}>
        {/* Chùm sáng: từ đèn pin trên tay chiếu chéo xuống dưới */}
        <Animated.View
          style={[
            s.beam,
            {
              width: beamWidth,
              height: beamLength,
              left: width * TORCH.x - beamWidth / 2,
              top: size * TORCH.y,
              transformOrigin: '50% 0%',
            },
            beamStyle,
          ]}
        >
          <Svg width={beamWidth} height={beamLength}>
            <Defs>
              <SvgGradient id="beam" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ds.amberSoft} stopOpacity="0.95" />
                <Stop offset="0.55" stopColor={ds.amberSoft} stopOpacity="0.45" />
                <Stop offset="1" stopColor={ds.amberSoft} stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Polygon
              points={`${beamWidth / 2 - 6},0 ${beamWidth / 2 + 6},0 ${beamWidth},${beamLength} 0,${beamLength}`}
              fill="url(#beam)"
            />
          </Svg>
        </Animated.View>

        <Animated.Image source={TAIL} style={[s.layer, layer, { transformOrigin: '33% 79%' }, tailStyle]} resizeMode="contain" />
        <Image source={BODY} style={[s.layer, layer]} resizeMode="contain" />
        <Animated.Image source={ARM} style={[s.layer, layer, { transformOrigin: '80% 49%' }, armStyle]} resizeMode="contain" />

        {/* Đèn pin trong bàn tay */}
        <Animated.View
          style={[
            s.torch,
            { left: width * TORCH.x - size * 0.045, top: size * (TORCH.y - 0.1), width: size * 0.09, height: size * 0.16 },
            torchStyle,
          ]}
        >
          <View style={[s.torchHead, { height: size * 0.05 }]} />
        </Animated.View>

        {/* Hai bàn chân che mắt */}
        {EYES.map((eye, i) => (
          <Animated.View
            key={i}
            style={[
              s.pawWrap,
              { left: width * eye.x - pawSize / 2, top: size * eye.y - pawSize * 0.5 },
              i === 0 ? leftPaw : rightPaw,
            ]}
          >
            <Paw size={pawSize} />
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0 },
  beam: { position: 'absolute' },
  torch: { position: 'absolute', borderRadius: 4, backgroundColor: ds.inkSoft, justifyContent: 'flex-end', overflow: 'hidden' },
  torchHead: { backgroundColor: ds.amber },
  pawWrap: { position: 'absolute' },
  paw: { backgroundColor: FUR, borderWidth: 1.5, borderColor: ds.amberDeep, overflow: 'hidden', ...{ shadowColor: ds.ink, shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 } },
  padBig: { position: 'absolute', alignSelf: 'center', backgroundColor: PAD, opacity: 0.5 },
  padSmall: { position: 'absolute', backgroundColor: PAD, opacity: 0.5 },
});
