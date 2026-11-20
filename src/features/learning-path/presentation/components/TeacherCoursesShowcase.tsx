import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { dsText } from '@/src/components/ds';
import { ds, dsFont, dsSize } from '@/src/theme/ds';
import type { TeacherCourse } from '../../data/teacherCourseApi';
import { useTeacherCoursesForLearner } from '../../application/useTeacherCourses';
import { TeacherCourseCard } from './TeacherCourseCard';

const MAX_ITEMS = 8;

interface Row {
  course: TeacherCourse;
  matched: boolean;
}

/**
 * Dải khóa học của giáo viên: khóa đúng trình độ học viên (theo bài kiểm tra đầu vào) đứng đầu,
 * sau đó tới các trình độ khác. Không có khóa nào thì ẩn hẳn.
 */
export const TeacherCoursesShowcase: React.FC = () => {
  const router = useRouter();
  const { matched, others, level, fromPlacement, isLoading, isError } = useTeacherCoursesForLearner();

  const rows = useMemo<Row[]>(
    () =>
      [...matched.map((course) => ({ course, matched: true })), ...others.map((course) => ({ course, matched: false }))].slice(
        0,
        MAX_ITEMS,
      ),
    [matched, others],
  );

  const openCourse = useCallback(
    (course: TeacherCourse) => router.push(`/(student)/courses/${course.id}` as never),
    [router],
  );

  const renderItem = useCallback<ListRenderItem<Row>>(
    ({ item }) => <TeacherCourseCard course={item.course} matched={item.matched} onPress={openCourse} style={s.card} />,
    [openCourse],
  );

  if (isLoading || isError || rows.length === 0) return null;

  const title = level && matched.length > 0 ? `Khóa học cho trình độ ${level}` : 'Khóa học từ giáo viên';
  const hint =
    level && matched.length > 0
      ? `${matched.length} khóa học đúng trình độ ${fromPlacement ? 'bài kiểm tra đầu vào' : 'hiện tại'} của bạn`
      : 'Học sâu hơn cùng giáo viên SmartEnglish';

  return (
    <View style={s.section}>
      <View style={s.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={dsText.h2}>{title}</Text>
          <Text style={s.hint}>{hint}</Text>
        </View>
        <Pressable onPress={() => router.push('/(student)/courses' as never)} hitSlop={8} accessibilityLabel="Xem tất cả khóa học">
          <Text style={s.seeAll}>Xem tất cả</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={rows}
        keyExtractor={(r) => r.course.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
      />
    </View>
  );
};

const s = StyleSheet.create({
  section: { gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  hint: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, marginTop: 2 },
  seeAll: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.btn },
  list: { gap: 12, paddingRight: 4, paddingBottom: 4 },
  card: { width: 188 },
});
