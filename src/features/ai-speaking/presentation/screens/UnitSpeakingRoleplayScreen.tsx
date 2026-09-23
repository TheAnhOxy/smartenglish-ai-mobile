import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Mic,
  ArrowLeft,
  Bot,
  Star,
  Zap,
  Square,
  Play,
  Volume2,
  Flame,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import {
  useSpeakingQuotaStore,
  FREE_SPEAKING_DAILY_LIMIT,
} from '../../data/speakingApi';

export const UnitSpeakingRoleplayScreen = () => {
  const { scenarioName } = useLocalSearchParams<{ scenarioName?: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const { getQuota, consumeTurn, canChat } = useSpeakingQuotaStore();
  const quota = getQuota(isPremium);

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(true);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState(false);
  const [isPlayingAiVoice, setIsPlayingAiVoice] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedUri);
  const playerStatus = useAudioPlayerStatus(player);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const webAudioBlobUrlRef = useRef<string | null>(null);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      pulseScale.value = withRepeat(withTiming(1.25, { duration: 600 }), -1, true);
      interval = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
    } else {
      pulseScale.value = withTiming(1);
      setRecordTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    setIsPlayingUserVoice(playerStatus.playing);
  }, [playerStatus.playing]);

  // Start Real Microphone Recording
  const startRecording = async () => {
    // 1. Enforce Daily Free Limit of 20 chats across all speaking lessons
    if (!canChat(isPremium)) {
      setShowQuotaModal(true);
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new (window as any).MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e: any) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          webAudioBlobUrlRef.current = url;
          setRecordedUri(url);
          setHasRecorded(true);
          consumeTurn(isPremium);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) return;

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      }
    } catch (err) {
      console.log('Start recording error:', err);
      setIsRecording(false);
    }
  };

  // Stop Microphone Recording
  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
        setIsRecording(false);
      } else if (recorder.isRecording) {
        await recorder.stop();
        setRecordedUri(recorder.uri);
        setHasRecorded(true);
        setIsRecording(false);
        consumeTurn(isPremium);
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.log('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Play Back Recorded User Voice
  const playUserVoice = async () => {
    if (!recordedUri && !webAudioBlobUrlRef.current) return;
    try {
      setIsPlayingUserVoice(true);
      if (Platform.OS === 'web' && webAudioBlobUrlRef.current) {
        const audio = new (window as any).Audio(webAudioBlobUrlRef.current);
        audio.onended = () => setIsPlayingUserVoice(false);
        await audio.play();
      } else if (recordedUri) {
        player.play();
      }
    } catch (err) {
      console.log('Play user voice error:', err);
      setIsPlayingUserVoice(false);
    }
  };

  // Play AI Speech Bubble
  const playAiVoice = () => {
    setIsPlayingAiVoice(true);
    Speech.stop();
    Speech.speak('Welcome! What would you like to order today?', {
      language: 'en-US',
      onDone: () => setIsPlayingAiVoice(false),
      onError: () => setIsPlayingAiVoice(false),
    });
  };

  return (
    <View style={s.root}>
      {/* Top Header Bar */}
      <View style={s.headerBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#1E293B" size={20} />
        </Pressable>

        <Text style={s.headerTitle}>SmartEnglish AI Roleplay</Text>

        <View style={s.headerRightRow}>
          {isPremium ? (
            <View style={s.premiumBadge}>
              <Sparkles color="#A855F7" size={13} />
              <Text style={s.premiumText}>👑 Không giới hạn</Text>
            </View>
          ) : (
            <Pressable onPress={() => setShowQuotaModal(true)} style={s.quotaBadge}>
              <Flame color="#FF6B35" size={13} />
              <Text style={s.quotaText}>Còn {quota.remaining}/{FREE_SPEAKING_DAILY_LIMIT}</Text>
            </Pressable>
          )}

          <View style={s.streakBadge}>
            <Zap color="#FF6B35" size={13} fill="#FF6B35" />
            <Text style={s.streakText}>12D</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Scenario Sub-header */}
        <View style={s.scenarioSubHeader}>
          <Text style={s.scenarioCategoryText}>🔴 {scenarioName || 'CAFE SCENARIO'}</Text>
          <Text style={s.scenarioTitle}>Unit 3: Ordering Food</Text>
        </View>

        {/* Hero Scenario Banner Image */}
        <View style={s.bannerBox}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' }}
            style={s.bannerImg}
          />
          <View style={s.avatarOverlayWrap}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300' }}
              style={s.aiBaristaAvatar}
            />
          </View>
        </View>

        {/* AI Opening Speech Bubble */}
        <View style={s.aiBubbleRow}>
          <Pressable onPress={playAiVoice} style={s.aiAvatarCircle}>
            <Bot color="#0891B2" size={20} />
          </Pressable>
          <View style={s.aiSpeechBox}>
            <Text style={s.aiSpeechText}>Welcome! What would you like to order today?</Text>
            <Pressable onPress={playAiVoice} style={s.speakerMiniBtn}>
              <Volume2 color={isPlayingAiVoice ? "#0EA5E9" : "#64748B"} size={14} />
            </Pressable>
          </View>
        </View>

        {/* User Speech Bubble */}
        <View style={s.userBubbleAlign}>
          <View style={s.userSpeechBox}>
            <Text style={s.userSpeechText}>
              I would like a <Text style={s.mispronouncedWord}>caffe</Text> latte, please.
            </Text>
          </View>

          {/* Pronunciation Rating Bar */}
          <View style={s.ratingBarRow}>
            <Text style={s.ratingBarTitle}>PRONUNCIATION</Text>
            <View style={s.starsRow}>
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#FFC93C" size={12} fill="#FFC93C" />
              <Star color="#CBD5E1" size={12} />
            </View>
            <Text style={s.ratingScoreText}>| 85%</Text>
          </View>

          {/* User Recorded Audio Playback Button */}
          {hasRecorded && (
            <Pressable
              onPress={playUserVoice}
              style={[s.playUserVoiceBtn, isPlayingUserVoice && s.playUserVoiceBtnActive]}
            >
              <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
              <Text style={s.playUserVoiceText}>
                {isPlayingUserVoice ? 'Đang phát giọng bạn...' : '🎧 Nghe lại giọng bạn vừa thu âm'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* AI Feedback Suggestion Bubble */}
        <View style={s.feedbackBoxAlign}>
          <View style={s.feedbackCard}>
            <Text style={s.feedbackText}>
              Great flow! Try adding a little more emphasis on the word "caffe" next time.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Hold/Tap to Speak Mic Controls */}
      <View style={s.micSection}>
        <Animated.View style={animatedPulseStyle}>
          <Pressable
            onPress={toggleRecording}
            style={[s.micBtn, isRecording ? s.micBtnRecording : s.micBtnNormal]}
          >
            {isRecording ? <Square color="#FFFFFF" size={28} /> : <Mic color="#FFFFFF" size={32} />}
          </Pressable>
        </Animated.View>

        <Text style={s.micHintText}>
          {isRecording ? `ĐANG THU ÂM... 00:0${recordTime}s 🔴` : 'CHẠM NÚT MICRO ĐỂ NÓI TRỰC TIẾP'}
        </Text>
        {!isPremium && (
          <Text style={s.dailyLimitSubHint}>
            Hôm nay: còn {quota.remaining}/{FREE_SPEAKING_DAILY_LIMIT} lượt nói AI (tất cả các bài)
          </Text>
        )}
      </View>

      {/* Quota Exceeded Modal */}
      <Modal visible={showQuotaModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <Flame color="#FF6B35" size={32} />
            </View>

            <Text style={s.modalTitle}>Hết Lượt Luyện Nói Hôm Nay! 🔥</Text>
            <Text style={s.modalDesc}>
              Tài khoản Miễn phí được tối đa <Text style={s.boldHighlight}>20 lượt chat AI / ngày</Text> dùng chung cho <Text style={s.boldHighlight}>tất cả các bài luyện nói</Text>.
            </Text>

            <View style={s.quotaBox}>
              <View style={s.quotaRow}>
                <Text style={s.quotaRowLabel}>Hạn mức miễn phí:</Text>
                <Text style={s.quotaRowVal}>20 lượt / ngày</Text>
              </View>
              <View style={s.quotaRow}>
                <Text style={s.quotaRowLabel}>Đã sử dụng hôm nay:</Text>
                <Text style={[s.quotaRowVal, { color: '#EA580C' }]}>{quota.usedToday} / 20 lượt</Text>
              </View>
              <View style={s.quotaRow}>
                <Text style={s.quotaRowLabel}>Còn lại hôm nay:</Text>
                <Text style={[s.quotaRowVal, { color: '#EF4444' }]}>0 lượt</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowQuotaModal(false);
                router.push('/(student)/profile/premium' as any);
              }}
              style={s.upgradeBtn}
            >
              <Sparkles color="#FFFFFF" size={16} />
              <Text style={s.upgradeBtnText}>Nâng Cấp Premium 👑</Text>
            </Pressable>

            <Pressable onPress={() => setShowQuotaModal(false)} style={s.dismissBtn}>
              <Text style={s.dismissBtnText}>Để sau (Quay lại vào ngày mai)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAF9', paddingTop: 48, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'space-between' },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#9A2C00', letterSpacing: -0.5 },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakText: { fontSize: 11, fontWeight: '800', color: '#FF6B35' },
  quotaBadge: { backgroundColor: '#FFEDD5', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: '#FED7AA', flexDirection: 'row', alignItems: 'center', gap: 4 },
  quotaText: { fontSize: 10, fontWeight: '800', color: '#C2410C' },
  premiumBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: '#E9D5FF', flexDirection: 'row', alignItems: 'center', gap: 4 },
  premiumText: { fontSize: 10, fontWeight: '800', color: '#7E22CE' },

  scenarioSubHeader: { marginBottom: 12 },
  scenarioCategoryText: { fontSize: 10, fontWeight: '800', color: '#0F7173', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  scenarioTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  bannerBox: { width: '100%', height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  bannerImg: { width: '100%', height: '100%' },
  avatarOverlayWrap: { position: 'absolute', bottom: 8, left: '50%', marginLeft: -40, width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  aiBaristaAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#FFFFFF' },
  aiBubbleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14, maxWidth: '90%' },
  aiAvatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#CFFAFE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#A5F3FC', marginTop: 2 },
  aiSpeechBox: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 20, borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiSpeechText: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20, flex: 1 },
  speakerMiniBtn: { padding: 4, marginLeft: 8 },
  userBubbleAlign: { alignSelf: 'flex-end', maxWidth: '90%', marginBottom: 12 },
  userSpeechBox: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 20, borderBottomRightRadius: 4 },
  userSpeechText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', lineHeight: 20 },
  mispronouncedWord: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '800' },
  ratingBarRow: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBarTitle: { fontSize: 10, fontWeight: '800', color: '#0F7173', letterSpacing: 0.6 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingScoreText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  playUserVoiceBtn: { backgroundColor: '#0EA5E9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, marginTop: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 },
  playUserVoiceBtnActive: { backgroundColor: '#0284C7' },
  playUserVoiceText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  feedbackBoxAlign: { alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 20 },
  feedbackCard: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  feedbackText: { fontSize: 12, color: '#334155', fontWeight: '500', lineHeight: 18 },
  micSection: { alignItems: 'center', paddingTop: 8 },
  micBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFFFFF', marginBottom: 8 },
  micBtnNormal: { backgroundColor: '#FF6B35', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  micBtnRecording: { backgroundColor: '#EF4444', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 7 },
  micHintText: { fontSize: 11, fontWeight: '800', color: '#9A2C00', letterSpacing: 1.2 },
  dailyLimitSubHint: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#FED7AA' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  boldHighlight: { fontWeight: '700', color: '#C2410C' },
  quotaBox: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, gap: 8 },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaRowLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  quotaRowVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  upgradeBtn: { width: '100%', backgroundColor: '#FF6B35', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10 },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  dismissBtn: { paddingVertical: 8 },
  dismissBtnText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
});
