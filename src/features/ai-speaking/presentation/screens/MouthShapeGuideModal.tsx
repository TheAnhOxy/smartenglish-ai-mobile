import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import { X, Sparkles, CheckCircle2 } from 'lucide-react-native';

export interface MouthShapeGuideModalProps {
  visible: boolean;
  onClose: () => void;
  targetWord?: string;
  targetIpa?: string;
  mouthShapeGuide?: string;
  mispronouncedPhoneme?: string;
  feedback?: string;
}

// Từ điển hướng dẫn khẩu hình chuẩn IPA tiếng Anh
const PHONEME_GUIDES: Record<string, { title: string; lips: string; tongue: string; air: string }> = {
  'θ': {
    title: 'Âm Th thổi nhẹ /θ/',
    lips: 'Môi hơi hé mở tự nhiên, không khép chặt.',
    tongue: 'Đầu lưỡi đặt nhẹ giữa hai hàm răng cửa trên và dưới.',
    air: 'Đẩy luồng hơi nhẹ qua khe hở giữa lưỡi và răng cửa trên (dây thanh không rung).',
  },
  'ð': {
    title: 'Âm Th rung /ð/',
    lips: 'Môi hé mở tự nhiên, không mím môi.',
    tongue: 'Đầu lưỡi kẹp nhẹ giữa hai hàm răng cửa.',
    air: 'Đẩy hơi đồng thời làm rung dây thanh quản (âm hữu thanh).',
  },
  'ʃ': {
    title: 'Âm S nặng /ʃ/',
    lips: 'Chu môi tròn và hơi đẩy nhẹ về phía trước.',
    tongue: 'Thân lưỡi nâng lên gần chạm ngạc cứng (vòm họng trên), hai cạnh lưỡi ép nhẹ vào răng hàm trên.',
    air: 'Đẩy luồng hơi ma sát liên tục qua kẽ răng.',
  },
  'ʒ': {
    title: 'Âm Z dày rung /ʒ/',
    lips: 'Chu môi tròn tương tự âm /ʃ/.',
    tongue: 'Thân lưỡi nâng cao về phía vòm họng.',
    air: 'Đẩy luồng khí kèm rung dây thanh quản rõ ràng.',
  },
  'tʃ': {
    title: 'Âm Ch bật /tʃ/',
    lips: 'Môi hơi chu tròn về phía trước.',
    tongue: 'Đầu lưỡi chạm ngạc cứng chặn luồng khí, sau đó hạ nhanh xuống.',
    air: 'Bật luồng khí nén dứt khoát ra ngoài (âm vô thanh).',
  },
  'dʒ': {
    title: 'Âm J rung /dʒ/',
    lips: 'Môi hơi chu nhẹ ra trước.',
    tongue: 'Đầu lưỡi chặn khí ở ngạc trên rồi bật mở dứt khoát.',
    air: 'Bật luồng khí đồng thời rung dây thanh quản.',
  },
  'æ': {
    title: 'Nguyên âm A bẹt /æ/',
    lips: 'Mở rộng miệng theo cả chiều ngang và chiều dọc.',
    tongue: 'Thân lưỡi hạ thấp chạm sàn miệng, đầu lưỡi chạm chân răng cửa dưới.',
    air: 'Phát âm dứt khoát, âm thanh nằm giữa âm /a/ và /e/.',
  },
  'iː': {
    title: 'Nguyên âm I dài /iː/',
    lips: 'Khóe miệng kéo sang hai bên như đang mỉm cười.',
    tongue: 'Thân lưỡi nâng cao về phía vòm miệng.',
    air: 'Kéo dài trường độ âm đều đặn, ổn định.',
  },
};

export const MouthShapeGuideModal: React.FC<MouthShapeGuideModalProps> = ({
  visible,
  onClose,
  targetWord,
  targetIpa,
  mouthShapeGuide,
  mispronouncedPhoneme,
  feedback,
}) => {
  // Tìm phoneme phù hợp trong từ điển
  const cleanPhoneme = (mispronouncedPhoneme || targetIpa || '').replace(/[\/\sˈˌ.]/g, '');
  let matchedGuide = Object.entries(PHONEME_GUIDES).find(([key]) => cleanPhoneme.includes(key))?.[1];

  const displayTitle = mispronouncedPhoneme
    ? `Khẩu hình âm ${mispronouncedPhoneme}`
    : targetIpa
    ? `Khẩu hình ${targetIpa} (${targetWord || 'Từ vựng'})`
    : 'Hướng dẫn khẩu hình phát âm';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.grabBar} />

          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.titleWrap}>
              <Sparkles color="#4F46E5" size={20} />
              <Text style={s.title}>{displayTitle}</Text>
            </View>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <X color="#64748B" size={18} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            {/* Hướng dẫn từ bài học (dữ liệu Backend thật) */}
            {Boolean(mouthShapeGuide) ? (
              <View style={s.guideCard}>
                <Text style={s.guideLabel}>Khẩu hình chuẩn theo giáo trình:</Text>
                <Text style={s.guideText}>{mouthShapeGuide}</Text>
              </View>
            ) : null}

            {/* Phản hồi điều chỉnh nếu có âm đọc sai */}
            {Boolean(feedback) ? (
              <View style={s.feedbackCard}>
                <Text style={s.feedbackLabel}>Lời khuyên sửa lỗi:</Text>
                <Text style={s.feedbackText}>{feedback}</Text>
              </View>
            ) : null}

            {/* Chi tiết 3 vị trí khoang miệng */}
            <View style={s.anatomySection}>
              <Text style={s.sectionHeader}>Chi tiết 3 bước định hình khoang miệng</Text>

              <View style={s.postureRow}>
                <View style={s.postureIconCircle}>
                  <Text style={s.postureEmoji}>👄</Text>
                </View>
                <View style={s.postureInfo}>
                  <Text style={s.postureTitle}>1. Độ mở của môi</Text>
                  <Text style={s.postureDesc}>
                    {matchedGuide?.lips || 'Mở tự nhiên, thư giãn cơ môi, điều chỉnh độ tròn của môi theo nguyên âm chính.'}
                  </Text>
                </View>
              </View>

              <View style={s.postureRow}>
                <View style={s.postureIconCircle}>
                  <Text style={s.postureEmoji}>👅</Text>
                </View>
                <View style={s.postureInfo}>
                  <Text style={s.postureTitle}>2. Vị trí đặt lưỡi</Text>
                  <Text style={s.postureDesc}>
                    {matchedGuide?.tongue || 'Đầu lưỡi thả lỏng, thân lưỡi nâng hoặc hạ nhẹ tùy theo phụ âm chặn luồng khí.'}
                  </Text>
                </View>
              </View>

              <View style={s.postureRow}>
                <View style={s.postureIconCircle}>
                  <Text style={s.postureEmoji}>💨</Text>
                </View>
                <View style={s.postureInfo}>
                  <Text style={s.postureTitle}>3. Điều tiết luồng hơi</Text>
                  <Text style={s.postureDesc}>
                    {matchedGuide?.air || 'Đẩy hơi đều đặn từ cơ hoành, giữ trường độ ổn định xuyên suốt âm tiết.'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <Pressable onPress={onClose} style={s.confirmBtn}>
            <CheckCircle2 color="#FFFFFF" size={18} />
            <Text style={s.confirmBtnText}>Đã hiểu & Luyện tập ngay</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  grabBar: {
    width: 44,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  guideCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  guideLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 13,
    color: '#1E1B4B',
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  anatomySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 14,
  },
  postureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  postureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postureEmoji: {
    fontSize: 18,
  },
  postureInfo: {
    flex: 1,
  },
  postureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  postureDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
