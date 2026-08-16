import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useKnowledgeGapQuery } from '../../application/useKnowledgeGap';
import { SkillGapItem } from '../../data/knowledgeGapApi';
import { useRouter } from 'expo-router';

export const KnowledgeGapScreen = () => {
  const router = useRouter();
  const { data: gaps, isLoading } = useKnowledgeGapQuery();
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

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Trang Chủ</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">Ma Trận Lỗ Hổng Kiến Thức</Text>
        <Text className="text-xs text-neutralGray mb-6">Chẩn đoán điểm yếu ngữ pháp & từ vựng cần ưu tiên luyện tập</Text>

        {/* Legend */}
        <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-6 flex-row justify-between items-center shadow-sm">
          <Text className="text-xs font-bold text-neutralInk">Bậc Thành Thạo:</Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-4 h-4 rounded bg-error items-center justify-center"><Text className="text-[8px] text-white font-bold">1</Text></View>
            <View className="w-4 h-4 rounded bg-warning items-center justify-center"><Text className="text-[8px] text-white font-bold">2</Text></View>
            <View className="w-4 h-4 rounded bg-yellow-400 items-center justify-center"><Text className="text-[8px] text-neutralInk font-bold">3</Text></View>
            <View className="w-4 h-4 rounded bg-teal-500 items-center justify-center"><Text className="text-[8px] text-white font-bold">4</Text></View>
            <View className="w-4 h-4 rounded bg-success items-center justify-center"><Text className="text-[8px] text-white font-bold">5</Text></View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#0F7173" size="large" />
        ) : (
          <View className="gap-3">
            {(gaps || []).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
                className="bg-cardWhite p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center shadow-sm active:bg-gray-50"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-[10px] uppercase font-bold text-neutralGray mb-0.5">{item.category}</Text>
                  <Text className="text-sm font-bold text-neutralInk">{item.name}</Text>
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
          <View className="bg-cardWhite p-6 rounded-t-3xl border-t border-gray-100">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

            <Text className="text-xs uppercase font-bold text-secondary mb-1">{selectedItem?.category}</Text>
            <Text className="text-xl font-bold text-neutralInk mb-2">{selectedItem?.name}</Text>
            <Text className="text-xs text-neutralGray mb-4">Các lỗi sai tiêu biểu đã ghi nhận:</Text>

            <View className="bg-surface p-4 rounded-xl mb-6 gap-2 border border-gray-200">
              {selectedItem?.wrongWords.map((w, idx) => (
                <View key={idx} className="flex-row items-center gap-2">
                  <Text className="text-error font-bold text-xs">•</Text>
                  <Text className="text-xs font-semibold text-neutralInk">{w}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => {
                setSelectedItem(null);
                router.push('/(student)/practice' as any);
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
