import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ds, dsFont } from '@/src/theme/ds';

interface MicLevelWaveformProps {
  /** Đang ghi âm. */
  recording: boolean;
  /** Âm lượng micro 0…1 (useMicLevel); null khi không đo được. */
  level: number | null;
  /** Màu cột sóng. */
  color?: string;
  /** Số cột sóng. */
  bars?: number;
  /** Chiều cao tối đa của sóng (px). */
  height?: number;
  /** Hiện dòng "Đang thu âm / Chưa nghe thấy giọng" bên dưới sóng. */
  showHint?: boolean;
  /** Màu chữ gợi ý (nền tối thì truyền màu sáng). */
  hintColor?: string;
}

/** Mức coi như có giọng nói (dưới mức này là im lặng / tiếng ồn nền). */
const VOICE_THRESHOLD = 0.08;

/**
 * Sóng âm chạy theo âm lượng micro thật: cột mới nhất ở bên phải, nói to cột cao, im lặng cột thấp.
 * Giúp học viên biết micro có đang thu được giọng hay không.
 */
export const MicLevelWaveform: React.FC<MicLevelWaveformProps> = ({
  recording,
  level,
  color = ds.red,
  bars = 28,
  height = 44,
  showHint = true,
  hintColor = ds.faint,
}) => {
  const [history, setHistory] = useState<number[]>(() => Array(bars).fill(0));
  const heardVoice = useRef(false);

  // Mỗi lần đo được âm lượng mới: đẩy vào cuối, cột cũ trôi sang trái
  useEffect(() => {
    if (!recording || level == null) return;
    if (level > VOICE_THRESHOLD) heardVoice.current = true;
    setHistory((prev) => [...prev.slice(1 - bars), level]);
  }, [recording, level, bars]);

  // Bắt đầu / kết thúc ghi âm: sóng về phẳng
  useEffect(() => {
    heardVoice.current = false;
    setHistory(Array(bars).fill(0));
  }, [recording, bars]);

  const current = level ?? 0;
  const hint = !recording
    ? null
    : level == null
      ? 'Đang thu âm...'
      : current > VOICE_THRESHOLD
        ? 'Đang nghe thấy giọng bạn'
        : heardVoice.current
          ? 'Đang thu âm...'
          : 'Chưa nghe thấy giọng, hãy nói to và gần micro hơn';

  return (
    <View style={st.wrap} accessibilityLabel={hint ?? 'Sóng âm micro'}>
      <View style={[st.row, { height }]}>
        {history.map((v, i) => {
          // Cột hai đầu thấp hơn một chút cho mềm
          const edge = Math.min(i, history.length - 1 - i);
          const taper = edge < 3 ? 0.55 + edge * 0.15 : 1;
          const h = recording ? 4 + Math.min(1, v * taper) * (height - 4) : 4;
          return (
            <View
              key={i}
              style={[st.bar, { height: h, backgroundColor: color, opacity: recording ? 0.45 + Math.min(0.55, v) : 0.35 }]}
            />
          );
        })}
      </View>
      {showHint && hint ? <Text style={[st.hint, { color: hintColor }]}>{hint}</Text> : null}
    </View>
  );
};

const st = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  bar: { width: 4, borderRadius: 2 },
  hint: { fontFamily: dsFont.body, fontSize: 12, color: ds.faint, textAlign: 'center' },
});
