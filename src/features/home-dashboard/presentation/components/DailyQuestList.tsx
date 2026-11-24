import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, BookOpen, CheckCircle2, Headphones, HelpCircle, Layers, Target, Zap } from '@/src/components/ds/icons';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { ProgressBar, feedback } from '@/src/components/ds';
import { useQueryClient } from '@tanstack/react-query';
import { claimDailyQuestRewardApi, DailyQuestIconKey, DailyQuestItem } from '../../data/dashboardApi';
import { useDailyQuestsQuery } from '../../application/useDashboard';
import { rememberDailyClaim } from '../../data/dailyClaimMemory';
import { useAuthStore } from '@/src/core/flows/authStore';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';
import { useXmasActive } from '@/src/core/services/xmas';
import { GiftBox } from '@/src/components/xmas/XmasArt';
import { ShimmerSweep, SnowEdge } from '@/src/components/xmas/WinterUI';
import { SnowConfetti } from '@/src/components/xmas/SnowConfetti';
import { SantaHat } from '@/src/features/learning-path/presentation/winter/WinterArt';

const QUEST_ICONS: Record<DailyQuestIconKey, React.ComponentType<{ size?: number; color?: string }>> = {
  target: Target,
  vocab: Layers,
  reading: BookOpen,
  listening: Headphones,
  xp: Zap,
  quiz: HelpCircle,
};

interface DailyQuestListProps {
  /** Giới hạn số nhiệm vụ hiển thị (trang chủ chỉ hiện vài mục) */
  limit?: number;
}

/** Danh sách nhiệm vụ hằng ngày lấy từ /learning/gamification/daily-quests. */
export const DailyQuestList: React.FC<DailyQuestListProps> = ({ limit }) => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useDailyQuestsQuery();
  const [claiming, setClaiming] = useState(false);
  const xmas = useXmasActive();
  // Ăn mừng chỉ khi vừa nhận thưởng thật, không chạy lại khi mở màn
  const [celebrate, setCelebrate] = useState(0);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.currentUser?.id);

  // Quay lại từ bài tập thì cập nhật tiến độ ngay
  useFocusEffect(
    React.useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <View style={st.state}>
        <ActivityIndicator size="small" color={ds.btn} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={st.state}>
        <AlertCircle size={24} color={ds.red} />
        <Text style={st.stateText}>Không thể tải nhiệm vụ hôm nay</Text>
        <Pressable onPress={() => refetch()} style={st.retryBtn}>
          <Text style={st.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  // Đã nhận thưởng: không còn nhiệm vụ hôm nay, chỉ báo hoàn thành (kèm huy hiệu vừa nhận nếu có)
  if (data.isClaimed) {
    return (
      <View style={[st.doneCard, xmas && XMAS_DONE]}>
        {xmas ? <SnowEdge /> : null}
        <SnowConfetti trigger={celebrate} />
        <View>
          <AnimatedFoxMascot size={92} entrance={false} />
          {xmas ? <SantaHat size={34} style={{ position: 'absolute', top: -8, left: 30, transform: [{ rotate: '-12deg' }] }} /> : null}
        </View>
        {xmas ? <GiftBox size={34} style={{ position: 'absolute', right: 12, bottom: 10 }} /> : null}
        <View style={st.doneText}>
          <Text style={[st.doneTitle, xmas && { color: '#FDE68A' }]}>Đã xong nhiệm vụ hôm nay</Text>
          <Text style={st.doneHint}>Bạn đã nhận {data.totalXpReward} XP. Nhiệm vụ mới sẽ có vào ngày mai.</Text>
          {newBadges.length > 0 ? (
            <View style={st.badgeBox}>
              <Text style={st.badgeTitle}>Huy hiệu mới</Text>
              <Text style={st.badgeNames}>{newBadges.join(' · ')}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Nhiệm vụ chưa xong lên trước để người học thấy việc cần làm
  const ordered = [...data.quests].sort((a, b) => Number(a.current >= a.target) - Number(b.current >= b.target));
  const quests = limit ? ordered.slice(0, limit) : ordered;
  const remaining = data.quests.filter((q) => q.current < q.target).length;
  if (quests.length === 0) {
    return (
      <View style={st.state}>
        <Target size={24} color={ds.faint} />
        <Text style={st.stateText}>Hôm nay chưa có nhiệm vụ nào</Text>
      </View>
    );
  }

  const allDone = data.quests.every((q) => q.current >= q.target);
  const canClaim = allDone && !data.isClaimed;

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError(null);
    try {
      const result = await claimDailyQuestRewardApi(data.questId);
      // Huy hiệu vừa đạt nhờ hoàn thành nhiệm vụ (server xét và trao)
      const badges = Array.isArray(result?.newBadges) ? result.newBadges : [];
      setNewBadges(badges.map((b: { nameVi?: string }) => b?.nameVi).filter((n: unknown): n is string => typeof n === 'string' && n.length > 0));
      if (userId != null) rememberDailyClaim(userId);
      feedback.success();
      setCelebrate((c) => c + 1);
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['user-stats'] })]);
    } catch (e: any) {
      setClaimError(e?.response?.data?.message || e?.message || 'Không nhận được thưởng, vui lòng thử lại');
    } finally {
      setClaiming(false);
    }
  };

  const levelLine = data.cefrLevel
    ? `Trình độ ${data.cefrLevel}${data.estimatedMinutes ? ` · khoảng ${data.estimatedMinutes} phút` : ''}`
    : null;

  return (
    <View style={st.list}>
      {levelLine ? <Text style={st.levelLine}>{levelLine}</Text> : null}
      <Text style={st.remainLine}>
        {remaining > 0 ? `Còn ${remaining}/${data.quests.length} nhiệm vụ chưa hoàn thành` : 'Đã hoàn thành tất cả, nhận thưởng thôi!'}
      </Text>
      {quests.map((quest: DailyQuestItem) => {
        const Icon = QUEST_ICONS[quest.icon] ?? Target;
        const done = quest.current >= quest.target;
        const pct = Math.min((quest.current / Math.max(quest.target, 1)) * 100, 100);
        return (
          <Pressable key={quest.id} onPress={() => {
              feedback.tap();
              router.push(quest.route as never);
            }} style={[st.item, xmas && (done ? XMAS_ITEM_DONE : XMAS_ITEM)]}>
            <View style={[st.iconBox, done && st.iconBoxDone]}>
              <Icon size={22} color={done ? ds.green : ds.btn} />
            </View>
            <View style={st.center}>
              <Text style={st.title} numberOfLines={1}>{quest.title}</Text>
              {quest.subtitle ? <Text style={st.subtitle} numberOfLines={1}>{quest.subtitle}</Text> : null}
              <View style={st.progressRow}>
                <ProgressBar value={pct / 100} color={xmas ? (done ? '#34D399' : '#67E8F9') : done ? ds.green : ds.sky} height={8} style={{ flex: 1 }} />
                <Text style={st.progressLabel}>
                  {quest.current}/{quest.target} {quest.unit}
                </Text>
              </View>
            </View>
            {done ? (
              <CheckCircle2 size={24} color={ds.green} />
            ) : (
              <View style={[st.xpPill, xmas && { backgroundColor: 'rgba(251,191,36,0.18)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.5)' }]}>
                <Text style={[st.xp, xmas && { color: '#FDE68A' }]}>+{quest.xp} XP</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {canClaim ? (
        <Pressable onPress={handleClaim} disabled={claiming} style={[st.claimBtn, xmas && { backgroundColor: '#FBBF24', overflow: 'hidden' }, claiming && { opacity: 0.6 }]}>
          {xmas ? <ShimmerSweep width={320} every={2400} /> : null}
          {claiming ? <ActivityIndicator size="small" color={ds.ink} /> : null}
          <Text style={st.claimText}>Nhận {data.totalXpReward} XP{data.gemReward ? ` + ${data.gemReward} gem` : ''}</Text>
        </Pressable>
      ) : data.isClaimed ? (
        <Text style={st.claimedText}>Đã nhận thưởng hôm nay</Text>
      ) : null}
      {claimError ? <Text style={st.claimError}>{claimError}</Text> : null}
    </View>
  );
};

// Giáng sinh (style inline để giữ đúng màu)
const XMAS_ITEM = { backgroundColor: 'rgba(23,36,58,0.9)', borderColor: 'rgba(147,197,253,0.25)' };
const XMAS_ITEM_DONE = { backgroundColor: 'rgba(6,78,59,0.55)', borderColor: 'rgba(52,211,153,0.5)' };
const XMAS_DONE = { backgroundColor: 'rgba(23,36,58,0.92)', borderColor: 'rgba(251,191,36,0.45)', overflow: 'hidden' as const };

const st = StyleSheet.create({
  list: { gap: 10 },
  state: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  stateText: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.muted },
  retryBtn: {
    backgroundColor: ds.btn,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: dsRadius.sm,
    borderBottomWidth: 3,
    borderBottomColor: ds.btnEdge,
  },
  retryText: { color: ds.white, fontFamily: dsFont.bold, fontSize: dsSize.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    padding: 12,
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: ds.skySoft, alignItems: 'center', justifyContent: 'center' },
  iconBoxDone: { backgroundColor: ds.greenSoft },
  center: { flex: 1, gap: 7 },
  title: { fontFamily: dsFont.semibold, fontSize: dsSize.base - 1, color: ds.ink },
  subtitle: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, marginTop: -4 },
  levelLine: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.muted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.muted },
  xpPill: { backgroundColor: ds.amberSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  xp: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.amberText },
  claimBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.amber,
    borderRadius: dsRadius.md,
    borderBottomWidth: 4,
    borderBottomColor: ds.amberDeep,
    paddingVertical: 13,
    marginTop: 4,
  },
  claimText: { color: ds.ink, fontFamily: dsFont.bold, fontSize: dsSize.base },
  claimError: { textAlign: 'center', fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.red, marginTop: 6 },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: dsRadius.lg,
    backgroundColor: ds.greenSoft,
    borderWidth: 1.5,
    borderColor: ds.green,
  },
  doneText: { flex: 1, gap: 4 },
  doneTitle: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.greenText },
  doneHint: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.inkSoft, lineHeight: 18 },
  remainLine: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.muted, marginBottom: 2 },
  badgeBox: { marginTop: 8, padding: 12, borderRadius: dsRadius.md, backgroundColor: ds.amberSoft, alignItems: 'center', gap: 2 },
  badgeTitle: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.amberText, textTransform: 'uppercase', letterSpacing: 0.6 },
  badgeNames: { fontFamily: dsFont.display, fontSize: dsSize.base, color: ds.ink, textAlign: 'center' },
  claimedText: { textAlign: 'center', fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.green, marginTop: 4 },
});
