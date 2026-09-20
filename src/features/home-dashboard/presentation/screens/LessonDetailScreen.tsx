import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Award,
  Clock,
  Check,
  X,
  Video,
  Play,
  ExternalLink
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  fetchLessonDetailApi,
  completeLessonApi,
  LessonDetailData
} from '@/src/features/learning-path/data/knowledgeGapApi';
import { palette } from '@/src/theme';

const flattenDialogues = (dialogues: any[]): Array<{ speaker: string; textEn: string; textVi: string }> => {
  if (!Array.isArray(dialogues)) return [];
  const result: Array<{ speaker: string; textEn: string; textVi: string }> = [];
  for (const item of dialogues) {
    if (!item) continue;
    if (Array.isArray(item.lines)) {
      for (const line of item.lines) {
        if (!line) continue;
        result.push({
          speaker: String(line.speaker || 'A'),
          textEn: String(line.text || line.textEn || ''),
          textVi: String(line.translation || line.textVi || ''),
        });
      }
    } else {
      result.push({
        speaker: String(item.speaker || 'A'),
        textEn: String(item.textEn || item.text || ''),
        textVi: String(item.textVi || item.translation || ''),
      });
    }
  }
  return result;
};

export const LessonDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [lesson, setLesson] = useState<LessonDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedModal, setEarnedModal] = useState<{ xp: number; coins: number; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadLesson = async () => {
      setLoading(true);
      const data = await fetchLessonDetailApi(id || 'u-1', currentUser?.id?.toString());
      if (isMounted) {
        if (data) {
          setLesson(data);
          setIsCompleted(Boolean(data.isCompleted));
        }
        setLoading(false);
      }
    };
    loadLesson();
    return () => { isMounted = false; };
  }, [id, currentUser?.id]);

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleCompleteLesson = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await completeLessonApi(id || 'u-1', currentUser?.id?.toString());
      if (res && res.isCompleted) {
        setIsCompleted(true);
        const xp = Number(res.xpEarned || 0);
        const coins = Number(res.coinsEarned || 0);
        if (xp > 0 || coins > 0) {
          useAuthStore.getState().addReward(xp, coins);
        }
        setEarnedModal({
          xp,
          coins,
          message: res.congratulationMessage || (xp > 0 
            ? 'Chúc mừng bạn đã hoàn thành xuất sắc bài học!' 
            : 'Bạn đã hoàn thành bài học này trước đó rồi! Hệ thống đã ghi nhận tiến độ ôn tập của bạn.')
        });
      } else {
        setIsCompleted(true);
        Alert.alert('Hoàn thành', 'Hệ thống đã lưu tiến độ bài học của bạn!');
        router.back();
      }
    } catch (err) {
      setIsCompleted(true);
      Alert.alert('Thành công!', 'Bạn đã hoàn thành bài học!');
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={s.loadingText}>Đang tải nội dung bài học từ hệ thống...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.errorText}>Không tìm thấy bài học.</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Quay lại lộ trình</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Top App Bar */}
      <View style={s.headerBar}>
        <Pressable onPress={() => router.back()} style={s.headerIconBtn} hitSlop={12}>
          <ArrowLeft size={22} color="#0F172A" />
        </Pressable>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerChapter} numberOfLines={1}>{lesson.chapterTitleVi || 'Lộ trình bài học'}</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{lesson.titleVi}</Text>
        </View>
        <View style={s.badgeWrap}>
          <Text style={s.badgeText}>{lesson.cefrLevel || 'B1'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Meta Info Card */}
        <View style={s.metaCard}>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Award size={18} color={palette.primary} />
              <Text style={s.metaVal}>+{lesson.xpReward || 30} XP</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <Clock size={18} color="#0284C7" />
              <Text style={s.metaVal}>{lesson.estimatedMin || 10} phút</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <BookOpen size={18} color="#10B981" />
              <Text style={s.metaVal}>{isCompleted ? 'Đã học' : 'Chưa học'}</Text>
            </View>
          </View>
          {lesson.summaryVi && (
            <Text style={s.summaryText}>{lesson.summaryVi}</Text>
          )}
        </View>

        {/* Video Bài Giảng Trực Tuyến */}
        {lesson.videos && lesson.videos.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionTag, { backgroundColor: '#FEE2E2' }]}>
                <Video size={16} color="#DC2626" />
              </View>
              <Text style={s.sectionTitle}>Video Bài Giảng Thực Tế</Text>
            </View>

            {lesson.videos.map((vid, vIdx) => (
              <View key={vIdx} style={s.videoCard}>
                <View style={s.videoCardTop}>
                  <View style={s.videoIconBox}>
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.videoTitle} numberOfLines={2}>{vid.title || 'Video hướng dẫn học'}</Text>
                    <Text style={s.videoSubtitle}>
                      {vid.isR2 ? 'Video Cloud R2 • Tốc độ cao' : 'YouTube Video • Trực quan'}
                      {vid.durationSeconds ? ` • ${Math.round(vid.durationSeconds / 60)} phút` : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => vid.videoUrl && Linking.openURL(vid.videoUrl)}
                  style={s.playVideoBtn}
                >
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={s.playVideoBtnText}>Mở Xem Video Ngay</Text>
                  <ExternalLink size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* 1. Lý Thuyết Trọng Tâm & Ngữ Pháp */}
        {lesson.grammarNotes && lesson.grammarNotes.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionTag, { backgroundColor: '#EEF2FF' }]}>
                <BookOpen size={16} color={palette.primary} />
              </View>
              <Text style={s.sectionTitle}>1. Lý Thuyết & Công Thức Trọng Điểm</Text>
            </View>

            {lesson.grammarNotes.map((note, idx) => (
              <View key={idx} style={s.noteCard}>
                <Text style={s.noteTitle}>{note.title}</Text>
                {note.formula ? (
                  <View style={s.formulaBox}>
                    <Text style={s.formulaLabel}>CÔNG THỨC:</Text>
                    <Text style={s.formulaText}>{note.formula}</Text>
                  </View>
                ) : null}
                <Text style={s.noteExplanation}>{note.explanation}</Text>

                {note.examples && note.examples.length > 0 && (
                  <View style={s.examplesContainer}>
                    <Text style={s.exampleHeader}>Ví dụ minh họa:</Text>
                    {note.examples.map((ex, exIdx) => (
                      <View key={exIdx} style={s.exampleItem}>
                        <Text style={s.exampleEn}>• {ex.en}</Text>
                        <Text style={s.exampleVi}>→ {ex.vi}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 2. Từ Vựng Cốt Lõi */}
        {lesson.vocabularyList && lesson.vocabularyList.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionTag, { backgroundColor: '#ECFDF5' }]}>
                <Sparkles size={16} color="#10B981" />
              </View>
              <Text style={s.sectionTitle}>2. Từ Vựng Quan Trọng Trong Bài</Text>
            </View>

            <View style={s.vocabList}>
              {lesson.vocabularyList.map((item, idx) => (
                <View key={idx} style={s.vocabCard}>
                  <View style={s.vocabTopRow}>
                    <View style={s.vocabWordWrap}>
                      <Text style={s.vocabWord}>{item.word}</Text>
                      <Text style={s.vocabIpa}>{item.ipa}</Text>
                    </View>
                    <View style={s.posBadge}>
                      <Text style={s.posText}>{item.pos}</Text>
                    </View>
                  </View>
                  <Text style={s.vocabMeaning}>{item.meaningVi}</Text>
                  {item.exampleEn ? (
                    <View style={s.vocabExampleBox}>
                      <Text style={s.vocabExEn}>"{item.exampleEn}"</Text>
                      {item.exampleVi && <Text style={s.vocabExVi}>{item.exampleVi}</Text>}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. Hội Thoại Giao Tiếp Mẫu */}
        {lesson.dialogues && lesson.dialogues.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionTag, { backgroundColor: '#FEF3C7' }]}>
                <Volume2 size={16} color="#D97706" />
              </View>
              <Text style={s.sectionTitle}>3. Đoạn Hội Thoại Thực Tế</Text>
            </View>

            <View style={s.dialogueContainer}>
              {flattenDialogues(lesson.dialogues).map((dlg, idx) => {
                const speakerName = dlg.speaker || 'Speaker';
                const initial = speakerName.trim().length > 0 ? speakerName.trim().charAt(0).toUpperCase() : 'A';
                return (
                  <View key={idx} style={s.dialogueTurn}>
                    <View style={s.speakerAvatar}>
                      <Text style={s.speakerInitial}>{initial}</Text>
                    </View>
                    <View style={s.dialogueBubble}>
                      <Text style={s.speakerName}>{speakerName}</Text>
                      <Text style={s.dialogueEn}>{dlg.textEn}</Text>
                      {Boolean(dlg.textVi) && <Text style={s.dialogueVi}>{dlg.textVi}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 4. Bài Tập Thực Hành Nhanh */}
        {lesson.practiceQuestions && lesson.practiceQuestions.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionTag, { backgroundColor: '#F3E8FF' }]}>
                <HelpCircle size={16} color="#9333EA" />
              </View>
              <Text style={s.sectionTitle}>4. Bài Tập Vận Dụng Nhanh</Text>
            </View>

            {lesson.practiceQuestions.map((q, qIndex) => {
              const qId = q.id ?? (qIndex + 1);
              const qText = q.questionText || (q as any).question || '';
              const qOptions = Array.isArray(q.options) ? q.options : [];
              const qExplanation = q.explanationVi || (q as any).explanation || '';
              const userAns = selectedAnswers[qId];
              const isAnswered = Boolean(userAns);
              const isCorrect = userAns === q.correctAnswer;

              return (
                <View key={qId} style={s.quizCard}>
                  <Text style={s.quizQuestionText}>Câu {qIndex + 1}: {qText}</Text>
                  <View style={s.optionsList}>
                    {qOptions.map((opt, oIdx) => {
                      const isSelected = userAns === opt;
                      const isOptionCorrect = opt === q.correctAnswer;

                      let optStyle = s.optionBtn;
                      if (isAnswered) {
                        if (isOptionCorrect) optStyle = s.optionBtnCorrect;
                        else if (isSelected && !isCorrect) optStyle = s.optionBtnWrong;
                      } else if (isSelected) {
                        optStyle = s.optionBtnSelected;
                      }

                      return (
                        <Pressable
                          key={oIdx}
                          onPress={() => handleSelectOption(qId, opt)}
                          style={optStyle}
                        >
                          <Text style={s.optionLetter}>{String.fromCharCode(65 + oIdx)}.</Text>
                          <Text style={s.optionText}>{opt}</Text>
                          {isAnswered && isOptionCorrect && <Check size={18} color="#10B981" />}
                          {isAnswered && isSelected && !isCorrect && <X size={18} color="#EF4444" />}
                        </Pressable>
                      );
                    })}
                  </View>

                  {isAnswered && (
                    <View style={[s.feedbackBox, isCorrect ? s.feedbackBoxCorrect : s.feedbackBoxWrong]}>
                      <Text style={s.feedbackTitle}>
                        {isCorrect ? '✓ Chính xác!' : '✗ Chưa chính xác!'}
                      </Text>
                      {Boolean(qExplanation) && (
                        <Text style={s.feedbackExplanation}>{qExplanation}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Completion Bar */}
      <View style={s.footerBar}>
        <Pressable
          onPress={handleCompleteLesson}
          disabled={submitting}
          style={[s.completeBtn, isCompleted && s.completeBtnDone]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={s.completeBtnText}>
                {isCompleted ? 'Đã Hoàn Thành Bài Học' : `Hoàn Thành Bài Học (+${lesson.xpReward || 30} XP)`}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Earned XP Celebration Dialog */}
      {earnedModal && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={[s.celebrateIconWrap, earnedModal.xp === 0 && { backgroundColor: '#ECFDF5' }]}>
              {earnedModal.xp === 0 ? (
                <CheckCircle2 size={48} color="#10B981" />
              ) : (
                <Award size={48} color="#F59E0B" />
              )}
            </View>
            <Text style={s.modalTitle}>
              {earnedModal.xp === 0 ? 'Đã Hoàn Thành Bài Học' : 'Hoàn Thành Xuất Sắc!'}
            </Text>
            <Text style={s.modalMessage}>{earnedModal.message}</Text>
            <View style={s.rewardsRow}>
              <View style={s.rewardItem}>
                <Text style={[s.rewardVal, earnedModal.xp === 0 && { color: '#64748B' }]}>
                  +{earnedModal.xp}
                </Text>
                <Text style={s.rewardLbl}>
                  {earnedModal.xp === 0 ? 'XP (Đã nhận)' : 'XP'}
                </Text>
              </View>
              <View style={s.rewardItem}>
                <Text style={[s.rewardVal, earnedModal.coins === 0 && { color: '#64748B' }]}>
                  +{earnedModal.coins}
                </Text>
                <Text style={s.rewardLbl}>
                  {earnedModal.coins === 0 ? 'Coins (Đã nhận)' : 'Coins'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setEarnedModal(null);
                router.back();
              }}
              style={s.modalBtn}
            >
              <Text style={s.modalBtnText}>Tiếp Tục Lộ Trình</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500'
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 16
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: palette.primary,
    borderRadius: 12
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerIconBtn: {
    padding: 6,
    marginRight: 8
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8
  },
  headerChapter: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  headerTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700'
  },
  badgeWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0'
  },
  summaryText: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    fontSize: 13,
    color: '#475569',
    lineHeight: 20
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  sectionTag: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8
  },
  formulaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    marginBottom: 10
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 0.5,
    marginBottom: 2
  },
  formulaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A'
  },
  noteExplanation: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10
  },
  examplesContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12
  },
  exampleHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  exampleItem: {
    marginBottom: 6
  },
  exampleEn: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A'
  },
  exampleVi: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2
  },
  vocabList: {
    gap: 10
  },
  vocabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  vocabTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  vocabWordWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  vocabIpa: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  posBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ECFDF5'
  },
  posText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600'
  },
  vocabMeaning: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 6
  },
  vocabExampleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#10B981'
  },
  vocabExEn: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
    fontStyle: 'italic'
  },
  vocabExVi: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  dialogueContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14
  },
  dialogueTurn: {
    flexDirection: 'row',
    gap: 10
  },
  speakerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  speakerInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.primary
  },
  dialogueBubble: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12
  },
  speakerName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2
  },
  dialogueEn: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4
  },
  dialogueVi: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic'
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quizQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    lineHeight: 20
  },
  optionsList: {
    gap: 8
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  optionBtnSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: palette.primary
  },
  optionBtnCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981'
  },
  optionBtnWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444'
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500'
  },
  feedbackBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8
  },
  feedbackBoxCorrect: {
    backgroundColor: '#ECFDF5'
  },
  feedbackBoxWrong: {
    backgroundColor: '#FEF2F2'
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  feedbackExplanation: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  completeBtn: {
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  completeBtnDone: {
    backgroundColor: '#10B981'
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  celebrateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24
  },
  rewardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  rewardVal: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary
  },
  rewardLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  modalBtn: {
    backgroundColor: palette.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  videoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  videoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  videoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  playVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
  },
  playVideoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  }
});
