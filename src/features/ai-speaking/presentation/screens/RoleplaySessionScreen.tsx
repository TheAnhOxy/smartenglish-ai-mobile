import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Mic,
  Lightbulb,
  X,
  Volume2,
  VolumeX,
  Flame,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Keyboard,
  Send,
  Trash2,
  Square,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import {
  MOCK_ROLEPLAY_SCENARIOS,
  fetchRoleplayScenariosApi,
  sendRoleplayChatApi,
  RoleplayScenario,
  useSpeakingQuotaStore,
  FREE_SPEAKING_DAILY_LIMIT,
} from '../../data/speakingApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { stopSpeech } from '@/src/core/services/speechService';

interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
}

export const RoleplaySessionScreen = () => {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const { getQuota, consumeTurn, canChat } = useSpeakingQuotaStore();
  const quota = getQuota(isPremium);

  const [scenario, setScenario] = useState<RoleplayScenario>(
    MOCK_ROLEPLAY_SCENARIOS.find((s) => s.id === scenarioId) || MOCK_ROLEPLAY_SCENARIOS[0]
  );
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  
  // Trạng thái thu âm và xử lý
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');

  const [showHint, setShowHint] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [isAiVoiceMuted, setIsAiVoiceMuted] = useState(false);

  // Web SpeechRecognition ref & auto-scroll ref
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // Tải thông tin kịch bản từ backend
  useEffect(() => {
    fetchRoleplayScenariosApi().then((list) => {
      const found = list.find((s) => s.id === String(scenarioId));
      if (found) {
        setScenario(found);
        setTurns([{ role: 'ai', text: found.opening_line }]);
        if (!isAiVoiceMuted && found.opening_line) {
          const cleanSpeech = found.opening_line.split(/💡/)[0].trim();
          Speech.speak(cleanSpeech || found.opening_line, { language: 'en-US' });
        }
      } else {
        setTurns([{ role: 'ai', text: scenario.opening_line }]);
        if (!isAiVoiceMuted && scenario.opening_line) {
          const cleanSpeech = scenario.opening_line.split(/💡/)[0].trim();
          Speech.speak(cleanSpeech || scenario.opening_line, { language: 'en-US' });
        }
      }
    });

    return () => {
      stopSpeech();
      Speech.stop();
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [scenarioId]);

  // Ngắt toàn bộ âm thanh và micro khi màn hình unmount hoặc mất focus (chuyển tab/back)
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        isRecordingRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
      };
    }, [])
  );

  // Gợi ý câu nói sau 3.5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [turns]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc khi AI đang suy nghĩ
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [turns, isProcessing]);

  // Bật / Tắt thu âm micro và nhận diện giọng nói trực tiếp vào ô text:
  // Nhấn 1 lần để nói, nhấn lại lần nữa để kết thúc (không tự ngắt khi ngừng nghỉ)
  const toggleRecording = () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current = null;
      }
    } else {
      if (!canChat(isPremium)) {
        setShowQuotaModal(true);
        return;
      }
      isRecordingRef.current = true;
      setIsRecording(true);

      if (typeof window !== 'undefined') {
        const SpeechRecognitionClass =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          try {
            const rec = new SpeechRecognitionClass();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';
            rec.onresult = (event: any) => {
              let transcript = '';
              for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
              }
              if (transcript) {
                setInputText(transcript.trim());
              }
            };
            rec.onerror = (e: any) => {
              console.log('[Roleplay SpeechRecognition] error:', e);
              if (e.error === 'not-allowed') {
                isRecordingRef.current = false;
                setIsRecording(false);
              }
            };
            rec.onend = () => {
              // Tiếp tục nghe nếu người dùng chưa bấm tắt
              if (isRecordingRef.current) {
                try {
                  rec.start();
                } catch (_) {}
              } else {
                setIsRecording(false);
              }
            };
            rec.start();
            recognitionRef.current = rec;
          } catch (e) {
            console.log('[Roleplay SpeechRecognition] start error:', e);
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }
      }
    }
  };

  // Gửi tin nhắn từ ô nhập text (hoặc sau khi nói qua micro)
  const handleSendMessage = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const textToSend =
      inputText.trim() ||
      (scenario.suggested_keywords && scenario.suggested_keywords.length > 0
        ? `Hello! ${scenario.suggested_keywords[0]}, please.`
        : 'Hello! I am ready to practice conversation with you.');

    if (!textToSend || isProcessing) return;

    setInputText('');
    handleSendUserTurn(textToSend);
  };

  // Gửi tin nhắn và xử lý phản hồi từ AI
  const handleSendUserTurn = async (customPrompt?: string) => {
    setShowHint(false);

    // Kiểm tra hạn mức lượt chat hôm nay
    if (!canChat(isPremium)) {
      setShowQuotaModal(true);
      return;
    }

    setIsProcessing(true);

    const defaultSuggestion =
      scenario.suggested_keywords && scenario.suggested_keywords.length > 0
        ? `Hello! ${scenario.suggested_keywords[0]}, please.`
        : 'Hello! I am ready to practice conversation with you.';

    const userText =
      customPrompt ||
      (turns.length === 1
        ? defaultSuggestion
        : turns.length === 3
        ? 'Could you tell me more about that, please?'
        : 'Thank you very much! That was helpful.');

    // Trừ 1 lượt
    const consumed = consumeTurn(isPremium);
    if (!consumed) {
      setIsProcessing(false);
      setShowQuotaModal(true);
      return;
    }

    // Hiển thị tin nhắn người dùng
    setTurns((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const aiResult = await sendRoleplayChatApi(
        scenario.id,
        userText,
        currentUser ? String(currentUser.id) : undefined,
        isPremium
      );

      const aiText =
        aiResult.aiResponse || 'That sounds great! How else can I help you today?';
      setTurns((prev) => [...prev, { role: 'ai', text: aiText }]);

      if (!isAiVoiceMuted) {
        const cleanSpeech = aiText.split(/💡/)[0].trim();
        Speech.speak(cleanSpeech || aiText, { language: 'en-US' });
      }
    } catch (err: any) {
      console.warn('[RoleplaySession] sendChat error:', err);
      const fallbackAi = 'Understood! Would you like to practice anything else?';
      setTurns((prev) => [...prev, { role: 'ai', text: fallbackAi }]);
      if (!isAiVoiceMuted) {
        const cleanSpeech = fallbackAi.split(/💡/)[0].trim();
        Speech.speak(cleanSpeech || fallbackAi, { language: 'en-US' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendTextMessage = () => {
    if (!inputText.trim() || isProcessing) return;
    const msg = inputText.trim();
    setInputText('');
    handleSendUserTurn(msg);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSpeakAiLine = (text: string) => {
    Speech.stop();
    const cleanSpeech = text.split(/💡/)[0].trim();
    Speech.speak(cleanSpeech || text, { language: 'en-US' });
  };

  const partnerAvatar =
    scenario.partner_avatar_url ||
    scenario.image_url ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';

  return (
    <View style={s.root}>
      {/* ── TOP BAR (Sạch sẽ, thân thiện, không icon robot) ────────────────── */}
      <View style={s.topBar}>
        <Pressable
          onPress={() => {
            stopSpeech();
            Speech.stop();
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (_) {}
            }
            setShowSummaryModal(true);
          }}
          style={({ pressed }) => [s.exitBtn, pressed && { opacity: 0.7 }]}
        >
          <X color="#475569" size={17} />
          <Text style={s.exitBtnText}>Rời phòng</Text>
        </Pressable>

        {/* AI Partner Profile ở giữa */}
        <View style={s.partnerCenter}>
          <View style={s.avatarWrap}>
            <Image source={{ uri: partnerAvatar }} style={s.avatarImg} />
            <View style={s.onlineDot} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={s.partnerNameRow}>
              <Text style={s.partnerName} numberOfLines={1}>
                {scenario.partner_name || scenario.ai_persona}
              </Text>
              <View style={s.aiTag}>
                <Text style={s.aiTagText}>AI</Text>
              </View>
            </View>
            <Text style={s.scenarioSub} numberOfLines={1}>
              {scenario.title}
            </Text>
          </View>
        </View>

        {/* Cụm chức năng góc phải: Quota + Mute */}
        <View style={s.topRightRow}>
          <View style={s.quotaPill}>
            {isPremium ? (
              <Sparkles color="#6366F1" size={12} />
            ) : (
              <Flame color="#EA580C" size={12} />
            )}
            <Text style={s.quotaPillText}>
              {isPremium ? 'VIP' : `${quota.remaining}/${FREE_SPEAKING_DAILY_LIMIT}`}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (!isAiVoiceMuted) Speech.stop();
              setIsAiVoiceMuted(!isAiVoiceMuted);
            }}
            style={s.iconBtn}
          >
            {isAiVoiceMuted ? (
              <VolumeX color="#94A3B8" size={16} />
            ) : (
              <Volume2 color="#4F46E5" size={16} />
            )}
          </Pressable>
        </View>
      </View>

      {/* ── KHUNG HỘI THOẠI 2 CHIỀU ───────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={s.chatScroll}
        contentContainerStyle={s.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.noticePill}>
          <Text style={s.noticeText}>
            Đang kết nối hội thoại trực tiếp với {scenario.partner_name || scenario.ai_persona}
          </Text>
        </View>

        {turns.map((turn, idx) => {
          const isAi = turn.role === 'ai';
          const parts = isAi ? turn.text.split(/(?:^|\n+)💡\s*/) : [turn.text];
          const mainText = parts[0]?.trim() || turn.text;
          const feedbackText = parts.length > 1 ? parts.slice(1).join('\n').trim() : null;

          return (
            <View
              key={idx}
              style={[s.messageRow, isAi ? s.messageRowAi : s.messageRowUser]}
            >
              {isAi && (
                <View style={s.aiAvatarSmall}>
                  <Text style={s.aiAvatarInitial}>
                    {(scenario.partner_name || scenario.ai_persona || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={[s.bubble, isAi ? s.bubbleAi : s.bubbleUser]}>
                <View style={s.bubbleHeader}>
                  <Text style={[s.bubbleSender, isAi ? s.senderAi : s.senderUser]}>
                    {isAi ? (scenario.partner_name || scenario.ai_persona) : 'Bạn'}
                  </Text>
                  {isAi && (
                    <Pressable
                      onPress={() => handleSpeakAiLine(mainText)}
                      style={s.speakerMiniBtn}
                    >
                      <Volume2 color="#64748B" size={14} />
                    </Pressable>
                  )}
                </View>

                <Text style={[s.bubbleText, isAi ? s.textAi : s.textUser]}>
                  {mainText}
                </Text>

                {/* Góp ý tiếng Việt từ AI nếu có */}
                {isAi && feedbackText && (
                  <View style={s.inlineFeedbackCard}>
                    <View style={s.inlineFeedbackHeader}>
                      <Lightbulb color="#D97706" size={13} />
                      <Text style={s.inlineFeedbackTitle}>Góp ý tiếng Việt:</Text>
                    </View>
                    <Text style={s.inlineFeedbackText}>{feedbackText}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* AI Thinking Indicator (loading ... giống FE admin) */}
        {isProcessing && (
          <View style={[s.messageRow, s.messageRowAi]}>
            <View style={s.aiAvatarSmall}>
              <Text style={s.aiAvatarInitial}>
                {(scenario.partner_name || scenario.ai_persona || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={[s.bubble, s.bubbleAi, s.bubbleThinking]}>
              <View style={s.thinkingContent}>
                <ActivityIndicator color="#4F46E5" size="small" />
                <Text style={s.thinkingText}>
                  {scenario.partner_name || scenario.ai_persona || 'AI'} đang suy nghĩ...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── GỢI Ý CÂU NÓI (HINT BOX) ──────────────────────────────────────── */}
      {showHint && (
        <Pressable
          onPress={() => {
            const hintPrompt =
              scenario.suggested_keywords && scenario.suggested_keywords.length > 0
                ? `I would like to ${scenario.suggested_keywords[0].toLowerCase()}, please.`
                : 'I understand. Could you tell me more about that?';
            handleSendUserTurn(hintPrompt);
          }}
          style={({ pressed }) => [s.hintCard, pressed && { opacity: 0.85 }]}
        >
          <View style={s.hintHeader}>
            <Lightbulb color="#D97706" size={15} />
            <Text style={s.hintLabel}>Gợi ý câu trả lời nhanh:</Text>
            <Text style={s.hintTapText}>Chạm để gửi →</Text>
          </View>
          <Text style={s.hintQuote} numberOfLines={2}>
            "{scenario.suggested_keywords && scenario.suggested_keywords.length > 0
              ? `I would like to ${scenario.suggested_keywords[0].toLowerCase()}, please.`
              : 'I understand. Could you tell me more about that?'}"
          </Text>
        </Pressable>
      )}

      {/* ── KHU VỰC ĐIỀU KHIỂN DƯỚI CHÂN: THANH NHẬP LIỆU DUY NHẤT (MICRO + TEXT + NÚT GỬI) ── */}
      <View style={s.bottomControl}>
        <View style={[s.textInputRow, isRecording && s.textInputRowRecording]}>
          {/* Nút Micro bên trái: Bấm để bật/tắt thu âm và nhận diện giọng nói */}
          <Pressable
            onPress={toggleRecording}
            disabled={isProcessing}
            style={({ pressed }) => [
              s.micBtnInBar,
              isRecording ? s.micBtnRecording : s.micBtnIdle,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Mic color={isRecording ? '#DC2626' : '#4F46E5'} size={20} />
          </Pressable>

          {/* Ô nhập văn bản / hiển thị trực tiếp giọng nói khi đang nói */}
          <TextInput
            placeholder={
              isRecording
                ? 'Đang lắng nghe... Hãy nói câu tiếng Anh của bạn'
                : 'Nhập câu trả lời bằng tiếng Anh...'
            }
            placeholderTextColor={isRecording ? '#EA580C' : '#94A3B8'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            style={[s.textInputField, isRecording && s.textInputFieldRecording]}
            editable={!isProcessing}
          />

          {/* Nút Gửi bên phải: Xoay vòng tròn ActivityIndicator khi AI đang xử lý phản hồi */}
          <Pressable
            onPress={handleSendMessage}
            disabled={(!inputText.trim() && !isRecording) || isProcessing}
            style={[
              s.sendBtn,
              (inputText.trim() || isRecording) && !isProcessing
                ? s.sendBtnActive
                : s.sendBtnDisabled,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send color="#FFFFFF" size={17} />
            )}
          </Pressable>
        </View>

        {/* Hàng thông tin bên dưới: Trạng thái & số lượt còn lại */}
        <View style={s.textHelpRow}>
          {!isPremium && (
            <Text style={s.quotaDescText}>
              Còn {quota.remaining}/{FREE_SPEAKING_DAILY_LIMIT} lượt
            </Text>
          )}
        </View>
      </View>

      {/* ── MODAL TỔNG KẾT PHIÊN LUYỆN NÓI ───────────────────────────────── */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalSuccessIconWrap}>
              <CheckCircle2 color="#16A34A" size={28} />
            </View>

            <Text style={s.modalHeading}>Kết Quả Luyện Nói</Text>
            <Text style={s.modalSubheading}>
              Đánh giá phản xạ đàm thoại với {scenario.ai_persona}
            </Text>

            <View style={s.scoreBox}>
              <View style={s.scoreItem}>
                <Text style={s.scoreNumber}>{turns.length}</Text>
                <Text style={s.scoreLabel}>Lượt thoại</Text>
              </View>
              <View style={s.scoreDivider} />
              <View style={s.scoreItem}>
                <Text style={[s.scoreNumber, { color: '#4F46E5' }]}>88%</Text>
                <Text style={s.scoreLabel}>Độ trôi chảy</Text>
              </View>
              <View style={s.scoreDivider} />
              <View style={s.scoreItem}>
                <Text style={[s.scoreNumber, { color: '#059669' }]}>A2+</Text>
                <Text style={s.scoreLabel}>Trình độ</Text>
              </View>
            </View>

            <View style={s.feedbackCard}>
              <Text style={s.feedbackTitle}>Nhận xét của AI:</Text>
              <Text style={s.feedbackText}>
                Phản xạ tương đối tự nhiên, ngữ điệu rõ ràng. Chú ý kéo dài nguyên âm và phát âm rõ âm đuôi khi gọi món.
              </Text>
            </View>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => {
                  stopSpeech();
                  Speech.stop();
                  setShowSummaryModal(false);
                  setTurns([{ role: 'ai', text: scenario.opening_line }]);
                }}
                style={s.btnSecondary}
              >
                <RotateCcw color="#475569" size={16} />
                <Text style={s.btnSecondaryText}>Luyện lại</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  stopSpeech();
                  Speech.stop();
                  setShowSummaryModal(false);
                  router.back();
                }}
                style={s.btnPrimary}
              >
                <Text style={s.btnPrimaryText}>Hoàn tất</Text>
                <ArrowRight color="#FFFFFF" size={16} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL HẾT LƯỢT CHAT HÔM NAY ──────────────────────────────────── */}
      <Modal visible={showQuotaModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalQuotaIconWrap}>
              <Flame color="#EA580C" size={30} />
            </View>

            <Text style={s.modalHeading}>Hết Lượt Luyện Nói Hôm Nay</Text>
            <Text style={s.modalSubheading}>
              Tài khoản miễn phí được 20 lượt đàm thoại AI mỗi ngày. Lượt mới sẽ tự động nạp lại sau 00:00!
            </Text>

            <Pressable
              onPress={() => {
                setShowQuotaModal(false);
                router.push('/(student)/profile/premium' as any);
              }}
              style={s.btnUpgrade}
            >
              <Sparkles color="#FFFFFF" size={16} />
              <Text style={s.btnUpgradeText}>Nâng cấp Premium — Không giới hạn</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowQuotaModal(false)}
              style={s.btnCloseQuota}
            >
              <Text style={s.btnCloseQuotaText}>Để sau</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  partnerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 130,
  },
  aiTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
  scenarioSub: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 150,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  quotaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chat Area
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 14,
  },
  noticePill: {
    alignSelf: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginTop: 2,
  },
  aiAvatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    borderTopRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
  },
  senderAi: {
    color: '#4F46E5',
  },
  senderUser: {
    color: 'rgba(255,255,255,0.85)',
  },
  speakerMiniBtn: {
    padding: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  textAi: {
    color: '#0F172A',
  },
  textUser: {
    color: '#FFFFFF',
  },
  bubbleThinking: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  thinkingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  inlineFeedbackCard: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
  },
  inlineFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  inlineFeedbackTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  inlineFeedbackText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },

  // Hint Box
  hintCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  hintTapText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  hintQuote: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // Bottom Control
  // Unified Bottom Control
  bottomControl: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 16,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  textInputRowRecording: {
    borderColor: '#F87171',
    backgroundColor: '#FFF7ED',
  },
  micBtnInBar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  micBtnIdle: {
    backgroundColor: '#EEF2FF',
  },
  micBtnRecording: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  textInputFieldRecording: {
    color: '#C2410C',
    fontWeight: '600',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  sendBtnActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  textHelpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 6,
  },
  textHelpText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  quotaDescText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  modalSuccessIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalQuotaIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    marginBottom: 16,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  scoreNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  feedbackCard: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  feedbackTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnUpgrade: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 13,
    width: '100%',
    marginBottom: 10,
  },
  btnUpgradeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnCloseQuota: {
    paddingVertical: 8,
  },
  btnCloseQuotaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
