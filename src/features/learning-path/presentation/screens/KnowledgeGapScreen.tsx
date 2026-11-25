import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useKnowledgeGapQuery } from '../../application/useKnowledgeGap';
import { SkillGapItem } from '../../data/knowledgeGapApi';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/core/components/BackButton';
import { AlertTriangle, Target } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { dk, isDarkTheme } from '@/src/theme/themeMode';

export const KnowledgeGapScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: gaps, isLoading, isError, refetch } = useKnowledgeGapQuery();
  const [selectedItem, setSelectedItem] = useState<SkillGapItem | null>(null);

  const getMasteryColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-error text-white'; // Rất yếu (Coral Red)
      case 2:
        return 'bg-warning text-white'; // Yếu (Amber)
      case 3:
        return 'bg-yellow-400 text-neutralInk'; // Trung bình (Yellow)
      case 4:
        return 'bg-teal-500 text-white'; // Khá (Teal)
      case 5:
        return 'bg-success text-white'; // Giỏi (Leaf Green)
      default:
        return 'bg-gray-200 text-neutralInk';
    }
  };

  const gapList: SkillGapItem[] = Array.isArray(gaps) ? gaps : [];

  return (
    <View style={{ paddingTop: insets.top + 8 }} className="flex-1 bg-surface px-6 justify-between pb-10 dark:bg-darkBg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackButton style={{ marginBottom: 16 }} />

        <Text className="text-2xl font-bold text-neutralInk mb-1 dark:text-darkInk">Ma Trận Lỗ Hổng Kiến Thức</Text>
        <Text className="text-xs text-neutralGray mb-6 dark:text-darkMuted">Chẩn đoán điểm yếu ngữ pháp & từ vựng cần ưu tiên luyện tập</Text>

        {/* Legend */}
        <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-6 flex-row justify-between items-center shadow-sm dark:bg-darkCard dark:border-darkLine">
          <Text className="text-xs font-bold text-neutralInk dark:text-darkInk">Bậc Thành Thạo:</Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-4 h-4 rounded bg-error items-center justify-center"><Text className="text-[8px] text-white font-bold">1</Text></View>
            <View className="w-4 h-4 rounded bg-warning items-center justify-center"><Text className="text-[8px] text-white font-bold">2</Text></View>
            <View className="w-4 h-4 rounded bg-yellow-400 items-center justify-center"><Text className="text-[8px] text-neutralInk font-bold dark:text-darkInk">3</Text></View>
            <View className="w-4 h-4 rounded bg-teal-500 items-center justify-center"><Text className="text-[8px] text-white font-bold">4</Text></View>
            <View className="w-4 h-4 rounded bg-success items-center justify-center"><Text className="text-[8px] text-white font-bold">5</Text></View>
          </View>
        </View>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={dk('#0F7173', 'text')} size="large" />
            <Text className="text-xs text-neutralGray mt-3 font-medium dark:text-darkMuted">Đang chẩn đoán kỹ năng...</Text>
          </View>
        ) : isError ? (
          <View className="bg-cardWhite p-6 rounded-2xl border border-red-100 items-center shadow-sm dark:bg-darkCard">
            <View className="mb-2"><AlertTriangle size={30} color={AppColors.warning} /></View>
            <Text className="text-base font-bold text-neutralInk mb-1 dark:text-darkInk">Không Thể Tải Báo Cáo</Text>
            <Text className="text-xs text-neutralGray text-center mb-4 leading-5 px-2 dark:text-darkMuted">
              Đã có lỗi xảy ra trong quá trình kết nối với máy chủ phân tích kỹ năng.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="bg-primary px-5 py-2.5 rounded-xl active:bg-primaryDark"
            >
              <Text className="text-white font-bold text-xs">Thử lại</Text>
            </Pressable>
          </View>
        ) : gapList.length === 0 ? (
          <View className="bg-cardWhite p-6 rounded-2xl border border-gray-100 items-center shadow-sm dark:bg-darkCard dark:border-darkLine">
            <View className="mb-3"><Target size={36} color={AppColors.primary} /></View>
            <Text className="text-base font-bold text-neutralInk mb-1 dark:text-darkInk">Chưa Đủ Dữ Liệu Phân Tích</Text>
            <Text className="text-xs text-neutralGray text-center mb-4 leading-5 px-3 dark:text-darkMuted">
              Bạn chưa có bài nộp kiểm tra nào được ghi nhận. Hãy hoàn thành ít nhất 1 bài thi để AI chẩn đoán chính xác lỗ hổng ngữ pháp và từ vựng của bạn.
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/(student)/learn', params: { tab: 'quiz' } } as never)}
              className="bg-primary px-5 py-2.5 rounded-xl active:bg-primaryDark"
            >
              <Text className="text-white font-bold text-xs">Làm bài kiểm tra ngay</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {gapList.map((item: SkillGapItem) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
                className={`bg-cardWhite p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center shadow-sm dark:bg-darkCard dark:border-darkLine ${isDarkTheme() ? 'active:bg-[#2B4C7E]' : 'active:bg-gray-50'}`}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-[10px] uppercase font-bold text-neutralGray mb-0.5 dark:text-darkMuted">{item.category}</Text>
                  <Text className="text-sm font-bold text-neutralInk dark:text-darkInk">{item.name}</Text>
                  <Text className="text-xs text-error font-medium mt-1">Đã sai {item.wrongCount} lần gần đây</Text>
                </View>

                {/* Level Badge */}
                <View className={`px-3 py-1.5 rounded-xl ${getMasteryColor(item.masteryLevel)}`}>
                  <Text className="text-xs font-bold">Bậc {item.masteryLevel}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100 dark:bg-darkCard dark:border-darkLine">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

            <Text className="text-xs uppercase font-bold text-secondary mb-1">{selectedItem?.category}</Text>
            <Text className="text-xl font-bold text-neutralInk mb-2 dark:text-darkInk">{selectedItem?.name}</Text>
            <Text className="text-xs text-neutralGray mb-4 dark:text-darkMuted">Các lỗi sai tiêu biểu đã ghi nhận:</Text>

            <View className="bg-surface p-4 rounded-xl mb-6 gap-2 border border-gray-200 dark:bg-darkBg dark:border-darkLine">
              {selectedItem?.wrongWords?.map((w: string, idx: number) => (
                <View key={idx} className="flex-row items-center gap-2">
                  <Text className="text-error font-bold text-xs">•</Text>
                  <Text className="text-xs font-semibold text-neutralInk dark:text-darkInk">{w}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => {
                setSelectedItem(null);
                router.push({ pathname: '/(student)/learn', params: { tab: 'quiz' } } as never);
              }}
              className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark"
            >
              <Text className="text-white font-bold text-base">Luyện Tập Khắc Phục Ngay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
