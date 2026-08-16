import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWritingAnalysisMutation } from '../../application/useAiWriting';

export const WritingEditorScreen = () => {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();

  const [text, setText] = useState(
    'By the time the project manager arrived, the engineering team has acompilsh all critical milestones.'
  );

  const { mutate: analyzeWriting, isPending } = useWritingAnalysisMutation();

  const handleAnalyze = () => {
    analyzeWriting(
      { text, type: type || 'essay' },
      {
        onSuccess: (data) => {
          router.push({
            pathname: '/(student)/practice/writing/analysis' as any,
            params: { analysisData: JSON.stringify(data), originalText: text }
          });
        }
      }
    );
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-10">
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary font-bold text-sm">← Đổi Loại Bài</Text>
          </Pressable>
          <Text className="text-xs font-bold text-neutralGray">Số từ: {wordCount} từ</Text>
        </View>

        <Text className="text-xl font-bold text-neutralInk mb-2">Soạn Thảo Bài Viết</Text>
        <Text className="text-xs text-neutralGray mb-4">Loại bài: {type || 'essay'} • Auto-save bật</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          placeholder="Nhập đoạn văn bản hoặc bài luận bằng tiếng Anh tại đây..."
          className="flex-1 bg-cardWhite p-4 rounded-2xl border border-gray-200 text-neutralInk text-sm leading-6"
        />
      </View>

      <Pressable
        onPress={handleAnalyze}
        disabled={isPending || wordCount < 3}
        className={`py-4 rounded-xl items-center shadow-md mt-4 ${
          wordCount >= 3 && !isPending ? 'bg-primary active:bg-primaryDark' : 'bg-gray-300'
        }`}
      >
        {isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text className="text-white font-bold text-lg">Chấm Bài Viết Với AI ✨</Text>
        )}
      </Pressable>
    </View>
  );
};
