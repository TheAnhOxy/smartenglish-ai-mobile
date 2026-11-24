import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { BGM_MAX_VOLUME, isQuietRoute, useBgmStore } from '@/src/core/services/backgroundMusic';

const FADE_MS = 700;
const FADE_STEPS = 14;

/**
 * Nhạc nền toàn app: phát lặp ở màn duyệt (trang chủ, lộ trình, thống kê…),
 * tự dừng (fade) khi vào màn học/luyện tập, khi app chạy nền hoặc khi tắt trong Cài đặt.
 * Đặt một lần ở layout gốc. Không render gì.
 */
export const BackgroundMusic = () => {
  const player = useAudioPlayer(require('../../../assets/audio/bgm.mp3'));
  const pathname = usePathname();
  const enabled = useBgmStore((s) => s.enabled);
  const level = useBgmStore((s) => s.volume);
  const targetVolume = BGM_MAX_VOLUME * level;
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    try {
      player.loop = true;
      player.volume = 0;
    } catch {
      // Nhạc nền chỉ để trang trí — lỗi không được làm hỏng app
    }
  }, [player]);

  const shouldPlay = enabled && appActive && !isQuietRoute(pathname);

  useEffect(() => {
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    try {
      // App xuống nền: timer JS có thể bị treo → dừng ngay, không fade
      if (!appActive) {
        player.pause();
        return;
      }
      const from = player.playing ? player.volume : 0;
      const to = shouldPlay ? targetVolume : 0;
      if (shouldPlay && !player.playing) {
        player.volume = 0;
        player.play();
      }
      let step = 0;
      fadeTimer.current = setInterval(() => {
        step += 1;
        try {
          player.volume = from + ((to - from) * step) / FADE_STEPS;
          if (step >= FADE_STEPS) {
            if (fadeTimer.current) clearInterval(fadeTimer.current);
            fadeTimer.current = null;
            if (!shouldPlay) player.pause();
          }
        } catch {
          if (fadeTimer.current) clearInterval(fadeTimer.current);
        }
      }, FADE_MS / FADE_STEPS);
    } catch {
      // bỏ qua
    }
    return () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current);
    };
  }, [shouldPlay, appActive, targetVolume, player]);

  return null;
};
