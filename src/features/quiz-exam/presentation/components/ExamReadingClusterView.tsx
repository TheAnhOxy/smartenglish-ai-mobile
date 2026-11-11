import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Languages,
  Sparkles,
} from '@/src/components/ds/icons';
import { colors } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { AnswerKey, ExamPassage, ExamQuestion } from '../../data/examAttemptApi';
import { ds, dsFont } from '@/src/theme/ds';

export interface ExamReadingClusterViewProps {
  questions: ExamQuestion[];
  passage?: ExamPassage;
  passageTitle?: string;
  groupTag?: string;
  userAnswers: Record<string, AnswerKey>;
  onSelectAnswer: (questionId: string, answer: AnswerKey) => void;
  isExamMode: boolean;
  isPracticeMode: boolean;
  revealedQuestions: Record<string, boolean>;
  isWrongOnly?: boolean;
  bookmarkedIds: string[];
  onToggleBookmark: (questionId: string) => void;
  // Practice mode translation
  currentTranslations?: Record<string, string> | null;
  showInlineTranslation?: boolean;
  isTranslating?: boolean;
  onToggleTranslate?: () => void;
}

export const ExamReadingClusterView: React.FC<ExamReadingClusterViewProps> = ({
  questions,
  passage: customPassage,
  passageTitle,
  groupTag,
  userAnswers,
  onSelectAnswer,
  isExamMode,
  isPracticeMode,
  revealedQuestions,
  bookmarkedIds,
  onToggleBookmark,
  currentTranslations,
  showInlineTranslation,
  isTranslating,
  onToggleTranslate,
}) => {
  const firstQ = questions[0] || ({} as ExamQuestion);
  const rawPassage = customPassage || firstQ.passage;
  const passageText = (firstQ as any)?.passageText || (rawPassage as any)?.text || '';
  const passage: ExamPassage | undefined = rawPassage || (passageText ? {
    title: passageTitle || (firstQ as any)?.groupRangeText || 'Văn bản đọc hiểu',
    type: 'article',
    paragraphs: passageText.includes('\n') ? passageText.split('\n').filter(Boolean) : [passageText],
  } : undefined);
  const passageParagraphs: string[] = (passage?.paragraphs && passage.paragraphs.length > 0)
    ? passage.paragraphs
    : (passageText ? passageText.split('\n').filter(Boolean) : []);
  const part = firstQ.part;
  const isMultiQuestion = questions.length > 1;

  const [isPassageExpanded, setIsPassageExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startNum = questions[0]?.questionNumber;
  const endNum = questions[questions.length - 1]?.questionNumber;
  const groupLabel = groupTag || (isMultiQuestion ? `Câu ${startNum}–${endNum}` : `Câu ${startNum}`);

  return (
    <View style={styles.container}>
      {/* ── 1. PASSAGE CARD (Bài đọc dùng chung cho cả cụm) ── */}
      {passage && (
        <View style={styles.passageCard}>
          {/* Header Bar */}
          <View style={styles.passageHeaderRow}>
            <View style={styles.passageHeaderLeft}>
              <View style={styles.passageBadge}>
                <FileText size={13} color="#166534" />
                <Text style={styles.passageBadgeText}>
                  {passage.type ? passage.type.toUpperCase() : 'VĂN BẢN'} · {groupLabel}
                </Text>
              </View>
              {passage.title || passageTitle ? (
                <Text style={styles.passageTitleText} numberOfLines={1}>
                  {passage.title || passageTitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.passageHeaderActions}>
              {/* Phóng to toàn màn hình */}
              <Pressable
                onPress={() => setIsModalOpen(true)}
                style={styles.iconBtn}
                hitSlop={6}
              >
                <Maximize2 size={16} color="#5B6B7F" />
              </Pressable>

              {/* Thu gọn / Mở rộng */}
              <Pressable
                onPress={() => setIsPassageExpanded(!isPassageExpanded)}
                style={styles.iconBtn}
                hitSlop={6}
              >
                {isPassageExpanded ? (
                  <ChevronUp size={18} color="#5B6B7F" />
                ) : (
                  <ChevronDown size={18} color="#5B6B7F" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Email Headers (nếu là dạng email) */}
          {isPassageExpanded && passage.emailHeaders && (
            <View style={styles.emailHeadersBox}>
              {passage.emailHeaders.from ? (
                <View style={styles.emailHeaderRow}>
                  <Text style={styles.emailHeaderLabel}>From:</Text>
                  <Text style={styles.emailHeaderValue}>{passage.emailHeaders.from}</Text>
                </View>
              ) : null}
              {passage.emailHeaders.to ? (
                <View style={styles.emailHeaderRow}>
                  <Text style={styles.emailHeaderLabel}>To:</Text>
                  <Text style={styles.emailHeaderValue}>{passage.emailHeaders.to}</Text>
                </View>
              ) : null}
              {passage.emailHeaders.date ? (
                <View style={styles.emailHeaderRow}>
                  <Text style={styles.emailHeaderLabel}>Date:</Text>
                  <Text style={styles.emailHeaderValue}>{passage.emailHeaders.date}</Text>
                </View>
              ) : null}
              {passage.emailHeaders.subject ? (
                <View style={styles.emailHeaderRow}>
                  <Text style={styles.emailHeaderLabel}>Subject:</Text>
                  <Text style={[styles.emailHeaderValue, { fontFamily: dsFont.bold }]}>
                    {passage.emailHeaders.subject}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Paragraphs */}
          {isPassageExpanded && passageParagraphs.length > 0 && (
            <View style={styles.paragraphsWrap}>
              {passageParagraphs.map((p, i) => (
                <Text key={i} style={styles.paragraphText}>
                  {p}
                </Text>
              ))}
            </View>
          )}

          {!isPassageExpanded && (
            <Pressable onPress={() => setIsPassageExpanded(true)} style={styles.expandPromptBtn}>
              <Text style={styles.expandPromptText}>Bấm để mở rộng bài đọc ({passageParagraphs.length} đoạn)</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── 2. MODAL PHÓNG TO BÀI ĐỌC (FULLSCREEN PASSAGE MODAL) ── */}
      {passage && (
        <Modal
          visible={isModalOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{passage.title || 'Văn bản đọc hiểu'}</Text>
                <Text style={styles.modalSubtitle}>{groupLabel}</Text>
              </View>
              <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                <X size={20} color="#0F2A44" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {passage.emailHeaders && (
                <View style={styles.emailHeadersBox}>
                  {passage.emailHeaders.from && (
                    <Text style={styles.modalEmailText}>From: {passage.emailHeaders.from}</Text>
                  )}
                  {passage.emailHeaders.to && (
                    <Text style={styles.modalEmailText}>To: {passage.emailHeaders.to}</Text>
                  )}
                  {passage.emailHeaders.subject && (
                    <Text style={[styles.modalEmailText, { fontFamily: dsFont.bold }]}>
                      Subject: {passage.emailHeaders.subject}
                    </Text>
                  )}
                </View>
              )}

              {passageParagraphs.map((p, i) => (
                <Text key={i} style={styles.modalParagraphText}>
                  {p}
                </Text>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* ── 3. DANH SÁCH TẤT CẢ CÂU HỎI TRONG BÀI ĐỌC NÀY ── */}
      <View style={styles.questionsListWrap}>
        {questions.map((q) => {
          const selectedAnswer = userAnswers[q.id];
          const isRevealed = Boolean(revealedQuestions[q.id]);
          const isBookmarked = bookmarkedIds.includes(q.id);
          const isAnswered = Boolean(selectedAnswer);

          return (
            <View key={q.id} style={styles.questionCard}>
              {/* Question Header Row */}
              <View style={styles.questionCardHeaderRow}>
                <View style={styles.qNumBadgeWrap}>
                  <View style={[styles.qNumBadge, isAnswered && styles.qNumBadgeAnswered]}>
                    <Text style={styles.qNumBadgeText}>Câu {q.questionNumber}</Text>
                  </View>
                  {q.categoryTag ? (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{q.categoryTag}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.qActionsRow}>
                  {/* Translate Button (Practice Mode) */}
                  {isPracticeMode && isRevealed && onToggleTranslate ? (
                    <Pressable
                      onPress={onToggleTranslate}
                      style={[styles.translateBtn, showInlineTranslation && styles.translateBtnActive]}
                      hitSlop={6}
                    >
                      {isTranslating ? (
                        <ActivityIndicator size="small" color={ds.btn} />
                      ) : (
                        <Languages size={13} color={showInlineTranslation ? ds.btn : '#5B6B7F'} />
                      )}
                      <Text style={[styles.translateBtnText, showInlineTranslation && styles.translateBtnTextActive]}>
                        {showInlineTranslation ? 'Ẩn dịch' : 'Dịch'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Bookmark Button */}
                  <Pressable
                    onPress={() => onToggleBookmark(q.id)}
                    style={styles.bookmarkBtn}
                    hitSlop={8}
                  >
                    <Bookmark
                      size={18}
                      color={isBookmarked ? '#F59E0B' : '#8597AB'}
                      fill={isBookmarked ? '#F59E0B' : 'transparent'}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Question Prompt Text */}
              {Boolean(q.questionText) && (
                <Text style={styles.questionPromptText}>{q.questionText}</Text>
              )}

              {/* Inline Translation nếu có */}
              {isPracticeMode && isRevealed && showInlineTranslation && currentTranslations?.question ? (
                <View style={styles.translationBox}>
                  <Languages size={12} color="#0369A1" style={{ marginTop: 2 }} />
                  <Text style={styles.translationText}>{currentTranslations.question}</Text>
                </View>
              ) : null}

              {/* Options List (A, B, C, D) */}
              <View style={styles.optionsList}>
                {(q.options || []).map((opt) => {
                  const isSelected = selectedAnswer === opt.key;
                  const isCorrectAnswer = opt.key === q.correctAnswer;
                  const isWrongSelection = isSelected && !isCorrectAnswer;

                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => onSelectAnswer(q.id, opt.key)}
                      disabled={isPracticeMode && isRevealed}
                      style={({ pressed }) => [
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        isRevealed && isCorrectAnswer && styles.optionCardRevealedCorrect,
                        isRevealed && isWrongSelection && styles.optionCardRevealedWrong,
                        pressed && styles.pressed,
                      ]}
                    >
                      {/* Circle Key */}
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

                      {/* Option Text */}
                      <View style={styles.optionContentWrap}>
                        <Text
                          style={[
                            styles.optionLabelText,
                            isSelected && styles.optionLabelTextSelected,
                            isRevealed && isCorrectAnswer && styles.optionLabelTextRevealedCorrect,
                            isRevealed && isWrongSelection && styles.optionLabelTextRevealedWrong,
                          ]}
                        >
                          {opt.label || opt.key}
                        </Text>
                        {Boolean(opt.subLabel) && (
                          <Text style={styles.optionSubLabelText}>{opt.subLabel}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Practice Mode Explanation */}
              {isPracticeMode && isRevealed && Boolean(q.explanationVi) && (
                <View style={styles.explanationBox}>
                  <View style={styles.explanationHeaderRow}>
                    <Sparkles size={14} color="#0284C7" />
                    <Text style={styles.explanationHeaderTitle}>Giải thích chi tiết</Text>
                  </View>
                  <Text style={styles.explanationText}>{q.explanationVi}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  // Passage Card
  passageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  passageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passageHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  passageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  passageBadgeText: {
    fontSize: 11,
    fontFamily: dsFont.display,
    color: '#166534',
    letterSpacing: 0.3,
  },
  passageTitleText: {
    fontSize: 14,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  passageHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#F4F7FB',
    borderRadius: 8,
  },
  emailHeadersBox: {
    backgroundColor: '#F4F7FB',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  emailHeaderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  emailHeaderLabel: {
    fontSize: 12,
    color: '#5B6B7F',
    fontFamily: dsFont.bold,
    width: 60,
  },
  emailHeaderValue: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#0F2A44',
    flex: 1,
  },
  paragraphsWrap: {
    gap: 10,
  },
  paragraphText: {
    fontFamily: dsFont.body,
    fontSize: 14,
    color: '#33465C',
    lineHeight: 22,
  },
  expandPromptBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  expandPromptText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#0284C7',
  },
  // Modal Fullscreen
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF2',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: dsFont.display,
    color: '#0F2A44',
  },
  modalSubtitle: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#5B6B7F',
  },
  closeModalBtn: {
    padding: 6,
    backgroundColor: '#F4F7FB',
    borderRadius: 999,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 14,
  },
  modalEmailText: {
    fontFamily: dsFont.body,
    fontSize: 13,
    color: '#33465C',
    lineHeight: 18,
  },
  modalParagraphText: {
    fontFamily: dsFont.body,
    fontSize: 15,
    color: '#0F2A44',
    lineHeight: 24,
  },
  // Questions List
  questionsListWrap: {
    gap: 14,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  questionCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qNumBadge: {
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  qNumBadgeAnswered: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  qNumBadgeText: {
    fontSize: 12,
    fontFamily: dsFont.display,
    color: '#0369A1',
  },
  categoryPill: {
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    color: '#5B6B7F',
    fontFamily: dsFont.semibold,
  },
  qActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookmarkBtn: {
    padding: 4,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  translateBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#93C5FD',
  },
  translateBtnText: {
    fontSize: 11,
    color: '#5B6B7F',
    fontFamily: dsFont.semibold,
  },
  translateBtnTextActive: {
    color: ds.btn,
  },
  questionPromptText: {
    fontSize: 15,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    lineHeight: 22,
  },
  translationBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  translationText: {
    fontFamily: dsFont.body,
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18,
    flex: 1,
  },
  // Options
  optionsList: {
    gap: 9,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E3EAF2',
    paddingHorizontal: 14,
    borderBottomWidth: 4,
    borderRadius: 16,
    paddingVertical: 14,
  },
  optionCardSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  optionCardRevealedCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  optionCardRevealedWrong: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  optionKeyCircle: {
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E3EAF2',
  },
  optionKeyCircleSelected: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  optionKeyCircleRevealedCorrect: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionKeyCircleRevealedWrong: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  optionKeyText: {
    fontSize: 13.5,
    fontFamily: dsFont.display,
    color: '#5B6B7F',
  },
  optionKeyTextSelected: {
    color: '#FFFFFF',
  },
  optionContentWrap: {
    flex: 1,
  },
  optionLabelText: {
    fontSize: 14,
    fontFamily: dsFont.medium,
    color: '#0F2A44',
    lineHeight: 20,
  },
  optionLabelTextSelected: {
    fontFamily: dsFont.bold,
    color: '#0F2A44',
  },
  optionLabelTextRevealedCorrect: {
    fontFamily: dsFont.bold,
    color: '#166534',
  },
  optionLabelTextRevealedWrong: {
    fontFamily: dsFont.bold,
    color: '#991B1B',
  },
  optionSubLabelText: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#5B6B7F',
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 6,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationHeaderTitle: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#166534',
  },
  explanationText: {
    fontFamily: dsFont.body,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
  },
  pressed: {
    transform: [{ scale: 0.98 }, { translateY: 2 }],
  },
});
