import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ds, dsFont, dsSize } from '@/src/theme/ds';

const BODY = require('@/assets/images/mascot/fox-body.png');
const TAIL = require('@/assets/images/mascot/fox-tail.png');
const ARM = require('@/assets/images/mascot/fox-arm.png');

const RATIO = 371 / 495;
/** Một vòng chạy hết chiều ngang (ms) và số bước nhảy trong một vòng. */
const LAP_MS = 1900;
const HOPS = 6;

interface FoxRunLoaderProps {
  message?: string;
  subMessage?: string;
  /** Chiều cao con cáo (px). */
  size?: number;
  /** Bề rộng tối đa đường chạy. */
  maxWidth?: number;
  /** 'onDark' khi đặt trên nền tối. */
  tone?: 'default' | 'onDark';
  style?: StyleProp<ViewStyle>;
}

/** Vệt bụi nhỏ phía sau chân, xuất hiện theo nhịp nhảy. */
const Dust: React.FC<{ lap: SharedValue<number>; offset: number; trackWidth: number; foxWidth: number; size: number }> = ({
  lap,
  offset,
  trackWidth,
  foxWidth,
  size,
}) => {
  const style = useAnimatedStyle(() => {
    const p = lap.value;
    const hopPhase = (p * HOPS + offset) % 1;
    const x = -foxWidth + p * (trackWidth + foxWidth) - hopPhase * size * 0.5;
    return {
      opacity: (1 - hopPhase) * 0.45,
      transform: [{ translateX: x }, { translateY: -hopPhase * size * 0.12 }, { scale: 0.5 + hopPhase }],
    };
  });
  return <Animated.View style={[s.dust, { width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, bottom: 2 }, style]} />;
};

/** Hiệu ứng tải dữ liệu: linh vật cáo chạy ngang qua đường chạy. */
export const FoxRunLoader: React.FC<FoxRunLoaderProps> = ({
  message,
  subMessage,
  size = 64,
  maxWidth = 260,
  tone = 'default',
  style,
}) => {
  const foxWidth = size * RATIO;
  const [trackWidth, setTrackWidth] = useState(maxWidth);
  const lap = useSharedValue(0);
  const legs = useSharedValue(0);

  useEffect(() => {
    lap.value = withRepeat(withTiming(1, { duration: LAP_MS, easing: Easing.linear }), -1, false);
    legs.value = withRepeat(withTiming(1, { duration: LAP_MS / HOPS / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(lap);
      cancelAnimation(legs);
    };
  }, [lap, legs]);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(Math.min(maxWidth, e.nativeEvent.layout.width));

  const runnerStyle = useAnimatedStyle(() => {
    const p = lap.value;
    const hop = Math.abs(Math.sin(p * Math.PI * HOPS));
    return {
      transform: [
        { translateX: -foxWidth + p * (trackWidth + foxWidth) },
        { translateY: -hop * size * 0.16 },
        { rotate: `${6 - hop * 4}deg` },
        // bẹp nhẹ khi chạm đất
        { scaleY: 0.94 + hop * 0.06 },
      ],
    };
  });
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${(legs.value * 2 - 1) * 16}deg` }] }));
  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${(legs.value * 2 - 1) * -22}deg` }] }));

  const layer = { width: foxWidth, height: size };
  const dark = tone === 'onDark';

  return (
    <View style={[s.container, style]} accessibilityRole="progressbar" accessibilityLabel={message ?? 'Đang tải'}>
      <View style={[s.track, { height: size + 10, maxWidth }]} onLayout={onLayout}>
        <View style={[s.ground, { backgroundColor: dark ? ds.onInkFaint : ds.line }]} />
        {[0, 0.33, 0.66].map((o) => (
          <Dust key={o} lap={lap} offset={o} trackWidth={trackWidth} foxWidth={foxWidth} size={size} />
        ))}
        <Animated.View style={[s.runner, layer, s.runnerOrigin, runnerStyle]}>
          <Animated.Image source={TAIL} style={[s.layer, layer, { transformOrigin: '33% 79%' }, tailStyle]} resizeMode="contain" />
          <Image source={BODY} style={[s.layer, layer]} resizeMode="contain" />
          <Animated.Image source={ARM} style={[s.layer, layer, { transformOrigin: '80% 49%' }, armStyle]} resizeMode="contain" />
        </Animated.View>
      </View>
      {message ? <Text style={[s.message, dark && { color: ds.white }]}>{message}</Text> : null}
      {subMessage ? <Text style={[s.sub, dark && { color: ds.onInk }]}>{subMessage}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  track: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 3, height: 3, borderRadius: 2 },
  runner: { position: 'absolute', left: 0, bottom: 4 },
  runnerOrigin: { transformOrigin: '50% 100%' },
  layer: { position: 'absolute', top: 0, left: 0 },
  dust: { position: 'absolute', left: 0, backgroundColor: ds.lineStrong },
  message: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink, textAlign: 'center', marginTop: 12 },
  sub: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, textAlign: 'center', marginTop: 4 },
});
