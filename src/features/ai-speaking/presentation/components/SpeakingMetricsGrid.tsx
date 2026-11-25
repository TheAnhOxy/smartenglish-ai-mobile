import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, Target, Volume2, Zap } from '@/src/components/ds/icons';
import { dsFont } from '@/src/theme/ds';
import { dk } from '@/src/theme/themeMode';

interface SpeakingMetricsGridProps {
  accuracy: number;
  fluency: number;
  stress: number;
  intonation: number;
}

/** Màu theo điểm, không theo tiêu chí: tránh hiện xanh khi điểm thấp. */
const tone = (v: number) =>
  v >= 80
    ? { fg: dk('#16A34A', 'text'), bar: '#16A34A' }
    : v >= 60
    ? { fg: dk('#B45309', 'text'), bar: '#F59E0B' }
    : { fg: dk('#DC2626', 'text'), bar: '#DC2626' };

export const SpeakingMetricsGrid: React.FC<SpeakingMetricsGridProps> = ({
  accuracy,
  fluency,
  stress,
  intonation,
}) => {
  const metrics = [
    { label: 'Độ chính xác', value: Math.round(accuracy), icon: Target },
    { label: 'Trôi chảy', value: Math.round(fluency), icon: Zap },
    { label: 'Trọng âm', value: Math.round(stress), icon: Activity },
    { label: 'Ngữ điệu', value: Math.round(intonation), icon: Volume2 },
  ];

  return (
    <View style={styles.gridContainer}>
      {metrics.map((item, index) => {
        const IconComponent = item.icon;
        const c = tone(item.value);
        return (
          <View key={index} style={styles.metricCard}>
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <IconComponent color={dk('#5B6B7F', 'text')} size={15} />
              </View>
              <Text style={[styles.valueText, { color: c.fg }]}>
                {item.value}%
              </Text>
            </View>

            <Text style={styles.labelText}>{item.label}</Text>

            {/* Progress Bar Mini */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, item.value))}%`,
                    backgroundColor: c.bar,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    shadowColor: '#0F2A44',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },
  valueText: {
    fontSize: 18,
    fontFamily: dsFont.display,
  },
  labelText: {
    fontSize: 13,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#F4F7FB',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 100,
  },
});

