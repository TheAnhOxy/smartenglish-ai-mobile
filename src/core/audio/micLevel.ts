import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RecordingPresets, useAudioRecorderState, type AudioRecorder } from 'expo-audio';

/** Preset ghi âm có bật đo âm lượng để vẽ sóng theo giọng nói (iOS/Android). */
export const METERED_RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** dB của micro (-160…0) → 0…1. Giọng nói thường khoảng -40…-5 dB; dưới -50 dB coi như im lặng. */
export const meteringToLevel = (db: number | null | undefined): number => {
  if (typeof db !== 'number' || !Number.isFinite(db)) return 0;
  return Math.max(0, Math.min(1, (db + 50) / 45));
};

/** Độ lớn RMS của khung sóng (byte 0…255, 128 = im lặng) → 0…1. */
export const rmsToLevel = (samples: ArrayLike<number>): number => {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = (samples[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / samples.length);
  // Giọng nói gần micro thường cho RMS 0.02…0.3: khuếch đại rồi kẹp về 0…1
  return Math.max(0, Math.min(1, (rms - 0.01) * 5));
};

type AudioContextCtor = new () => AudioContext;

/** Web: đo âm lượng của luồng micro bằng Web Audio (AnalyserNode). null khi không có luồng. */
export const useWebStreamLevel = (stream: MediaStream | null, intervalMs = 70): number | null => {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !stream || typeof window === 'undefined') {
      setLevel(null);
      return;
    }
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    const Ctor = w.AudioContext || w.webkitAudioContext;
    if (!Ctor) return;

    let ctx: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      setLevel(0);
      timer = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        setLevel(rmsToLevel(buf));
      }, intervalMs);
    } catch {
      setLevel(null);
    }
    return () => {
      if (timer) clearInterval(timer);
      void ctx?.close().catch(() => undefined);
    };
  }, [stream, intervalMs]);

  return level;
};

/**
 * Âm lượng micro 0…1 khi đang ghi âm: iOS/Android đọc metering của expo-audio
 * (recorder phải tạo với METERED_RECORDING_OPTIONS), web đo luồng getUserMedia.
 * null khi không ghi hoặc không đo được.
 */
export const useMicLevel = (recorder: AudioRecorder, recording: boolean, webStream: MediaStream | null): number | null => {
  const state = useAudioRecorderState(recorder, 80);
  const webLevel = useWebStreamLevel(recording ? webStream : null);
  if (!recording) return null;
  if (Platform.OS === 'web') return webLevel;
  return meteringToLevel(state.metering);
};
