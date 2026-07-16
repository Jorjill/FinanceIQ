import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, levelColors } from '../theme/colors';
import { courses } from '../data/courses';
import { getCompletedLessons, getCourseProgress, getTotalProgress, getBookmarks } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProgressScreen({ navigation }) {
  const [completed, setCompleted] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useFocusEffect(useCallback(() => {
    getCompletedLessons().then(setCompleted);
    getBookmarks().then(setBookmarks);
  }, []));

  const total = getTotalProgress(courses, completed);
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const levelStats = levels.map((lvl) => {
    const lvlCourses = courses.filter((c) => c.level === lvl);
    const allLessons = lvlCourses.flatMap((c) => c.lessons);
    const done = allLessons.filter((l) => completed.includes(l.id)).length;
    return { lvl, done, total: allLessons.length, color: levelColors[lvl] };
  });

  const bookmarkedCourses = courses.filter((c) => bookmarks.includes(c.id));

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setCompleted([]);
            setBookmarks([]);
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overall Progress Hero */}
      <LinearGradient colors={['#0F2027', '#203A43']} style={styles.hero}>
        <Text style={styles.heroTitle}>Your Progress</Text>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.circlePercent}>{Math.round(total.pct)}%</Text>
            <Text style={styles.circleLabel}>Complete</Text>
          </View>
        </View>
        <Text style={styles.heroSub}>{total.done} of {total.total} lessons completed</Text>
      </LinearGradient>

      {/* Level Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Level</Text>
        {levelStats.map(({ lvl, done, total: t, color }) => (
          <View key={lvl} style={styles.levelCard}>
            <View style={styles.levelCardTop}>
              <View style={[styles.levelDot, { backgroundColor: color }]} />
              <Text style={styles.levelCardName}>{lvl}</Text>
              <Text style={styles.levelCardCount}>{done}/{t} lessons</Text>
              <Text style={[styles.levelCardPct, { color }]}>{Math.round(t > 0 ? (done / t) * 100 : 0)}%</Text>
            </View>
            <View style={styles.levelBarBg}>
              <View style={[styles.levelBarFill, { width: `${t > 0 ? (done / t) * 100 : 0}%`, backgroundColor: color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Course Completion Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Courses</Text>
        {courses.map((course) => {
          const p = getCourseProgress(course, completed);
          const lc = levelColors[course.level];
          return (
            <TouchableOpacity
              key={course.id}
              style={styles.courseRow}
              onPress={() => navigation.navigate('Learn', { screen: 'Topic', params: { course } })}
              activeOpacity={0.8}
            >
              <Text style={styles.courseRowIcon}>{course.icon}</Text>
              <View style={styles.courseRowBody}>
                <Text style={styles.courseRowTitle} numberOfLines={1}>{course.title}</Text>
                <View style={styles.courseRowBar}>
                  <View style={[styles.courseRowFill, { width: `${p.pct}%`, backgroundColor: lc }]} />
                </View>
              </View>
              <Text style={[styles.courseRowPct, { color: lc }]}>{Math.round(p.pct)}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bookmarks */}
      {bookmarkedCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔖 Bookmarked</Text>
          {bookmarkedCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.bookmarkCard}
              onPress={() => navigation.navigate('Learn', { screen: 'Topic', params: { course } })}
              activeOpacity={0.8}
            >
              <Text style={styles.bookmarkIcon}>{course.icon}</Text>
              <View>
                <Text style={styles.bookmarkTitle}>{course.title}</Text>
                <Text style={styles.bookmarkMeta}>{course.level} · {course.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {getAchievements(total.done, completed, courses).map((ach) => (
            <View key={ach.id} style={[styles.achCard, !ach.unlocked && styles.achCardLocked]}>
              <Text style={styles.achIcon}>{ach.unlocked ? ach.icon : '🔒'}</Text>
              <Text style={[styles.achTitle, !ach.unlocked && { color: colors.textMuted }]}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>Reset All Progress</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getAchievements(totalDone, completed, courses) {
  const allLessons = courses.flatMap((c) => c.lessons);
  const advancedLessons = courses.filter((c) => c.level === 'Advanced').flatMap((c) => c.lessons);
  const advancedDone = advancedLessons.filter((l) => completed.includes(l.id)).length;

  return [
    { id: '1', icon: '🌱', title: 'First Step', desc: 'Complete your first lesson', unlocked: totalDone >= 1 },
    { id: '2', icon: '📚', title: 'Student', desc: 'Complete 5 lessons', unlocked: totalDone >= 5 },
    { id: '3', icon: '🎓', title: 'Scholar', desc: 'Complete 15 lessons', unlocked: totalDone >= 15 },
    { id: '4', icon: '🏆', title: 'Master', desc: 'Complete all lessons', unlocked: totalDone >= allLessons.length },
    { id: '5', icon: '🚀', title: 'Advanced', desc: 'Start an Advanced course', unlocked: advancedDone >= 1 },
    { id: '6', icon: '💰', title: 'Investor', desc: 'Complete the $30K plan', unlocked: completed.includes('a5l3') },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  hero: { padding: 24, alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 20 },
  circleContainer: { marginBottom: 16 },
  circle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,212,170,0.15)', borderWidth: 3, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  circlePercent: { fontSize: 32, fontWeight: '900', color: colors.primary },
  circleLabel: { fontSize: 12, color: colors.textSecondary },
  heroSub: { color: colors.textSecondary, fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  levelCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  levelCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  levelCardName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  levelCardCount: { fontSize: 12, color: colors.textSecondary },
  levelCardPct: { fontSize: 16, fontWeight: '800', marginLeft: 6 },
  levelBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  levelBarFill: { height: '100%', borderRadius: 3 },
  courseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  courseRowIcon: { fontSize: 22, width: 32 },
  courseRowBody: { flex: 1 },
  courseRowTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  courseRowBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  courseRowFill: { height: '100%', borderRadius: 2 },
  courseRowPct: { fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },
  bookmarkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  bookmarkIcon: { fontSize: 26 },
  bookmarkTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookmarkMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  achCardLocked: { opacity: 0.5 },
  achIcon: { fontSize: 28, marginBottom: 6 },
  achTitle: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 3 },
  achDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  resetBtn: {
    marginHorizontal: 16, marginTop: 32, padding: 14,
    borderRadius: 14, borderWidth: 1, borderColor: colors.danger + '44',
    alignItems: 'center',
  },
  resetText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
});
