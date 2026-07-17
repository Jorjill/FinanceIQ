import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { courses, dailyTips } from '../data/courses';
import { getCompletedLessons, getTotalProgress, getCourseProgress } from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const [completed, setCompleted] = useState([]);
  const [tip, setTip] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const c = await getCompletedLessons();
    setCompleted(c);
    const idx = Math.floor(Date.now() / 86400000) % dailyTips.length;
    setTip(dailyTips[idx]);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const progress = getTotalProgress(courses, completed);
  const inProgress = courses.filter((c) => {
    const p = getCourseProgress(c, completed);
    return p.done > 0 && p.done < p.total;
  });
  const recommended = courses.filter((c) => getCourseProgress(c, completed).done === 0).slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
        <Text style={styles.subtitle}>Ready to build wealth today?</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.pct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(progress.pct)}%</Text>
        </View>
        <Text style={styles.progressSub}>{progress.done} of {progress.total} lessons</Text>
      </View>

      <View style={styles.divider} />

      {/* Daily tip */}
      <View style={styles.tipRow}>
        <View style={styles.tipDot} />
        <Text style={styles.tipText}>{tip}</Text>
      </View>

      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="Courses" value={courses.length} />
        <View style={styles.statDivider} />
        <Stat label="Done" value={progress.done} />
        <View style={styles.statDivider} />
        <Stat label="Remaining" value={progress.total - progress.done} />
      </View>

      <View style={styles.divider} />

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>CONTINUE</Text>
          {inProgress.map((course) => {
            const p = getCourseProgress(course, completed);
            return (
              <CourseRow
                key={course.id}
                course={course}
                progress={p}
                onPress={() => navigation.navigate('Topic', { course })}
              />
            );
          })}
          <View style={styles.divider} />
        </>
      )}

      {/* Start Here */}
      <Text style={styles.sectionLabel}>START HERE</Text>
      {recommended.map((course) => (
        <CourseRow
          key={course.id}
          course={course}
          progress={getCourseProgress(course, completed)}
          onPress={() => navigation.navigate('Topic', { course })}
        />
      ))}

      <TouchableOpacity onPress={() => navigation.navigate('Learn')} style={styles.viewAll}>
        <Text style={styles.viewAllText}>All courses →</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* $30K note */}
      <TouchableOpacity style={styles.bannerRow} onPress={() => navigation.navigate('Learn')} activeOpacity={0.7}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTitle}>$30K Investment Plan</Text>
          <Text style={styles.bannerSub}>Unlock in the Advanced section</Text>
        </View>
        <Text style={styles.bannerArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CourseRow({ course, progress, onPress }) {
  const levelColor =
    course.level === 'Beginner' ? colors.beginner :
    course.level === 'Intermediate' ? colors.intermediate : colors.advanced;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{course.icon}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{course.title}</Text>
        <View style={styles.rowBarBg}>
          <View style={[styles.rowBarFill, { width: `${progress.pct}%`, backgroundColor: levelColor }]} />
        </View>
      </View>
      <Text style={styles.rowMeta}>{progress.done}/{progress.total}</Text>
    </TouchableOpacity>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  header: { padding: 16, paddingTop: 14 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  progressPct: { fontSize: 13, fontWeight: '700', color: colors.primary, width: 36, textAlign: 'right' },
  progressSub: { fontSize: 12, color: colors.textMuted, marginTop: 6 },

  divider: { height: 1, backgroundColor: colors.border },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  statsRow: { flexDirection: 'row', paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  rowBarBg: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  rowBarFill: { height: '100%', borderRadius: 2 },
  rowMeta: { fontSize: 12, color: colors.textMuted, width: 32, textAlign: 'right' },

  viewAll: { paddingHorizontal: 16, paddingVertical: 8 },
  viewAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  bannerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bannerArrow: { fontSize: 18, color: colors.primary },
});
