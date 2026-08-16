import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

interface MouthShapeGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MouthShapeGuideModal: React.FC<MouthShapeGuideModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-darkCard p-6 rounded-t-3xl border-t border-gray-800">
          <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-4" />

          <Text className="text-xl font-bold text-white mb-1">Hướng Dẫn Khẩu Hình Khoang Miệng /ʃ/</Text>
          <Text className="text-xs text-gray-400 mb-6">Mô phỏng vị trí đặt lưỡi & luồng hơi chuẩn giọng Mỹ</Text>

          <View className="w-full h-48 bg-black/40 rounded-2xl items-center justify-center border border-gray-700 mb-6">
            <Text className="text-6xl mb-2">👄</Text>
            <Text className="text-xs text-gray-300 text-center px-6">
              Chu tròn môi ra phía trước, cuống lưỡi nâng nhẹ chạm vòm họng trên, đẩy luồng hơi nhẹ qua kẽ răng.
            </Text>
          </View>

          <Pressable onPress={onClose} className="bg-primary py-3.5 rounded-xl items-center shadow-md">
            <Text className="text-white font-bold text-base">Đã Hiểu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
