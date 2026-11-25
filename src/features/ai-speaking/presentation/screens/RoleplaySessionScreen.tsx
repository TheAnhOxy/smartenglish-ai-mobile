import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  type ScrollViewInstance,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, useIsFocused } from 'expo-router';
import {
  Mic,
  Lightbulb,
  Volume2,
  VolumeX,
  Flame,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Send,
  Crown,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import {
  fetchRoleplayScenariosApi,
  sendRoleplayChatApi,
  RoleplayScenario,
  useSpeakingQuotaStore,
  FREE_SPEAKING_DAILY_LIMIT,
  transcribeSpeechApi,
  evaluatePronunciationApi,
  speakingErrorMessage,
} from '../../data/speakingApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { speakText, stopSpeech } from '@/src/core/services/speechService';
import { UserAvatar } from '@/src/core/components/UserAvatar';
import { BackButton } from '@/src/core/components/BackButton';
import { useTutorVoice } from '@/src/features/ai-chatbot/application/useTutorVoice';
import { RecordingOverlay } from '../components/RecordingOverlay';
import { PracticeFeedbackCard } from '@/src/features/practice-feedback/presentation/components/PracticeFeedbackCard';
import { hasActivePremium } from '@/src/core/utils/plan';
import { dk } from '@/src/theme/themeMode';
import { AppColors } from '@/src/core/theme/colors';

/** Đánh giá ngay sau mỗi câu nói của học viên. */
interface TurnAssessment {
  overall: number;
  accuracy: number;
  fluency: number;
  intonation: number;
  tip?: string;
}

interface ChatTurn {
  role: 'ai' | 'user';
  text: string;
  /** Lượt AI: câu đáp gợi ý do AI tạo theo trình độ học viên. */
  suggestions?: string[];
  /** Lượt học viên: điểm phát âm (chỉ khi nói bằng micro). */
  assessment?: TurnAssessment;
  assessing?: boolean;
  assessError?: string;
  /** Lượt học viên: câu sửa ngữ pháp / cách nói hay hơn. */
  grammarFix?: string;
  betterPhrasing?: string;
}

const scoreColor = (v: number) => (v >= 80 ? '#15803D' : v >= 60 ? '#B45309' : '#B91C1C');


export const RoleplaySessionScreen = () => {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = hasActivePremium(currentUser);

  const { getQuota, consumeTurn, canChat } = useSpeakingQuotaStore();
  const quota = getQuota(isPremium);

  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  
  // Trạng thái thu âm và xử lý
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [isAiVoiceMuted, setIsAiVoiceMuted] = useState(false);

  // Micro: web nhận dạng trực tiếp; iOS/Android ghi âm rồi gửi AI chuyển thành chữ.
  // Giữ lại bản ghi của câu vừa nói để chấm phát âm ngay khi gửi.
  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const lastRecording = useRef<{ base64: string; mimeType: string; transcript: string } | null>(null);
  const voice = useTutorVoice({
    onText: (text) => setInputText(text.trim()),
    onInterim: (text) => setInputText(text.trim()),
    onAudio: async ({ base64, mimeType }) => {
      setTranscribing(true);
      lastRecording.current = null;
      try {
        const transcript = await transcribeSpeechApi(base64, mimeType);
        lastRecording.current = { base64, mimeType, transcript };
        setInputText(transcript);
      } catch (err) {
        setInputText('');
        setVoiceNotice(err instanceof Error ? err.message : 'Chưa nghe được giọng nói. Hãy nói to, rõ và thử lại.');
      } finally {
        setTranscribing(false);
      }
    },
  });
  const learnerLevel = currentUser?.cefr_level ?? null;
  const isRecording = voice.listening;
  const voiceBusy = voice.processing || transcribing;
  const cancelVoiceRef = useRef(voice.cancel);
  cancelVoiceRef.current = voice.cancel;
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Tải thông tin kịch bản từ backend
  useEffect(() => {
    setSessionError(null);
    fetchRoleplayScenariosApi().then((list) => {
      const found = list.find((s: RoleplayScenario) => s.id === String(scenarioId));
      if (found) {
        setScenario(found);
        setTurns([{ role: 'ai', text: found.opening_line }]);
      } else {
        setSessionError('Không tìm thấy kịch bản luyện nói này.');
      }
    }).catch(() => setSessionError('Không thể tải kịch bản luyện nói. Vui lòng thử lại.'));

    return () => {
      stopSpeech();
      Speech.stop();
      cancelVoiceRef.current();
    };
  }, [scenarioId]);

  // Đọc câu chào đầu: CHỈ khi màn đang hiển thị và chỉ một lần mỗi kịch bản.
  // (Màn là tab ẩn nên vẫn nằm trong bộ nhớ sau khi thoát; nạp lại ngầm — Fast Refresh, đổi theme —
  //  từng làm nó tự đọc "Good afternoon…" dù người dùng không mở.)
  const isFocused = useIsFocused();
  const spokenOpeningFor = useRef<string | null>(null);
  useEffect(() => {
    if (!isFocused || !scenario?.opening_line || spokenOpeningFor.current === scenario.id) return;
    spokenOpeningFor.current = scenario.id;
    if (isAiVoiceMuted) return;
    const cleanSpeech = scenario.opening_line.split(/💡/)[0].trim();
    void speakText(cleanSpeech || scenario.opening_line, { language: 'en-US' });
  }, [isFocused, scenario, isAiVoiceMuted]);

  // Ngắt toàn bộ âm thanh và micro khi màn hình unmount hoặc mất focus (chuyển tab/back)
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        cancelVoiceRef.current();
      };
    }, [])
  );


  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc khi AI đang suy nghĩ
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [turns, isProcessing]);

  // ── TÍNH TOÁN ĐÁNH GIÁ THỰC TẾ 100% TỪ LƯỢT THOẠI CỦA HỌC VIÊN ──
  // Hook phải nằm trước lệnh return sớm (!scenario), nếu không React báo "Rendered more hooks"
  const sessionEvaluation = useMemo(() => {
    if (!scenario) {
      return { turnsCount: 0, fluency: 0, scoredCount: 0, accuracy: 0, fluencyOnly: 0, grammarFixes: 0, level: '', feedback: '' };
    }
    const userTurns = turns.filter((t) => t.role === 'user');
    const userTurnsCount = userTurns.length;

    if (userTurnsCount === 0) {
      return {
        turnsCount: 0,
        fluency: 0,
        scoredCount: 0,
        accuracy: 0,
        fluencyOnly: 0,
        grammarFixes: 0,
        level: learnerLevel || scenario.cefr_level || '',
        feedback: `Bạn chưa gửi lượt thoại nào. Hãy nhấn vào Micro và nói câu trả lời để đàm thoại cùng ${scenario.partner_name || scenario.ai_persona} nhé!`,
      };
    }

    // Chỉ dùng điểm thật: điểm phát âm AI chấm cho từng câu nói bằng micro, số câu AI phải sửa ngữ pháp
    const scored = userTurns.filter((t) => t.assessment).map((t) => t.assessment as TurnAssessment);
    const avg = (pick: (a: TurnAssessment) => number) =>
      scored.length ? Math.round(scored.reduce((sum, a) => sum + pick(a), 0) / scored.length) : 0;
    const fixes = userTurns.filter((t) => t.grammarFix).length;

    return {
      turnsCount: userTurnsCount,
      fluency: avg((a) => a.overall),
      scoredCount: scored.length,
      accuracy: avg((a) => a.accuracy),
      fluencyOnly: avg((a) => a.fluency),
      grammarFixes: fixes,
      level: learnerLevel || scenario.cefr_level || '',
      feedback: '',
    };
  }, [turns, scenario, learnerLevel]);

  if (!scenario) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        {sessionError ? (
          <Text style={{ color: dk('#B91C1C', 'text'), textAlign: 'center' }}>{sessionError}</Text>
        ) : (
          <ActivityIndicator size="large" color="#4F46E5" />
        )}
      </View>
    );
  }

  // Bật / Tắt thu âm micro và nhận diện giọng nói trực tiếp vào ô text:
  // Nhấn 1 lần để nói, nhấn lại lần nữa để kết thúc (không tự ngắt khi ngừng nghỉ)
  const toggleRecording = () => {
    if (voiceBusy) return;
    if (isRecording) {
      void voice.stop();
      return;
    }
    if (!canChat(isPremium)) {
      setShowQuotaModal(true);
      return;
    }
    setVoiceNotice(null);
    setInputText('');
    lastRecording.current = null;
    // iOS không ghi âm được khi phiên âm thanh đang phát giọng AI
    stopSpeech();
    Speech.stop();
    void voice.start();
  };

  // Gửi câu vừa nói qua micro (luyện nói chỉ dùng giọng nói, không nhập chữ)
  const handleSendMessage = () => {
    // Đang nói thì bấm gửi = dừng ghi âm; chữ nhận dạng xong sẽ hiện trong ô để kiểm tra rồi gửi
    if (isRecording) {
      void voice.stop();
      return;
    }
    if (voiceBusy) return;

    // Không có nội dung thì không gửi gì (trước đây tự gửi một câu mặc định)
    const textToSend = inputText.trim();
    if (!textToSend || isProcessing) {
      if (!textToSend) setVoiceNotice('Hãy bấm micro và nói câu trả lời trước khi gửi.');
      return;
    }

    setInputText('');
    handleSendUserTurn(textToSend);
  };

  // Gửi tin nhắn và xử lý phản hồi từ AI
  const handleSendUserTurn = async (userText: string) => {

    // Kiểm tra hạn mức lượt chat hôm nay
    if (!canChat(isPremium)) {
      setShowQuotaModal(true);
      return;
    }

    setIsProcessing(true);
    setVoiceNotice(null);

    // Trừ 1 lượt
    const consumed = consumeTurn(isPremium);
    if (!consumed) {
      setIsProcessing(false);
      setShowQuotaModal(true);
      return;
    }

    // Câu vừa nói bằng micro (chưa sửa tay) thì chấm phát âm trên chính bản ghi đó
    const recording =
      lastRecording.current && lastRecording.current.transcript.trim().toLowerCase() === userText.trim().toLowerCase()
        ? lastRecording.current
        : null;
    lastRecording.current = null;

    const history = turns.map((t) => ({ role: t.role === 'ai' ? ('model' as const) : ('user' as const), content: t.text }));
    const userIndex = turns.length;
    setTurns((prev) => [...prev, { role: 'user', text: userText, assessing: Boolean(recording) }]);

    if (recording) {
      evaluatePronunciationApi({
        targetText: userText,
        audioBase64: recording.base64,
        audioMimeType: recording.mimeType,
        sessionType: 'ROLEPLAY',
      })
        .then((r) => {
          const assessment: TurnAssessment = {
            overall: r.overallScore,
            accuracy: r.accuracyScore,
            fluency: r.fluencyScore,
            intonation: r.intonationScore,
            tip: r.improvementTips[0] || r.errorFeedback[0],
          };
          setTurns((prev) => prev.map((t, i) => (i === userIndex ? { ...t, assessing: false, assessment } : t)));
        })
        .catch((err) => {
          const message = speakingErrorMessage(err, 'Chưa chấm được phát âm câu này.');
          setTurns((prev) => prev.map((t, i) => (i === userIndex ? { ...t, assessing: false, assessError: message } : t)));
        });
    }

    try {
      const aiResult = await sendRoleplayChatApi(scenario.id, userText, { history, learnerLevel });

      const aiText = aiResult.aiResponse;
      if (!aiText) throw new Error('Backend không trả về nội dung hội thoại');
      setTurns((prev) => [
        ...prev.map((t, i) =>
          i === userIndex
            ? { ...t, grammarFix: aiResult.grammarCorrections[0], betterPhrasing: aiResult.betterPhrasing }
            : t
        ),
        { role: 'ai', text: aiText, suggestions: aiResult.suggestedNextReplies },
      ]);

      if (!isAiVoiceMuted) {
        const cleanSpeech = aiText.split(/💡/)[0].trim();
        void speakText(cleanSpeech || aiText, { language: 'en-US' });
      }
    } catch (err: any) {
      console.warn('[RoleplaySession] sendChat error:', err);
      setSessionError('AI đang tạm thời không phản hồi. Tin nhắn chưa được chấm; vui lòng thử lại.')
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeakAiLine = (text: string) => {
    const cleanSpeech = text.split(/💡/)[0].trim();
    void speakText(cleanSpeech || text, { language: 'en-US' });
  };

  const partnerAvatar = scenario.partner_avatar_url || scenario.image_url || null;


  return (
    <View style={s.root}>
      {/* ── TOP BAR (Sạch sẽ, thân thiện, không icon robot) ────────────────── */}
      <View style={s.topBar}>
        <BackButton onPress={() => {
            stopSpeech();
            Speech.stop();
            voice.cancel();
            const userTurnsCount = turns.filter((t) => t.role === 'user').length;
            if (userTurnsCount < 2) {
              router.back();
              return;
            }
            setShowSummaryModal(true);
          }} />

        {/* AI Partner Profile ở giữa */}
        <View style={s.partnerCenter}>
          <View style={s.avatarWrap}>
            <UserAvatar uri={partnerAvatar} size={38} style={s.avatarImg} />
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
          <Pressable
            onPress={() => !isPremium && setShowQuotaModal(true)}
            style={s.quotaPill}
          >
            {isPremium ? (
              <Crown color="#6366F1" size={12} strokeWidth={2} />
            ) : (
              <Flame color="#EA580C" size={12} />
            )}
            <Text style={s.quotaPillText}>
              {isPremium ? 'VIP' : `${quota.remaining}/${FREE_SPEAKING_DAILY_LIMIT}`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!isAiVoiceMuted) Speech.stop();
              setIsAiVoiceMuted(!isAiVoiceMuted);
            }}
            style={s.iconBtn}
          >
            {isAiVoiceMuted ? (
              <VolumeX color={dk('#94A3B8', 'text')} size={16} />
            ) : (
              <Volume2 color="#4F46E5" size={16} />
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              stopSpeech();
              Speech.stop();
              setShowSummaryModal(true);
            }}
            style={[
              s.iconBtn,
              {
                width: 'auto',
                paddingHorizontal: 9,
                backgroundColor: dk('#EEF2FF', 'bg'),
                borderWidth: 1,
                borderColor: dk('#C7D2FE', 'border'),
              },
            ]}
            accessibilityLabel="Kết thúc phiên"
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>Kết thúc</Text>
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
                      <Volume2 color={dk('#64748B', 'text')} size={14} />
                    </Pressable>
                  )}
                </View>

                <Text style={[s.bubbleText, isAi ? s.textAi : s.textUser]}>
                  {mainText}
                </Text>

                {/* Đánh giá ngay sau câu nói của học viên */}
                {!isAi && (turn.assessing || turn.assessment || turn.assessError || turn.grammarFix || turn.betterPhrasing) ? (
                  <View style={s.assessCard}>
                    {turn.assessing ? (
                      <View style={s.assessRow}>
                        <ActivityIndicator size="small" color="#4F46E5" />
                        <Text style={s.assessMuted}>Đang chấm phát âm...</Text>
                      </View>
                    ) : null}
                    {turn.assessment ? (
                      <>
                        <View style={s.assessRow}>
                          <Text style={[s.assessOverall, { color: scoreColor(turn.assessment.overall) }]}>
                            {turn.assessment.overall}%
                          </Text>
                          <Text style={s.assessMuted}>Phát âm tổng thể</Text>
                        </View>
                        <View style={s.assessMetrics}>
                          {[
                            ['Chính xác', turn.assessment.accuracy],
                            ['Trôi chảy', turn.assessment.fluency],
                            ['Ngữ điệu', turn.assessment.intonation],
                          ].map(([label, value]) => (
                            <View key={String(label)} style={s.assessMetric}>
                              <Text style={[s.assessMetricValue, { color: scoreColor(Number(value)) }]}>{value}%</Text>
                              <Text style={s.assessMetricLabel}>{label}</Text>
                            </View>
                          ))}
                        </View>
                        {turn.assessment.tip ? <Text style={s.assessTip}>{turn.assessment.tip}</Text> : null}
                      </>
                    ) : null}
                    {turn.assessError ? <Text style={s.assessMuted}>{turn.assessError}</Text> : null}
                    {turn.grammarFix ? (
                      <Text style={s.assessFix}>
                        <Text style={s.assessFixLabel}>Sửa ngữ pháp: </Text>
                        {turn.grammarFix}
                      </Text>
                    ) : null}
                    {!turn.grammarFix && turn.betterPhrasing ? (
                      <Text style={s.assessBetter}>
                        <Text style={s.assessBetterLabel}>Cách nói tự nhiên hơn: </Text>
                        {turn.betterPhrasing}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Góp ý tiếng Việt từ AI nếu có */}
                {isAi && feedbackText && (
                  <View style={s.inlineFeedbackCard}>
                    <View style={s.inlineFeedbackHeader}>
                      <Lightbulb color={dk('#D97706', 'text')} size={13} />
                      <Text style={s.inlineFeedbackTitle}>Góp ý tiếng Việt:</Text>
                    </View>
                    <Text style={s.inlineFeedbackText}>{feedbackText}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Câu đáp gợi ý cho lượt tiếp theo (AI tạo theo trình độ học viên) */}
        {!isProcessing && turns[turns.length - 1]?.role === 'ai' && (turns[turns.length - 1]?.suggestions?.length ?? 0) > 0 ? (
          <View style={s.suggestBox}>
            <Text style={s.suggestTitle}>Gợi ý trả lời</Text>
            {(turns[turns.length - 1]?.suggestions ?? []).map((sug) => (
              <Pressable
                key={sug}
                onPress={() => handleSpeakAiLine(sug)}
                style={({ pressed }) => [s.suggestChip, pressed && { opacity: 0.7 }]}
                accessibilityLabel={`Nghe đọc mẫu câu gợi ý: ${sug}`}
              >
                <Text style={s.suggestText}>{sug}</Text>
              </Pressable>
            ))}
            <Text style={s.suggestHint}>Chạm để nghe đọc mẫu, sau đó bấm micro và tự nói lại để được chấm phát âm.</Text>
          </View>
        ) : null}

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


      {/* ── KHU VỰC ĐIỀU KHIỂN DƯỚI CHÂN: MICRO + CÂU VỪA NÓI + NÚT GỬI (không nhập chữ) ── */}
      <View style={s.bottomControl}>
        <View style={[s.textInputRow, isRecording && s.textInputRowRecording]}>
          {/* Nút Micro bên trái: Bấm để bật/tắt thu âm và nhận diện giọng nói */}
          <Pressable
            onPress={toggleRecording}
            disabled={isProcessing || voiceBusy}
            accessibilityLabel={isRecording ? 'Dừng ghi âm' : 'Nói bằng giọng'}
            style={({ pressed }) => [
              s.micBtnInBar,
              isRecording ? s.micBtnRecording : s.micBtnIdle,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Mic color={isRecording ? '#DC2626' : '#4F46E5'} size={20} />
          </Pressable>

          {/* Câu nhận dạng từ giọng nói: chỉ hiển thị, không cho gõ */}
          <Text
            numberOfLines={3}
            style={[
              s.textInputField,
              isRecording && s.textInputFieldRecording,
              !inputText && !isRecording && s.voicePlaceholder,
            ]}
            accessibilityLiveRegion="polite"
          >
            {voiceBusy
              ? 'Đang nhận dạng giọng nói...'
              : isRecording
                ? inputText || 'Đang ghi âm... bấm micro lần nữa khi nói xong'
                : inputText || 'Bấm micro và nói câu trả lời bằng tiếng Anh'}
          </Text>

          {/* Nút Gửi bên phải: Xoay vòng tròn ActivityIndicator khi AI đang xử lý phản hồi */}
          <Pressable
            onPress={handleSendMessage}
            disabled={(!inputText.trim() && !isRecording) || isProcessing || voiceBusy}
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
        {voice.error || voiceNotice ? (
          <Text style={s.voiceNotice}>{voice.error || voiceNotice}</Text>
        ) : null}
        <View style={s.textHelpRow}>
          {!isPremium && (
            <Text style={s.quotaDescText}>
              Còn {quota.remaining}/{FREE_SPEAKING_DAILY_LIMIT} lượt
            </Text>
          )}
        </View>
      </View>

      {/* ── MÀN GHI ÂM GIỮA MÀN HÌNH khi bật micro ─────────────────────── */}
      <RecordingOverlay
        listening={isRecording}
        busy={voiceBusy}
        liveText={isRecording ? inputText : ''}
        level={voice.level}
        onStop={() => void voice.stop()}
        onCancel={() => {
          voice.cancel();
          setInputText('');
        }}
      />

      {/* ── MODAL TỔNG KẾT PHIÊN LUYỆN NÓI ───────────────────────────────── */}
      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <ScrollView style={s.summaryScroll} contentContainerStyle={s.modalCard}>
            <View style={s.modalSuccessIconWrap}>
              <CheckCircle2 color={dk('#16A34A', 'text')} size={28} />
            </View>

            <Text style={s.modalHeading}>Kết Quả Luyện Nói</Text>
            <Text style={s.modalSubheading}>
              Đánh giá phản xạ đàm thoại với {scenario.ai_persona}
            </Text>

            <View style={s.scoreBox}>
              <View style={s.scoreItem}>
                <Text style={s.scoreNumber}>{sessionEvaluation.turnsCount}</Text>
                <Text style={s.scoreLabel}>Lượt thoại</Text>
              </View>
              <View style={s.scoreDivider} />
              <View style={s.scoreItem}>
                <Text style={[s.scoreNumber, { color: '#4F46E5' }]}>
                  {sessionEvaluation.scoredCount > 0 ? `${sessionEvaluation.fluency}%` : '--'}
                </Text>
                <Text style={s.scoreLabel}>Phát âm TB</Text>
              </View>
              <View style={s.scoreDivider} />
              <View style={s.scoreItem}>
                <Text style={[s.scoreNumber, { color: dk('#B45309', 'text') }]}>
                  {sessionEvaluation.grammarFixes}
                </Text>
                <Text style={s.scoreLabel}>Câu cần sửa</Text>
              </View>
            </View>

            {/* AI thật nhận xét cả đoạn hội thoại: từ vựng, ngữ pháp, kỹ năng nói và lời khuyên */}
            <PracticeFeedbackCard
              style={{ width: '100%', marginBottom: 18 }}
              input={
                showSummaryModal && turns.some((t) => t.role === 'user')
                  ? {
                      skill: 'ROLEPLAY',
                      title: `Hội thoại: ${scenario.title || 'tình huống thực tế'}`,
                      score: sessionEvaluation.scoredCount > 0 ? sessionEvaluation.fluency : null,
                      cefrLevel: learnerLevel || scenario.cefr_level || null,
                      sourceId: `roleplay-${scenario.id}-${turns.length}-${turns[turns.length - 1]?.text.length ?? 0}`,
                      details: [
                        `Tình huống: ${scenario.title}. Học viên nói chuyện với ${scenario.ai_persona}.`,
                        'Hội thoại (AI = đối tác, HV = học viên):',
                        ...turns.slice(-30).map((t) =>
                          t.role === 'ai'
                            ? `AI: ${t.text}`
                            : `HV: ${t.text}${t.assessment ? ` [phát âm ${t.assessment.overall}%]` : ''}${t.grammarFix ? ` [sửa: ${t.grammarFix}]` : ''}`
                        ),
                      ].join('\n'),
                    }
                  : null
              }
            />

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
                <RotateCcw color={dk('#475569', 'text')} size={16} />
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
          </ScrollView>
        </View>
      </Modal>

      {/* ── MODAL NÂNG CẤP GÓI PREMIUM THUẬN TIỆN NGAY TẠI CHỖ ────────────────── */}
      <Modal visible={showQuotaModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalQuotaIconWrap}>
              <Crown color="#F59E0B" size={30} strokeWidth={2} />
            </View>

            <Text style={s.modalHeading}>
              {quota.remaining <= 0 ? 'Hết Lượt Luyện Nói Hôm Nay' : 'Nâng Cấp Gói Premium'}
            </Text>
            <Text style={s.modalSubheading}>
              {quota.remaining <= 0
                ? 'Tài khoản Free được 20 lượt đàm thoại AI mỗi ngày. Nâng cấp Premium để tiếp tục luyện nói không giới hạn ngay bây giờ!'
                : 'Mở khóa toàn bộ kịch bản và luyện nói AI không giới hạn số lượt mỗi ngày.'}
            </Text>

            <Pressable
              // Nâng cấp phải qua trang thanh toán; không tự đổi gói trên máy
              onPress={() => {
                setShowQuotaModal(false);
                router.push({ pathname: '/(student)/profile/premium', params: { from: 'speaking' } } as never);
              }}
              style={s.btnUpgrade}
            >
              <Crown color="#FFFFFF" size={16} strokeWidth={2} />
              <Text style={s.btnUpgradeText}>Kích hoạt Premium ngay</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowQuotaModal(false);
                router.push('/(student)/profile/premium' as any);
              }}
              style={{ marginTop: 10, paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 11, color: '#6366F1', textAlign: 'center', fontWeight: '600' }}>
                Xem chi tiết các gói nâng cấp →
              </Text>
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
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
    bottom: 0.5,
    right: 0.5,
    width: 11,
    height: 11,
    borderRadius: 9999,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
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
  voiceNotice: { fontSize: 12, color: '#DC2626', marginTop: 6, paddingHorizontal: 4 },
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
  voicePlaceholder: {
    color: '#94A3B8',
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
  summaryScroll: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    flexGrow: 0,
  },
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
  assessCard: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginTop: 6,
    padding: 10,
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: AppColors.cardWhite,
  },
  assessRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assessOverall: { fontSize: 18, fontWeight: '800' },
  assessMuted: { fontSize: 12, color: AppColors.neutralGray },
  assessMetrics: { flexDirection: 'row', gap: 6 },
  assessMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
  },
  assessMetricValue: { fontSize: 13, fontWeight: '700' },
  assessMetricLabel: { fontSize: 11, color: AppColors.neutralGray },
  assessTip: { fontSize: 12, lineHeight: 17, color: AppColors.neutralInk },
  assessFix: { fontSize: 12, lineHeight: 17, color: '#B91C1C' },
  assessFixLabel: { fontWeight: '700' },
  assessBetter: { fontSize: 12, lineHeight: 17, color: '#B45309' },
  assessBetterLabel: { fontWeight: '700' },
  suggestBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: AppColors.cardWhite,
  },
  suggestTitle: { fontSize: 12, fontWeight: '700', color: AppColors.neutralGray },
  suggestChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surface,
  },
  suggestText: { fontSize: 14, color: AppColors.neutralInk },
  suggestHint: { fontSize: 11, color: AppColors.neutralGray },
});
