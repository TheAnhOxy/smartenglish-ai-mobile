import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { BookOpen, ChevronRight, Headphones, Mic, PenLine } from 'lucide-react-native';
import { colors } from '@/src/theme';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

const SKILLS: { title: string; desc: string; icon: IconType; route: Href }[] = [
  { title: 'Luyện nói', desc: 'Hội thoại với AI, luyện phát âm IPA', icon: Mic, route: '/(student)/practice/speaking' as Href },
  { title: 'Luyện viết', desc: 'AI chấm và chỉ lỗi theo tiêu chí IELTS', icon: PenLine, route: '/(student)/practice/writing' as Href },
  { title: 'Luyện đọc', desc: 'Bài đọc theo trình độ, có câu hỏi', icon: BookOpen, route: '/(student)/practice/reading' as Href },
  { title: 'Luyện nghe', desc: 'Bài nghe theo trình độ, chỉnh tốc độ, có câu hỏi', icon: Headphones, route: '/(student)/practice/listening' as Href },
];

/** Mục "Kỹ năng" trong tab Lộ trình: lối vào luyện nói, viết, đọc, nghe. */
export const SkillPracticeScreen = () => {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
      {SKILLS.map(({ title, desc, icon: Icon, route }) => (
        <Pressable key={title} onPress={() => router.push(route)} style={s.card} accessibilityLabel={`Mở ${title.toLowerCase()}`}>
          <View style={s.icon}>
            <Icon size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.desc}>{desc}</Text>
          </View>
          <ChevronRight size={18} color={colors.textSoft} />
        </Pressable>
      ))}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  desc: { fontSize: 12, color: colors.textSoft, marginTop: 3 },
});
