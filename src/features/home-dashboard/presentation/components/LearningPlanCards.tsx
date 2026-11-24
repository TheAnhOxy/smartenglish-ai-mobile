import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight } from '@/src/components/ds/icons';
import { ProgressBar, Reveal, Tap, dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { useLearningPlanQuery } from '@/src/features/onboarding/application/useLearningPlan';
import { progressRatio, weakSkillItems } from '@/src/features/onboarding/application/learningPlan';
import { useXmasActive } from '@/src/core/services/xmas';
import { PineBranch, SnowEdge, glassCard } from '@/src/components/xmas/WinterUI';

interface Props {
  userId: string | number;
  delay?: number;
}

/** Kế hoạch học sau bài kiểm tra đầu vào: kỹ năng cần cải thiện và mục tiêu tuần (chỉ học viên đã đăng nhập). */
export const LearningPlanCards: React.FC<Props> = ({ userId, delay = 150 }) => {
  const xmas = useXmasActive();
  const router = useRouter();
  const { data: plan, refetch } = useLearningPlanQuery(userId);

  useFocusEffect(
    React.useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (!plan) return null;
  const weak = weakSkillItems(plan);
  const goal = plan.weeklyGoal;

  return (
    <>
      {weak.length > 0 ? (
        <Reveal delay={delay} style={st.section}>
          <Text style={dsText.h2}>Kỹ năng cần cải thiện</Text>
          <View style={st.card}>
            {weak.map((item, index) => (
              <Tap
                key={item.key}
                onPress={() => router.push(item.route as never)}
                style={[st.skillRow, index > 0 && st.divider]}
                scaleTo={0.98}
                accessibilityLabel={`${item.label} ${item.score} phần trăm, ${item.hint}`}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={st.rowBetween}>
                    <Text style={st.label}>{item.label}</Text>
                    <Text style={st.score}>{item.score}%</Text>
                  </View>
                  <ProgressBar value={item.score / 100} color={ds.amber} height={8} />
                  <Text style={st.hint}>{item.hint}</Text>
                </View>
                <ChevronRight size={20} color={ds.faint} />
              </Tap>
            ))}
          </View>
        </Reveal>
      ) : null}

      {goal ? (
        <Reveal delay={delay + 30} style={st.section}>
          <Text style={dsText.h2}>Mục tiêu tuần</Text>
          <View style={[st.card, st.goalCard, xmas && glassCard('rgba(251,191,36,0.3)')]}>
            {xmas ? (
              <>
                <SnowEdge />
                <PineBranch size={70} flip style={{ position: 'absolute', right: -6, top: -14 }} />
              </>
            ) : null}
            {plan.recommendedGoal ? <Text style={st.hint}>Hướng tới {plan.recommendedGoal}</Text> : null}
            <View style={{ gap: 6 }}>
              <View style={st.rowBetween}>
                <Text style={st.label}>Bài học</Text>
                <Text style={st.count}>
                  {Math.min(goal.lessonsDone, goal.lessonsTarget)}/{goal.lessonsTarget}
                </Text>
              </View>
              <ProgressBar value={progressRatio(goal.lessonsDone, goal.lessonsTarget)} color={xmas ? '#93C5FD' : ds.sky} height={10} />
            </View>
            <View style={{ gap: 6 }}>
              <View style={st.rowBetween}>
                <Text style={st.label}>Thẻ ôn</Text>
                <Text style={st.count}>
                  {Math.min(goal.cardsReviewed, goal.cardsTarget)}/{goal.cardsTarget}
                </Text>
              </View>
              <ProgressBar value={progressRatio(goal.cardsReviewed, goal.cardsTarget)} color={xmas ? '#34D399' : ds.green} height={10} />
            </View>
          </View>
        </Reveal>
      ) : null}
    </>
  );
};

const st = StyleSheet.create({
  section: { gap: 12 },
  card: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    paddingHorizontal: 14,
  },
  goalCard: { paddingVertical: 14, gap: 14 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: ds.line },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: dsFont.bold, fontSize: dsSize.base, color: ds.ink },
  score: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.amberText },
  count: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.muted },
  hint: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
});
