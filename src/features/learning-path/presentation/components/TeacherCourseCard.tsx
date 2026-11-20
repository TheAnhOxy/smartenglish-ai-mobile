import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BookOpen, Crown, GraduationCap } from 'lucide-react-native';
import { Tap } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';
import type { TeacherCourse } from '../../data/teacherCourseApi';
import { levelLabel } from '../../application/courseLevel';

interface TeacherCourseCardProps {
  course: TeacherCourse;
  /** Khóa dạy đúng trình độ học viên → gắn nhãn nổi bật. */
  matched: boolean;
  onPress: (course: TeacherCourse) => void;
  style?: StyleProp<ViewStyle>;
}

export const TeacherCourseCard: React.FC<TeacherCourseCardProps> = ({ course, matched, onPress, style }) => {
  const label = levelLabel(course);
  return (
    <Tap
      onPress={() => onPress(course)}
      style={[s.card, matched && s.cardMatched, style]}
      scaleTo={0.97}
      accessibilityLabel={`Khóa học ${course.title}${label ? `, trình độ ${label}` : ''}`}
    >
      <View style={s.cover}>
        {course.thumbnailUrl ? (
          <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <GraduationCap size={34} color={ds.btn} />
        )}
        {label ? (
          <View style={[s.levelBadge, matched && s.levelBadgeMatched]}>
            <Text style={[s.levelBadgeText, matched && s.levelBadgeTextMatched]}>{label}</Text>
          </View>
        ) : null}
        {course.isPremium ? (
          <View style={s.premium}>
            <Crown size={12} color={ds.white} />
          </View>
        ) : null}
      </View>
      <View style={s.body}>
        {matched ? <Text style={s.matchTag}>Đúng trình độ của bạn</Text> : null}
        <Text style={s.title} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={s.metaRow}>
          <BookOpen size={13} color={ds.faint} />
          <Text style={s.meta}>
            {course.totalLessons} bài học
            {course.estimatedHours ? ` · ${course.estimatedHours} giờ` : ''}
          </Text>
        </View>
      </View>
    </Tap>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: ds.card,
    borderRadius: dsRadius.lg,
    borderWidth: 1.5,
    borderColor: ds.line,
    overflow: 'hidden',
    ...dsShadow.card,
  },
  cardMatched: { borderColor: ds.sky },
  cover: {
    height: 96,
    backgroundColor: ds.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: dsRadius.full,
    backgroundColor: ds.card,
  },
  levelBadgeMatched: { backgroundColor: ds.btn },
  levelBadgeText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.ink },
  levelBadgeTextMatched: { color: ds.white },
  premium: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.amberDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 12, gap: 4 },
  matchTag: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.btn },
  title: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.ink, minHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: dsFont.body, fontSize: dsSize.xs, color: ds.muted },
});
