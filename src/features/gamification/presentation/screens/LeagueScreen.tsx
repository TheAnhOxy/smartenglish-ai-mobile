import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ArrowLeft, ShoppingBag, Trophy } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useAuthStore } from '@/src/core/flows/authStore';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { useLeagueLeaderboardQuery } from '../../application/useGamification';
import type { LeaderboardMember } from '../../data/leagueApi';

const PODIUM_ORDER = [1, 0, 2]; // hạng 2 - hạng 1 - hạng 3

export const LeagueScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = useAuthStore((s) => (s.currentUser?.id != null ? String(s.currentUser.id) : null));
  const { data: members, isLoading, isError, refetch, isRefetching } = useLeagueLeaderboardQuery();
  const memberList: LeaderboardMember[] = Array.isArray(members) ? members : [];
  const top3 = memberList.slice(0, 3);

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardMember }) => {
      const isMe = myId != null && item.user_id === myId;
      return (
        <View
          className={`px-4 py-3 rounded-2xl border mb-2 flex-row items-center ${
            isMe ? 'bg-primary/10 border-primary/40' : 'bg-white dark:bg-darkCard border-gray-100 dark:border-gray-800'
          }`}
        >
          <Text className={`w-8 text-sm font-bold ${isMe ? 'text-primary' : 'text-neutralGray'}`}>#{item.rank}</Text>
          <UserAvatar uri={item.avatar_url} size={36} />
          <Text className={`flex-1 ml-3 text-sm font-semibold ${isMe ? 'text-primary' : 'text-neutralInk dark:text-white'}`} numberOfLines={1}>
            {item.display_name}
            {isMe ? ' (Bạn)' : ''}
          </Text>
          <Text className="text-sm font-bold text-neutralInk dark:text-white">{item.weekly_xp} XP</Text>
        </View>
      );
    },
    [myId]
  );

  const header = top3.length > 0 ? (
    <View className="flex-row justify-around items-end bg-white dark:bg-darkCard rounded-2xl border border-gray-100 dark:border-gray-800 px-4 pt-5 pb-4 mb-4">
      {PODIUM_ORDER.map((idx) => {
        const m = top3[idx];
        if (!m) return <View key={idx} className="w-20" />;
        const isFirst = idx === 0;
        return (
          <View key={m.user_id} className={`items-center w-24 ${isFirst ? '-mt-3' : ''}`}>
            {isFirst ? <Trophy size={20} color={AppColors.warning} /> : <Text className="text-xs font-bold text-neutralGray">#{idx + 1}</Text>}
            <View className="mt-1 mb-1">
              <UserAvatar uri={m.avatar_url} size={isFirst ? 56 : 44} />
            </View>
            <Text className="text-xs font-semibold text-neutralInk dark:text-white" numberOfLines={1}>{m.display_name}</Text>
            <Text className="text-xs font-bold text-primary">{m.weekly_xp} XP</Text>
          </View>
        );
      })}
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-surface dark:bg-darkBg px-5" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Quay lại" className="w-10 h-10 -ml-2 items-center justify-center">
          <ArrowLeft size={20} color={AppColors.neutralInk} />
        </Pressable>
        <Text className="text-base font-bold text-neutralInk dark:text-white">Bảng xếp hạng tuần</Text>
        <Pressable
          onPress={() => router.push('/(student)/shop')}
          hitSlop={10}
          accessibilityLabel="Cửa hàng"
          className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center"
        >
          <ShoppingBag size={18} color={AppColors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={AppColors.primary} size="small" />
        </View>
      ) : isError ? (
        <View className="py-16 items-center">
          <AlertCircle size={28} color={AppColors.error} />
          <Text className="text-sm text-neutralGray my-3">Không thể tải bảng xếp hạng</Text>
          <Pressable onPress={() => refetch()} className="bg-primary px-5 py-2.5 rounded-xl">
            <Text className="text-white font-bold text-xs">Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={memberList}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Trophy size={28} color={AppColors.neutralGray} />
              <Text className="text-sm font-bold text-neutralInk dark:text-white mt-3">Chưa có dữ liệu xếp hạng tuần này</Text>
            </View>
          }
        />
      )}
    </View>
  );
};
