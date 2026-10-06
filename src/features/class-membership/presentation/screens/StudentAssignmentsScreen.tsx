import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useStudentAssignments } from '../../application/useClassMembership';
import { ClassAssignmentDTO } from '../../data/classApi';
import { useRouter } from 'expo-router';

interface StudentAssignmentsScreenProps {
  classId: string | number;
}

export const StudentAssignmentsScreen: React.FC<StudentAssignmentsScreenProps> = ({ classId }) => {
  const { data: assignments = [], isLoading, refetch } = useStudentAssignments(classId);
  const router = useRouter();

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return '❓';
      case 'vocab_deck':
        return '🎴';
      case 'writing':
        return '✍️';
      case 'roleplay':
        return '🗣️';
      case 'reading':
        return '📖';
      case 'exam':
        return '📑';
      default:
        return '📝';
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'Quiz trắc nghiệm';
      case 'vocab_deck':
        return 'Bộ Flashcard từ vựng';
      case 'writing':
        return 'Bài viết luận AI chấm';
      case 'roleplay':
        return 'Hội thoại AI Speaking';
      case 'reading':
        return 'Bài đọc hiểu Reading';
      case 'exam':
        return 'Đề thi chuẩn hóa';
      default:
        return 'Bài tập rèn luyện';
    }
  };

  const handlePressAssignment = (item: ClassAssignmentDTO) => {
    const refId = item.referenceId ? String(item.referenceId) : '';
    switch (item.assignmentType) {
      case 'quiz':
        router.push(refId ? (`/(student)/practice/quiz/${refId}` as any) : ('/(student)/practice' as any));
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
      case 'exam':
        router.push(refId ? (`/(student)/practice/exam/${refId}` as any) : ('/(student)/practice' as any));
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
        <Text className="text-xs text-gray-500 mt-2 font-medium">Đang tải...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={assignments}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      onRefresh={refetch}
      refreshing={isLoading}
      contentContainerStyle={{ paddingBottom: 80 }}
      ListEmptyComponent={() => (
        <View className="items-center py-14 bg-white rounded-2xl border border-gray-100 p-6 mx-1 shadow-xs">
          <Text className="text-4xl mb-3">📝</Text>
          <Text className="text-base font-bold text-gray-800 mb-1">Chưa Có Bài Tập Nào</Text>
          <Text className="text-xs text-gray-500 text-center leading-5 px-3">
            Giáo viên chưa giao bài tập cho lớp này. Bài tập trắc nghiệm, bài viết hoặc luyện nói sẽ xuất hiện ở đây khi được chỉ định.
          </Text>
        </View>
      )}
      renderItem={({ item }) => {
        const status = item.status || 'Chưa làm';
        const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() : false;

        return (
          <Pressable
            onPress={() => handlePressAssignment(item)}
            className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-xs active:bg-gray-50"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center flex-1 mr-3 gap-3">
                <View className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 items-center justify-center">
                  <Text className="text-xl">{getAssignmentIcon(item.assignmentType)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-primary mb-0.5">
                    {getAssignmentTypeLabel(item.assignmentType)}
                  </Text>
                  <Text className="text-sm font-bold text-gray-900 leading-snug" numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              <View
                className={`px-2.5 py-1 rounded-full ${
                  status === 'Đạt'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : status === 'Đã nộp'
                    ? 'bg-blue-50 border border-blue-200'
                    : isOverdue
                    ? 'bg-rose-50 border border-rose-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    status === 'Đạt'
                      ? 'text-emerald-700'
                      : status === 'Đã nộp'
                      ? 'text-blue-700'
                      : isOverdue
                      ? 'text-rose-600'
                      : 'text-amber-800'
                  }`}
                >
                  {isOverdue && status === 'Chưa làm' ? 'Quá hạn' : status}
                </Text>
              </View>
            </View>

            {item.instructions ? (
              <Text className="text-xs text-gray-500 mb-2.5 line-clamp-2 px-1" numberOfLines={2}>
                {item.instructions}
              </Text>
            ) : null}

            {/* Footer */}
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
              <Text
                className={`text-[11px] font-medium ${
                  isOverdue && status === 'Chưa làm' ? 'text-rose-600 font-semibold' : 'text-gray-400'
                }`}
              >
                ⏰ Hạn nộp:{' '}
                {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
              </Text>

              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-primary">Làm bài</Text>
                <Text className="text-xs text-primary">→</Text>
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
};
