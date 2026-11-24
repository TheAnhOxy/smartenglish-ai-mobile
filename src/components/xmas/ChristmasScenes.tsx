// components/xmas/ChristmasScenes.tsx — "SmartEnglish Christmas Universe": mỗi màn một khung cảnh riêng.
//   library     — Thư viện phép thuật (Kho thẻ ghi nhớ)
//   expedition  — Hành trình núi tuyết (Thống kê · Tiến độ)
//   observatory — Đài quan sát pha lê (Thống kê · Đánh giá)
//   festival    — Lễ hội nhà vô địch (Thống kê · Xếp hạng)
// Mỗi cảnh nhiều lớp: gradient nền → môi trường → chi tiết → ánh sáng → lớp phủ giúp dễ đọc.
// Tất cả màu viết inline: bộ đổi màu giao diện tối không được đụng vào màu của cảnh.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { GiftBox, XmasTree } from './XmasArt';
import { Mountains, PineRow } from '@/src/features/learning-path/presentation/winter/WinterBackdrop';
import { Cabin, Lantern } from '@/src/features/learning-path/presentation/winter/WinterArt';

export type ChristmasSceneKey = 'library' | 'studyroom' | 'lodge' | 'expedition' | 'observatory' | 'festival';

const rand = (i: number, n: number) => {
  const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// ── Lớp chung ────────────────────────────────────────────────────────────────────────────────

/** Hạt trôi chậm (bụi vàng, năng lượng, bokeh). Số lượng nhỏ để giữ 60fps. */
const Particles: React.FC<{
  count: number;
  color: string;
  minSize: number;
  maxSize: number;
  rise?: boolean;
  opacity?: number;
  area?: { top: number; height: number };
}> = ({ count, color, minSize, maxSize, rise = true, opacity = 0.7, area }) => {
  const { width, height } = useWindowDimensions();
  const top = area?.top ?? 0;
  const h = area?.height ?? height;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: rand(i, 1) * width,
        y: top + rand(i, 2) * h,
        size: minSize + rand(i, 3) * (maxSize - minSize),
        duration: 6000 + rand(i, 4) * 6000,
        delay: rand(i, 5) * 4000,
        drift: (rand(i, 6) - 0.5) * 30,
      })),
    [count, width, top, h, minSize, maxSize],
  );
  return (
    <>
      {items.map((p, i) => (
        <Particle key={i} {...p} color={color} rise={rise} opacity={opacity} />
      ))}
    </>
  );
};

const Particle: React.FC<{ x: number; y: number; size: number; duration: number; delay: number; drift: number; color: string; rise: boolean; opacity: number }> = ({
  x,
  y,
  size,
  duration,
  delay,
  drift,
  color,
  rise,
  opacity,
}) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(p);
  }, [delay, duration, p]);
  const st = useAnimatedStyle(() => ({
    opacity: opacity * (0.3 + p.value * 0.7),
    transform: [{ translateY: rise ? -p.value * 40 : p.value * 12 }, { translateX: p.value * drift }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: size, shadowOffset: { width: 0, height: 0 } },
        st,
      ]}
    />
  );
};

/** Lớp phủ giúp nội dung dễ đọc mà không xoá mất khung cảnh. */
const Scrim: React.FC<{ color: string }> = ({ color }) => (
  <LinearGradient colors={['rgba(0,0,0,0)', color, color, 'rgba(0,0,0,0)']} locations={[0, 0.25, 0.75, 1]} style={StyleSheet.absoluteFill} />
);

/** Nhấp nháy/thở theo chu kỳ cho một khối sáng. */
const usePulse = (ms: number, delay = 0) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [ms, delay, v]);
  return v;
};

// ── 1. Thư viện phép thuật ────────────────────────────────────────────────────────────────────

const BOOK_COLORS = ['#7C2D12', '#166534', '#1E3A8A', '#A16207', '#4C1D95', '#9F1239', '#0F766E'];

const Bookshelf: React.FC<{ width: number; height: number; seed: number }> = ({ width, height, seed }) => {
  const shelves = Math.floor(height / 90);
  const rects: React.ReactNode[] = [];
  for (let s = 0; s < shelves; s++) {
    const baseY = 20 + s * 90;
    let x = 6;
    let i = 0;
    while (x < width - 10) {
      const w = 7 + rand(i + s * 13 + seed, 1) * 8;
      const h = 44 + rand(i + s * 7 + seed, 2) * 26;
      rects.push(<Rect key={`${s}-${i}`} x={x} y={baseY + 70 - h} width={w} height={h} rx={1.5} fill={BOOK_COLORS[(i + s + seed) % BOOK_COLORS.length]} />);
      x += w + 1.5;
      i++;
    }
    rects.push(<Rect key={`board-${s}`} x={0} y={baseY + 70} width={width} height={6} fill="#3F2A16" />);
  }
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill="#1A120B" opacity={0.85} />
      {rects}
    </Svg>
  );
};

/** Tuyết rơi trong khung cửa sổ (chỉ bên ngoài, không rơi trước mặt nội dung). */
const WindowSnow: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const flakes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ x: rand(i, 21) * width, d: 4000 + rand(i, 22) * 3000, delay: rand(i, 23) * 3000, s: 2 + rand(i, 24) * 2 })), [width]);
  return (
    <>
      {flakes.map((f, i) => (
        <WindowFlake key={i} x={f.x} size={f.s} duration={f.d} delay={f.delay} height={height} />
      ))}
    </>
  );
};

const WindowFlake: React.FC<{ x: number; size: number; duration: number; delay: number; height: number }> = ({ x, size, duration, delay, height }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, duration, p]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: p.value * height }, { translateX: Math.sin(p.value * 6) * 4 }] }));
  return <Animated.View style={[{ position: 'absolute', top: -4, left: x, width: size, height: size, borderRadius: size, backgroundColor: '#F8FAFC' }, st]} />;
};

/** `room`: phòng học (màn học flashcard) — thêm tuyết rơi ngoài cửa sổ và quà dưới cây thông. */
const LibraryScene: React.FC<{ room?: boolean }> = ({ room = false }) => {
  const { width, height } = useWindowDimensions();
  const fire = usePulse(900);
  const fireStyle = useAnimatedStyle(() => ({ opacity: 0.75 + fire.value * 0.25, transform: [{ scale: 1 + fire.value * 0.06 }] }));
  const shelfW = Math.min(78, width * 0.18);
  const winW = width * 0.42;
  const winX = (width - winW) / 2;
  return (
    <>
      <LinearGradient colors={['#071C1B', '#0B1726', '#0B1726', '#1C1208']} locations={[0, 0.4, 0.75, 1]} style={StyleSheet.absoluteFill} />
      {/* Cửa sổ lớn: ánh trăng + rừng thông tuyết */}
      <View style={{ position: 'absolute', left: winX, top: height * 0.1, width: winW, height: winW * 1.35, borderTopLeftRadius: winW / 2, borderTopRightRadius: winW / 2, overflow: 'hidden', borderWidth: 6, borderColor: '#3F2A16' }}>
        <LinearGradient colors={['#0B1F3A', '#1E3A8A']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', right: winW * 0.18, top: winW * 0.2, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC', shadowColor: '#BFDBFE', shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <PineRow width={winW} height={winW * 0.45} color="#0A1A2F" seed={5} />
          <View style={{ height: 10, backgroundColor: '#E2E8F0' }} />
        </View>
        {room ? <WindowSnow width={winW} height={winW * 1.35} /> : null}
        <View style={{ position: 'absolute', left: winW / 2 - 2, top: 0, bottom: 0, width: 4, backgroundColor: '#3F2A16' }} />
        <View style={{ position: 'absolute', top: winW * 0.75, left: 0, right: 0, height: 4, backgroundColor: '#3F2A16' }} />
      </View>
      {/* Ánh trăng chiếu qua cửa sổ */}
      <LinearGradient
        colors={['rgba(191,219,254,0.16)', 'rgba(191,219,254,0)']}
        style={{ position: 'absolute', left: winX - 20, top: height * 0.1 + winW * 1.2, width: winW + 40, height: height * 0.35, transform: [{ skewX: '-12deg' }] }}
      />
      {/* Kệ sách hai bên */}
      <View style={{ position: 'absolute', left: 0, top: height * 0.06, opacity: 0.6 }}>
        <Bookshelf width={shelfW} height={height * 0.9} seed={1} />
      </View>
      <View style={{ position: 'absolute', right: 0, top: height * 0.06, opacity: 0.6 }}>
        <Bookshelf width={shelfW} height={height * 0.9} seed={4} />
      </View>
      {/* Cây thông nhỏ cạnh cửa sổ */}
      <View style={{ position: 'absolute', left: winX + winW - 4, top: height * 0.1 + winW * 1.35 - 56, opacity: 0.9 }}>
        <XmasTree size={46} />
      </View>
      {room ? (
        <View style={{ position: 'absolute', left: winX + winW + 4, top: height * 0.1 + winW * 1.35 - 18, flexDirection: 'row', gap: 2 }}>
          <GiftBox size={18} delay={300} />
          <GiftBox size={14} color="#0EA5E9" delay={1100} />
        </View>
      ) : null}
      {/* Ánh lửa lò sưởi */}
      {/* Quầng sáng mềm: 3 vòng đồng tâm mờ dần (RN không có gradient tròn) */}
      <Animated.View style={[{ position: 'absolute', left: width / 2 - 220, bottom: -260, width: 440, height: 440 }, fireStyle]}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: 440, height: 440, borderRadius: 220, backgroundColor: 'rgba(251,146,60,0.10)' }} />
        <View style={{ position: 'absolute', left: 70, top: 70, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(251,146,60,0.14)' }} />
        <View style={{ position: 'absolute', left: 140, top: 140, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(251,191,36,0.22)' }} />
      </Animated.View>
      <Particles count={14} color="#FBBF24" minSize={2} maxSize={4} opacity={0.75} />
      <Scrim color="rgba(7,28,27,0.35)" />
    </>
  );
};

// ── 1b. Nhà gỗ Giáng sinh (Profile) ──────────────────────────────────────────────────────────

/** Tất Giáng sinh treo trên bệ lò sưởi. */
const Stocking: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={32} viewBox="0 0 22 32">
    <Path d="M4 0 H16 V18 Q16 28 8 30 Q0 31 1 25 Q2 21 6 20 V0 Z" fill={color} />
    <Rect x={3} y={0} width={14} height={6} rx={2} fill="#F8FAFC" />
  </Svg>
);

/** Ngọn nến có quầng sáng "thở". */
const Candle: React.FC<{ delay: number }> = ({ delay }) => {
  const g = usePulse(1300, delay);
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + g.value * 0.35, transform: [{ scale: 0.9 + g.value * 0.2 }] }));
  return (
    <View style={{ width: 14, height: 36, alignItems: 'center' }}>
      <Animated.View style={[{ position: 'absolute', top: -8, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FBBF24' }, glow]} />
      <View style={{ width: 5, height: 9, borderRadius: 3, backgroundColor: '#FDE68A', marginTop: 2 }} />
      <View style={{ width: 9, height: 22, borderRadius: 2, backgroundColor: '#F8FAFC', marginTop: 1 }} />
    </View>
  );
};

const LodgeScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const fire = usePulse(800);
  const flame = useAnimatedStyle(() => ({ opacity: 0.8 + fire.value * 0.2, transform: [{ scaleY: 0.9 + fire.value * 0.2 }] }));
  const warm = useAnimatedStyle(() => ({ opacity: 0.7 + fire.value * 0.3 }));
  const winW = width * 0.34;
  const fpW = width * 0.46;
  const fpX = (width - fpW) / 2;
  const fpTop = height * 0.66;
  // Ván gỗ tường
  const planks = Array.from({ length: 16 }, (_, i) => i * 46);
  return (
    <>
      <LinearGradient colors={['#081421', '#10251F', '#30251F']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {planks.map((y) => (
          <Rect key={y} x={0} y={height * 0.3 + y} width={width} height={2} fill="rgba(0,0,0,0.25)" />
        ))}
        {[0.22, 0.5, 0.78].map((fx) => (
          <Rect key={fx} x={fx * width} y={height * 0.3} width={2} height={height * 0.7} fill="rgba(0,0,0,0.18)" />
        ))}
      </Svg>
      {/* Cửa sổ: trời đêm + rừng thông tuyết + tuyết rơi bên ngoài */}
      <View style={{ position: 'absolute', left: 18, top: height * 0.08, width: winW, height: winW * 1.15, borderRadius: 10, overflow: 'hidden', borderWidth: 6, borderColor: '#4A3426' }}>
        <LinearGradient colors={['#0B1F3A', '#1E3A8A']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', right: 10, top: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#F8FAFC', shadowColor: '#BFDBFE', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <PineRow width={winW} height={winW * 0.45} color="#0A1A2F" seed={9} />
          <View style={{ height: 8, backgroundColor: '#E2E8F0' }} />
        </View>
        <WindowSnow width={winW} height={winW * 1.15} />
        <View style={{ position: 'absolute', left: winW / 2 - 2, top: 0, bottom: 0, width: 4, backgroundColor: '#4A3426' }} />
        <View style={{ position: 'absolute', top: winW * 0.55, left: 0, right: 0, height: 4, backgroundColor: '#4A3426' }} />
      </View>
      {/* Vòng nguyệt quế trên tường */}
      <View style={{ position: 'absolute', right: width * 0.2, top: height * 0.1 }}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={24} stroke="#166534" strokeWidth={11} fill="none" />
          <Circle cx={32} cy={32} r={24} stroke="#15803D" strokeWidth={5} strokeDasharray="6,5" fill="none" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <Circle key={deg} cx={32 + Math.cos((deg * Math.PI) / 180) * 24} cy={32 + Math.sin((deg * Math.PI) / 180) * 24} r={3} fill={i % 2 ? '#FBBF24' : '#DC2626'} />
          ))}
          <Path d="M26 54 L22 63 M38 54 L42 63" stroke="#B91C1C" strokeWidth={4} strokeLinecap="round" />
          <Circle cx={32} cy={54} r={4} fill="#B91C1C" />
        </Svg>
      </View>
      {/* Kệ cúp & huy hiệu */}
      <View style={{ position: 'absolute', right: 10, top: height * 0.33, width: width * 0.32 }}>
        <Svg width={width * 0.32} height={60}>
          <Rect x={0} y={44} width={width * 0.32} height={7} rx={2} fill="#4A3426" />
          <Path d={`M 18 44 V 34 H 30 V 44 M 14 18 H 34 Q 34 32 24 34 Q 14 32 14 18 Z`} fill="#FBBF24" />
          <Circle cx={width * 0.16} cy={30} r={11} fill="#CBD5E1" />
          <Circle cx={width * 0.16} cy={30} r={6} fill="#94A3B8" />
          <Circle cx={width * 0.26} cy={32} r={9} fill="#CD7F32" />
        </Svg>
      </View>
      {/* Cây thông lớn + quà */}
      <View style={{ position: 'absolute', right: -10, top: height * 0.5, opacity: 0.75 }}>
        <XmasTree size={110} delay={200} />
      </View>
      <View style={{ position: 'absolute', right: 30, top: height * 0.5 + 126, flexDirection: 'row', gap: 4, opacity: 0.85 }}>
        <GiftBox size={22} delay={500} />
        <GiftBox size={18} color="#0EA5E9" delay={1300} />
      </View>
      {/* Lò sưởi: ánh lửa + tất treo + nến */}
      <Animated.View style={[{ position: 'absolute', left: fpX - 80, top: fpTop - 60, width: fpW + 160, height: fpW + 160 }, warm]}>
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 999, backgroundColor: 'rgba(251,146,60,0.08)' }} />
        <View style={{ position: 'absolute', left: 50, top: 50, right: 50, bottom: 50, borderRadius: 999, backgroundColor: 'rgba(251,146,60,0.10)' }} />
      </Animated.View>
      <View style={{ position: 'absolute', left: fpX, top: fpTop, width: fpW, height: fpW * 0.8 }}>
        <View style={{ position: 'absolute', left: -10, right: -10, top: 0, height: 14, borderRadius: 4, backgroundColor: '#5B4636' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 14, bottom: 0, backgroundColor: '#3B2D24', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
        <View style={{ position: 'absolute', left: fpW * 0.2, right: fpW * 0.2, top: fpW * 0.28, bottom: 0, backgroundColor: '#120A06', borderTopLeftRadius: fpW * 0.3, borderTopRightRadius: fpW * 0.3, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Animated.View style={[{ width: fpW * 0.32, height: fpW * 0.3, borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: '#FB923C', marginBottom: 6 }, flame]} />
          <View style={{ position: 'absolute', bottom: 6, width: fpW * 0.18, height: fpW * 0.16, borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: '#FDE68A' }} />
          <View style={{ position: 'absolute', bottom: 0, width: fpW * 0.5, height: 8, borderRadius: 4, backgroundColor: '#5B3A1E' }} />
        </View>
        <View style={{ position: 'absolute', top: 12, left: fpW * 0.08, flexDirection: 'row', gap: fpW * 0.16 }}>
          <Stocking color="#B91C1C" />
          <Stocking color="#166534" />
          <Stocking color="#B91C1C" />
        </View>
        <View style={{ position: 'absolute', top: -34, left: 4, flexDirection: 'row', gap: 6 }}>
          <Candle delay={0} />
          <Candle delay={500} />
        </View>
      </View>
      <Particles count={12} color="#FBBF24" minSize={2} maxSize={3.5} opacity={0.7} />
      <Scrim color="rgba(8,20,33,0.4)" />
    </>
  );
};

// ── 2. Hành trình núi tuyết ──────────────────────────────────────────────────────────────────

const Cloud: React.FC<{ y: number; w: number; ms: number; delay: number }> = ({ y, w, ms, delay }) => {
  const { width } = useWindowDimensions();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [ms, delay, p]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(p.value, [0, 1], [-w, width + w]) }] }));
  return (
    <Animated.View style={[{ position: 'absolute', top: y, left: 0, width: w, height: w * 0.32 }, st]}>
      <View style={{ position: 'absolute', left: 0, top: w * 0.12, width: w, height: w * 0.2, borderRadius: w, backgroundColor: 'rgba(203,213,225,0.10)' }} />
      <View style={{ position: 'absolute', left: w * 0.2, top: 0, width: w * 0.45, height: w * 0.26, borderRadius: w, backgroundColor: 'rgba(203,213,225,0.10)' }} />
    </Animated.View>
  );
};

const ExpeditionScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const aurora = usePulse(9000);
  const auroraStyle = useAnimatedStyle(() => ({ opacity: 0.35 + aurora.value * 0.3, transform: [{ translateX: interpolate(aurora.value, [0, 1], [-40, 40]) }, { skewY: '-10deg' }] }));
  // Đường leo núi phát sáng + đèn lồng
  const trail = `M ${width * 0.18} ${height * 0.62} Q ${width * 0.4} ${height * 0.55} ${width * 0.34} ${height * 0.48} T ${width * 0.56} ${height * 0.36} T ${width * 0.7} ${height * 0.27}`;
  return (
    <>
      <LinearGradient colors={['#071426', '#0F2557', '#1E3A8A']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {Array.from({ length: 22 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: rand(i, 1) * width, top: rand(i, 2) * height * 0.35, width: 2, height: 2, borderRadius: 1, backgroundColor: '#F1F5F9', opacity: 0.4 + rand(i, 3) * 0.5 }} />
      ))}
      <Animated.View style={[{ position: 'absolute', top: height * 0.05, left: -width * 0.2, width: width * 1.4, height: 140, borderRadius: 140 }, auroraStyle]}>
        <LinearGradient colors={['rgba(103,232,249,0)', 'rgba(103,232,249,0.4)', 'rgba(167,139,250,0.35)', 'rgba(167,139,250,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Cloud y={height * 0.18} w={170} ms={60000} delay={0} />
      <Cloud y={height * 0.3} w={120} ms={45000} delay={15000} />
      <View style={{ position: 'absolute', top: height * 0.2, left: 0 }}>
        <Mountains width={width} height={height * 0.45} color="#1E3A6E" peaks={[0.25, 0.6, 0.95, 0.55, 0.8, 0.4, 0.2]} snow />
      </View>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={trail} stroke="rgba(253,186,116,0.35)" strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d={trail} stroke="#FDBA74" strokeWidth={1.6} fill="none" strokeDasharray="4,6" strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', left: width * 0.32, top: height * 0.44 }}>
        <Lantern size={26} delay={300} />
      </View>
      <View style={{ position: 'absolute', left: width * 0.6, top: height * 0.31 }}>
        <Lantern size={22} delay={1100} />
      </View>
      <View style={{ position: 'absolute', top: height * 0.5, left: 0 }}>
        <Mountains width={width} height={height * 0.28} color="#132A52" peaks={[0.5, 0.3, 0.6, 0.35, 0.55, 0.3]} snow />
      </View>
      {/* Sương lạnh */}
      <LinearGradient colors={['rgba(241,245,249,0)', 'rgba(241,245,249,0.10)', 'rgba(241,245,249,0)']} style={{ position: 'absolute', left: 0, right: 0, top: height * 0.62, height: 90 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.7 }}>
        <PineRow width={width} height={height * 0.16} color="#0B1B36" seed={7} />
        <View style={{ height: height * 0.3, backgroundColor: '#0B1B36' }} />
      </View>
      <Scrim color="rgba(7,20,38,0.35)" />
    </>
  );
};

// ── 3. Đài quan sát pha lê ───────────────────────────────────────────────────────────────────

const Crystal: React.FC<{ x: number; bottom: number; h: number; color: string; delay: number }> = ({ x, bottom, h, color, delay }) => {
  const g = usePulse(2200, delay);
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + g.value * 0.35 }));
  const w = h * 0.4;
  return (
    <View style={{ position: 'absolute', left: x, bottom, width: w, height: h }}>
      <Animated.View style={[{ position: 'absolute', left: -w * 0.4, top: h * 0.2, width: w * 1.8, height: h * 0.8, borderRadius: w, backgroundColor: color }, glow]} />
      <Svg width={w} height={h} viewBox="0 0 40 100">
        <Polygon points="20,0 38,30 30,100 10,100 2,30" fill={color} opacity={0.55} />
        <Polygon points="20,0 38,30 20,100" fill="#FFFFFF" opacity={0.15} />
        <Line x1={20} y1={0} x2={20} y2={100} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1} />
      </Svg>
    </View>
  );
};

const HoloRing: React.FC<{ size: number; top: number; ms: number; color: string }> = ({ size, top, ms, color }) => {
  const { width } = useWindowDimensions();
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: ms, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [ms, r]);
  const st = useAnimatedStyle(() => ({ transform: [{ rotateX: '68deg' }, { rotateZ: `${r.value}deg` }] }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: width / 2 - size / 2, top, width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, borderStyle: 'dashed', opacity: 0.35 }, st]}
    />
  );
};

const CONSTELLATIONS: number[][][] = [
  [
    [0.12, 0.08],
    [0.22, 0.14],
    [0.3, 0.1],
    [0.38, 0.18],
    [0.34, 0.26],
  ],
  [
    [0.62, 0.06],
    [0.72, 0.12],
    [0.82, 0.08],
    [0.88, 0.18],
  ],
  [
    [0.08, 0.42],
    [0.16, 0.36],
    [0.24, 0.44],
  ],
  [
    [0.76, 0.4],
    [0.86, 0.34],
    [0.92, 0.46],
    [0.82, 0.5],
  ],
];

const ObservatoryScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const tw = usePulse(1600);
  const starGlow = useAnimatedStyle(() => ({ opacity: 0.55 + tw.value * 0.45 }));
  return (
    <>
      <LinearGradient colors={['#0B1026', '#1E1B4B', '#312E81']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      {Array.from({ length: 30 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: rand(i, 7) * width, top: rand(i, 8) * height * 0.7, width: 1.6, height: 1.6, borderRadius: 1, backgroundColor: '#E0E7FF', opacity: 0.3 + rand(i, 9) * 0.5 }} />
      ))}
      {/* Chòm sao nối bằng đường sáng mảnh */}
      <Animated.View style={[StyleSheet.absoluteFill, starGlow]}>
        <Svg width={width} height={height}>
          {CONSTELLATIONS.map((pts, ci) => (
            <React.Fragment key={ci}>
              {pts.slice(1).map((p, i) => (
                <Line key={`l${i}`} x1={pts[i][0] * width} y1={pts[i][1] * height} x2={p[0] * width} y2={p[1] * height} stroke="#A5B4FC" strokeOpacity={0.45} strokeWidth={1} />
              ))}
              {pts.map((p, i) => (
                <Circle key={`c${i}`} cx={p[0] * width} cy={p[1] * height} r={i === 0 ? 2.6 : 1.8} fill="#E0E7FF" />
              ))}
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>
      {/* Cực quang tím xanh */}
      <LinearGradient
        colors={['rgba(34,211,238,0)', 'rgba(34,211,238,0.18)', 'rgba(167,139,250,0.22)', 'rgba(167,139,250,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: height * 0.2, left: -40, right: -40, height: 120, transform: [{ skewY: '-12deg' }] }}
      />
      <HoloRing size={width * 0.9} top={height * 0.18} ms={40000} color="#22D3EE" />
      <HoloRing size={width * 0.6} top={height * 0.26} ms={28000} color="#A78BFA" />
      {/* Tinh thể băng phát sáng */}
      <Crystal x={-6} bottom={height * 0.08} h={170} color="#A78BFA" delay={0} />
      <Crystal x={36} bottom={height * 0.05} h={110} color="#22D3EE" delay={700} />
      <Crystal x={width - 70} bottom={height * 0.1} h={190} color="#22D3EE" delay={300} />
      <Crystal x={width - 112} bottom={height * 0.05} h={120} color="#A78BFA" delay={1200} />
      <Particles count={12} color="#22D3EE" minSize={2} maxSize={3.5} opacity={0.8} />
      <Scrim color="rgba(11,16,38,0.4)" />
    </>
  );
};

// ── 4. Lễ hội nhà vô địch ───────────────────────────────────────────────────────────────────

const Spotlight: React.FC<{ fromLeft: boolean; delay: number }> = ({ fromLeft, delay }) => {
  const { width, height } = useWindowDimensions();
  const sw = usePulse(4200, delay);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(sw.value, [0, 1], fromLeft ? [12, 32] : [-12, -32])}deg` }] }));
  const beamW = 120;
  return (
    <Animated.View
      style={[
        { position: 'absolute', bottom: -40, left: fromLeft ? width * 0.08 : width * 0.92 - beamW, width: beamW, height: height * 0.95, transformOrigin: 'bottom' as never },
        st,
      ]}
    >
      <Svg width={beamW} height={height * 0.95}>
        <Polygon points={`${beamW / 2 - 8},${height * 0.95} ${beamW / 2 + 8},${height * 0.95} ${beamW},0 0,0`} fill="rgba(253,224,71,0.08)" />
      </Svg>
    </Animated.View>
  );
};

const FestivalScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  return (
    <>
      <LinearGradient colors={['#101B25', '#1A1420', '#2A0F12']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      {Array.from({ length: 18 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: rand(i, 11) * width, top: rand(i, 12) * height * 0.3, width: 2, height: 2, borderRadius: 1, backgroundColor: '#FDE68A', opacity: 0.25 + rand(i, 13) * 0.5 }} />
      ))}
      <Spotlight fromLeft delay={0} />
      <Spotlight fromLeft={false} delay={1500} />
      {/* Cây thông khổng lồ giữa quảng trường */}
      <View style={{ position: 'absolute', left: width / 2 - 110, top: height * 0.34, opacity: 0.5 }}>
        <XmasTree size={220} />
      </View>
      {/* Nhà mùa đông + cổng chào phủ tuyết */}
      <View style={{ position: 'absolute', left: 6, top: height * 0.66, opacity: 0.85 }}>
        <Cabin size={64} delay={0} />
      </View>
      <View style={{ position: 'absolute', right: 6, top: height * 0.68, opacity: 0.85 }}>
        <Cabin size={54} delay={1200} />
      </View>
      <Svg width={width} height={height * 0.4} style={{ position: 'absolute', left: 0, top: height * 0.62 }}>
        <Path d={`M ${width * 0.22} ${height * 0.4} V ${height * 0.06} Q ${width * 0.5} ${-height * 0.04} ${width * 0.78} ${height * 0.06} V ${height * 0.4}`} stroke="#7F1D1D" strokeWidth={8} fill="none" opacity={0.6} />
        <Path d={`M ${width * 0.22} ${height * 0.06} Q ${width * 0.5} ${-height * 0.04} ${width * 0.78} ${height * 0.06}`} stroke="#F1F5F9" strokeWidth={4} fill="none" opacity={0.7} />
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.8, height: height * 0.3, backgroundColor: 'rgba(241,245,249,0.07)' }} />
      {/* Bokeh vàng */}
      <Particles count={12} color="#FBBF24" minSize={6} maxSize={16} opacity={0.22} rise={false} />
      <Particles count={8} color="#FDE68A" minSize={2} maxSize={3} opacity={0.8} />
      <Scrim color="rgba(16,27,37,0.4)" />
    </>
  );
};

const SCENES: Record<ChristmasSceneKey, React.FC> = {
  library: LibraryScene,
  studyroom: () => <LibraryScene room />,
  lodge: LodgeScene,
  expedition: ExpeditionScene,
  observatory: ObservatoryScene,
  festival: FestivalScene,
};

/** Nền màu đặc (đáy) của từng cảnh — dùng cho màn hình bọc ngoài, tránh lộ khoảng trắng khi cuộn quá đà. */
export const SCENE_BASE: Record<ChristmasSceneKey, string> = {
  library: '#071C1B',
  studyroom: '#071321',
  lodge: '#081421',
  expedition: '#071426',
  observatory: '#0B1026',
  festival: '#101B25',
};

/**
 * Khung cảnh Giáng sinh phía sau nội dung (absolute, không nhận chạm).
 * Đổi `scene` → cảnh cũ mờ dần, cảnh mới hiện dần (~350ms); chỉ cảnh đang hiện chạy animation.
 */
export const ChristmasScene: React.FC<{ scene: ChristmasSceneKey }> = ({ scene }) => {
  const Scene = SCENES[scene];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: SCENE_BASE[scene] }]}>
      <Animated.View key={scene} entering={FadeIn.duration(350)} exiting={FadeOut.duration(300)} style={StyleSheet.absoluteFill}>
        <Scene />
      </Animated.View>
    </View>
  );
};
