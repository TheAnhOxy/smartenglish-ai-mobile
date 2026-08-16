import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useJoinClass } from '../../application/useClassMembership';
import { useRouter } from 'expo-router';

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({ visible, onClose }) => {
  const [code, setCode] = useState('');
  const { mutate: joinClass, isPending, isError, error, reset } = useJoinClass();
  const router = useRouter();

  const handleTextChange = (text: string) => {
    setCode(text.toUpperCase());
    if (isError) reset();
  };

  const handleJoin = () => {
    if (!code || code.length < 6) return;

    joinClass(code, {
      onSuccess: (data) => {
        setCode('');
        onClose();
        router.push(`/(student)/classes/${data.class.id}` as any);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <Text className="text-xl font-bold text-neutralInk mb-1">Nhập Mã Lớp Học</Text>
          <Text className="text-xs text-neutralGray mb-6">
            Hỏi giáo viên của bạn để lấy mã lớp gồm 6–10 ký tự.
          </Text>

          {isError && (
            <View className="bg-error/10 p-3 rounded-xl mb-4 border border-error/20">
              <Text className="text-xs text-error font-medium">
                {(error as any)?.response?.data?.message || 'Mã lớp không chính xác. Vui lòng thử lại.'}
              </Text>
            </View>
          )}

          <TextInput
            value={code}
            onChangeText={handleTextChange}
            placeholder="TOEIC750K42"
            autoCapitalize="characters"
            maxLength={12}
            className="bg-surface px-4 py-4 rounded-xl text-neutralInk font-mono text-center text-xl tracking-widest border border-gray-200 mb-6"
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                setCode('');
                onClose();
              }}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
            >
              <Text className="font-semibold text-neutralInk">Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handleJoin}
              disabled={code.length < 6 || isPending}
              className={`flex-1 py-3.5 rounded-xl items-center shadow-md ${
                code.length >= 6 && !isPending ? 'bg-primary active:bg-primaryDark' : 'bg-gray-300'
              }`}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold text-base">Tham Gia</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
