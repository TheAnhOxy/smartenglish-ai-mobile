import { Platform } from 'react-native';

const STORAGE_PREFIX = 'se_trans_';
const memoryStore: Record<string, string> = {};

let mmkvInstance: any = null;
try {
  const { createMMKV, MMKV } = require('react-native-mmkv');
  if (typeof createMMKV === 'function') {
    mmkvInstance = createMMKV();
  } else if (typeof MMKV === 'function') {
    mmkvInstance = new MMKV();
  }
} catch (_) {}

function getStorageItem(key: string): string | null {
  try {
    if (mmkvInstance) {
      return mmkvInstance.getString(key) || null;
    }
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (_) {}
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
      return;
    }
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (_) {}
  memoryStore[key] = value;
}

export function getCachedTranslation(questionId: string | number): Record<string, string> | null {
  if (!questionId) return null;
  const raw = getStorageItem(`${STORAGE_PREFIX}${questionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function saveCachedTranslation(questionId: string | number, data: Record<string, string>): void {
  if (!questionId || !data) return;
  setStorageItem(`${STORAGE_PREFIX}${questionId}`, JSON.stringify(data));
}

/**
 * Single text translation using Google Translate endpoint with fallback.
 */
export async function translateSingle(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // 1. Google Translate with client=dict-chrome-ex (high reliability, no key)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=vi&dt=t&q=${encodeURIComponent(trimmed)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item?.[0] || '').join('');
        if (translated.trim()) return translated.trim();
      }
    }
  } catch (_) {}

  // 2. Fallback: Google Translate client=gtx
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(trimmed)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item?.[0] || '').join('');
        if (translated.trim()) return translated.trim();
      }
    }
  } catch (_) {}

  // 3. Fallback: MyMemory Free API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|vi`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (_) {}

  return trimmed;
}

export interface OptionToTranslate {
  key: string;
  label?: string;
  translationVi?: string;
}

/**
 * Batch-translates a question and all its options in a single efficient HTTP request,
 * parses tagged sections, and caches the result.
 */
export async function translateQuestionAndOptions(
  questionId: string | number,
  questionText: string,
  options: OptionToTranslate[]
): Promise<Record<string, string>> {
  // Check cache first
  const cached = getCachedTranslation(questionId);
  if (cached && Object.keys(cached).length > 0) {
    return cached;
  }

  const result: Record<string, string> = {};

  // Seed with DB translations if available
  options.forEach((opt) => {
    if (opt.translationVi) {
      result[opt.key] = opt.translationVi;
    }
  });

  // Prepare tagged batch text
  const taggedLines: string[] = [];
  if (questionText?.trim()) {
    taggedLines.push(`[Q] ${questionText.trim()}`);
  }

  options.forEach((opt) => {
    if (!result[opt.key] && opt.label?.trim()) {
      taggedLines.push(`[${opt.key}] ${opt.label.trim()}`);
    }
  });

  if (taggedLines.length === 0) {
    return result;
  }

  const batchText = taggedLines.join('\n');
  const translatedBatch = await translateSingle(batchText);

  // Parse lines back
  const lines = translatedBatch.split('\n');
  let currentKey: string | null = null;
  let currentBuffer: string[] = [];

  const flushBuffer = () => {
    if (currentKey) {
      const val = currentBuffer.join('\n').trim();
      if (currentKey === 'Q') {
        result.question = val;
      } else {
        result[currentKey] = val;
      }
    }
    currentBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^\[([A-Z]|Q)\]\s*(.*)$/i);
    if (match) {
      flushBuffer();
      currentKey = match[1].toUpperCase();
      if (match[2]) {
        currentBuffer.push(match[2].trim());
      }
    } else {
      currentBuffer.push(line);
    }
  }
  flushBuffer();

  // If question was not parsed properly via tag (edge case), translate question directly
  if (!result.question && questionText?.trim()) {
    result.question = await translateSingle(questionText);
  }

  // If any option was not parsed, translate individually
  for (const opt of options) {
    if (!result[opt.key] && opt.label?.trim()) {
      result[opt.key] = await translateSingle(opt.label);
    }
  }

  saveCachedTranslation(questionId, result);
  return result;
}
