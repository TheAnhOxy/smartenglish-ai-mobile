import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, CheckCircle2, Sparkles, Zap } from 'lucide-react-native';

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
      color: '#10B981',
      bg: '#ECFDF5',
      icon: CheckCircle2,
    },
    {
      label: 'Trôi chảy',
      sub: 'Fluency',
      value: Math.round(fluency),
      color: '#0EA5E9',
      bg: '#F0F9FF',
      icon: Zap,
    },
    {
      label: 'Trọng âm',
      sub: 'Stress',
      value: Math.round(stress),
      color: '#F59E0B',
      bg: '#FFFBEB',
      icon: Activity,
    },
    {
      label: 'Ngữ điệu',
      sub: 'Intonation',
      value: Math.round(intonation),
      color: '#6366F1',
      bg: '#EEF2FF',
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
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
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
    fontWeight: '800',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 100,
  },
});

