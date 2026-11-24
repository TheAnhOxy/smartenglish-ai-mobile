import React, { useMemo, useState } from 'react';
import { useXmasActive } from '@/src/core/services/xmas';
import { PineBranch, SnowEdge } from '@/src/components/xmas/WinterUI';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Volume2 } from '@/src/components/ds/icons';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { Tap, feedback } from '@/src/components/ds';
import { speakText } from '@/src/core/services/speechService';
import { exploreWordsApi } from '@/src/features/flashcard-srs/data/vocabularyApi';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';
import { useAuthStore } from '@/src/core/flows/authStore';
import { normalizeCefr } from '@/src/features/onboarding/application/learnerLevel';

const MY_DECK_ID = 'deck-my-words';

const dayIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
};

/** Kho từ theo trình độ học viên; trình độ đó chưa có từ thì lấy kho chung. */
const fetchWordPool = async (level: string | null) => {
  if (level) {
    const matched = await exploreWordsApi({ cefrLevel: level, size: 60 });
    if (matched.items.some((w) => w.word && w.definitionVi)) return { ...matched, levelMatched: true };
  }
  return { ...(await exploreWordsApi({ size: 60 })), levelMatched: false };
};

/** Từ vựng hôm nay: chọn cố định theo ngày từ kho từ vựng thật, ưu tiên đúng trình độ học viên. */
export const WordOfDayCard: React.FC = () => {
  const xmas = useXmasActive();
  const learnerLevel = normalizeCefr(useAuthStore((s) => s.currentUser?.cefr_level));
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-word-of-day-pool', learnerLevel ?? 'all'],
    queryFn: () => fetchWordPool(learnerLevel),
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
        <ActivityIndicator size="small" color={ds.btn} />
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
    <View style={[st.card, xmas && { backgroundColor: 'rgba(23,36,58,0.92)', borderColor: 'rgba(103,232,249,0.4)', overflow: 'hidden' }]}>
      {xmas ? (
        <>
          <SnowEdge />
          <PineBranch size={70} flip style={{ position: 'absolute', right: -8, top: -12 }} />
        </>
      ) : null}
      <View style={st.topRow}>
        <Text style={[st.tag, xmas && { color: '#FDE68A' }]}>Từ vựng hôm nay</Text>
        {data?.levelMatched ? (
          <Text style={[st.level, st.levelMatch]}>Phù hợp trình độ của bạn</Text>
        ) : word.cefrLevel ? (
          <Text style={st.level}>{word.cefrLevel}</Text>
        ) : null}
      </View>

      <View style={st.wordRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.word}>{word.word}</Text>
          <Text style={st.phonetic}>
            {[word.ipaUs, word.partOfSpeech].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Tap onPress={handleSpeak} sound="none" style={[st.iconBtn, speaking && st.iconBtnActive]} accessibilityLabel="Nghe phát âm">
          <Volume2 size={22} color={speaking ? ds.white : ds.btn} />
        </Tap>
        <Tap
          onPress={() => {
            if (!saved) feedback.success();
            handleSave();
          }}
          sound="none"
          style={[st.iconBtn, saved && st.iconBtnSaved]}
          accessibilityLabel={saved ? 'Đã lưu' : 'Lưu vào bộ thẻ'}
        >
          {saved ? <BookmarkCheck size={22} color={ds.green} /> : <Bookmark size={22} color={ds.btn} />}
        </Tap>
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
  card: { backgroundColor: ds.card, borderRadius: dsRadius.xl, borderWidth: 1.5, borderColor: ds.line, padding: 18, gap: 10 },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.btn, textTransform: 'uppercase', letterSpacing: 1 },
  level: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.xs,
    color: ds.amberText,
    backgroundColor: ds.amberSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  levelMatch: { color: ds.greenText, backgroundColor: ds.greenSoft },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.xxl, color: ds.ink, letterSpacing: -0.5 },
  phonetic: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.muted, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: ds.skySoft, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: ds.btn },
  iconBtnSaved: { backgroundColor: ds.greenSoft },
  meaning: { fontFamily: dsFont.semibold, fontSize: dsSize.base, color: ds.ink },
  exampleBox: { backgroundColor: ds.bg, borderRadius: dsRadius.sm, borderLeftWidth: 3, borderLeftColor: ds.sky, padding: 12, gap: 4 },
  example: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.ink, fontStyle: 'italic' },
  exampleVi: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
});
