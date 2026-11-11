import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, ClipboardCheck, Clock, Lock } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { AuthButton } from '@/src/features/auth/presentation/components/AuthUI';
import { BackButton } from '@/src/core/components/BackButton';

const INFO = [
  { Icon: Clock, text: 'Khoảng 3 phút' },
  { Icon: Lock, text: 'Không quay lại câu trước' },
  { Icon: BarChart2, text: 'Có kết quả CEFR ngay' },
];

export const PlacementIntroScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-surface dark:bg-darkBg px-6"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
    >
      <BackButton onPress={() => router.back()} />

      <View className="flex-1 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
          <ClipboardCheck size={34} color={AppColors.primary} />
        </View>
        <Text className="text-2xl font-bold text-neutralInk dark:text-white mb-6">Kiểm tra trình độ</Text>

        <View className="w-full bg-white dark:bg-darkCard rounded-2xl border border-gray-100 dark:border-gray-800">
          {INFO.map(({ Icon, text }, i) => (
            <View
              key={text}
              className={`flex-row items-center px-4 py-3.5 ${i < INFO.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <Icon size={16} color={AppColors.primary} />
              <Text className="text-sm text-neutralInk dark:text-white ml-3">{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <AuthButton label="Bắt đầu" onPress={() => router.push('/(auth)/placement-test')} />
    </View>
  );
};
