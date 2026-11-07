import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { createManagedWebAudio, speakText, stopSpeech } from '@/src/core/services/speechService';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import { Audio } from 'expo-av';
import { CircularAccuracyRing } from '../components/CircularAccuracyRing';
import { IpaSyllableBreakdownCard } from '../components/IpaSyllableBreakdownCard';
import { SpeakingMetricsGrid } from '../components/SpeakingMetricsGrid';
import {
  extractAndEvaluateSyllables,
  evaluatePronunciationApi,
  fetchPronunciationLessonsApi,
} from '../../data/speakingApi';

export const SpeakingFeedbackScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    word?: string;
    ipa?: string;
    score?: string;
    accuracy?: string;
    stress?: string;
    intonation?: string;
    fluency?: string;
    audioUri?: string;
  }>();

  const targetWord = params.word || 'Phenomenal';
  const targetIpa = params.ipa || '/fəˈnæmənəl/';
  const initialScore = params.score ? Number(params.score) : 85;

  const [currentScore, setCurrentScore] = useState<number>(initialScore);
  const [accuracy, setAccuracy] = useState<number>(params.accuracy ? Number(params.accuracy) : 86);
  const [stress, setStress] = useState<number>(params.stress ? Number(params.stress) : 80);
  const [intonation, setIntonation] = useState<number>(params.intonation ? Number(params.intonation) : 82);
  const [fluency, setFluency] = useState<number>(params.fluency ? Number(params.fluency) : 88);

  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(Boolean(params.score || params.audioUri));
  const [recordedUri, setRecordedUri] = useState<string | null>(params.audioUri || null);
  const [recordTime, setRecordTime] = useState(0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [mouthGuide, setMouthGuide] = useState<string>('');

  useEffect(() => {
    fetchPronunciationLessonsApi().then((list) => {
      const found = list.find((item) => item.targetText.toLowerCase() === targetWord.toLowerCase());
      if (found?.mouthShapeGuide) {
        setMouthGuide(found.mouthShapeGuide);
      }
    });
  }, [targetWord]);

  const syllables = extractAndEvaluateSyllables(targetWord, targetIpa, accuracy);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedUri);
  const playerStatus = useAudioPlayerStatus(player);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const webAudioBlobUrlRef = useRef<string | null>(null);
  const isActionProcessingRef = useRef(false);

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
      };
    }, [player, recorder])
  );

  const playNativeTargetAudio = () => {
    setIsPlayingNative(true);
    void speakText(targetWord, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85,
      onDone: () => setIsPlayingNative(false),
      onError: () => setIsPlayingNative(false),
    });
  };

  const startAudioRecording = async () => {
    if (isActionProcessingRef.current || isRecording) return;
    isActionProcessingRef.current = true;
    setNoticeMessage(null);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new (window as any).MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          webAudioBlobUrlRef.current = audioUrl;
          setRecordedUri(audioUrl);
          setHasRecording(true);

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

          evaluatePronunciationApi({
            targetText: targetWord,
            targetIpa,
            audioBase64: base64Audio,
            sessionType: 'SINGLE_WORD',
          }).then((res) => {
            setCurrentScore(res.overallScore);
            setAccuracy(res.accuracyScore);
            setStress(res.stressScore);
            setIntonation(res.intonationScore);
            setFluency(res.fluencyScore);
          }).catch(() => {});
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } else {
        // Kiểm tra quyền Micro 2 lớp
        let hasPermission = false;
        try {
          const perm = await AudioModule.requestRecordingPermissionsAsync();
          hasPermission = Boolean(perm?.granted);
        } catch (_) {
          try {
            const avPerm = await Audio.requestPermissionsAsync();
            hasPermission = Boolean(avPerm?.granted);
          } catch (_) {}
        }

        if (!hasPermission) {
          const msg = 'Vui lòng cho phép ứng dụng truy cập Micro để thu âm phát âm của bạn.';
          setNoticeMessage(msg);
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
      console.warn('[Feedback] Failed to start recording:', err);
      setIsRecording(false);
      setNoticeMessage('Không thể truy cập micro. Vui lòng kiểm tra quyền thiết bị!');
    } finally {
      setTimeout(() => {
        isActionProcessingRef.current = false;
      }, 300);
    }
  };

  const stopAudioRecording = async () => {
    if (isActionProcessingRef.current) return;
    isActionProcessingRef.current = true;

    try {
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
        setIsRecording(false);
      } else if (recorder.isRecording) {
        await recorder.stop();
        const uri = recorder.uri;
        setRecordedUri(uri);
        setHasRecording(Boolean(uri));
        setIsRecording(false);

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
            console.warn('[Feedback Audio] Base64 conversion fallback:', audioErr);
          }
        }

        // Đánh giá cập nhật điểm số
        evaluatePronunciationApi({
          targetText: targetWord,
          targetIpa,
          audioBase64: base64Audio,
          sessionType: 'SINGLE_WORD',
        }).then((res) => {
          setCurrentScore(res.overallScore);
          setAccuracy(res.accuracyScore);
          setStress(res.stressScore);
          setIntonation(res.intonationScore);
          setFluency(res.fluencyScore);
        }).catch(() => {});
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.warn('[Feedback] Failed to stop recording:', err);
      setIsRecording(false);
    } finally {
      setTimeout(() => {
        isActionProcessingRef.current = false;
      }, 300);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const playUserVoiceAudio = async () => {
    setNoticeMessage(null);
    if (!hasRecording || (!recordedUri && !webAudioBlobUrlRef.current)) {
      setNoticeMessage('Chưa có bản ghi âm! Vui lòng ấn nút Micro bên dưới để thu âm trước.');
      return;
    }

    try {
      setIsPlayingUserVoice(true);
      if (Platform.OS === 'web' && webAudioBlobUrlRef.current) {
        const audio = createManagedWebAudio(webAudioBlobUrlRef.current);
        audio.onended = () => setIsPlayingUserVoice(false);
        audio.onerror = () => setIsPlayingUserVoice(false);
        await audio.play();
      } else if (recordedUri) {
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
            router.back();
          }}
          style={s.closeBtn}
        >
          <X color="#475569" size={22} />
        </Pressable>

        <Text style={s.headerTitle}>Chi tiết phản hồi AI</Text>

        <View style={s.streakBadge}>
          <Zap color="#0EA5E9" size={14} fill="#0EA5E9" />
          <Text style={s.streakText}>AI Speaking</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {noticeMessage && (
          <View style={s.noticeBox}>
            <AlertCircle color="#D97706" size={16} />
            <Text style={s.noticeText}>{noticeMessage}</Text>
          </View>
        )}

        {/* Vòng tròn phần trăm chính xác (Circular Accuracy Ring) */}
        <View style={s.scoreContainer}>
          <CircularAccuracyRing
            score={currentScore}
            size={110}
            strokeWidth={10}
            label="ĐỘ CHUẨN"
          />
          <Text style={s.wordTitle}>{targetWord}</Text>
          <Text style={s.ipaText}>{targetIpa}</Text>
          <Text style={s.scoreTitleText}>
            {currentScore >= 80
              ? '🎉 Xuất sắc! Phát âm chuẩn giọng bản xứ'
              : currentScore >= 60
              ? '👍 Khá tốt! Cần chú ý thêm trọng âm & âm đuôi'
              : '💪 Cần luyện tập thêm khẩu hình'}
          </Text>
        </View>

        {/* 4 Chỉ Số Đánh Giá Chi Tiết */}
        <SpeakingMetricsGrid
          accuracy={accuracy}
          fluency={fluency}
          stress={stress}
          intonation={intonation}
        />

        {/* Tô đỏ âm tiết IPA đọc sai để làm nổi bật thế mạnh AI */}
        <IpaSyllableBreakdownCard
          syllables={syllables}
          targetWord={targetWord}
          targetIpa={targetIpa}
          mouthShapeGuide={mouthGuide}
        />

        {/* Audio Match Card (Native vs Your Voice) */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Activity color="#0EA5E9" size={20} />
            <Text style={s.cardTitleText}>So sánh dạng sóng âm thanh</Text>
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
              <Text style={s.audioLabelText}>Target (Bản thu âm chuẩn mẫu)</Text>
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

          {/* Your Voice Waveform */}
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
                {hasRecording ? 'Your Voice (Bản ghi âm giọng của bạn)' : 'Your Voice (Chưa có bản ghi âm)'}
              </Text>
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

        {/* Tips to Improve Card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Lightbulb color="#D97706" size={18} />
            <Text style={s.cardTitleText}>Mẹo cải thiện phát âm</Text>
          </View>

          <Text style={s.tipContentText}>
            Tập trung vào khẩu hình âm chính: Hãy hạ hàm dưới và giữ hơi đều đặn trong vòm họng.
          </Text>

          <View style={s.diagramBox}>
            <View style={s.diagramVisualCard}>
              <View style={s.anatomyGuideRow}>
                <View style={s.anatomyPill}>
                  <Text style={s.anatomyPillEmoji}>👄</Text>
                  <Text style={s.anatomyPillLabel}>Độ mở môi</Text>
                  <Text style={s.anatomyPillVal}>Hé mở tự nhiên</Text>
                </View>
                <View style={s.anatomyPill}>
                  <Text style={s.anatomyPillEmoji}>👅</Text>
                  <Text style={s.anatomyPillLabel}>Vị trí lưỡi</Text>
                  <Text style={s.anatomyPillVal}>Đầu lưỡi thả lỏng</Text>
                </View>
                <View style={s.anatomyPill}>
                  <Text style={s.anatomyPillEmoji}>💨</Text>
                  <Text style={s.anatomyPillLabel}>Luồng hơi</Text>
                  <Text style={s.anatomyPillVal}>Đều đặn, dứt khoát</Text>
                </View>
              </View>
              {Boolean(mouthGuide) && (
                <View style={s.mouthGuideBackendBox}>
                  <Text style={s.mouthGuideBackendTitle}>Chỉ dẫn chuyên môn:</Text>
                  <Text style={s.mouthGuideBackendText}>{mouthGuide}</Text>
                </View>
              )}
            </View>
            <View style={s.diagramBadge}>
              <Text style={s.diagramBadgeText}>Vị trí đặt lưỡi & luồng hơi chuẩn giọng Mỹ</Text>
            </View>
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
          <Text style={s.retryBtnText}>Luyện lại</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(student)/practice/speaking' as any)}
          style={s.nextBtn}
        >
          <Text style={s.nextBtnText}>Danh sách bài</Text>
          <ArrowRight color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  scoreContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  wordTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  ipaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 2,
  },
  scoreTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleBtnActive: {
    backgroundColor: '#0284C7',
  },
  playCircleBtnUser: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleBtnUserActive: {
    backgroundColor: '#0284C7',
  },
  playCircleBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  audioLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4,
  },
  audioLabelUserText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
  },
  waveBar: {
    width: 4,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  tipContentText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  diagramBox: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  diagramVisualCard: {
    marginBottom: 8,
  },
  anatomyGuideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  anatomyPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  anatomyPillEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  anatomyPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  anatomyPillVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  mouthGuideBackendBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  mouthGuideBackendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  mouthGuideBackendText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  diagramBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diagramBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  retryBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
