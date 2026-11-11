import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, BookOpen, CheckCircle2, HelpCircle, Layers, Target, Zap } from '@/src/components/ds/icons';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { ProgressBar, feedback } from '@/src/components/ds';
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

  const quests = limit ? data.quests.slice(0, limit) : data.quests;
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
    try {
      await claimDailyQuestRewardApi(data.questId);
      feedback.success();
      await refetch();
    } catch (e) {
      console.warn('[DailyQuestList] claim failed:', e);
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
          <Pressable key={quest.id} onPress={() => {
              feedback.tap();
              router.push(quest.route as never);
            }} style={st.item}>
            <View style={[st.iconBox, done && st.iconBoxDone]}>
              <Icon size={22} color={done ? ds.green : ds.btn} />
            </View>
            <View style={st.center}>
              <Text style={st.title} numberOfLines={1}>{quest.title}</Text>
              <View style={st.progressRow}>
                <ProgressBar value={pct / 100} color={done ? ds.green : ds.sky} height={8} style={{ flex: 1 }} />
                <Text style={st.progressLabel}>
                  {quest.current}/{quest.target} {quest.unit}
                </Text>
              </View>
            </View>
            {done ? (
              <CheckCircle2 size={24} color={ds.green} />
            ) : (
              <View style={st.xpPill}>
                <Text style={st.xp}>+{quest.xp} XP</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {canClaim ? (
        <Pressable onPress={handleClaim} disabled={claiming} style={[st.claimBtn, claiming && { opacity: 0.6 }]}>
          {claiming ? <ActivityIndicator size="small" color={ds.ink} /> : null}
          <Text style={st.claimText}>Nhận {data.totalXpReward} XP</Text>
        </Pressable>
      ) : data.isClaimed ? (
        <Text style={st.claimedText}>Đã nhận thưởng hôm nay</Text>
      ) : null}
    </View>
  );
};

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
  claimedText: { textAlign: 'center', fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.green, marginTop: 4 },
});
