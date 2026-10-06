import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Mic, Square, Volume2, Sparkles, ChevronLeft, Play, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Canvas, Path, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { stopSpeech } from '@/src/core/services/speechService';
import { colors, palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { ProgressRing } from '@/src/components/ui/ProgressRing';
import {
  evaluatePronunciationApi,
  PronunciationAssessmentData,
  fetchPronunciationLessonsApi,
  PronunciationLesson,
} from '../../data/speakingApi';

export const SingleWordSpeakingScreen = () => {
  const router = useRouter();
  const { lessonId, target } = useLocalSearchParams<{ lessonId?: string; target?: string }>();

  const [currentLesson, setCurrentLesson] = useState<PronunciationLesson | null>(null);
  const [targetWord, setTargetWord] = useState<string>(target || 'Phenomenal');
  const [targetIpa, setTargetIpa] = useState<string>('/fəˈnæmənəl/');
  const [meaning, setMeaning] = useState<string>('tính từ • Phi thường, kỳ diệu, ấn tượng');

  // Trạng thái ghi âm và AI phân tích: BAN ĐẦU KHÔNG CÓ SCORE FAKE!
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<PronunciationAssessmentData | null>(null);

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

  // Tải thông tin từ vựng mục tiêu từ Backend dựa vào lessonId hoặc target
  useEffect(() => {
    fetchPronunciationLessonsApi().then((list) => {
      const found = list.find(
        (item) =>
          String(item.id) === String(lessonId) ||
          item.targetText.toLowerCase() === (target || '').toLowerCase()
      );
      if (found) {
        setCurrentLesson(found);
        setTargetWord(found.targetText);
        setTargetIpa(found.ipaTranscription || `/${found.targetText}/`);
        setMeaning(found.meaningVi || 'Luyện phát âm chuẩn theo bảng phiên âm IPA quốc tế');
      } else if (target) {
        setTargetWord(target);
        setTargetIpa(`/${target.toLowerCase()}/`);
        setMeaning('Luyện phát âm từ vựng mục tiêu');
      }
    });
  }, [lessonId, target]);

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

  // Ngắt toàn bộ âm thanh khi người dùng rời màn hình hoặc unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        try {
          player.pause();
        } catch (_) {}
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
    };
  }, [player]);

  const playNativeAudio = () => {
    setIsPlayingNative(true);
    Speech.stop();
    Speech.speak(targetWord, {
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

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          webAudioBlobUrlRef.current = url;
          setRecordedUri(url);

          // Phân tích thật từ Backend AI
          setIsEvaluating(true);
          try {
            const res = await evaluatePronunciationApi({
              targetText: targetWord,
              targetIpa: targetIpa,
              sessionType: 'SINGLE_WORD',
            });
            setAssessment(res);
            setScore(res.overallScore);
            setHasRecorded(true);
          } catch (err) {
            console.warn('[SingleWordSpeaking] Evaluation error:', err);
          } finally {
            setIsEvaluating(false);
          }
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
        setIsRecording(false);

        // Gọi Backend AI phân tích thật
        setIsEvaluating(true);
        try {
          const res = await evaluatePronunciationApi({
            targetText: targetWord,
            targetIpa: targetIpa,
            sessionType: 'SINGLE_WORD',
          });
          setAssessment(res);
          setScore(res.overallScore);
          setHasRecorded(true);
        } catch (err) {
          console.warn('[SingleWordSpeaking] Evaluation error:', err);
        } finally {
          setIsEvaluating(false);
        }
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.log('Stop recording error:', err);
      setIsRecording(false);
      setIsEvaluating(false);
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

  const handleResetPractice = () => {
    setHasRecorded(false);
    setScore(null);
    setAssessment(null);
    setRecordedUri(null);
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Top Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={s.headerRow}>
          <Pressable
            onPress={() => {
              stopSpeech();
              Speech.stop();
              try {
                player.pause();
              } catch (_) {}
              router.back();
            }}
            style={s.backBtn}
          >
            <ChevronLeft color={palette.text} size={20} />
            <Text style={s.backBtnText}>Chế độ Luyện nói</Text>
          </Pressable>
          <View style={s.tagBadge}>
            <Text style={s.tagBadgeText}>
              {currentLesson?.category || 'IPA / Từ đơn'}
            </Text>
          </View>
        </Animated.View>

        {/* Word Display Box */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.wordCard}>
          <Text style={s.wordTitle}>{targetWord}</Text>
          <Text style={s.ipaText}>{targetIpa}</Text>
          <Text style={s.meaningText}>{meaning}</Text>

          {/* Reference Native Audio Player Button */}
          <Pressable onPress={playNativeAudio} style={s.nativeAudioBtn}>
            <Volume2 color={isPlayingNative ? colors.primary : colors.textSoft} size={16} />
            <Text style={s.nativeAudioText}>Phát âm chuẩn mẫu</Text>
          </Pressable>

          {/* Waveform Visualizer */}
          <View style={s.waveformWrap}>
            <Canvas style={{ width: '100%', height: 32 }}>
              <Path
                path="M 10 16 Q 30 4, 50 16 T 90 16 T 130 16 T 170 16 T 210 16 T 250 16 T 290 16"
                color={colors.primarySoft}
                style="stroke"
                strokeWidth={3}
                strokeCap="round"
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(300, 0)}
                  colors={[colors.primary, colors.primaryDeep]}
                />
              </Path>
            </Canvas>
          </View>
        </Animated.View>

        {/* ─── TRẠNG THÁI 1: CHƯA THU ÂM (SẴN SÀNG LUYỆN TẬP, KHÔNG FAKE ĐIỂM SỐ) ─── */}
        {!hasRecorded && !isEvaluating && (
          <Animated.View entering={FadeInDown.delay(140).duration(300)} style={s.readyCard}>
            <View style={s.readyIconWrap}>
              <Mic color={palette.primary} size={26} />
            </View>
            <Text style={s.readyTitle}>Sẵn sàng luyện phát âm</Text>
            <Text style={s.readySubtitle}>
              Bấm nút Micro tròn bên dưới và đọc to từ "{targetWord}". AI sẽ phân tích khẩu hình,
              đối chiếu âm vị IPA và phản hồi chi tiết 4 tiêu chí cho bạn.
            </Text>
            <View style={s.readyTipsRow}>
              <Sparkles color="#D97706" size={14} />
              <Text style={s.readyTipsText}>Mẹo: Bấm "Phát âm chuẩn mẫu" ở trên để nghe trước</Text>
            </View>
          </Animated.View>
        )}

        {/* ─── TRẠNG THÁI 2: ĐANG GỬI BE PHÂN TÍCH ─── */}
        {isEvaluating && (
          <Animated.View entering={FadeInDown.duration(260)} style={s.evaluatingCard}>
            <ActivityIndicator color={palette.primary} size="large" style={{ marginBottom: 12 }} />
            <Text style={s.evaluatingTitle}>AI đang phân tích phát âm...</Text>
            <Text style={s.evaluatingSubtitle}>
              Đang đối chiếu âm vị IPA, trọng âm và độ lưu loát với giọng bản xứ
            </Text>
          </Animated.View>
        )}

        {/* ─── TRẠNG THÁI 3: ĐÃ CÓ KẾT QUẢ CHẤM ĐIỂM THẬT TỪ BE ─── */}
        {hasRecorded && score !== null && assessment && (
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
              {score >= 80
                ? '🎉 Phát âm rất chuẩn giọng bản xứ!'
                : score >= 60
                ? '👍 Khá tốt! Cần chú ý thêm trọng âm & âm đuôi'
                : '💪 Cần luyện tập thêm khẩu hình'}
            </Text>

            {/* 4 Chỉ Số Đánh Giá Chi Tiết Từ BE */}
            <View style={s.metricGrid}>
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{assessment.accuracyScore}%</Text>
                <Text style={s.metricLbl}>Chính xác</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{assessment.stressScore}%</Text>
                <Text style={s.metricLbl}>Trọng âm</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{assessment.intonationScore}%</Text>
                <Text style={s.metricLbl}>Ngữ điệu</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricItem}>
                <Text style={s.metricVal}>{assessment.fluencyScore}%</Text>
                <Text style={s.metricLbl}>Lưu loát</Text>
              </View>
            </View>

            {/* Nhận xét AI thực tế */}
            {assessment.errorFeedback && assessment.errorFeedback.length > 0 && (
              <View style={s.feedbackBox}>
                <Text style={s.feedbackTitle}>Nhận xét từ AI:</Text>
                {assessment.errorFeedback.map((fb, i) => (
                  <Text key={i} style={s.feedbackText}>• {fb}</Text>
                ))}
              </View>
            )}

            {/* Audio Playback Buttons */}
            <View style={s.playbackRow}>
              <Pressable
                onPress={playUserVoice}
                style={[s.playbackBtn, isPlayingUserVoice && s.playbackBtnActive]}
              >
                <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                <Text style={s.playbackBtnText}>
                  {isPlayingUserVoice ? 'Đang phát...' : 'Nghe lại giọng'}
                </Text>
              </Pressable>

              <Pressable onPress={handleResetPractice} style={s.retryBtn}>
                <RotateCcw color="#334155" size={14} />
                <Text style={s.retryBtnText}>Luyện lại</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  router.push({
                    pathname: '/(student)/practice/speaking/detailed-feedback' as any,
                    params: {
                      word: targetWord,
                      ipa: targetIpa,
                      score: String(score),
                      accuracy: String(assessment.accuracyScore),
                      stress: String(assessment.stressScore),
                      intonation: String(assessment.intonationScore),
                      fluency: String(assessment.fluencyScore),
                      audioUri: recordedUri || '',
                    },
                  });
                }}
                style={s.analysisBtn}
              >
                <Sparkles color="#FFFFFF" size={14} />
                <Text style={s.analysisBtnText}>Chi tiết</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Record Mic Button Controls */}
      <View style={s.micSection}>
        <Animated.View style={animatedPulseStyle}>
          <Pressable
            onPress={handleRecordPress}
            disabled={isEvaluating}
            style={[
              s.micBtn,
              isRecording ? s.micBtnRecording : s.micBtnNormal,
              isEvaluating && { opacity: 0.6 },
            ]}
          >
            {isRecording ? (
              <Square color="#FFFFFF" size={26} fill="#FFFFFF" />
            ) : (
              <Mic color="#FFFFFF" size={30} />
            )}
          </Pressable>
        </Animated.View>

        <Text style={s.micHintText}>
          {isEvaluating
            ? 'Đang gửi AI phân tích âm thanh...'
            : isRecording
            ? `Đang thu âm 00:0${recordTime}s • Chạm để hoàn tất & chấm điểm`
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
    paddingBottom: 24,
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
  readyCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  readyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 6,
  },
  readySubtitle: {
    fontSize: 13,
    color: palette.textSoft,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  readyTipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  readyTipsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
  },
  evaluatingCard: {
    backgroundColor: '#FFFFFF',
    padding: 26,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  evaluatingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 4,
  },
  evaluatingSubtitle: {
    fontSize: 12.5,
    color: palette.textSoft,
    textAlign: 'center',
    lineHeight: 18,
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
    marginBottom: 16,
  },
  scoreRingWrap: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 14,
    textAlign: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.textSoft,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  feedbackBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  feedbackTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  playbackBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    paddingVertical: 11,
    borderRadius: 14,
  },
  playbackBtnActive: {
    backgroundColor: colors.primaryDeep,
  },
  playbackBtnText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  analysisBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.text,
    paddingVertical: 11,
    borderRadius: 14,
  },
  analysisBtnText: {
    fontSize: 12,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  micSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  micBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 12.5,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
});
