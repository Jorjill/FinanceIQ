import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Linking, Modal,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  fetchAllNews, getSentimentLabel, getSentimentColor, timeAgo,
} from '../services/newsService';

const CATEGORIES = ['All', 'Markets', 'Economy', 'Stocks', 'Crypto'];

export default function NewsScreen() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAllNews();
      setArticles(data);
    } catch (e) {
      setError('Could not load news. Check your connection.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = articles.filter(
    (a) => category === 'All' || a.category === category
  );

  return (
    <View style={styles.container}>
      {/* Category tabs — underline style */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={styles.tab} onPress={() => setCategory(cat)}>
            <Text style={[styles.tabText, category === cat && styles.tabTextActive]}>{cat}</Text>
            {category === cat && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.divider} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching latest market news…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Text style={styles.listMeta}>{filtered.length} stories</Text>
          {filtered.map((article, idx) => (
            <ArticleRow
              key={article.id}
              article={article}
              onPress={() => setSelected(article)}
              isLast={idx === filtered.length - 1}
            />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No {category} news found.</Text>
          )}
        </ScrollView>
      )}

      {/* Article Detail Modal */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

// ─── Flat Article Row ─────────────────────────────────────────────────────────
function ArticleRow({ article, onPress, isLast }) {
  const sentColor = getSentimentColor(article.sentiment);
  return (
    <TouchableOpacity
      style={[styles.articleRow, !isLast && styles.articleRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.sentBar, { backgroundColor: sentColor }]} />
      <View style={styles.articleBody}>
        <View style={styles.articleMeta}>
          <Text style={styles.articleSource}>{article.source}</Text>
          <Text style={styles.articleTime}>{timeAgo(article.pubDate)}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.articleTopic}>
          {article.topicIcon} {article.topic}{article.llmAnalyzed ? '  🤖' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Article Detail Modal ─────────────────────────────────────────────────────
function ArticleModal({ article, onClose }) {
  const sentColor = getSentimentColor(article.sentiment);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle} numberOfLines={1}>{article.source}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(article.link)} style={styles.openBtn}>
            <Text style={styles.openBtnText}>Open ↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Topic + Time */}
          <View style={styles.modalMetaRow}>
            <Text style={styles.modalTopicIcon}>{article.topicIcon}</Text>
            <Text style={styles.modalTopic}>{article.topic}</Text>
            <Text style={styles.modalTime}>{timeAgo(article.pubDate)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>{article.title}</Text>

          {/* LLM badge */}
          {article.llmAnalyzed && (
            <View style={styles.llmRow}>
              <Text style={styles.llmRowText}>🤖 Analyzed by GPT-4o-mini</Text>
            </View>
          )}

          {/* Sentiment banner */}
          <View style={[styles.sentimentBanner, { backgroundColor: sentColor + '18', borderColor: sentColor + '44' }]}>
            <Text style={[styles.sentimentBannerLabel, { color: sentColor }]}>
              {getSentimentLabel(article.sentiment)} for Markets
            </Text>
            <Text style={styles.sentimentBannerSub}>
              {article.sentimentReason || 'Based on article tone and keyword analysis'}
            </Text>
          </View>

          {/* Summary */}
          <Text style={styles.modalSectionLabel}>Summary</Text>
          <Text style={styles.modalSummary}>{article.summary}</Text>

          {/* Affected Assets */}
          <Text style={styles.modalSectionLabel}>Affected Investments</Text>
          <View style={styles.modalAssetsGrid}>
            {article.affected.map((asset) => (
              <View key={asset} style={styles.modalAssetTag}>
                <Text style={styles.modalAssetText}>{asset}</Text>
              </View>
            ))}
          </View>

          {/* Investment Tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipCardHeader}>
              <Text style={styles.tipCardIcon}>🎯</Text>
              <Text style={styles.tipCardTitle}>Investment Insight</Text>
            </View>
            <Text style={styles.tipCardBody}>{article.tip}</Text>
          </View>

          {/* Action Reminder */}
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>⚠️ Remember</Text>
            <Text style={styles.reminderText}>
              News creates short-term volatility but rarely changes long-term fundamentals. Before acting on any news, ask: does this change my 10-year investment thesis? If not, stay the course and keep your monthly DCA running.
            </Text>
          </View>

          {/* Read Full Article */}
          <TouchableOpacity
            style={styles.readFullBtn}
            onPress={() => Linking.openURL(article.link)}
          >
            <Text style={styles.readFullBtnText}>Read Full Article ↗</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Tabs
  tabs: { paddingHorizontal: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  tabUnderline: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  divider: { height: 1, backgroundColor: colors.border },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: colors.primary, fontWeight: '700' },
  listMeta: { fontSize: 11, color: colors.textMuted, paddingHorizontal: 16, paddingVertical: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, paddingTop: 60, fontSize: 14 },

  // Article row
  articleRow: { flexDirection: 'row', paddingVertical: 11, paddingRight: 16 },
  articleRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sentBar: { width: 3, borderRadius: 2, marginRight: 12, marginLeft: 16 },
  articleBody: { flex: 1 },
  articleMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  articleSource: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  articleTime: { fontSize: 11, color: colors.textMuted },
  articleTitle: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20, marginBottom: 6 },
  articleTopic: { fontSize: 12, color: colors.textSecondary },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: colors.textSecondary },
  modalHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.text },
  openBtn: { padding: 4 },
  openBtnText: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  modalContent: { padding: 20, paddingBottom: 48 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  modalTopicIcon: { fontSize: 18 },
  modalTopic: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, flex: 1 },
  modalTime: { fontSize: 12, color: colors.textMuted },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 30, marginBottom: 16 },
  sentimentBanner: {
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 20,
  },
  sentimentBannerLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  sentimentBannerSub: { fontSize: 12, color: colors.textMuted },
  modalSectionLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  modalSummary: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  modalAssetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  modalAssetTag: {
    backgroundColor: colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  modalAssetText: { fontSize: 13, color: colors.text, fontWeight: '700' },
  tipCard: {
    backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: colors.secondary + '44',
  },
  tipCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipCardIcon: { fontSize: 20 },
  tipCardTitle: { fontSize: 15, fontWeight: '800', color: colors.secondary },
  tipCardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  reminderCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 20,
  },
  reminderTitle: { fontSize: 13, fontWeight: '700', color: colors.warning, marginBottom: 6 },
  reminderText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  readFullBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  readFullBtnText: { color: colors.background, fontSize: 15, fontWeight: '800' },
  llmBadge: { fontSize: 14 },
  llmRow: {
    backgroundColor: colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  llmRowText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
