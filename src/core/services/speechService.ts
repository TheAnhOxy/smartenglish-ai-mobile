import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeakOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

let activeWebAudio: HTMLAudioElement | null = null;
let activeSpeechSession = 0;

export const stopAllAudio = async () => {
  if (activeWebAudio) {
    try {
      activeWebAudio.pause();
      activeWebAudio.currentTime = 0;
      activeWebAudio.removeAttribute('src');
      activeWebAudio.load();
    } catch (_) {}
    activeWebAudio = null;
  }
  await stopSpeech();
};

export const createManagedWebAudio = (url: string): HTMLAudioElement => {
  void stopAllAudio();
  const audio = new Audio(url);
  activeWebAudio = audio;
  const release = () => {
    if (activeWebAudio === audio) activeWebAudio = null;
  };
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  return audio;
};

/**
 * Stops any ongoing speech across native and web.
 */
export const stopSpeech = async () => {
  activeSpeechSession += 1;
  try {
    await Speech.stop();
  } catch (e) {
    // Ignore cleanup error
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore cleanup error
    }
  }
};

/**
 * Hybrid Speech Service:
 * 1. Native Expo Speech API
 * 2. Web SpeechSynthesis API (for Expo Web)
 */
export const speakText = async (text: string, options?: SpeakOptions) => {
  if (!text || text.trim() === '') return;
  const cleanText = text.trim();

  await stopAllAudio();
  const sessionId = ++activeSpeechSession;

  // Tier 1: Try Expo Speech
  try {
    let hasSpoken = false;

    Speech.speak(cleanText, {
      language: options?.language || 'en-US',
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 0.9,
      onDone: () => {
        if (sessionId !== activeSpeechSession) return;
        hasSpoken = true;
        options?.onDone?.();
      },
      onError: (err) => {
        if (sessionId !== activeSpeechSession) return;
        console.warn('Expo Speech error, switching to audio fallback:', err);
        fallbackWebOrAudio(cleanText, options, sessionId);
      },
    });

    // Web check: if Speech.speak didn't trigger callback on Web within 400ms
    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (sessionId === activeSpeechSession && !hasSpoken && typeof window !== 'undefined' && window.speechSynthesis && !window.speechSynthesis.speaking) {
          fallbackWebOrAudio(cleanText, options, sessionId);
        }
      }, 400);
    }
  } catch (err) {
    console.warn('Speech.speak exception, falling back:', err);
    fallbackWebOrAudio(cleanText, options, sessionId);
  }
};

const fallbackWebOrAudio = async (text: string, options: SpeakOptions | undefined, sessionId: number) => {
  if (sessionId !== activeSpeechSession) return;
  // Tier 2: Web SpeechSynthesis
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.language || 'en-US';
      utterance.rate = options?.rate || 0.9;
      utterance.onend = () => {
        if (sessionId === activeSpeechSession) options?.onDone?.();
      };
      utterance.onerror = (e) => {
        if (sessionId !== activeSpeechSession) return;
        console.warn('Web SpeechSynthesis error:', e);
        options?.onError?.(e);
      };
      window.speechSynthesis.speak(utterance);
      return;
    } catch (e) {
      console.warn('Web SpeechSynthesis failed:', e);
    }
  }

  options?.onError?.(new Error('Speech playback is unavailable on this device.'));
};
