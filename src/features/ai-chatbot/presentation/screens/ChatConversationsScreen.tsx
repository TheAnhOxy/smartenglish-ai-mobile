import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Info, Smile, Mic, Send, Zap, Sparkles, Bot } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

type MessageRole = 'ai' | 'user';
type MessageType = 'text' | 'tip_card' | 'structured_card';

interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: string;
  tipTitle?: string;
  tipChips?: string[];
  structuredSections?: {
    icon: string;
    title: string;
    titleColor: string;
    desc: string;
    examples: string;
  }[];
}

export const ChatConversationsScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';
  const scrollRef = useRef<ScrollView>(null);

  const dailyLimit = isPremium ? 999 : 20;
  const [usedMessages, setUsedMessages] = useState(6);
  const [inputText, setInputText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Tự do');

  const topicChips = ['Tự do', 'Du lịch', 'Công việc', 'Ngữ pháp', 'Phát âm', 'IELTS'];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'ai',
      type: 'text',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn về tiếng Anh hôm nay? 😊',
      timestamp: '10:02 AM',
    },
    {
      id: 'm2',
      role: 'user',
      type: 'text',
      content: "Can you explain the difference between 'make' and 'do'?",
      timestamp: '10:03 AM',
    },
    {
      id: 'm3',
      role: 'ai',
      type: 'tip_card',
      content: '"Could you explain..." nghe tự nhiên hơn khi nhờ và trang trọng.',
      timestamp: '',
      tipTitle: 'Gợi ý học tập',
      tipChips: ['I was wondering if...', 'Would you mind...'],
    },
    {
      id: 'm4',
      role: 'ai',
      type: 'structured_card',
      content: "Sự khác nhau giữa 'Make' và 'Do'",
      timestamp: '10:03 AM',
      structuredSections: [
        {
          icon: '🔧',
          title: 'DO (Hành động/Quy trình)',
          titleColor: '#0EA5E9',
          desc: 'Dùng cho các công việc hàng ngày, nhiệm vụ hoặc hoạt động không tạo ra vật thể mới.',
          examples: 'VD: Do homework, do business, do exercise.',
        },
        {
          icon: '✨',
          title: 'MAKE (Sáng tạo/Xây dựng)',
          titleColor: '#F59E0B',
          desc: 'Dùng khi bạn tạo ra thứ gì đó mới hoặc gây ra một phản ứng/kết quả.',
          examples: 'VD: Make coffee, make a mistake, make a decision.',
        },
      ],
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      type: 'text',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setUsedMessages((p) => p + 1);

    // Simulate AI response
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'ai',
        type: 'text',
        content: 'Đó là một câu hỏi hay! Hãy để tôi giải thích cho bạn... 🤔\n\nTrong tiếng Anh, cấu trúc này thường được sử dụng trong các tình huống giao tiếp hàng ngày. Bạn có thể luyện tập thêm qua bài tập Flashcard nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1200);

    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F0E8]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Daily Quota Banner */}
      {!isPremium && (
        <View className="bg-[#FEF3C7] py-2 items-center">
          <Text className="text-[11px] font-semibold text-[#92400E]">
            Còn {dailyLimit - usedMessages}/{dailyLimit} tin nhắn hôm nay
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="pt-10 pb-3 px-5 bg-[#F5F0E8] border-b border-[#E8DFD0]">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-3">
            {/* AI Avatar */}
            <View className="w-11 h-11 rounded-full bg-[#E0F2FE] justify-center items-center border-2 border-[#BAE6FD]">
              <Bot color="#0EA5E9" size={22} />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-extrabold text-[#1E293B]">AI Trợ lý</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <Text className="text-[10px] font-bold text-[#22C55E] uppercase">TRỰC TUYẾN</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => alert('Thông tin AI Trợ lý: Giải đáp thắc mắc Ngữ pháp, Từ vựng, Phát âm 24/7')}
            className="w-9 h-9 rounded-full bg-white/60 justify-center items-center"
          >
            <Info color="#64748B" size={18} />
          </Pressable>
        </View>

        {/* Topic Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
          <View className="flex-row gap-2">
            {topicChips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setSelectedTopic(chip)}
                className={`px-4 py-2 rounded-full border ${
                  selectedTopic === chip
                    ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                    : 'bg-white border-[#D6CFC3]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedTopic === chip ? 'text-white' : 'text-[#4B4033]'
                  }`}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <View key={msg.id} className="mb-3 items-end">
                <View className="bg-[#334155] px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%]">
                  <Text className="text-sm text-white font-medium leading-5">{msg.content}</Text>
                </View>
                <Text className="text-[10px] text-[#9B8E7E] mt-1 mr-1">{msg.timestamp}</Text>
              </View>
            );
          }

          if (msg.type === 'tip_card') {
            return (
              <View key={msg.id} className="mb-3 max-w-[85%]">
                <View className="bg-[#FEF9E7] p-4 rounded-2xl border border-[#F5E6B8]">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Zap color="#D97706" size={14} fill="#D97706" />
                    <Text className="text-xs font-bold text-[#92400E]">{msg.tipTitle}</Text>
                  </View>
                  <Text className="text-sm text-[#4B4033] font-medium leading-5 mb-3">{msg.content}</Text>

                  {msg.tipChips && (
                    <View className="flex-row flex-wrap gap-2">
                      {msg.tipChips.map((chip) => (
                        <Pressable
                          key={chip}
                          onPress={() => setInputText(chip)}
                          className="bg-white px-3 py-1.5 rounded-full border border-[#E8DFD0] active:bg-gray-50"
                        >
                          <Text className="text-[11px] font-semibold text-[#4B4033]">"{chip}"</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          }

          if (msg.type === 'structured_card') {
            return (
              <View key={msg.id} className="mb-3 max-w-[88%]">
                <View className="bg-white p-5 rounded-2xl border border-[#E8DFD0] shadow-sm">
                  <Text className="text-base font-bold text-[#1E293B] mb-4">{msg.content}</Text>

                  {msg.structuredSections?.map((section, idx) => (
                    <View key={idx} className="mb-4">
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <Text className="text-sm">{section.icon}</Text>
                        <Text className="text-sm font-bold" style={{ color: section.titleColor }}>
                          {section.title}
                        </Text>
                      </View>
                      <Text className="text-xs text-[#4B4033] font-medium leading-5 mb-2">
                        {section.desc}
                      </Text>
                      <View className="border-l-2 border-[#E8DFD0] pl-3">
                        <Text className="text-xs text-[#64748B] italic leading-5">{section.examples}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text className="text-[10px] text-[#9B8E7E] mt-1 ml-1">{msg.timestamp}</Text>
              </View>
            );
          }

          // Default AI text message
          return (
            <View key={msg.id} className="mb-3 max-w-[80%]">
              <View className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-[#E8DFD0]">
                <Text className="text-sm text-[#334155] font-medium leading-5">{msg.content}</Text>
              </View>
              <Text className="text-[10px] text-[#9B8E7E] mt-1 ml-1">{msg.timestamp}</Text>
            </View>
          );
        })}

        <View className="h-4" />
      </ScrollView>

      {/* Bottom Input Bar */}
      <View className="px-4 py-3 bg-white border-t border-[#E8DFD0] flex-row items-center gap-2">
        <Pressable className="p-1.5">
          <Smile color="#9B8E7E" size={22} />
        </Pressable>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập câu hỏi..."
          placeholderTextColor="#9B8E7E"
          className="flex-1 bg-[#F5F0E8] px-4 py-2.5 rounded-2xl text-sm font-medium text-[#334155]"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <Pressable
          onPress={() => alert('Đang ghi âm giọng nói...')}
          className="p-1.5"
        >
          <Mic color="#9B8E7E" size={22} />
        </Pressable>

        <Pressable
          onPress={handleSend}
          className="w-10 h-10 rounded-full bg-[#1E3A5F] justify-center items-center shadow-md active:bg-[#162D4A]"
        >
          <Send color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
