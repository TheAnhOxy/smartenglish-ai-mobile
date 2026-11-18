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
  Animated as RNAnimated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  ChevronLeft,
  Play,
  RotateCcw,
  AlertTriangle,
  Lightbulb,
} from '@/src/components/ds/icons';
import { Button3D, PulseRing, Tap, feedback, haptic } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
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
import * as Speech from 'expo-speech';
import { createManagedWebAudio, speakText, stopSpeech } from '@/src/core/services/speechService';
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
  const insets = useSafeAreaInsets();
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
        let hasPermission = false;
        try {
          const perm = await AudioModule.requestRecordingPermissionsAsync();
          hasPermission = Boolean(perm?.granted);
        } catch (permErr) {
          console.warn('[Microphone] Permission check error:', permErr);
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

        try {
          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
        } catch (modeErr) {
          console.warn('[Microphone] setAudioModeAsync error:', modeErr);
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

  // Phản hồi rung khi có điểm
  useEffect(() => {
    if (score === null) return;
    if (score >= 60) feedback.success();
    else haptic('warning');
  }, [score]);

  const onMicPress = () => {
    haptic(isRecording ? 'light' : 'medium');
    handleRecordPress();
  };

  const timeLabel = `${String(Math.floor(recordTime / 60)).padStart(2, '0')}:${String(recordTime % 60).padStart(2, '0')}`;

  return (
    <View style={[s.root, { paddingTop: (insets.top || 20) + 8, paddingBottom: (insets.bottom || 12) + 12 }]}>
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
            accessibilityLabel="Quay lại"
          >
            <View style={s.backIcon}>
              <ChevronLeft color={ds.ink} size={24} />
            </View>
            <Text style={s.backBtnText}>Luyện phát âm</Text>
          </Pressable>
          <View style={s.tagBadge}>
            <Text style={s.tagBadgeText} numberOfLines={1}>
              {currentLesson?.category || 'AI Pronunciation'}
            </Text>
          </View>
        </Animated.View>

        {/* Thông báo quyền Micro nếu có lỗi */}
        {micNotice && (
          <View style={s.noticeBox}>
            <AlertTriangle color={ds.amberText} size={20} />
            <Text style={s.noticeText}>{micNotice}</Text>
          </View>
        )}

        {/* Word Display Box */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={s.wordCard}>
          <View style={[s.wordDot, { width: 160, height: 160, right: -60, top: -70 }]} />
          <View style={[s.wordDot, { width: 80, height: 80, left: -30, bottom: -40 }]} />
          <Text style={s.wordOverline}>Đọc to từ này</Text>
          <Text style={s.wordTitle} adjustsFontSizeToFit numberOfLines={1}>{targetWord}</Text>
          <Text style={s.ipaText}>{targetIpa}</Text>
          <Text style={s.meaningText}>{meaning}</Text>

          {/* Nút phát âm chuẩn bản ngữ */}
          <Tap onPress={playNativeAudio} sound="none" style={[s.nativeAudioBtn, isPlayingNative && s.nativeAudioBtnActive]}>
            <Volume2 color={isPlayingNative ? ds.ink : ds.white} size={20} />
            <Text style={[s.nativeAudioText, isPlayingNative && { color: ds.ink }]}>
              {isPlayingNative ? 'Đang phát mẫu...' : 'Nghe phát âm mẫu'}
            </Text>
          </Tap>

          {/* Sóng âm — chuyển động khi đang thu hoặc đang phát mẫu */}
          <Waveform active={isRecording || isPlayingNative} color={isRecording ? '#FCA5A5' : ds.skyLight} />
        </Animated.View>

        {/* ─── TRẠNG THÁI 1: CHƯA THU ÂM (SẴN SÀNG LUYỆN TẬP) ─── */}
        {!hasRecorded && !isEvaluating && (
          <Animated.View entering={FadeInDown.delay(140).duration(300)} style={s.readyCard}>
            <View style={s.readyIconWrap}>
              <Mic color={ds.btn} size={28} />
            </View>
            <Text style={s.readyTitle}>Sẵn sàng luyện phát âm</Text>
            <Text style={s.readySubtitle}>
              Bấm nút micro bên dưới và đọc to từ "{targetWord}". AI sẽ phân tích khẩu hình,
              đối chiếu âm vị IPA và phản hồi chi tiết 4 tiêu chí cho bạn.
            </Text>
            <View style={s.readyTipsRow}>
              <Lightbulb color={ds.amberText} size={18} />
              <Text style={s.readyTipsText}>Mẹo: nghe phát âm mẫu ở trên trước khi đọc</Text>
            </View>
          </Animated.View>
        )}

        {/* ─── TRẠNG THÁI 2: ĐANG GỬI AI PHÂN TÍCH ÂM VỊ ─── */}
        {isEvaluating && (
          <Animated.View entering={FadeInDown.duration(260)} style={s.evaluatingCard}>
            <View style={s.evaluatingSpinner}>
              <ActivityIndicator color={ds.btn} size="large" />
            </View>
            <Text style={s.evaluatingTitle}>AI đang phân tích sóng âm và đối chiếu IPA...</Text>
            <Text style={s.evaluatingSubtitle}>
              Đang chấm điểm độ chính xác, lưu loát, trọng âm và tìm các âm vị phát âm sai
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
                <View style={[s.scorePill, { backgroundColor: score >= 80 ? ds.greenSoft : score >= 60 ? ds.amberSoft : ds.redSoft }]}>
                  <Text style={[s.scorePillText, { color: score >= 80 ? ds.greenText : score >= 60 ? ds.amberText : ds.redText }]}>
                    {score >= 80 ? 'Xuất sắc' : score >= 60 ? 'Khá tốt' : 'Cần luyện thêm'}
                  </Text>
                </View>
                <Text style={s.scoreTitle}>
                  {score >= 80
                    ? 'Chuẩn giọng bản ngữ'
                    : score >= 60
                    ? 'Cần chú ý âm đuôi'
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
                <View style={s.feedbackHead}>
                  <Lightbulb color={ds.amberText} size={18} />
                  <Text style={s.feedbackTitle}>Nhận xét từ AI</Text>
                </View>
                {assessment.errorFeedback.map((fb, i) => (
                  <View key={i} style={s.feedbackItem}>
                    <View style={s.feedbackBullet} />
                    <Text style={s.feedbackText}>{fb}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Audio Playback Buttons */}
            <View style={s.playbackRow}>
              <Button3D
                style={{ flex: 1 }}
                height={46}
                label={isPlayingUserVoice ? 'Đang phát...' : 'Nghe lại'}
                icon={<Play color={ds.white} size={16} fill={ds.white} />}
                onPress={playUserVoice}
              />
              <Button3D
                style={{ flex: 1 }}
                height={46}
                variant="light"
                label="Luyện lại"
                icon={<RotateCcw color={ds.ink} size={18} />}
                onPress={handleResetPractice}
              />
            </View>
            <Button3D
              style={{ marginTop: 10 }}
              height={46}
              variant="amber"
              label="Xem phân tích chi tiết"
              icon={<Sparkles color={ds.ink} size={18} />}
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
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Record Mic Button Controls (Chuẩn 2-State Mic UI) */}
      <View style={s.micSection}>
        <View style={s.micWrap}>
          <PulseRing size={88} color={ds.red} active={isRecording} />
          <Animated.View style={[s.micWrap, animatedPulseStyle]}>
            <View style={[s.micEdge, { backgroundColor: isRecording ? ds.redEdge : ds.btnEdge }]} />
            <Pressable
              onPress={onMicPress}
              disabled={isEvaluating}
              style={[
                s.micBtn,
                isRecording ? s.micBtnRecording : s.micBtnNormal,
                isEvaluating && { opacity: 0.6 },
              ]}
              accessibilityLabel={isRecording ? 'Dừng thu âm' : 'Bắt đầu thu âm'}
            >
              {isRecording ? (
                <Square color={ds.white} size={30} fill={ds.white} />
              ) : (
                <Mic color={ds.white} size={36} fill="none" />
              )}
            </Pressable>
          </Animated.View>
        </View>

        {isRecording ? (
          <View style={s.recRow}>
            <View style={s.recDot} />
            <Text style={s.recTime}>{timeLabel}</Text>
            <Text style={s.micHintText}>Chạm để hoàn tất và chấm điểm</Text>
          </View>
        ) : (
          <Text style={s.micHintText}>
            {isEvaluating ? 'Đang gửi AI phân tích âm thanh...' : 'Chạm micro để thu âm giọng nói'}
          </Text>
        )}
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

const BAR_HEIGHTS = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 14, 18, 10, 22, 16, 26, 12];

/** Sóng âm: các thanh nhấp nhô lệch pha khi active */
const Waveform: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const v = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.stopAnimation();
      RNAnimated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const loop = RNAnimated.loop(
      RNAnimated.timing(v, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active]);
  return (
    <View style={s.waveformWrap}>
      {BAR_HEIGHTS.map((h, i) => {
        const phase = (i % 6) / 6;
        const scaleY = active
          ? v.interpolate({
              inputRange: [0, phase, Math.min(phase + 0.5, 1), 1],
              outputRange: [0.45, 1, 0.35, 0.45],
            })
          : 0.55;
        return (
          <RNAnimated.View
            key={i}
            style={{ width: 4, height: h + 6, borderRadius: 2, backgroundColor: color, opacity: active ? 1 : 0.55, transform: [{ scaleY }] }}
          />
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.bg,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: ds.ink,
    fontFamily: dsFont.display,
    fontSize: dsSize.md,
  },
  tagBadge: {
    backgroundColor: ds.skySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 1,
  },
  tagBadgeText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.btn,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ds.amberSoft,
    padding: 12,
    borderRadius: dsRadius.md,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: dsSize.xs,
    fontFamily: dsFont.semibold,
    color: ds.amberText,
    lineHeight: 17,
  },
  wordCard: {
    backgroundColor: ds.ink,
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: dsRadius.xl,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    ...dsShadow.lift,
  },
  wordDot: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.16)' },
  wordOverline: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.bold,
    color: ds.skyLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  wordTitle: {
    fontSize: dsSize.display,
    fontFamily: dsFont.displayHeavy,
    color: ds.white,
    marginBottom: 4,
    letterSpacing: -0.8,
  },
  ipaText: {
    fontSize: dsSize.md + 1,
    fontFamily: dsFont.semibold,
    color: ds.skyLight,
    marginBottom: 8,
  },
  meaningText: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.body,
    color: ds.onInk,
    textAlign: 'center',
  },
  nativeAudioBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.onInkFaint,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  nativeAudioBtnActive: { backgroundColor: ds.amber },
  nativeAudioText: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.bold,
    color: ds.white,
  },
  waveformWrap: {
    width: '100%',
    height: 40,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  readyCard: {
    backgroundColor: ds.card,
    padding: 22,
    borderRadius: dsRadius.xl,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    marginBottom: 16,
  },
  readyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: ds.skySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: dsSize.md,
    fontFamily: dsFont.display,
    color: ds.ink,
    marginBottom: 6,
  },
  readySubtitle: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.body,
    color: ds.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  readyTipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.amberSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  readyTipsText: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.semibold,
    color: ds.amberText,
    flexShrink: 1,
  },
  evaluatingCard: {
    backgroundColor: ds.card,
    padding: 26,
    borderRadius: dsRadius.xl,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    marginBottom: 16,
  },
  evaluatingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ds.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  evaluatingTitle: {
    fontSize: dsSize.base,
    fontFamily: dsFont.display,
    color: ds.ink,
    marginBottom: 4,
    textAlign: 'center',
  },
  evaluatingSubtitle: {
    fontSize: dsSize.xs + 0.5,
    fontFamily: dsFont.body,
    color: ds.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  scoreCard: {
    backgroundColor: ds.card,
    padding: 18,
    borderRadius: dsRadius.xl,
    borderWidth: 1.5,
    borderColor: ds.line,
    marginBottom: 16,
  },
  ringHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: ds.line,
  },
  scoreSummaryWrap: {
    flex: 1,
    gap: 4,
  },
  scorePill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  scorePillText: { fontSize: dsSize.xs, fontFamily: dsFont.bold },
  scoreTitle: {
    fontSize: dsSize.md,
    fontFamily: dsFont.display,
    color: ds.ink,
  },
  scoreSubTitle: {
    fontSize: dsSize.xs,
    fontFamily: dsFont.body,
    color: ds.muted,
    lineHeight: 17,
  },
  feedbackBox: {
    backgroundColor: ds.amberSoft,
    borderRadius: dsRadius.md,
    padding: 14,
    marginTop: 14,
    gap: 6,
  },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  feedbackTitle: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.bold,
    color: ds.amberText,
  },
  feedbackItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  feedbackBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.amberDeep, marginTop: 7 },
  feedbackText: {
    flex: 1,
    fontSize: dsSize.sm,
    fontFamily: dsFont.body,
    color: ds.ink,
    lineHeight: 19,
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  micSection: {
    alignItems: 'center',
    paddingTop: 10,
    gap: 10,
  },
  micWrap: { width: 88, height: 94, alignItems: 'center' },
  micEdge: { position: 'absolute', top: 6, width: 88, height: 88, borderRadius: 44 },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnNormal: {
    backgroundColor: ds.btn,
  },
  micBtnRecording: {
    backgroundColor: ds.red,
  },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: ds.red },
  recTime: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.md, color: ds.red, fontVariant: ['tabular-nums'] },
  micHintText: {
    fontSize: dsSize.sm,
    fontFamily: dsFont.semibold,
    color: ds.muted,
    textAlign: 'center',
  },
});
