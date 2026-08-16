import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StudentAssignmentsScreen } from './StudentAssignmentsScreen';
import { MOCK_CLASSES } from '@/src/core/data/mockData';

export const StudentClassDetailScreen = () => {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'assignments' | 'members'>('assignments');
  const [isPinned, setIsPinned] = useState(false);

  const currentClass = MOCK_CLASSES.find((c) => c.id === classId) || MOCK_CLASSES[0];
  const isAssistantTeacher = classId === 'class-102'; // Demo role assistant teacher

  return (
    <View className="flex-1 bg-surface pt-14 px-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary font-bold text-sm">← Lớp Học Của Tôi</Text>
        </Pressable>

        {/* Pin Class Announcement Button (Only Assistant Teacher) */}
        {isAssistantTeacher && (
          <Pressable
            onPress={() => setIsPinned(!isPinned)}
            className={`px-3 py-1.5 rounded-full border ${
              isPinned ? 'bg-primary/10 border-primary' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <Text className="text-xs font-bold text-primary">
              {isPinned ? '📌 Đã Ghim Thông Báo' : '📌 Ghim Thông Báo Lớp'}
            </Text>
          </Pressable>
        )}
      </View>

      <Text className="text-2xl font-bold text-neutralInk mb-1">{currentClass.name}</Text>
      <Text className="text-xs text-neutralGray mb-6">Mã Lớp: {currentClass.join_code} • Target: {currentClass.cefr_target}</Text>

      {/* Tabs Bar */}
      <View className="flex-row bg-gray-200 p-1 rounded-xl mb-6">
        <Pressable
          onPress={() => setActiveTab('assignments')}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            activeTab === 'assignments' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'assignments' ? 'text-primary' : 'text-neutralGray'}`}>
            Bài Tập Được Giao
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('members')}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            activeTab === 'members' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'members' ? 'text-primary' : 'text-neutralGray'}`}>
            Thành Viên Lớp
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'assignments' ? (
        <StudentAssignmentsScreen classId={classId || 'class-101'} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-cardWhite p-4 rounded-2xl border border-gray-100 gap-3">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-xs font-bold text-neutralInk">Cô Trần Mai Hương</Text>
              <Text className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">
                Giáo Viên Chính
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-xs font-bold text-neutralInk">Nguyễn Văn Học Viên (Bạn)</Text>
              <Text className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {isAssistantTeacher ? 'Trợ Giảng' : 'Học Viên'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-xs font-semibold text-neutralInk">Lê Thị Thu Hà</Text>
              <Text className="text-[10px] text-neutralGray">Học Viên</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};
