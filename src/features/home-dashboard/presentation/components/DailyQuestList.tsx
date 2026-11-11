import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, CheckCircle2, HelpCircle, Layers, Target, Zap } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { claimDailyQuestRewardApi, DailyQuestIconKey, DailyQuestItem } from '../../data/dashboardApi';
import { useDailyQuestsQuery } from '../../application/useDashboard';

const QUEST_ICONS: Record<DailyQuestIconKey, React.ComponentType<{ size?: number; color?: string }>> = {
  target: Target,
  vocab: Layers,
  reading: BookOpen,
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
  const [claimError, setClaimError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <View style={st.state}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={st.state}>
        <AlertCircle size={22} color={colors.danger} />
        <Text style={st.stateText}>Không thể tải nhiệm vụ hôm nay</Text>
        <Pressable onPress={() => refetch()} style={st.retryBtn}>
          <Text style={st.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const quests = limit ? data.quests.slice(0, limit) : data.quests;
  if (quests.length === 0) {
    return (
      <View style={st.state}>
        <Target size={22} color={colors.textFaint} />
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
      await claimDailyQuestRewardApi(data.questId);
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['user-stats'] })]);
    } catch (e: any) {
      setClaimError(e?.response?.data?.message || e?.message || 'Không nhận được thưởng, vui lòng thử lại');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <View style={st.list}>
      {quests.map((quest: DailyQuestItem) => {
        const Icon = QUEST_ICONS[quest.icon] ?? Target;
        const done = quest.current >= quest.target;
        const pct = Math.min((quest.current / Math.max(quest.target, 1)) * 100, 100);
        return (
          <Pressable key={quest.id} onPress={() => router.push(quest.route as never)} style={st.item}>
            <View style={[st.iconBox, done && st.iconBoxDone]}>
              <Icon size={18} color={done ? colors.success : colors.primary} />
            </View>
            <View style={st.center}>
              <Text style={st.title} numberOfLines={1}>{quest.title}</Text>
              <View style={st.progressRow}>
                <View style={st.progressBg}>
                  <View style={[st.progressFill, { width: `${pct}%`, backgroundColor: done ? colors.success : colors.primary }]} />
                </View>
                <Text style={st.progressLabel}>
                  {quest.current}/{quest.target} {quest.unit}
                </Text>
              </View>
            </View>
            {done ? <CheckCircle2 size={18} color={colors.success} /> : <Text style={st.xp}>+{quest.xp} XP</Text>}
          </Pressable>
        );
      })}

      {canClaim ? (
        <Pressable onPress={handleClaim} disabled={claiming} style={[st.claimBtn, claiming && { opacity: 0.6 }]}>
          {claiming ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text style={st.claimText}>Nhận {data.totalXpReward} XP</Text>
        </Pressable>
      ) : data.isClaimed ? (
        <Text style={st.claimedText}>Đã nhận thưởng hôm nay</Text>
      ) : null}
      {claimError ? <Text style={st.claimError}>{claimError}</Text> : null}
    </View>
  );
};

const st = StyleSheet.create({
  list: { gap: 10 },
  state: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  stateText: { fontSize: 13, color: colors.textSoft },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconBoxDone: { backgroundColor: colors.successSoft },
  center: { flex: 1, gap: 6 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: colors.textSoft },
  xp: { fontSize: 12, fontWeight: '700', color: colors.textSoft },
  claimBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  claimText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  claimError: { textAlign: 'center', fontSize: 12, color: colors.danger, marginTop: 6 },
  claimedText: { textAlign: 'center', fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 4 },
});
