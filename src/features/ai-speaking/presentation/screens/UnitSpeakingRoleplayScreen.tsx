import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mic, ArrowLeft, Bot, Star, Zap } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export const UnitSpeakingRoleplayScreen = () => {
  const { scenarioName } = useLocalSearchParams<{ scenarioName?: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 justify-between pb-8">
      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center mb-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ArrowLeft color="#1E293B" size={20} />
        </Pressable>

        <Text className="text-xl font-extrabold text-[#9A2C00] tracking-tight">SmartEnglish AI</Text>

        <View className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 flex-row items-center gap-1">
          <Zap color="#FF6B35" size={14} fill="#FF6B35" />
          <Text className="text-xs font-bold text-[#FF6B35]">12 Days</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Scenario Sub-header */}
        <View className="mb-3">
          <Text className="text-[10px] font-extrabold text-[#0F7173] uppercase tracking-wider mb-0.5">
            🔴 {scenarioName || 'CAFE SCENARIO'}
          </Text>
          <Text className="text-lg font-bold text-neutralInk">Unit 3: Ordering Food</Text>
        </View>

        {/* Hero Scenario Banner Image matching Screenshot 3 */}
        <View className="w-full h-44 rounded-3xl overflow-hidden mb-5 border border-gray-100 shadow-md relative">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
            }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* AI Barista Character Overlay */}
          <View className="absolute bottom-2 left-1/2 -ml-20 w-40 h-28 items-center justify-end">
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300'
              }}
              className="w-20 h-20 rounded-full border-2 border-white shadow-lg"
            />
          </View>
        </View>

        {/* AI Opening Speech Bubble */}
        <View className="flex-row items-start gap-3 mb-4 max-w-[90%]">
          <View className="w-9 h-9 rounded-2xl bg-cyan-100 items-center justify-center border border-cyan-200 mt-1">
            <Bot color="#0891B2" size={20} />
          </View>
          <View className="bg-white p-4 rounded-3xl rounded-tl-xs border border-gray-100 shadow-sm flex-1">
            <Text className="text-sm font-semibold text-neutralInk leading-6">
              Welcome! What would you like to order today?
            </Text>
          </View>
        </View>

        {/* User Speech Bubble with Mispronounced Word Highlight */}
        <View className="self-end max-w-[90%] mb-2">
          <View className="bg-[#FF6B35] p-4 rounded-3xl rounded-br-xs shadow-md">
            <Text className="text-sm font-semibold text-white leading-6">
              I would like a <Text className="bg-white/30 px-1.5 py-0.5 rounded-md font-bold">caffe</Text> latte, please.
            </Text>
          </View>

          {/* Pronunciation Rating Bar */}
          <View className="bg-white px-3 py-1.5 rounded-full border border-gray-100 mt-2 self-end flex-row items-center gap-2 shadow-sm">
            <Text className="text-[10px] font-extrabold text-[#0F7173] uppercase tracking-wider">
              PRONUNCIATION
            </Text>
            <View className="flex-row items-center gap-0.5">
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#CBD5E1" size={12} />
            </View>
            <Text className="text-xs font-bold text-neutralInk">| 85%</Text>
          </View>
        </View>

        {/* AI Feedback Suggestion Bubble */}
        <View className="self-end max-w-[85%] mb-6">
          <View className="bg-[#F1F5F9] p-4 rounded-2xl border border-gray-200">
            <Text className="text-xs text-neutralInk font-medium leading-5">
              Great flow! Try adding a little more emphasis on the word "caffe" next time.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Hold to Speak Mic Controls matching Screenshot 3 */}
      <View className="items-center pt-2">
        <Pressable
          onPressIn={() => setIsRecording(true)}
          onPressOut={() => setIsRecording(false)}
          className={`w-20 h-20 rounded-full justify-center items-center shadow-2xl border-4 border-white mb-2 ${
            isRecording ? 'bg-orange-600 scale-105' : 'bg-[#FF6B35] active:scale-95'
          }`}
        >
          <Mic color="#FFFFFF" size={32} />
        </Pressable>

        <Text className="text-xs font-bold text-[#9A2C00] uppercase tracking-widest">
          {isRecording ? 'RECORDING VOICE...' : 'HOLD TO SPEAK'}
        </Text>
      </View>
    </View>
  );
};
