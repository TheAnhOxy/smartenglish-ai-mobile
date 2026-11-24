// winter/WinterPath.tsx — Đường đi + chi tiết nút bài học cho bản đồ mùa đông.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { WINTER } from './winterWorlds';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Điểm trên đường cong Bezier bậc 3 (dùng đặt dấu chân đúng trên đường). */
const bezier = (t: number, p0: number, p1: number, p2: number, p3: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;

interface WinterBranchProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Đoạn đã đi qua (cả hai đầu hoàn thành). */
  isCompleted: boolean;
  /** Đoạn đang học (từ bài hiện tại / vừa xong sang bài kế). */
  isUpcoming: boolean;
}

/**
 * Một đoạn đường giữa hai bài (vẽ bên trong <Svg> của chương): lớp tuyết hai bên, mặt đường,
 * ánh sáng theo trạng thái, và dấu chân trên tuyết ở đoạn đã đi.
 */
export const WinterBranch: React.FC<WinterBranchProps> = ({ fromX, fromY, toX, toY, isCompleted, isUpcoming }) => {
  const midY = (fromY + toY) / 2;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  // Ánh sáng chạy dọc đoạn đang học
  const flow = useSharedValue(0);
  useEffect(() => {
    if (!isUpcoming || isCompleted) return;
    flow.value = withRepeat(withTiming(-60, { duration: 1600, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(flow);
  }, [isUpcoming, isCompleted, flow]);
  const flowProps = useAnimatedProps(() => ({ strokeDashoffset: flow.value }));

  const road = isCompleted ? WINTER.gold : isUpcoming ? WINTER.cyan : '#334663';
  const steps = isCompleted
    ? [0.28, 0.42, 0.56, 0.7].map((t, i) => {
        const x = bezier(t, fromX, fromX, toX, toX);
        const y = bezier(t, fromY, midY, midY, toY);
        const side = i % 2 === 0 ? -4 : 4;
        return { x: x + side, y };
      })
    : [];

  return (
    <>
      {/* Lớp tuyết hai bên đường */}
      <Path d={d} stroke="rgba(241,245,249,0.16)" strokeWidth={30} strokeLinecap="round" fill="none" />
      <Path d={d} stroke="rgba(241,245,249,0.10)" strokeWidth={20} strokeLinecap="round" fill="none" />
      {/* Quầng sáng */}
      {isCompleted || isUpcoming ? <Path d={d} stroke={`${road}40`} strokeWidth={14} strokeLinecap="round" fill="none" /> : null}
      {/* Mặt đường */}
      <Path
        d={d}
        stroke={road}
        strokeWidth={isCompleted || isUpcoming ? 6 : 5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={isCompleted || isUpcoming ? undefined : '2,10'}
        opacity={isCompleted || isUpcoming ? 1 : 0.85}
      />
      {/* Ánh sáng chạy dọc đường đang học */}
      {isUpcoming && !isCompleted ? (
        <AnimatedPath d={d} stroke={WINTER.snow} strokeWidth={3} strokeLinecap="round" fill="none" strokeDasharray="6,54" animatedProps={flowProps} />
      ) : null}
      {/* Dấu chân trên tuyết */}
      {steps.map((p, i) => (
        <Ellipse key={i} cx={p.x} cy={p.y} rx={2.2} ry={3.4} fill="rgba(241,245,249,0.55)" />
      ))}
    </>
  );
};

/** Hạt sáng xoay quanh nút bài học hiện tại. */
export const OrbitSparkles: React.FC<{ size: number; color?: string }> = ({ size, color = WINTER.cyan }) => {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const box = size + 26;
  const dots = [0, 120, 240];
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: box, height: box, left: -13, top: -13 }, spin]}>
      {dots.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = box / 2 + Math.cos(rad) * (box / 2 - 4) - 3;
        const y = box / 2 + Math.sin(rad) * (box / 2 - 4) - 3;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: i === 0 ? 7 : 5,
              height: i === 0 ? 7 : 5,
              borderRadius: 4,
              backgroundColor: i === 1 ? WINTER.gold : color,
              shadowColor: color,
              shadowOpacity: 1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      })}
    </Animated.View>
  );
};

/** Quầng sáng lan toả chậm phía sau nút. */
export const NodeGlow: React.FC<{ size: number; color: string; strong?: boolean }> = ({ size, color, strong }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: strong ? 1800 : 3000, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(p);
  }, [strong, p]);
  const ring = useAnimatedStyle(() => ({
    opacity: (strong ? 0.7 : 0.35) * (1 - p.value),
    transform: [{ scale: 1 + p.value * (strong ? 0.6 : 0.3) }],
  }));
  return (
    <>
      <View pointerEvents="none" style={[s.glowBase, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}26`, shadowColor: color }]} />
      <Animated.View pointerEvents="none" style={[s.glowRing, { width: size, height: size, borderRadius: size / 2, borderColor: color }, ring]} />
    </>
  );
};

/** Tuyết đọng trên đỉnh nút đã hoàn thành. */
export const SnowCap: React.FC<{ size: number }> = ({ size }) => (
  <Svg pointerEvents="none" width={size} height={18} style={{ position: 'absolute', top: -5, left: 0 }}>
    <Path
      d={`M ${size * 0.18} 14 Q ${size * 0.3} 2 ${size * 0.5} 4 Q ${size * 0.7} 2 ${size * 0.82} 14 Q ${size * 0.7} 10 ${size * 0.62} 13 Q ${size * 0.5} 8 ${size * 0.4} 13 Q ${size * 0.3} 10 ${size * 0.18} 14 Z`}
      fill={WINTER.snow}
    />
  </Svg>
);

/** Tinh thể băng nhỏ trên viền nút bị khoá. */
export const IceCrystals: React.FC<{ size: number }> = ({ size }) => (
  <Svg pointerEvents="none" width={size} height={size} style={StyleSheet.absoluteFill}>
    {[
      [0.16, 0.24],
      [0.84, 0.3],
      [0.22, 0.82],
    ].map(([fx, fy], i) => {
      const cx = fx * size;
      const cy = fy * size;
      const r = 5;
      return (
        <Path
          key={i}
          d={`M ${cx - r} ${cy} H ${cx + r} M ${cx} ${cy - r} V ${cy + r} M ${cx - r * 0.7} ${cy - r * 0.7} L ${cx + r * 0.7} ${cy + r * 0.7} M ${cx + r * 0.7} ${cy - r * 0.7} L ${cx - r * 0.7} ${cy + r * 0.7}`}
          stroke="rgba(224,242,254,0.75)"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      );
    })}
  </Svg>
);

/** Ánh kim chạy qua viền vàng của bài Premium. */
export const GoldShimmer: React.FC<{ size: number }> = ({ size }) => {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(withSequence(withDelay(1200, withTiming(1, { duration: 500 })), withTiming(0.3, { duration: 700 })), -1, false);
    return () => cancelAnimation(o);
  }, [o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: -3, top: -3, width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderWidth: 2, borderColor: WINTER.gold, shadowColor: WINTER.gold, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
        st,
      ]}
    />
  );
};

/** Trang trí banner chương: tuyết đọng mép trên, núi tuyết + sao phía sau chữ. */
export const WinterBannerDeco: React.FC<{ width: number; accent: string }> = ({ width, accent }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={width} height="100%" style={StyleSheet.absoluteFill}>
      {[0.12, 0.3, 0.55, 0.7, 0.88].map((fx, i) => (
        <Circle key={i} cx={fx * width} cy={14 + (i % 3) * 12} r={i % 2 ? 1.2 : 1.8} fill={WINTER.snow} opacity={0.7} />
      ))}
    </Svg>
    <View style={[s.bannerMountains, { borderColor: `${accent}55` }]}>
      <Svg width={width} height={44}>
        <Path
          d={`M 0 44 L ${width * 0.12} 18 L ${width * 0.24} 32 L ${width * 0.4} 8 L ${width * 0.56} 30 L ${width * 0.7} 14 L ${width * 0.86} 34 L ${width} 20 L ${width} 44 Z`}
          fill="rgba(147,197,253,0.14)"
        />
      </Svg>
    </View>
    <Svg width={width} height={16} style={{ position: 'absolute', top: -2, left: 0 }}>
      <Path
        d={`M 0 4 Q ${width * 0.08} 14 ${width * 0.16} 6 Q ${width * 0.26} 15 ${width * 0.36} 6 Q ${width * 0.46} 13 ${width * 0.56} 5 Q ${width * 0.66} 14 ${width * 0.76} 6 Q ${width * 0.88} 13 ${width} 4 L ${width} 0 L 0 0 Z`}
        fill={WINTER.snow}
      />
    </Svg>
  </View>
);

const s = StyleSheet.create({
  glowBase: { position: 'absolute', shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  glowRing: { position: 'absolute', borderWidth: 2 },
  bannerMountains: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, overflow: 'hidden' },
});
