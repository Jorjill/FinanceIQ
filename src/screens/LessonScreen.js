import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { markLessonComplete, getCompletedLessons } from '../utils/storage';

export default function LessonScreen({ route, navigation }) {
  const { lesson, courseTitle, levelColor } = route.params;
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    getCompletedLessons().then((list) => {
      setCompleted(list.includes(lesson.id));
    });
  }, [lesson.id]);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: courseTitle });
  }, [courseTitle]);

  const handleComplete = async () => {
    if (completed) {
      navigation.goBack();
      return;
    }
    setMarking(true);
    await markLessonComplete(lesson.id);
    setCompleted(true);
    setMarking(false);
    Alert.alert('Lesson Complete! 🎉', 'Great work! Keep going.', [
      { text: 'Continue', onPress: () => navigation.goBack() },
    ]);
  };

  const blocks = parseMarkdown(lesson.content);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Lesson header */}
        <View style={[styles.lessonHeader, { borderLeftColor: levelColor }]}>
          <Text style={styles.lessonMeta}>⏱ {lesson.duration}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        {/* Rendered markdown */}
        {blocks.map((block, i) => renderBlock(block, i, levelColor))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: completed ? colors.surfaceElevated : levelColor }]}
          onPress={handleComplete}
          disabled={marking}
        >
          <Text style={[styles.completeBtnText, { color: completed ? colors.textSecondary : colors.background }]}>
            {completed ? '✓ Lesson Complete' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Simple Markdown Parser ───────────────────────────────────────────────────
function parseMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) });
    } else if (line.startsWith('| ')) {
      // Table
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: line.slice(2) });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ type: 'numbered', text: line.replace(/^\d+\. /, ''), num: line.match(/^(\d+)\./)[1] });
    } else if (line.startsWith('✅') || line.startsWith('☐')) {
      blocks.push({ type: 'check', text: line });
    } else if (line.trim() === '') {
      blocks.push({ type: 'spacer' });
    } else {
      blocks.push({ type: 'para', text: line });
    }
    i++;
  }
  return blocks;
}

function renderBlock(block, idx, levelColor) {
  switch (block.type) {
    case 'h1':
      return <Text key={idx} style={styles.h1}>{block.text}</Text>;
    case 'h2':
      return <Text key={idx} style={[styles.h2, { color: levelColor }]}>{block.text}</Text>;
    case 'h3':
      return <Text key={idx} style={styles.h3}>{block.text}</Text>;
    case 'bullet':
      return (
        <View key={idx} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: levelColor }]} />
          <Text style={styles.bulletText}>{renderInline(block.text)}</Text>
        </View>
      );
    case 'numbered':
      return (
        <View key={idx} style={styles.bulletRow}>
          <View style={[styles.numCircle, { backgroundColor: levelColor + '33' }]}>
            <Text style={[styles.numText, { color: levelColor }]}>{block.num}</Text>
          </View>
          <Text style={styles.bulletText}>{renderInline(block.text)}</Text>
        </View>
      );
    case 'check':
      return <Text key={idx} style={styles.checkText}>{block.text}</Text>;
    case 'table':
      return <TableBlock key={idx} lines={block.lines} levelColor={levelColor} />;
    case 'spacer':
      return <View key={idx} style={{ height: 8 }} />;
    case 'para':
    default:
      return <Text key={idx} style={styles.para}>{renderInline(block.text)}</Text>;
  }
}

function renderInline(text) {
  // Handle **bold** inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    return part;
  });
}

function TableBlock({ lines, levelColor }) {
  const rows = lines
    .filter((l) => !l.match(/^\|[-| ]+\|$/))
    .map((l) => l.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map((c) => c.trim()));

  if (!rows.length) return null;
  const [header, ...body] = rows;

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, { backgroundColor: levelColor + '22' }]}>
        {header.map((cell, i) => (
          <Text key={i} style={[styles.tableHeader, { flex: 1 }]}>{cell}</Text>
        ))}
      </View>
      {body.map((row, ri) => (
        <View key={ri} style={[styles.tableRow, ri % 2 === 0 && styles.tableRowAlt]}>
          {row.map((cell, ci) => (
            <Text key={ci} style={[styles.tableCell, { flex: 1 }]}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 20 },
  lessonHeader: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 20 },
  lessonMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  lessonTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  para: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: 6 },
  bold: { color: colors.text, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 9, marginRight: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  numText: { fontSize: 11, fontWeight: '800' },
  bulletText: { flex: 1, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  checkText: { fontSize: 15, color: colors.textSecondary, lineHeight: 26, marginBottom: 4 },
  table: { borderRadius: 10, overflow: 'hidden', marginVertical: 12, borderWidth: 1, borderColor: colors.border },
  tableRow: { flexDirection: 'row', padding: 10 },
  tableRowAlt: { backgroundColor: colors.surface },
  tableHeader: { fontSize: 12, fontWeight: '700', color: colors.text },
  tableCell: { fontSize: 12, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  completeBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  completeBtnText: { fontSize: 16, fontWeight: '800' },
});
