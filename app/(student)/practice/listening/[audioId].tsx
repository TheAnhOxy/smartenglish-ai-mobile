import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAudioTrackQuery } from '@/src/features/reading-listening/application/useReadingListening';

export default function ListeningPlayerScreen() {
  const { audioId } = useLocalSearchParams<{ audioId: string }>();
  const router = useRouter();
  const { data: track, isLoading } = useAudioTrackQuery(audioId || 'aud-101');

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'0.75x' | '1.0x' | '1.25x' | '1.5x'>('1.0x');
  const [showSub, setShowSub] = useState(true);
  const [abLoop, setAbLoop] = useState(false);

  if (isLoading || !track) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-darkBg pt-14 px-6 justify-between pb-10">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Bài Tập Luyện Nghe</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-white mb-1">{track.title}</Text>
        <Text className="text-xs text-gray-400 mb-6">Thời lượng: 3:00 • Trình phát âm thanh AI</Text>

        {/* Subtitles Display Box */}
        <View className="bg-darkCard p-6 rounded-3xl border border-gray-800 mb-6 min-h-[160px] justify-center items-center">
          {showSub ? (
            <View className="items-center gap-2">
              <Text className="text-base font-bold text-white text-center leading-6">
                "{track.subtitles[0].text_en}"
              </Text>
              <Text className="text-xs text-secondary text-center">
                "{track.subtitles[0].text_vi}"
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-gray-500 italic">Phụ đề đã bị ẩn (Tập trung luyện nghe phản xạ)</Text>
          )}
        </View>

        {/* Playback Controls & Speed Selector */}
        <View className="bg-darkCard p-5 rounded-2xl border border-gray-800 gap-4 mb-6">
          <View className="flex-row justify-between items-center">
            {/* Speed Selector */}
            <View className="flex-row gap-1">
              {(['0.75x', '1.0x', '1.25x', '1.5x'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg border ${
                    speed === s ? 'bg-primary border-primary' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${speed === s ? 'text-white' : 'text-gray-300'}`}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* A-B Loop Toggle */}
            <Pressable
              onPress={() => setAbLoop(!abLoop)}
              className={`px-3 py-1 rounded-lg border ${
                abLoop ? 'bg-secondary border-secondary' : 'bg-gray-800 border-gray-700'
              }`}
            >
              <Text className={`text-xs font-bold ${abLoop ? 'text-white' : 'text-gray-300'}`}>
                {abLoop ? '🔁 A-B Loop Bật' : '🔁 Loop Tắt'}
              </Text>
            </Pressable>
          </View>

          {/* Play / Pause Big Button */}
          <Pressable
            onPress={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-primary justify-center items-center self-center shadow-lg active:scale-95 border-2 border-white"
          >
            <Text className="text-2xl text-white">{isPlaying ? '⏸️' : '▶️'}</Text>
          </Pressable>
        </View>

        {/* Subtitle Toggle Chip */}
        <Pressable
          onPress={() => setShowSub(!showSub)}
          className="bg-gray-800 py-3 rounded-xl items-center border border-gray-700"
        >
          <Text className="text-xs font-bold text-gray-300">
            {showSub ? '🙈 Ẩn Phụ Đề Song Ngữ' : '👁️ Bật Phụ Đề Song Ngữ'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
