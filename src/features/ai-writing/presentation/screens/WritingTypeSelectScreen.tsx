import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/core/flows/authStore';

const WRITING_TYPES = [
  { id: 'essay', title: 'Bài Luận Ngắn (Essay)', desc: 'Chấm ngữ pháp & từ vựng bài luận 200–300 từ', icon: '📝' },
  { id: 'email', title: 'Email Công Sở (Business Email)', desc: 'Chấm văn phong trang trọng (Formal/Informal)', icon: '✉️' },
  { id: 'ielts_task1', title: 'IELTS Writing Task 1', desc: 'Mô tả biểu đồ, bảng biểu & quy trình', icon: '📊' },
  { id: 'ielts_task2', title: 'IELTS Writing Task 2', desc: 'Chấm chi tiết theo 4 tiêu chí IELTS Band', icon: '🎓' }
];

export const WritingTypeSelectScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const handleSelectType = (typeId: string) => {
    if (!isPremium) {
      alert('Tính năng AI Writing Checker dành riêng cho tài khoản Premium!');
      return;
    }
    router.push({
      pathname: '/(student)/practice/writing/editor' as any,
      params: { type: typeId }
    });
  };

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Trang Chủ</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">AI Writing Checker ✨</Text>
        <Text className="text-xs text-neutralGray mb-6">Chọn loại bài viết để bắt đầu kiểm tra & nâng cấp từ vựng</Text>

        {!isPremium && (
          <View className="bg-warning/10 border border-warning/30 p-4 rounded-2xl mb-6">
            <Text className="text-xs font-bold text-amber-700 mb-1">🔒 Yêu Cầu Gói Premium</Text>
            <Text className="text-xs text-neutralGray">
              Vui lòng nâng cấp tài khoản để mở khóa toàn bộ công cụ sửa lỗi & chấm điểm IELTS Writing.
            </Text>
          </View>
        )}

        <View className="gap-3">
          {WRITING_TYPES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleSelectType(item.id)}
              className="bg-cardWhite p-5 rounded-2xl border border-gray-100 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
            >
              <Text className="text-3xl">{item.icon}</Text>
              <View className="flex-1">
                <Text className="text-base font-bold text-neutralInk mb-0.5">{item.title}</Text>
                <Text className="text-xs text-neutralGray">{item.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
