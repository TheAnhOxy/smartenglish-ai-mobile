import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Play, RotateCcw, ArrowRight, Lightbulb, Activity, Zap } from 'lucide-react-native';

export const SpeakingFeedbackScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 justify-between pb-8">
      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center mb-4">
        <Pressable onPress={() => router.back()} className="p-1">
          <X color="#475569" size={22} />
        </Pressable>

        <Text className="text-xl font-extrabold text-[#9A2C00] tracking-tight">SmartEnglish AI</Text>

        <View className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 flex-row items-center gap-1">
          <Zap color="#FF6B35" size={14} fill="#FF6B35" />
          <Text className="text-xs font-bold text-[#FF6B35]">🔥 12 Days</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Big Score Circle Gauge matching Screenshot 1 */}
        <View className="items-center my-4">
          <View className="w-32 h-32 rounded-full bg-white border-4 border-orange-100 justify-center items-center shadow-lg">
            <Text className="text-3xl font-extrabold text-[#9A2C00]">88%</Text>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">GREAT</Text>
          </View>

          {/* Word Title & Phonetic */}
          <Text className="text-3xl font-extrabold text-[#1E293B] mt-4 mb-1">Phenomenal</Text>
          <Text className="text-sm font-semibold text-neutralGray">/fəˈnæmənəl/</Text>
        </View>

        {/* Audio Match Card (Native vs Your Voice) */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Activity color="#FF6B35" size={20} />
            <Text className="text-base font-bold text-[#1E293B]">Audio Match</Text>
          </View>

          {/* Target Native Waveform */}
          <View className="flex-row items-center gap-3 mb-4">
            <Pressable
              onPress={() => alert('Phát âm giọng bản ngữ mẫu...')}
              className="w-10 h-10 rounded-full bg-[#E0F2FE] justify-center items-center active:bg-cyan-200"
            >
              <Play color="#0284C7" size={16} fill="#0284C7" />
            </Pressable>

            <View className="flex-1">
              <Text className="text-[11px] font-bold text-neutralGray mb-1">Target (Native)</Text>
              {/* Teal Bar Code Waveform Sim */}
              <View className="flex-row items-end gap-1 h-8">
                <View className="w-1.5 h-3 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-6 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-4 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-8 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-5 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-7 bg-[#0F7173] rounded-full" />
                <View className="w-1.5 h-3 bg-[#0F7173] rounded-full" />
              </View>
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 my-1" />

          {/* Your Voice Waveform */}
          <View className="flex-row items-center gap-3 mt-3">
            <Pressable
              onPress={() => alert('Phát lại bản ghi âm của bạn...')}
              className="w-10 h-10 rounded-full bg-[#FF6B35] justify-center items-center active:bg-orange-600 shadow-sm"
            >
              <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
            </Pressable>

            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#FF6B35] mb-1">Your Voice</Text>
              {/* Orange Bar Code Waveform Sim */}
              <View className="flex-row items-end gap-1 h-8">
                <View className="w-1.5 h-4 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-7 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-3 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-8 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-6 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-4 bg-[#FF6B35] rounded-full" />
                <View className="w-1.5 h-2 bg-[#FF6B35] rounded-full" />
              </View>
            </View>
          </View>
        </View>

        {/* Tips to Improve Card (Mouth Shape Model Diagram) */}
        <View className="mb-4">
          <Text className="text-base font-bold text-[#1E293B] mb-3">Tips to Improve</Text>

          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm">
            <View className="flex-row items-start gap-3 mb-3">
              <View className="w-8 h-8 rounded-full bg-amber-100 justify-center items-center">
                <Lightbulb color="#D97706" size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutralInk mb-1">Focus on the /n/</Text>
                <Text className="text-xs text-neutralGray leading-5 font-medium">
                  Touch the tip of your tongue to the roof of your mouth, just behind your teeth.
                </Text>
              </View>
            </View>

            {/* 3D Mouth Shape Anatomy Diagram Graphic */}
            <View className="w-full h-40 bg-[#E0F2FE] rounded-2xl overflow-hidden border border-cyan-100 justify-center items-center">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600' }}
                className="w-full h-full opacity-80"
              />
              <View className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-white">Tongue Position: Alveolar Ridge</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Syllables & Stress Card */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm items-center">
          <View className="w-10 h-10 rounded-full bg-cyan-50 justify-center items-center mb-2">
            <Activity color="#0284C7" size={20} />
          </View>

          <Text className="text-sm font-bold text-[#1E293B] mb-1">Syllable Stress</Text>
          <Text className="text-xs text-neutralGray mb-3">
            Stress the second syllable: phe-<Text className="font-bold text-neutralInk uppercase">NOM</Text>-e-nal
          </Text>

          {/* Syllables Dots Indicator */}
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-gray-200" />
            <View className="w-4 h-4 rounded-full bg-[#0F7173]" />
            <View className="w-3 h-3 rounded-full bg-gray-200" />
            <View className="w-3 h-3 rounded-full bg-gray-200" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Dual Action Buttons matching Screenshot 1 */}
      <View className="flex-row gap-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-4 rounded-2xl border-2 border-[#0F7173] flex-row justify-center items-center gap-2 active:bg-cyan-50"
        >
          <RotateCcw color="#0F7173" size={18} />
          <Text className="text-[#0F7173] font-bold text-base">Retry</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(student)/practice/speaking/unit-roleplay' as any)}
          className="flex-1 py-4 rounded-2xl bg-[#FF6B35] flex-row justify-center items-center gap-2 shadow-md active:bg-orange-600"
        >
          <Text className="text-white font-bold text-base">Next Word</Text>
          <ArrowRight color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </View>
  );
};
