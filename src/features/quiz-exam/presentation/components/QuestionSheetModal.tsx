import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  X,
  ChevronDown,
  ChevronUp,
  Headphones,
  FileText,
  Play,
  Bookmark,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface QuestionSummaryItem {
  index: number;
  questionNumber: number;
  isAnswered: boolean;
  isBookmarked: boolean;
  partKey: string; // e.g. "Part 1", "Part 2"
  partTitle: string; // e.g. "Listening • Part 1"
}

interface Props {
  visible: boolean;
  onClose: () => void;
  currentIndex: number;
  questions: QuestionSummaryItem[];
  onSelectQuestion: (index: number) => void;
  onSubmitExam: () => void;
}

export function QuestionSheetModal({
  visible,
  onClose,
  currentIndex,
  questions,
  onSelectQuestion,
  onSubmitExam,
}: Props) {
  const [collapsedParts, setCollapsedParts] = useState<Record<string, boolean>>({});

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => q.isAnswered).length;
  const bookmarkedCount = questions.filter((q) => q.isBookmarked).length;
  const remainingCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Group questions by partTitle
  const groupedParts: Record<string, QuestionSummaryItem[]> = {};
  questions.forEach((q) => {
    const key = q.partTitle || 'Phần câu hỏi';
    if (!groupedParts[key]) groupedParts[key] = [];
    groupedParts[key].push(q);
  });

  const togglePartCollapse = (partKey: string) => {
    setCollapsedParts((prev) => ({ ...prev, [partKey]: !prev[partKey] }));
  };

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.handleBar} />

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Exam Question Sheet</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Status Legend Box */}
          <View style={styles.legendBox}>
            <View style={styles.legendRow}>
              {/* Đang làm */}
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, styles.badgeCurrent]}>
                  <Text style={styles.badgeTextCurrent}>02</Text>
                </View>
                <Text style={styles.legendLabel}>Đang làm</Text>
              </View>

              {/* Đã trả lời */}
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, styles.badgeAnswered]}>
                  <Text style={styles.badgeTextAnswered}>01</Text>
                </View>
                <Text style={styles.legendLabel}>Đã trả lời</Text>
              </View>

              {/* Chưa trả lời */}
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, styles.badgeUnanswered]}>
                  <Text style={styles.badgeTextUnanswered}>04</Text>
                </View>
                <Text style={styles.legendLabel}>Chưa trả lời</Text>
              </View>

              {/* Đã đánh dấu */}
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, styles.badgeBookmarked]}>
                  <Text style={styles.badgeTextBookmarked}>05</Text>
                  <View style={styles.ribbonIndicator} />
                </View>
                <Text style={styles.legendLabel}>Đã đánh dấu</Text>
              </View>
            </View>
          </View>

          {/* Scrollable Questions Groups */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {Object.keys(groupedParts).map((partTitle) => {
              const partQuestions = groupedParts[partTitle];
              const isCollapsed = Boolean(collapsedParts[partTitle]);

              return (
                <View key={partTitle} style={styles.partCard}>
                  {/* Part Header Accordion Toggle */}
                  <Pressable
                    onPress={() => togglePartCollapse(partTitle)}
                    style={styles.partHeaderBtn}
                  >
                    <View style={styles.partHeaderLeft}>
                      <Headphones size={17} color="#1E293B" />
                      <Text style={styles.partHeaderText}>{partTitle}</Text>
                      <View style={styles.partCountBadge}>
                        <Text style={styles.partCountBadgeText}>
                          {partQuestions.length} câu
                        </Text>
                      </View>
                    </View>
                    {isCollapsed ? (
                      <ChevronDown size={18} color="#64748B" />
                    ) : (
                      <ChevronUp size={18} color="#64748B" />
                    )}
                  </Pressable>

                  {/* Questions Grid */}
                  {!isCollapsed && (
                    <View style={styles.gridContainer}>
                      {partQuestions.map((q) => {
                        const isCurrent = q.index === currentIndex;
                        const isAnswered = q.isAnswered;
                        const isBookmarked = q.isBookmarked;

                        let tileStyle = styles.tileUnanswered;
                        let textStyle = styles.tileTextUnanswered;

                        if (isCurrent) {
                          tileStyle = styles.tileCurrent;
                          textStyle = styles.tileTextCurrent;
                        } else if (isAnswered) {
                          tileStyle = styles.tileAnswered;
                          textStyle = styles.tileTextAnswered;
                        }

                        return (
                          <Pressable
                            key={q.index}
                            onPress={() => {
                              onSelectQuestion(q.index);
                              onClose();
                            }}
                            style={({ pressed }) => [
                              styles.questionTile,
                              tileStyle,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.questionTileText, textStyle]}>
                              {formatNumber(q.questionNumber)}
                            </Text>

                            {/* Bookmark Ribbon on top-right */}
                            {isBookmarked && <View style={styles.tileRibbon} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Section */}
          <View style={styles.footerContainer}>
            {/* Progress status line */}
            <View style={styles.progressStatusRow}>
              <Text style={styles.progressStatusLeft}>
                Đã hoàn thành {answeredCount}/{totalQuestions} câu
              </Text>
              <Text style={styles.progressStatusRight}>
                Còn {remainingCount} câu • {bookmarkedCount} đánh dấu
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
                ]}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.footerButtonsGroup}>
              {/* Back to practice button */}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.returnBtn, pressed && styles.pressed]}
              >
                <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.returnBtnText}>Quay lại làm bài</Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                onPress={() => {
                  onClose();
                  onSubmitExam();
                }}
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
              >
                <Text style={styles.submitBtnIcon}>📋</Text>
                <Text style={styles.submitBtnText}>Nộp bài</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.82,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  legendBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  badgeCurrent: {
    backgroundColor: '#1E3A8A',
  },
  badgeTextCurrent: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeAnswered: {
    backgroundColor: '#DBEAFE',
  },
  badgeTextAnswered: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeUnanswered: {
    backgroundColor: '#E2E8F0',
  },
  badgeTextUnanswered: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeBookmarked: {
    backgroundColor: '#DBEAFE',
  },
  badgeTextBookmarked: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  ribbonIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 8,
    backgroundColor: '#38BDF8',
    borderBottomLeftRadius: 2,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  partCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  partHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  partHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  partCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  partCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  questionTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tileCurrent: {
    backgroundColor: '#1E3A8A',
  },
  tileTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tileAnswered: {
    backgroundColor: '#DBEAFE',
  },
  tileTextAnswered: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  tileUnanswered: {
    backgroundColor: '#E2E8F0',
  },
  tileTextUnanswered: {
    color: '#334155',
    fontWeight: '700',
  },
  questionTileText: {
    fontSize: 14,
  },
  tileRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 11,
    backgroundColor: '#38BDF8',
    borderBottomLeftRadius: 3,
  },
  footerContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  progressStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatusLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressStatusRight: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F3D6B',
    borderRadius: 3,
  },
  footerButtonsGroup: {
    gap: 8,
    marginTop: 4,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#143D6D',
    paddingVertical: 14,
    borderRadius: 16,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 16,
  },
  submitBtnIcon: {
    fontSize: 14,
  },
  submitBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
