import React from 'react';
import { View, Text, Pressable, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../application/useOnboardingStore';
import { colors } from '@/src/theme/colors';
import { Check, ArrowRight, Target, GraduationCap, MessageSquare, Sprout } from 'lucide-react-native';

const GOAL_OPTIONS = [
  {
    id: 'g1',
    title: 'Luyện Thi TOEIC 750+',
    Icon: Target,
    desc: 'Tập trung từ vựng doanh nghiệp & Listening/Reading',
  },
  {
    id: 'g2',
    title: 'Luyện Thi IELTS 6.5+',
    Icon: GraduationCap,
    desc: 'Nâng cao Writing Task 2 & Academic Speaking',
  },
  {
    id: 'g3',
    title: 'Giao Tiếp Công Sở & Hằng Ngày',
    Icon: MessageSquare,
    desc: 'Thực hành phát âm IPA & Roleplay linh hoạt',
  },
  {
    id: 'g4',
    title: 'Mất Gốc Tiếng Anh',
    Icon: Sprout,
    desc: 'Xây dựng lại từ vựng & ngữ pháp cơ bản từ đầu',
  },
];

export const ChooseGoalScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { targetGoal, setTargetGoal } = useOnboardingStore();

  const handleSelectGoal = (title: string) => {
    setTargetGoal(title);
  };

  const handleNext = () => {
    router.push('/(auth)/placement-intro' as any);
  };

  const safeTop = Math.max(insets.top, 48) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  return (
    <View
      style={[
        s.container,
        { paddingTop: safeTop, paddingBottom: safeBottom },
      ]}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Mục Tiêu Học Của Bạn Là Gì?</Text>
        <Text style={s.subtitle}>
          SmartEnglish AI sẽ tối ưu lộ trình và bài tập hàng ngày dựa trên lựa chọn của bạn.
        </Text>
      </View>

      {/* Goal Options */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((item) => {
          const isSelected = targetGoal === item.title;
          const GoalIcon = item.Icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelectGoal(item.title)}
              style={[s.goalCard, isSelected && s.goalCardSelected]}
            >
              {/* Clean Theme Icon */}
              <View style={[s.iconBox, isSelected && s.iconBoxSelected]}>
                <GoalIcon
                  color={isSelected ? colors.primary : colors.textSoft}
                  size={20}
                  strokeWidth={2}
                />
              </View>
              <View style={s.goalTextWrap}>
                <Text style={[s.goalTitle, isSelected && s.goalTitleSelected]}>
                  {item.title}
                </Text>
                <Text style={s.goalDesc}>{item.desc}</Text>
              </View>
              {/* Check indicator */}
              <View style={[s.checkCircle, isSelected && s.checkCircleSelected]}>
                {isSelected && <Check color="#FFFFFF" size={14} strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={!targetGoal}
        activeOpacity={0.85}
        style={[s.ctaBtn, !targetGoal && s.ctaBtnDisabled]}
      >
        <Text style={[s.ctaBtnText, !targetGoal && s.ctaBtnTextDisabled]}>Tiếp Tục</Text>
        <ArrowRight color={!targetGoal ? '#64748B' : '#FFFFFF'} size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#FFFFFF',
  },
  goalTextWrap: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  goalTitleSelected: {
    color: colors.primary,
  },
  goalDesc: {
    fontSize: 12,
    color: colors.textSoft,
    lineHeight: 17,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaBtnDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ctaBtnTextDisabled: {
    color: '#94A3B8',
  },
});
