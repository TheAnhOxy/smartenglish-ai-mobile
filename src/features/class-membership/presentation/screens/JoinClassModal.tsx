import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useJoinClass } from '../../application/useClassMembership';
import { useRouter } from 'expo-router';
import { Crown } from 'lucide-react-native';

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
  isLimitReached?: boolean;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  visible,
  onClose,
  isLimitReached = false,
}) => {
  const [code, setCode] = useState('');
  const { mutate: joinClass, isPending, isError, error, reset } = useJoinClass();
  const router = useRouter();

  const handleTextChange = (text: string) => {
    setCode(text.toUpperCase());
    if (isError) reset();
  };

  const handleJoin = () => {
    if (!code || code.trim().length < 4) return;

    joinClass(code.trim(), {
      onSuccess: (data) => {
        setCode('');
        onClose();
        if (data?.class?.id) {
          router.push(`/(student)/classes/${data.class.id}` as any);
        }
      },
    });
  };

  const errorMessage =
    (error as any)?.response?.data?.message ||
    (error as any)?.message ||
    'Mã lớp không chính xác hoặc lớp đã đủ sĩ số. Vui lòng thử lại.';

  const isQuotaError =
    errorMessage.includes('tối đa 3 lớp') ||
    errorMessage.includes('PREMIUM_LIMIT_EXCEEDED') ||
    (error as any)?.response?.status === 403;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white p-6 rounded-t-3xl border-t border-gray-100 shadow-2xl">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          {/* If student reached Free limit before even entering code */}
          {isLimitReached ? (
            <View className="items-center py-2">
              <View className="w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center mb-3">
                <Text className="text-2xl">🔒</Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-1 text-center">
                Đã Đạt Giới Hạn Gói Miễn Phí
              </Text>
              <Text className="text-xs text-gray-600 text-center mb-6 leading-5 px-3">
                Tài khoản Free chỉ được tham gia tối đa <Text className="font-bold text-gray-800">3 lớp học</Text> cùng lúc. Nâng cấp lên <Text className="font-bold text-primary">Gói Học Viên Premium</Text> để tham gia không giới hạn số lớp và nhận hướng dẫn sửa bài chi tiết từ AI.
              </Text>

              <Pressable
                onPress={() => {
                  onClose();
                  router.push('/(student)/profile/premium' as any);
                }}
                className="w-full bg-amber-500 py-3.5 rounded-xl items-center shadow-md mb-3 active:bg-amber-600 flex-row justify-center gap-2"
              >
                <Crown size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text className="text-white font-bold text-base">Nâng Cấp Gói Premium Ngay</Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="w-full py-3 rounded-xl border border-gray-200 items-center"
              >
                <Text className="font-semibold text-gray-700 text-sm">Để sau</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-1">Tham Gia Lớp Học</Text>
              <Text className="text-xs text-gray-500 mb-5 leading-4">
                Nhập mã tham gia (Join Code) do giáo viên của bạn cung cấp (ví dụ: TOEIC750K42).
              </Text>

              {/* Error Alert */}
              {isError && (
                <View className="bg-rose-50 p-3.5 rounded-xl mb-4 border border-rose-200">
                  <Text className="text-xs text-rose-700 font-medium leading-4 mb-2">
                    {errorMessage}
                  </Text>
                  {isQuotaError && (
                    <Pressable
                      onPress={() => {
                        onClose();
                        router.push('/(student)/profile/premium' as any);
                      }}
                      className="bg-purple-600 py-2 px-3 rounded-lg items-center self-start flex-row gap-1.5"
                    >
                      <Crown size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Nâng Cấp Premium Ngay</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Code Input */}
              <TextInput
                value={code}
                onChangeText={handleTextChange}
                placeholder="VD: TOEIC750K42"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                maxLength={16}
                className="bg-gray-50 px-4 py-3.5 rounded-xl text-gray-900 font-mono text-center text-xl tracking-widest border border-gray-300 mb-6 font-bold"
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setCode('');
                    reset();
                    onClose();
                  }}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center active:bg-gray-50"
                >
                  <Text className="font-semibold text-gray-700">Hủy</Text>
                </Pressable>

                <Pressable
                  onPress={handleJoin}
                  disabled={code.trim().length < 4 || isPending}
                  className={`flex-1 py-3.5 rounded-xl items-center shadow-sm ${
                    code.trim().length >= 4 && !isPending
                      ? 'bg-primary active:bg-primaryDark'
                      : 'bg-gray-300'
                  }`}
                >
                  {isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-base">Vào Lớp</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
