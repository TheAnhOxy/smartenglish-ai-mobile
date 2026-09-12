import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeakOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

/**
 * Stops any ongoing speech across native and web.
 */
export const stopSpeech = async () => {
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

  await stopSpeech();

  // Tier 1: Try Expo Speech
  try {
    let hasSpoken = false;

    Speech.speak(cleanText, {
      language: options?.language || 'en-US',
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 0.9,
      onDone: () => {
        hasSpoken = true;
        options?.onDone?.();
      },
      onError: (err) => {
        console.warn('Expo Speech error, switching to audio fallback:', err);
        fallbackWebOrAudio(cleanText, options);
      },
    });

    // Web check: if Speech.speak didn't trigger callback on Web within 400ms
    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (!hasSpoken && typeof window !== 'undefined' && window.speechSynthesis && !window.speechSynthesis.speaking) {
          fallbackWebOrAudio(cleanText, options);
        }
      }, 400);
    }
  } catch (err) {
    console.warn('Speech.speak exception, falling back:', err);
    fallbackWebOrAudio(cleanText, options);
  }
};

const fallbackWebOrAudio = async (text: string, options?: SpeakOptions) => {
  // Tier 2: Web SpeechSynthesis
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.language || 'en-US';
      utterance.rate = options?.rate || 0.9;
      utterance.onend = () => options?.onDone?.();
      utterance.onerror = (e) => {
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
