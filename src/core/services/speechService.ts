import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { assignVoices, parseDialogue, type SpeakerVoice, type VoiceInfo } from './dialogueScript';

export interface SpeakOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

let activeWebAudio: HTMLAudioElement | null = null;
let activeSpeechSession = 0;
let activeUtterance: SpeechSynthesisUtterance | null = null;

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

// Giọng đọc tự nhiên nhất có trên máy (ưu tiên bản Enhanced/Premium/Neural), chọn một lần rồi dùng lại
let naturalVoice: { id?: string; webVoice?: SpeechSynthesisVoice } | null = null;
const NATURAL_HINTS = /(premium|enhanced|neural|natural|siri|google us english|samantha|ava|zoe|allison|network)/i;
const ROBOTIC_HINTS = /(compact|eloquence|espeak|fred|albert|zarvox|bad news|bells|boing|bubbles|cellos|trinoids|whisper|jester|organ|superstar|wobble|grandpa|grandma|rocko|shelley|flo|reed|sandy|eddy)/i;

const scoreVoice = (v: { name?: string; identifier?: string; language?: string; quality?: string }) => {
  const label = `${v.name ?? ''} ${v.identifier ?? ''}`;
  if (ROBOTIC_HINTS.test(label)) return -10;
  let s = 0;
  if (/^en[-_]US/i.test(v.language ?? '')) s += 3;
  else if (/^en/i.test(v.language ?? '')) s += 1;
  if (v.quality === 'Enhanced') s += 4;
  if (NATURAL_HINTS.test(label)) s += 3;
  if (/network/i.test(label)) s += 1;
  return s;
};

const pickNaturalVoice = async () => {
  if (naturalVoice) return naturalVoice;
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.speechSynthesis) return (naturalVoice = {});
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise<void>((resolve) => {
          window.speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
          setTimeout(resolve, 1000);
        });
        voices = window.speechSynthesis.getVoices();
      }
      const best = voices
        .filter((v) => /^en/i.test(v.lang))
        .sort((a, b) => scoreVoice({ name: a.name, language: a.lang }) - scoreVoice({ name: b.name, language: b.lang }))
        .pop();
      return (naturalVoice = { webVoice: best });
    }
    const voices = await Speech.getAvailableVoicesAsync();
    const best = voices
      .filter((v) => /^en/i.test(v.language))
      .sort((a, b) => scoreVoice(a) - scoreVoice(b))
      .pop();
    return (naturalVoice = { id: best && scoreVoice(best) > 0 ? best.identifier : undefined });
  } catch {
    return (naturalVoice = {});
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

  const language = options?.language || 'en-US';
  const voice = /^en/i.test(language) ? await pickNaturalVoice() : {};
  if (sessionId !== activeSpeechSession) return;

  // Web: đọc trực tiếp bằng giọng tự nhiên đã chọn
  if (Platform.OS === 'web' && voice.webVoice && typeof window !== 'undefined' && window.speechSynthesis) {
    fallbackWebOrAudio(cleanText, options, sessionId, voice.webVoice);
    return;
  }

  // Tier 1: Try Expo Speech
  try {
    let hasSpoken = false;

    Speech.speak(cleanText, {
      language,
      voice: voice.id,
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 0.95,
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

const loadVoices = async (): Promise<VoiceInfo[]> => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const read = () =>
      window.speechSynthesis.getVoices().map((v) => ({ identifier: v.voiceURI, name: v.name, language: v.lang }));
    if (read().length > 0) return read();
    // Trình duyệt nạp danh sách giọng bất đồng bộ
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 1000);
    });
    return read();
  }
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.map((v) => ({ identifier: v.identifier, name: v.name, language: v.language }));
  } catch {
    return [];
  }
};

const speakLine = (text: string, voice: SpeakerVoice, rate: number, onDone: () => void, onError: (e: unknown) => void) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = voice.pitch;
    const match = voice.voice ? window.speechSynthesis.getVoices().find((v) => v.voiceURI === voice.voice) : undefined;
    if (match) {
      utterance.voice = match;
      utterance.lang = match.lang;
    }
    utterance.onend = onDone;
    utterance.onerror = onError;
    // Chrome bỏ sự kiện onend nếu utterance bị thu gom bộ nhớ: giữ tham chiếu tới khi đọc xong
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return;
  }
  Speech.speak(text, { language: 'en-US', voice: voice.voice, pitch: voice.pitch, rate, onDone, onError });
};

/**
 * Đọc hội thoại nhiều người: mỗi người nói một giọng riêng (nam/nữ), lần lượt từng lượt.
 * Dừng bằng stopAllAudio() như mọi âm thanh khác.
 */
export const speakDialogue = async (script: string, options?: SpeakOptions) => {
  const lines = parseDialogue(script);
  if (lines.length === 0) return;
  await stopAllAudio();
  const sessionId = ++activeSpeechSession;
  const voices = assignVoices(lines, await loadVoices());
  if (sessionId !== activeSpeechSession) return;
  const rate = options?.rate || 0.9;
  let index = 0;
  const next = () => {
    if (sessionId !== activeSpeechSession) return;
    if (index >= lines.length) {
      options?.onDone?.();
      return;
    }
    const line = lines[index++];
    speakLine(
      line.text,
      voices[line.speaker],
      rate,
      () => setTimeout(next, 250),
      (e) => {
        if (sessionId !== activeSpeechSession) return;
        options?.onError?.(e);
      },
    );
  };
  next();
};

const fallbackWebOrAudio = async (
  text: string,
  options: SpeakOptions | undefined,
  sessionId: number,
  webVoice?: SpeechSynthesisVoice
) => {
  if (sessionId !== activeSpeechSession) return;
  // Tier 2: Web SpeechSynthesis
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.language || 'en-US';
      utterance.rate = options?.rate || 0.95;
      if (webVoice) {
        utterance.voice = webVoice;
        utterance.lang = webVoice.lang;
      }
      activeUtterance = utterance;
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
