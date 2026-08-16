import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Activity, Sparkles, Volume2, HelpCircle } from 'lucide-react-native';
import { MouthShapeGuideModal } from './MouthShapeGuideModal';

export const IpaAnalysisScreen = () => {
  const router = useRouter();
  const [showMouthGuide, setShowMouthGuide] = useState(false);

  return (
    <View className="flex-1 bg-darkBg pt-14 px-6 justify-between pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 bg-darkCard px-3 py-2 rounded-xl border border-gray-800"
          >
            <ChevronLeft color="#FFFFFF" size={18} />
            <Text className="text-white font-semibold text-xs">Từ Đơn IPA</Text>
          </Pressable>
          <Text className="text-xs font-bold text-gray-400">Phân Tích Chuyên Sâu</Text>
        </View>

        <Text className="text-2xl font-bold text-white mb-1">4 Chỉ Số Âm Tiết IPA ⚡</Text>
        <Text className="text-xs text-gray-400 mb-6">Phân tích phát âm chi tiết bằng thuật toán nhận diện sóng âm</Text>

        {/* 4 Metrics Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="w-[47%] bg-darkCard p-4 rounded-2xl border border-gray-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-400 font-semibold">Độ Chính Xác</Text>
              <Activity color="#2ECC71" size={16} />
            </View>
            <Text className="text-2xl font-extrabold text-success">88%</Text>
            <View className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-success rounded-full" style={{ width: '88%' }} />
            </View>
          </View>

          <View className="w-[47%] bg-darkCard p-4 rounded-2xl border border-gray-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-400 font-semibold">Trọng Âm (Stress)</Text>
              <Activity color="#FFA726" size={16} />
            </View>
            <Text className="text-2xl font-extrabold text-warning">80%</Text>
            <View className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-warning rounded-full" style={{ width: '80%' }} />
            </View>
          </View>

          <View className="w-[47%] bg-darkCard p-4 rounded-2xl border border-gray-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-400 font-semibold">Ngữ Điệu</Text>
              <Activity color="#0F7173" size={16} />
            </View>
            <Text className="text-2xl font-extrabold text-secondary">84%</Text>
            <View className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-secondary rounded-full" style={{ width: '84%' }} />
            </View>
          </View>

          <View className="w-[47%] bg-darkCard p-4 rounded-2xl border border-gray-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-400 font-semibold">Trôi Chảy</Text>
              <Activity color="#2ECC71" size={16} />
            </View>
            <Text className="text-2xl font-extrabold text-success">88%</Text>
            <View className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-success rounded-full" style={{ width: '88%' }} />
            </View>
          </View>
        </View>

        {/* Phoneme Errors Highlight Box */}
        <Text className="text-sm font-bold text-white mb-3">Chi Tiết Ký Tự IPA Sai Cần Sửa</Text>
        <View className="bg-darkCard p-5 rounded-3xl border border-gray-800 mb-6 gap-4 shadow-xl">
          <Text className="text-2xl font-bold text-white text-center tracking-wider">
            /nɪˌɡoʊ.<Text className="text-error font-extrabold underline bg-error/20 px-1 rounded">ʃi</Text>ˈeɪ.ʃən/
          </Text>

          <View className="bg-error/10 p-4 rounded-2xl border border-error/30 flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-error font-bold mb-0.5">Lỗi Âm Tiết /ʃ/</Text>
              <Text className="text-[11px] text-gray-300">Cần phát âm tròn môi và cong lưỡi hơn về phía sau.</Text>
            </View>
            <Pressable
              onPress={() => setShowMouthGuide(true)}
              className="bg-error px-3 py-2 rounded-xl flex-row items-center gap-1 active:bg-red-600"
            >
              <HelpCircle color="#FFFFFF" size={14} />
              <Text className="text-xs font-bold text-white">Khẩu Hình 👄</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <MouthShapeGuideModal visible={showMouthGuide} onClose={() => setShowMouthGuide(false)} />
    </View>
  );
};
