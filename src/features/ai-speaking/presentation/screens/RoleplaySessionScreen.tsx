import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mic, Lightbulb, StopCircle, CheckCircle2, ChevronLeft, Volume2 } from 'lucide-react-native';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../data/speakingApi';

interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
}

export const RoleplaySessionScreen = () => {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const router = useRouter();

  const scenario = MOCK_ROLEPLAY_SCENARIOS.find((s) => s.id === scenarioId) || MOCK_ROLEPLAY_SCENARIOS[0];

  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: 'ai', text: scenario.opening_line }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // 3s silence hint timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [turns]);

  const handleSimulateUserTalk = () => {
    setShowHint(false);
    setIsListening(true);

    setTimeout(() => {
      setIsListening(false);
      setTurns((prev) => [
        ...prev,
        { role: 'user', text: 'Hi! I would like to order an Iced Caramel Macchiato, please.' },
        { role: 'ai', text: 'Great choice! What size would you like for your Macchiato?' }
      ]);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-darkBg pt-14 px-6 justify-between pb-6">
      {/* Top Header */}
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <Pressable
            onPress={() => setShowSummaryModal(true)}
            className="flex-row items-center gap-1.5 bg-error/20 px-3.5 py-1.5 rounded-full border border-error/30 active:bg-error/30"
          >
            <StopCircle color="#FF4D4D" size={14} />
            <Text className="text-xs font-bold text-error">Kết Thúc Phiên 🛑</Text>
          </Pressable>
          <View className="bg-darkCard px-3 py-1 rounded-full border border-gray-800">
            <Text className="text-xs font-bold text-gray-400">Lượt Thoại: {turns.length}</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-white mb-1">{scenario.title}</Text>
        <Text className="text-xs text-gray-400 font-medium">Nhân Vật Đối Thoại: {scenario.ai_persona}</Text>
      </View>

      {/* Realtime Conversation Turns List */}
      <ScrollView className="flex-1 my-3" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {turns.map((turn, idx) => (
            <View
              key={idx}
              className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                turn.role === 'user'
                  ? 'bg-primary self-end rounded-br-none'
                  : 'bg-darkCard border border-gray-800 self-start rounded-bl-none'
              }`}
            >
              <Text className={`text-[11px] font-bold mb-1 ${turn.role === 'user' ? 'text-white/80' : 'text-secondary'}`}>
                {turn.role === 'user' ? 'Bạn' : scenario.ai_persona}
              </Text>
              <Text className="text-sm font-medium text-white leading-6">{turn.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 3s Silence Hint Chip */}
      {showHint && (
        <View className="bg-accent/20 border border-accent/40 p-3.5 rounded-2xl mb-3 flex-row items-center gap-2">
          <Lightbulb color="#FFC93C" size={18} />
          <Text className="text-xs text-amber-300 font-medium flex-1">
            Gợi ý câu trả lời: "I'd like a medium Iced Latte, please."
          </Text>
        </View>
      )}

      {/* Voice Controls */}
      <View className="items-center mt-1">
        <Pressable
          onPress={handleSimulateUserTalk}
          disabled={isListening}
          className={`w-18 h-18 rounded-full justify-center items-center shadow-xl border-4 border-white ${
            isListening ? 'bg-secondary animate-pulse shadow-secondary' : 'bg-primary shadow-primary active:scale-95'
          }`}
        >
          <Mic color="#FFFFFF" size={28} />
        </Pressable>
        <Text className="text-xs text-gray-400 font-medium mt-3">
          {isListening ? 'Đang lắng nghe câu nói của bạn...' : 'Chạm micro để phát biểu câu tiếp theo'}
        </Text>
      </View>

      {/* Summary Evaluation Modal */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-darkCard p-6 rounded-3xl w-full border border-gray-800 shadow-2xl">
            <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center self-center mb-3 border border-success/40">
              <CheckCircle2 color="#2ECC71" size={32} />
            </View>

            <Text className="text-2xl font-bold text-white text-center mb-1">Tổng Kết Phiên Roleplay 🎉</Text>
            <Text className="text-xs text-gray-400 text-center mb-6">Đánh giá kết quả giao tiếp giọng nói 2 chiều</Text>

            <View className="bg-black/40 p-4 rounded-2xl mb-6 gap-2.5 border border-gray-800">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-gray-300 font-medium">Điểm Tổng Thể:</Text>
                <Text className="text-xs font-bold text-success">88 / 100</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-gray-300 font-medium">Lỗi Ngữ Pháp Phát Hiện:</Text>
                <Text className="text-xs font-bold text-warning">1 lỗi nhỏ</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-gray-300 font-medium">Tỷ Lệ Hoàn Thành Mục Tiêu:</Text>
                <Text className="text-xs font-bold text-secondary">100%</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowSummaryModal(false);
                router.back();
              }}
              className="bg-primary py-4 rounded-2xl items-center shadow-md active:bg-primaryDark"
            >
              <Text className="text-white font-bold text-base">Hoàn Thành & Trở Về ➔</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
