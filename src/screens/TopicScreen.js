import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, levelColors } from '../theme/colors';
import { getCompletedLessons, getCourseProgress, toggleBookmark, getBookmarks } from '../utils/storage';

export default function TopicScreen({ route, navigation }) {
  const { course } = route.params;
  const [completed, setCompleted] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const levelColor = levelColors[course.level];

  useFocusEffect(useCallback(() => {
    getCompletedLessons().then(setCompleted);
    getBookmarks().then((b) => setBookmarked(b.includes(course.id)));
  }, [course.id]));

  const progress = getCourseProgress(course, completed);

  const handleBookmark = async () => {
    const updated = await toggleBookmark(course.id);
    setBookmarked(updated.includes(course.id));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleBookmark} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 22 }}>{bookmarked ? '🔖' : '📌'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [bookmarked]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <LinearGradient
        colors={[levelColor + '33', levelColor + '11', 'transparent']}
        style={styles.hero}
      >
        <Text style={styles.heroIcon}>{course.icon}</Text>
        <View style={[styles.levelBadge, { backgroundColor: levelColor + '22', borderColor: levelColor + '44' }]}>
          <Text style={[styles.levelText, { color: levelColor }]}>{course.level}</Text>
        </View>
        <Text style={styles.heroTitle}>{course.title}</Text>
        <Text style={styles.heroSubtitle}>{course.subtitle}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { icon: '📖', val: `${course.lessons.length} lessons` },
            { icon: '⏱', val: course.duration },
            { icon: '✅', val: `${progress.done}/${progress.total} done` },
          ].map((s) => (
            <View key={s.val} style={styles.statItem}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress.pct}%`, backgroundColor: levelColor }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress.pct)}% complete</Text>
      </LinearGradient>

      {/* Lessons */}
      <View style={styles.lessonsSection}>
        <Text style={styles.sectionTitle}>Lessons</Text>
        {course.lessons.map((lesson, idx) => {
          const isDone = completed.includes(lesson.id);
          const isLocked = idx > 0 && !completed.includes(course.lessons[idx - 1].id) && progress.done === 0;
          return (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, isDone && styles.lessonDone]}
              onPress={() => navigation.navigate('Lesson', { lesson, courseTitle: course.title, levelColor })}
              activeOpacity={0.8}
            >
              <View style={[styles.lessonNum, { backgroundColor: isDone ? levelColor : colors.border }]}>
                {isDone
                  ? <Text style={styles.lessonNumText}>✓</Text>
                  : <Text style={styles.lessonNumText}>{idx + 1}</Text>
                }
              </View>
              <View style={styles.lessonBody}>
                <Text style={[styles.lessonTitle, isDone && { color: colors.textSecondary }]}>
                  {lesson.title}
                </Text>
                <Text style={styles.lessonDuration}>⏱ {lesson.duration}</Text>
              </View>
              <Text style={styles.lessonArrow}>{isDone ? '✓' : '›'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Complete Course Button */}
      {progress.pct < 100 && (
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: levelColor }]}
          onPress={() => {
            const nextLesson = course.lessons.find((l) => !completed.includes(l.id));
            if (nextLesson) {
              navigation.navigate('Lesson', { lesson: nextLesson, courseTitle: course.title, levelColor });
            }
          }}
        >
          <Text style={styles.startBtnText}>
            {progress.done === 0 ? '🚀 Start Course' : '▶ Continue'}
          </Text>
        </TouchableOpacity>
      )}

      {progress.pct === 100 && (
        <View style={[styles.completedBanner, { borderColor: levelColor + '44' }]}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedText}>Course Complete!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  hero: { padding: 24, alignItems: 'center', paddingTop: 20 },
  heroIcon: { fontSize: 56, marginBottom: 12 },
  levelBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  levelText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 14 },
  statVal: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  progressBg: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  lessonsSection: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  lessonCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  lessonDone: { opacity: 0.7 },
  lessonNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  lessonNumText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  lessonBody: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  lessonDuration: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  lessonArrow: { fontSize: 20, color: colors.textMuted },
  startBtn: {
    marginHorizontal: 16, marginTop: 20, padding: 16,
    borderRadius: 16, alignItems: 'center',
  },
  startBtnText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  completedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginHorizontal: 16, marginTop: 20, padding: 16,
    borderRadius: 16, borderWidth: 1, backgroundColor: colors.surface,
  },
  completedIcon: { fontSize: 28 },
  completedText: { fontSize: 18, fontWeight: '700', color: colors.success },
});
