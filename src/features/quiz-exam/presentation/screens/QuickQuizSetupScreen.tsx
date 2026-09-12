import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, Zap, Minus, Plus, Lock, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import { palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';
import { Card } from '@/src/components/ui/Card';

type QuestionType = 'trac_nghiem' | 'dien_tu' | 'ghep_noi' | 'sap_xep';

export const QuickQuizSetupScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['trac_nghiem', 'dien_tu']);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const questionTypes: { key: QuestionType; label: string }[] = [
    { key: 'trac_nghiem', label: 'Trắc nghiệm' },
    { key: 'dien_tu', label: 'Điền từ' },
    { key: 'ghep_noi', label: 'Ghép nối' },
    { key: 'sap_xep', label: 'Sắp xếp từ' },
  ];

  const topics = ['Tất cả', 'Du lịch', 'TOEIC', 'Từ ảnh quét'];

  const handleStartQuiz = () => {
    router.push({
      pathname: '/(student)/practice/quiz/play' as any,
      params: {
        types: selectedTypes.join(','),
        count: questionCount.toString(),
        topic: selectedTopic,
      },
    });
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn}>
            <Menu color={palette.text} size={20} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>AI Quiz</Text>
            <Text style={styles.headerSubtitle}>Tạo bộ câu hỏi thông minh</Text>
          </View>
        </View>

        <Image
          source={{
            uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          style={styles.avatar}
        />
      </Animated.View>

      <View style={styles.container}>
        {/* Banner Quick Quiz */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <Card style={styles.heroBanner}>
            <View style={styles.heroHeader}>
              <View style={styles.zapIconWrap}>
                <Zap color="#FFFFFF" size={18} fill="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>Quiz nhanh hôm nay</Text>
            </View>
            <Text style={styles.heroSub}>AI tự chọn 10 từ vựng cần ôn tập nhất cho bạn</Text>
            <Pressable onPress={handleStartQuiz} style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Bắt đầu ngay →</Text>
            </Pressable>
          </Card>
        </Animated.View>

        {/* Setup Section */}
        <Animated.View entering={FadeInDown.delay(140).duration(300)}>
          <Text style={styles.sectionTitle}>Tùy chỉnh bài thi</Text>

          {/* Question Type Selection */}
          <Text style={styles.inputLabel}>Dạng câu hỏi</Text>
          <View style={styles.typeGrid}>
            {questionTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.key);
              return (
                <Pressable
                  key={type.key}
                  onPress={() => toggleType(type.key)}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                >
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                    {isSelected && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                  </View>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Question Count Adjuster */}
          <Text style={styles.inputLabel}>Số lượng câu hỏi</Text>
          <View style={styles.counterRow}>
            <Text style={styles.counterTitle}>Tổng số câu</Text>
            <View style={styles.counterActions}>
              <Pressable
                onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
                style={styles.countBtn}
              >
                <Minus color={palette.text} size={16} />
              </Pressable>
              <Text style={styles.countText}>{questionCount}</Text>
              <Pressable
                onPress={() => setQuestionCount(Math.min(30, questionCount + 5))}
                style={styles.countBtn}
              >
                <Plus color={palette.text} size={16} />
              </Pressable>
            </View>
          </View>

          {/* Topic Selector */}
          <Text style={styles.inputLabel}>Chủ đề từ vựng</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
            <View style={styles.topicRow}>
              {topics.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <Pressable
                    key={topic}
                    onPress={() => setSelectedTopic(topic)}
                    style={[styles.topicChip, isSelected && styles.topicChipActive]}
                  >
                    <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>
                      {topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Main Action Button */}
          <Pressable onPress={handleStartQuiz} style={styles.startBtn}>
            <Text style={styles.startBtnText}>Tạo bài thi tùy chỉnh</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  headerBar: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: palette.primary,
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  zapIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 13,
    fontFamily: font.family,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
    lineHeight: 18,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    gap: 10,
  },
  typeCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  typeLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  typeLabelSelected: {
    color: palette.primary,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
  },
  counterTitle: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  counterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    minWidth: 24,
    textAlign: 'center',
  },
  topicScroll: {
    marginBottom: 28,
  },
  topicRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
  },
  topicChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  topicText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
  topicTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    fontSize: 15,
    fontFamily: font.family,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
