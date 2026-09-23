import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Bot, ChevronRight, ChevronLeft, Lock, MessageSquare, Flame, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  fetchRoleplayScenariosApi,
  RoleplayScenario,
  useSpeakingQuotaStore,
  FREE_SPEAKING_DAILY_LIMIT,
} from '../../data/speakingApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';

export const RoleplayScenariosScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const { getQuota } = useSpeakingQuotaStore();
  const quota = getQuota(isPremium);


  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleplayScenariosApi()
      .then(setScenarios)
      .finally(() => setLoading(false));
  }, []);

  const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
    A1: { bg: '#ECFDF5', text: colors.success },
    A2: { bg: '#ECFDF5', text: colors.success },
    B1: { bg: colors.xpSoft, text: colors.xpDeep },
    B2: { bg: colors.xpSoft, text: colors.xpDeep },
    C1: { bg: colors.dangerSoft, text: colors.danger },
    C2: { bg: colors.dangerSoft, text: colors.danger },
  };

  const renderItem = ({ item, index }: { item: RoleplayScenario; index: number }) => {
    const isLocked = item.is_premium && !isPremium;
    const cefrStyle = CEFR_COLORS[item.cefr_level] || { bg: colors.secondarySoft, text: colors.secondaryDeep };

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(260)}>
        <Pressable
          onPress={() => {
            if (isLocked) {
              router.push('/(student)/profile/premium' as any);
              return;
            }
            router.push(`/(student)/practice/speaking/roleplay/${item.id}` as any);
          }}
          style={({ pressed }) => [s.card, pressed && { opacity: 0.86 }]}
        >
          {/* Icon */}
          <View style={s.iconWrap}>
            <Bot color={colors.secondary} size={22} />
          </View>

          {/* Content */}
          <View style={s.cardBody}>
            <View style={s.titleRow}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <View style={[s.cefrBadge, { backgroundColor: cefrStyle.bg }]}>
                <Text style={[s.cefrText, { color: cefrStyle.text }]}>{item.cefr_level}</Text>
              </View>
            </View>

            <Text style={s.persona}>
              <Text style={s.personaLabel}>AI: </Text>{item.ai_persona}
            </Text>

            <Text style={s.openingLine} numberOfLines={2}>"{item.opening_line}"</Text>

            {isLocked && (
              <View style={s.lockedRow}>
                <Lock color={colors.coin} size={11} />
                <Text style={s.lockedText}>Chỉ dành cho tài khoản Premium</Text>
              </View>
            )}
          </View>

          {/* Arrow */}
          {isLocked
            ? <Lock color={colors.textFaint} size={16} />
            : <ChevronRight color={colors.textFaint} size={18} />}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>AI Roleplay Companion</Text>
          <Text style={s.headerSub}>Chọn kịch bản hội thoại để luyện nói với AI</Text>
        </View>
        <View style={s.headerRight}>
          <MessageSquare color={colors.textFaint} size={20} />
        </View>
      </View>

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.loadText}>Đang tải kịch bản...</Text>
        </View>
      ) : (
        <FlatList
          data={scenarios}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <View style={s.quotaBanner}>
              <View style={s.quotaBannerLeft}>
                {isPremium ? (
                  <Sparkles color="#9333EA" size={16} />
                ) : (
                  <Flame color="#EA580C" size={16} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.quotaBannerTitle}>
                    {isPremium
                      ? '👑 Gói Premium: Không giới hạn lượt đàm thoại'
                      : `Hạn mức hôm nay: Còn ${quota.remaining}/${FREE_SPEAKING_DAILY_LIMIT} lượt`}
                  </Text>
                  <Text style={s.quotaBannerSub}>
                    {isPremium
                      ? 'Thỏa sức luyện nói và phản xạ với mọi kịch bản AI'
                      : 'Hạn mức 20 lượt/ngày dùng chung cho tất cả các kịch bản'}
                  </Text>
                </View>
              </View>
              {!isPremium && (
                <Pressable
                  onPress={() => router.push('/(student)/profile/premium' as any)}
                  style={s.quotaBannerUpgradeBtn}
                >
                  <Text style={s.quotaBannerUpgradeText}>Nâng cấp 👑</Text>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Bot color={colors.textFaint} size={36} />
              <Text style={s.emptyTitle}>Chưa có kịch bản nào</Text>
              <Text style={s.emptyDesc}>Backend chưa cung cấp dữ liệu roleplay</Text>
            </View>
          }
        />

      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: font.family, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 12, fontFamily: font.family, color: colors.textSoft, marginTop: 2 },
  headerRight: { padding: 4 },

  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.secondarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 14, fontFamily: font.family, fontWeight: '800', color: colors.text, flex: 1 },
  cefrBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  cefrText: { fontSize: 10, fontFamily: font.family, fontWeight: '800', letterSpacing: 0.3 },
  persona: { fontSize: 12, fontFamily: font.family, color: colors.textSoft, marginBottom: 6 },
  personaLabel: { fontWeight: '700', color: colors.secondary },
  openingLine: { fontSize: 12, fontFamily: font.family, color: colors.textSoft, fontStyle: 'italic', lineHeight: 17 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  lockedText: { fontSize: 11, fontFamily: font.family, fontWeight: '700', color: colors.coin },

  loadBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText: { fontSize: 14, fontFamily: font.family, color: colors.textSoft },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: font.family, fontWeight: '700', color: colors.textSoft },
  emptyDesc: { fontSize: 13, fontFamily: font.family, color: colors.textFaint, textAlign: 'center' },

  quotaBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quotaBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quotaBannerTitle: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  quotaBannerSub: {
    fontSize: 11,
    fontFamily: font.family,
    color: '#64748B',
    lineHeight: 15,
  },
  quotaBannerUpgradeBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  quotaBannerUpgradeText: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

