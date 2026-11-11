import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  ChevronLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { createManagedWebAudio, speakText, stopSpeech } from '@/src/core/services/speechService';
import { colors, palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import {
  evaluatePronunciationApi,
  PronunciationAssessmentData,
  fetchPronunciationLessonsApi,
  PronunciationLesson,
} from '../../data/speakingApi';
import { CircularAccuracyRing } from '../components/CircularAccuracyRing';
import { IpaSyllableBreakdownCard } from '../components/IpaSyllableBreakdownCard';
import { SpeakingMetricsGrid } from '../components/SpeakingMetricsGrid';
import { MouthShapeGuideModal } from './MouthShapeGuideModal';

export const SingleWordSpeakingScreen = () => {
  const router = useRouter();
  const { lessonId, target } = useLocalSearchParams<{ lessonId?: string; target?: string }>();

  const [currentLesson, setCurrentLesson] = useState<PronunciationLesson | null>(null);
  const [targetWord, setTargetWord] = useState<string>(target || 'Phenomenal');
  const [targetIpa, setTargetIpa] = useState<string>('/fəˈnæmənəl/');
  const [meaning, setMeaning] = useState<string>('tính từ • Phi thường, kỳ diệu, ấn tượng');

  // Trạng thái thu âm và kết quả AI chấm
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<PronunciationAssessmentData | null>(null);

  const [recordTime, setRecordTime] = useState(0);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [showMouthGuide, setShowMouthGuide] = useState(false);

  const isActionProcessingRef = useRef(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedUri);
  const playerStatus = useAudioPlayerStatus(player);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const webAudioBlobUrlRef = useRef<string | null>(null);

  const pulseScale = useSharedValue(1);
  const micRipple = useSharedValue(0);

  // Tải thông tin từ vựng mục tiêu từ Backend
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
      } else if (list && list.length > 0) {
        const first = list[0];
        setCurrentLesson(first);
        setTargetWord(first.targetText);
        setTargetIpa(first.ipaTranscription || `/${first.targetText}/`);
        setMeaning(first.meaningVi || 'Luyện phát âm chuẩn theo bảng phiên âm IPA quốc tế');
      }
    });
  }, [lessonId, target]);

  // Bộ đếm thời gian thu âm & hiệu ứng sóng
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

  // An toàn: Ngắt toàn bộ âm thanh và giải phóng micro khi unmount hoặc rời tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
        Speech.stop();
        try {
          if (recorder.isRecording) {
            recorder.stop().catch(() => {});
          }
        } catch (_) {}
        try {
          player.pause();
        } catch (_) {}
        setIsRecording(false);
        setIsEvaluating(false);
      };
    }, [player, recorder])
  );

  useEffect(() => {
    return () => {
      stopSpeech();
      Speech.stop();
      try {
        if (recorder.isRecording) {
          recorder.stop().catch(() => {});
        }
      } catch (_) {}
      try {
        player.pause();
      } catch (_) {}
    };
  }, [player, recorder]);

  const playNativeAudio = () => {
    setIsPlayingNative(true);
    void speakText(targetWord, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setIsPlayingNative(false),
      onError: () => setIsPlayingNative(false),
    });
  };

  // Khởi động thu âm an toàn với kiểm tra quyền 2 lớp (Zero-Crash)
  const startRecording = async () => {
    if (isActionProcessingRef.current || isRecording) return;
    isActionProcessingRef.current = true;
    setMicNotice(null);

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

          // Chuyển âm thanh web sang base64 để gửi tới AI backend
          let base64Audio: string | undefined = undefined;
          try {
            base64Audio = await new Promise<string | undefined>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const res = reader.result as string;
                resolve(res?.includes(',') ? res.split(',')[1] : res);
              };
              reader.onerror = () => resolve(undefined);
              reader.readAsDataURL(audioBlob);
            });
          } catch (e) {
            console.warn('[Web Audio] Base64 conversion fallback:', e);
          }

          // Phân tích thật từ Backend AI
          setIsEvaluating(true);
          try {
            const res = await evaluatePronunciationApi({
              targetText: targetWord,
              targetIpa: targetIpa,
              audioBase64: base64Audio,
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
        // Kiểm tra quyền Micro an toàn 2 lớp (expo-audio + expo-av fallback)
        let hasPermission = false;
        try {
          const perm = await AudioModule.requestRecordingPermissionsAsync();
          hasPermission = Boolean(perm?.granted);
        } catch (_) {
          try {
            const avPerm = await Audio.requestPermissionsAsync();
            hasPermission = Boolean(avPerm?.granted);
          } catch (permErr) {
            console.warn('[Microphone] Permission check error:', permErr);
          }
        }

        if (!hasPermission) {
          const msg = 'Vui lòng cấp quyền Microphone trong Cài đặt để SmartEnglish AI có thể lắng nghe giọng đọc của bạn.';
          setMicNotice(msg);
          if (Platform.OS !== 'web') {
            Alert.alert('Cần quyền Microphone', msg);
          }
          setIsRecording(false);
          return;
        }

        // Thiết lập Audio Mode an toàn
        try {
          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
        } catch (_) {
          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
            });
          } catch (_) {}
        }

        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      }
    } catch (err) {
      console.warn('[Microphone] Start recording error:', err);
      setIsRecording(false);
      setMicNotice('Không thể kích hoạt micro. Vui lòng kiểm tra quyền thiết bị và thử lại!');
    } finally {
      setTimeout(() => {
        isActionProcessingRef.current = false;
      }, 300);
    }
  };

  // Dừng thu âm an toàn và kích hoạt AI chấm điểm tức thì
  const stopRecording = async () => {
    if (isActionProcessingRef.current) return;
    isActionProcessingRef.current = true;

    try {
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
        setIsRecording(false);
      } else if (recorder.isRecording) {
        await recorder.stop();
        const uri = recorder.uri;
        setRecordedUri(uri);
        setIsRecording(false);

        // Chuyển bản ghi âm thiết bị thật thành base64 gửi cho AI Backend
        let base64Audio: string | undefined = undefined;
        if (uri) {
          try {
            const res = await fetch(uri);
            const blob = await res.blob();
            base64Audio = await new Promise<string | undefined>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const str = reader.result as string;
                resolve(str?.includes(',') ? str.split(',')[1] : str);
              };
              reader.onerror = () => resolve(undefined);
              reader.readAsDataURL(blob);
            });
          } catch (audioErr) {
            console.warn('[Native Audio] Base64 conversion fallback:', audioErr);
          }
        }

        // Gọi Backend AI phân tích phát âm
        setIsEvaluating(true);
        try {
          const res = await evaluatePronunciationApi({
            targetText: targetWord,
            targetIpa: targetIpa,
            audioBase64: base64Audio,
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
      console.warn('[Microphone] Stop recording error:', err);
      setIsRecording(false);
      setIsEvaluating(false);
    } finally {
      setTimeout(() => {
        isActionProcessingRef.current = false;
      }, 300);
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
        const audio = createManagedWebAudio(webAudioBlobUrlRef.current);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
            <Text style={s.backBtnText}>Luyện phát âm IPA</Text>
          </Pressable>
          <View style={s.tagBadge}>
            <Text style={s.tagBadgeText}>
              {currentLesson?.category || 'AI Pronunciation'}
            </Text>
          </View>
        </Animated.View>

        {/* Thông báo quyền Micro nếu có lỗi */}
        {micNotice && (
          <View style={s.noticeBox}>
            <AlertTriangle color="#D97706" size={16} />
            <Text style={s.noticeText}>{micNotice}</Text>
          </View>
        )}

        {/* Word Display Box */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.wordCard}>
          <Text style={s.wordTitle}>{targetWord}</Text>
          <Text style={s.ipaText}>{targetIpa}</Text>
          <Text style={s.meaningText}>{meaning}</Text>

          {/* Nút phát âm chuẩn bản ngữ */}
          <Pressable onPress={playNativeAudio} style={s.nativeAudioBtn}>
            <Volume2 color={isPlayingNative ? colors.primary : colors.textSoft} size={16} />
            <Text style={s.nativeAudioText}>Phát âm chuẩn mẫu</Text>
          </Pressable>

          {/* Sóng âm minh hoạ — dùng View thường để chạy được cả trên web (Skia web cần CanvasKit) */}
          <View style={[s.waveformWrap, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32 }]}>
            {[10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 14, 18, 10].map((h, i) => (
              <View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: i % 2 ? colors.primary : colors.primaryMid }} />
            ))}
          </View>
        </Animated.View>

        {/* ─── TRẠNG THÁI 1: CHƯA THU ÂM (SẴN SÀNG LUYỆN TẬP) ─── */}
        {!hasRecorded && !isEvaluating && (
          <Animated.View entering={FadeInDown.delay(140).duration(300)} style={s.readyCard}>
            <View style={s.readyIconWrap}>
              <Mic color="#10B981" size={28} />
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

        {/* ─── TRẠNG THÁI 2: ĐANG GỬI AI PHÂN TÍCH ÂM VỊ ─── */}
        {isEvaluating && (
          <Animated.View entering={FadeInDown.duration(260)} style={s.evaluatingCard}>
            <ActivityIndicator color="#10B981" size="large" style={{ marginBottom: 12 }} />
            <Text style={s.evaluatingTitle}>AI đang phân tích sóng âm & đối chiếu IPA...</Text>
            <Text style={s.evaluatingSubtitle}>
              Đang chấm điểm Độ chính xác, Lưu loát, Trọng âm và tìm kiếm các âm vị phát âm sai
            </Text>
          </Animated.View>
        )}

        {/* ─── TRẠNG THÁI 3: ĐÃ CÓ KẾT QUẢ CHẤM ĐIỂM THẬT TỪ AI ─── */}
        {hasRecorded && score !== null && assessment && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)} style={s.scoreCard}>
            {/* Vòng tròn phần trăm chính xác (Circular Accuracy Ring) */}
            <View style={s.ringHeaderSection}>
              <CircularAccuracyRing
                score={score}
                size={110}
                strokeWidth={10}
                label="ĐỘ CHUẨN"
              />
              <View style={s.scoreSummaryWrap}>
                <Text style={s.scoreTitle}>
                  {score >= 80
                    ? 'Xuất sắc! Chuẩn giọng bản ngữ'
                    : score >= 60
                    ? 'Khá tốt! Cần chú ý âm đuôi'
                    : 'Cần luyện tập thêm khẩu hình'}
                </Text>
                <Text style={s.scoreSubTitle}>
                  {score >= 80
                    ? 'Ngữ điệu tự nhiên, các âm vị phát âm rất rõ ràng.'
                    : 'Hãy xem chi tiết âm tiết tô đỏ bên dưới để điều chỉnh.'}
                </Text>
              </View>
            </View>

            {/* 4 Chỉ Số Đánh Giá Chi Tiết */}
            <SpeakingMetricsGrid
              accuracy={assessment.accuracyScore}
              fluency={assessment.fluencyScore}
              stress={assessment.stressScore}
              intonation={assessment.intonationScore}
            />

            {/* Tô đỏ âm tiết IPA đọc sai để làm nổi bật thế mạnh AI */}
            <IpaSyllableBreakdownCard
              syllables={assessment.syllables}
              targetWord={targetWord}
              targetIpa={targetIpa}
              mouthShapeGuide={currentLesson?.mouthShapeGuide}
              onOpenMouthGuide={() => setShowMouthGuide(true)}
            />

            {/* Nhận xét chi tiết từ AI */}
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

      {/* Record Mic Button Controls (Chuẩn 2-State Mic UI) */}
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
            : 'Chạm micro để thu âm giọng nói'}
        </Text>
      </View>

      <MouthShapeGuideModal
        visible={showMouthGuide}
        onClose={() => setShowMouthGuide(false)}
        targetWord={targetWord}
        targetIpa={targetIpa}
        mouthShapeGuide={currentLesson?.mouthShapeGuide}
        mispronouncedPhoneme={assessment?.syllables?.find((s) => !s.isCorrect)?.ipa}
        feedback={assessment?.syllables?.find((s) => !s.isCorrect)?.feedback}
      />
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
    fontWeight: '600',
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
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '700',
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ECFDF5',
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
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  evaluatingSubtitle: {
    fontSize: 12.5,
    color: palette.textSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  ringHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scoreSummaryWrap: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  scoreSubTitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  feedbackBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 14,
  },
  playbackBtn: {
    flex: 1,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  playbackBtnActive: {
    backgroundColor: '#0284C7',
  },
  playbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retryBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  analysisBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  analysisBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  micSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  micBtnNormal: {
    backgroundColor: '#10B981', // Xanh ngọc bích chuẩn
    shadowColor: '#10B981',
  },
  micBtnRecording: {
    backgroundColor: '#EF4444', // Đỏ cam khi đang thu âm
    shadowColor: '#EF4444',
  },
  micHintText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
});
