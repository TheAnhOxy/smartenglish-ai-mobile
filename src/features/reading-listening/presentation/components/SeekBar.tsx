import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';

export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface Props {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

/** Thanh tua cho bài nghe luyện tập: chạm hoặc kéo để tới vị trí, lùi/tới 5 giây. Không dùng trong chế độ thi. */
export const SeekBar: React.FC<Props> = ({ position, duration, onSeek }) => {
  const widthRef = useRef(1);
  const [dragPos, setDragPos] = useState<number | null>(null);
  // Vị trí vừa tua tới, giữ đến khi trình phát báo đã tới nơi để con trỏ không giật về chỗ cũ
  const [pendingPos, setPendingPos] = useState<number | null>(null);
  const shown = dragPos ?? pendingPos ?? position;
  const ratio = duration > 0 ? Math.max(0, Math.min(1, shown / duration)) : 0;

  useEffect(() => {
    if (pendingPos === null) return;
    if (Math.abs(position - pendingPos) < 1) {
      setPendingPos(null);
      return;
    }
    const timer = setTimeout(() => setPendingPos(null), 1500);
    return () => clearTimeout(timer);
  }, [position, pendingPos]);

  const at = (e: GestureResponderEvent) =>
    Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current)) * duration;

  const seekTo = (seconds: number) => {
    const target = Math.max(0, duration > 0 ? Math.min(duration, seconds) : seconds);
    setPendingPos(target);
    onSeek(target);
  };

  return (
    <View style={st.wrap}>
      <View
        style={st.hit}
        onLayout={(e) => {
          widthRef.current = Math.max(1, e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => duration > 0}
        onMoveShouldSetResponder={() => duration > 0}
        onResponderGrant={(e) => setDragPos(at(e))}
        onResponderMove={(e) => setDragPos(at(e))}
        onResponderRelease={(e) => {
          seekTo(at(e));
          setDragPos(null);
        }}
        onResponderTerminate={() => setDragPos(null)}
        accessibilityRole="adjustable"
        accessibilityLabel="Thanh tua bài nghe"
        accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shown) }}
      >
        <View pointerEvents="none" style={st.track}>
          <View style={[st.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[st.thumb, { left: `${ratio * 100}%` }]} />
      </View>
      <View style={st.row}>
        <Pressable onPress={() => seekTo(shown - 5)} hitSlop={8} style={st.skip} accessibilityLabel="Lùi 5 giây">
          <Text style={st.skipText}>-5s</Text>
        </Pressable>
        <Text style={st.time}>
          {formatClock(shown)} / {formatClock(duration)}
        </Text>
        <Pressable onPress={() => seekTo(shown + 5)} hitSlop={8} style={st.skip} accessibilityLabel="Tới 5 giây">
          <Text style={st.skipText}>+5s</Text>
        </Pressable>
      </View>
    </View>
  );
};

const st = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  hit: { height: 28, justifyContent: 'center' },
  track: { height: 6, borderRadius: dsRadius.full, backgroundColor: ds.line, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: ds.sky },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: dsRadius.full,
    backgroundColor: ds.white,
    borderWidth: 3,
    borderColor: ds.sky,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: dsFont.medium, fontSize: dsSize.sm, color: ds.muted },
  skip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: dsRadius.full,
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  skipText: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.muted },
});
