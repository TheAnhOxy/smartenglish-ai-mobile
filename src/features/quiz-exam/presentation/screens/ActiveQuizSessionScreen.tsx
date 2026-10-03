import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Grid,
  Bookmark,
  Send,
} from 'lucide-react-native';
import { FillInTheBlankView, FillInTheBlankQuestionData } from '../components/FillInTheBlankView';
import { MatchingPairsView, MatchingQuestionData } from '../components/MatchingPairsView';
import { MultipleChoiceView, MultipleChoiceQuestionData } from '../components/MultipleChoiceView';
import { ListeningPhotoView, ListeningPhotoQuestion } from '../components/ListeningPhotoView';
import { ListeningGroupView, ListeningGroupQuestion } from '../components/ListeningGroupView';
import { QuestionSheetModal, QuestionSummaryItem } from '../components/QuestionSheetModal';
import { SubmitConfirmModal } from '../components/SubmitConfirmModal';
import { colors } from '../../../../theme/colors';

export type UnifiedQuizQuestion =
  | ({ type: 'FILL_BLANK' } & FillInTheBlankQuestionData)
  | ({ type: 'MATCHING' } & MatchingQuestionData)
  | ({ type: 'MULTIPLE_CHOICE' } & MultipleChoiceQuestionData)
  | ({ type: 'LISTENING_PHOTO' } & ListeningPhotoQuestion)
  | ({ type: 'LISTENING_GROUP' } & ListeningGroupQuestion);

const SAMPLE_QUIZ_QUESTIONS: UnifiedQuizQuestion[] = [
  {
    type: 'FILL_BLANK',
    id: 'q1',
    categoryTag: '• Điền từ • Ngữ pháp B1',
    instruction: 'Điền dạng đúng của động từ vào chỗ trống để hoàn thành câu:',
    sentenceBefore: 'She has',
    blankPlaceholder: '______',
    sentenceAfter: 'in this company for five years.',
    grammarHint:
      'Dùng dạng quá khứ phân từ (Past Participle - V3/ed) của động từ "work" sau thì Hiện tại hoàn thành (Present Perfect).',
    wordBank: ['worked', 'working', 'works', 'work'],
    correctAnswer: 'worked',
  },
  {
    type: 'MATCHING',
    id: 'q2',
    categoryTag: 'Ghép nối • Từ vựng',
    instruction: 'Chạm chọn một từ bên trái, sau đó chọn nghĩa tương ứng ở cột bên phải.',
    pairs: [
      { id: '1', leftText: 'reserve', rightId: 'C', rightText: 'đặt trước' },
      { id: '2', leftText: 'postpone', rightId: 'D', rightText: 'trì hoãn' },
      { id: '3', leftText: 'enhance', rightId: 'B', rightText: 'cải thiện' },
      { id: '4', leftText: 'negotiate', rightId: 'E', rightText: 'thương lượng' },
      { id: '5', leftText: 'distribute', rightId: 'A', rightText: 'phân phối' },
    ],
    shuffledRight: [
      { id: 'A', text: 'phân phối', letter: 'A' },
      { id: 'B', text: 'cải thiện', letter: 'B' },
      { id: 'C', text: 'đặt trước', letter: 'C' },
      { id: 'D', text: 'trì hoãn', letter: 'D' },
      { id: 'E', text: 'thương lượng', letter: 'E' },
    ],
  },
  {
    type: 'MULTIPLE_CHOICE',
    id: 'q3',
    categoryTag: '• Trắc nghiệm • Từ vựng B2',
    instruction: 'Choose the word that best completes the sentence:',
    questionText: 'The project manager asked the team to _____ the final report before Friday.',
    options: [
      { key: 'A', label: 'A', text: 'finalize' },
      { key: 'B', label: 'B', text: 'generate' },
      { key: 'C', label: 'C', text: 'eliminate' },
      { key: 'D', label: 'D', text: 'navigate' },
    ],
    explanationVi: '"finalize" có nghĩa là hoàn thiện, phù hợp với ngữ cảnh hoàn thành báo cáo trước thứ Sáu.',
  },
  {
    type: 'FILL_BLANK',
    id: 'q4',
    categoryTag: '• Điền từ • Ngữ pháp B2',
    instruction: 'Điền dạng đúng của từ vào chỗ trống:',
    sentenceBefore: 'If it',
    blankPlaceholder: 'rains',
    sentenceAfter: 'tomorrow, we will postpone the outdoor event.',
    grammarHint: 'Mệnh đề If loại 1 (Conditional Type 1) diễn tả điều kiện có thể xảy ra ở hiện tại/tương lai, dùng thì Hiện tại đơn.',
    wordBank: ['rains', 'rained', 'will rain', 'raining'],
    correctAnswer: 'rains',
  },
  {
    type: 'MULTIPLE_CHOICE',
    id: 'q5',
    categoryTag: '• Trắc nghiệm • Du lịch & Dịch vụ',
    instruction: 'Chọn từ phù hợp nhất vào chỗ trống:',
    questionText: 'We need to _____ a hotel room for our business trip next month.',
    options: [
      { key: 'A', label: 'A', text: 'reserve' },
      { key: 'B', label: 'B', text: 'postpone' },
      { key: 'C', label: 'C', text: 'distribute' },
      { key: 'D', label: 'D', text: 'negotiate' },
    ],
    explanationVi: '"reserve a hotel room" có nghĩa là đặt phòng khách sạn trước.',
  },
  {
    type: 'FILL_BLANK',
    id: 'q6',
    categoryTag: '• Điền từ • Ngữ pháp A2',
    instruction: 'Điền dạng đúng của động từ to-be:',
    sentenceBefore: 'They',
    blankPlaceholder: 'are',
    sentenceAfter: 'excited about the upcoming English competition.',
    grammarHint: 'Chủ ngữ số nhiều "They" đi với động từ to be "are" ở hiện tại đơn.',
    wordBank: ['are', 'is', 'was', 'am'],
    correctAnswer: 'are',
  },
  {
    type: 'MATCHING',
    id: 'q7',
    categoryTag: 'Ghép nối • Động từ Business',
    instruction: 'Nối động từ tiếng Anh với nghĩa tiếng Việt tương ứng:',
    pairs: [
      { id: '1', leftText: 'collaborate', rightId: 'C', rightText: 'hợp tác' },
      { id: '2', leftText: 'implement', rightId: 'A', rightText: 'triển khai' },
      { id: '3', leftText: 'evaluate', rightId: 'B', rightText: 'đánh giá' },
      { id: '4', leftText: 'supervise', rightId: 'D', rightText: 'giám sát' },
    ],
    shuffledRight: [
      { id: 'A', text: 'triển khai', letter: 'A' },
      { id: 'B', text: 'đánh giá', letter: 'B' },
      { id: 'C', text: 'hợp tác', letter: 'C' },
      { id: 'D', text: 'giám sát', letter: 'D' },
    ],
  },
  {
    type: 'MULTIPLE_CHOICE',
    id: 'q8',
    categoryTag: '• Trắc nghiệm • Giới từ TOEIC',
    instruction: 'Chọn giới từ thích hợp nhất:',
    questionText: 'All employees must wear safety equipment _____ entering the construction zone.',
    options: [
      { key: 'A', label: 'A', text: 'prior to' },
      { key: 'B', label: 'B', text: 'in spite of' },
      { key: 'C', label: 'C', text: 'as well as' },
      { key: 'D', label: 'D', text: 'in case' },
    ],
    explanationVi: '"prior to" = "before", có nghĩa là trước khi làm gì đó.',
  },
  {
    type: 'FILL_BLANK',
    id: 'q9',
    categoryTag: '• Điền từ • Thành ngữ & Cụm từ',
    instruction: 'Điền từ còn thiếu vào thành ngữ:',
    sentenceBefore: 'Actions speak louder than',
    blankPlaceholder: 'words',
    sentenceAfter: '.',
    grammarHint: 'Thành ngữ quen thuộc: "Actions speak louder than words" (Hành động có ý nghĩa hơn lời nói).',
    wordBank: ['words', 'voices', 'sounds', 'speeches'],
    correctAnswer: 'words',
  },
  {
    type: 'MULTIPLE_CHOICE',
    id: 'q10',
    categoryTag: '• Trắc nghiệm • Từ vựng nâng cao',
    instruction: 'Chọn từ đồng nghĩa thích hợp:',
    questionText: 'Her presentation was exceptionally clear and _____.',
    options: [
      { key: 'A', label: 'A', text: 'concise' },
      { key: 'B', label: 'B', text: 'vague' },
      { key: 'C', label: 'C', text: 'ambiguous' },
      { key: 'D', label: 'D', text: 'redundant' },
    ],
    explanationVi: '"concise" có nghĩa là súc tích, ngắn gọn rõ ràng.',
  },
  {
    type: 'LISTENING_PHOTO',
    id: 'q11',
    questionNumber: 2,
    totalQuestions: 30,
    partName: 'Listening • Part 1',
    partNumber: 1,
    partTitle: 'Phần 1: Mô tả tranh',
    photoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
    audioDurationSeconds: 18,
    audioCurrentSeconds: 8,
    instructionTitle: 'Chọn câu mô tả đúng nhất cho bức ảnh trên.',
    instructionSub: 'Lắng nghe 4 phát biểu (A), (B), (C), (D) trong đoạn băng và chọn phương án chính xác.',
    options: [
      { key: 'A', statement: '(A) Statement A', subtext: 'Phát biểu A' },
      { key: 'B', statement: '(B) Statement B', subtext: 'Phát biểu B' },
      { key: 'C', statement: '(C) Statement C', subtext: 'Phát biểu C' },
      { key: 'D', statement: '(D) Statement D', subtext: 'Phát biểu D' },
    ],
  },
  {
    type: 'LISTENING_GROUP',
    id: 'q12',
    questionNumber: 13,
    totalQuestions: 30,
    groupRangeText: 'Nhóm câu 12–14',
    groupAudioBadge: 'Hội thoại câu 12–14',
    audioDurationSeconds: 46,
    audioCurrentSeconds: 24,
    groupSteps: [
      { number: 12, isAnswered: true },
      { number: 13, isAnswered: false },
      { number: 14, isAnswered: false },
    ],
    questionPrompt: 'Where does the conversation most likely take place?',
    options: [
      { key: 'A', text: 'At a car rental agency' },
      { key: 'B', text: 'In an electronics repair shop' },
      { key: 'C', text: 'At a hotel reception desk' },
      { key: 'D', text: 'In a corporate travel department' },
    ],
  },
];

export function ActiveQuizSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string; duration?: string }>();

  const quizTitle = params.title || 'Fill In The Blank Practice';
  const durationSeconds = params.duration ? Number(params.duration) : 900; // 15 mins default

  const questions = SAMPLE_QUIZ_QUESTIONS;
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  // User answers state (clean initial state, no fake prefilled answers)
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<Record<string, string>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Modals state
  const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitConfirmOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = questions[currentIndex];
  const currentQId = String(currentQ.id);
  const isBookmarked = bookmarkedIds.includes(currentQId);

  const toggleBookmark = () => {
    setBookmarkedIds((prev) =>
      prev.includes(currentQId)
        ? prev.filter((id) => id !== currentQId)
        : [...prev, currentQId]
    );
  };

  // Check if a question is answered
  const isQuestionAnswered = (q: UnifiedQuizQuestion): boolean => {
    if (q.type === 'FILL_BLANK') {
      return Boolean(fillBlankAnswers[q.id]?.trim());
    }
    if (q.type === 'MATCHING') {
      const matches = matchingAnswers[q.id] || {};
      return Object.keys(matches).length > 0;
    }
    if (q.type === 'MULTIPLE_CHOICE') {
      return Boolean(multipleChoiceAnswers[q.id]);
    }
    if (q.type === 'LISTENING_PHOTO' || q.type === 'LISTENING_GROUP') {
      return Boolean(listeningAnswers[q.id]);
    }
    return false;
  };

  const answeredCount = useMemo(() => {
    return questions.filter(isQuestionAnswered).length;
  }, [questions, fillBlankAnswers, matchingAnswers, multipleChoiceAnswers, listeningAnswers]);

  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Prepare Question Summary items for sheet
  const summaryItems: QuestionSummaryItem[] = useMemo(() => {
    return questions.map((q, idx) => ({
      index: idx,
      questionNumber: idx + 1,
      isAnswered: isQuestionAnswered(q),
      isBookmarked: bookmarkedIds.includes(String(q.id)),
      partKey: idx < 6 ? 'Part 1' : 'Part 2',
      partTitle: idx < 6 ? 'Listening • Part 1' : 'Listening • Part 2',
    }));
  }, [questions, fillBlankAnswers, matchingAnswers, multipleChoiceAnswers, listeningAnswers, bookmarkedIds]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsSubmitConfirmOpen(true);
    }
  };

  const handleConfirmSubmit = () => {
    setIsSubmitConfirmOpen(false);
    let realScore = 0;
    questions.forEach((q) => {
      if (q.type === 'FILL_BLANK') {
        if (fillBlankAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) {
          realScore++;
        }
      } else if (q.type === 'MATCHING') {
        const matches = matchingAnswers[q.id] || {};
        const isAllPairsCorrect = q.pairs.length > 0 && q.pairs.every((p) => matches[p.id] === p.rightId);
        if (isAllPairsCorrect) realScore++;
      } else if (q.type === 'MULTIPLE_CHOICE') {
        const chosen = multipleChoiceAnswers[q.id];
        const correctOpt = q.options?.find((opt) => (opt as any).isCorrect || opt.key === (q as any).correctKey || opt.text === (q as any).correctAnswer);
        const correctKey = (q as any).correctKey || (correctOpt ? correctOpt.key : (q.options?.[0]?.key || 'A'));
        if (chosen === correctKey) realScore++;
      } else if (q.type === 'LISTENING_PHOTO') {
        if (listeningAnswers[String(q.id)] === (q as any).correctAnswer) realScore++;
      } else if (q.type === 'LISTENING_GROUP') {
        const subQs = (q as any).subQuestions || [];
        const isGroupCorrect = subQs.length > 0 && subQs.every((sq: any) => listeningAnswers[String(sq.id)] === sq.correctAnswer);
        if (isGroupCorrect) realScore++;
      }
    });

    const incorrectCount = Math.max(0, answeredCount - realScore);
    const skippedCount = unansweredCount;

    router.replace({
      pathname: '/(student)/practice/quiz/result',
      params: {
        total: String(totalQuestions),
        score: String(realScore),
        answered: String(answeredCount),
        unanswered: String(skippedCount),
        incorrect: String(incorrectCount),
        title: quizTitle,
      },
    });
  };

  const handleExitPress = () => {
    Alert.alert(
      'Thoát bài kiểm tra',
      'Bạn có chắc chắn muốn rời khỏi bài Quiz? Tiến trình làm bài sẽ được lưu tạm.',
      [
        { text: 'Tiếp tục làm bài', style: 'cancel' },
        { text: 'Rời khỏi', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handleJumpToFirstUnanswered = () => {
    const firstUnansweredIndex = questions.findIndex((q) => !isQuestionAnswered(q));
    if (firstUnansweredIndex !== -1) {
      setCurrentIndex(firstUnansweredIndex);
    }
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        {/* Close Button */}
        <Pressable onPress={handleExitPress} style={styles.iconBtn} hitSlop={10}>
          <X size={22} color="#0F172A" />
        </Pressable>

        {/* Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quizTitle}
        </Text>

        {/* Timer Chip */}
        <View style={styles.timerBadge}>
          <Clock size={16} color="#0F3D6B" />
          <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
        </View>

        {/* Profile Avatar Icon */}
        <View style={styles.avatarIconCircle}>
          <User size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Progress Line */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.questionIndexLabel}>
            Câu {currentIndex + 1}/{totalQuestions}
          </Text>
          <Text style={styles.percentLabel}>{progressPercent}% hoàn thành</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Main Question Body */}
      <View style={styles.bodyContent}>
        {currentQ.type === 'FILL_BLANK' && (
          <FillInTheBlankView
            question={currentQ}
            userAnswer={fillBlankAnswers[currentQ.id] || ''}
            onAnswerChange={(ans) =>
              setFillBlankAnswers((prev) => ({ ...prev, [currentQ.id]: ans }))
            }
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {currentQ.type === 'MATCHING' && (
          <MatchingPairsView
            question={currentQ}
            matchedPairs={matchingAnswers[currentQ.id] || {}}
            onMatchesChange={(matches) =>
              setMatchingAnswers((prev) => ({ ...prev, [currentQ.id]: matches }))
            }
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {currentQ.type === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceView
            question={currentQ}
            selectedOption={multipleChoiceAnswers[currentQ.id]}
            onSelectOption={(key) =>
              setMultipleChoiceAnswers((prev) => ({ ...prev, [currentQ.id]: key }))
            }
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {currentQ.type === 'LISTENING_PHOTO' && (
          <ListeningPhotoView
            question={{
              ...currentQ,
              selectedKey: listeningAnswers[currentQ.id],
              isBookmarked: isBookmarked,
            }}
            onSelectOption={(key) =>
              setListeningAnswers((prev) => ({ ...prev, [currentQ.id]: key }))
            }
            onToggleBookmark={toggleBookmark}
            showFooterNav={false}
          />
        )}

        {currentQ.type === 'LISTENING_GROUP' && (
          <ListeningGroupView
            question={{
              ...currentQ,
              selectedKey: listeningAnswers[currentQ.id],
              isBookmarked: isBookmarked,
            }}
            onSelectOption={(key) =>
              setListeningAnswers((prev) => ({ ...prev, [currentQ.id]: key }))
            }
            onToggleBookmark={toggleBookmark}
            showFooterNav={false}
          />
        )}
      </View>

      {/* Bottom Navigation Toolbar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Previous Button */}
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={({ pressed }) => [
            styles.navBtnSecondary,
            currentIndex === 0 && styles.navBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft size={18} color={currentIndex === 0 ? '#94A3B8' : '#0F172A'} />
          <Text
            style={[
              styles.navBtnSecondaryText,
              currentIndex === 0 && styles.navBtnDisabledText,
            ]}
          >
            Câu trước
          </Text>
        </Pressable>

        {/* Question Palette Sheet Button */}
        <Pressable
          onPress={() => setIsQuestionSheetOpen(true)}
          style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Grid size={20} color="#0F3D6B" />
        </Pressable>

        {/* Bookmark Quick Toggle */}
        <Pressable
          onPress={toggleBookmark}
          style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Bookmark
            size={20}
            color={isBookmarked ? '#1A4B84' : '#64748B'}
            fill={isBookmarked ? '#1A4B84' : 'transparent'}
          />
        </Pressable>

        {/* Next / Submit Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.navBtnPrimary,
            currentIndex === totalQuestions - 1 && styles.navBtnPrimarySubmit,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.navBtnPrimaryText}>
            {currentIndex === totalQuestions - 1 ? 'Nộp bài' : 'Tiếp'}
          </Text>
          {currentIndex === totalQuestions - 1 ? (
            <Send size={15} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
          ) : (
            <ChevronRight size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* Exam Question Sheet Modal (Image 4) */}
      <QuestionSheetModal
        visible={isQuestionSheetOpen}
        onClose={() => setIsQuestionSheetOpen(false)}
        currentIndex={currentIndex}
        questions={summaryItems}
        onSelectQuestion={(idx) => setCurrentIndex(idx)}
        onSubmitExam={() => setIsSubmitConfirmOpen(true)}
      />

      {/* Submit Confirmation Modal (Image 5) */}
      <SubmitConfirmModal
        visible={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        bookmarkedCount={bookmarkedIds.length}
        onConfirmSubmit={handleConfirmSubmit}
        onViewUnanswered={handleJumpToFirstUnanswered}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF5FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F3D6B',
  },
  avatarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F3D6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionIndexLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  percentLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A4B84',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F3D6B',
    borderRadius: 2,
  },
  bodyContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  navBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  navBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnDisabledText: {
    color: '#94A3B8',
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F3D6B',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  navBtnPrimarySubmit: {
    backgroundColor: '#1E3A8A',
  },
  navBtnPrimaryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
