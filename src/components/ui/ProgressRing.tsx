import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { palette } from '@/src/theme/colors';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0 to 1
  startColor?: string;
  endColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 120,
  strokeWidth = 10,
  progress = 0.75,
  startColor = palette.primary,
  endColor = palette.accent,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const bgPath = Skia.Path.Make();
  bgPath.addCircle(center, center, radius);

  const fgPath = Skia.Path.Make();
  fgPath.addArc(
    {
      x: center - radius,
      y: center - radius,
      width: radius * 2,
      height: radius * 2,
    },
    -90,
    360 * Math.min(1, Math.max(0, progress))
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background Circle */}
        <Path
          path={bgPath}
          color={palette.primarySoft}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
        {/* Active Progress Circle */}
        <Path
          path={fgPath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(size, size)}
            colors={[startColor, endColor]}
          />
        </Path>
      </Canvas>
    </View>
  );
};
