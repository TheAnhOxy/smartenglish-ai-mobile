import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';

export const IotDeviceScreen = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(true);
  const [lightMode, setLightMode] = useState<'breathing_fire' | 'solid_gold' | 'off'>('breathing_fire');

  return (
    <ScrollView className="flex-1 bg-surface pt-14 px-6 pb-10" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Hồ Sơ Cá Nhân</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-neutralInk mb-1">Kết Nối Đèn IoT SmartLamp 💡</Text>
      <Text className="text-xs text-neutralGray mb-6">Đồng bộ ánh sáng sinh học theo chuỗi Streak & thời gian học</Text>

      <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">💡</Text>
            <View>
              <Text className="text-sm font-bold text-neutralInk">SmartLamp ESP32 BLE</Text>
              <Text className={`text-[10px] font-bold ${isConnected ? 'text-success' : 'text-error'}`}>
                {isConnected ? '● Đã Kết Nối Bluetooth' : '○ Ngắt Kết Nối'}
              </Text>
            </View>
          </View>
          <Switch value={isConnected} onValueChange={setIsConnected} trackColor={{ false: '#E5E7EB', true: '#FF6B35' }} />
        </View>

        {isConnected && (
          <View className="gap-2 border-t border-gray-100 pt-4">
            <Text className="text-xs font-bold text-neutralInk mb-1">Hiệu Ứng Ánh Sáng Đèn Học:</Text>
            {[
              { mode: 'breathing_fire', name: '🔥 Ngọn Lửa Streak (Breathing Fire)' },
              { mode: 'solid_gold', name: '✨ Vàng Hoàng Kim Tập Trung (Solid Gold)' },
              { mode: 'off', name: '🌑 Tắt Đèn' }
            ].map((m) => (
              <Pressable
                key={m.mode}
                onPress={() => setLightMode(m.mode as any)}
                className={`p-3 rounded-xl border flex-row justify-between items-center ${
                  lightMode === m.mode ? 'bg-primary/10 border-primary' : 'bg-surface border-gray-200'
                }`}
              >
                <Text className={`text-xs font-bold ${lightMode === m.mode ? 'text-primary' : 'text-neutralInk'}`}>
                  {m.name}
                </Text>
                {lightMode === m.mode && <Text className="text-primary font-bold text-xs">✓</Text>}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};
