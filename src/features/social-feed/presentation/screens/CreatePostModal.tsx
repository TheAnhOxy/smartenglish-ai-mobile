import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal } from 'react-native';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
  const [content, setContent] = useState('');

  const handlePost = () => {
    alert('Đã chia sẻ bài viết lên cộng đồng thành công!');
    setContent('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <Text className="text-xl font-bold text-neutralInk mb-1">Chia Sẻ Cột Mốc Học Tập ✨</Text>
          <Text className="text-xs text-neutralGray mb-4">Đăng bài viết truyền cảm hứng cho cộng đồng SmartEnglish</Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            placeholder="Viết suy nghĩ hoặc trải nghiệm học tập của bạn tại đây..."
            className="bg-surface p-4 rounded-xl border border-gray-200 text-neutralInk text-sm mb-6 h-28"
          />

          <View className="flex-row gap-3">
            <Pressable onPress={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center">
              <Text className="font-semibold text-neutralInk">Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handlePost}
              disabled={!content.trim()}
              className={`flex-1 py-3.5 rounded-xl items-center shadow-md ${
                content.trim() ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-bold text-base">Đăng Ngay</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
