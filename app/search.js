import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, SPACING, RADIUS } from '../lib/theme';
import { getAllItems } from '../lib/db';
import { router } from 'expo-router';

function Highlight({ text, query }) {
  if (!query || !text) return <Text>{text}</Text>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <Text>{parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <Text key={i} style={{ backgroundColor: '#FBBF24', fontWeight: '600' }}>{p}</Text> : <Text key={i}>{p}</Text>)}</Text>;
}

export default function SearchScreen() {
  const T = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [allItems, setAllItems] = useState([]);

  async function ensureLoaded() {
    if (!loaded) { const items = await getAllItems(); setAllItems(items); setLoaded(true); return items; }
    return allItems;
  }

  async function doSearch(text) {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    const items = await ensureLoaded();
    const q = text.toLowerCase();
    setResults(items.filter(i => (i.title + i.content + i.summary + (i.tags||[]).join('') + (i.group||'')).toLowerCase().includes(q)));
  }

  function goToDetail(item) {
    router.push({ pathname: '/detail', params: {
      id: item.id, title: item.title, summary: item.summary || '',
      annotations: item.annotations || '', thoughts: item.thoughts || '',
      content: item.content || '', tags: JSON.stringify(item.tags || []),
      group: item.group || item.group_name || '', created_at: item.created_at || ''
    }});
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ padding: SPACING.md }}>
        <TextInput value={query} onChangeText={doSearch}
          placeholder="输入关键词搜索..." placeholderTextColor={T.textSecondary}
          style={{ backgroundColor: T.bgInput, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15 }} />
      </View>
      {query.trim() && results.length > 0 && <Text style={{ paddingHorizontal: SPACING.md, color: T.textSecondary, fontSize: 12 }}>{results.length} 条结果</Text>}
      <FlatList data={results} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: SPACING.md, paddingTop: SPACING.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: T.bgCard, borderColor: T.border }]} onPress={() => goToDetail(item)}>
            <Text style={[styles.title, { color: T.text }]}><Highlight text={item.title} query={query} /></Text>
            {(item.tags||[]).length > 0 && <View style={styles.tags}>{item.tags.slice(0,3).map((t,i) => <View key={i} style={[styles.tag, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 11 }}>{t}</Text></View>)}</View>}
            <Text style={{ color: T.text, fontSize: 14, lineHeight: 21, marginTop: SPACING.sm }} numberOfLines={2}>
              <Highlight text={item.summary || item.content} query={query} />
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.trim() ? <Text style={{ textAlign: 'center', color: T.textSecondary, paddingTop: 60 }}>未找到</Text>
          : <View style={{ alignItems: 'center', paddingTop: 80 }}><Text style={{ fontSize: 40 }}>🔍</Text><Text style={{ color: T.textSecondary, marginTop: SPACING.md }}>输入关键词搜索</Text></View>
        } />
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginRight: SPACING.xs },
});
