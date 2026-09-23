import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';
import { Clock, Lock, BarChart2, ArrowRight, ClipboardCheck } from 'lucide-react-native';

export const PlacementIntroScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const infoItems = [
    { Icon: Clock, text: 'Thời lượng: ~3 phút làm bài' },
    { Icon: Lock, text: 'Không quay lại câu trước khi làm' },
    { Icon: BarChart2, text: 'Nhận kết quả chẩn đoán CEFR ngay lập tức' },
  ];

  const safeTop = Math.max(insets.top, 48) + 12;
  const safeBottom = Math.max(insets.bottom, 24) + 12;

  return (
    <View style={[s.container, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
      <View style={s.content}>
        {/* Clean Theme Icon */}
        <View style={s.iconCircle}>
          <ClipboardCheck color={colors.primary} size={38} strokeWidth={2} />
        </View>

        {/* Title */}
        <Text style={s.title}>Bài Kiểm Tra Xếp Trình Độ</Text>
        <Text style={s.titleSub}>(Placement Test)</Text>

        {/* Description */}
        <Text style={s.desc}>
          Bài kiểm tra gồm 5 câu hỏi nhanh tổng hợp Từ vựng, Ngữ pháp và Đọc hiểu để xác định
          trình độ CEFR (A1–B2) của bạn.
        </Text>

        {/* Info Card */}
        <View style={s.infoCard}>
          {infoItems.map(({ Icon, text }, i) => (
            <View key={i} style={[s.infoRow, i < infoItems.length - 1 && s.infoRowBorder]}>
              <View style={s.infoIconWrap}>
                <Icon color={colors.primary} size={16} strokeWidth={2} />
              </View>
              <Text style={s.infoText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => router.push('/(auth)/placement-test' as any)}
        activeOpacity={0.85}
        style={s.ctaBtn}
      >
        <Text style={s.ctaBtnText}>Bắt Đầu Kiểm Tra</Text>
        <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  titleSub: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  desc: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    lineHeight: 19,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
