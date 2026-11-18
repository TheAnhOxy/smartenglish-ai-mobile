import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioTrackQuery } from '../../application/useReadingListening';
import { useListeningPlayback } from '../../application/useListeningPlayback';
import { ArrowLeft, Headphones, Pause, Play } from '@/src/components/ds/icons';
import { Button3D, Tap, dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import { TranslatableText, TranslationPanel } from '@/src/core/components/TranslatableText';
import { SeekBar } from '../components/SeekBar';

const SPEEDS = [
  { label: '0.75x', rate: 0.75 },
  { label: '1.0x', rate: 1 },
  { label: '1.25x', rate: 1.25 },
  { label: '1.5x', rate: 1.5 },
] as const;

const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

interface Props {
  /** Nội dung thêm ở cuối màn (ví dụ banner nộp bài tập lớp). */
  footer?: React.ReactNode;
}

export const ListeningPlayerScreen: React.FC<Props> = ({ footer }) => {
  const { audioId } = useLocalSearchParams<{ audioId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const validId = audioId ? String(audioId) : '';
  const { data: track, isLoading, isError, error, refetch } = useAudioTrackQuery(validId);

  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(SPEEDS[1]);
  const [showSub, setShowSub] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [clearKey, setClearKey] = useState(0);
  // Vào bài là tự phát
  const playback = useListeningPlayback(track?.audio_url ?? '', track?.transcript ?? '', speed.rate, { autoPlay: true });

  if (isLoading) {
    return (
      <View style={[st.screen, st.center]}>
        <ActivityIndicator color={ds.sky} size="large" />
        <Text style={[dsText.bodyMuted, { marginTop: 8 }]}>Đang tải bài nghe...</Text>
      </View>
    );
  }

  if (!validId || isError || !track) {
    return (
      <View style={[st.screen, st.center, { paddingHorizontal: 24 }]}>
        <View style={[st.card, st.stateCard]}>
          <Headphones size={36} color={ds.faint} />
          <Text style={[dsText.h3, { textAlign: 'center' }]}>Không thể tải bài nghe</Text>
          <Text style={[dsText.bodyMuted, { textAlign: 'center' }]}>
            {error instanceof Error ? error.message : 'Bài nghe không tồn tại hoặc đã có lỗi xảy ra khi tải âm thanh.'}
          </Text>
          <View style={st.row}>
            <Button3D label="Quay lại" variant="light" onPress={() => router.back()} style={{ flex: 1 }} height={46} />
            {validId ? <Button3D label="Thử lại" onPress={() => refetch()} style={{ flex: 1 }} height={46} /> : null}
          </View>
        </View>
      </View>
    );
  }

  const subtitleEn = track.subtitles[0]?.text_en || track.transcript || '';
  const subtitleVi = track.subtitles[0]?.text_vi || '';
  const meta = [
    track.duration_sec > 0 ? `Thời lượng ${formatDuration(track.duration_sec)}` : null,
    playback.source === 'tts' ? 'Giọng đọc máy' : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={st.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, paddingHorizontal: 20, gap: 16 }}
      >
        <Tap onPress={() => router.back()} style={st.back} accessibilityLabel="Quay lại">
          <ArrowLeft size={22} color={ds.ink} />
        </Tap>

        <View style={{ gap: 4 }}>
          <Text style={dsText.h1}>{track.title}</Text>
          {meta ? <Text style={dsText.bodyMuted}>{meta}</Text> : null}
        </View>

        <View style={[st.card, st.subtitleCard]}>
          {!showSub ? (
            <Text style={dsText.bodyMuted}>Phụ đề đã bị ẩn</Text>
          ) : subtitleEn ? (
            <View style={{ gap: 8, width: '100%' }}>
              <TranslatableText
                text={subtitleEn}
                onSelectText={setSelectedText}
                clearKey={clearKey}
                textStyle={st.subtitleText}
              />
              {subtitleVi ? <Text style={[dsText.bodyMuted, { textAlign: 'center' }]}>{subtitleVi}</Text> : null}
            </View>
          ) : (
            <Text style={dsText.bodyMuted}>Bài nghe chưa có phụ đề</Text>
          )}
        </View>

        <TranslationPanel
          text={selectedText}
          onClose={() => {
            setSelectedText('');
            setClearKey((k) => k + 1);
          }}
        />

        <View style={[st.card, st.controls]}>
          <View style={st.row}>
            {SPEEDS.map((s) => {
              const active = speed.label === s.label;
              return (
                <Pressable key={s.label} onPress={() => setSpeed(s)} style={[st.speedChip, active && st.speedChipActive]}>
                  <Text style={[st.speedText, active && st.speedTextActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {playback.source === 'file' ? (
            <SeekBar
              position={playback.position}
              duration={playback.duration > 0 ? playback.duration : track.duration_sec}
              onSeek={playback.seek}
            />
          ) : null}

          {playback.source === 'none' ? (
            <Text style={dsText.bodyMuted}>Bài nghe này chưa có âm thanh</Text>
          ) : (
            <Tap
              onPress={playback.toggle}
              sound="none"
              accessibilityRole="button"
              accessibilityLabel={playback.isPlaying ? 'Tạm dừng' : 'Phát bài nghe'}
              style={st.playBtn}
            >
              {playback.isPlaying ? <Pause size={28} color={ds.white} /> : <Play size={28} color={ds.white} />}
            </Tap>
          )}
        </View>

        <Button3D label={showSub ? 'Ẩn phụ đề' : 'Hiện phụ đề'} variant="light" onPress={() => setShowSub(!showSub)} height={48} />

        {footer}
      </ScrollView>
    </View>
  );
};

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ds.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  back: {
    width: 40,
    height: 40,
    borderRadius: dsRadius.full,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 4,
    ...dsShadow.card,
  },
  stateCard: { padding: 24, gap: 12, alignItems: 'center', width: '100%', maxWidth: 360 },
  subtitleCard: { padding: 20, minHeight: 140, alignItems: 'center', justifyContent: 'center' },
  subtitleText: { fontFamily: dsFont.bold, fontSize: dsSize.md, lineHeight: 26, textAlign: 'center', color: ds.ink },
  controls: { padding: 18, gap: 18, alignItems: 'center' },
  speedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: dsRadius.full,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: ds.card,
  },
  speedChipActive: { backgroundColor: ds.skySoft, borderColor: ds.sky },
  speedText: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.muted },
  speedTextActive: { color: ds.btn },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: dsRadius.full,
    backgroundColor: ds.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
