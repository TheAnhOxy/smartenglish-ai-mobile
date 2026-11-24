// WinterHome.tsx — Trang trí Giáng sinh cho Trang chủ (chỉ hiện ở giao diện tối khi bật Giáng sinh).
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Gift } from 'lucide-react-native';
import { dsFont, dsSize } from '@/src/theme/ds';
import { Cabin } from '@/src/features/learning-path/presentation/winter/WinterArt';

const GREETINGS = [
  'Merry Christmas!',
  'Keep learning, keep shining!',
  'Make your English sparkle this Christmas.',
  'A little progress every day is the best gift you can give yourself.',
];

/** Lời chúc tiếng Anh đổi câu mỗi 5 giây (mờ dần vào/ra). */
export const XmasGreeting: React.FC = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % GREETINGS.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)' }}>
      <Gift size={16} color="#FBBF24" />
      <Animated.Text
        key={i}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
        numberOfLines={2}
        style={{ flex: 1, fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: '#FDE68A' }}
      >
        {GREETINGS[i]}
      </Animated.Text>
    </View>
  );
};

const TwinkleStar: React.FC<{ x: string; y: number; size: number; delay: number }> = ({ x, y, size, delay }) => {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0.25, { duration: 1400 })), -1, false));
    return () => cancelAnimation(o);
  }, [delay, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: x as `${number}%`, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#F8FAFC' }, st]}
    />
  );
};

/**
 * Nền trời đêm phía sau nội dung thẻ ôn tập: trăng khuyết, sao lấp lánh, tuyết đọng mép trên, đồi tuyết dưới đáy.
 * Đặt làm phần tử con ĐẦU TIÊN của thẻ (absolute, không đổi layout).
 */
export const WinterHeroScene: React.FC = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {/* Style inline: bộ đổi màu giao diện tối không được đụng vào màu trắng của trăng/tuyết */}
    <View style={{ position: 'absolute', right: 16, top: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC', shadowColor: '#E0F2FE', shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }} />
    <View style={{ position: 'absolute', right: 9, top: 9, width: 28, height: 28, borderRadius: 14, backgroundColor: '#172554' }} />
    <TwinkleStar x="48%" y={18} size={3} delay={0} />
    <TwinkleStar x="62%" y={40} size={2} delay={600} />
    <TwinkleStar x="74%" y={14} size={2.5} delay={1200} />
    <TwinkleStar x="56%" y={70} size={2} delay={1800} />
    <TwinkleStar x="88%" y={60} size={2} delay={900} />
    <Svg width="100%" height={40} style={{ position: 'absolute', bottom: 0, left: 0 }} viewBox="0 0 400 40" preserveAspectRatio="none">
      <Path d="M0 26 Q60 8 120 22 T240 18 T400 20 L400 40 L0 40 Z" fill="rgba(241,245,249,0.10)" />
      <Path d="M0 34 Q80 22 170 32 T400 30 L400 40 L0 40 Z" fill="rgba(241,245,249,0.16)" />
    </Svg>
    {/* Làng Giáng sinh xa xa: hàng thông + nhà gỗ cửa sổ vàng */}
    <Svg width="100%" height={46} style={{ position: 'absolute', bottom: 10, left: 0 }} viewBox="0 0 400 46" preserveAspectRatio="none">
      <Path d="M150 46 L162 18 L174 46 Z M168 46 L182 8 L196 46 Z M300 46 L312 20 L324 46 Z M318 46 L330 12 L342 46 Z M372 46 L384 22 L396 46 Z" fill="rgba(15,23,42,0.75)" />
    </Svg>
    <Cabin size={34} delay={0} style={{ position: 'absolute', bottom: 8, left: '50%' }} />
    <Cabin size={26} delay={900} style={{ position: 'absolute', bottom: 10, left: '62%' }} />
    <Svg width="100%" height={14} style={{ position: 'absolute', top: -1, left: 0 }} viewBox="0 0 400 14" preserveAspectRatio="none">
      <Path d="M0 0 H400 V4 Q370 12 340 5 Q300 13 260 5 Q220 12 180 4 Q140 12 100 5 Q60 13 30 5 Q14 10 0 6 Z" fill="#F1F5F9" />
    </Svg>
  </View>
);
