import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  User,
  Clock,
  Volume2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  ChevronUp,
  ChevronDown,
  FileText,
  Headphones,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Grid,
  RotateCcw,
  Sparkles,
  Camera,
  Languages,
} from 'lucide-react-native';
import {
  translateQuestionAndOptions,
  getCachedTranslation,
} from '../../data/translationService';
import {
  useExamAttemptQuery,
  useExamResultQuery,
  useSaveExamAnswer,
  useStartExamAttempt,
  useSubmitExamAttempt,
} from '../../application/useExamAttempt';
import { usePublishedExamDetailQuery } from '../../application/useExamCatalog';
import { AnswerKey, ExamAttemptSession, ExamQuestion, normalizeQuestion } from '../../data/examAttemptApi';
import {
  getPracticeProgress,
  savePracticeProgress,
  clearPracticeProgress,
} from '../../data/practiceSessionStorage';
import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function FullExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    examId?: string;
    attemptId?: string;
    title?: string;
    mode?: 'EXAM' | 'PRACTICE';
    wrongOnly?: string;
    sourceAttemptId?: string;
  }>();

  const isPracticeMode = params.mode === 'PRACTICE';
  const isWrongOnly = params.wrongOnly === 'true';
  const sourceAttemptId = params.sourceAttemptId ? Number(params.sourceAttemptId) : null;
  const examId = params.examId
    ? Number(params.examId)
    : (Platform.OS === 'web' && typeof window !== 'undefined' && window?.location?.pathname && !isNaN(Number(window.location.pathname.split('/').filter(Boolean).pop()))
        ? Number(window.location.pathname.split('/').filter(Boolean).pop())
        : null);

  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(
    params.attemptId ? Number(params.attemptId) : null
  );
  const [activeSession, setActiveSession] = useState<ExamAttemptSession | null>(null);

  const startAttempt = useStartExamAttempt();
  const attemptQuery = useExamAttemptQuery(activeAttemptId && activeAttemptId !== 9999 ? activeAttemptId : null);
  const examDetailQuery = usePublishedExamDetailQuery(examId);
  const sourceResultQuery = useExamResultQuery(isWrongOnly && sourceAttemptId ? sourceAttemptId : null);
  const saveAnswer = useSaveExamAnswer();
  const submitAttempt = useSubmitExamAttempt();

  // ── Lazy-sync: chỉ flush khi chuyển câu hoặc thoát, KHÔNG gọi mỗi lần chọn đáp án ──
  // Lý do: với N người dùng đồng thời, gọi PUT mỗi câu gây N×M request không cần thiết.
  // Exam mode: submitAttempt đã batch toàn bộ answers → không cần PUT trung gian.
  // Practice mode: chỉ sync khi rời khỏi câu hiện tại.
  const pendingSyncRef = useRef<{ questionId: string; answer?: AnswerKey; bookmarked?: boolean } | null>(null);
  const bookmarkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingSync = useCallback((attemptId: number | null, answers: Record<string, AnswerKey>, bookmarked: string[]) => {
    if (!attemptId || attemptId === 9999 || !pendingSyncRef.current) return;
    const { questionId } = pendingSyncRef.current;
    const selectedAnswer = answers[questionId];
    const isBookmarked = bookmarked.includes(questionId);
    saveAnswer.mutate({ attemptId, questionId, selectedAnswer, bookmarked: isBookmarked });
    pendingSyncRef.current = null;
  }, [saveAnswer]);

  // Reset exam state whenever examId or attemptId changes so exams never bleed into each other
  useEffect(() => {
    setActiveSession(null);
    setActiveAttemptId(params.attemptId ? Number(params.attemptId) : null);
    setUserAnswers({});
    setBookmarkedIds([]);
    setCurrentIndex(0);
    setRevealedQuestions({});
    setResolvedWrongIds({});
    setTimeLeft(7200);
    initializedAttemptRef.current = null;

    if (isPracticeMode && examId) {
      const saved = getPracticeProgress(examId);
      if (saved && !saved.isCompleted) {
        if (saved.answers && Object.keys(saved.answers).length > 0) {
          setUserAnswers(saved.answers as Record<string, AnswerKey>);
        }
        if (saved.revealedQuestions) {
          setRevealedQuestions(saved.revealedQuestions);
        }
        if (saved.bookmarkedIds) {
          setBookmarkedIds(saved.bookmarkedIds);
        }
        if (typeof saved.currentIndex === 'number' && saved.currentIndex >= 0) {
          setCurrentIndex(saved.currentIndex);
        }
      }
    }
  }, [examId, params.attemptId, isPracticeMode]);

  // Only exam mode creates a persisted attempt. Practice progress is stored locally.
  useEffect(() => {
    if (examId && !isPracticeMode && !isWrongOnly && (!activeAttemptId || activeSession?.examId !== examId)) {
      startAttempt.mutateAsync(examId).then((session) => {
        if (session && session.examId === examId) {
          setActiveSession(session);
          if (session.attemptId) {
            setActiveAttemptId(session.attemptId);
          }
        }
      }).catch((err) => {
        console.warn('Failed to start attempt session from backend:', err);
      });
    }
  }, [examId, isPracticeMode, isWrongOnly]);

  // Questions exclusively from real backend data (NEVER fake/mock)
  const questions: ExamQuestion[] = useMemo(() => {
    if (isWrongOnly && sourceResultQuery.data?.questions) {
      const allQ = sourceResultQuery.data.questions;
      return allQ.filter((q) => q.correctAnswer && q.selectedAnswer !== q.correctAnswer);
    }
    // Only use activeSession if it actually belongs to current examId
    if (activeSession && activeSession.examId === examId && activeSession.questions && activeSession.questions.length > 0) {
      return activeSession.questions;
    }
    if (attemptQuery.data && attemptQuery.data.examId === examId && attemptQuery.data.questions && attemptQuery.data.questions.length > 0) {
      return attemptQuery.data.questions;
    }
    if (examDetailQuery.data?.questions && examDetailQuery.data.questions.length > 0) {
      const rawQ = examDetailQuery.data.questions;
      const total = rawQ.length;
      const cat = examDetailQuery.data.category || 'TOEIC_FULL';
      const sec = examDetailQuery.data.sections || [];
      return rawQ.map((q: any, i: number) => normalizeQuestion(q, i, total, cat, sec));
    }
    return [];
  }, [isWrongOnly, sourceResultQuery.data, activeSession, attemptQuery.data, examDetailQuery.data, examId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQ = questions[currentIndex] || questions[0];

  // User state
  const [userAnswers, setUserAnswers] = useState<Record<string, AnswerKey>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Dropdown collapse state for transcript & explanation (in practice mode reveal)
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Translation state for practice mode
  const [currentTranslations, setCurrentTranslations] = useState<Record<string, string> | null>(null);
  const [showInlineTranslation, setShowInlineTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setShowTranscript(false);
    setShowTranslations(false);
    setShowExplanation(false);
    setShowInlineTranslation(false);
    if (currentQ?.id) {
      const cached = getCachedTranslation(currentQ.id);
      setCurrentTranslations(cached);
    } else {
      setCurrentTranslations(null);
    }
  }, [currentIndex, currentQ?.id]);

  // Practice Mode state
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [resolvedWrongIds, setResolvedWrongIds] = useState<Record<string, boolean>>({});

  const [timeLeft, setTimeLeft] = useState(7200); // 120 minutes standard
  const initializedAttemptRef = useRef<number | null>(null);

  useEffect(() => {
    const s = activeSession || attemptQuery.data;
    if (s) {
      if (initializedAttemptRef.current !== s.attemptId) {
        initializedAttemptRef.current = s.attemptId;
      }
      if (s.answers && Object.keys(s.answers).length > 0) {
        setUserAnswers((prev) => ({ ...s.answers, ...prev }));
      }
      if (s.bookmarks && s.bookmarks.length > 0) {
        setBookmarkedIds((prev) => Array.from(new Set([...prev, ...s.bookmarks])));
      }
      if (s.remainingSeconds && s.remainingSeconds > 0) {
        setTimeLeft(s.remainingSeconds);
      } else if (s.durationMinutes && s.durationMinutes > 0 && timeLeft === 7200) {
        setTimeLeft(s.durationMinutes * 60);
      }
    } else if (examDetailQuery.data?.durationMinutes && timeLeft === 7200) {
      setTimeLeft(examDetailQuery.data.durationMinutes * 60);
    }
  }, [activeSession, attemptQuery.data, examDetailQuery.data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cấu hình âm thanh: Tạm thời khóa Tầng 1 (URL Audio ngoài do link chưa chính xác)
  // Chỉ sử dụng Tầng 2 (Speech TTS / Web Speech) đọc kịch bản script chuẩn xác
  const ENABLE_LAYER_1 = false;
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Dual Audio Engine: expo-audio on Native, HTML5 Audio on Web browser
  const audioPlayer = useAudioPlayer(currentQ?.audioUrl ?? null, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const htmlAudioRef = useRef<any>(null);
  const [webAudioPlaying, setWebAudioPlaying] = useState(false);
  const [webCurrentTime, setWebCurrentTime] = useState(0);
  const [webDuration, setWebDuration] = useState(0);

  useEffect(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof Audio === 'undefined') return;

    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
      } catch (_) {}
      htmlAudioRef.current = null;
    }
    setWebAudioPlaying(false);
    setWebCurrentTime(0);

    if (ENABLE_LAYER_1 && currentQ?.audioUrl) {
      try {
        const audio = new Audio(currentQ.audioUrl);
        htmlAudioRef.current = audio;
        audio.onloadedmetadata = () => {
          setWebDuration(audio.duration || currentQ.audioDurationSec || 20);
        };
        audio.ontimeupdate = () => {
          setWebCurrentTime(audio.currentTime);
        };
        audio.onended = () => {
          setWebAudioPlaying(false);
          setWebCurrentTime(0);
        };
      } catch (e) {
        console.warn('Web Audio init error:', e);
      }
    }

    return () => {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      }
      if (htmlAudioRef.current) {
        try {
          htmlAudioRef.current.pause();
        } catch (_) {}
        htmlAudioRef.current = null;
      }
    };
  }, [currentQ?.id, currentQ?.audioUrl]);

  const handleToggleAudio = () => {
    // ─── TẦNG 2: Speech TTS (Kích hoạt khi Tầng 1 tạm khóa) ───────────────────
    if (!ENABLE_LAYER_1) {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      let textToRead = currentQ?.audioScript?.trim();
      if (!textToRead) {
        if (currentQ?.part === 'PART_1') {
          // Build each option on its own line so parseSegments treats each as a separate segment
          // Use "A." prefix so listener knows which choice
          const optsText = (currentQ.options || [])
            .map((o) => `${o.key}. ${o.label || (o as any).text || ''}`.trim())
            .join('\n');
          textToRead = `Number ${currentQ.questionNumber}. Look at the picture marked number ${currentQ.questionNumber} in your test book.\n${optsText}`;
        } else if (currentQ?.part === 'PART_2') {
          const optsText = (currentQ.options || [])
            .map((o) => `${o.key}. ${o.label || (o as any).text || ''}`.trim())
            .join('\n');
          textToRead = `Number ${currentQ.questionNumber}. ${currentQ.questionText || ''}\n${optsText}`;
        } else {
          textToRead = currentQ?.questionText || '';
        }
      }

      if (!textToRead) return;

      // ── Helper types for segments ──
      type Seg = { gender: 'male' | 'female' | 'single'; text: string };

      // ── For Part 1 & Part 2, bypass parseSegments entirely ──
      // Build segments directly so "A / B / C / D" prefix is ALWAYS spoken
      let directSegments: Seg[] | null = null;
      if (currentQ?.part === 'PART_1' || currentQ?.part === 'PART_2') {
        const intro = currentQ.part === 'PART_1'
          ? `Number ${currentQ.questionNumber}. Look at the picture marked number ${currentQ.questionNumber} in your test book.`
          : `Number ${currentQ.questionNumber}. ${currentQ.questionText || ''}`;
        directSegments = [{ gender: 'single', text: intro }];
        for (const o of currentQ.options || []) {
          const label = (o.label || (o as any).text || '').trim();
          if (label) {
            // "A." read aloud so listener knows which choice
            directSegments.push({ gender: 'single', text: `${o.key}.` });
            directSegments.push({ gender: 'single', text: label });
          } else {
            directSegments.push({ gender: 'single', text: `${o.key}.` });
          }
        }
      }

      // Phân tách đối thoại: Nam đọc giọng Nam trầm (pitch 0.85), Nữ đọc giọng Nữ cao (pitch 1.25), Đơn đọc chuẩn (pitch 1.0)
      const cleanSpoken = (t: string) => {
        return t
          .replace(/[\(\[]\s*(?:Man(?:\s*\d+)?|Woman(?:\s*\d+)?|Male(?:\s*\d+)?|Female(?:\s*\d+)?|Narrator|Announcer|Speaker\s*\d+|[A-Za-z\s\.\-]{1,20})\s*[\)\]]\s*[:\-–—]?/gi, '')
          .replace(/^\s*(?:[\(\[]?[A-Za-z0-9\s\.\-]{1,25}[\)\]]?)\s*[:\-–—]\s*/gi, '')
          .replace(/\b(?:Man|Woman|Narrator|Announcer|Speaker\s*\d+)\s*[:\-–—]\s*/gi, '')
          .trim();
      };

      const parseSegments = (raw: string) => {
        const norm = raw.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
        const tagRegex = /^\s*[\(\[]?([A-Za-z][A-Za-z0-9\s\.\-]{0,24})[\)\]]?\s*[:\-–—]\s*(.*)$/;
        const lines = norm.split('\n');
        const hasTags = lines.some((l) => tagRegex.test(l.trim()));
        if (!hasTags) {
          const s = cleanSpoken(norm);
          return [{ gender: 'single' as const, text: s }];
        }

        const segs: Array<{ gender: 'male' | 'female' | 'single'; text: string }> = [];
        let curGen: 'male' | 'female' | 'single' = 'single';
        let curTxt = '';

        for (const l of lines) {
          const t = l.trim();
          if (!t) continue;
          const m = t.match(tagRegex);
          if (m) {
            const spoken = cleanSpoken(curTxt);
            if (spoken) segs.push({ gender: curGen, text: spoken });
            const low = m[1].toLowerCase();
            curGen = (low.startsWith('w') || low.includes('woman') || low.includes('female') || low.includes('sarah') || low.includes('jenny') || low.includes('ms'))
              ? 'female'
              : ((low.startsWith('m') || low.includes('man') || low.includes('male') || low.includes('david') || low.includes('mr')) ? 'male' : (segs.length % 2 === 0 ? 'male' : 'female'));
            curTxt = m[2] || '';
          } else {
            curTxt += (curTxt ? ' ' : '') + t;
          }
        }
        const lastSpoken = cleanSpoken(curTxt);
        if (lastSpoken) segs.push({ gender: curGen, text: lastSpoken });
        return segs.length ? segs : [{ gender: 'single' as const, text: cleanSpoken(norm) }];
      };

      const segments: Seg[] = directSegments ?? parseSegments(textToRead);
      setIsSpeaking(true);
      Speech.stop();

      const speakSegmentIndex = (idx: number) => {
        if (idx >= segments.length) {
          setIsSpeaking(false);
          return;
        }
        const item = segments[idx];
        const pitch = item.gender === 'male' ? 0.85 : item.gender === 'female' ? 1.25 : 1.0;
        // Shorter pause between "A." header and its content; longer pause between options
        const isOptionHeader = item.text.match(/^[A-D]\.?$/);
        const delay = isOptionHeader ? 220 : 400;

        Speech.speak(item.text, {
          language: 'en-US',
          rate: isOptionHeader ? 0.85 : 0.9,
          pitch,
          onDone: () => {
            if (idx + 1 < segments.length) {
              setTimeout(() => speakSegmentIndex(idx + 1), delay);
            } else {
              setIsSpeaking(false);
            }
          },
          onStopped: () => setIsSpeaking(false),
          onError: () => {
            if (idx + 1 < segments.length) {
              speakSegmentIndex(idx + 1);
            } else {
              setIsSpeaking(false);
            }
          },
        });
      };

      speakSegmentIndex(0);
      return;
    }

    if (Platform.OS === 'web' && htmlAudioRef.current) {
      if (webAudioPlaying) {
        htmlAudioRef.current.pause();
        setWebAudioPlaying(false);
      } else {
        htmlAudioRef.current.play().then(() => {
          setWebAudioPlaying(true);
        }).catch(() => {
          setWebAudioPlaying(true);
        });
      }
      return;
    }

    if (!currentQ?.audioUrl) return;
    if (audioStatus.playing) audioPlayer.pause(); else audioPlayer.play();
  };

  const isPlayingAudio = !ENABLE_LAYER_1 ? isSpeaking : (Platform.OS === 'web' ? webAudioPlaying : audioStatus.playing);
  const currentAudioTime = Platform.OS === 'web' ? webCurrentTime : audioStatus.currentTime;
  const currentAudioDuration = Platform.OS === 'web'
    ? (webDuration || currentQ?.audioDurationSec || 20)
    : (audioStatus.duration || currentQ?.audioDurationSec || 20);
  const audioProgress = isSpeaking ? 0.6 : (currentAudioDuration > 0 ? currentAudioTime / currentAudioDuration : 0);

  const formatAudioTime = (seconds?: number) => {
    if (!ENABLE_LAYER_1 && isSpeaking) return 'Đang đọc';
    const safe = Math.max(0, Math.floor(seconds ?? 0));
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
  };

  // Passage collapse/expand state for Part 6 & 7
  const [isPassageExpanded, setIsPassageExpanded] = useState(true);
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false);

  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Bookmark toggle – debounced 1.5s để tránh flood API khi user bookmark nhanh
  const toggleBookmark = (id: string) => {
    const bookmarked = !bookmarkedIds.includes(id);
    setBookmarkedIds((prev) => bookmarked ? [...prev, id] : prev.filter((item) => item !== id));
    if (bookmarkDebounceRef.current) clearTimeout(bookmarkDebounceRef.current);
    bookmarkDebounceRef.current = setTimeout(() => {
      if (activeAttemptId && activeAttemptId !== 9999) {
        saveAnswer.mutate({ attemptId: activeAttemptId, questionId: id, selectedAnswer: userAnswers[id], bookmarked });
      }
    }, 1500);
  };

  // Cluster questions helper (for Part 3, 4, 6, 7)
  const clusterQuestions = useMemo(() => {
    if (!currentQ) return [];
    if (currentQ.groupQuestionNumbers && currentQ.groupQuestionNumbers.length > 1) {
      return questions.filter((q) => currentQ.groupQuestionNumbers?.includes(q.questionNumber));
    }
    if (currentQ.groupTag) {
      const byTag = questions.filter((q) => q.groupTag === currentQ.groupTag);
      if (byTag.length > 1) return byTag;
    }
    return [currentQ];
  }, [currentQ, questions]);

  const isCluster = clusterQuestions.length > 1;
  const clusterAnsweredCount = clusterQuestions.filter((q) => Boolean(userAnswers[q.id])).length;
  const isClusterComplete = clusterAnsweredCount === clusterQuestions.length;
  const isClusterRevealed = clusterQuestions.some((q) => Boolean(revealedQuestions[q.id]));

  const persistPractice = (
    idx: number = currentIndex,
    ans: Record<string, AnswerKey> = userAnswers,
    revealed: Record<string, boolean> = revealedQuestions
  ) => {
    if (!isPracticeMode || !examId || questions.length === 0) return;
    const q = questions[idx] || currentQ;
    savePracticeProgress({
      examId,
      examTitle: attemptQuery.data?.title || params.title || 'Bài thi TOEIC',
      currentIndex: idx,
      questionNumber: q?.questionNumber || (idx + 1),
      totalQuestions: questions.length,
      answers: ans,
      revealedQuestions: revealed,
      bookmarkedIds,
      updatedAt: Date.now(),
      isCompleted: false,
    });
  };

  // Option select – KHÔNG gọi API ngay. Đánh dấu câu cần sync để flush khi chuyển câu.
  // Exam mode: submitAttempt cuối đã gửi toàn bộ → không cần PUT trung gian.
  // Practice mode: pendingSyncRef được flush tại goToNext/goToPrev/jumpTo.
  const handleSelectOption = (key: AnswerKey) => {
    if (!currentQ) return;
    if (isPracticeMode && revealedQuestions[currentQ.id]) return;
    const nextAnswers = { ...userAnswers, [currentQ.id]: key };
    setUserAnswers(nextAnswers);

    // Chỉ đánh dấu pending — flush sẽ xảy ra khi rời câu này
    if (isPracticeMode && activeAttemptId && activeAttemptId !== 9999) {
      pendingSyncRef.current = { questionId: currentQ.id, answer: key };
    }

    // In Practice Mode for single questions (not a multi-question group), reveal immediately
    let nextRevealed = revealedQuestions;
    if (isPracticeMode && !isCluster) {
      nextRevealed = { ...revealedQuestions, [currentQ.id]: true };
      setRevealedQuestions(nextRevealed);
      if (isWrongOnly && key === currentQ.correctAnswer) {
        setResolvedWrongIds((prev) => ({ ...prev, [currentQ.id]: true }));
      }
    }

    persistPractice(currentIndex, nextAnswers, nextRevealed);
  };

  const handleRevealCluster = () => {
    setRevealedQuestions((prev) => {
      const next = { ...prev };
      clusterQuestions.forEach((q) => {
        next[q.id] = true;
        if (isWrongOnly && userAnswers[q.id] === q.correctAnswer) {
          setResolvedWrongIds((r) => ({ ...r, [q.id]: true }));
        }
      });
      return next;
    });
  };

  // Navigation between questions – flush pending sync khi rời câu (practice mode)
  const goToNext = () => {
    flushPendingSync(activeAttemptId, userAnswers, bookmarkedIds);
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistPractice(nextIdx);
    } else {
      setShowSubmitModal(true);
    }
  };

  const goToPrev = () => {
    flushPendingSync(activeAttemptId, userAnswers, bookmarkedIds);
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      persistPractice(prevIdx);
    }
  };

  const jumpToQuestionByNumber = (qNum: number) => {
    flushPendingSync(activeAttemptId, userAnswers, bookmarkedIds);
    const targetIdx = questions.findIndex((q) => q.questionNumber === qNum);
    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
      persistPractice(targetIdx);
    }
  };

  // TTS Simulation
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const handleSpeakQuestion = () => {
    if (!currentQ) return;
    setIsSpeakingTts(true);
    Speech.stop();
    Speech.speak(currentQ.questionText.replace(/_______/g, 'blank'), {
      language: 'en-US',
      onDone: () => setIsSpeakingTts(false),
      onStopped: () => setIsSpeakingTts(false),
      onError: () => setIsSpeakingTts(false),
    });
  };

  const handleToggleTranslate = async () => {
    if (!currentQ) return;
    if (showInlineTranslation) {
      setShowInlineTranslation(false);
      return;
    }

    setShowInlineTranslation(true);
    if (!currentTranslations || !currentTranslations.question) {
      setIsTranslating(true);
      try {
        const res = await translateQuestionAndOptions(
          currentQ.id,
          currentQ.questionText || '',
          displayOptions.map((o) => ({ key: o.key, label: o.label, translationVi: o.translationVi }))
        );
        setCurrentTranslations(res);
      } catch (e) {
        console.warn('Translation error:', e);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleToggleDropdownTranslations = async () => {
    const nextState = !showTranslations;
    setShowTranslations(nextState);
    if (nextState && (!currentTranslations || !currentTranslations.question) && currentQ) {
      setIsTranslating(true);
      try {
        const res = await translateQuestionAndOptions(
          currentQ.id,
          currentQ.questionText || '',
          displayOptions.map((o) => ({ key: o.key, label: o.label, translationVi: o.translationVi }))
        );
        setCurrentTranslations(res);
      } catch (e) {
        console.warn('Translation error:', e);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setShowGridModal(false);
    if (submitAttempt.isPending) return;
    const totalDurationSec = (activeSession?.durationMinutes ?? examDetailQuery.data?.durationMinutes ?? 120) * 60;
    const timeSpentSeconds = Math.max(0, totalDurationSec - timeLeft);

    // Practice mode never submits a scored attempt and never earns XP.
    if (isPracticeMode || isWrongOnly) {
      if (examId) clearPracticeProgress(examId);
      router.replace('/(student)/learn');
      return;
    }

    if (examId) {
      clearPracticeProgress(examId);
    }

    if (activeAttemptId && attemptQuery.data) {
      try {
        await submitAttempt.mutateAsync({ attemptId: activeAttemptId, answers: userAnswers, timeSpentSeconds });
        router.replace({ pathname: '/(student)/practice/exam/result', params: { attemptId: String(activeAttemptId) } });
        return;
      } catch (error: any) {
        console.warn('Backend submit failed:', error?.message);
        // Even on failure, still navigate - result screen will show error state
        if (activeAttemptId) {
          router.replace({ pathname: '/(student)/practice/exam/result', params: { attemptId: String(activeAttemptId) } });
          return;
        }
      }
    }

    // No attempt ID at all: go back to learn (graceful degradation)
    router.replace('/(student)/learn');
  };


  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (isPracticeMode) return; // In practice mode, don't auto submit on timer
    if (timeLeft > 0 || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    handleSubmit();
  }, [timeLeft, isPracticeMode]);

  const isDataLoading =
    (!activeAttemptId && examId && startAttempt.isPending) ||
    attemptQuery.isLoading ||
    examDetailQuery.isLoading ||
    (isWrongOnly && sourceResultQuery.isLoading);

  if (isDataLoading) {
    return (
      <View style={[styles.loadingState, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingTitle}>Đang tải...</Text>
      </View>
    );
  }

  if (!currentQ || questions.length === 0) {
    return (
      <View style={[styles.loadingState, { paddingTop: insets.top }]}>
        <AlertCircle color={colors.primary} size={36} />
        <Text style={styles.loadingTitle}>
          {isWrongOnly ? 'Không có câu hỏi sai' : 'Không tìm thấy câu hỏi bài thi'}
        </Text>
        <Text style={styles.loadingText}>
          {isWrongOnly
            ? 'Bạn đã làm đúng tất cả các câu trong lượt thi này!'
            : 'Đề thi hiện chưa có câu hỏi nào hoặc chưa được xuất bản.'}
        </Text>
        <Pressable style={styles.loadingButton} onPress={() => router.back()}>
          <Text style={styles.loadingButtonText}>Quay lại danh sách</Text>
        </Pressable>
      </View>
    );
  }

  // Summary counts
  const answeredCount = Object.keys(userAnswers).length;
  const bookmarkedCount = bookmarkedIds.length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // Progress percentage
  const progressPercent = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const selectedAnswer = userAnswers[currentQ.id];
  const isCurrentBookmarked = bookmarkedIds.includes(currentQ.id);

  const currentCategory = String(
    activeSession?.category || attemptQuery.data?.category || examDetailQuery.data?.category || ''
  ).toUpperCase();
  const isToeicExam = currentCategory.startsWith('TOEIC');

  // Only TOEIC Part 2 has three answer choices. Other exam categories may use four.
  const displayOptions = isToeicExam && currentQ.part === 'PART_2'
    ? currentQ.options.filter((opt) => opt.key === 'A' || opt.key === 'B' || opt.key === 'C')
    : currentQ.options;

  // Hiding option text is a TOEIC Listening rule, not a generic PART_1/PART_2 rule.
  const isListeningOnlyPart = isToeicExam && (currentQ.part === 'PART_1' || currentQ.part === 'PART_2');
  const isCurrentRevealed = Boolean(revealedQuestions[currentQ.id]);
  const translatedOptions = displayOptions.filter((option) => Boolean(option.translationVi));

  return (
    <View style={styles.root}>
      {/* ─── 1. TOP HEADER (Chuẩn theo 4 ảnh) ─── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        {/* Left: Close Button */}
        <Pressable
          onPress={() => setShowExitModal(true)}
          hitSlop={12}
          style={styles.headerIconButton}
        >
          <X color={colors.text} size={22} strokeWidth={2.2} />
        </Pressable>

        {/* Center: Exam Title & Mode Badge */}
        <View style={styles.headerCenterWrap}>
          <Text numberOfLines={1} style={styles.headerExamTitle}>
            {attemptQuery.data?.title || params.title || 'Bài thi TOEIC'}
          </Text>
          <View style={[styles.headerModePill, isPracticeMode ? styles.headerModePillPractice : styles.headerModePillExam]}>
            <Text style={[styles.headerModePillText, isPracticeMode ? styles.headerModePillTextPractice : styles.headerModePillTextExam]}>
              {isWrongOnly ? 'Câu sai' : isPracticeMode ? 'Luyện tập' : 'Thi thử'}
            </Text>
          </View>
        </View>

        {/* Right: Timer Pill & Avatar */}
        <View style={styles.headerRightRow}>
          <Pressable onPress={() => setShowGridModal(true)} style={styles.timerPill}>
            {isPracticeMode ? (
              <>
                <Grid color={colors.primary} size={15} strokeWidth={2} />
                <Text style={styles.timerTextPractice}>{answeredCount}/{questions.length}</Text>
              </>
            ) : (
              <>
                <Clock color={colors.textSoft} size={15} strokeWidth={2} />
                <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => setShowGridModal(true)} style={styles.avatarButton}>
            <User color="#FFFFFF" size={17} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>

      {/* ─── 2. SUB-HEADER & PROGRESS BAR ─── */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderInfoRow}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumberBadgeText}>
              Câu {currentQ.questionNumber} / {questions.length}
            </Text>
          </View>

          <View style={styles.partLabelContainer}>
            <Text numberOfLines={1} style={styles.subHeaderPartTitle}>
              {currentQ.partLabel}
            </Text>
          </View>
        </View>

        {/* Thin Slim Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Wrong Only Mode Notice Banner */}
      {isWrongOnly && (
        <View style={styles.wrongOnlyHeaderBanner}>
          <RotateCcw size={14} color="#C2410C" />
          <Text style={styles.wrongOnlyBannerText}>
            Làm lại câu sai: Còn {Math.max(0, questions.length - Object.keys(resolvedWrongIds).length)}/{questions.length} câu chưa sửa đúng
          </Text>
        </View>
      )}

      {/* ─── 3. QUESTION SCROLLABLE BODY ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* ── PART 1: PHOTO CONTAINER (Giống ảnh 2) ── */}
        {currentQ.part === 'PART_1' && currentQ.imageUrl && (
          <View style={styles.photoCard}>
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: currentQ.imageUrl }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View style={styles.photoTagBadge}>
                <Camera color="#FFFFFF" size={12} strokeWidth={2.2} />
                <Text style={styles.photoTagText}>{currentQ.imageTag || 'Ảnh'}</Text>
              </View>
            </View>

            {/* Audio Bar for Part 1 */}
            <View style={styles.audioPlayerBox}>
              <View style={styles.audioPlayerControls}>
                <Pressable
                  testID="audio-play-button-part1"
                  onPress={handleToggleAudio}
                  style={styles.audioPlayButton}
                >
                  {isPlayingAudio ? (
                    <Pause color="#FFFFFF" size={16} fill="#FFFFFF" />
                  ) : (
                    <Play color="#FFFFFF" size={16} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </Pressable>

                <View style={styles.audioTimelineWrap}>
                  <View style={styles.audioTimeLabels}>
                    <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioTime)}</Text>
                    <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioDuration)}</Text>
                  </View>

                  <View style={styles.audioSliderTrack}>
                    <View style={[styles.audioSliderFill, { width: `${audioProgress * 100}%` }]} />
                  </View>
                </View>

                <Headphones color={colors.primary} size={18} strokeWidth={2} />
              </View>
            </View>

            {/* Instruction prompt – chỉ hiện nếu câu hỏi chưa có text, tránh lặp lại 2 dòng hướng dẫn */}
            {currentQ.instructionPrompt && !currentQ.questionText ? (
              <View style={styles.instructionWrap}>
                <Text style={styles.instructionTitle}>{currentQ.instructionPrompt}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── PART 2: QUESTION - RESPONSE AUDIO BOX ── */}
        {currentQ.part === 'PART_2' && (currentQ.audioUrl || currentQ.audioScript || !ENABLE_LAYER_1) && (
          <View style={styles.part2AudioCard}>
            <View style={styles.audioPillRow}>
              <View style={styles.audioActivePill}>
                <Headphones color={colors.primary} size={14} />
                <Text style={styles.audioActivePillText}>{currentQ.audioTitle || 'Phần 2: Hỏi - Đáp'}</Text>
              </View>
              <View style={styles.soundWavePill}>
                <Text style={styles.soundWaveText}>
                  {isPlayingAudio ? '● Đang đọc câu hỏi & đáp án' : 'Bấm để nghe đọc'}
                </Text>
              </View>
            </View>

            <View style={styles.audioPlayerBox}>
              <View style={styles.audioPlayerControls}>
                <Pressable
                  testID="audio-play-button-part2"
                  onPress={handleToggleAudio}
                  style={styles.audioPlayButton}
                >
                  {isPlayingAudio ? (
                    <Pause color="#FFFFFF" size={16} fill="#FFFFFF" />
                  ) : (
                    <Play color="#FFFFFF" size={16} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </Pressable>

                <View style={styles.audioTimelineWrap}>
                  <View style={styles.audioTimeLabels}>
                    <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioTime)}</Text>
                    <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioDuration)}</Text>
                  </View>
                  <View style={styles.audioSliderTrack}>
                    <View style={[styles.audioSliderFill, { width: `${audioProgress * 100}%` }]} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.instructionWrap}>
              <Text style={styles.instructionTitle}>{currentQ.instructionPrompt}</Text>
              <Text style={styles.instructionSub}>{currentQ.instructionSub}</Text>
            </View>
          </View>
        )}

        {/* ── PART 3 & PART 4: AUDIO CARD & WAVEFORM (Giống ảnh 3) ── */}
        {(currentQ.part === 'PART_3' || currentQ.part === 'PART_4') && (currentQ.audioUrl || currentQ.audioScript || !ENABLE_LAYER_1) && (
          <View style={styles.audioGroupContainer}>
            <View style={styles.audioCardHeaderRow}>
              <View style={styles.audioActivePill}>
                <Headphones color={colors.primary} size={13} />
                <Text style={styles.audioActivePillText}>{currentQ.audioTitle || (currentQ.part === 'PART_3' ? 'Đoạn hội thoại' : 'Bài nói ngắn')}</Text>
              </View>

              <View style={styles.soundWavePill}>
                <Text style={styles.soundWaveText}>● Đang phát âm thanh</Text>
              </View>
            </View>

            {/* Waveform Card */}
            <View style={styles.waveformPlayerCard}>
              <View style={styles.waveControlsRow}>
                <Pressable
                  testID="audio-play-button-part3"
                  onPress={handleToggleAudio}
                  style={styles.audioPlayButtonLarge}
                >
                  {isPlayingAudio ? (
                    <Pause color="#FFFFFF" size={18} fill="#FFFFFF" />
                  ) : (
                    <Play color="#FFFFFF" size={18} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </Pressable>

                {/* Animated Waveform Visualizer */}
                <View style={styles.waveformBarsWrap}>
                  {[12, 24, 18, 30, 20, 14, 28, 22, 34, 16, 26, 18, 32, 14, 22, 16, 28, 12].map(
                    (h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: h },
                          i < (isPlayingAudio ? 14 : 7) ? styles.waveformBarActive : styles.waveformBarInactive,
                        ]}
                      />
                    )
                  )}
                </View>
              </View>

              {/* Slider Track */}
              <View style={styles.audioTimelineWrap}>
                <View style={styles.audioSliderTrack}>
                  <View style={[styles.audioSliderFill, { width: `${audioProgress * 100}%` }]} />
                </View>
                <View style={styles.audioTimeLabels}>
                  <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioTime)}</Text>
                  <Text style={styles.audioTimeText}>{formatAudioTime(currentAudioDuration)}</Text>
                </View>
              </View>

              <View style={styles.etsInfoBox}>
                <HelpCircle color={colors.textSoft} size={14} />
                <Text style={styles.etsInfoBoxText}>
                  {currentQ.audioNotice || 'Đoạn băng phát tự động 1 lần theo chuẩn ETS · Không có transcript'}
                </Text>
              </View>
            </View>

            {/* Sub-question pills for the group */}
            {currentQ.groupQuestionNumbers && currentQ.groupQuestionNumbers.length > 0 && (
              <View style={styles.groupNavigationRow}>
                <View>
                  <Text style={styles.groupNavTitle}>{currentQ.groupTag}</Text>
                  <Text style={styles.groupNavSub}>Đang làm câu {currentQ.questionNumber}</Text>
                </View>

                <View style={styles.groupNumberChips}>
                  {currentQ.groupQuestionNumbers.map((qNum) => {
                    const isCurrent = qNum === currentQ.questionNumber;
                    const targetQ = questions.find((q) => q.questionNumber === qNum);
                    const isAnswered = targetQ && Boolean(userAnswers[targetQ.id]);

                    return (
                      <Pressable
                        key={qNum}
                        testID={`group-chip-${qNum}`}
                        onPress={() => jumpToQuestionByNumber(qNum)}
                        style={[
                          styles.groupNumberChip,
                          isCurrent && styles.groupNumberChipCurrent,
                          !isCurrent && isAnswered && styles.groupNumberChipDone,
                        ]}
                      >
                        {isAnswered && !isCurrent ? (
                          <CheckCircle2 color={colors.primary} size={16} />
                        ) : (
                          <Text
                            style={[
                              styles.groupNumberChipText,
                              isCurrent && styles.groupNumberChipTextCurrent,
                              !isCurrent && isAnswered && styles.groupNumberChipTextDone,
                            ]}
                          >
                            {qNum}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── PART 6 & PART 7: READING PASSAGE CARD (Giống ảnh 4) ── */}
        {(currentQ.part === 'PART_6' || currentQ.part === 'PART_7') && currentQ.passage && (
          <View style={styles.passageCard}>
            <View style={styles.passageHeaderBar}>
              <View style={styles.passageHeaderLeft}>
                <FileText color={colors.primary} size={17} />
                <Text style={styles.passageHeaderTitle}>{currentQ.passage.title}</Text>
              </View>

              <View style={styles.passageHeaderActions}>
                <Pressable
                  onPress={() => setIsPassageExpanded(!isPassageExpanded)}
                  hitSlop={8}
                  style={styles.passageActionBtn}
                >
                  {isPassageExpanded ? (
                    <ChevronUp color={colors.textSoft} size={18} />
                  ) : (
                    <ChevronDown color={colors.textSoft} size={18} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setIsPassageModalOpen(true)}
                  hitSlop={8}
                  style={styles.passageActionBtn}
                >
                  <Maximize2 color={colors.textSoft} size={15} />
                </Pressable>
              </View>
            </View>

            {/* Collapsible passage content */}
            {isPassageExpanded && (
              <View style={styles.passageContentBox}>
                {/* Formatted Business Email / Memo Header */}
                {currentQ.passage.emailHeaders && (
                  <View style={styles.emailHeadersBox}>
                    <View style={styles.emailHeaderLine}>
                      <Text style={styles.emailHeaderLabel}>From:</Text>
                      <Text style={styles.emailHeaderValue}>{currentQ.passage.emailHeaders.from}</Text>
                    </View>
                    <View style={styles.emailHeaderLine}>
                      <Text style={styles.emailHeaderLabel}>To:</Text>
                      <Text style={styles.emailHeaderValue}>{currentQ.passage.emailHeaders.to}</Text>
                    </View>
                    <View style={styles.emailHeaderLine}>
                      <Text style={styles.emailHeaderLabel}>Date:</Text>
                      <Text style={styles.emailHeaderValue}>{currentQ.passage.emailHeaders.date}</Text>
                    </View>
                    <View style={styles.emailHeaderLine}>
                      <Text style={styles.emailHeaderLabel}>Subject:</Text>
                      <Text style={styles.emailHeaderSubject}>
                        {currentQ.passage.emailHeaders.subject}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Paragraphs */}
                <View style={styles.passageParagraphs}>
                  {currentQ.passage.paragraphs.map((p, i) => (
                    <Text key={i} style={styles.passageParagraphText}>
                      {p}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Sub-question indicators for the passage group */}
            {currentQ.groupQuestionNumbers && currentQ.groupQuestionNumbers.length > 0 && (
              <View style={styles.readingGroupNavRow}>
                <View>
                  <Text style={styles.readingSharedLabel}>Văn bản chia sẻ</Text>
                  <Text style={styles.readingGroupName}>{currentQ.groupTag}</Text>
                </View>

                <View style={styles.groupNumberChips}>
                  {currentQ.groupQuestionNumbers.map((qNum) => {
                    const isCurrent = qNum === currentQ.questionNumber;
                    const targetQ = questions.find((q) => q.questionNumber === qNum);
                    const isAnswered = targetQ && Boolean(userAnswers[targetQ.id]);

                    return (
                      <Pressable
                        key={qNum}
                        testID={`group-chip-${qNum}`}
                        onPress={() => jumpToQuestionByNumber(qNum)}
                        style={[
                          styles.groupNumberChip,
                          isCurrent && styles.groupNumberChipCurrent,
                          !isCurrent && isAnswered && styles.groupNumberChipDone,
                        ]}
                      >
                        {isAnswered && !isCurrent ? (
                          <CheckCircle2 color={colors.primary} size={16} />
                        ) : (
                          <Text
                            style={[
                              styles.groupNumberChipText,
                              isCurrent && styles.groupNumberChipTextCurrent,
                              !isCurrent && isAnswered && styles.groupNumberChipTextDone,
                            ]}
                          >
                            {qNum}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── QUESTION CARD (Áp dụng cho mọi câu hỏi) ── */}
        <View style={styles.questionCard}>
          {/* Question Meta Header Row */}
          <View style={styles.questionCardMetaRow}>
            <View style={styles.questionCardBadges}>
              {currentQ.categoryTag ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{currentQ.categoryTag}</Text>
                </View>
              ) : null}

              {currentQ.hasTts ? (
                <Pressable
                  onPress={handleSpeakQuestion}
                  style={styles.ttsButton}
                >
                  <Volume2 color={isSpeakingTts ? colors.primary : colors.textSoft} size={15} />
                  <Text style={styles.ttsButtonText}>Nghe câu hỏi</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Translate Button for Practice Mode */}
            {isPracticeMode && isCurrentRevealed ? (
              <Pressable
                onPress={handleToggleTranslate}
                style={[styles.translateButton, showInlineTranslation && styles.translateButtonActive]}
                hitSlop={6}
              >
                {isTranslating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Languages size={13} color={showInlineTranslation ? colors.primary : '#475569'} />
                )}
                <Text style={[styles.translateButtonText, showInlineTranslation && styles.translateButtonTextActive]}>
                  {isTranslating ? 'Đang dịch...' : showInlineTranslation ? 'Ẩn dịch' : 'Dịch'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Question Text with blank underline */}
          <Text style={styles.mainQuestionText}>
            {currentQ.questionText}
          </Text>

          {/* Inline Question Translation */}
          {isPracticeMode && isCurrentRevealed && showInlineTranslation && Boolean(currentTranslations?.question) ? (
            <View style={styles.questionTranslationBox}>
              <Languages size={12} color="#2563EB" style={{ marginTop: 2 }} />
              <Text style={styles.questionTranslationText}>{currentTranslations?.question}</Text>
            </View>
          ) : null}
        </View>



        {/* ── OPTIONS LIST (Chuẩn mobile: Full width & xếp dọc các đáp án) ── */}
        <View style={styles.optionsList}>
          {displayOptions.map((opt) => {
            const isSelected = selectedAnswer === opt.key;
            const isRevealed = Boolean(revealedQuestions[currentQ.id]);
            const isCorrectAnswer = opt.key === currentQ.correctAnswer;
            const isWrongSelection = isSelected && !isCorrectAnswer;

            return (
              <Pressable
                key={opt.key}
                testID={`option-card-${opt.key}`}
                onPress={() => handleSelectOption(opt.key)}
                disabled={isPracticeMode && isRevealed}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isRevealed && isCorrectAnswer && styles.optionCardRevealedCorrect,
                  isRevealed && isWrongSelection && styles.optionCardRevealedWrong,
                ]}
              >
                {/* Circle Key (A, B, C, D) - Giữ chữ A B C D, đổi màu theo trạng thái, không icon */}
                <View
                  style={[
                    styles.optionKeyCircle,
                    isSelected && styles.optionKeyCircleSelected,
                    isRevealed && isCorrectAnswer && styles.optionKeyCircleRevealedCorrect,
                    isRevealed && isWrongSelection && styles.optionKeyCircleRevealedWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionKeyText,
                      isSelected && styles.optionKeyTextSelected,
                      isRevealed && (isCorrectAnswer || isWrongSelection) && { color: '#FFFFFF' },
                    ]}
                  >
                    {opt.key}
                  </Text>
                </View>

                {/* Option Text and Sublabel - Luôn hiện cho non-listening; hiện trong row khi revealed cho Part 1/2 */}
                <View style={styles.optionContentWrap}>
                  {Boolean(opt.label) && (!isListeningOnlyPart || (isListeningOnlyPart && isRevealed)) ? (
                    <Text
                      style={[
                        styles.optionLabelText,
                        isSelected && styles.optionLabelTextSelected,
                        isRevealed && isCorrectAnswer && styles.optionLabelTextRevealedCorrect,
                        isRevealed && isWrongSelection && styles.optionLabelTextRevealedWrong,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  ) : null}
                  {(!isListeningOnlyPart || (isListeningOnlyPart && isRevealed)) && opt.subLabel ? (
                    <Text style={styles.optionSubLabelText}>{opt.subLabel}</Text>
                  ) : null}
                  {isPracticeMode && isRevealed && showInlineTranslation && Boolean(currentTranslations?.[opt.key] || opt.translationVi) ? (
                    <Text style={styles.optionTranslationText}>
                      {currentTranslations?.[opt.key] || opt.translationVi}
                    </Text>
                  ) : null}
                </View>

                {/* Radio selection circle indicator */}
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                    isRevealed && isCorrectAnswer && styles.radioCircleRevealedCorrect,
                    isRevealed && isWrongSelection && styles.radioCircleRevealedWrong,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── PRACTICE MODE: CLUSTER CHECK BUTTON OR PROGRESS HINT ── */}
        {isPracticeMode && isCluster && !isClusterRevealed && (
          <View style={styles.clusterControlBox}>
            <View style={styles.clusterStatusRow}>
              <HelpCircle size={15} color="#0284C7" />
              <Text style={styles.clusterStatusText}>
                Nhóm {clusterQuestions.length} câu: Đã làm {clusterAnsweredCount}/{clusterQuestions.length} câu
              </Text>
            </View>
            {isClusterComplete ? (
              <Pressable
                onPress={handleRevealCluster}
                style={({ pressed }) => [styles.btnCheckCluster, pressed && styles.pressed]}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.btnCheckClusterText}>Kiểm tra đáp án nhóm {clusterQuestions.length} câu này</Text>
              </Pressable>
            ) : (
              <Text style={styles.clusterHintText}>
                Vui lòng hoàn thành cả {clusterQuestions.length} câu trong nhóm để xem đáp án chi tiết.
              </Text>
            )}
          </View>
        )}

        {/* ── PRACTICE MODE: DETAILED FEEDBACK CARD ── */}
        {isPracticeMode && Boolean(revealedQuestions[currentQ.id]) && (
          <View style={styles.practiceFeedbackCard}>
            {selectedAnswer === currentQ.correctAnswer ? (
              <View style={styles.feedbackHeaderCorrect}>
                <CheckCircle2 size={18} color="#16A34A" />
                <Text style={styles.feedbackTitleCorrect}>Chính xác! Đáp án đúng: {currentQ.correctAnswer}</Text>
              </View>
            ) : (
              <View style={styles.feedbackHeaderWrong}>
                <X color="#EF4444" size={18} />
                <Text style={styles.feedbackTitleWrong}>Chưa đúng! Đáp án đúng: {currentQ.correctAnswer}</Text>
              </View>
            )}

            {isWrongOnly && selectedAnswer === currentQ.correctAnswer && (
              <View style={styles.resolvedWrongBanner}>
                <Sparkles size={13} color="#15803D" />
                <Text style={styles.resolvedWrongBannerText}>Đã sửa đúng! Đã xóa câu này khỏi danh sách câu sai.</Text>
              </View>
            )}

            {currentQ.audioScript ? (
              <View style={styles.transcriptWrap}>
                <Pressable
                  onPress={() => setShowTranscript((v) => !v)}
                  style={styles.dropdownHeader}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.dropdownTitleRow}>
                    <Headphones size={13} color="#64748B" />
                    <Text style={styles.transcriptHeading}>Lời thoại (Transcript)</Text>
                  </View>
                  {showTranscript
                    ? <ChevronUp size={16} color="#64748B" />
                    : <ChevronDown size={16} color="#64748B" />}
                </Pressable>
                {showTranscript && (
                  <Text style={styles.transcriptBody}>{currentQ.audioScript}</Text>
                )}
              </View>
            ) : null}

            <View style={styles.translationWrap}>
              <Pressable
                onPress={handleToggleDropdownTranslations}
                style={styles.dropdownHeader}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.dropdownTitleRow}>
                  <Languages size={13} color="#475569" />
                  <Text style={styles.translationHeading}>Bản dịch đáp án & câu hỏi</Text>
                </View>
                {showTranslations
                  ? <ChevronUp size={16} color="#475569" />
                  : <ChevronDown size={16} color="#475569" />}
              </Pressable>
              {showTranslations ? (
                isTranslating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Đang dịch từ Google Translate...</Text>
                  </View>
                ) : (
                  <View style={styles.translationList}>
                    {Boolean(currentTranslations?.question) && (
                      <View style={styles.translationQuestionRow}>
                        <Text style={styles.translationQuestionLabel}>Câu hỏi:</Text>
                        <Text style={styles.translationQuestionText}>{currentTranslations?.question}</Text>
                      </View>
                    )}
                    {displayOptions.map((option) => {
                      const trans = currentTranslations?.[option.key] || option.translationVi;
                      return (
                        <Text key={option.key} style={styles.translationBody}>
                          <Text style={styles.translationKey}>{option.key}. </Text>
                          {trans || '(Chưa có bản dịch)'}
                        </Text>
                      );
                    })}
                  </View>
                )
              ) : null}
            </View>

            {currentQ.explanationVi ? (
              <View style={styles.explanationWrap}>
                <Pressable
                  onPress={() => setShowExplanation((v) => !v)}
                  style={styles.dropdownHeader}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.dropdownTitleRow}>
                    <FileText size={13} color="#92400E" />
                    <Text style={styles.explanationHeading}>Giải thích đáp án</Text>
                  </View>
                  {showExplanation
                    ? <ChevronUp size={16} color="#92400E" />
                    : <ChevronDown size={16} color="#92400E" />}
                </Pressable>
                {showExplanation && (
                  <Text style={styles.explanationBody}>{currentQ.explanationVi}</Text>
                )}
              </View>
            ) : null}

            <Pressable
              onPress={goToNext}
              style={({ pressed }) => [styles.btnNextQuestionPractice, pressed && styles.pressed]}
            >
              <Text style={styles.btnNextQuestionPracticeText}>Tiếp</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Action helper bar */}
        <View style={styles.bottomHelpRow}>
          <Pressable
            onPress={() => toggleBookmark(currentQ.id)}
            style={styles.flagHelpBtn}
          >
            <Bookmark
              color={isCurrentBookmarked ? '#D97706' : colors.textSoft}
              size={14}
            />
            <Text style={styles.flagHelpText}>
              {isCurrentBookmarked ? 'Đã đánh dấu câu này' : 'Đánh dấu xem lại'}
            </Text>
          </Pressable>

          <View style={styles.tapNotice}>
            <Text style={styles.tapNoticeText}>👆 Chạm để chọn câu trả lời</Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── 4. BOTTOM NAVIGATION BAR (Câu trước / Câu tiếp theo / Bảng câu hỏi) ─── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <Pressable
          testID="bottom-prev-btn"
          onPress={goToPrev}
          disabled={currentIndex === 0}
          style={[styles.prevButton, currentIndex === 0 && styles.prevButtonDisabled]}
        >
          <ChevronLeft
            color={currentIndex === 0 ? colors.textFaint : colors.text}
            size={20}
          />
          <Text
            style={[
              styles.prevButtonText,
              currentIndex === 0 && styles.prevButtonTextDisabled,
            ]}
          >
            Câu trước
          </Text>
        </Pressable>

        {/* Center Grid Button to quickly view all 30 questions */}
        <Pressable
          testID="bottom-grid-btn"
          onPress={() => setShowGridModal(true)}
          style={styles.quickGridButton}
        >
          <Grid color={colors.primary} size={16} />
          <Text style={styles.quickGridText}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </Pressable>

        <Pressable testID="bottom-next-btn" onPress={goToNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentIndex === questions.length - 1 ? 'Nộp bài' : 'Tiếp'}
          </Text>
          <ChevronRight color="#FFFFFF" size={19} />
        </Pressable>
      </View>

      {/* ─── 5. MODAL: FULLSCREEN PASSAGE MODAL (Part 6 & 7) ─── */}
      <Modal
        visible={isPassageModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPassageModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết văn bản đọc hiểu</Text>
            <Pressable
              onPress={() => setIsPassageModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <X color={colors.text} size={20} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {currentQ.passage?.emailHeaders && (
              <View style={styles.emailHeadersBox}>
                <View style={styles.emailHeaderLine}>
                  <Text style={styles.emailHeaderLabel}>From:</Text>
                  <Text style={styles.emailHeaderValue}>{currentQ.passage.emailHeaders.from}</Text>
                </View>
                <View style={styles.emailHeaderLine}>
                  <Text style={styles.emailHeaderLabel}>To:</Text>
                  <Text style={styles.emailHeaderValue}>{currentQ.passage.emailHeaders.to}</Text>
                </View>
                <View style={styles.emailHeaderLine}>
                  <Text style={styles.emailHeaderLabel}>Subject:</Text>
                  <Text style={styles.emailHeaderSubject}>{currentQ.passage.emailHeaders.subject}</Text>
                </View>
              </View>
            )}

            <View style={{ gap: 14, paddingBottom: 40 }}>
              {currentQ.passage?.paragraphs.map((p, idx) => (
                <Text key={idx} style={styles.passageParagraphTextLarge}>
                  {p}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── 6. MODAL: QUESTION GRID OVERVIEW (Bảng danh sách câu hỏi) ─── */}
      <Modal
        visible={showGridModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGridModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.gridModalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Bảng danh sách câu hỏi</Text>
                <Text style={styles.modalSubTitle}>
                  Đã làm {answeredCount}/{questions.length} câu · {bookmarkedCount} câu đánh dấu
                </Text>
              </View>

              <Pressable
                onPress={() => setShowGridModal(false)}
                style={styles.modalCloseBtn}
              >
                <X color={colors.text} size={20} />
              </Pressable>
            </View>

            {/* Legend row */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Đã chọn</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Đánh dấu</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                <Text style={styles.legendText}>Chưa làm</Text>
              </View>
            </View>

            {/* Question matrix */}
            <ScrollView
              contentContainerStyle={styles.gridMatrixWrap}
              showsVerticalScrollIndicator={false}
            >
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAns = Boolean(userAnswers[q.id]);
                const isBmk = bookmarkedIds.includes(q.id);

                return (
                  <Pressable
                    key={q.id}
                    testID={`question-cell-${q.questionNumber}`}
                    onPress={() => {
                      setCurrentIndex(idx);
                      setShowGridModal(false);
                    }}
                    style={[
                      styles.matrixCell,
                      isAns && styles.matrixCellAnswered,
                      isBmk && styles.matrixCellBookmarked,
                      isCurrent && styles.matrixCellCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matrixCellText,
                        isAns && styles.matrixCellTextAnswered,
                        isBmk && styles.matrixCellTextBookmarked,
                        isCurrent && styles.matrixCellTextCurrent,
                      ]}
                    >
                      {q.questionNumber < 10 ? `0${q.questionNumber}` : q.questionNumber}
                    </Text>
                    <Text
                      style={[
                        styles.matrixCellPartSub,
                        isAns && styles.matrixCellPartSubAnswered,
                        isCurrent && styles.matrixCellPartSubCurrent,
                      ]}
                    >
                      P{q.part.replace('PART_', '')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              testID="modal-submit-exam-btn"
              onPress={() => {
                setShowGridModal(false);
                setShowSubmitModal(true);
              }}
              style={styles.modalSubmitButton}
            >
              <Text style={styles.modalSubmitButtonText}>Nộp bài</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── 7. MODAL: SUBMIT CONFIRMATION ─── */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconWrap}>
              <CheckCircle2 color={colors.primary} size={32} />
            </View>

            <Text style={styles.confirmTitle}>Xác nhận nộp bài thi?</Text>
            <Text style={styles.confirmSub}>
              Bạn đã hoàn thành {answeredCount} trên tổng số {questions.length} câu hỏi.
            </Text>

            <View style={styles.submitStatsSummary}>
              <View style={styles.submitStatCol}>
                <Text style={styles.submitStatNumGreen}>{answeredCount}</Text>
                <Text style={styles.submitStatLabel}>Đã làm</Text>
              </View>
              <View style={styles.submitStatDivider} />
              <View style={styles.submitStatCol}>
                <Text style={styles.submitStatNumOrange}>{unansweredCount}</Text>
                <Text style={styles.submitStatLabel}>Chưa làm</Text>
              </View>
              <View style={styles.submitStatDivider} />
              <View style={styles.submitStatCol}>
                <Text style={styles.submitStatNumYellow}>{bookmarkedCount}</Text>
                <Text style={styles.submitStatLabel}>Đánh dấu</Text>
              </View>
            </View>

            <View style={styles.confirmButtonRow}>
              <Pressable
                onPress={() => setShowSubmitModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalBtnText}>Làm tiếp</Text>
              </Pressable>

              <Pressable
                testID="confirm-submit-now-btn"
                disabled={submitAttempt.isPending}
                onPress={() => {
                  setShowSubmitModal(false);
                  handleSubmit();
                }}
                style={styles.submitModalBtn}
              >
                <Text style={styles.submitModalBtnText}>{submitAttempt.isPending ? 'Đang nộp...' : 'Nộp bài ngay'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── 8. MODAL: EXIT CONFIRMATION ─── */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmBox}>
            <View style={[styles.confirmIconWrap, { backgroundColor: isPracticeMode ? '#E0F2FE' : '#FEE2E2' }]}>
              {isPracticeMode ? (
                <CheckCircle2 color="#0284C7" size={32} />
              ) : (
                <AlertCircle color="#EF4444" size={32} />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {isPracticeMode ? 'Tạm dừng làm thử?' : 'Rời khỏi bài thi?'}
            </Text>
            <Text style={styles.confirmSub}>
              {isPracticeMode
                ? `Tiến trình làm thử của bạn (đến câu ${currentQ?.questionNumber || (currentIndex + 1)}/${questions.length}) sẽ được tự động lưu lại để bạn có thể tiếp tục bất cứ lúc nào.`
                : `Bạn đã làm ${Object.keys(userAnswers).length}/${questions.length} câu. Nhấn "Lưu & Thoát" để lưu tiến trình và xem kết quả tạm thời ngay bây giờ.`}
            </Text>

            <View style={styles.confirmButtonRow}>
              <Pressable
                onPress={() => setShowExitModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalBtnText}>Tiếp tục làm</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (isPracticeMode) {
                    // Practice: flush pending BE sync + lưu local storage
                    flushPendingSync(activeAttemptId, userAnswers, bookmarkedIds);
                    persistPractice();
                    setShowExitModal(false);
                    router.back();
                  } else {
                    // Exam mode: partial-submit để lưu tiến trình lên BE
                    // Người dùng sẽ thấy kết quả tạm nếu có attemptId hợp lệ
                    setShowExitModal(false);
                    if (activeAttemptId && activeAttemptId !== 9999 && Object.keys(userAnswers).length > 0) {
                      try {
                        const totalDurationSec = (activeSession?.durationMinutes ?? examDetailQuery.data?.durationMinutes ?? 120) * 60;
                        const timeSpentSeconds = Math.max(0, totalDurationSec - timeLeft);
                        await submitAttempt.mutateAsync({ attemptId: activeAttemptId, answers: userAnswers, timeSpentSeconds });
                        router.replace({ pathname: '/(student)/practice/exam/result', params: { attemptId: String(activeAttemptId) } });
                      } catch {
                        // Nếu submit lỗi, vẫn thoát về màn hình chính
                        router.back();
                      }
                    } else {
                      router.back();
                    }
                  }
                }}
                style={[styles.submitModalBtn, { backgroundColor: isPracticeMode ? '#0284C7' : '#EF4444' }]}
              >
                <Text style={styles.submitModalBtnText}>
                  {isPracticeMode ? 'Lưu & Thoát' : (submitAttempt.isPending ? 'Đang lưu...' : 'Lưu & Thoát')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12, backgroundColor: '#F8FAFC' },
  loadingTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  loadingText: { color: colors.textSoft, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  loadingButton: { marginTop: 8, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12 },
  loadingButtonText: { color: '#FFFFFF', fontWeight: '800' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: font.family,
    marginHorizontal: 8,
  },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: font.family,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header Center (title + mode badge)
  headerCenterWrap: { flex: 1, alignItems: 'center', gap: 3 },
  headerExamTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: font.family,
    maxWidth: 200,
    textAlign: 'center',
  },
  headerModePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  headerModePillExam: { backgroundColor: '#FEE2E2' },
  headerModePillPractice: { backgroundColor: '#D1FAE5' },
  headerModePillText: { fontSize: 10, fontWeight: '700' },
  headerModePillTextExam: { color: '#DC2626' },
  headerModePillTextPractice: { color: '#059669' },

  // Timer text for practice mode (answered/total count)
  timerTextPractice: { fontSize: 13, fontWeight: '700', color: colors.primary, fontFamily: font.family },

  // Sub-header part label
  partLabelContainer: { flex: 1, alignItems: 'flex-end' },

  // Wrong-only mode top banner
  wrongOnlyHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  wrongOnlyBannerText: { fontSize: 12, fontWeight: '700', color: '#C2410C', flex: 1 },

  // Subheader & Progress

  subHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subHeaderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionNumberBadge: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  questionNumberBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: font.family,
  },
  subHeaderPartTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: font.family,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E3A5F',
    borderRadius: 2,
  },

  // Scroll Body
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },

  // Part 1 Photo
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
  },
  photoWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    height: 210,
    backgroundColor: '#0F172A',
  },
  photoImage: { width: '100%', height: '100%' },
  photoTagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Audio Box Common
  audioPlayerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  audioPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTimelineWrap: { flex: 1, gap: 4 },
  audioTimeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  audioTimeText: { fontSize: 11, color: '#64748B', fontWeight: '600', fontFamily: font.family },
  audioSliderTrack: {
    height: 6,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  audioSliderFill: { height: '100%', backgroundColor: '#1E3A5F', borderRadius: 3 },
  audioFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  audioEtsNotice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0284C7' },
  audioNoticeText: { fontSize: 11, color: '#0284C7', fontWeight: '600' },
  etsStandardTag: { fontSize: 11, color: '#475569', fontWeight: '700' },

  instructionWrap: { gap: 4, paddingHorizontal: 4 },
  instructionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', fontFamily: font.family },
  instructionSub: { fontSize: 13, color: '#475569', lineHeight: 18, fontFamily: font.family },

  // Part 2 Audio Card
  part2AudioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  audioPillRow: { flexDirection: 'row', gap: 8 },
  audioActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  audioActivePillText: { fontSize: 11.5, fontWeight: '700', color: '#0284C7' },
  soundWavePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    justifyContent: 'center',
  },
  soundWaveText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  etsSubNotice: { fontSize: 11, color: '#64748B', textAlign: 'center' },

  // Part 3 & 4 Audio Card with Waveform
  audioGroupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  audioCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waveformPlayerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  waveControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  audioPlayButtonLarge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformBarsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    justifyContent: 'space-between',
  },
  waveformBar: { width: 3, borderRadius: 2 },
  waveformBarActive: { backgroundColor: '#1E3A5F' },
  waveformBarInactive: { backgroundColor: '#CBD5E1' },
  etsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
  },
  etsInfoBoxText: { fontSize: 11, color: '#64748B', flex: 1, lineHeight: 15 },

  // Group sub-question switcher
  groupNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  groupNavTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: font.family },
  groupNavSub: { fontSize: 11, color: '#64748B' },
  groupNumberChips: { flexDirection: 'row', gap: 6 },
  groupNumberChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupNumberChipCurrent: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  groupNumberChipDone: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  groupNumberChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  groupNumberChipTextCurrent: { color: '#FFFFFF', fontWeight: '800' },
  groupNumberChipTextDone: { color: '#0284C7', fontWeight: '700' },

  // Part 6 & 7 Reading Passage Card
  passageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  passageHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passageHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', fontFamily: font.family },
  passageHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passageActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passageContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  emailHeadersBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  emailHeaderLine: { flexDirection: 'row', gap: 6 },
  emailHeaderLabel: { fontSize: 11.5, fontWeight: '700', color: '#64748B', width: 55 },
  emailHeaderValue: { fontSize: 11.5, color: '#1E293B', flex: 1, fontWeight: '500' },
  emailHeaderSubject: { fontSize: 12, fontWeight: '800', color: '#0369A1', flex: 1 },
  passageParagraphs: { gap: 10 },
  passageParagraphText: { fontSize: 13, color: '#334155', lineHeight: 20, fontFamily: font.family },
  passageParagraphTextLarge: { fontSize: 14.5, color: '#1E293B', lineHeight: 23, fontFamily: font.family },

  readingGroupNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  readingSharedLabel: { fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: '700' },
  readingGroupName: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: font.family },

  // Question Card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  questionCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ttsButtonText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookmarkButtonActive: { backgroundColor: '#FEF3C7' },
  bookmarkButtonText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  bookmarkButtonTextActive: { color: '#B45309', fontWeight: '700' },
  mainQuestionText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    fontFamily: font.family,
  },

  // Options List (Chuẩn mobile: Full width, xếp dọc)
  optionsList: { gap: 10 },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A5F',
  },
  optionKeyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionKeyCircleSelected: {
    backgroundColor: '#1E3A5F',
  },
  optionKeyText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  optionKeyTextSelected: { color: '#FFFFFF' },
  optionContentWrap: { flex: 1, gap: 2 },
  optionLabelText: { fontSize: 15, fontWeight: '600', color: '#1E293B', fontFamily: font.family },
  optionLabelTextSelected: { fontWeight: '800', color: '#0F172A' },
  optionSubLabelText: { fontSize: 12, color: '#64748B' },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: { borderColor: '#1E3A5F' },
  radioCircleRevealedCorrect: { borderColor: '#16A34A' },
  radioCircleRevealedWrong: { borderColor: '#EF4444' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E3A5F' },

  // Practice mode: revealed correct/wrong option cards
  optionCardRevealedCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  optionCardRevealedWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionKeyCircleRevealedCorrect: { backgroundColor: '#16A34A' },
  optionKeyCircleRevealedWrong: { backgroundColor: '#EF4444' },
  optionLabelTextRevealedCorrect: { color: '#15803D', fontWeight: '700' },
  optionLabelTextRevealedWrong: { color: '#DC2626', fontWeight: '700' },

  revealedListeningTextBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    gap: 6,
  },
  revealedListeningTextTitle: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  revealedListeningTextLine: { fontSize: 14, color: '#1E293B', lineHeight: 21, fontFamily: font.family },

  // Practice Mode: Cluster Check Control Box
  clusterControlBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    gap: 10,
  },
  clusterStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clusterStatusText: { fontSize: 13, fontWeight: '600', color: '#0369A1', flex: 1 },
  btnCheckCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnCheckClusterText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: font.family },
  clusterHintText: { fontSize: 12.5, color: '#64748B', textAlign: 'center', lineHeight: 18 },

  // Practice Mode: Feedback Card (after reveal)
  practiceFeedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  feedbackHeaderCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feedbackHeaderWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackTitleCorrect: { fontSize: 14, fontWeight: '800', color: '#15803D', flex: 1, fontFamily: font.family },
  feedbackTitleWrong: { fontSize: 14, fontWeight: '800', color: '#DC2626', flex: 1, fontFamily: font.family },

  // Wrong-only mode resolved banner
  resolvedWrongBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolvedWrongBannerText: { fontSize: 12.5, fontWeight: '700', color: '#15803D', flex: 1 },

  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Transcript & Explanation areas
  transcriptWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  transcriptHeading: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
  transcriptBody: { fontSize: 13, color: '#334155', lineHeight: 20, fontFamily: font.family },

  translationWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  translationHeading: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  translationList: { gap: 5 },
  translationBody: { fontSize: 13, color: '#334155', lineHeight: 20, fontFamily: font.family },
  translationKey: { fontWeight: '800', color: '#1E3A5F' },
  translationEmpty: { fontSize: 12.5, color: '#64748B', fontStyle: 'italic' },
  translationQuestionRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 2,
  },
  translationQuestionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  translationQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    fontFamily: font.family,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  translateButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  translateButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    fontFamily: font.family,
  },
  translateButtonTextActive: {
    color: colors.primary,
  },
  questionTranslationBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  questionTranslationText: {
    flex: 1,
    fontSize: 13.5,
    color: '#1D4ED8',
    fontStyle: 'italic',
    lineHeight: 19,
    fontFamily: font.family,
  },
  optionTranslationText: {
    fontSize: 12.5,
    color: '#1D4ED8',
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 17,
    fontFamily: font.family,
  },

  explanationWrap: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  explanationHeading: { fontSize: 11, fontWeight: '800', color: '#92400E', textTransform: 'uppercase' },
  explanationBody: { fontSize: 13, color: '#78350F', lineHeight: 20, fontFamily: font.family },

  // Practice Mode: "Next Question" button inside feedback card
  btnNextQuestionPractice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A5F',
    paddingVertical: 13,
    borderRadius: 14,
  },
  btnNextQuestionPracticeText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: font.family },

  // Pressed feedback
  pressed: { opacity: 0.75 },

  // Bottom Helper
  bottomHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  flagHelpBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flagHelpText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  tapNotice: { flexDirection: 'row', alignItems: 'center' },
  tapNoticeText: { fontSize: 11.5, color: '#94A3B8' },

  // Bottom Navigation Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  prevButtonDisabled: { opacity: 0.4 },
  prevButtonText: { fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: font.family },
  prevButtonTextDisabled: { color: '#94A3B8' },

  quickGridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
  },
  quickGridText: { fontSize: 12.5, fontWeight: '800', color: '#0284C7', fontFamily: font.family },

  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1E3A5F',
  },
  nextButtonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: font.family },

  // Modals Common
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', fontFamily: font.family },
  modalSubTitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { flex: 1, paddingTop: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gridModalSheet: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  gridMatrixWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  matrixCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixCellAnswered: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  matrixCellBookmarked: { borderColor: '#F59E0B', borderWidth: 2 },
  matrixCellCurrent: { borderWidth: 2.5, borderColor: '#0284C7' },
  matrixCellText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  matrixCellTextAnswered: { color: '#FFFFFF', fontWeight: '800' },
  matrixCellTextBookmarked: { color: '#D97706', fontWeight: '800' },
  matrixCellTextCurrent: { color: '#0284C7', fontWeight: '800' },
  matrixCellPartSub: { fontSize: 9, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  matrixCellPartSubAnswered: { color: '#BAE6FD' },
  matrixCellPartSubCurrent: { color: '#0284C7' },

  modalSubmitButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSubmitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  confirmBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  confirmIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  confirmTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', fontFamily: font.family },
  confirmSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  submitStatsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitStatCol: { alignItems: 'center', flex: 1 },
  submitStatNumGreen: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  submitStatNumOrange: { fontSize: 20, fontWeight: '800', color: '#EA580C' },
  submitStatNumYellow: { fontSize: 20, fontWeight: '800', color: '#D97706' },
  submitStatLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  submitStatDivider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  confirmButtonRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelModalBtnText: { fontSize: 13.5, fontWeight: '700', color: '#334155' },
  submitModalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
  },
  submitModalBtnText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },
});
