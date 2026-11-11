import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Volume2 } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { speakText } from '@/src/core/services/speechService';
import { exploreWordsApi } from '@/src/features/flashcard-srs/data/vocabularyApi';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';

const MY_DECK_ID = 'deck-my-words';

const dayIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
};

/** Từ vựng hôm nay: chọn cố định theo ngày từ kho từ vựng thật của hệ thống. */
export const WordOfDayCard: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-word-of-day-pool'],
    queryFn: () => exploreWordsApi({ size: 60 }),
    staleTime: 60 * 60 * 1000,
  });
  const saveWordsToDeck = useDeckStore((s) => s.saveWordsToDeck);
  const isWordSavedInDeck = useDeckStore((s) => s.isWordSavedInDeck);
  const [speaking, setSpeaking] = useState(false);

  const word = useMemo(() => {
    const items = (data?.items ?? []).filter((w) => w.word && w.definitionVi);
    return items.length > 0 ? items[dayIndex() % items.length] : null;
  }, [data]);

  if (isLoading) {
    return (
      <View style={[st.card, st.center]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }
  // Không có dữ liệu thật thì ẩn hẳn thẻ, không hiển thị từ mẫu
  if (isError || !word) return null;

  const saved = isWordSavedInDeck(MY_DECK_ID, word.id);
  const example = word.examples?.find((e) => e.sentenceEn);

  const handleSpeak = () => {
    setSpeaking(true);
    speakText(word.word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleSave = () => {
    if (saved) return;
    saveWordsToDeck(MY_DECK_ID, [
      {
        word_id: word.id,
        word: word.word,
        phonetic: word.ipaUs,
        pos: word.partOfSpeech,
        meaning_vi: word.definitionVi,
        examples: example ? { easy: example.sentenceEn, medium: example.sentenceVi ?? '', hard: '' } : undefined,
      },
    ]);
  };

  return (
    <View style={st.card}>
      <View style={st.topRow}>
        <Text style={st.tag}>Từ vựng hôm nay</Text>
        {word.cefrLevel ? <Text style={st.level}>{word.cefrLevel}</Text> : null}
      </View>

      <View style={st.wordRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.word}>{word.word}</Text>
          <Text style={st.phonetic}>
            {[word.ipaUs, word.partOfSpeech].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Pressable onPress={handleSpeak} style={[st.iconBtn, speaking && st.iconBtnActive]} accessibilityLabel="Nghe phát âm">
          <Volume2 size={18} color={speaking ? '#FFFFFF' : colors.primary} />
        </Pressable>
        <Pressable onPress={handleSave} style={st.iconBtn} accessibilityLabel={saved ? 'Đã lưu' : 'Lưu vào bộ thẻ'}>
          {saved ? <BookmarkCheck size={18} color={colors.success} /> : <Bookmark size={18} color={colors.primary} />}
        </Pressable>
      </View>

      <Text style={st.meaning}>{word.definitionVi}</Text>
      {example ? (
        <View style={st.exampleBox}>
          <Text style={st.example}>{example.sentenceEn}</Text>
          {example.sentenceVi ? <Text style={st.exampleVi}>{example.sentenceVi}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const st = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  level: { fontSize: 12, fontWeight: '700', color: colors.textSoft, backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontSize: 22, fontWeight: '800', color: colors.text },
  phonetic: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: colors.primary },
  meaning: { fontSize: 15, fontWeight: '600', color: colors.text },
  exampleBox: { backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12, gap: 4 },
  example: { fontSize: 13, color: colors.text, fontStyle: 'italic' },
  exampleVi: { fontSize: 12, color: colors.textSoft },
});
