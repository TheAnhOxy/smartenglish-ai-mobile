import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useWritingSession } from '../../application/useAiWriting';
import { BackButton } from '@/src/core/components/BackButton';

/** Đối chiếu bài gốc với bản AI viết lại. */
export const WritingCompareScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { text, result, setText, setResult } = useWritingSession();

  const finish = () => {
    setText('');
    setResult(null);
    router.replace('/(student)/home' as never);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>So sánh bản viết</Text>
        <View style={s.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 14 }}>
        <View style={s.card}>
          <Text style={s.label}>Bài gốc của bạn</Text>
          <Text style={s.body}>{text}</Text>
        </View>
        <View style={[s.card, s.cardAi]}>
          <Text style={[s.label, { color: colors.primary }]}>Bản AI viết lại</Text>
          <Text style={s.body}>{result?.rewritten_text ?? 'Chưa có bản viết lại.'}</Text>
        </View>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={finish} style={s.primaryBtn}>
          <Text style={s.primaryText}>Hoàn thành</Text>
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  cardAi: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase' },
  body: { fontSize: 15, lineHeight: 23, color: colors.text },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg },
  primaryBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
