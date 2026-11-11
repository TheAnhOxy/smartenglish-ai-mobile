import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { DailyQuestList } from '../components/DailyQuestList';
import { BackButton } from '@/src/core/components/BackButton';

/** Toàn bộ nhiệm vụ hằng ngày (dữ liệu thật từ máy chủ) và nút nhận thưởng. */
const DailyChallengeContent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Nhiệm vụ hôm nay</Text>
        <View style={s.backBtn} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <DailyQuestList />
      </ScrollView>
    </View>
  );
};

export const DailyChallengeScreen = withLoginRequired(DailyChallengeContent);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
});
