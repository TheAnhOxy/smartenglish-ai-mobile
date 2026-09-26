import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  X,
  Play,
  Square,
  Mic,
  RotateCcw,
  ArrowRight,
  Lightbulb,
  Activity,
  Zap,
  Volume2,
  AlertCircle,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { stopSpeech } from '@/src/core/services/speechService';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';

export const SpeakingFeedbackScreen = () => {
  const router = useRouter();

  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false); // Initially false!
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedUri);
  const playerStatus = useAudioPlayerStatus(player);

  // Web MediaRecorder Fallback Refs
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const webAudioBlobUrlRef = useRef<string | null>(null);

  // Pulse animation for mic recording
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      pulseScale.value = withRepeat(withTiming(1.25, { duration: 600 }), -1, true);
      interval = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
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

  // Ngắt toàn bộ âm thanh và micro khi unmount hoặc rời màn hình
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        try {
          player.pause();
        } catch (_) {}
        if (Platform.OS === 'web' && mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream?.getTracks?.().forEach((t: any) => t.stop());
          } catch (_) {}
        }
      };
    }, [player])
  );

  useEffect(() => {
    return () => {
      stopSpeech();
      Speech.stop();
      try {
        player.pause();
      } catch (_) {}
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream?.getTracks?.().forEach((t: any) => t.stop());
        } catch (_) {}
      }
    };
  }, [player]);

  // Play Native Audio Target (No alert popup)
  const playNativeTargetAudio = () => {
    try {
      setIsPlayingNative(true);
      Speech.stop();
      Speech.speak('Phenomenal', {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsPlayingNative(false),
        onError: () => setIsPlayingNative(false),
      });
    } catch (err) {
      console.log('Error playing native audio:', err);
      setIsPlayingNative(false);
    }
  };

  // Start Micro Recording (Real Microphone)
  const startAudioRecording = async () => {
    setNoticeMessage(null);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.mediaDevices) {
        // Web Browser Micro Recording via MediaRecorder
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new (window as any).MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          webAudioBlobUrlRef.current = audioUrl;
          setRecordedUri(audioUrl);
          setHasRecording(true);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } else {
        // Mobile native recording via expo-audio.
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          setNoticeMessage('Vui lòng cho phép ứng dụng truy cập Micro để thu âm!');
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      }
    } catch (err) {
      console.log('Failed to start recording:', err);
      setIsRecording(false);
      setNoticeMessage('Không thể truy cập micro. Vui lòng kiểm tra quyền thiết bị!');
    }
  };

  // Stop Micro Recording
  const stopAudioRecording = async () => {
    try {
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
        setIsRecording(false);
      } else if (recorder.isRecording) {
        await recorder.stop();
        setRecordedUri(recorder.uri);
        setHasRecording(Boolean(recorder.uri));
        setIsRecording(false);
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.log('Failed to stop recording:', err);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  // Playback Real User Recorded Voice
  const playUserVoiceAudio = async () => {
    setNoticeMessage(null);
    if (!hasRecording || (!recordedUri && !webAudioBlobUrlRef.current)) {
      setNoticeMessage('Chưa có bản ghi âm! Vui lòng ấn nút Micro bên dưới để thu âm giọng nói của bạn trước.');
      return;
    }

    try {
      setIsPlayingUserVoice(true);

      if (Platform.OS === 'web' && webAudioBlobUrlRef.current) {
        // Web Audio element playback
        const audio = new (window as any).Audio(webAudioBlobUrlRef.current);
        audio.onended = () => setIsPlayingUserVoice(false);
        audio.onerror = () => setIsPlayingUserVoice(false);
        await audio.play();
      } else if (recordedUri) {
        // Native playback via expo-audio.
        player.play();
      } else {
        setIsPlayingUserVoice(false);
      }
    } catch (err) {
      console.log('Error playing recorded audio:', err);
      setIsPlayingUserVoice(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Top Header Bar */}
      <View style={s.headerBar}>
        <Pressable
          onPress={() => {
            stopSpeech();
            Speech.stop();
            try {
              player.pause();
            } catch (_) {}
            if (Platform.OS === 'web' && mediaRecorderRef.current) {
              try {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream?.getTracks?.().forEach((t: any) => t.stop());
              } catch (_) {}
            }
            router.back();
          }}
          style={s.closeBtn}
        >
          <X color="#475569" size={22} />
        </Pressable>

        <Text style={s.headerTitle}>Loxera Speaking AI</Text>

        <View style={s.streakBadge}>
          <Zap color="#0EA5E9" size={14} fill="#0EA5E9" />
          <Text style={s.streakText}>🔥 12 Days</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Notice Message Toast if user hasn't recorded yet */}
        {noticeMessage && (
          <View style={s.noticeBox}>
            <AlertCircle color="#D97706" size={16} />
            <Text style={s.noticeText}>{noticeMessage}</Text>
          </View>
        )}

        {/* Score Gauge Circle */}
        <View style={s.scoreContainer}>
          <View style={s.scoreCircle}>
            <Text style={s.scoreNumber}>{hasRecording ? '88%' : '--'}</Text>
            <Text style={s.scoreLabel}>{hasRecording ? 'GREAT' : 'CẦN GHI ÂM'}</Text>
          </View>

          {/* Word Title & Phonetic */}
          <Text style={s.wordTitle}>Phenomenal</Text>
          <Text style={s.ipaText}>/fəˈnæmənəl/</Text>
        </View>

        {/* Audio Match Card (Native vs Your Voice) */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Activity color="#0EA5E9" size={20} />
            <Text style={s.cardTitleText}>Audio Match (So Sánh Giọng Nói)</Text>
          </View>

          {/* Target Native Waveform */}
          <View style={s.audioRow}>
            <Pressable
              onPress={playNativeTargetAudio}
              style={[s.playCircleBtn, isPlayingNative && s.playCircleBtnActive]}
            >
              <Volume2 color={isPlayingNative ? '#FFFFFF' : '#0284C7'} size={18} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={s.audioLabelText}>Target (Native Mẫu)</Text>
              {/* Teal Waveform Bars */}
              <View style={s.waveformRow}>
                <View style={[s.waveBar, { height: 12, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 24, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 16, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 30, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 20, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 26, backgroundColor: '#0EA5E9' }]} />
                <View style={[s.waveBar, { height: 14, backgroundColor: '#0EA5E9' }]} />
              </View>
            </View>
          </View>

          <View style={s.divider} />

          {/* Your Voice Waveform (Plays real recorded audio) */}
          <View style={s.audioRow}>
            <Pressable
              onPress={playUserVoiceAudio}
              style={[
                s.playCircleBtnUser,
                isPlayingUserVoice && s.playCircleBtnUserActive,
                !hasRecording && s.playCircleBtnDisabled,
              ]}
            >
              <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={[s.audioLabelUserText, !hasRecording && { color: '#94A3B8' }]}>
                {hasRecording ? 'Your Voice (Bản Ghi Âm Của Bạn 🎧)' : 'Your Voice (Chưa Có Bản Ghi Âm 🎙️)'}
              </Text>
              {/* Orange/Cyan Waveform Bars */}
              <View style={s.waveformRow}>
                <View style={[s.waveBar, { height: 14, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 28, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 12, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 32, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 24, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 16, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
                <View style={[s.waveBar, { height: 10, backgroundColor: hasRecording ? '#38BDF8' : '#CBD5E1' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 🎙️ REAL MICROPHONE RECORDING MODULE */}
        <View style={s.recordModuleCard}>
          <Text style={s.recordModuleTitle}>🎙️ Ghi Âm Thực Tế Giọng Nói Của Bạn</Text>
          <Text style={s.recordModuleSub}>
            Chạm vào nút Micro bên dưới để cho phép ứng dụng thu âm thật giọng nói của bạn, sau đó nghe lại chính xác bản ghi âm đó.
          </Text>

          <View style={s.recordControlRow}>
            <Animated.View style={animatedPulseStyle}>
              <Pressable
                onPress={toggleRecording}
                style={[
                  s.micBtn,
                  isRecording ? s.micBtnRecording : s.micBtnNormal,
                ]}
              >
                {isRecording ? (
                  <Square color="#FFFFFF" size={24} />
                ) : (
                  <Mic color="#FFFFFF" size={28} />
                )}
              </Pressable>
            </Animated.View>

            <View style={s.recordStatusWrap}>
              <Text style={s.recordStatusTitle}>
                {isRecording
                  ? `Đang thu âm... 00:0${recordTime}s 🔴`
                  : hasRecording
                  ? '✅ Đã ghi âm xong! Bạn có thể bấm "Your Voice" để nghe lại'
                  : 'Bấm micro để bắt đầu thu âm giọng thật'}
              </Text>
              <Text style={s.recordStatusSub}>
                {isRecording ? 'Nói từ "Phenomenal" vào micro...' : 'Thu âm thật qua Micro thiết bị'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips to Improve Card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Lightbulb color="#D97706" size={18} />
            <Text style={s.cardTitleText}>Tips to Improve (Mẹo Cải Thiện)</Text>
          </View>

          <Text style={s.tipContentText}>
            Tập trung vào khẩu hình âm <Text style={{ fontWeight: '800', color: '#0EA5E9' }}>/n/</Text>: Đặt đầu lưỡi chạm vào nướu răng trên ngay phía sau răng cửa.
          </Text>

          <View style={s.diagramBox}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600' }}
              style={s.diagramImg}
            />
            <View style={s.diagramBadge}>
              <Text style={s.diagramBadgeText}>Tongue Position: Alveolar Ridge</Text>
            </View>
          </View>
        </View>

        {/* Syllables & Stress Card */}
        <View style={[s.card, { alignItems: 'center' }]}>
          <Activity color="#0284C7" size={20} />
          <Text style={[s.cardTitleText, { marginTop: 6, marginBottom: 4 }]}>Syllable Stress</Text>
          <Text style={s.stressText}>
            Nhấn trọng âm vào âm tiết thứ hai: phe-<Text style={{ fontWeight: '800', color: '#0EA5E9' }}>NOM</Text>-e-nal
          </Text>
          <View style={s.stressDotsRow}>
            <View style={[s.dot, { width: 10, height: 10 }]} />
            <View style={[s.dot, { width: 16, height: 16, backgroundColor: '#0EA5E9' }]} />
            <View style={[s.dot, { width: 10, height: 10 }]} />
            <View style={[s.dot, { width: 10, height: 10 }]} />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Dual Action Buttons */}
      <View style={s.bottomBtnRow}>
        <Pressable
          onPress={() => router.back()}
          style={s.retryBtn}
        >
          <RotateCcw color="#0EA5E9" size={18} />
          <Text style={s.retryBtnText}>Thử Lại</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(student)/practice/speaking/unit-roleplay' as any)}
          style={s.nextBtn}
        >
          <Text style={s.nextBtnText}>Từ Tiếp Theo</Text>
          <ArrowRight color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0EA5E9',
    letterSpacing: 1,
    marginTop: 2,
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A5F',
    marginTop: 14,
    marginBottom: 4,
  },
  ipaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 16,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  playCircleBtnActive: {
    backgroundColor: '#0EA5E9',
  },
  audioLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 32,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  playCircleBtnUser: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircleBtnUserActive: {
    backgroundColor: '#0284C7',
  },
  playCircleBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  audioLabelUserText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  recordModuleCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  recordModuleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  recordModuleSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 14,
  },
  recordControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  micBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnNormal: {
    backgroundColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micBtnRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  recordStatusWrap: {
    flex: 1,
  },
  recordStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  recordStatusSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tipContentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  diagramBox: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    position: 'relative',
  },
  diagramImg: {
    width: '100%',
    height: '100%',
  },
  diagramBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(30, 58, 95, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  diagramBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  stressDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 50,
    backgroundColor: '#CBD5E1',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  retryBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
