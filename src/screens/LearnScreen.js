import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, levelColors } from '../theme/colors';
import { courses } from '../data/courses';
import { getCompletedLessons, getCourseProgress } from '../utils/storage';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function LearnScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState([]);

  useFocusEffect(useCallback(() => {
    getCompletedLessons().then(setCompleted);
  }, []));

  const filtered = courses.filter((c) => {
    const matchLevel = filter === 'All' || c.level === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const grouped = LEVELS.slice(1).reduce((acc, level) => {
    acc[level] = filtered.filter((c) => c.level === level);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Level Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.filterChip, filter === level && styles.filterChipActive]}
            onPress={() => setFilter(level)}
          >
            <Text style={[styles.filterText, filter === level && styles.filterTextActive]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {(filter === 'All' ? LEVELS.slice(1) : [filter]).map((level) => {
          const levelCourses = grouped[level] || filtered.filter((c) => c.level === level);
          if (levelCourses.length === 0) return null;
          return (
            <View key={level}>
              <View style={styles.levelHeader}>
                <View style={[styles.levelDot, { backgroundColor: levelColors[level] }]} />
                <Text style={styles.levelTitle}>{level}</Text>
                <Text style={styles.levelCount}>{levelCourses.length} courses</Text>
              </View>
              {levelCourses.map((course) => {
                const p = getCourseProgress(course, completed);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={p}
                    onPress={() => navigation.navigate('Topic', { course })}
                  />
                );
              })}
            </View>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CourseCard({ course, progress, onPress }) {
  const levelColor = levelColors[course.level];
  const isCompleted = progress.done === progress.total && progress.total > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: levelColor + '22' }]}>
          <Text style={styles.courseIcon}>{course.icon}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          {isCompleted && <Text style={styles.completedBadge}>✓</Text>}
        </View>
        <Text style={styles.courseSubtitle} numberOfLines={2}>{course.subtitle}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>📖 {course.lessons.length} lessons</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>⏱ {course.duration}</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress.pct}%`, backgroundColor: levelColor }]} />
        </View>
        <Text style={styles.progressText}>{progress.done}/{progress.total} completed</Text>
      </View>
      <View style={[styles.levelPill, { backgroundColor: levelColor + '22' }]}>
        <Text style={[styles.levelPillText, { color: levelColor }]}>{course.level[0]}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: colors.surface,
    borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  filterRow: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.background },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 12, gap: 8 },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  levelCount: { fontSize: 12, color: colors.textSecondary },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardLeft: { marginRight: 12, justifyContent: 'flex-start', paddingTop: 2 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  courseIcon: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  completedBadge: { color: colors.success, fontSize: 16, marginLeft: 6 },
  courseSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3, marginBottom: 6, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  metaText: { fontSize: 11, color: colors.textMuted },
  metaDot: { color: colors.textMuted, fontSize: 11 },
  progressBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, color: colors.textMuted },
  levelPill: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8, alignSelf: 'center',
  },
  levelPillText: { fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
});
