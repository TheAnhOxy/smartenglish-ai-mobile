import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePassageQuery } from '@/src/features/reading-listening/application/useReadingListening';
import { QuickWordLookupModal } from '@/src/features/flashcard-srs/presentation/screens/QuickWordLookupModal';
import { AssignmentSubmitBanner } from '@/src/features/class-membership/presentation/components/AssignmentSubmitBanner';
import { SkillQuestionsPanel } from '@/src/features/reading-listening/presentation/components/SkillQuestionsPanel';
import { AppColors } from '@/src/core/theme/colors';

export default function ReadingPassageScreen() {
  const { passageId } = useLocalSearchParams<{ passageId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: passage, isLoading, isError, refetch } = usePassageQuery(passageId || '');
  const [showTranslate, setShowTranslate] = useState(false);
  const [showDictLookup, setShowDictLookup] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center dark:bg-darkBg">
        <ActivityIndicator color={AppColors.primary} size="large" />
      </View>
    );
  }

  if (isError || !passage) {
    return (
      <View className="flex-1 bg-surface justify-center items-center px-6 dark:bg-darkBg">
        <Text className="text-base font-bold text-neutralInk mb-2 dark:text-darkInk">Không thể tải bài đọc</Text>
        <Pressable onPress={() => refetch()} className="bg-primary px-5 py-3 rounded-xl">
          <Text className="text-white font-bold">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-darkBg" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={8}>
          <Text className="text-primary font-bold text-sm">← Bài đọc hiểu</Text>
        </Pressable>

        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xl font-bold text-neutralInk flex-1 mr-2 dark:text-darkInk">{passage.title}</Text>
          <View className="bg-secondary/20 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-secondary">{passage.cefr_level}</Text>
          </View>
        </View>
        {passage.content_vi ? (
          <Text className="text-sm text-neutralGray mb-3 dark:text-darkMuted">{passage.content_vi}</Text>
        ) : null}

        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => setShowTranslate(!showTranslate)}
            className="bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full"
          >
            <Text className="text-xs font-bold text-primary">{showTranslate ? 'Ẩn từ khoá' : 'Từ khoá trong bài'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDictLookup(true)}
            className="bg-secondary/10 border border-secondary/30 px-3 py-1.5 rounded-full"
          >
            <Text className="text-xs font-bold text-secondary">Tra từ</Text>
          </Pressable>
        </View>

        <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 dark:bg-darkCard dark:border-darkLine">
          <Text className="text-base text-neutralInk leading-7 font-medium dark:text-darkInk">{passage.content_en}</Text>
        </View>

        {showTranslate && passage.key_vocabulary && passage.key_vocabulary.length > 0 ? (
          <View className="bg-surface p-4 rounded-xl border border-gray-200 border-dashed mb-4 dark:bg-darkBg dark:border-darkLine">
            {passage.key_vocabulary.map((v) => (
              <Text key={v.word} className="text-sm text-neutralInk leading-6 dark:text-darkInk">
                <Text className="font-bold">{v.word}</Text>
                {v.ipaUs ? ` ${v.ipaUs}` : ''} — {v.meaningVi}
              </Text>
            ))}
          </View>
        ) : null}

        <SkillQuestionsPanel
          kind="READING"
          contentId={passage.id}
          title={passage.title}
          questions={passage.questions}
        />

        <View className="mt-4 -mx-4">
          <AssignmentSubmitBanner referenceId={passageId} />
        </View>
      </ScrollView>

      <QuickWordLookupModal visible={showDictLookup} onClose={() => setShowDictLookup(false)} />
    </View>
  );
}
