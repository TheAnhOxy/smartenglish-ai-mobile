import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Square, Volume2, Sparkles, ChevronLeft, Play, RefreshCw } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, LinearGradient, vec, Circle } from '@shopify/react-native-skia';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { colors, palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { ProgressRing } from '@/src/components/ui/ProgressRing';

export const SingleWordSpeakingScreen = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(true);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(88);
  const [recordTime, setRecordTime] = useState(0);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedUri);
  const playerStatus = useAudioPlayerStatus(player);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const webAudioBlobUrlRef = useRef<string | null>(null);

  const pulseScale = useSharedValue(1);
  const micRipple = useSharedValue(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      pulseScale.value = withRepeat(withTiming(1.15, { duration: 500 }), -1, true);
      micRipple.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
      interval = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
    } else {
      pulseScale.value = withSpring(1);
      micRipple.value = withTiming(0);
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

  const playNativeAudio = () => {
    setIsPlayingNative(true);
    Speech.stop();
    Speech.speak('Phenomenal', {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setIsPlayingNative(false),
      onError: () => setIsPlayingNative(false),
    });
  };

  const startRecording = async () => {
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
          setScore(88);
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
        setScore(88);
        setIsRecording(false);
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.log('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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

  return (
    <View style={s.root}>
      <View>
        {/* Top Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={s.headerRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft color={palette.text} size={20} />
            <Text style={s.backBtnText}>Chế độ Luyện nói</Text>
          </Pressable>
          <View style={s.tagBadge}>
            <Text style={s.tagBadgeText}>IPA / Từ đơn</Text>
          </View>
        </Animated.View>

        {/* Word Display Box */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.wordCard}>
          <Text style={s.wordTitle}>Phenomenal</Text>
          <Text style={s.ipaText}>/fəˈnæmənəl/</Text>
          <Text style={s.meaningText}>tính từ • Phi thường, kỳ diệu, ấn tượng</Text>

          {/* Reference Native Audio Player Button */}
          <Pressable onPress={playNativeAudio} style={s.nativeAudioBtn}>
            <Volume2 color={isPlayingNative ? colors.primary : colors.textSoft} size={16} />
            <Text style={s.nativeAudioText}>Phát âm chuẩn mẫu</Text>
          </Pressable>

          {/* Waveform Visualizer Placeholder */}
          <View style={s.waveformWrap}>
            <Canvas style={{ width: '100%', height: 32 }}>
              <Path
                path="M 10 16 Q 30 4, 50 16 T 90 16 T 130 16 T 170 16 T 210 16 T 250 16 T 290 16"
                color={colors.primarySoft}
                style="stroke"
                strokeWidth={3}
                strokeCap="round"
              >
                <LinearGradient start={vec(0, 0)} end={vec(300, 0)} colors={[colors.primary, colors.primaryDeep]} />
              </Path>
            </Canvas>
          </View>
        </Animated.View>

        {/* Score Gauge — Màu ngữ nghĩa: >=80 success, >=60 warning, <60 danger */}
        {score !== null && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)} style={s.scoreCard}>
            <View style={s.scoreRingWrap}>
              <ProgressRing
                size={88}
                strokeWidth={8}
                progress={score / 100}
                startColor={score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger}
                endColor={score >= 80 ? colors.successDark : score >= 60 ? colors.warningDark : colors.dangerDark}
              />
              <View style={s.scoreOverlay}>
                <Text style={s.scoreNumber}>{score}%</Text>
                <Text style={s.scoreLabel}>ĐỘ CHUẨN</Text>
              </View>
            </View>

            <Text style={s.scoreTitle}>
              {score >= 80 ? 'Phát âm rất chuẩn giọng bản xứ' : 'Hãy thử phát âm lại rõ hơn'}
            </Text>

            {/* Audio Playback Buttons */}
            <View style={s.playbackRow}>
              <Pressable
                onPress={playUserVoice}
                style={[s.playbackBtn, isPlayingUserVoice && s.playbackBtnActive]}
              >
                <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                <Text style={s.playbackBtnText}>
                  {isPlayingUserVoice ? 'Đang phát...' : 'Nghe lại giọng bạn'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(student)/practice/speaking/feedback' as any)}
                style={s.analysisBtn}
              >
                <Sparkles color="#FFFFFF" size={14} />
                <Text style={s.analysisBtnText}>Phân tích khẩu hình</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Record Mic Button Controls */}
      <View style={s.micSection}>
        <Animated.View style={animatedPulseStyle}>
          <Pressable
            onPress={handleRecordPress}
            style={[s.micBtn, isRecording ? s.micBtnRecording : s.micBtnNormal]}
          >
            {isRecording ? <Square color="#FFFFFF" size={26} fill="#FFFFFF" /> : <Mic color="#FFFFFF" size={30} />}
          </Pressable>
        </Animated.View>

        <Text style={s.micHintText}>
          {isRecording
            ? `Đang thu âm 00:0${recordTime}s • Bấm để hoàn tất`
            : 'Chạm micro để thu âm trực tiếp'}
        </Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    color: palette.text,
    fontFamily: font.family,
    fontWeight: '700',
    fontSize: 15,
  },
  tagBadge: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  tagBadgeText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  wordTitle: {
    fontSize: 34,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  ipaText: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.primary,
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 13,
    fontFamily: font.family,
    color: palette.textSoft,
    textAlign: 'center',
  },
  nativeAudioBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  nativeAudioText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  waveformWrap: {
    width: '100%',
    height: 32,
    marginTop: 16,
    justifyContent: 'center',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  scoreRingWrap: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  scoreOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 22,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
    letterSpacing: 0.5,
  },
  scoreTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 16,
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  playbackBtnActive: {
    backgroundColor: colors.primaryDeep,
  },
  playbackBtnText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  analysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  analysisBtnText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  micSection: {
    alignItems: 'center',
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micBtnNormal: {
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  micBtnRecording: {
    backgroundColor: palette.danger,
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  micHintText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
});

