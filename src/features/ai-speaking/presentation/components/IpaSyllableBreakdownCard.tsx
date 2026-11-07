import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle2, HelpCircle, Sparkles } from 'lucide-react-native';
import { SyllableEvaluation } from '../../data/speakingApi';
import { MouthShapeGuideModal } from '../screens/MouthShapeGuideModal';

interface IpaSyllableBreakdownCardProps {
  syllables?: SyllableEvaluation[];
  targetWord: string;
  targetIpa: string;
  mouthShapeGuide?: string;
  onOpenMouthGuide?: () => void;
}

export const IpaSyllableBreakdownCard: React.FC<IpaSyllableBreakdownCardProps> = ({
  syllables = [],
  targetWord,
  targetIpa,
  mouthShapeGuide,
  onOpenMouthGuide,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSyllable, setSelectedSyllable] = useState<SyllableEvaluation | null>(null);

  const errorSyllables = syllables.filter((s) => !s.isCorrect);
  const hasErrors = errorSyllables.length > 0;

  const handleOpenGuide = () => {
    if (onOpenMouthGuide) {
      onOpenMouthGuide();
    } else {
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Sparkles color="#4F46E5" size={18} />
          <Text style={styles.cardTitle}>Phân tích âm tiết IPA (AI Phonemes)</Text>
        </View>
        <Pressable onPress={handleOpenGuide} style={styles.guideBadge}>
          <HelpCircle color="#4F46E5" size={13} />
          <Text style={styles.guideBadgeText}>Khẩu hình</Text>
        </Pressable>
      </View>

      <Text style={styles.cardSubtitle}>
        AI bóc tách phát âm từng âm vị. Âm tiết đọc sai được <Text style={styles.highlightRed}>tô đỏ</Text> để bạn dễ dàng điều chỉnh.
      </Text>

      {/* Syllables Pills Container */}
      <View style={styles.pillsContainer}>
        {syllables.map((item, index) => {
          const isErr = !item.isCorrect;
          return (
            <Pressable
              key={index}
              onPress={() => setSelectedSyllable(item)}
              style={[
                styles.syllablePill,
                isErr ? styles.pillError : styles.pillCorrect,
              ]}
            >
              <Text
                style={[
                  styles.syllableText,
                  isErr ? styles.textError : styles.textCorrect,
                ]}
              >
                {item.ipa}
              </Text>
              <View
                style={[
                  styles.badgeTag,
                  isErr ? styles.badgeTagError : styles.badgeTagCorrect,
                ]}
              >
                {isErr ? (
                  <Text style={styles.tagErrorText}>⚠️ {item.score}%</Text>
                ) : (
                  <Text style={styles.tagCorrectText}>✓ {item.score}%</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Chi tiết hướng dẫn sửa lỗi âm đọc sai (Thế mạnh AI) */}
      {hasErrors ? (
        <View style={styles.feedbackAlertBox}>
          <View style={styles.alertHeader}>
            <AlertCircle color="#DC2626" size={16} />
            <Text style={styles.alertTitle}>
              Cần cải thiện âm {selectedSyllable ? selectedSyllable.ipa : errorSyllables[0]?.ipa}:
            </Text>
          </View>
          <Text style={styles.alertDesc}>
            {selectedSyllable?.feedback ||
              errorSyllables[0]?.feedback ||
              'Hãy hạ hàm dưới và đặt lưỡi đúng vị trí để âm phát ra chuẩn xác hơn.'}
          </Text>
          <Pressable onPress={handleOpenGuide} style={styles.mouthBtn}>
            <Text style={styles.mouthBtnText}>Xem hướng dẫn đặt răng - môi - lưỡi 👄</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.feedbackSuccessBox}>
          <View style={styles.alertHeader}>
            <CheckCircle2 color="#059669" size={16} />
            <Text style={styles.successTitle}>Phát âm chuẩn xác 100%!</Text>
          </View>
          <Text style={styles.successDesc}>
            Toàn bộ các âm tiết và trọng âm của từ "{targetWord}" đạt chuẩn ngữ âm quốc tế.
          </Text>
        </View>
      )}

      <MouthShapeGuideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetWord={targetWord}
        targetIpa={targetIpa}
        mouthShapeGuide={mouthShapeGuide}
        mispronouncedPhoneme={selectedSyllable?.ipa || errorSyllables[0]?.ipa}
        feedback={selectedSyllable?.feedback || errorSyllables[0]?.feedback}
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
    borderColor: '#E2E8F0',
    marginTop: 14,
    shadowColor: '#0F172A',
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
    fontWeight: '800',
    color: '#0F172A',
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  guideBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  highlightRed: {
    color: '#DC2626',
    fontWeight: '700',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 14,
  },
  syllablePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 70,
  },
  pillCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pillError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 2,
  },
  syllableText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  textCorrect: {
    color: '#047857',
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
    backgroundColor: '#D1FAE5',
  },
  badgeTagError: {
    backgroundColor: '#FEE2E2',
  },
  tagCorrectText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  tagErrorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },
  feedbackAlertBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
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
    fontWeight: '800',
    color: '#BE123C',
  },
  alertDesc: {
    fontSize: 12,
    color: '#475569',
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
    borderColor: '#FDA4AF',
  },
  mouthBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  feedbackSuccessBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  successDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
});

