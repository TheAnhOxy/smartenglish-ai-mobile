import { Platform } from 'react-native';

export interface SavedPracticeSession {
  examId: number;
  examTitle: string;
  currentIndex: number;
  questionNumber: number;
  totalQuestions: number;
  answers: Record<string, string>;
  revealedQuestions: Record<string, boolean>;
  bookmarkedIds: string[];
  updatedAt: number;
  isCompleted: boolean;
}

const STORAGE_PREFIX = 'se_practice_session_';

// In-memory fallback store
const memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (_) {}
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (_) {}
  memoryStore[key] = value;
}

function removeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (_) {}
  delete memoryStore[key];
}

/**
 * Save in-progress practice session
 */
export function savePracticeProgress(session: SavedPracticeSession): void {
  if (!session.examId) return;
  const key = `${STORAGE_PREFIX}${session.examId}`;
  setStorageItem(key, JSON.stringify(session));
}

/**
 * Get in-progress practice session for an exam
 */
export function getPracticeProgress(examId: number): SavedPracticeSession | null {
  if (!examId) return null;
  const key = `${STORAGE_PREFIX}${examId}`;
  const raw = getStorageItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Clear in-progress practice session for an exam
 */
export function clearPracticeProgress(examId: number): void {
  if (!examId) return;
  const key = `${STORAGE_PREFIX}${examId}`;
  removeStorageItem(key);
}

/**
 * Get all active in-progress practice sessions
 */
export function getAllSavedPracticeSessions(): Record<number, SavedPracticeSession> {
  const result: Record<number, SavedPracticeSession> = {};
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            try {
              const session = JSON.parse(raw);
              if (session?.examId && !session.isCompleted) {
                result[session.examId] = session;
              }
            } catch (_) {}
          }
        }
      }
    }
  } catch (_) {}

  Object.keys(memoryStore).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      try {
        const session = JSON.parse(memoryStore[key]);
        if (session?.examId && !session.isCompleted) {
          result[session.examId] = session;
        }
      } catch (_) {}
    }
  });

  return result;
}
