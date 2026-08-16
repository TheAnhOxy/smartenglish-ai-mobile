import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const WritingAnalysisScreen = () => {
  const router = useRouter();
  const { analysisData, originalText } = useLocalSearchParams<{ analysisData: string; originalText: string }>();

  const parsed = analysisData ? JSON.parse(analysisData) : null;
  const errors = parsed?.errors || [];
  const scores = parsed?.scoring_detail;

  const [acceptedErrorIds, setAcceptedErrorIds] = useState<string[]>([]);

  const toggleAccept = (errId: string) => {
    if (acceptedErrorIds.includes(errId)) {
      setAcceptedErrorIds(acceptedErrorIds.filter((id) => id !== errId));
    } else {
      setAcceptedErrorIds([...acceptedErrorIds, errId]);
    }
  };

  return (
    <View className="flex-1 bg-surface pt-14 px-6 justify-between pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-bold text-sm">← Sửa Lại Bài</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">Kết Quả Phân Tích Bài Viết</Text>
        <Text className="text-xs text-neutralGray mb-6">Đã phát hiện {errors.length} lỗi cần cải thiện</Text>

        {/* IELTS Scores Breakdown */}
        {scores && (
          <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-6 shadow-sm">
            <Text className="text-sm font-bold text-neutralInk mb-3">Điểm Chi Tiết Tiêu Chí IELTS</Text>
            <View className="flex-row justify-between gap-2">
              <View className="flex-1 bg-surface p-3 rounded-xl items-center">
                <Text className="text-[10px] text-neutralGray font-semibold mb-1">Task</Text>
                <Text className="text-base font-bold text-primary">{scores.task_achievement}</Text>
              </View>
              <View className="flex-1 bg-surface p-3 rounded-xl items-center">
                <Text className="text-[10px] text-neutralGray font-semibold mb-1">Coherence</Text>
                <Text className="text-base font-bold text-secondary">{scores.coherence_cohesion}</Text>
              </View>
              <View className="flex-1 bg-surface p-3 rounded-xl items-center">
                <Text className="text-[10px] text-neutralGray font-semibold mb-1">Lexical</Text>
                <Text className="text-base font-bold text-success">{scores.lexical_resource}</Text>
              </View>
              <View className="flex-1 bg-surface p-3 rounded-xl items-center">
                <Text className="text-[10px] text-neutralGray font-semibold mb-1">Grammar</Text>
                <Text className="text-base font-bold text-warning">{scores.grammatical_range}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Detailed Error Cards */}
        <Text className="text-sm font-bold text-neutralInk mb-3">Danh Sách Lỗi & Đề Xuất Sửa</Text>
        <View className="gap-3 mb-6">
          {errors.map((err: any) => {
            const isAccepted = acceptedErrorIds.includes(err.error_id);
            return (
              <View
                key={err.error_id}
                className={`p-4 rounded-2xl border ${
                  err.type === 'spelling'
                    ? 'bg-error/5 border-error/20'
                    : err.type === 'grammar'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-secondary/5 border-secondary/20'
                }`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className={`text-xs uppercase font-bold ${
                      err.type === 'spelling'
                        ? 'text-error'
                        : err.type === 'grammar'
                        ? 'text-warning'
                        : 'text-secondary'
                    }`}
                  >
                    Lỗi {err.type}
                  </Text>

                  <Pressable
                    onPress={() => toggleAccept(err.error_id)}
                    className={`px-3 py-1 rounded-full border ${
                      isAccepted ? 'bg-success border-success' : 'bg-cardWhite border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isAccepted ? 'text-white' : 'text-neutralInk'}`}>
                      {isAccepted ? '✓ Đã Chấp Nhận' : 'Chấp Nhận Sửa'}
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-sm line-through text-error font-medium">{err.original}</Text>
                  <Text className="text-sm font-bold text-success">➔ {err.suggestion}</Text>
                </View>

                <Text className="text-xs text-neutralGray leading-5">{err.explanation_vi}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Button to Compare View */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(student)/practice/writing/compare' as any,
            params: {
              original: originalText,
              rewritten: parsed?.rewritten_text || ''
            }
          })
        }
        className="bg-primary py-3.5 rounded-xl items-center shadow-md active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-base">Xem So Sánh Bản Viết Lại AI 🔄</Text>
      </Pressable>
    </View>
  );
};
