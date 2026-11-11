import React from 'react';
import { Text, View } from 'react-native';
import { isAssignmentOverdue } from '../../application/assignmentNavigation';
import type { ClassAssignmentDTO } from '../../data/classApi';

interface AssignmentStatusBadgeProps {
  item: ClassAssignmentDTO;
}

export const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({ item }) => {
  if (item.score != null) {
    const passed = item.status === 'Đạt';
    return (
      <View className={`items-end px-3 py-1 rounded-xl ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
        <Text className={`text-sm font-black ${passed ? 'text-success' : 'text-error'}`}>
          {item.score.toFixed(1)}
        </Text>
        <Text className={`text-[9px] font-bold uppercase ${passed ? 'text-success' : 'text-error'}`}>
          {item.status}
        </Text>
      </View>
    );
  }

  if (item.status === 'Đã nộp') {
    return (
      <View className="px-2.5 py-1 rounded-full bg-primary/10">
        <Text className="text-[11px] font-bold text-primary">Chờ chấm</Text>
      </View>
    );
  }

  if (isAssignmentOverdue(item)) {
    return (
      <View className="px-2.5 py-1 rounded-full bg-error/10">
        <Text className="text-[11px] font-bold text-error">Quá hạn</Text>
      </View>
    );
  }

  return (
    <View className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
      <Text className="text-[11px] font-bold text-neutralGray">Chưa nộp</Text>
    </View>
  );
};
