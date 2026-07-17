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
      <TextInput
        style={styles.search}
        placeholder="Search courses..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      <View style={styles.divider} />

      {/* Level Filter — underline style */}
      <View style={styles.tabs}>
        {LEVELS.map((level) => (
          <TouchableOpacity key={level} style={styles.tab} onPress={() => setFilter(level)}>
            <Text style={[styles.tabText, filter === level && styles.tabTextActive]}>{level}</Text>
            {filter === level && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Course list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {(filter === 'All' ? LEVELS.slice(1) : [filter]).map((level) => {
          const levelCourses = grouped[level] || filtered.filter((c) => c.level === level);
          if (!levelCourses.length) return null;
          return (
            <View key={level}>
              <Text style={[styles.levelLabel, { color: levelColors[level] }]}>
                {level.toUpperCase()} · {levelCourses.length}
              </Text>
              {levelCourses.map((course, idx) => {
                const p = getCourseProgress(course, completed);
                const lc = levelColors[course.level];
                const isLast = idx === levelCourses.length - 1;
                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.row, !isLast && styles.rowBorder]}
                    onPress={() => navigation.navigate('Topic', { course })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rowIcon}>{course.icon}</Text>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTop}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{course.title}</Text>
                        {p.done === p.total && p.total > 0 && <Text style={[styles.doneTag, { color: lc }]}>✓</Text>}
                      </View>
                      <Text style={styles.rowSub} numberOfLines={1}>{course.subtitle}</Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${p.pct}%`, backgroundColor: lc }]} />
                      </View>
                    </View>
                    <Text style={styles.rowCount}>{p.done}/{p.total}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        {!filtered.length && (
          <Text style={styles.empty}>No courses found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 15, color: colors.text,
  },
  divider: { height: 1, backgroundColor: colors.border },
  tabs: { flexDirection: 'row', paddingHorizontal: 8, height: 36 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 36 },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  tabUnderline: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  list: { flex: 1 },
  listContent: { paddingBottom: 40 },
  levelLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  doneTag: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  rowSub: { fontSize: 12, color: colors.textMuted, marginBottom: 5 },
  barBg: { height: 2, backgroundColor: colors.border, borderRadius: 1, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 1 },
  rowCount: { fontSize: 12, color: colors.textMuted, width: 32, textAlign: 'right' },
  empty: { textAlign: 'center', color: colors.textMuted, paddingTop: 60, fontSize: 14 },
});
