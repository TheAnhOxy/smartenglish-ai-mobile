import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../data/speakingApi';
import { useAuthStore } from '@/src/core/flows/authStore';

export const RoleplayScenariosScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  return (
    <View className="flex-1 bg-darkBg pt-14 px-6 pb-6">
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-primary font-bold text-sm">← Chế Độ Luyện Nói</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-white mb-1">AI Roleplay Companion</Text>
      <Text className="text-xs text-gray-400 mb-6">Chọn kịch bản nhập vai hội thoại giọng nói 2 chiều với AI</Text>

      <FlatList
        data={MOCK_ROLEPLAY_SCENARIOS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isLocked = item.is_premium && !isPremium;
          return (
            <Pressable
              onPress={() => {
                if (isLocked) {
                  alert('Kịch bản này dành riêng cho tài khoản Premium!');
                  return;
                }
                router.push(`/(student)/practice/speaking/roleplay/${item.id}` as any);
              }}
              className={`p-5 rounded-2xl border mb-4 shadow-sm active:opacity-80 ${
                isLocked ? 'bg-darkCard/50 border-gray-800' : 'bg-darkCard border-gray-800'
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-bold text-white flex-1 mr-2">{item.title}</Text>
                <View className="bg-secondary/20 px-2.5 py-1 rounded-full border border-secondary/30">
                  <Text className="text-xs font-bold text-secondary">{item.cefr_level}</Text>
                </View>
              </View>

              <Text className="text-xs text-gray-300 mb-3">Nhân vật AI: {item.ai_persona}</Text>
              <Text className="text-xs text-gray-400 italic bg-black/30 p-3 rounded-xl border border-gray-800 mb-2">
                "{item.opening_line}"
              </Text>

              {isLocked && (
                <Text className="text-xs font-bold text-amber-500 text-right mt-1">
                  🔒 Premium Only
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
};
