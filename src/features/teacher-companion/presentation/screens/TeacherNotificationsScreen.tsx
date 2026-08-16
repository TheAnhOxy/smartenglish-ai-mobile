import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { NotificationItem } from '@/src/core/types/schema';

const MOCK_TEACHER_NOTIFS: NotificationItem[] = [
  {
    id: 'tn-1',
    user_id: 'teacher-1',
    title: '⚠️ Cảnh Báo Nguy Cơ Bỏ Học',
    body: 'Học viên Lê Thị Thu Hà (Lớp TOEIC 750+) chưa đăng nhập 9 ngày liên tiếp.',
    notification_type: 'student_at_risk',
    is_read: false,
    created_at: '2026-08-16T08:30:00Z'
  },
  {
    id: 'tn-2',
    user_id: 'teacher-1',
    title: 'Bài Tập Được Nộp 📝',
    body: 'Học viên Nguyễn Văn Học Viên vừa hoàn thành bài tập "Viết Email Xin Lỗi Khách Hàng".',
    notification_type: 'assignment_submitted',
    is_read: true,
    created_at: '2026-08-15T14:20:00Z'
  }
];

export const TeacherNotificationsScreen = () => {
  return (
    <View className="flex-1 bg-surface px-6 pt-14">
      <Text className="text-2xl font-bold text-secondary mb-1">Thông Báo Giáo Viên</Text>
      <Text className="text-xs text-neutralGray mb-6">Cập nhật tiến độ nộp bài & cảnh báo học viên nguy cơ</Text>

      <FlatList
        data={MOCK_TEACHER_NOTIFS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            className={`p-4 rounded-2xl border mb-3 ${
              item.is_read ? 'bg-cardWhite border-gray-100' : 'bg-secondary/5 border-secondary/20 shadow-sm'
            }`}
          >
            <Text className="text-sm font-bold text-neutralInk mb-1">{item.title}</Text>
            <Text className="text-xs text-neutralGray leading-5 mb-2">{item.body}</Text>
            <Text className="text-[10px] text-neutralGray text-right">{new Date(item.created_at).toLocaleTimeString()}</Text>
          </View>
        )}
      />
    </View>
  );
};
