// components/xmas/SocialScenes.tsx — "Christmas Social Town": cảnh riêng cho cụm Cộng đồng.
//   townsquare — Quảng trường Giáng sinh (bảng tin)
//   postoffice — Bưu điện phép thuật của ông già Noel (tin nhắn)
//   garden     — Khu vườn tình bạn mùa đông (lời mời kết bạn)
//   cafe       — Quán cà phê Giáng sinh (khung chat; cường độ nhẹ để không lấn chữ)
// Màu viết inline (bộ đổi màu giao diện tối không được đụng vào). Cảnh render một lần phía sau danh sách.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { Garland, GiftBox, Snowman, XmasTree } from './XmasArt';
import { PineRow } from '@/src/features/learning-path/presentation/winter/WinterBackdrop';
import { Cabin, Lantern, Reindeer, SantaHat } from '@/src/features/learning-path/presentation/winter/WinterArt';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';

export type SocialSceneKey = 'townsquare' | 'postoffice' | 'garden' | 'cafe';

const rand = (i: number, n: number) => {
  const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const usePulse = (ms: number, delay = 0) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [ms, delay, v]);
  return v;
};

/** Đốm sáng mờ trôi chậm (bokeh). Ít phần tử để giữ 60fps. */
const Bokeh: React.FC<{ count: number; color: string; maxSize?: number; top?: number; height?: number }> = ({ count, color, maxSize = 18, top = 0, height }) => {
  const { width, height: h } = useWindowDimensions();
  const area = height ?? h;
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: rand(i, 1) * width, y: top + rand(i, 2) * area, s: 5 + rand(i, 3) * (maxSize - 5), d: rand(i, 4) * 3000 })), [count, width, area, top, maxSize]);
  return (
    <>
      {items.map((b, i) => (
        <BokehDot key={i} {...b} color={color} />
      ))}
    </>
  );
};

const BokehDot: React.FC<{ x: number; y: number; s: number; d: number; color: string }> = ({ x, y, s, d, color }) => {
  const p = usePulse(3200 + (d % 1500), d);
  const st = useAnimatedStyle(() => ({ opacity: 0.08 + p.value * 0.18, transform: [{ translateY: -p.value * 10 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, backgroundColor: color }, st]} />;
};

const Stars: React.FC<{ count: number; maxY: number; color?: string }> = ({ count, maxY, color = '#F1F5F9' }) => {
  const { width } = useWindowDimensions();
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: rand(i, 31) * width, top: rand(i, 32) * maxY, width: 2, height: 2, borderRadius: 1, backgroundColor: color, opacity: 0.3 + rand(i, 33) * 0.6 }} />
      ))}
    </>
  );
};

const Scrim: React.FC<{ color: string }> = ({ color }) => (
  <LinearGradient colors={['rgba(0,0,0,0)', color, color, 'rgba(0,0,0,0)']} locations={[0, 0.2, 0.8, 1]} style={StyleSheet.absoluteFill} />
);

/** Tuyết rơi trong một khung (cửa sổ) — chỉ bên ngoài, không rơi trước nội dung. */
const FrameSnow: React.FC<{ width: number; height: number; count?: number }> = ({ width, height, count = 8 }) => {
  const flakes = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: rand(i, 41) * width, d: 4000 + rand(i, 42) * 3000, delay: rand(i, 43) * 3000 })), [width, count]);
  return (
    <>
      {flakes.map((f, i) => (
        <FrameFlake key={i} x={f.x} duration={f.d} delay={f.delay} height={height} />
      ))}
    </>
  );
};

const FrameFlake: React.FC<{ x: number; duration: number; delay: number; height: number }> = ({ x, duration, delay, height }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, duration, p]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: p.value * height }, { translateX: Math.sin(p.value * 6) * 4 }] }));
  return <Animated.View style={[{ position: 'absolute', top: -4, left: x, width: 3, height: 3, borderRadius: 2, backgroundColor: '#F8FAFC' }, st]} />;
};

// ── Quảng trường Giáng sinh ─────────────────────────────────────────────────────────────────

/** Gian hàng chợ Giáng sinh: mái sọc đỏ trắng, quầy sáng ấm. */
const MarketStall: React.FC<{ w: number }> = ({ w }) => (
  <Svg width={w} height={w * 0.95} viewBox="0 0 100 95">
    <Rect x={10} y={40} width={80} height={52} fill="#3B2A1E" />
    <Rect x={18} y={50} width={64} height={22} fill="#FBBF24" opacity={0.85} />
    <Rect x={14} y={70} width={72} height={6} fill="#5B4636" />
    <Path d="M4 40 L50 10 L96 40 Z" fill="#B91C1C" />
    {[0, 1, 2, 3, 4].map((i) => (
      <Path key={i} d={`M ${4 + i * 18.4} 40 Q ${13 + i * 18.4} 48 ${22.4 + i * 18.4} 40 Z`} fill={i % 2 ? '#B91C1C' : '#F8FAFC'} />
    ))}
    <Path d="M2 41 L50 9 L98 41" stroke="#F8FAFC" strokeWidth={3} fill="none" />
    <Circle cx={30} cy={62} r={4} fill="#DC2626" />
    <Circle cx={50} cy={60} r={4} fill="#22C55E" />
    <Circle cx={70} cy={62} r={4} fill="#3B82F6" />
  </Svg>
);

const TownSquareScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  return (
    <>
      <LinearGradient colors={['#081421', '#0F2236', '#162A3E']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Stars count={24} maxY={height * 0.3} />
      <View style={{ position: 'absolute', left: width / 2 - 95, top: height * 0.22, opacity: 0.45 }}>
        <XmasTree size={190} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.5 }}>
        <PineRow width={width} height={height * 0.1} color="#0B1B2E" seed={13} />
      </View>
      <View style={{ position: 'absolute', left: -14, top: height * 0.55, opacity: 0.75 }}>
        <MarketStall w={120} />
      </View>
      <View style={{ position: 'absolute', right: -14, top: height * 0.57, opacity: 0.75 }}>
        <MarketStall w={110} />
      </View>
      <View style={{ position: 'absolute', left: 8, right: 8, top: height * 0.45 }}>
        <Garland width={width - 16} />
      </View>
      <View style={{ position: 'absolute', left: width * 0.32, top: height * 0.66 }}>
        <Lantern size={30} delay={0} />
      </View>
      <View style={{ position: 'absolute', right: width * 0.32, top: height * 0.67 }}>
        <Lantern size={30} delay={800} />
      </View>
      <View style={{ position: 'absolute', left: 10, top: height * 0.8, opacity: 0.9 }}>
        <Snowman size={48} delay={300} />
      </View>
      <View style={{ position: 'absolute', right: 10, top: height * 0.8, opacity: 0.9, flexDirection: 'row', alignItems: 'flex-end' }}>
        <GiftBox size={26} delay={600} />
        <Reindeer size={56} delay={900} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.88, height: height * 0.2, backgroundColor: 'rgba(241,245,249,0.08)' }} />
      <Bokeh count={10} color="#FBBF24" />
      <Scrim color="rgba(8,20,33,0.38)" />
    </>
  );
};

// ── Bưu điện ông già Noel ───────────────────────────────────────────────────────────────────

/** Kệ thư: các ô gỗ chứa phong thư có dấu sáp đỏ. */
const LetterShelf: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const cols = 3;
  const rows = Math.floor(h / 46);
  const cw = w / cols;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * 46;
      cells.push(<Rect key={`b${r}${c}`} x={x + 2} y={y + 2} width={cw - 4} height={42} fill="#1E1611" />);
      if ((r + c) % 3 !== 1) {
        cells.push(<Rect key={`l${r}${c}`} x={x + 8} y={y + 16} width={cw - 16} height={24} rx={2} fill={(r + c) % 2 ? '#FDE68A' : '#F1F5F9'} opacity={0.85} />);
        cells.push(<Path key={`f${r}${c}`} d={`M ${x + 8} ${y + 16} L ${x + cw / 2} ${y + 30} L ${x + cw - 8} ${y + 16}`} stroke="#A16207" strokeWidth={1.2} fill="none" />);
        cells.push(<Circle key={`s${r}${c}`} cx={x + cw / 2} cy={y + 30} r={3.5} fill="#BE123C" />);
      }
    }
  }
  return (
    <Svg width={w} height={rows * 46}>
      <Rect x={0} y={0} width={w} height={rows * 46} fill="#30231D" />
      {cells}
    </Svg>
  );
};

const Mailbox: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size * 1.5} viewBox="0 0 60 90">
    <Rect x={24} y={50} width={12} height={40} fill="#3F2A1E" />
    <Path d="M6 56 V24 Q6 6 30 6 Q54 6 54 24 V56 Z" fill="#BE123C" />
    <Rect x={14} y={24} width={32} height={6} rx={3} fill="#1F2937" />
    <Path d="M4 22 Q30 0 56 22 Q30 8 4 22 Z" fill="#F8FAFC" />
    <Rect x={20} y={36} width={20} height={10} rx={2} fill="#FBBF24" />
  </Svg>
);

const WallClock: React.FC<{ size: number }> = ({ size }) => {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 60000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [r]);
  const hand = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Circle cx={30} cy={30} r={28} fill="#5B4636" />
        <Circle cx={30} cy={30} r={22} fill="#FDE7BD" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return <Line key={i} x1={30 + Math.sin(a) * 18} y1={30 - Math.cos(a) * 18} x2={30 + Math.sin(a) * 21} y2={30 - Math.cos(a) * 21} stroke="#3F2A1E" strokeWidth={1.5} />;
        })}
        <Line x1={30} y1={30} x2={30} y2={18} stroke="#3F2A1E" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: size / 2 - 1, top: size * 0.17, width: 2, height: size * 0.33, backgroundColor: '#BE123C', transformOrigin: 'bottom' as never }, hand]} />
    </View>
  );
};

const PostOfficeScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const lamp = usePulse(2400);
  const lampStyle = useAnimatedStyle(() => ({ opacity: 0.55 + lamp.value * 0.3 }));
  const winW = width * 0.36;
  return (
    <>
      <LinearGradient colors={['#101827', '#1C1A1D', '#30231D']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {/* Cửa sổ nhìn ra rừng tuyết */}
      <View style={{ position: 'absolute', right: 18, top: height * 0.12, width: winW, height: winW * 1.1, borderRadius: 8, overflow: 'hidden', borderWidth: 6, borderColor: '#4A3426' }}>
        <LinearGradient colors={['#0B1F3A', '#1E3A8A']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <PineRow width={winW} height={winW * 0.42} color="#0A1A2F" seed={17} />
          <View style={{ height: 6, backgroundColor: '#E2E8F0' }} />
        </View>
        <FrameSnow width={winW} height={winW * 1.1} />
        <View style={{ position: 'absolute', left: winW / 2 - 2, top: 0, bottom: 0, width: 4, backgroundColor: '#4A3426' }} />
      </View>
      <View style={{ position: 'absolute', left: width * 0.42, top: height * 0.1 }}>
        <WallClock size={56} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: height * 0.1, opacity: 0.7 }}>
        <LetterShelf w={width * 0.34} h={height * 0.5} />
      </View>
      <View style={{ position: 'absolute', left: 8, right: 8, top: height * 0.08 }}>
        <Garland width={width - 16} />
      </View>
      {/* Đèn bàn ấm */}
      <Animated.View style={[{ position: 'absolute', left: width * 0.5 - 140, top: height * 0.62, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(245,158,11,0.12)' }, lampStyle]} />
      <View style={{ position: 'absolute', right: 20, top: height * 0.7 }}>
        <Mailbox size={52} />
      </View>
      <View style={{ position: 'absolute', left: 14, top: height * 0.74, flexDirection: 'row', alignItems: 'flex-end', gap: 4, opacity: 0.9 }}>
        <GiftBox size={28} />
        <GiftBox size={22} color="#0EA5E9" delay={700} />
      </View>
      {/* Cáo đưa thư */}
      <View style={{ position: 'absolute', left: width * 0.4, top: height * 0.76, opacity: 0.85 }}>
        <AnimatedFoxMascot size={74} entrance={false} />
        <SantaHat size={28} style={{ position: 'absolute', top: -8, left: 22, transform: [{ rotate: '-12deg' }] }} />
      </View>
      <Bokeh count={8} color="#F59E0B" maxSize={14} />
      <Scrim color="rgba(16,24,39,0.42)" />
    </>
  );
};

// ── Khu vườn tình bạn ───────────────────────────────────────────────────────────────────────

const GardenScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const aur = usePulse(9000);
  const auroraStyle = useAnimatedStyle(() => ({ opacity: 0.35 + aur.value * 0.3, transform: [{ translateX: -30 + aur.value * 60 }, { skewY: '-10deg' }] }));
  return (
    <>
      <LinearGradient colors={['#0F0B2E', '#071D22', '#0B2B22']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Stars count={26} maxY={height * 0.35} color="#E0E7FF" />
      <Animated.View style={[{ position: 'absolute', top: height * 0.08, left: -width * 0.2, width: width * 1.4, height: 130, borderRadius: 130 }, auroraStyle]}>
        <LinearGradient colors={['rgba(167,139,250,0)', 'rgba(167,139,250,0.35)', 'rgba(16,185,129,0.35)', 'rgba(16,185,129,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.42 }}>
        <PineRow width={width} height={height * 0.14} color="#0A2A24" seed={23} />
        <View style={{ height: height * 0.6, backgroundColor: '#0A2A24' }} />
      </View>
      {/* Cầu gỗ phát sáng + cổng vòm nguyệt quế */}
      <Svg width={width} height={height * 0.25} style={{ position: 'absolute', left: 0, top: height * 0.55 }}>
        <Path d={`M ${width * 0.2} ${height * 0.16} Q ${width * 0.5} ${height * 0.04} ${width * 0.8} ${height * 0.16}`} stroke="#5B4636" strokeWidth={10} fill="none" />
        <Path d={`M ${width * 0.2} ${height * 0.13} Q ${width * 0.5} ${height * 0.01} ${width * 0.8} ${height * 0.13}`} stroke="#F8FAFC" strokeWidth={3} fill="none" opacity={0.7} />
        {[0.28, 0.38, 0.5, 0.62, 0.72].map((fx) => (
          <Circle key={fx} cx={fx * width} cy={height * (0.16 - 0.12 * (1 - Math.pow((fx - 0.5) / 0.3, 2)) * 0.95) - 6} r={3.2} fill="#FCD34D" />
        ))}
      </Svg>
      <Svg width={width} height={height * 0.3} style={{ position: 'absolute', left: 0, top: height * 0.3 }}>
        <Path d={`M ${width * 0.3} ${height * 0.3} V ${height * 0.12} Q ${width * 0.5} ${-height * 0.02} ${width * 0.7} ${height * 0.12} V ${height * 0.3}`} stroke="#166534" strokeWidth={9} fill="none" opacity={0.75} />
        {[0.32, 0.4, 0.5, 0.6, 0.68].map((fx, i) => (
          <Circle key={fx} cx={fx * width} cy={height * (i === 2 ? 0.035 : i % 4 === 0 ? 0.13 : 0.06)} r={4} fill={i % 2 ? '#DC2626' : '#FCD34D'} />
        ))}
      </Svg>
      <View style={{ position: 'absolute', left: 14, top: height * 0.74, flexDirection: 'row', alignItems: 'flex-end' }}>
        <Snowman size={46} delay={0} />
        <Snowman size={40} delay={700} />
      </View>
      {/* Ghế gỗ phủ tuyết */}
      <Svg width={90} height={40} style={{ position: 'absolute', right: 24, top: height * 0.8 }} viewBox="0 0 90 40">
        <Rect x={4} y={14} width={82} height={6} rx={2} fill="#5B4636" />
        <Rect x={4} y={24} width={82} height={5} rx={2} fill="#4A3426" />
        <Rect x={10} y={24} width={5} height={16} fill="#3F2A1E" />
        <Rect x={75} y={24} width={5} height={16} fill="#3F2A1E" />
        <Path d="M4 14 Q45 6 86 14 Z" fill="#F8FAFC" />
      </Svg>
      <View style={{ position: 'absolute', right: width * 0.32, top: height * 0.7 }}>
        <Lantern size={28} delay={400} />
      </View>
      <View style={{ position: 'absolute', right: 8, top: height * 0.66, opacity: 0.85 }}>
        <Reindeer size={48} delay={1200} />
      </View>
      <Bokeh count={10} color="#10B981" maxSize={16} />
      <Bokeh count={6} color="#FCD34D" maxSize={12} />
      <Scrim color="rgba(7,29,34,0.4)" />
    </>
  );
};

// ── Quán cà phê Giáng sinh (khung chat) ────────────────────────────────────────────────────

const CocoaMug: React.FC = () => (
  <Svg width={46} height={46} viewBox="0 0 100 100">
    <Path d="M30 40 Q26 22 32 10 M46 38 Q42 20 48 8" stroke="rgba(241,245,249,0.5)" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Rect x={18} y={42} width={50} height={46} rx={10} fill="#B91C1C" />
    <Path d="M68 52 Q88 54 84 70 Q80 80 68 78" stroke="#B91C1C" strokeWidth={8} fill="none" />
    <Ellipse cx={43} cy={44} rx={25} ry={6} fill="#5B2E14" />
    <Circle cx={36} cy={40} r={6} fill="#F8FAFC" />
    <Circle cx={48} cy={38} r={5} fill="#F8FAFC" />
  </Svg>
);

const CafeScene: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const fire = usePulse(900);
  const glow = useAnimatedStyle(() => ({ opacity: 0.5 + fire.value * 0.3 }));
  const winW = width * 0.78;
  const winX = (width - winW) / 2;
  return (
    <>
      <LinearGradient colors={['#0B1420', '#1A1A20', '#29201D']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      {/* Cửa sổ lớn nhìn ra phố tuyết */}
      <View style={{ position: 'absolute', left: winX, top: height * 0.14, width: winW, height: height * 0.36, borderRadius: 12, overflow: 'hidden', borderWidth: 7, borderColor: '#3B2D24', opacity: 0.75 }}>
        <LinearGradient colors={['#0B1F3A', '#172554']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <Cabin size={52} delay={0} />
        </View>
        <View style={{ position: 'absolute', bottom: 10, right: 16 }}>
          <Cabin size={44} delay={900} />
        </View>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, backgroundColor: '#E2E8F0' }} />
        <FrameSnow width={winW} height={height * 0.36} count={10} />
        <View style={{ position: 'absolute', left: winW / 3, top: 0, bottom: 0, width: 4, backgroundColor: '#3B2D24' }} />
        <View style={{ position: 'absolute', left: (winW * 2) / 3, top: 0, bottom: 0, width: 4, backgroundColor: '#3B2D24' }} />
      </View>
      <View style={{ position: 'absolute', left: 8, right: 8, top: height * 0.12 }}>
        <Garland width={width - 16} />
      </View>
      {/* Lò sưởi xa + ánh nến */}
      <Animated.View style={[{ position: 'absolute', left: width / 2 - 160, top: height * 0.72, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(251,146,60,0.10)' }, glow]} />
      <View style={{ position: 'absolute', left: 18, top: height * 0.6, opacity: 0.7 }}>
        <CocoaMug />
      </View>
      <View style={{ position: 'absolute', right: 10, top: height * 0.55, opacity: 0.55 }}>
        <XmasTree size={70} />
      </View>
      <Bokeh count={7} color="#FBBF24" maxSize={14} />
      {/* Lớp phủ đậm hơn các cảnh khác: tin nhắn là nội dung chính */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,20,32,0.55)' }]} />
    </>
  );
};

const SCENES: Record<SocialSceneKey, React.FC> = {
  townsquare: TownSquareScene,
  postoffice: PostOfficeScene,
  garden: GardenScene,
  cafe: CafeScene,
};

const BASE: Record<SocialSceneKey, string> = {
  townsquare: '#081421',
  postoffice: '#101827',
  garden: '#071D22',
  cafe: '#0B1420',
};

/** Cảnh nền cụm Cộng đồng; đổi `scene` → mờ dần sang cảnh mới (~300ms), không đụng dữ liệu/danh sách. */
export const SocialScene: React.FC<{ scene: SocialSceneKey }> = ({ scene }) => {
  const Scene = SCENES[scene];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: BASE[scene] }]}>
      <Animated.View key={scene} entering={FadeIn.duration(300)} exiting={FadeOut.duration(250)} style={StyleSheet.absoluteFill}>
        <Scene />
      </Animated.View>
    </View>
  );
};
