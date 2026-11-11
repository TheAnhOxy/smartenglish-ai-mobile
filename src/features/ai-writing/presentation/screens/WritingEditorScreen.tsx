import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useWritingAnalysisMutation, useWritingSession, WRITING_TYPE_LABEL } from '../../application/useAiWriting';
import { BackButton } from '@/src/core/components/BackButton';

const MIN_WORDS = 20;

/** UC-07: soạn và nộp bài viết cho AI chấm. Bài đang viết được giữ lại khi quay về từ màn kết quả. */
export const WritingEditorScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, text, setText, setResult } = useWritingSession();
  const mutation = useWritingAnalysisMutation();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= MIN_WORDS && !mutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    mutation.mutate(
      { text: text.trim(), type },
      {
        onSuccess: (result) => {
          setResult(result);
          router.push('/(student)/practice/writing/analysis' as never);
        },
      },
    );
  };

  const errorMessage =
    (mutation.error as any)?.response?.data?.detail ||
    (mutation.error as any)?.response?.data?.message ||
    (mutation.error ? 'AI chưa chấm được bài. Vui lòng thử lại.' : null);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>{WRITING_TYPE_LABEL[type]}</Text>
        <Text style={[s.count, wordCount >= MIN_WORDS && { color: colors.success }]}>{wordCount} từ</Text>
      </View>

      <View style={s.body}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          placeholder={`Viết bài bằng tiếng Anh tại đây (tối thiểu ${MIN_WORDS} từ)...`}
          placeholderTextColor={colors.textFaint}
          style={s.input}
          editable={!mutation.isPending}
        />
        {errorMessage ? (
          <View style={s.errorBox}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={s.errorText}>{String(errorMessage)}</Text>
          </View>
        ) : null}
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {wordCount < MIN_WORDS ? (
          <Text style={s.hint}>Cần thêm {MIN_WORDS - wordCount} từ nữa để chấm bài (tối thiểu {MIN_WORDS} từ)</Text>
        ) : null}
        <Pressable onPress={submit} disabled={!canSubmit} style={[s.submitBtn, !canSubmit && { opacity: 0.5 }]}>
          {mutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text style={s.submitText}>{mutation.isPending ? 'AI đang chấm bài...' : 'Chấm bài với AI'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  hint: { fontSize: 12, color: colors.textSoft, textAlign: 'center', marginBottom: 8 },
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  count: { minWidth: 40, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.textSoft },
  body: { flex: 1, paddingHorizontal: 20, gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  submitBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
