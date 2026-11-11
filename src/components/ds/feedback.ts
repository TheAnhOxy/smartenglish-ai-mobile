// Phản hồi chạm: âm thanh UI ngắn (assets/sounds) + rung nhẹ (expo-haptics).
// Mọi lỗi đều bị nuốt — phản hồi chỉ là trang trí, không được làm hỏng luồng chức năng.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  tap: require('../../../assets/sounds/tap.wav'),
  select: require('../../../assets/sounds/select.wav'),
  flip: require('../../../assets/sounds/flip.wav'),
  correct: require('../../../assets/sounds/correct.wav'),
  wrong: require('../../../assets/sounds/wrong.wav'),
  rateAgain: require('../../../assets/sounds/rate-again.wav'),
  rateGood: require('../../../assets/sounds/rate-good.wav'),
  recStart: require('../../../assets/sounds/rec-start.wav'),
  recStop: require('../../../assets/sounds/rec-stop.wav'),
  success: require('../../../assets/sounds/success.wav'),
  fanfare: require('../../../assets/sounds/fanfare.wav'),
} as const;

export type UiSound = keyof typeof SOURCES;

const players: Partial<Record<UiSound, AudioPlayer>> = {};
let enabled = true;

export const setUiSoundEnabled = (value: boolean) => {
  enabled = value;
};

export const playSound = (name: UiSound, volume = 0.6) => {
  if (!enabled) return;
  try {
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      players[name] = player;
    }
    player.volume = volume;
    void player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // bỏ qua
  }
};

type HapticKind = 'light' | 'medium' | 'heavy' | 'select' | 'success' | 'warning' | 'error';

export const haptic = (kind: HapticKind = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    switch (kind) {
      case 'select':
        void Haptics.selectionAsync().catch(() => undefined);
        return;
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        return;
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
        return;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        return;
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        return;
      case 'heavy':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
        return;
      default:
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  } catch {
    // bỏ qua
  }
};

/** Âm + rung trong một lần gọi */
export const feedback = {
  tap: () => {
    haptic('light');
    playSound('tap', 0.45);
  },
  select: () => {
    haptic('select');
    playSound('select', 0.5);
  },
  flip: () => {
    haptic('light');
    playSound('flip', 0.5);
  },
  correct: () => {
    haptic('success');
    playSound('correct');
  },
  wrong: () => {
    haptic('error');
    playSound('wrong', 0.5);
  },
  rate: (good: boolean) => {
    haptic(good ? 'success' : 'warning');
    playSound(good ? 'rateGood' : 'rateAgain', 0.55);
  },
  success: () => {
    haptic('success');
    playSound('success');
  },
  fanfare: () => {
    haptic('heavy');
    playSound('fanfare', 0.7);
  },
};
