import React, { useCallback, useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Crown, GraduationCap, Lock, PlayCircle } from 'lucide-react-native';
import { BackButton } from '@/src/core/components/BackButton';
import { FoxRunLoader } from '@/src/core/components/FoxRunLoader';
import { Button3D, dsText } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsSize } from '@/src/theme/ds';
import { useAuthStore } from '@/src/core/flows/authStore';
import { hasActivePremium } from '@/src/core/utils/plan';
import type { TeacherCourseLesson } from '../../data/teacherCourseApi';
import { useLearnerLevel, useTeacherCoursesQuery } from '../../application/useTeacherCourses';
import { coversLevel, distanceToLevel, levelLabel } from '../../application/courseLevel';

export const TeacherCourseDetailScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data, isLoading, isError, refetch } = useTeacherCoursesQuery();
  const { level, fromPlacement } = useLearnerLevel();
  const isPremium = hasActivePremium(useAuthStore((s) => s.currentUser));

  const course = useMemo(() => data?.find((c) => c.id === String(courseId)) ?? null, [data, courseId]);
  const locked = Boolean(course?.isPremium && !isPremium);

  const openLesson = useCallback(
    (lesson: TeacherCourseLesson) => {
      if (locked && !lesson.isFreePreview) {
        router.push({ pathname: '/(student)/profile/premium', params: { from: 'teacher-course' } } as never);
        return;
      }
      router.push(`/(student)/lesson/${lesson.id}` as never);
    },
    [locked, router],
  );

  const renderLesson = useCallback<ListRenderItem<TeacherCourseLesson>>(
    ({ item, index }) => {
      const lessonLocked = locked && !item.isFreePreview;
      return (
        <Pressable onPress={() => openLesson(item)} style={s.lesson} accessibilityLabel={`Bài ${index + 1}: ${item.title}`}>
          <View style={s.lessonIndex}>
            <Text style={s.lessonIndexText}>{index + 1}</Text>
          </View>
          <Text style={s.lessonTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {lessonLocked ? <Lock size={16} color={ds.faint} /> : <ChevronRight size={18} color={ds.faint} />}
        </Pressable>
      );
    },
    [locked, openLesson],
  );

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <FoxRunLoader message="Đang tải khóa học..." />
      </View>
    );
  }

  if (isError || !course) {
    return (
      <View style={[s.root, { paddingTop: (insets.top || 16) + 4 }]}>
        <View style={s.header}>
          <BackButton />
        </View>
        <View style={s.center}>
          <Text style={s.emptyTitle}>{isError ? 'Không tải được khóa học' : 'Không tìm thấy khóa học'}</Text>
          {isError ? (
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text style={s.link}>Thử lại</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const label = levelLabel(course);
  const matched = coversLevel(course, level);
  const gap = distanceToLevel(course, level);
  const fitText = !level
    ? null
    : matched
      ? `Đúng trình độ ${level} của bạn${fromPlacement ? ' theo bài kiểm tra đầu vào' : ''}`
      : gap === 1
        ? `Gần trình độ ${level} của bạn, phù hợp để nâng cao hoặc ôn lại`
        : `Khác trình độ ${level} của bạn`;
  const firstLesson = course.lessons[0];

  return (
    <View style={s.root}>
      <FlatList
        data={course.lessons}
        keyExtractor={(l) => l.id}
        renderItem={renderLesson}
        contentContainerStyle={{ paddingBottom: (insets.bottom || 12) + 100 }}
        ListHeaderComponent={
          <View>
            <View style={s.cover}>
              {course.thumbnailUrl ? (
                <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <GraduationCap size={56} color={ds.btn} />
              )}
              <View style={[s.backWrap, { top: (insets.top || 16) + 4 }]}>
                <BackButton />
              </View>
            </View>
            <View style={s.info}>
              <View style={s.badgeRow}>
                {label ? (
                  <View style={[s.badge, matched && s.badgeMatched]}>
                    <Text style={[s.badgeText, matched && s.badgeTextMatched]}>Trình độ {label}</Text>
                  </View>
                ) : null}
                {course.isPremium ? (
                  <View style={[s.badge, s.badgePremium]}>
                    <Crown size={12} color={ds.amberText} />
                    <Text style={[s.badgeText, { color: ds.amberText }]}>Premium</Text>
                  </View>
                ) : null}
              </View>
              <Text style={dsText.h1}>{course.title}</Text>
              {fitText ? <Text style={[s.fit, matched && s.fitMatched]}>{fitText}</Text> : null}
              {course.description ? <Text style={s.desc}>{course.description}</Text> : null}
              <Text style={s.meta}>
                {course.totalLessons} bài học
                {course.estimatedHours ? ` · khoảng ${course.estimatedHours} giờ` : ''}
              </Text>
              <Text style={s.sectionTitle}>Nội dung khóa học</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={[s.meta, { paddingHorizontal: 20 }]}>Giáo viên đang cập nhật bài học.</Text>}
      />
      {firstLesson ? (
        <View style={[s.cta, { paddingBottom: (insets.bottom || 12) + 8 }]}>
          <Button3D
            label={locked && !firstLesson.isFreePreview ? 'Nâng cấp Premium để học' : 'Bắt đầu học'}
            icon={<PlayCircle size={18} color={ds.white} />}
            onPress={() => openLesson(firstLesson)}
          />
        </View>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { paddingHorizontal: 16 },
  cover: { height: 200, backgroundColor: ds.skySoft, alignItems: 'center', justifyContent: 'center' },
  backWrap: { position: 'absolute', left: 16 },
  info: { padding: 20, gap: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: dsRadius.full,
    backgroundColor: ds.card,
    borderWidth: 1,
    borderColor: ds.line,
  },
  badgeMatched: { backgroundColor: ds.btn, borderColor: ds.btn },
  badgePremium: { backgroundColor: ds.amberSoft, borderColor: ds.amberSoft },
  badgeText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.ink },
  badgeTextMatched: { color: ds.white },
  fit: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.muted },
  fitMatched: { color: ds.btn },
  desc: { fontFamily: dsFont.body, fontSize: dsSize.base, color: ds.inkSoft, lineHeight: 22 },
  meta: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.muted },
  sectionTitle: { fontFamily: dsFont.display, fontSize: dsSize.md, color: ds.ink, marginTop: 12 },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: ds.card,
    borderRadius: dsRadius.md,
    borderWidth: 1,
    borderColor: ds.line,
  },
  lessonIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ds.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonIndexText: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.btn },
  lessonTitle: { flex: 1, fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.ink },
  emptyTitle: { fontFamily: dsFont.semibold, fontSize: dsSize.base, color: ds.ink, textAlign: 'center' },
  link: { fontFamily: dsFont.semibold, fontSize: dsSize.sm, color: ds.btn },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: ds.bg,
    borderTopWidth: 1,
    borderTopColor: ds.line,
  },
});
