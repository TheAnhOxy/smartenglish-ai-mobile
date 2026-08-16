import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeacherClassDetail } from '../../application/useTeacherCompanion';

export const TeacherClassDetailScreen = () => {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const { data, isLoading } = useTeacherClassDetail(classId || '');

  const handleOpenWebPortal = () => {
    Linking.openURL('https://smartenglish.ai/teacher/dashboard');
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator color="#0F7173" size="large" />
      </View>
    );
  }

  const { classInfo, students } = data;

  return (
    <View className="flex-1 bg-surface pt-14 justify-between">
      <ScrollView className="px-6">
        {/* Header */}
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-secondary font-bold text-sm">← Quay lại danh sách lớp</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-neutralInk mb-1">{classInfo.name}</Text>
        <Text className="text-xs text-neutralGray mb-6">Mã Lớp: {classInfo.join_code} • Target: {classInfo.cefr_target}</Text>

        {/* 3-Column Read-Only Progress Table */}
        <View className="bg-cardWhite rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
          {/* Table Header */}
          <View className="flex-row bg-gray-50 p-3.5 border-b border-gray-200">
            <Text className="flex-2 text-xs font-bold text-neutralInk">Học Viên</Text>
            <Text className="flex-2 text-xs font-bold text-neutralInk text-center">% Hoàn Thành</Text>
            <Text className="flex-1 text-xs font-bold text-neutralInk text-right">Cờ Cảnh Báo</Text>
          </View>

          {/* Table Rows */}
          {students.map((st) => (
            <View
              key={st.user_id}
              className={`flex-row items-center p-3.5 border-b border-gray-100 ${
                st.is_at_risk ? 'bg-error/5 border-l-4 border-l-error' : ''
              }`}
            >
              {/* Student Name */}
              <View className="flex-2 flex-row items-center gap-2">
                <Image source={{ uri: st.avatar_url }} className="w-8 h-8 rounded-full bg-gray-200" />
                <Text className="text-xs font-semibold text-neutralInk flex-1" numberOfLines={1}>
                  {st.display_name}
                </Text>
              </View>

              {/* Progress Bar Column */}
              <View className="flex-2 px-2 items-center">
                <Text className="text-[10px] font-bold text-neutralInk mb-1">{st.completion_rate}%</Text>
                <View className="h-1.5 bg-gray-100 rounded-full w-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${
                      st.completion_rate > 70 ? 'bg-success' : st.completion_rate > 40 ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${st.completion_rate}%` }}
                  />
                </View>
              </View>

              {/* Risk Flag Column */}
              <View className="flex-1 items-end">
                {st.is_at_risk ? (
                  <View className="bg-error/10 px-2 py-0.5 rounded-full border border-error/20">
                    <Text className="text-[10px] font-bold text-error">⚠️ {st.last_login_days_ago} ngày vắng</Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-success font-medium">Bình thường</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Web Portal CTA */}
      <View className="p-6 bg-cardWhite border-t border-gray-100">
        <Pressable
          onPress={handleOpenWebPortal}
          className="border border-secondary py-3.5 rounded-xl items-center active:bg-secondary/10"
        >
          <Text className="text-secondary font-bold text-base">Mở Web Portal Để Chấm Điểm & Giao Bài 🌐</Text>
        </Pressable>
      </View>
    </View>
  );
};
