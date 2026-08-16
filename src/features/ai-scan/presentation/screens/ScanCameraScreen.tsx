import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, Image as ImageIcon, Zap, Flashlight } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';

export const ScanCameraScreen = () => {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<'document' | 'id_card' | 'book'>('document');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Scanning line animation
  const scanY = useSharedValue(0);
  React.useEffect(() => {
    if (isScanning) {
      scanY.value = withRepeat(withTiming(200, { duration: 1200 }), -1, true);
    }
  }, [isScanning]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }]
  }));

  const handleCapture = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      router.push({
        pathname: '/(student)/practice/scan/result' as any,
        params: {
          scanData: JSON.stringify({
            detected_count: 4,
            objects: [
              { id: '1', word: 'Dog', phonetic: '/dɔɡ/', pos: 'Noun', meaning_vi: 'Con chó (đã nhận diện)', confidence: 0.96, word_id: 'w-dog' },
              { id: '2', word: 'Running', phonetic: '/ˈrʌnɪŋ/', pos: 'Verb', meaning_vi: 'Đang chạy', confidence: 0.92, word_id: 'w-running' },
              { id: '3', word: 'Happy', phonetic: '/ˈhæpi/', pos: 'Adj', meaning_vi: 'Vui vẻ, hạnh phúc', confidence: 0.89, word_id: 'w-happy' },
              { id: '4', word: 'Grass', phonetic: '/ɡræs/', pos: 'Noun', meaning_vi: 'Bãi cỏ', confidence: 0.94, word_id: 'w-grass' }
            ]
          })
        }
      });
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#12141C] pt-12 justify-between pb-8">
      {/* Top Header Bar */}
      <View className="px-6 flex-row justify-between items-center z-10">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 justify-center items-center backdrop-blur-md"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        {/* Quota Banner Pill */}
        <View className="bg-black/50 px-4 py-1.5 rounded-full border border-gray-700 backdrop-blur-md flex-row items-center gap-1.5">
          <Zap color="#FF6B35" size={14} />
          <Text className="text-xs font-bold text-gray-200">7 scans left</Text>
        </View>

        <Pressable className="w-10 h-10 rounded-full bg-black/40 justify-center items-center backdrop-blur-md">
          <HelpCircle color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      {/* Camera Viewfinder Frame with Orange Corners */}
      <View className="items-center justify-center relative">
        <Text className="text-base font-bold text-white mb-6 tracking-wide">Scan Document</Text>

        <View className="w-72 h-80 relative justify-center items-center">
          {/* Orange Bounding Frame Corners */}
          <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF6B35] rounded-tl-xl" />
          <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF6B35] rounded-tr-xl" />
          <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF6B35] rounded-bl-xl" />
          <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF6B35] rounded-br-xl" />

          {/* Center Instruction Text */}
          <View className="px-6 items-center">
            <Text className="text-sm font-semibold text-gray-300 text-center leading-6">
              Center the text or object to scan
            </Text>
          </View>

          {/* Scanning Line Animation */}
          {isScanning && (
            <>
              <Animated.View
                className="absolute left-4 right-4 h-1 bg-[#FF6B35] shadow-lg shadow-[#FF6B35]"
                style={animatedScanLineStyle}
              />
              <View className="absolute inset-0 bg-black/60 items-center justify-center rounded-2xl">
                <ActivityIndicator color="#FF6B35" size="large" />
                <Text className="text-white font-bold text-xs mt-3">Analyzing Image...</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Bottom Mode Switcher Bar & Shutter Controls */}
      <View className="items-center px-6">
        {/* Mode Switcher Tabs */}
        <View className="flex-row gap-6 mb-6">
          <Pressable onPress={() => setActiveMode('document')}>
            <Text className={`text-xs font-bold ${activeMode === 'document' ? 'text-white border-b-2 border-[#FF6B35] pb-1' : 'text-gray-400'}`}>
              Document
            </Text>
          </Pressable>

          <Pressable onPress={() => setActiveMode('id_card')}>
            <Text className={`text-xs font-bold ${activeMode === 'id_card' ? 'text-white border-b-2 border-[#FF6B35] pb-1' : 'text-gray-400'}`}>
              ID Card
            </Text>
          </Pressable>

          <Pressable onPress={() => setActiveMode('book')}>
            <Text className={`text-xs font-bold ${activeMode === 'book' ? 'text-white border-b-2 border-[#FF6B35] pb-1' : 'text-gray-400'}`}>
              Book
            </Text>
          </Pressable>
        </View>

        {/* Controls Row */}
        <View className="w-full flex-row justify-between items-center">
          {/* Flash Toggle */}
          <Pressable
            onPress={() => setIsFlashOn(!isFlashOn)}
            className={`w-12 h-12 rounded-2xl justify-center items-center border ${
              isFlashOn ? 'bg-[#FF6B35]/20 border-[#FF6B35]' : 'bg-gray-800/80 border-gray-700'
            }`}
          >
            <Flashlight color={isFlashOn ? '#FF6B35' : '#FFFFFF'} size={20} />
          </Pressable>

          {/* Shutter Capture Button */}
          <Pressable
            onPress={handleCapture}
            disabled={isScanning}
            className="w-20 h-20 rounded-full border-4 border-white justify-center items-center active:scale-95 shadow-2xl"
          >
            <View className="w-16 h-16 rounded-full bg-[#FF6B35] justify-center items-center">
              <View className="w-12 h-12 rounded-full border-2 border-white/60" />
            </View>
          </Pressable>

          {/* Image Gallery Thumbnail */}
          <Pressable
            onPress={handleCapture}
            className="w-12 h-12 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 justify-center items-center"
          >
            <ImageIcon color="#FFFFFF" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
