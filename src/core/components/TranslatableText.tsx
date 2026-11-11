import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Languages, Volume2, X } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { MAX_TRANSLATE_LENGTH, translateTextApi, type TranslationResult } from '@/src/core/api/translateApi';
import { speakText } from '@/src/core/services/speechService';

const cleanWord = (token: string) => token.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');

interface TranslatableTextProps {
  text: string;
  /** Báo đoạn đang chọn ('' khi bỏ chọn). */
  onSelectText: (text: string) => void;
  /** Đổi giá trị này để xoá vùng chọn (vd: khi đóng bảng dịch). */
  clearKey?: number;
  textStyle?: StyleProp<TextStyle>;
  dark?: boolean;
}

/**
 * Văn bản tiếng Anh có thể chọn để dịch:
 * chạm một từ để chọn, chạm thêm một từ khác để chọn cả cụm ở giữa, chạm lại để bỏ chọn.
 * Trên web có thể kéo chuột bôi đen như bình thường.
 */
export const TranslatableText: React.FC<TranslatableTextProps> = ({ text, onSelectText, clearKey, textStyle, dark = false }) => {
  const tokens = useMemo(() => (text || '').split(/(\s+)/), [text]);
  const [range, setRange] = useState<[number, number] | null>(null);
  const containerRef = useRef<View>(null);
  const onSelectRef = useRef(onSelectText);
  onSelectRef.current = onSelectText;

  useEffect(() => {
    setRange(null);
  }, [text, clearKey]);

  // Web: bắt đoạn bôi đen bằng chuột/ngón tay trong vùng văn bản này
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const onSelect = () => {
      const sel = window.getSelection?.();
      const raw = sel?.toString().replace(/\s+/g, ' ').trim() ?? '';
      const node = containerRef.current as unknown as HTMLElement | null;
      if (!raw || !node || !sel?.anchorNode || !node.contains(sel.anchorNode) || !/[A-Za-z]/.test(raw)) return;
      setRange(null);
      onSelectRef.current(raw.slice(0, MAX_TRANSLATE_LENGTH));
    };
    document.addEventListener('mouseup', onSelect);
    document.addEventListener('touchend', onSelect);
    return () => {
      document.removeEventListener('mouseup', onSelect);
      document.removeEventListener('touchend', onSelect);
    };
  }, []);

  const onTokenPress = (index: number) => {
    let next: [number, number] | null;
    if (!range) next = [index, index];
    else if (range[0] === range[1] && range[0] === index) next = null;
    else if (index >= range[0] && index <= range[1]) next = [index, index];
    else next = [Math.min(range[0], index), Math.max(range[1], index)];
    setRange(next);
    const phrase = next
      ? tokens
          .slice(next[0], next[1] + 1)
          .join('')
          .replace(/\s+/g, ' ')
          .replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9'.!?]+$/g, '')
          .trim()
      : '';
    onSelectText(phrase);
  };

  return (
    <View ref={containerRef}>
      <Text style={[{ color: dark ? '#FFFFFF' : colors.text }, textStyle]} selectable={Platform.OS === 'web'}>
        {tokens.map((token, i) => {
          if (!cleanWord(token)) return token;
          const selected = !!range && i >= range[0] && i <= range[1];
          return (
            <Text key={i} onPress={() => onTokenPress(i)} style={selected ? (dark ? s.selectedDark : s.selected) : undefined}>
              {token}
            </Text>
          );
        })}
      </Text>
    </View>
  );
};

interface TranslationPanelProps {
  text: string;
  onClose: () => void;
  dark?: boolean;
}

/** Bảng dịch cho đoạn đang chọn; đặt ngoài vùng cuộn để luôn nhìn thấy. */
export const TranslationPanel: React.FC<TranslationPanelProps> = ({ text, onClose, dark = false }) => {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasUser = useAuthStore((st) => !!st.currentUser);
  const guestMode = useRoleGateStore((st) => st.guestMode);
  const isLoggedIn = hasUser && !guestMode;

  useEffect(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, [text]);

  if (!text) return null;

  const translate = async () => {
    if (!isLoggedIn) {
      setError('Đăng nhập để dùng chức năng dịch');
      return;
    }
    if (text.length > MAX_TRANSLATE_LENGTH) {
      setError(`Chọn tối đa ${MAX_TRANSLATE_LENGTH} ký tự`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await translateTextApi(text));
    } catch (e: any) {
      const status = e?.response?.status;
      setError(status === 401 ? 'Đăng nhập để dùng chức năng dịch' : e?.response?.data?.message || e?.message || 'Chưa dịch được lúc này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.panel, dark && s.panelDark]}>
      <View style={s.panelHead}>
        <Text style={[s.phrase, dark && { color: '#FFFFFF' }]} numberOfLines={2}>
          {text}
        </Text>
        <Pressable onPress={() => speakText(text, { language: 'en-US' })} hitSlop={8} accessibilityLabel="Nghe phát âm">
          <Volume2 size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Bỏ chọn">
          <X size={18} color={dark ? '#CBD5E1' : colors.textSoft} />
        </Pressable>
      </View>

      {result ? (
        <View style={{ gap: 2 }}>
          {result.ipa ? (
            <Text style={s.meta}>
              {result.ipa}
              {result.partOfSpeech ? ` · ${result.partOfSpeech}` : ''}
            </Text>
          ) : null}
          <Text style={[s.translation, dark && { color: '#FFFFFF' }]}>{result.translation}</Text>
          {result.note ? <Text style={s.meta}>{result.note}</Text> : null}
        </View>
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <Pressable onPress={translate} disabled={loading} style={[s.translateBtn, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Languages size={16} color="#FFFFFF" />}
          <Text style={s.translateText}>Dịch</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  selected: { backgroundColor: colors.primarySoft, color: colors.primary },
  selectedDark: { backgroundColor: 'rgba(14,165,233,0.35)', color: '#FFFFFF' },
  panel: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  panelDark: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phrase: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  translation: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textSoft },
  error: { fontSize: 12, color: colors.danger },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
  },
  translateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
