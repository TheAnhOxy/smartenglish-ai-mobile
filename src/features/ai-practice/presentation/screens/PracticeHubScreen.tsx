import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronRight, MessageCircle, Mic, PenLine } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';

const MODULES: { title: string; route: Href; Icon: typeof Camera }[] = [
  { title: 'Quét ảnh học từ vựng', route: '/(student)/practice/scan', Icon: Camera },
  { title: 'Phát âm & hội thoại', route: '/(student)/practice/speaking', Icon: Mic },
  { title: 'Sửa bài viết', route: '/(student)/practice/writing', Icon: PenLine },
  { title: 'Trợ lý hỏi đáp', route: '/(student)/practice/chatbot', Icon: MessageCircle },
];

export const PracticeHubScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-darkBg px-6"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-xl font-bold text-neutralInk dark:text-white mb-5">Luyện tập</Text>
      <View className="gap-3">
        {MODULES.map(({ title, route, Icon }) => (
          <Pressable
            key={title}
            onPress={() => router.push(route)}
            className="bg-white dark:bg-darkCard p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex-row items-center active:bg-gray-50"
          >
            <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Icon size={20} color={AppColors.primary} />
            </View>
            <Text className="flex-1 text-sm font-bold text-neutralInk dark:text-white">{title}</Text>
            <ChevronRight size={16} color={AppColors.neutralGray} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};
