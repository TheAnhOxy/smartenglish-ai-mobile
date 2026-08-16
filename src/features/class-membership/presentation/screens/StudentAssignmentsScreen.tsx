import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useStudentAssignments } from '../../application/useClassMembership';
import { Assignment } from '@/src/core/types/schema';
import { MOCK_SUBMISSIONS } from '@/src/core/data/mockData';
import { useRouter } from 'expo-router';

interface StudentAssignmentsScreenProps {
  classId: string;
}

export const StudentAssignmentsScreen: React.FC<StudentAssignmentsScreenProps> = ({ classId }) => {
  const { data: assignments, isLoading } = useStudentAssignments(classId);
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
      default:
        return '📝';
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = MOCK_SUBMISSIONS.find((s) => s.assignment_id === assignmentId);
    return sub ? sub.status : 'Chưa làm';
  };

  const handlePressAssignment = (item: Assignment) => {
    // Route to actual feature route based on assignment_type
    switch (item.assignment_type) {
      case 'quiz':
        router.push(`/(student)/practice/quiz/${item.reference_id}` as any);
        break;
      case 'vocab_deck':
        router.push(`/(student)/review/decks/${item.reference_id}/study` as any);
        break;
      case 'writing':
        router.push(`/(student)/practice/writing` as any);
        break;
      case 'roleplay':
        router.push(`/(student)/practice/speaking` as any);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator color="#FF6B35" size="small" />
      </View>
    );
  }

  return (
    <FlatList
      data={assignments || []}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const status = getSubmissionStatus(item.id);
        const isOverdue = new Date(item.due_date) < new Date();

        return (
          <Pressable
            onPress={() => handlePressAssignment(item)}
            className="bg-cardWhite p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm active:bg-gray-50 flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1 mr-3 gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface items-center justify-center">
                <Text className="text-xl">{getAssignmentIcon(item.assignment_type)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutralInk mb-0.5">{item.title}</Text>
                <Text
                  className={`text-[10px] font-semibold ${
                    isOverdue && status === 'Chưa làm' ? 'text-error font-bold' : 'text-neutralGray'
                  }`}
                >
                  {isOverdue && status === 'Chưa làm'
                    ? '⚠️ Quá Hạn Nộp'
                    : `Hạn: ${new Date(item.due_date).toLocaleDateString()}`}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className={`px-3 py-1 rounded-full ${
                status === 'Đạt'
                  ? 'bg-success/10 border border-success/30'
                  : status === 'Đã nộp'
                  ? 'bg-secondary/10 border border-secondary/30'
                  : 'bg-primary/10 border border-primary/30'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  status === 'Đạt' ? 'text-success' : status === 'Đã nộp' ? 'text-secondary' : 'text-primary'
                }`}
              >
                {status}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
};
