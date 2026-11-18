import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createManagedWebAudio, speakDialogue, stopAllAudio } from '@/src/core/services/speechService';
import { parseDialogue } from '@/src/core/services/dialogueScript';

export type PlaybackSource = 'file' | 'tts' | 'none';

export const playbackSourceOf = (audioUrl: string, transcript: string): PlaybackSource => {
  if (audioUrl.trim()) return 'file';
  if (parseDialogue(transcript).length > 0) return 'tts';
  return 'none';
};

interface PlaybackOptions {
  /** Tự phát mỗi khi nội dung đổi (vào câu mới); đổi câu hoặc rời màn thì tự dừng. */
  autoPlay?: boolean;
}

/**
 * Phát bài nghe: ưu tiên file audio thật; bài chưa có file thì đọc lời thoại bằng giọng máy,
 * mỗi người nói một giọng riêng. Tốc độ áp dụng cho cả hai nguồn.
 */
export const useListeningPlayback = (audioUrl: string, transcript: string, rate = 1, options: PlaybackOptions = {}) => {
  const source = playbackSourceOf(audioUrl, transcript);
  const isWeb = Platform.OS === 'web';
  const nativePlayer = useAudioPlayer(source === 'file' && !isWeb ? audioUrl : null);
  const nativeStatus = useAudioPlayerStatus(nativePlayer);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const [webPlaying, setWebPlaying] = useState(false);
  const [webTime, setWebTime] = useState(0);
  const [webDuration, setWebDuration] = useState(0);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  /** Trình phát HTML5 trên web, tạo khi cần và theo dõi vị trí để vẽ thanh tua. */
  const ensureWebAudio = useCallback((): HTMLAudioElement => {
    if (webAudioRef.current) return webAudioRef.current;
    const audio = createManagedWebAudio(audioUrl);
    webAudioRef.current = audio;
    audio.onloadedmetadata = () => setWebDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.ontimeupdate = () => setWebTime(audio.currentTime);
    audio.onended = () => setWebPlaying(false);
    audio.onerror = () => setWebPlaying(false);
    return audio;
  }, [audioUrl]);

  const stop = useCallback(() => {
    void stopAllAudio();
    setTtsPlaying(false);
    try {
      nativePlayer.pause();
    } catch (_) {}
    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current = null;
    }
    setWebPlaying(false);
    setWebTime(0);
  }, [nativePlayer]);

  useEffect(() => stop, [stop, audioUrl, transcript]);

  // Web: nạp sẵn thông tin file để thanh tua biết thời lượng trước khi bấm phát
  useEffect(() => {
    if (source === 'file' && isWeb) ensureWebAudio().preload = 'metadata';
  }, [source, isWeb, ensureWebAudio]);
  useFocusEffect(useCallback(() => stop, [stop]));

  useEffect(() => {
    try {
      nativePlayer.setPlaybackRate(rate);
    } catch (_) {}
    if (webAudioRef.current) webAudioRef.current.playbackRate = rate;
  }, [nativePlayer, rate]);

  const play = useCallback(() => {
    if (source === 'file') {
      if (isWeb) {
        const audio = ensureWebAudio();
        audio.playbackRate = rate;
        void audio.play().then(() => setWebPlaying(true)).catch(() => setWebPlaying(false));
      } else {
        if (nativeStatus.didJustFinish || (nativeStatus.duration > 0 && nativeStatus.currentTime >= nativeStatus.duration)) {
          void nativePlayer.seekTo(0);
        }
        nativePlayer.play();
      }
      return;
    }
    if (source === 'tts') {
      setTtsPlaying(true);
      void speakDialogue(transcript, {
        rate: 0.9 * rate,
        onDone: () => setTtsPlaying(false),
        onError: () => setTtsPlaying(false),
      });
    }
  }, [source, isWeb, ensureWebAudio, rate, nativePlayer, nativeStatus, transcript]);

  const pause = useCallback(() => {
    if (source === 'file') {
      if (isWeb) {
        webAudioRef.current?.pause();
        setWebPlaying(false);
      } else {
        nativePlayer.pause();
      }
      return;
    }
    // Giọng máy không tạm dừng giữa chừng được: dừng hẳn, lần sau đọc lại từ đầu.
    stop();
  }, [source, isWeb, nativePlayer, stop]);

  // Tự phát khi vào nội dung mới; dùng ref để không phát lại mỗi lần trạng thái trình phát đổi
  const playRef = useRef(play);
  playRef.current = play;
  useEffect(() => {
    if (!options.autoPlay || source === 'none') return;
    const timer = setTimeout(() => playRef.current(), 300);
    return () => clearTimeout(timer);
  }, [options.autoPlay, source, audioUrl, transcript]);

  const isPlaying = source === 'file' ? (isWeb ? webPlaying : nativeStatus.playing) : ttsPlaying;
  // Vị trí và thời lượng (giây) chỉ có khi phát file; giọng máy không tua được
  const position = source === 'file' ? (isWeb ? webTime : nativeStatus.currentTime) : 0;
  const duration = source === 'file' ? (isWeb ? webDuration : nativeStatus.duration) : 0;

  const seek = useCallback(
    (seconds: number) => {
      if (source !== 'file') return;
      const max = duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
      const target = Math.max(0, Math.min(max, seconds));
      if (isWeb) {
        const audio = ensureWebAudio();
        audio.currentTime = target;
        setWebTime(target);
      } else {
        void nativePlayer.seekTo(target);
      }
    },
    [source, duration, isWeb, ensureWebAudio, nativePlayer],
  );

  return { source, isPlaying, toggle: isPlaying ? pause : play, stop, position, duration, seek };
};
