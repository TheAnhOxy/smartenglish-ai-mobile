import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CircularAccuracyRingProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularAccuracyRing: React.FC<CircularAccuracyRingProps> = ({
  score,
  size = 110,
  strokeWidth = 10,
  label = 'ĐỘ CHUẨN',
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedScore) / 100;

  // 3 Mức màu sắc trực quan: Xanh lá (>= 80%) / Vàng cam (60-79%) / Đỏ (< 60%)
  const isHigh = normalizedScore >= 80;
  const isMedium = normalizedScore >= 60 && normalizedScore < 80;

  const colorStart = isHigh ? '#10B981' : isMedium ? '#F59E0B' : '#EF4444';
  const colorEnd = isHigh ? '#059669' : isMedium ? '#D97706' : '#DC2626';
  const textColor = isHigh ? '#047857' : isMedium ? '#B45309' : '#B91C1C';
  const bgRingColor = isHigh ? '#ECFDF5' : isMedium ? '#FFFBEB' : '#FEF2F2';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorStart} />
            <Stop offset="100%" stopColor={colorEnd} />
          </LinearGradient>
        </Defs>
        {/* Track nền mờ */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgRingColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Vòng tiến trình % chính xác */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#accuracyGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Hiển thị số phần trăm ở tâm vòng tròn */}
      <View style={[StyleSheet.absoluteFill, styles.centerOverlay]}>
        <Text style={[styles.scoreNumber, { color: textColor }]}>
          {normalizedScore}%
        </Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
