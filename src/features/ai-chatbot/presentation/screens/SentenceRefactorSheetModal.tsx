import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

interface SentenceRefactorSheetModalProps {
  visible: boolean;
  alternatives: string[];
  onClose: () => void;
}

export const SentenceRefactorSheetModal: React.FC<SentenceRefactorSheetModalProps> = ({
  visible,
  alternatives,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <Text className="text-xl font-bold text-neutralInk mb-1">Các Cách Diễn Đạt Tự Nhiên Hơn ✨</Text>
          <Text className="text-xs text-neutralGray mb-6">AI đề xuất mẫu câu giao tiếp bản xứ</Text>

          <View className="gap-3 mb-6">
            {alternatives.map((alt, idx) => (
              <View key={idx} className="bg-surface p-4 rounded-xl border border-gray-200">
                <Text className="text-xs font-bold text-secondary mb-1">Mẫu câu {idx + 1}:</Text>
                <Text className="text-sm font-medium text-neutralInk leading-5">"{alt}"</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} className="bg-primary py-3.5 rounded-xl items-center shadow-md">
            <Text className="text-white font-bold text-base">Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
