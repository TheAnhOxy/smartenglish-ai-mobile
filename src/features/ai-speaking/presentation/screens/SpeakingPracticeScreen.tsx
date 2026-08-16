import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Volume2, Video } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';

export const SpeakingPracticeScreen = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);

  // Equalizer waveform pulsing animation
  const waveScale = useSharedValue(1);
  React.useEffect(() => {
    waveScale.value = withRepeat(withTiming(1.3, { duration: 500 }), -1, true);
  }, []);

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: waveScale.value }]
  }));

  const handleMicPress = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      // Navigate to detailed feedback screen (Screenshot 1)
      router.push('/(student)/practice/speaking/detailed-feedback' as any);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-12 px-6 justify-between pb-10">
      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#9A2C00" size={22} />
        </Pressable>

        <Text className="text-xl font-extrabold text-[#9A2C00] tracking-tight">SmartEnglish AI</Text>

        <View className="w-10 h-10 rounded-full bg-amber-500 justify-center items-center">
          <Video color="#FFFFFF" size={18} />
        </View>
      </View>

      {/* Target Word & Phonetic Header */}
      <View className="items-center mt-6">
        <Text className="text-4xl font-extrabold text-[#1E293B] mb-2 text-center">
          Phenomenal
        </Text>

        <View className="bg-[#EEF2FF] px-4 py-1.5 rounded-full border border-indigo-100 mb-8">
          <Text className="text-sm font-semibold text-[#4F46E5]">/fəˈnæmənəl/</Text>
        </View>

        {/* Center Pulsing Orange Equalizer Waveform */}
        <View className="h-32 flex-row justify-center items-center gap-1.5 my-6">
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-12 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-20 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-16 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-24 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-14 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-22 bg-[#FF6B35] rounded-full" />
          <Animated.View style={animatedWaveStyle} className="w-2.5 h-10 bg-[#FF6B35] rounded-full" />
        </View>

        {/* Pronunciation Accuracy Box matching Screenshot 2 */}
        <View className="w-full bg-white p-6 rounded-3xl border border-orange-200/80 shadow-md items-center my-4">
          <Text className="text-[11px] font-extrabold text-[#78350F] uppercase tracking-wider mb-2">
            PRONUNCIATION ACCURACY
          </Text>

          <Text className="text-4xl font-extrabold text-[#9A2C00] mb-3">
            88 <Text className="text-2xl font-bold">%</Text>
          </Text>

          {/* Progress Bar */}
          <View className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <View className="h-full bg-[#C23B00] rounded-full" style={{ width: '88%' }} />
          </View>
        </View>

        <Text className="text-xs font-bold text-[#006A6B] uppercase tracking-widest mt-2">
          FITBIT_PUSH_UPS
        </Text>
      </View>

      {/* Bottom Record Mic Button matching Screenshot 2 */}
      <View className="items-center">
        {isRecording ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#FF6B35" size="large" />
            <Text className="text-xs font-bold text-primary mt-2">AI Đang Chấm Điểm Phát Âm...</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleMicPress}
            className="w-20 h-20 rounded-full bg-[#FF6B35] justify-center items-center shadow-2xl active:scale-95 border-4 border-white"
          >
            <Mic color="#FFFFFF" size={32} />
          </Pressable>
        )}
      </View>
    </View>
  );
};
