import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, ChevronRight, GraduationCap, Mail, PenLine } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useAuthStore } from '@/src/core/flows/authStore';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { useWritingSession, WRITING_TYPE_LABEL } from '../../application/useAiWriting';
import type { WritingType } from '../../data/writingApi';
import { BackButton } from '@/src/core/components/BackButton';
import { hasActivePremium } from '@/src/core/utils/plan';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

const TYPES: { id: WritingType; desc: string; icon: IconType }[] = [
  { id: 'essay', desc: 'Bài luận 200–300 từ: ngữ pháp, từ vựng, mạch ý', icon: PenLine },
  { id: 'email', desc: 'Email công việc: văn phong trang trọng hay thân mật', icon: Mail },
  { id: 'ielts_task1', desc: 'Mô tả biểu đồ, bảng số liệu, quy trình', icon: BarChart3 },
  { id: 'ielts_task2', desc: 'Nghị luận, chấm theo 4 tiêu chí IELTS', icon: GraduationCap },
];

/** UC-07: chọn dạng bài trước khi soạn. Tài khoản miễn phí được chấm 3 bài mỗi ngày. */
const WritingTypeSelectContent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPremium = useAuthStore((s) => hasActivePremium(s.currentUser));
  const setType = useWritingSession((s) => s.setType);

  const choose = (id: WritingType) => {
    setType(id);
    router.push('/(student)/practice/writing/editor' as never);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Luyện viết với AI</Text>
        <View style={s.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Text style={s.lead}>
          AI chỉ ra lỗi chính tả, ngữ pháp, dùng từ, chấm điểm theo tiêu chí IELTS và viết lại bài cho tự nhiên hơn.
          {isPremium ? '' : ' Gói miễn phí: 3 lượt chấm mỗi ngày.'}
        </Text>
        {TYPES.map(({ id, desc, icon: Icon }) => (
          <Pressable key={id} onPress={() => choose(id)} style={s.card}>
            <View style={s.cardIcon}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{WRITING_TYPE_LABEL[id]}</Text>
              <Text style={s.cardDesc}>{desc}</Text>
            </View>
            <ChevronRight size={18} color={colors.textSoft} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export const WritingTypeSelectScreen = withLoginRequired(WritingTypeSelectContent);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  lead: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
});
