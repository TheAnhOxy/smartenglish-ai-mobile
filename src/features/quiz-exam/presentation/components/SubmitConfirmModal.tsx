import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  X,
  FileCheck,
  Check,
  Circle,
  Bookmark,
  AlertTriangle,
  Send,
  ArrowRight,
} from 'lucide-react-native';
import { colors } from '../../../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  bookmarkedCount: number;
  onConfirmSubmit: () => void;
  onViewUnanswered: () => void;
}

export function SubmitConfirmModal({
  visible,
  onClose,
  totalQuestions,
  answeredCount,
  unansweredCount,
  bookmarkedCount,
  onConfirmSubmit,
  onViewUnanswered,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.dialogCard}>
          {/* Close X Button */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <X size={18} color="#64748B" />
          </Pressable>

          {/* Central Document Icon Badge */}
          <View style={styles.iconCircle}>
            <FileCheck size={32} color="#1A4B84" strokeWidth={2} />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.dialogTitle}>Bạn muốn nộp bài?</Text>
          <Text style={styles.dialogSubtitle}>
            Sau khi nộp, bạn không thể thay đổi câu trả lời.
          </Text>

          {/* 3 Summary Stats Cards */}
          <View style={styles.statsRow}>
            {/* Đã làm */}
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {answeredCount}/{totalQuestions}
              </Text>
              <View style={styles.statLabelRow}>
                <Check size={13} color="#15803D" strokeWidth={2.5} />
                <Text style={styles.statLabel}>Đã làm</Text>
              </View>
            </View>

            {/* Bỏ trống */}
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.statValueOrange]}>
                {unansweredCount}
              </Text>
              <View style={styles.statLabelRow}>
                <Circle size={12} color="#D97706" strokeWidth={2.5} />
                <Text style={styles.statLabel}>Bỏ trống</Text>
              </View>
            </View>

            {/* Đánh dấu */}
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{bookmarkedCount}</Text>
              <View style={styles.statLabelRow}>
                <Bookmark size={12} color="#1D4ED8" fill="#1D4ED8" />
                <Text style={styles.statLabel}>Đánh dấu</Text>
              </View>
            </View>
          </View>

          {/* Warning Banner (if unanswered > 0) */}
          {unansweredCount > 0 && (
            <View style={styles.warningBanner}>
              <AlertTriangle size={18} color="#B45309" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                Bạn vẫn còn <Text style={styles.warningBold}>{unansweredCount} câu chưa trả lời</Text>. Điểm số sẽ tính trên toàn bộ {totalQuestions} câu hỏi.
              </Text>
            </View>
          )}

          {/* Action Buttons Group */}
          <View style={styles.actionsContainer}>
            {/* Primary Submit */}
            <Pressable
              onPress={onConfirmSubmit}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
            >
              <Text style={styles.submitBtnText}>Nộp bài</Text>
              <Send size={15} color="#FFFFFF" style={styles.submitIcon} />
            </Pressable>

            {/* Secondary Continue */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
            >
              <Text style={styles.continueBtnText}>Tiếp tục làm bài</Text>
            </Pressable>

            {/* Text Link: Xem các câu chưa trả lời */}
            {unansweredCount > 0 && (
              <Pressable
                onPress={() => {
                  onClose();
                  onViewUnanswered();
                }}
                style={({ pressed }) => [styles.viewUnansweredBtn, pressed && styles.pressed]}
              >
                <Text style={styles.viewUnansweredText}>Xem các câu chưa trả lời</Text>
                <ArrowRight size={14} color="#144173" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F3D6B',
    marginBottom: 4,
  },
  statValueOrange: {
    color: '#D97706',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 18,
    width: '100%',
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    color: '#854D0E',
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: '700',
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#143D6D',
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitIcon: {
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 16,
    width: '100%',
  },
  continueBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  viewUnansweredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    marginTop: 2,
  },
  viewUnansweredText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#144173',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
