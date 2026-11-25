import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle2, HelpCircle } from '@/src/components/ds/icons';
import { SyllableEvaluation } from '../../data/speakingApi';
import { MouthShapeGuideModal } from '../screens/MouthShapeGuideModal';
import { dsFont } from '@/src/theme/ds';
import { dk } from '@/src/theme/themeMode';

interface IpaSyllableBreakdownCardProps {
  syllables?: SyllableEvaluation[];
  targetWord: string;
  targetIpa: string;
  /** Từ/câu AI nghe được từ bản ghi (chép mù, không biết từ mẫu). */
  heardText?: string;
  /** Điểm tổng 0–100 của lần chấm. */
  overallScore?: number;
  mouthShapeGuide?: string;
  onOpenMouthGuide?: () => void;
}

const wordsOf = (t: string) => t.toLowerCase().replace(/’/g, "'").match(/[a-z0-9']+/g) ?? [];

/** Từ mẫu có được nghe ra đúng không: mọi từ của từ mẫu xuất hiện theo thứ tự trong câu nghe được. */
const heardMatches = (target: string, heard: string) => {
  const t = wordsOf(target);
  let j = 0;
  for (const w of wordsOf(heard)) if (w === t[j]) j++;
  return t.length > 0 && j === t.length;
};

export const IpaSyllableBreakdownCard: React.FC<IpaSyllableBreakdownCardProps> = ({
  syllables = [],
  targetWord,
  targetIpa,
  heardText,
  overallScore,
  mouthShapeGuide,
  onOpenMouthGuide,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSyllable, setSelectedSyllable] = useState<SyllableEvaluation | null>(null);

  const errorSyllables = syllables.filter((s) => !s.isCorrect);
  const hasErrors = errorSyllables.length > 0;
  const heard = (heardText || '').trim();
  const wrongWord = Boolean(heard) && !heardMatches(targetWord, heard);
  // Chỉ báo "đạt" khi nghe đúng từ, không có âm sai và điểm từ 80 trở lên
  const good = !wrongWord && !hasErrors && (overallScore ?? 0) >= 80;
  const focus = selectedSyllable && !selectedSyllable.isCorrect ? selectedSyllable : errorSyllables[0];

  const handleOpenGuide = () => {
    if (onOpenMouthGuide) {
      onOpenMouthGuide();
    } else {
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>So với từ mẫu</Text>
        <Pressable onPress={handleOpenGuide} style={styles.guideBadge}>
          <HelpCircle color={dk('#0369A1', 'text')} size={13} />
          <Text style={styles.guideBadgeText}>Khẩu hình</Text>
        </Pressable>
      </View>

      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Từ mẫu</Text>
        <Text style={styles.compareValue}>
          {targetWord}
          {targetIpa ? <Text style={styles.compareIpa}>{`  ${targetIpa}`}</Text> : null}
        </Text>
      </View>
      {heard ? (
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>AI nghe được</Text>
          <Text style={[styles.compareValue, wrongWord && styles.textError]}>{heard}</Text>
        </View>
      ) : null}

      {hasErrors ? (
        <View style={styles.pillsContainer}>
          {syllables.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedSyllable(item)}
              style={[styles.syllablePill, !item.isCorrect && styles.pillError]}
            >
              <Text style={[styles.syllableText, !item.isCorrect && styles.textError]}>{item.ipa}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {wrongWord ? (
        <View style={styles.feedbackAlertBox}>
          <View style={styles.alertHeader}>
            <AlertCircle color="#DC2626" size={16} />
            <Text style={styles.alertTitle}>Chưa đọc đúng từ "{targetWord}"</Text>
          </View>
          <Text style={styles.alertDesc}>
            AI nghe thành "{heard}". Bấm "Nghe phát âm mẫu", rồi đọc lại chậm và rõ từng âm.
          </Text>
        </View>
      ) : hasErrors && focus ? (
        <View style={styles.feedbackAlertBox}>
          <View style={styles.alertHeader}>
            <AlertCircle color="#DC2626" size={16} />
            <Text style={styles.alertTitle}>Cần sửa âm {focus.ipa}</Text>
          </View>
          {focus.feedback ? <Text style={styles.alertDesc}>{focus.feedback}</Text> : null}
          <Pressable onPress={handleOpenGuide} style={styles.mouthBtn}>
            <Text style={styles.mouthBtnText}>Xem cách đặt răng, môi, lưỡi</Text>
          </Pressable>
        </View>
      ) : good ? (
        <View style={styles.statusRow}>
          <CheckCircle2 color={dk('#16A34A', 'text')} size={16} />
          <Text style={styles.successTitle}>Đọc đúng từ, AI không đánh dấu âm nào sai.</Text>
        </View>
      ) : (
        <Text style={styles.neutralText}>
          Đọc đúng từ nhưng điểm chưa cao. Xem điểm trọng âm, ngữ điệu ở trên và đọc lại.
        </Text>
      )}

      <MouthShapeGuideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetWord={targetWord}
        targetIpa={targetIpa}
        mouthShapeGuide={mouthShapeGuide}
        mispronouncedPhoneme={focus?.ipa}
        feedback={focus?.feedback}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    marginTop: 14,
    shadowColor: '#0F2A44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: dsFont.display,
    color: '#0F2A44',
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  guideBadgeText: {
    fontSize: 11,
    fontFamily: dsFont.bold,
    color: '#0369A1',
  },
  cardSubtitle: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#5B6B7F',
    lineHeight: 17,
    marginBottom: 14,
  },
  highlightRed: {
    color: '#DC2626',
    fontFamily: dsFont.bold,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  syllablePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3EAF2',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    minWidth: 56,
  },
  pillError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 2,
  },
  syllableText: {
    fontSize: 16,
    fontFamily: dsFont.display,
    color: '#0F2A44',
  },
  compareRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 6 },
  compareLabel: { width: 92, fontSize: 12, fontFamily: dsFont.bold, color: '#5B6B7F' },
  compareValue: { flex: 1, fontSize: 16, fontFamily: dsFont.display, color: '#0F2A44' },
  compareIpa: { fontSize: 13, fontFamily: dsFont.body, color: '#5B6B7F' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  neutralText: { fontFamily: dsFont.body, fontSize: 12, color: '#5B6B7F', lineHeight: 18, marginTop: 6 },
  textCorrect: {
    color: '#166534',
  },
  textError: {
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTagCorrect: {
    backgroundColor: '#DCFCE7',
  },
  badgeTagError: {
    backgroundColor: '#FEE2E2',
  },
  tagCorrectText: {
    fontSize: 10,
    fontFamily: dsFont.bold,
    color: '#166534',
  },
  tagErrorText: {
    fontSize: 10,
    fontFamily: dsFont.display,
    color: '#991B1B',
  },
  feedbackAlertBox: {
    marginTop: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: dsFont.display,
    color: '#DC2626',
  },
  alertDesc: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#5B6B7F',
    lineHeight: 18,
    marginBottom: 8,
  },
  mouthBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  mouthBtnText: {
    fontSize: 11,
    fontFamily: dsFont.bold,
    color: '#DC2626',
  },
  feedbackSuccessBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
  },
  successTitle: {
    fontSize: 13,
    fontFamily: dsFont.display,
    color: '#166534',
  },
  successDesc: {
    fontFamily: dsFont.body,
    fontSize: 12,
    color: '#5B6B7F',
    lineHeight: 17,
  },
});

