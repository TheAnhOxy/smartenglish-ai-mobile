import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StatusBar, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StudentAssignmentsScreen } from './StudentAssignmentsScreen';
import {
  useClassDetail,
  useClassMembers,
  useCourseCurriculum,
} from '../../application/useClassMembership';

export const StudentClassDetailScreen = () => {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'assignments' | 'members'>('curriculum');

  const { data: currentClass, isLoading: isClassLoading } = useClassDetail(classId || '1');
  const { data: members = [], isLoading: isMembersLoading } = useClassMembers(classId || '1');
  const { data: curriculum = [], isLoading: isCurriculumLoading } = useCourseCurriculum(
    currentClass?.courseId ? Number(currentClass.courseId) : undefined
  );

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'READING':
        return '📖';
      case 'LISTENING':
        return '🎧';
      case 'GRAMMAR':
        return '📐';
      case 'SPEAKING':
        return '🗣️';
      case 'VOCABULARY':
      default:
        return '🎴';
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'READING':
        return 'Đọc hiểu Reading';
      case 'LISTENING':
        return 'Luyện nghe Listening';
      case 'GRAMMAR':
        return 'Ngữ pháp Grammar';
      case 'SPEAKING':
        return 'Luyện nói Speaking';
      case 'VOCABULARY':
      default:
        return 'Từ vựng Vocabulary';
    }
  };

  if (isClassLoading && !currentClass) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="small" />
        <Text className="text-xs text-gray-500 mt-2 font-medium">Đang tải...</Text>
      </View>
    );
  }

  const teacherMembers = members.filter((m) => m.role === 'TEACHER');
  const studentMembers = members.filter((m) => m.role !== 'TEACHER');

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation */}
      <View className="bg-white border-b border-gray-100 pt-14 pb-3 px-5">
        <View className="flex-row justify-between items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center border border-gray-200 active:bg-gray-100"
          >
            <Text className="text-gray-700 font-bold text-base">←</Text>
          </Pressable>

          <View className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-primary">
              Mục tiêu: {currentClass?.cefrTarget || 'B1'}
            </Text>
          </View>
        </View>

        {/* Class Title & Teacher */}
        <Text className="text-xl font-bold text-gray-900 leading-tight mb-1">
          {currentClass?.name || 'Chi Tiết Lớp Học'}
        </Text>
        <View className="flex-row items-center gap-2 flex-wrap mb-3">
          <Text className="text-xs text-gray-600 font-medium">
            👩‍🏫 {currentClass?.teacherName || 'Giáo viên'}
          </Text>
          <Text className="text-gray-300">•</Text>
          <Text className="text-xs font-mono text-gray-500">Mã Lớp: {currentClass?.joinCode}</Text>
          <Text className="text-gray-300">•</Text>
          <Text className="text-xs text-emerald-600 font-semibold">● Đang hoạt động</Text>
        </View>

        {/* 3 Tabs Bar */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          <Pressable
            onPress={() => setActiveTab('curriculum')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'curriculum' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                activeTab === 'curriculum' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              Giáo trình
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('assignments')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'assignments' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                activeTab === 'assignments' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              Bài tập
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('members')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'members' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                activeTab === 'members' ? 'text-primary' : 'text-gray-500'
              }`}
            >
              Thành viên
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tab Body */}
      <View className="flex-1 p-4">
        {/* TAB 1: CURRICULUM */}
        {activeTab === 'curriculum' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Attached Course Banner */}
            <View className="bg-gradient-to-r from-sky-50 to-indigo-50 bg-sky-50 p-4 rounded-2xl border border-sky-200 mb-4 shadow-xs">
              <View className="flex-row items-center gap-2 mb-1.5">
                <Text className="text-lg">📚</Text>
                <Text className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                  Khóa Học Chính Thức Của Lớp
                </Text>
              </View>
              <Text className="text-base font-bold text-sky-950 mb-1">
                {currentClass?.courseTitle || 'IELTS Master 6.5+ Comprehensive'}
              </Text>
              <Text className="text-xs text-sky-800 leading-5">
                Giáo trình chuẩn được giáo viên chỉ định làm lộ trình học tập xuyên suốt. Học viên học tuần tự theo từng bài học bên dưới.
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3 px-1">
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Danh Sách Bài Học ({curriculum.length})
              </Text>
              <Text className="text-xs text-gray-400">Chạm để vào bài</Text>
            </View>

            {isCurriculumLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator color="#FF6B35" size="small" />
                <Text className="text-xs text-gray-500 mt-2 font-medium">Đang tải...</Text>
              </View>
            ) : curriculum.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl border border-gray-100 items-center">
                <Text className="text-3xl mb-2">📖</Text>
                <Text className="text-sm font-bold text-gray-800 mb-1">Khóa học chưa có bài giảng</Text>
                <Text className="text-xs text-gray-500 text-center">
                  Giáo viên đang cập nhật các chương bài học cho khóa học này.
                </Text>
              </View>
            ) : (
              curriculum.map((lesson, idx) => (
                <Pressable
                  key={lesson.id}
                  onPress={() => router.push(`/(student)/lesson/${lesson.id}` as any)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-xs active:bg-gray-50 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 mr-3 gap-3">
                    <View className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 items-center justify-center">
                      <Text className="text-lg">{getLessonTypeIcon(lesson.lessonType)}</Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 mb-0.5">
                        <Text className="text-[10px] font-bold text-sky-700 uppercase bg-sky-50 px-1.5 py-0.5 rounded">
                          Bài {lesson.orderNumber || idx + 1}
                        </Text>
                        <Text className="text-[10px] font-semibold text-gray-400">
                          {getLessonTypeLabel(lesson.lessonType)}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-gray-900 leading-snug" numberOfLines={1}>
                        {lesson.titleVi}
                      </Text>
                      {lesson.descriptionVi ? (
                        <Text className="text-xs text-gray-500 leading-4 mt-0.5" numberOfLines={1}>
                          {lesson.descriptionVi}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-xl">
                    <Text className="text-xs font-bold text-primary">Học</Text>
                    <Text className="text-xs text-primary">→</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <StudentAssignmentsScreen classId={classId || '1'} />
        )}

        {/* TAB 3: MEMBERS */}
        {activeTab === 'members' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Teacher section */}
            <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 px-1">
              Giảng Viên Phụ Trách
            </Text>
            <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-5 shadow-xs">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 items-center justify-center">
                  <Text className="text-2xl">👩‍🏫</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className="text-sm font-bold text-gray-900">
                      {currentClass?.teacherName || 'Cô Trần Mai Hương'}
                    </Text>
                    <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-primary">Giáo Viên Chính</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500">Trực tiếp giao bài tập & chấm điểm</Text>
                </View>
              </View>
            </View>

            {/* Students section */}
            <View className="flex-row justify-between items-center mb-2 px-1">
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Học Viên Trong Lớp ({studentMembers.length > 0 ? studentMembers.length : currentClass?.studentCount || 1})
              </Text>
              <Text className="text-xs text-gray-400">
                Sĩ số tối đa: {currentClass?.maxStudents || 35}
              </Text>
            </View>

            {isMembersLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#FF6B35" size="small" />
              </View>
            ) : (
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs divide-y divide-gray-100">
                {(studentMembers.length > 0
                  ? studentMembers
                  : [
                      {
                        id: 1,
                        userId: 1,
                        userName: 'Bạn (Học viên hiện tại)',
                        role: 'STUDENT' as const,
                        status: 'ACTIVE',
                        joinedAt: '2026-10-05',
                      },
                    ]
                ).map((member, idx) => (
                  <View key={member.id || idx} className="p-3.5 flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                        <Text className="text-xs font-bold text-gray-600">
                          {member.userName.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-gray-800">{member.userName}</Text>
                        <Text className="text-[10px] text-gray-400">
                          Tham gia: {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <Text className="text-[10px] font-bold text-emerald-700">Đang học</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
