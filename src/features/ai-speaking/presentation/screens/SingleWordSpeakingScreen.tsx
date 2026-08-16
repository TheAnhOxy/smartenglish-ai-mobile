import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Square, Volume2, RotateCcw, Sparkles, ChevronLeft } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { usePronunciationMutation } from '../../application/useAiSpeaking';

export const SingleWordSpeakingScreen = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { mutate: submitAudio, isPending } = usePronunciationMutation();

  // Waveform pulsing animation
  const pulseScale = useSharedValue(1);
  React.useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(withTiming(1.25, { duration: 600 }), -1, true);
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isRecording]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const handleRecordPress = () => {
    if (isRecording) {
      setIsRecording(false);
      submitAudio(undefined, {
        onSuccess: (data) => {
          setScore(data.overall_score);
        }
      });
    } else {
      setIsRecording(true);
    }
  };

  return (
    <View className="flex-1 bg-darkBg pt-14 px-6 justify-between pb-10">
      <View>
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 bg-darkCard px-3 py-2 rounded-xl border border-gray-800"
          >
            <ChevronLeft color="#FFFFFF" size={18} />
            <Text className="text-white font-semibold text-xs">Chế Độ Luyện Nói</Text>
          </Pressable>
          <Text className="text-xs font-bold text-gray-400">Từ Đơn IPA</Text>
        </View>

        {/* Word Display Box */}
        <View className="bg-darkCard p-8 rounded-3xl border border-gray-800 items-center shadow-2xl mb-6">
          <Text className="text-4xl font-extrabold text-white mb-2">Negotiation</Text>
          <Text className="text-base font-semibold text-secondary mb-2">/nɪˌɡoʊ.ʃiˈeɪ.ʃən/</Text>
          <Text className="text-xs text-gray-400 font-medium">(noun) • Sự đàm phán, thương lượng</Text>

          {/* Reference Audio Player */}
          <Pressable className="mt-4 flex-row items-center gap-2 bg-secondary/20 border border-secondary/40 px-4 py-2 rounded-full active:bg-secondary/30">
            <Volume2 color="#0F7173" size={16} />
            <Text className="text-xs font-bold text-secondary">Nghe Giọng Bản Ngữ Mẫu 📢</Text>
          </Pressable>
        </View>

        {/* Score Gauge */}
        {score !== null && (
          <View className="bg-darkCard p-6 rounded-3xl border border-gray-800 items-center shadow-xl mb-4">
            <View
              className={`w-24 h-24 rounded-full justify-center items-center mb-3 border-4 shadow-lg ${
                score >= 80 ? 'bg-success/20 border-success' : 'bg-warning/20 border-warning'
              }`}
            >
              <Text className={`text-3xl font-extrabold ${score >= 80 ? 'text-success' : 'text-warning'}`}>
                {score}%
              </Text>
            </View>

            <Text className="text-base font-bold text-white mb-1">
              {score >= 80 ? '🎉 Phát Âm Rất Chuẩn Bản Xứ!' : '💪 Hãy Thử Phát Âm Rõ Hơn Lần Nữa!'}
            </Text>

            {/* Audio Playback Buttons */}
            <View className="flex-row gap-3 mt-4">
              <Pressable className="flex-row items-center gap-1.5 bg-gray-800 px-3.5 py-2 rounded-xl border border-gray-700">
                <RotateCcw color="#FFFFFF" size={14} />
                <Text className="text-xs font-bold text-white">Nghe Lại Bản Ghi 🎧</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(student)/practice/speaking/ipa' as any)}
                className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2 rounded-xl shadow-sm"
              >
                <Sparkles color="#FFFFFF" size={14} />
                <Text className="text-xs font-bold text-white">Phân Tích IPA ➔</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Record Mic Button Controls */}
      <View className="items-center">
        {isPending ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#FF6B35" size="large" />
            <Text className="text-xs font-bold text-primary mt-2">Đang Chấm Điểm Phát Âm...</Text>
          </View>
        ) : (
          <Animated.View style={animatedPulseStyle} className="items-center">
            <Pressable
              onPress={handleRecordPress}
              className={`w-20 h-20 rounded-full justify-center items-center shadow-2xl border-4 border-white ${
                isRecording ? 'bg-error shadow-error' : 'bg-primary shadow-primary active:scale-95'
              }`}
            >
              {isRecording ? <Square color="#FFFFFF" size={28} /> : <Mic color="#FFFFFF" size={32} />}
            </Pressable>
          </Animated.View>
        )}

        <Text className="text-xs text-gray-300 font-medium mt-4">
          {isRecording ? 'Đang thu âm... Chạm nút vuông để hoàn tất' : 'Giữ hoặc chạm micro để bắt đầu nói'}
        </Text>
      </View>
    </View>
  );
};
