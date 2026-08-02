import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, SPACING, RADIUS } from '../lib/theme';
import { useLocalSearchParams, router } from 'expo-router';

export default function DetailScreen() {
  const T = useTheme();
  const { id, title, summary, annotations, thoughts, content, tags, group, created_at } = useLocalSearchParams();
  const tagList = tags ? JSON.parse(tags) : [];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* 顶部返回栏 */}
      <View style={[styles.header, { backgroundColor: T.bgCard, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: T.primary, fontSize: 16 }}>← 返回</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: T.text }]} numberOfLines={1}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {/* 标题 */}
        <Text style={[styles.title, { color: T.text }]}>{title}</Text>
        {/* 标签 */}
        {tagList.length > 0 && <View style={styles.tags}>{tagList.map((tag, i) => <View key={i} style={[styles.tag, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 11 }}>{tag}</Text></View>)}</View>}
        {/* 分组 */}
        {group && group !== 'null' && <Text style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>📁 {group}</Text>}
        {/* 总结 */}
        {summary && summary !== 'null' && (
          <View style={[styles.section, { borderTopColor: T.border, borderTopWidth: 1, paddingTop: SPACING.lg }]}>
            <Text style={[styles.sectionTitle, { color: T.primary }]}>📝 总结</Text>
            <Text style={[styles.sectionBody, { color: T.text }]}>{summary}</Text>
          </View>
        )}
        {/* 注解 */}
        {annotations && annotations !== 'null' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.success }]}>📖 注解</Text>
            <Text style={[styles.sectionBody, { color: T.text }]}>{annotations}</Text>
          </View>
        )}
        {/* 思考 */}
        {thoughts && thoughts !== 'null' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.warning }]}>💭 思考</Text>
            <Text style={[styles.sectionBody, { color: T.text }]}>{thoughts}</Text>
          </View>
        )}
        {/* 原文 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.textSecondary }]}>📄 原文</Text>
          <Text style={[styles.sectionBody, { color: T.textSecondary }]}>{content}</Text>
        </View>
        {/* 时间 */}
        {created_at && <Text style={{ color: T.textSecondary, fontSize: 12, marginTop: SPACING.md }}>创建: {created_at.substring(0, 10)}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  backBtn: { padding: SPACING.sm },
  headerTitle: { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: SPACING.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, marginRight: 8, marginBottom: 4 },
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm },
  sectionBody: { fontSize: 15, lineHeight: 24 },
});
