import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraduationCap, RefreshCw } from 'lucide-react-native';
import { BackButton } from '@/src/core/components/BackButton';
import { FoxRunLoader } from '@/src/core/components/FoxRunLoader';
import { dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import type { TeacherCourse } from '../../data/teacherCourseApi';
import { useTeacherCoursesForLearner } from '../../application/useTeacherCourses';
import {
  LEVEL_FILTERS,
  coversLevel,
  defaultLevelFilter,
  filterByLevel,
  type LevelFilter,
} from '../../application/courseLevel';
import { TeacherCourseCard } from '../components/TeacherCourseCard';

type ListItem = { kind: 'header'; key: string; title: string } | { kind: 'row'; key: string; pair: TeacherCourse[] };

/** Ghép hai khóa một hàng cho lưới 2 cột, chèn tiêu đề nhóm. */
const buildItems = (groups: { title: string; courses: TeacherCourse[] }[]): ListItem[] => {
  const items: ListItem[] = [];
  for (const g of groups) {
    if (g.courses.length === 0) continue;
    items.push({ kind: 'header', key: `h-${g.title}`, title: g.title });
    for (let i = 0; i < g.courses.length; i += 2) {
      const pair = g.courses.slice(i, i + 2);
      items.push({ kind: 'row', key: `r-${pair.map((c) => c.id).join('-')}`, pair });
    }
  }
  return items;
};

export const TeacherCoursesScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matched, others, level, fromPlacement, isLoading, isError, refetch, isRefetching } =
    useTeacherCoursesForLearner();
  const [filter, setFilter] = useState<LevelFilter>(defaultLevelFilter(level));

  // Trình độ có thể về sau khi kế hoạch học tải xong → cập nhật bộ lọc mặc định một lần
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setFilter(defaultLevelFilter(level));
  }, [level, touched]);

  const items = useMemo(() => {
    if (filter === 'ALL') {
      return buildItems([
        { title: level ? `Đúng trình độ của bạn · ${level}` : 'Tất cả khóa học', courses: matched },
        { title: level ? 'Các trình độ khác' : '', courses: others },
      ]);
    }
    const all = [...matched, ...others];
    return buildItems([{ title: `Trình độ ${filter}`, courses: filterByLevel(all, filter) }]);
  }, [filter, matched, others, level]);

  const openCourse = useCallback(
    (course: TeacherCourse) => router.push(`/(student)/courses/${course.id}` as never),
    [router],
  );

  const renderItem = useCallback<ListRenderItem<ListItem>>(
    ({ item }) => {
      if (item.kind === 'header') {
        return item.title ? <Text style={s.groupTitle}>{item.title}</Text> : null;
      }
      return (
        <View style={s.row}>
          {item.pair.map((c) => (
            <TeacherCourseCard key={c.id} course={c} matched={coversLevel(c, level)} onPress={openCourse} style={s.cell} />
          ))}
          {item.pair.length === 1 ? <View style={s.cell} /> : null}
        </View>
      );
    },
    [level, openCourse],
  );

  const pick = (f: LevelFilter) => {
    setTouched(true);
    setFilter(f);
  };

  // Trình độ của học viên luôn đứng đầu thanh lọc
  const myFilter = level ? defaultLevelFilter(level) : null;
  const chips: LevelFilter[] = myFilter
    ? [myFilter, 'ALL', ...LEVEL_FILTERS.filter((l) => l !== myFilter)]
    : ['ALL', ...LEVEL_FILTERS];

  return (
    <View style={[s.root, { paddingTop: (insets.top || 16) + 4 }]}>
      <View style={s.header}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text style={dsText.h2}>Khóa học từ giáo viên</Text>
          <Text style={s.sub}>
            {level
              ? `Trình độ của bạn: ${level}${fromPlacement ? ' (theo bài kiểm tra đầu vào)' : ''}`
              : 'Làm bài kiểm tra đầu vào để được gợi ý đúng trình độ'}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipBar}>
        {chips.map((f) => {
          const active = filter === f;
          const mine = f === myFilter;
          return (
            <Pressable
              key={f}
              onPress={() => pick(f)}
              style={[s.chip, active && s.chipActive]}
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {f === 'ALL' ? 'Tất cả' : mine ? `${f} · của bạn` : f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={s.center}>
          <FoxRunLoader message="Đang tải khóa học..." />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Không tải được danh sách khóa học</Text>
          <Pressable onPress={() => refetch()} style={s.retry} accessibilityLabel="Thử lại">
            <RefreshCw size={16} color={ds.white} />
            <Text style={s.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <GraduationCap size={36} color={ds.faint} />
          <Text style={s.emptyTitle}>
            {filter === 'ALL' ? 'Chưa có khóa học nào từ giáo viên' : `Chưa có khóa học trình độ ${filter}`}
          </Text>
          {filter !== 'ALL' ? (
            <Pressable onPress={() => pick('ALL')} hitSlop={8}>
              <Text style={s.link}>Xem các trình độ khác</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={renderItem}
          contentContainerStyle={[s.list, { paddingBottom: (insets.bottom || 12) + 24 }]}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListFooterComponent={
            filter !== 'ALL' ? (
              <Pressable onPress={() => pick('ALL')} style={s.footer} hitSlop={8}>
                <Text style={s.link}>Xem khóa học các trình độ khác</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  sub: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted, marginTop: 2 },
  chipBar: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: dsRadius.full,
    backgroundColor: ds.card,
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  chipActive: { backgroundColor: ds.btn, borderColor: ds.btn },
  chipText: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.ink },
  chipTextActive: { color: ds.white },
  list: { paddingHorizontal: 16, gap: 12 },
  groupTitle: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyTitle: { fontFamily: dsFont.semibold, fontSize: dsSize.base, color: ds.ink, textAlign: 'center' },
  link: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.btn },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.btn,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: dsRadius.md,
  },
  retryText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.white },
  footer: { alignItems: 'center', paddingVertical: 16 },
});
