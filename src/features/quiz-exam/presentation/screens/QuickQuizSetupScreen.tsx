import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Check, Play } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { getTopicsApi } from '@/src/features/flashcard-srs/data/vocabularyApi';
import { QUICK_TYPE_LABEL, QuickQuestionType } from '../../application/quickQuizGenerator';
import { BackButton } from '@/src/core/components/BackButton';

const LEVELS = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1'];
const COUNTS = [5, 10, 15];
const TYPES: QuickQuestionType[] = ['meaning', 'word', 'blank'];

/** Thiết lập Quiz nhanh: câu hỏi được sinh từ kho từ vựng thật theo chủ đề và trình độ. */
export const QuickQuizSetupScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [topicId, setTopicId] = useState<string>('');
  const [level, setLevel] = useState('Tất cả');
  const [count, setCount] = useState(10);
  const [types, setTypes] = useState<QuickQuestionType[]>(['meaning', 'word']);

  const topicsQuery = useQuery({ queryKey: ['vocab-topics'], queryFn: getTopicsApi, staleTime: 10 * 60 * 1000 });

  const toggleType = (t: QuickQuestionType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const start = () => {
    if (types.length === 0) return;
    router.push({
      pathname: '/(student)/practice/quiz/play',
      params: { topicId, level: level === 'Tất cả' ? '' : level, count: String(count), types: types.join(',') },
    } as never);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Quiz nhanh</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 20 }}>
        <Text style={s.lead}>Câu hỏi được tạo ngẫu nhiên từ kho từ vựng của hệ thống theo lựa chọn của bạn.</Text>

        <View style={s.section}>
          <Text style={s.label}>Dạng câu hỏi</Text>
          {TYPES.map((t) => {
            const on = types.includes(t);
            return (
              <Pressable key={t} onPress={() => toggleType(t)} style={[s.typeRow, on && s.typeRowOn]}>
                <View style={[s.checkbox, on && s.checkboxOn]}>{on ? <Check size={14} color="#FFFFFF" /> : null}</View>
                <Text style={s.typeText}>{QUICK_TYPE_LABEL[t]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.section}>
          <Text style={s.label}>Chủ đề</Text>
          {topicsQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={s.chips}>
              {[{ id: '', name: 'Tất cả' }, ...(topicsQuery.data ?? [])].map((t) => (
                <Pressable key={t.id || 'all'} onPress={() => setTopicId(t.id)} style={[s.chip, topicId === t.id && s.chipOn]}>
                  <Text style={[s.chipText, topicId === t.id && s.chipTextOn]}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.label}>Trình độ</Text>
          <View style={s.chips}>
            {LEVELS.map((l) => (
              <Pressable key={l} onPress={() => setLevel(l)} style={[s.chip, level === l && s.chipOn]}>
                <Text style={[s.chipText, level === l && s.chipTextOn]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Số câu</Text>
          <View style={s.chips}>
            {COUNTS.map((c) => (
              <Pressable key={c} onPress={() => setCount(c)} style={[s.chip, count === c && s.chipOn]}>
                <Text style={[s.chipText, count === c && s.chipTextOn]}>{c} câu</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={start} disabled={types.length === 0} style={[s.startBtn, types.length === 0 && { opacity: 0.5 }]}>
          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={s.startText}>Bắt đầu</Text>
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
  lead: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  typeRowOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: '#FFFFFF', fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg },
  startBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14 },
  startText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
