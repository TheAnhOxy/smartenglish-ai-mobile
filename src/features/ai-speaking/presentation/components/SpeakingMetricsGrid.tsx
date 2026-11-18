import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, CheckCircle2, Sparkles, Zap } from '@/src/components/ds/icons';
import { dsFont } from '@/src/theme/ds';

interface SpeakingMetricsGridProps {
  accuracy: number;
  fluency: number;
  stress: number;
  intonation: number;
}

export const SpeakingMetricsGrid: React.FC<SpeakingMetricsGridProps> = ({
  accuracy = 85,
  fluency = 80,
  stress = 78,
  intonation = 82,
}) => {
  const metrics = [
    {
      label: 'Độ chính xác',
      sub: 'Accuracy',
      value: Math.round(accuracy),
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: CheckCircle2,
    },
    {
      label: 'Trôi chảy',
      sub: 'Fluency',
      value: Math.round(fluency),
      color: '#0EA5E9',
      bg: '#E0F2FE',
      icon: Zap,
    },
    {
      label: 'Trọng âm',
      sub: 'Stress',
      value: Math.round(stress),
      color: '#F59E0B',
      bg: '#FEF3C7',
      icon: Activity,
    },
    {
      label: 'Ngữ điệu',
      sub: 'Intonation',
      value: Math.round(intonation),
      color: '#0369A1',
      bg: '#E0F2FE',
      icon: Sparkles,
    },
  ];

  return (
    <View style={styles.gridContainer}>
      {metrics.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <View key={index} style={styles.metricCard}>
            <View style={styles.topRow}>
              <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                <IconComponent color={item.color} size={15} />
              </View>
              <Text style={[styles.valueText, { color: item.color }]}>
                {item.value}%
              </Text>
            </View>

            <Text style={styles.labelText}>{item.label}</Text>
            <Text style={styles.subText}>{item.sub}</Text>

            {/* Progress Bar Mini */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, item.value))}%`,
                    backgroundColor: item.color,
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
  },
  valueText: {
    fontSize: 18,
    fontFamily: dsFont.display,
  },
  labelText: {
    fontSize: 13,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  subText: {
    fontFamily: dsFont.body,
    fontSize: 11,
    color: '#8597AB',
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

