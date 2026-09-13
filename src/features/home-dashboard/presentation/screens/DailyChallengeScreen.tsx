import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/src/theme';

const CHALLENGE_TASKS = [
  { id: 't1', title: 'Ôn 15 Thẻ Từ Vựng SRS', xp: 15, done: true },
  { id: 't2', title: 'Hoàn Thành 1 Bài Tập Quiz Ngữ Pháp', xp: 20, done: true },
  { id: 't3', title: 'Luyện Phát Âm 1 Phiên Câu Dài IPA', xp: 25, done: false }
];

export const DailyChallengeScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Trang Chủ</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1"> Thử Thách Hằng Ngày</Text>
        <Text className="text-xs text-neutralGray mb-6">Hoàn thành nhiệm vụ mỗi ngày để nhận phần thưởng XP & Coin tích lũy.</Text>

        <View className="gap-3 mb-6">
          {CHALLENGE_TASKS.map((task) => (
            <View
              key={task.id}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                task.done ? 'bg-success/10 border-success/30' : 'bg-cardWhite border-gray-100 shadow-sm'
              }`}
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <Text className="text-xl">{task.done ? '✅' : '⏳'}</Text>
                <Text className={`text-sm font-bold flex-1 ${task.done ? 'text-success' : 'text-neutralInk'}`}>
                  {task.title}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.xpSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.xpBorder }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.xpDeep }}>+{task.xp} XP</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
