import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { clearChatHistory } from '../../data/chatbotApi';
import { useSendMessageMutation } from '../../application/useAiChatbot';
import { SentenceRefactorSheetModal } from './SentenceRefactorSheetModal';
import { ChatMessage } from '@/src/core/types/schema';

export const ChatSessionScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      message_id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là Loxera AI, trợ lý học tiếng Anh của bạn. Hãy hỏi tôi bất cứ điều gì về từ vựng, ngữ pháp, hoặc giao tiếp nhé! 👋',
      sent_at: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedRefactorList, setSelectedRefactorList] = useState<string[] | null>(null);

  // Clear backend history when screen mounts
  useEffect(() => {
    clearChatHistory();
  }, []);

  const { mutate: sendMessage, isPending } = useSendMessageMutation();

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const handleSend = () => {
    if (!input.trim() || isPending) return;

    const userMsg: ChatMessage = {
      message_id: `u-${Date.now()}`,
      role: 'user',
      content: input,
      sent_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    const textToSend = input;
    setInput('');
    scrollToBottom();

    sendMessage(textToSend, {
      onSuccess: (res) => {
        setMessages((prev) => [...prev, res]);
        scrollToBottom();
      }
    });
  };

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-6">
      {/* Header */}
      <View>
        <Pressable onPress={() => router.back()} className="mb-2">
          <Text className="text-primary font-bold text-sm">← Danh Sách Chat</Text>
        </Pressable>
        <Text className="text-xl font-bold text-neutralInk mb-4">Trợ Lý Sparky ⚡</Text>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} className="flex-1 my-2" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {messages.map((m) => (
            <View key={m.message_id}>
              <View
                className={`p-4 rounded-2xl max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-primary self-end rounded-br-none'
                    : 'bg-cardWhite border border-gray-100 self-start rounded-bl-none shadow-sm'
                }`}
              >
                <Text className={`text-xs font-bold mb-1 ${m.role === 'user' ? 'text-white/80' : 'text-secondary'}`}>
                  {m.role === 'user' ? 'Bạn' : 'Trợ Lý Sparky'}
                </Text>
                <Text className={`text-sm font-medium leading-6 ${m.role === 'user' ? 'text-white' : 'text-neutralInk'}`}>
                  {m.content}
                </Text>
              </View>

              {/* Inline Grammar & Refactor Suggestion Card */}
              {m.grammar_check && (
                <View className="bg-secondary/10 p-3 rounded-xl border border-secondary/30 mt-2 self-start max-w-[85%]">
                  <Text className="text-xs font-bold text-secondary mb-1">✨ Gợi Ý Diễn Đạt Tự Nhiên:</Text>
                  <Text className="text-xs text-neutralInk mb-2">{m.grammar_check.rule_explanation_vi}</Text>
                  {m.grammar_check.natural_alternatives && (
                    <Pressable
                      onPress={() => setSelectedRefactorList(m.grammar_check?.natural_alternatives || [])}
                      className="bg-secondary px-3 py-1.5 rounded-lg self-start"
                    >
                      <Text className="text-[10px] font-bold text-white">Xem 2 Cụm Câu Chuẩn Bản Xứ ➔</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          ))}
          {isPending && (
            <View className="bg-cardWhite p-3 rounded-2xl border border-gray-100 self-start shadow-sm flex-row items-center gap-2">
              <ActivityIndicator color="#0F7173" size="small" />
              <Text className="text-xs text-neutralGray">Sparky đang suy nghĩ...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View className="flex-row gap-2 items-center">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu tin nhắn tiếng Anh..."
          className="flex-1 bg-cardWhite px-4 py-3 rounded-xl border border-gray-200 text-neutralInk text-sm"
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || isPending}
          className={`w-12 h-12 rounded-xl justify-center items-center ${
            input.trim() && !isPending ? 'bg-primary shadow-sm' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white font-bold text-base">➔</Text>
        </Pressable>
      </View>

      <SentenceRefactorSheetModal
        visible={!!selectedRefactorList}
        alternatives={selectedRefactorList || []}
        onClose={() => setSelectedRefactorList(null)}
      />
    </View>
  );
};
