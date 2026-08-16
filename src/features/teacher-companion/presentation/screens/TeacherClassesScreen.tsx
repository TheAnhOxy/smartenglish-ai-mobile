import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTeacherClasses } from '../../application/useTeacherCompanion';
import { useRouter } from 'expo-router';

export const TeacherClassesScreen = () => {
  const router = useRouter();
  const { data: classes, isLoading, refetch } = useTeacherClasses();

  return (
    <View className="flex-1 bg-surface px-6 pt-14">
      {/* Header Teacher Companion - Deep Teal Theme */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-secondary">Lớp Học Của Tôi</Text>
          <Text className="text-xs font-semibold text-neutralGray mt-0.5">
            Teacher Companion Mode (Read-Only)
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-secondary/10 justify-center items-center">
          <Text className="text-lg">👩‍🏫</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0F7173" size="large" />
        </View>
      ) : (
        <FlatList
          data={classes || []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(teacher-companion)/classes/${item.id}` as any)}
              className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm active:bg-gray-50"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-bold text-neutralInk flex-1 mr-2">{item.name}</Text>
                <View className="bg-secondary/10 px-2.5 py-1 rounded-full">
                  <Text className="text-xs font-bold text-secondary">{item.cefr_target}</Text>
                </View>
              </View>

              <Text className="text-xs text-neutralGray mb-4 line-clamp-2">{item.description}</Text>

              <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs text-neutralGray">Sĩ số:</Text>
                  <Text className="text-xs font-bold text-neutralInk">24/{item.max_students}</Text>
                </View>

                <View className="flex-row items-center gap-1 bg-warning/10 px-2.5 py-1 rounded-full">
                  <Text className="text-[10px] font-bold text-warning">2 bài tập sắp đến hạn</Text>
                </View>
              </View>

              <Text className="text-[10px] italic text-neutralGray text-right mt-2">
                Chạm để xem chi tiết — chỉnh sửa trên Web Portal
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};
