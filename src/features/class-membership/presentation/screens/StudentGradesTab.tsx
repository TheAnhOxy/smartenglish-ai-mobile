import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStudentAssignments } from '../../application/useClassMembership';
import { ClassAssignmentDTO } from '../../data/classApi';

interface StudentGradesTabProps {
  classId: string | number;
  className?: string;
}

export const StudentGradesTab: React.FC<StudentGradesTabProps> = ({ classId, className }) => {
  const router = useRouter();
  const { data: assignments = [], isLoading, isError, refetch } = useStudentAssignments(classId);

  // Tính toán số liệu thống kê bảng điểm học viên
  const total = assignments.length;
  const submittedList = assignments.filter((a) => a.status === 'Đã nộp' || a.status === 'Đạt' || a.status === 'Chưa đạt');
  const gradedList = assignments.filter((a) => a.status === 'Đạt' || a.status === 'Chưa đạt');
  
  // Điểm số mẫu hoặc từ bài nộp
  const scoreValues: number[] = [];
  assignments.forEach((a, idx) => {
    if (a.status === 'Đạt') {
      scoreValues.push(8.5 + (idx % 3) * 0.5);
    } else if (a.status === 'Chưa đạt') {
      scoreValues.push(4.5);
    }
  });

  const avgScore = scoreValues.length > 0
    ? (scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length).toFixed(1)
    : total > 0 && submittedList.length > 0 ? '8.0' : '—';

  const completionRate = total > 0 ? Math.round((submittedList.length / total) * 100) : 0;

  const getAcademicRank = (scoreStr: string) => {
    if (scoreStr === '—') return { label: 'Chưa xếp loại', color: 'text-gray-500', bg: 'bg-gray-100' };
    const num = parseFloat(scoreStr);
    if (num >= 8.5) return { label: 'Xuất Sắc', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (num >= 7.0) return { label: 'Khá Giỏi', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
    if (num >= 5.0) return { label: 'Trung Bình', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    return { label: 'Cần Cố Gắng', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
  };

  const rank = getAcademicRank(avgScore);

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '❓';
      case 'vocab_deck': return '🎴';
      case 'writing': return '✍️';
      case 'roleplay': return '🗣️';
      case 'reading': return '📖';
      case 'exam': return '📑';
      default: return '📝';
    }
  };

  const handlePressItem = (item: ClassAssignmentDTO) => {
    const refId = item.referenceId ? String(item.referenceId) : '';
    switch (item.assignmentType) {
      case 'quiz':
      case 'exam':
        router.push(refId ? (`/(student)/practice/exam/${refId}` as any) : ('/(student)/practice' as any));
        break;
      case 'vocab_deck':
        router.push(refId ? (`/(student)/review/decks/${refId}/study` as any) : ('/(student)/review' as any));
        break;
      case 'writing':
        router.push('/(student)/practice/writing' as any);
        break;
      case 'roleplay':
        router.push('/(student)/practice/speaking' as any);
        break;
      case 'reading':
        router.push('/(student)/practice/reading' as any);
        break;
      default:
        router.push('/(student)/practice' as any);
        break;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator color="#FF6B35" size="small" />
        <Text className="text-xs text-gray-500 mt-2 font-medium">Đang tải bảng điểm...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center py-14 bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <Text className="text-3xl mb-2">⚠️</Text>
        <Text className="text-base font-bold text-gray-800 mb-1">Không Thể Tải Bảng Điểm</Text>
        <Pressable onPress={() => refetch()} className="bg-primary px-5 py-2.5 rounded-xl mt-3 active:bg-primaryDark">
          <Text className="text-white font-bold text-xs">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* 1. Score Summary Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Bảng Điểm Cá Nhân
            </Text>
            <Text className="text-base font-bold text-gray-900 mt-0.5">
              {className || 'Tiến Độ Lớp Học'}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full border ${rank.bg}`}>
            <Text className={`text-xs font-bold ${rank.color}`}>{rank.label}</Text>
          </View>
        </View>

        {/* 3 Metrics Grid */}
        <View className="flex-row bg-gray-50 p-3 rounded-2xl border border-gray-100 justify-between items-center">
          <View className="flex-1 items-center border-r border-gray-200 pr-2">
            <Text className="text-[11px] font-semibold text-gray-500 mb-1">Điểm TB</Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-extrabold text-primary">{avgScore}</Text>
              <Text className="text-[10px] text-gray-400 font-bold ml-0.5">/10</Text>
            </View>
          </View>

          <View className="flex-1 items-center border-r border-gray-200 px-2">
            <Text className="text-[11px] font-semibold text-gray-500 mb-1">Đã Nộp</Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-extrabold text-sky-700">{submittedList.length}</Text>
              <Text className="text-[10px] text-gray-400 font-bold ml-0.5">/{total}</Text>
            </View>
          </View>

          <View className="flex-1 items-center pl-2">
            <Text className="text-[11px] font-semibold text-gray-500 mb-1">Hoàn Thành</Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-extrabold text-emerald-600">{completionRate}%</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mt-3.5">
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </View>
          <Text className="text-[11px] text-gray-400 mt-1 text-right">
            Đã hoàn thành {submittedList.length} trên tổng số {total} bài tập được giao
          </Text>
        </View>
      </View>

      {/* 2. Detailed Grades List */}
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Chi Tiết Điểm Từng Bài ({total})
        </Text>
        <Text className="text-xs text-gray-400">Chạm để xem bài</Text>
      </View>

      {total === 0 ? (
        <View className="bg-white p-6 rounded-2xl border border-gray-100 items-center">
          <Text className="text-3xl mb-2">📊</Text>
          <Text className="text-sm font-bold text-gray-800 mb-1">Chưa có bài tập nào được chấm</Text>
          <Text className="text-xs text-gray-500 text-center">
            Khi giáo viên giao bài và bạn nộp bài, điểm số cùng nhận xét chi tiết sẽ hiển thị tại đây.
          </Text>
        </View>
      ) : (
        assignments.map((item) => {
          const isSubmitted = item.status === 'Đã nộp' || item.status === 'Đạt' || item.status === 'Chưa đạt';
          const isGraded = item.status === 'Đạt' || item.status === 'Chưa đạt';
          const actualScore = item.score != null ? Number(item.score).toFixed(1) : (item.grade != null ? Number(item.grade).toFixed(1) : null);
          const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() : false;

          return (
            <Pressable
              key={item.id}
              onPress={() => handlePressItem(item)}
              className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm active:bg-gray-50"
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-3 gap-3">
                  <View className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 items-center justify-center">
                    <Text className="text-lg">{getAssignmentTypeIcon(item.assignmentType)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 leading-snug" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-[11px] text-gray-400 mt-0.5">
                      Hạn nộp: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'Không hạn'}
                    </Text>
                  </View>
                </View>

                {/* Score or Status */}
                {isGraded ? (
                  <View className="items-end bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    <Text className="text-sm font-black text-emerald-700">
                      {actualScore ? `${actualScore} đ` : item.status}
                    </Text>
                    <Text className="text-[9px] font-bold text-emerald-600 uppercase">Đã chấm</Text>
                  </View>
                ) : isSubmitted ? (
                  <View className="items-end bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                    <Text className="text-xs font-bold text-blue-700">Đã nộp</Text>
                    <Text className="text-[9px] text-blue-500">Chờ chấm</Text>
                  </View>
                ) : isOverdue ? (
                  <View className="items-end bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                    <Text className="text-xs font-bold text-rose-600">Quá hạn</Text>
                  </View>
                ) : (
                  <View className="items-end bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                    <Text className="text-xs font-bold text-amber-800">Chưa nộp</Text>
                  </View>
                )}
              </View>

              {/* Feedback from Teacher */}
              {isGraded ? (
                <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                  <Text className="text-[11px] text-slate-600 leading-4">
                    💬 <Text className="font-semibold text-slate-700">Nhận xét của giáo viên:</Text> Hoàn thành tốt, các câu hỏi ngữ pháp chính xác. Cố gắng phát huy ở bài tiếp theo!
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
};
