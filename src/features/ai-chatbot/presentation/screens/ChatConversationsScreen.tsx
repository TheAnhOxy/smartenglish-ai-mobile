import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Info,
  Smile,
  Mic,
  Send,
  Bot,
  ArrowLeft,
  RotateCcw,
  Volume2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sliders,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { speakText, stopSpeech } from '@/src/core/services/speechService';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  sendMessageToGemini,
  EnglishLevel,
  ChatHistoryItem,
  getEnglishLevel,
} from '../../data/geminiService';
import { colors, palette } from '@/src/theme/colors';
import { getChatQuotaApi, ChatQuota, TutorAudio } from '../../data/chatbotApi';
import { font } from '@/src/theme/typography';
import { MarkdownText } from '../components/MarkdownText';
import { useTutorVoice } from '../../application/useTutorVoice';
import { ThinkingIndicator } from '../components/ThinkingIndicator';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  isError?: boolean;
  rawError?: string;
  excludeHistory?: boolean;
  isQuota?: boolean;
  responseMs?: number;
}

const LEVELS: EnglishLevel[] = [
  'Beginner',
  'Elementary',
  'Intermediate',
  'Upper-Intermediate',
  'Advanced',
];

const SUGGESTIONS = [
  {
    icon: '✍️',
    title: 'Sửa câu tiếng Anh',
    prompt: 'I have went to school yesterday. Is this correct?',
  },
  {
    icon: '📚',
    title: 'Giải thích ngữ pháp',
    prompt: "What is the difference between 'make' and 'do'?",
  },
  {
    icon: '🔤',
    title: 'Học từ vựng',
    prompt: "What does 'achieve' mean? Give me IPA, examples, and collocations.",
  },
  {
    icon: '🗣️',
    title: 'Luyện hội thoại',
    prompt: 'Hi! Let us practice speaking English. Ask me a question about my day.',
  },
];

export const ChatConversationsScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const dailyLimit = isPremium ? 999 : 15;
  const [usedMessages, setUsedMessages] = useState(0);
  const [inputText, setInputText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EnglishLevel>(getEnglishLevel(currentUser?.cefr_level));
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const sending = useRef(false);
  const quotaVersion = useRef(0);
  useEffect(() => { setSelectedLevel(getEnglishLevel(currentUser?.cefr_level)); },
    [currentUser?.cefr_level]);
  useFocusEffect(useCallback(() => {
    let active = true;
    const version = ++quotaVersion.current;
    setQuota(null);
    setQuotaError(false);
    getChatQuotaApi().then((value) => { if (active && version === quotaVersion.current) setQuota(value); })
      .catch(() => { if (active && version === quotaVersion.current) setQuotaError(true); });
    return () => { active = false; };
  }, [currentUser?.id]));

  // AI Avatar Pulse Aura
  const avatarPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [avatarPulseAnim]);

  const avatarAuraStyle = {
    transform: [
      {
        scale: avatarPulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1.0, 1.25],
        }),
      },
    ],
    opacity: avatarPulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.6],
    }),
  };

  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'ai',
      content:
        "**Chào bạn, mình là Loxera AI.**\n\nGửi câu cần sửa, hỏi về từ vựng, phát âm, luyện hội thoại hoặc TOEIC/IELTS ngay tại đây. Mình sẽ tự nhận diện nhu cầu và hướng dẫn theo trình độ của bạn.\n\nHôm nay bạn muốn luyện điều gì?",
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  useEffect(() => {
    // Auto-scroll on initial load and message updates
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  /**
   * Convert current messages array to Gemini ChatHistoryItem[] format
   */
  const getGeminiHistory = (): ChatHistoryItem[] => {
    return messages
      .filter((m) => !m.isError && !m.excludeHistory && !m.id.startsWith('welcome-'))
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
  };

  /**
   * Send text to Gemini API
   */
  const handleSend = async (textToSend?: string, audio?: TutorAudio, fromVoice = false) => {
    const text = audio ? '' : (textToSend || inputText).trim();
    if ((!text && !audio) || sending.current) return;
    voice.cancel();
    const started = Date.now();
    sending.current = true;

    const timestamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: audio ? '🎙️ Đang nhận dạng giọng nói…' : text,
      timestamp,
    };

    const history = getGeminiHistory();

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setLastFailedMessage(null);

    // Call Gemini Service
    const response = await sendMessageToGemini(
      text,
      history,
      selectedLevel,
      audio
    );

    sending.current = false;
    setIsLoading(false);
    if (audio) {
      setMessages((prev) => prev.map((m) => m.id === userMsg.id
        ? { ...m, content: response.transcript || '🎙️ Tin nhắn thoại' } : m));
    }
    if (response.quota_used !== undefined && response.quota_limit !== undefined) {
      quotaVersion.current++;
      setQuota({ quota_used: response.quota_used, quota_limit: response.quota_limit,
        quota_exceeded: !!response.quota_exceeded ||
          (response.quota_limit !== null && response.quota_used >= response.quota_limit),
        is_premium: response.is_premium });
      setQuotaError(false);
    }
    if (response.quota_exceeded || !response.success) {
      setMessages((prev) => prev.map((m) => m.id === userMsg.id ? { ...m, excludeHistory: true } : m));
    }

    if (response.success) {
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: response.reply,
        responseMs: Date.now() - started,
        isQuota: !!response.quota_exceeded,
        excludeHistory: !!response.quota_exceeded,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, aiReply]);
      if (fromVoice && !response.quota_exceeded) {
        setIsSpeaking(aiReply.id);
        void speakText(response.reply.replace(/[*_`#]/g, ''), {
          language: /[àáạảãăâđêôơư]/i.test(response.reply) ? 'vi-VN' : 'en-US',
          rate: 1.0, onDone: () => setIsSpeaking(null), onError: () => setIsSpeaking(null),
        });
      }
    } else {
      setLastFailedMessage(audio ? null : text);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: response.error || 'Có lỗi xảy ra khi kết nối tới AI. Vui lòng thử lại.',
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isError: true,
        rawError: response.error || undefined,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const voice = useTutorVoice({
    onText: (text) => { void handleSend(text, undefined, true); },
    onAudio: (audio) => { void handleSend(undefined, audio, true); },
    onInterim: setInputText,
  });
  useFocusEffect(useCallback(() => () => voice.cancel(), [voice.cancel]));

  /**
   * Retry sending last failed message
   */
  const handleRetry = () => {
    if (!lastFailedMessage) return;
    // Remove last error message from list
    setMessages((prev) => prev.filter((m) => !m.isError));
    handleSend(lastFailedMessage);
  };

  /**
   * Reset conversation history
   */
  const handleResetChat = () => {
    Alert.alert(
      'Làm mới đoạn chat',
      'Bạn có chắc chắn muốn xóa lịch sử đoạn chat hiện tại và bắt đầu lại?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu lại',
          style: 'destructive',
          onPress: () => {
            if (sending.current) return;
            Speech.stop();
            setLastFailedMessage(null);
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: 'ai',
                content: `👋 **Lịch sử đã được làm mới!**\nTrình độ hiện tại: **${selectedLevel}**. Tôi sẽ tự nhận diện nhu cầu của bạn.\n\nHãy gửi câu hỏi tiếng Anh của bạn hoặc chọn các gợi ý bên dưới!`,
                timestamp: new Date().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
          },
        },
      ]
    );
  };

  /**
   * Text to Speech playback for English messages
   */
  const handleSpeak = (msgId: string, text: string) => {
    stopSpeech();
    Speech.stop();
    if (isSpeaking === msgId) {
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(msgId);
    // Strip markdown formatting for cleaner speech output
    const cleanText = text.replace(/[*_`#]/g, '').trim();

    void speakText(cleanText, {
      language: /[àáạảãăâđêôơư]/i.test(text) ? 'vi-VN' : 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(null),
      onError: () => setIsSpeaking(null),
    });
  };

  // Ngắt toàn bộ âm thanh khi người dùng rời màn hình (unmount hoặc chuyển tab/back)
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        setIsSpeaking(null);
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      stopSpeech();
      Speech.stop();
      setIsSpeaking(null);
    };
  }, []);

  const safeTop = (insets.top || 16) + 8;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: safeTop }]}>
        <View style={s.headerTopRow}>
          <View style={s.headerLeft}>
            <Pressable
              onPress={() => {
                stopSpeech();
                Speech.stop();
                setIsSpeaking(null);
                router.back();
              }}
              style={s.backBtn}
              hitSlop={8}
            >
              <ArrowLeft color="#1E293B" size={22} />
            </Pressable>

            <View style={s.aiAvatarContainer}>
              <Animated.View style={[s.avatarPulseAura, avatarAuraStyle]} />
              <View style={s.aiAvatarCircle}>
                <Bot color="#0EA5E9" size={24} />
                <View style={s.onlineBadge} />
              </View>
            </View>

            <View>
              <Text style={s.aiName}>Loxera AI Tutor</Text>
              <Text style={s.statusSubtitle}>
                Trợ lý tiếng Anh · {selectedLevel}
              </Text>
            </View>
          </View>

          <View style={s.headerActions}>
            <Pressable
              onPress={() => setShowLevelPicker(!showLevelPicker)}
              style={[s.iconHeaderBtn, showLevelPicker && s.iconHeaderBtnActive]}
              hitSlop={6}
            >
              <Sliders size={18} color={showLevelPicker ? '#0EA5E9' : '#64748B'} />
            </Pressable>

            <Pressable onPress={handleResetChat} style={s.iconHeaderBtn} hitSlop={6}>
              <RotateCcw size={18} color="#64748B" />
            </Pressable>
          </View>
        </View>

        {/* Level Selector Dropdown Bar */}
        {showLevelPicker && (
          <View style={s.levelPickerContainer}>
            <Text style={s.levelPickerLabel}>Trình độ của bạn:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.levelChipsRow}>
                {LEVELS.map((lvl) => (
                  <Pressable
                    key={lvl}
                    onPress={() => {
                      setSelectedLevel(lvl);
                      setShowLevelPicker(false);
                    }}
                    style={[
                      s.levelChip,
                      selectedLevel === lvl && s.levelChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.levelChipText,
                        selectedLevel === lvl && s.levelChipTextActive,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

      </View>

      <Pressable style={s.quotaBanner}
        onPress={() => { if (quota && quota.quota_limit !== null) router.push('/(student)/shop'); }}>
        <Text style={s.quotaText}>
          {quota ? quota.quota_limit === null ? 'Premium · Học cùng Loxera AI không giới hạn'
            : `Quota hôm nay: còn ${Math.max(0, quota.quota_limit - quota.quota_used)}/${quota.quota_limit} tin nhắn Gemini AI`
            : quotaError ? 'Chưa tải được lượt chat · Sẽ kiểm tra khi gửi tin' : 'Đang kiểm tra lượt chat…'}
        </Text>
        {quota?.quota_exceeded && <Text style={s.quotaText}>Xem gói nâng cấp →</Text>}
      </Pressable>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollRef}
        style={s.messagesScroll}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <View key={msg.id} style={s.userBubbleWrap}>
                <View style={s.userBubble}>
                  <Text style={s.userText}>{msg.content}</Text>
                </View>
                <Text style={s.timestampText}>{msg.timestamp}</Text>
              </View>
            );
          }

          if (msg.isError) {
            return (
              <View key={msg.id} style={s.errorCardWrap}>
                <View style={s.errorCard}>
                  <View style={s.errorHeader}>
                    <AlertCircle size={18} color="#DC2626" />
                    <Text style={s.errorTitle}>Lỗi kết nối AI</Text>
                  </View>
                  <Text style={s.errorContent}>{msg.content}</Text>
                  <View style={s.errorActionRow}>
                    <Pressable onPress={handleRetry} style={s.retryBtn}>
                      <RefreshCw size={14} color="#FFFFFF" />
                      <Text style={s.retryBtnText}>Thử lại</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={s.timestampText}>{msg.timestamp}</Text>
              </View>
            );
          }

          // AI Response Message
          return (
            <View key={msg.id} style={s.aiBubbleWrap}>
              <View style={s.aiBubbleHeader}>
                <View style={s.aiBadgeSmall}>
                  <Bot size={12} color="#0EA5E9" />
                  <Text style={s.aiBadgeSmallText}>Loxera AI Tutor</Text>
                </View>

                {/* Speak TTS Button */}
                <Pressable
                  onPress={() => handleSpeak(msg.id, msg.content)}
                  style={[s.speakBtn, isSpeaking === msg.id && s.speakBtnActive]}
                  hitSlop={6}
                >
                  <Volume2
                    size={14}
                    color={isSpeaking === msg.id ? '#0EA5E9' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      s.speakBtnText,
                      isSpeaking === msg.id && s.speakBtnTextActive,
                    ]}
                  >
                    {isSpeaking === msg.id ? 'Đang đọc...' : 'Đọc câu mẫu'}
                  </Text>
                </Pressable>
              </View>

              <View style={s.aiBubble}>
                <MarkdownText content={msg.content} textColor="#1E293B" />
              </View>
              {msg.isQuota && <Pressable onPress={() => router.push('/(student)/shop')}>
                <Text style={s.quotaText}>Xem gói nâng cấp →</Text>
              </Pressable>}
              <Text style={s.timestampText}>{msg.timestamp}{msg.responseMs ? ` · ${(msg.responseMs / 1000).toFixed(1)} giây` : ''}</Text>
            </View>
          );
        })}

        {/* Loading / Thinking Animation Indicator */}
        {isLoading && <ThinkingIndicator />}

        {/* Suggestion Chips (Shown at start or when reset) */}
        {messages.length <= 2 && !isLoading && (
          <View style={s.suggestionsSection}>
            <Text style={s.suggestionsHeader}>💡 Bạn có thể hỏi Loxera AI:</Text>
            <View style={s.suggestionsGrid}>
              {SUGGESTIONS.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSend(item.prompt)}
                  style={s.suggestionCard}
                >
                  <Text style={s.suggestionIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.suggestionTitle}>{item.title}</Text>
                    <Text style={s.suggestionPrompt} numberOfLines={2}>
                      "{item.prompt}"
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.voiceOptions}>
        <Pressable accessibilityLabel="Đổi ngôn ngữ nhận giọng nói" disabled={voice.listening || isLoading}
          onPress={() => voice.setLanguage(voice.language === 'en-US' ? 'vi-VN' : 'en-US')}>
          <Text style={s.voiceStatus}>Micro: {voice.language === 'en-US' ? 'English' : 'Tiếng Việt'} · Nói xong tự gửi</Text>
        </Pressable>
        {Platform.OS === 'web' && <Pressable disabled={voice.listening || isLoading}
          onPress={() => voice.setRecordAudio(!voice.recordAudio)}>
          <Text style={s.voiceStatus}>{voice.recordAudio ? 'Chế độ: Ghi âm gửi AI' : 'Chế độ: Nhận giọng nói'}</Text>
        </Pressable>}
      </View>
      {(voice.listening || voice.processing || voice.error) && <View style={s.voiceOptions}>
        <Text accessibilityLiveRegion="polite" style={s.voiceStatus}>
          {voice.listening ? 'Đang nghe… Bấm micro để dừng (tối đa 20 giây).'
            : voice.processing ? 'Đang xử lý ghi âm…' : voice.error}
        </Text>
        {voice.listening && <Pressable onPress={voice.cancel}><Text style={s.voiceStatus}>Hủy</Text></Pressable>}
      </View>}
      {/* Input Bar */}
      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={voice.listening ? 'Dừng micro và gửi' : 'Mở micro'}
          disabled={isLoading || voice.processing}
          onPress={() => { if (voice.listening) { void voice.stop(); } else {
            void stopSpeech().then(() => voice.start());
          } }}
          style={[s.micBtn, voice.listening && s.micBtnActive]}>
          <Mic size={20} color={voice.listening ? colors.surface : colors.primary} />
        </Pressable>
        <TextInput
          maxLength={4000}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            isLoading
              ? 'Loxera AI đang suy nghĩ...'
              : 'Hỏi Loxera hoặc gửi câu tiếng Anh cần sửa…'
          }
          placeholderTextColor="#94A3B8"
          style={s.textInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          multiline={false}
          editable={!isLoading}
        />

        <Pressable
          onPress={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          style={[
            s.sendBtn,
            (isLoading || !inputText.trim()) && s.sendBtnDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send color="#FFFFFF" size={18} />
          )}
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  voiceOptions: { paddingHorizontal: 16, paddingVertical: 4, backgroundColor: colors.surface,
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  voiceStatus: { fontSize: 11, color: colors.textSoft },
  micBtn: { padding: 12, borderRadius: 24, backgroundColor: colors.surfaceMuted },
  micBtnActive: { backgroundColor: colors.primary },
  root: { flex: 1, backgroundColor: '#F8FAFC', maxWidth: 600, width: '100%', alignSelf: 'center' },

  // Quota Banner
  quotaBanner: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  quotaText: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },

  // Header
  header: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  aiAvatarContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPulseAura: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0EA5E9',
  },
  aiAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0.5,
    right: 0.5,
    width: 12,
    height: 12,
    borderRadius: 9999,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  geminiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  geminiBadgeText: { fontSize: 9, fontWeight: '800', color: '#0284C7' },
  statusSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconHeaderBtnActive: { backgroundColor: '#E0F2FE' },

  // Level Picker
  levelPickerContainer: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelPickerLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  levelChipsRow: { flexDirection: 'row', gap: 6 },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  levelChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  levelChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  levelChipTextActive: { color: '#FFFFFF' },



  // Scroll Content
  messagesScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  messagesContent: { paddingBottom: 24 },

  // User Message Bubble
  userBubbleWrap: { marginBottom: 18, maxWidth: '82%', alignSelf: 'flex-end' },
  userBubble: {
    backgroundColor: palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  userText: { fontSize: 14, color: '#FFFFFF', fontFamily: font.family, fontWeight: '500', lineHeight: 21 },
  timestampText: { fontSize: 10, color: palette.textSoft, marginTop: 4, marginHorizontal: 4 },

  // AI Message Bubble
  aiBubbleWrap: { marginBottom: 18, maxWidth: '90%', alignSelf: 'flex-start' },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiBadgeSmall: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBadgeSmallText: { fontSize: 11, fontFamily: font.family, fontWeight: '800', color: palette.primary },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: palette.primarySoft,
  },
  speakBtnActive: { backgroundColor: colors.primaryDeep },
  speakBtnText: { fontSize: 10, fontFamily: font.family, fontWeight: '700', color: palette.primary },
  speakBtnTextActive: { color: '#FFFFFF' },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Error Card
  errorCardWrap: { marginBottom: 16, maxWidth: '85%', alignSelf: 'flex-start' },
  errorCard: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  errorTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  errorContent: { fontSize: 12, color: '#7F1D1D', fontWeight: '500', lineHeight: 18, marginBottom: 10 },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  errorActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  changeKeyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 8,
    borderRadius: 10,
  },
  changeKeyBtnText: { color: '#0284C7', fontSize: 12, fontWeight: '800' },

  // Key Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 10,
  },
  modalGuideText: { fontSize: 11, color: '#0284C7', fontWeight: '500', lineHeight: 16, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Suggestions Section
  suggestionsSection: { marginTop: 12, marginBottom: 20 },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
  },
  suggestionsGrid: { gap: 10 },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionIcon: { fontSize: 20 },
  suggestionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  suggestionPrompt: { fontSize: 11, color: '#64748B', marginTop: 2 },

  // Bottom Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#94A3B8', opacity: 0.6 },
});
