import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, X, CheckCircle2, ShieldCheck, Zap, Camera, Bot, Award } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export const PaywallScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const handleSubscribe = () => {
    if (currentUser) {
      currentUser.plan = selectedPlan === 'yearly' ? 'premium_yearly' : 'premium_monthly';
    }
    alert('🎉 Nâng cấp SmartEnglish Premium thành công! Bạn có thể sử dụng tất cả tính năng không giới hạn.');
    router.back();
  };

  return (
    <View className="flex-1 bg-[#161936] pt-12 px-5 pb-6 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center gap-2">
            <Star color="#FFC93C" size={24} fill="#FFC93C" />
            <Text className="text-xl font-bold text-white">SmartEnglish Premium</Text>
          </View>

          <Pressable onPress={() => router.back()} className="p-2 bg-white/10 rounded-full active:bg-white/20">
            <X color="#FFFFFF" size={18} />
          </Pressable>
        </View>

        {/* Feature Icons Row */}
        <View className="flex-row justify-around mb-6">
          <View className="items-center">
            <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-2 border border-white/20">
              <Camera color="#38BDF8" size={24} />
            </View>
            <Text className="text-[11px] font-medium text-gray-300">Quét thông minh</Text>
          </View>

          <View className="items-center">
            <View className="w-14 h-14 rounded-2xl bg-indigo-500/30 items-center justify-center mb-2 border border-indigo-400/40">
              <Bot color="#818CF8" size={24} />
            </View>
            <Text className="text-[11px] font-bold text-indigo-300">Trí tuệ AI</Text>
          </View>

          <View className="items-center">
            <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-2 border border-white/20">
              <Award color="#38BDF8" size={24} />
            </View>
            <Text className="text-[11px] font-medium text-gray-300">Chứng nhận</Text>
          </View>
        </View>

        {/* Main Banner Headline */}
        <Text className="text-2xl font-extrabold text-white text-center leading-8 mb-6">
          Nâng tầm khả năng ngôn ngữ với <Text className="text-[#FF6B35]">AI thế hệ mới</Text>
        </Text>

        {/* Feature Comparison Table */}
        <View className="bg-white/5 p-4 rounded-3xl border border-white/10 mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">QUYỀN LỢI PREMIUM</Text>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text className="text-xs font-semibold text-white">Quét ảnh không giới hạn</Text>
              </View>
              <View className="bg-white/10 px-2.5 py-0.5 rounded-md">
                <Text className="text-[10px] text-gray-400">10 lượt/ngày</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text className="text-xs font-semibold text-white">Phân tích IPA chi tiết</Text>
              </View>
              <View className="bg-white/10 px-2.5 py-0.5 rounded-md">
                <Text className="text-[10px] text-gray-400">Không có</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text className="text-xs font-semibold text-white">AI Roleplay hội thoại</Text>
              </View>
              <View className="bg-white/10 px-2.5 py-0.5 rounded-md">
                <Text className="text-[10px] text-gray-400">Không có</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text className="text-xs font-semibold text-white">AI Writing Checker</Text>
              </View>
              <View className="bg-white/10 px-2.5 py-0.5 rounded-md">
                <Text className="text-[10px] text-gray-400">Không có</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text className="text-xs font-semibold text-white">Không quảng cáo</Text>
              </View>
              <View className="bg-white/10 px-2.5 py-0.5 rounded-md">
                <Text className="text-[10px] text-gray-400">Có quảng cáo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cycle Toggle (Monthly vs Yearly) */}
        <View className="flex-row bg-black/40 p-1 rounded-2xl mb-6 self-center border border-white/10">
          <Pressable
            onPress={() => setCycle('monthly')}
            className={`px-6 py-2 rounded-xl ${cycle === 'monthly' ? 'bg-indigo-600' : ''}`}
          >
            <Text className="text-xs font-bold text-white">Monthly</Text>
          </Pressable>

          <Pressable
            onPress={() => setCycle('yearly')}
            className={`px-6 py-2 rounded-xl ${cycle === 'yearly' ? 'bg-indigo-600' : ''}`}
          >
            <Text className="text-xs font-bold text-white">Yearly</Text>
          </Pressable>
        </View>

        {/* Pricing Cards Selection */}
        <View className="gap-3.5 mb-6">
          {/* Yearly Package (Recommended) */}
          <Pressable
            onPress={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-2xl border relative ${
              selectedPlan === 'yearly'
                ? 'bg-indigo-950/60 border-[#FF6B35] shadow-lg'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <View className="absolute -top-3 right-4 bg-[#FF6B35] px-3 py-0.5 rounded-full">
              <Text className="text-[9px] font-extrabold text-white uppercase tracking-wider">RECOMMENDED</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-bold text-white">49.900đ<Text className="text-xs font-normal text-gray-300">/tháng</Text></Text>
                <Text className="text-xs text-[#FF6B35] font-semibold mt-0.5">599.000đ/năm - Tiết kiệm 44%</Text>
              </View>

              <View className={`w-6 h-6 rounded-full border-2 justify-center items-center ${selectedPlan === 'yearly' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-gray-500'}`}>
                {selectedPlan === 'yearly' && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
              </View>
            </View>
          </Pressable>

          {/* Monthly Package */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-2xl border ${
              selectedPlan === 'monthly'
                ? 'bg-indigo-950/60 border-[#FF6B35] shadow-lg'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-bold text-white">89.000đ<Text className="text-xs font-normal text-gray-300">/tháng</Text></Text>
                <Text className="text-xs text-gray-400 mt-0.5">Dùng thử 7 ngày miễn phí</Text>
              </View>

              <View className={`w-6 h-6 rounded-full border-2 justify-center items-center ${selectedPlan === 'monthly' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-gray-500'}`}>
                {selectedPlan === 'monthly' && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
              </View>
            </View>
          </Pressable>
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleSubscribe}
          className="bg-[#FF6B35] py-4 rounded-2xl items-center shadow-xl active:bg-orange-600 mb-3"
        >
          <Text className="text-white font-bold text-lg">Bắt đầu dùng thử miễn phí</Text>
        </Pressable>

        <Text className="text-xs text-gray-400 text-center mb-6">
          Hủy bất cứ lúc nào • Hoàn tiền 30 ngày
        </Text>
      </ScrollView>
    </View>
  );
};
