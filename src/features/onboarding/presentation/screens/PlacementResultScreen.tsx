import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors } from '@/src/theme/colors';
import { ArrowRight } from 'lucide-react-native';

const SKILLS = [
  { key: 'vocabulary', label: 'Từ Vựng (Vocabulary)', defaultVal: 80, color: colors.secondary },
  { key: 'grammar', label: 'Ngữ Pháp (Grammar)', defaultVal: 70, color: colors.primary },
  { key: 'reading', label: 'Đọc Hiểu (Reading)', defaultVal: 85, color: colors.success },
  { key: 'listening', label: 'Nghe Hiểu (Listening)', defaultVal: 75, color: colors.warning },
] as const;

export const PlacementResultScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { result } = useOnboardingStore();
  const { currentUser } = useAuthStore();

  const cefr = result?.cefr_level || 'B1';
  const scorePct = result?.score_pct || 80;

  const handleFinishOnboarding = () => {
    if (currentUser) {
      currentUser.onboarding_completed = true;
      router.replace('/(student)/home' as any);
    } else {
      router.replace('/(auth)/register' as any);
    }
  };

  const safeTop = Math.max(insets.top, 48) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 16;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.contentContainer, { paddingTop: safeTop, paddingBottom: safeBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Result */}
      <View style={s.headerSection}>
        <Text style={s.overlineLabel}>Kết Quả Chẩn Đoán Trình Độ</Text>

        {/* CEFR Badge */}
        <View style={s.cefrBadge}>
          <Text style={s.cefrText}>{cefr}</Text>
        </View>

        <Text style={s.cefrTitle}>Trình Độ Khung CEFR: {cefr}</Text>
        <Text style={s.accuracyText}>Độ chính xác bài test: {scorePct}%</Text>
      </View>

      {/* Skills Breakdown Card */}
      <View style={s.breakdownCard}>
        <Text style={s.cardTitle}>Chi Tiết Năng Lực 4 Kỹ Năng</Text>

        <View style={s.skillsList}>
          {SKILLS.map((skill, i) => {
            const pct = (result?.skills as any)?.[skill.key] ?? skill.defaultVal;
            return (
              <View key={skill.key} style={[s.skillRow, i < SKILLS.length - 1 && s.skillRowBorder]}>
                <View style={s.skillLabelRow}>
                  <Text style={s.skillLabel}>{skill.label}</Text>
                  <Text style={[s.skillPct, { color: skill.color }]}>{pct}%</Text>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: skill.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Action CTA */}
      <TouchableOpacity
        onPress={handleFinishOnboarding}
        activeOpacity={0.85}
        style={s.ctaBtn}
      >
        <Text style={s.ctaBtnText}>Khám Phá Lộ Trình Học Ngay</Text>
        <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  overlineLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cefrBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  cefrText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  cefrTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 13,
    color: colors.textSoft,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  skillsList: {
    gap: 0,
  },
  skillRow: {
    paddingVertical: 12,
  },
  skillRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  skillPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
