import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image as RNImage, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, HelpCircle, Image as ImageIcon, Zap, Flashlight, Camera, Scan, Sparkles, Target, Layers } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
  Easing
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { submitScanImageApi } from '../../data/scanApi';

export const ScanCameraScreen = () => {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<'document' | 'id_card' | 'book'>('id_card');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);

  // Clear previous scan image & reset states every time user focuses/re-enters camera screen
  useFocusEffect(
    useCallback(() => {
      setCapturedImageUri(null);
      setIsScanning(false);
    }, [])
  );

  // Futuristic scanning animation values
  const scanY = useSharedValue(0);
  const cornerPulse = useSharedValue(1);
  const reticleRotate = useSharedValue(0);
  const shutterPulse = useSharedValue(1);

  const scanProgressSteps = [
    '⚡ Khởi tạo Loxera Vision Neural Engine...',
    '🔍 Phân tích 5 vật thể & Quét vùng ảnh...',
    '📖 Trích xuất IPA, Từ vựng & Nghĩa tiếng Việt...',
    '✨ Hoàn tất sinh thẻ từ vựng thông minh!'
  ];

  useEffect(() => {
    // Pulse shutter button subtly when idle
    shutterPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isScanning) {
      // Smooth radar laser scan line moving up and down continuously
      scanY.value = withRepeat(
        withTiming(290, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Keep frame stationary (no pulsing/pumping effect)
      cornerPulse.value = 1;

      // Center crosshair rotating
      reticleRotate.value = withRepeat(
        withTiming(360, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      scanY.value = 0;
      cornerPulse.value = 1;
      reticleRotate.value = 0;
    }
  }, [isScanning]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }]
  }));

  const animatedCornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerPulse.value }]
  }));

  const animatedReticleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reticleRotate.value}deg` }]
  }));

  const animatedShutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterPulse.value }]
  }));

  const processAndNavigate = async (uri: string, base64?: string | null) => {
    setIsScanning(true);
    setCapturedImageUri(uri);

    try {
      const scanResult = await submitScanImageApi(base64 || undefined, activeMode);
      
      // Fast transition to results screen
      setTimeout(() => {
        setIsScanning(false);
        router.push({
          pathname: '/(student)/practice/scan/result' as any,
          params: {
            imageUri: uri,
            scanData: JSON.stringify(scanResult),
          },
        });
      }, 700);
    } catch (err) {
      setIsScanning(false);
      Alert.alert('Lỗi Quét AI', 'Không thể phân tích ảnh lúc này. Vui lòng thử lại.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần Quyền Camera', 'Vui lòng cấp quyền truy cập Camera để sử dụng tính năng quét ảnh AI.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndNavigate(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Thông báo', 'Không thể mở camera. Bạn có thể chọn ảnh từ thư viện.');
    }
  };

  const handlePickLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cần Quyền Thư Viện', 'Vui lòng cấp quyền truy cập Thư viện ảnh để chọn hình quét.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndNavigate(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Library pick error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện.');
    }
  };

  return (
    <View className="flex-1 bg-[#090A0F] pt-12 justify-between pb-8">
      {/* Top Header Bar */}
      <View className="px-6 flex-row justify-between items-center z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-black/60 justify-center items-center backdrop-blur-md border border-gray-800"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        {/* Clean Header Title Badge */}
        <View className="bg-black/60 px-4 py-2 rounded-full border border-gray-800 backdrop-blur-md flex-row items-center gap-2 shadow-lg">
          <Zap color="#FF6B35" size={15} fill="#FF6B35" />
          <Text className="text-xs font-bold text-gray-100 tracking-wide">Quét Từ Vựng AI</Text>
        </View>

        <Pressable
          onPress={() => Alert.alert('Hướng Dẫn Quét AI', 'Đưa camera hoặc chọn ảnh vật thể/văn bản. AI Gemini sẽ tự động nhận diện tối đa 5 vật thể tốt nhất và tạo thẻ từ vựng.')}
          className="w-11 h-11 rounded-full bg-black/60 justify-center items-center backdrop-blur-md border border-gray-800"
        >
          <HelpCircle color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      {/* Main Camera Viewfinder Frame */}
      <View className="items-center justify-center relative my-auto">
        {/* Outer Frame Viewfinder Container */}
        <Animated.View
          style={animatedCornerStyle}
          className="w-80 h-80 relative justify-center items-center rounded-3xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl"
        >
          {/* Captured Image Preview or Live Camera Target Placeholder */}
          {capturedImageUri ? (
            <RNImage
              source={{ uri: capturedImageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center justify-center relative">
              {/* Rotating Center Cyber HUD Target Ring */}
              <Animated.View style={animatedReticleStyle} className="w-28 h-28 rounded-full border-2 border-dashed border-[#FF6B35]/70 justify-center items-center relative">
                <View className="w-20 h-20 rounded-full border border-[#00F2FE]/50 justify-center items-center">
                  <View className="w-12 h-12 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35] justify-center items-center shadow-md">
                    <Camera color="#FF6B35" size={24} />
                  </View>
                </View>
                {/* HUD Compass Tick Marks */}
                <View className="absolute -top-1 w-2 h-2 bg-[#00F2FE] rounded-full" />
                <View className="absolute -bottom-1 w-2 h-2 bg-[#00F2FE] rounded-full" />
                <View className="absolute -left-1 w-2 h-2 bg-[#FF6B35] rounded-full" />
                <View className="absolute -right-1 w-2 h-2 bg-[#FF6B35] rounded-full" />
              </Animated.View>
            </View>
          )}

          {/* High-Tech Glowing Corner Brackets */}
          <View className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-[#FF6B35] rounded-tl-2xl z-20 shadow-md shadow-[#FF6B35]" />
          <View className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-[#FF6B35] rounded-tr-2xl z-20 shadow-md shadow-[#FF6B35]" />
          <View className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-[#FF6B35] rounded-bl-2xl z-20 shadow-md shadow-[#FF6B35]" />
          <View className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-[#FF6B35] rounded-br-2xl z-20 shadow-md shadow-[#FF6B35]" />

          {/* Dynamic Cyber HUD Grid lines overlay */}
          <View className="absolute inset-0 border border-white/5 opacity-25 flex-row justify-between pointer-events-none">
            <View className="w-1/3 border-r border-white/10" />
            <View className="w-1/3 border-r border-white/10" />
          </View>

          {/* Laser Scanning Beam & Multi-Step AI Overlay */}
          {isScanning ? (
            <View className="absolute inset-0 bg-black/80 items-center justify-center px-6 z-30 backdrop-blur-md">
              {/* Dual Glowing Animated Laser Scanning Beam */}
              <Animated.View
                className="absolute left-0 right-0 h-1.5 bg-[#FF6B35] z-40"
                style={[
                  animatedScanLineStyle,
                  {
                    shadowColor: '#FF6B35',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 16,
                    elevation: 12,
                  }
                ]}
              />

              <View className="w-16 h-16 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/60 justify-center items-center mb-4 shadow-lg shadow-orange-500">
                <ActivityIndicator color="#FF6B35" size="large" />
              </View>

              <Text className="text-white font-extrabold text-sm text-center mb-1 tracking-wide">
                Đang nhận diện hình ảnh...
              </Text>
            </View>
          ) : (
            /* Vertical Laser Beam moving subtly when ready */
            <Animated.View
              className="absolute left-0 right-0 h-0.5 bg-[#FF6B35]/60 z-10 opacity-70"
              style={[
                animatedScanLineStyle,
                {
                  shadowColor: '#FF6B35',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                }
              ]}
            />
          )}
        </Animated.View>
      </View>

      {/* Bottom Shutter Controls & Gallery Upload */}
      <View className="items-center px-6 z-20 w-full mb-2">
        {/* Controls Row */}
        <View className="w-full flex-row justify-between items-center px-6">
          {/* Flash Toggle */}
          <Pressable
            onPress={() => setIsFlashOn(!isFlashOn)}
            className={`w-13 h-13 rounded-2xl justify-center items-center border ${
              isFlashOn ? 'bg-[#FF6B35]/20 border-[#FF6B35]' : 'bg-gray-900/90 border-gray-800'
            }`}
          >
            <Flashlight color={isFlashOn ? '#FF6B35' : '#FFFFFF'} size={22} />
          </Pressable>

          {/* Shutter Capture Button */}
          <Animated.View style={animatedShutterStyle}>
            <Pressable
              onPress={handleCaptureCamera}
              disabled={isScanning}
              className="w-22 h-22 rounded-full border-4 border-white/90 justify-center items-center active:scale-95 shadow-2xl"
            >
              <View className="w-18 h-18 rounded-full bg-[#FF6B35] justify-center items-center shadow-lg shadow-orange-600">
                <Scan color="#FFFFFF" size={28} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Image Gallery Upload Button */}
          <Pressable
            onPress={handlePickLibrary}
            disabled={isScanning}
            className="w-13 h-13 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/90 justify-center items-center active:bg-gray-800"
          >
            <ImageIcon color="#FFFFFF" size={22} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
