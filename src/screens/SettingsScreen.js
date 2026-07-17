import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert, Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  getOpenAIKey, setOpenAIKey, getLLMEnabled, setLLMEnabled,
} from '../utils/storage';
import { isLLMReady } from '../services/llmService';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [llmOn, setLlmOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [k, enabled, rdy] = await Promise.all([getOpenAIKey(), getLLMEnabled(), isLLMReady()]);
      setSavedKey(k);
      setApiKey(k);
      setLlmOn(enabled);
      setReady(rdy);
    })();
  }, []);

  const handleSave = async () => {
    if (!apiKey.startsWith('sk-') && apiKey.length > 0) {
      Alert.alert('Invalid Key', 'OpenAI API keys start with "sk-". Check and try again.');
      return;
    }
    setSaving(true);
    await setOpenAIKey(apiKey);
    setSavedKey(apiKey);
    const rdy = await isLLMReady();
    setReady(rdy);
    setSaving(false);
    Alert.alert('Saved ✓', apiKey ? 'API key saved. LLM analysis is now active.' : 'API key cleared. Using rule-based analysis.');
  };

  const handleToggleLLM = async (val) => {
    setLlmOn(val);
    await setLLMEnabled(val);
  };

  const handleClear = () => {
    Alert.alert('Clear API Key', 'Are you sure? This will disable LLM analysis.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          setApiKey('');
          setSavedKey('');
          await setOpenAIKey('');
          setReady(false);
        },
      },
    ]);
  };

  const maskedKey = savedKey ? `sk-...${savedKey.slice(-6)}` : 'Not set';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { borderColor: ready ? colors.primary + '55' : colors.border }]}>
        <View style={[styles.statusDot, { backgroundColor: ready ? colors.success : colors.danger }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>
            {ready ? 'LLM Analysis Active' : 'LLM Analysis Inactive'}
          </Text>
          <Text style={styles.statusSub}>
            {ready
              ? `Using GPT-4o-mini · Key: ${maskedKey}`
              : savedKey
                ? 'LLM is toggled off — using rule-based analysis'
                : 'No API key — using rule-based analysis'}
          </Text>
        </View>
      </View>

      {/* API Key Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OpenAI API Key</Text>
        <Text style={styles.sectionDesc}>
          Used exclusively for analyzing financial news. Your key is stored locally on your device and never sent anywhere except OpenAI's servers.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={showKey ? apiKey : apiKey.length > 0 ? `sk-...${apiKey.slice(-6)}` : ''}
            onChangeText={(t) => setApiKey(t)}
            placeholder="sk-..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showKey}
            onFocus={() => setShowKey(true)}
            onBlur={() => setShowKey(false)}
          />
          <TouchableOpacity style={styles.showBtn} onPress={() => setShowKey((v) => !v)}>
            <Text style={styles.showBtnText}>{showKey ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Key'}</Text>
          </TouchableOpacity>
          {savedKey ? (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => Linking.openURL('https://platform.openai.com/api-keys')} style={styles.linkRow}>
          <Text style={styles.linkText}>Get your API key at platform.openai.com →</Text>
        </TouchableOpacity>
      </View>

      {/* LLM Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Enable LLM Analysis</Text>
            <Text style={styles.toggleDesc}>When off, uses fast rule-based keyword analysis</Text>
          </View>
          <Switch
            value={llmOn}
            onValueChange={handleToggleLLM}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {[
          { icon: '📰', title: 'Fetch News', desc: 'Live RSS feeds from Yahoo Finance, CNBC, MarketWatch, CoinTelegraph' },
          { icon: '🤖', title: 'GPT-4o-mini Analyzes', desc: 'Each article is sent to OpenAI. Returns summary, sentiment, affected assets, and a personalized tip for your $30K portfolio' },
          { icon: '🎯', title: 'Actionable Insight', desc: 'Concrete advice mentioning specific ETFs (VOO, QQQ, TLT) and actions relevant to the exact news' },
          { icon: '🔒', title: 'Privacy', desc: 'Only the article headline and first ~500 chars of description are sent. Your key lives only on your device' },
        ].map((item) => (
          <View key={item.title} style={styles.howItem}>
            <Text style={styles.howIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>{item.title}</Text>
              <Text style={styles.howDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Cost estimate */}
      <View style={styles.costCard}>
        <Text style={styles.costTitle}>💰 Cost Estimate</Text>
        <Text style={styles.costText}>
          GPT-4o-mini costs ~$0.15 per 1M input tokens.{'\n'}
          Each article analysis uses ~300 tokens.{'\n'}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            Analyzing 8 articles = ~$0.0004 (less than 0.1¢).{'\n'}
            Refreshing news 10× per day = ~$0.004/day ($1.50/year).
          </Text>
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  statusSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12,
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    color: colors.text, fontSize: 14, fontFamily: 'monospace',
  },
  showBtn: { paddingHorizontal: 14 },
  showBtnText: { fontSize: 18 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { color: colors.background, fontWeight: '800', fontSize: 14 },
  clearBtn: {
    paddingHorizontal: 20, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.danger + '55', alignItems: 'center',
  },
  clearBtnText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  linkRow: { paddingVertical: 4 },
  linkText: { color: colors.primary, fontSize: 13 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  howItem: {
    flexDirection: 'row', gap: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  howIcon: { fontSize: 24, width: 32, textAlign: 'center', marginTop: 2 },
  howTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  howDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  costCard: {
    backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  costTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  costText: { fontSize: 13, color: colors.textSecondary, lineHeight: 22 },
});
