import React from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLeagueLeaderboardQuery } from '../../application/useGamification';

export const LeagueScreen = () => {
  const router = useRouter();
  const { data: members, isLoading } = useLeagueLeaderboardQuery();

  const memberList = Array.isArray(members) ? members : [];

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      {/* Top Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-neutralInk">Bảng Xếp Hạng Tuần 🏆</Text>
          <Text className="text-xs text-neutralGray mt-0.5">Silver League • Đếm ngược reset: 2 ngày 14 giờ</Text>
        </View>

        <Pressable
          onPress={() => router.push('/(student)/shop' as any)}
          className="bg-accent/20 px-3.5 py-1.5 rounded-full border border-accent/40 flex-row items-center gap-1"
        >
          <Text className="text-xs">🛒</Text>
          <Text className="text-xs font-bold text-amber-700">Cửa Hàng</Text>
        </Pressable>
      </View>

      {/* Top 3 Podium Visual */}
      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 flex-row justify-around items-end shadow-sm h-40">
        {/* Rank 2 - Silver */}
        <View className="items-center">
          <Text className="text-xl mb-1">🥈</Text>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=2' }} className="w-11 h-11 rounded-full mb-1 border-2 border-slate-300" />
          <Text className="text-[10px] font-bold text-neutralInk">Hoàng Nam</Text>
          <Text className="text-[10px] font-extrabold text-neutralGray">720 XP</Text>
        </View>

        {/* Rank 1 - Gold */}
        <View className="items-center -mt-4">
          <Text className="text-2xl mb-1">👑</Text>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=1' }} className="w-14 h-14 rounded-full mb-1 border-2 border-amber-400" />
          <Text className="text-xs font-bold text-neutralInk">Minh Anh</Text>
          <Text className="text-xs font-extrabold text-amber-600">850 XP</Text>
        </View>

        {/* Rank 3 - Bronze */}
        <View className="items-center">
          <Text className="text-xl mb-1">🥉</Text>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=33' }} className="w-10 h-10 rounded-full mb-1 border-2 border-amber-700" />
          <Text className="text-[10px] font-bold text-neutralInk">Bạn (Học)</Text>
          <Text className="text-[10px] font-extrabold text-primary">640 XP</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#FF6B35" size="large" />
      ) : (
        <FlatList
          data={memberList}
          keyExtractor={(item) => item.user_id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.user_id === '17' || item.user_id === '11111111-1111-1111-1111-111111111111';
            return (
              <View
                className={`p-4 rounded-2xl border mb-3 flex-row justify-between items-center ${
                  isMe
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-cardWhite border-gray-100'
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className={`text-base font-extrabold w-6 text-center ${isMe ? 'text-primary' : 'text-neutralGray'}`}>
                    #{item.rank}
                  </Text>
                  <Image source={{ uri: item.avatar_url }} className="w-10 h-10 rounded-full border border-gray-200" />
                  <View>
                    <Text className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-neutralInk'}`}>
                      {item.display_name} {isMe ? '(Bạn)' : ''}
                    </Text>
                    <Text className="text-[10px] text-neutralGray">Silver League</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-sm font-extrabold text-neutralInk">{item.weekly_xp} XP</Text>
                  {item.tier === 'gold' && <Text className="text-[9px] font-bold text-amber-600">▲ Thăng hạng Gold</Text>}
                  {item.tier === 'demotion' && <Text className="text-[9px] font-bold text-error">▼ Rớt hạng</Text>}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};
