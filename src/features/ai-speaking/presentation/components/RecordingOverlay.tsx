import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Mic, Square, X } from 'lucide-react-native';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';

interface RecordingOverlayProps {
  /** Đang ghi âm. */
  listening: boolean;
  /** Đã dừng, đang chuyển giọng nói thành chữ. */
  busy: boolean;
  /** Chữ nhận dạng tạm thời (web có, iOS/Android trống tới khi xong). */
  liveText?: string;
  /** Âm lượng micro 0…1 (đo thật trên iOS/Android); null → hiệu ứng nhịp mặc định (web). */
  level?: number | null;
  /** Tự dừng sau số giây này (khớp giới hạn của useTutorVoice). */
  maxSeconds?: number;
  onStop: () => void;
  onCancel: () => void;
}

const formatTime = (sec: number) => `0:${String(Math.max(0, sec)).padStart(2, '0')}`;

/** Vòng sóng lan ra từ nút micro. */
const PulseRing: React.FC<{ delay: number; active: boolean }> = ({ delay, active }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    if (active) {
      p.value = 0;
      p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
    } else {
      cancelAnimation(p);
      p.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(p);
  }, [active, delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: active ? 0.55 * (1 - p.value) : 0,
    transform: [{ scale: 1 + p.value * 0.9 }],
  }));
  return <Animated.View pointerEvents="none" style={[s.ring, style]} />;
};

/** Độ cao tương đối từng cột: giữa cao, hai bên thấp — giống sóng giọng nói. */
const BAR_WEIGHTS = [0.35, 0.5, 0.68, 0.82, 0.95, 1, 0.92, 0.8, 0.66, 0.5, 0.35];

/** Một cột sóng âm: theo âm lượng thật nếu có (`level`), không thì nhảy nhịp đều. */
const WaveBar: React.FC<{ index: number; active: boolean; level: number | null }> = ({ index, active, level }) => {
  const h = useSharedValue(0.1);
  const driven = active && level != null;

  // Chế độ đo thật: cột cao theo giọng to/nhỏ, dao động nhẹ để không cứng
  useEffect(() => {
    if (!driven || level == null) return;
    const jitter = 0.75 + Math.random() * 0.5;
    const target = 0.06 + Math.min(1, level * BAR_WEIGHTS[index] * jitter * 1.15);
    h.value = withTiming(target, { duration: 90, easing: Easing.out(Easing.quad) });
  }, [driven, level, index, h]);

  // Không đo được (web) → nhịp mặc định
  useEffect(() => {
    if (driven) return;
    if (active) {
      const up = 280 + ((index * 97) % 220);
      h.value = withRepeat(
        withSequence(
          withTiming(0.35 + ((index * 37) % 60) / 100, { duration: up, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: up, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(h);
      h.value = withTiming(0.1, { duration: 200 });
    }
    return () => cancelAnimation(h);
  }, [active, driven, h, index]);

  const style = useAnimatedStyle(() => ({ height: 6 + h.value * 46 }));
  return <Animated.View style={[s.waveBar, style]} />;
};

/** Vòng sáng quanh micro phồng theo âm lượng thật. */
const LevelGlow: React.FC<{ level: number }> = ({ level }) => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(level, { duration: 110, easing: Easing.out(Easing.quad) });
  }, [level, v]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.18 + v.value * 0.4,
    transform: [{ scale: 1.05 + v.value * 0.75 }],
  }));
  return <Animated.View pointerEvents="none" style={[s.ring, style]} />;
};

const BAR_COUNT = 11;

/**
 * Màn ghi âm giữa màn hình khi bấm micro ở Hội thoại AI:
 * micro lớn có vòng sóng, sóng âm, đồng hồ đếm, nút Xong / Huỷ; sau khi dừng hiện trạng thái nhận dạng.
 */
export const RecordingOverlay: React.FC<RecordingOverlayProps> = ({
  listening,
  busy,
  liveText,
  level = null,
  maxSeconds = 20,
  onStop,
  onCancel,
}) => {
  const visible = listening || busy;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!listening) return;
    setElapsed(0);
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(timer);
  }, [listening]);

  const remaining = Math.max(0, maxSeconds - elapsed);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.title}>{busy ? 'Đang nhận dạng giọng nói…' : 'Đang nghe bạn nói'}</Text>
          <Text style={s.sub}>
            {busy ? 'AI đang chuyển lời bạn nói thành chữ' : 'Nói câu trả lời bằng tiếng Anh, xong thì bấm “Xong”'}
          </Text>

          <View style={s.micArea}>
            {listening && level != null ? (
              <LevelGlow level={level} />
            ) : (
              <>
                <PulseRing delay={0} active={listening} />
                <PulseRing delay={600} active={listening} />
                <PulseRing delay={1200} active={listening} />
              </>
            )}
            <Pressable
              onPress={listening ? onStop : undefined}
              disabled={!listening}
              accessibilityRole="button"
              accessibilityLabel="Dừng ghi âm"
              style={[s.micBtn, busy && s.micBtnBusy]}
            >
              {busy ? <ActivityIndicator color={ds.white} size="large" /> : <Mic size={44} color={ds.white} />}
            </Pressable>
          </View>

          <View style={s.wave}>
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <WaveBar key={i} index={i} active={listening} level={level} />
            ))}
          </View>

          {listening ? (
            <Text style={[s.timer, remaining <= 5 && { color: ds.red }]}>
              {formatTime(elapsed)} <Text style={s.timerMax}>/ {formatTime(maxSeconds)}</Text>
            </Text>
          ) : null}

          {liveText ? (
            <Text style={s.live} numberOfLines={3}>
              “{liveText}”
            </Text>
          ) : null}

          {listening ? (
            <View style={s.actions}>
              <Pressable onPress={onCancel} style={s.cancelBtn} accessibilityLabel="Huỷ ghi âm">
                <X size={18} color={ds.inkSoft} />
                <Text style={s.cancelText}>Huỷ</Text>
              </Pressable>
              <Pressable onPress={onStop} style={s.doneBtn} accessibilityLabel="Xong, dừng ghi âm">
                <Square size={14} color={ds.white} fill={ds.white} />
                <Text style={s.doneText}>Xong</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const MIC = 108;

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,42,68,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: ds.card,
    borderRadius: dsRadius.xl,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  title: { fontFamily: dsFont.display, fontSize: dsSize.lg, color: ds.ink, textAlign: 'center' },
  sub: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  micArea: { width: MIC * 2, height: MIC * 2, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ring: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC / 2, backgroundColor: ds.red },
  micBtn: {
    width: MIC,
    height: MIC,
    borderRadius: MIC / 2,
    backgroundColor: ds.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnBusy: { backgroundColor: ds.btn },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 52 },
  waveBar: { width: 5, borderRadius: 3, backgroundColor: ds.red },
  timer: { fontFamily: dsFont.display, fontSize: dsSize.xl, color: ds.ink, marginTop: 6 },
  timerMax: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.faint },
  live: { fontFamily: dsFont.medium, fontSize: dsSize.base, color: ds.inkSoft, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: dsRadius.full,
    backgroundColor: ds.bg,
    borderWidth: 1,
    borderColor: ds.line,
  },
  cancelText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.inkSoft },
  doneBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: dsRadius.full,
    backgroundColor: ds.red,
  },
  doneText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
});
