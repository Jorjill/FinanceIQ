import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const progress = getTotalProgress(courses, completed);
  const inProgress = courses.filter((c) => {
    const p = getCourseProgress(c, completed);
    return p.done > 0 && p.done < p.total;
  });
  const recommended = courses.filter((c) => {
    const p = getCourseProgress(c, completed);
    return p.done === 0;
  }).slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
        <Text style={styles.subtitle}>Ready to build wealth today?</Text>

        {/* Overall Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPct}>{Math.round(progress.pct)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.pct}%` }]} />
          </View>
          <Text style={styles.progressSub}>{progress.done} of {progress.total} lessons completed</Text>
        </View>
      </LinearGradient>

      {/* Daily Tip */}
      <View style={styles.section}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.tipCard}>
          <Text style={styles.tipLabel}>💡 Daily Insight</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </LinearGradient>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Courses', value: courses.length, icon: '📚' },
          { label: 'Completed', value: progress.done, icon: '✅' },
          { label: 'Streak', value: '1 day', icon: '🔥' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          {inProgress.map((course) => {
            const p = getCourseProgress(course, completed);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.continueCard}
                onPress={() => navigation.navigate('Topic', { course })}
                activeOpacity={0.8}
              >
                <Text style={styles.continueIcon}>{course.icon}</Text>
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle}>{course.title}</Text>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { width: `${p.pct}%` }]} />
                  </View>
                  <Text style={styles.continueProgress}>{p.done}/{p.total} lessons</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Recommended */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Start Here</Text>
        {recommended.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.recCard}
            onPress={() => navigation.navigate('Topic', { course })}
            activeOpacity={0.8}
          >
            <View style={styles.recLeft}>
              <Text style={styles.recIcon}>{course.icon}</Text>
              <View>
                <Text style={styles.recTitle}>{course.title}</Text>
                <Text style={styles.recMeta}>{course.level} · {course.duration}</Text>
              </View>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) + '22' }]}>
              <Text style={[styles.levelText, { color: getLevelColor(course.level) }]}>{course.level}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => navigation.navigate('Learn')} style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View All Courses →</Text>
        </TouchableOpacity>
      </View>

      {/* $30K Banner */}
      <LinearGradient colors={['#00D4AA22', '#00D4AA11']} style={styles.bannerCard}>
        <Text style={styles.bannerIcon}>💰</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Ready to invest your $30K?</Text>
          <Text style={styles.bannerSub}>Complete the Advanced section for a personalized plan</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Learn')}
          style={styles.bannerBtn}
        >
          <Text style={styles.bannerBtnText}>Go</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getLevelColor(level) {
  if (level === 'Beginner') return colors.beginner;
  if (level === 'Intermediate') return colors.intermediate;
  return colors.advanced;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  header: { padding: 24, paddingTop: 16, paddingBottom: 28 },
  greeting: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  progressPct: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressSub: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  tipCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  tipLabel: { fontSize: 12, color: colors.secondary, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  tipText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  continueCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  continueIcon: { fontSize: 28, marginRight: 12 },
  continueInfo: { flex: 1 },
  continueTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
  miniProgressBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  miniProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  continueProgress: { fontSize: 11, color: colors.textSecondary },
  arrow: { fontSize: 24, color: colors.textMuted },
  recCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  recLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  recIcon: { fontSize: 28 },
  recTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  recMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700' },
  viewAllBtn: { alignItems: 'center', paddingVertical: 12 },
  viewAllText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 24, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: colors.primary + '44',
  },
  bannerIcon: { fontSize: 32 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bannerBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  bannerBtnText: { color: colors.background, fontWeight: '800', fontSize: 13 },
});
