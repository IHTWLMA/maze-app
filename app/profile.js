// 我的 - 导出+导入+同步
import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme, SPACING, RADIUS } from '../lib/theme';
import { getAllItems, manualSync, addItem } from '../lib/db';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';

export default function ProfileScreen() {
  const T = useTheme();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0 });
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try { const all = await getAllItems(); setItems(all); setStats({ total: all.length }); } catch(e){}
  }

  const filtered = search.trim() ? items.filter(i => (i.title + (i.tags||[]).join('')).toLowerCase().includes(search.toLowerCase())) : items;

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSync = async () => {
    setSyncStatus('同步中...');
    const result = await manualSync();
    setSyncStatus(result.msg);
    loadItems();
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const data = await response.json();
      if (data.items) {
        for (const item of data.items) {
          await addItem(item.title, item.content, item.summary, item.annotations, item.thoughts, item.tags || [], item.group || '未分类');
        }
      }
      loadItems();
      Alert.alert('导入成功', `已导入 ${data.items?.length || 0} 条`);
    } catch (e) { Alert.alert('导入失败', e.message); }
  };

  const exportSelected = async () => {
    const toExport = selected.size > 0 ? items.filter(i => selected.has(i.id)) : items;
    if (toExport.length === 0) { Alert.alert('提示', '没有可导出的内容'); return; }
    let md = '# Maze 知识导出\n\n';
    for (const item of toExport) {
      md += `## ${item.title}\n\n`;
      if (item.tags?.length) md += `标签: ${item.tags.join(', ')}\n\n`;
      if (item.summary) md += `### 总结\n${item.summary}\n\n`;
      if (item.annotations) md += `### 注解\n${item.annotations}\n\n`;
      if (item.thoughts) md += `### 思考\n${item.thoughts}\n\n`;
      md += `### 原文\n${item.content}\n\n---\n\n`;
    }
    await Clipboard.setStringAsync(md);
    Alert.alert('导出成功', `已复制 ${toExport.length} 条到剪贴板`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ padding: SPACING.lg }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: T.text, marginBottom: SPACING.lg }}>📤 数据管理</Text>

        <TouchableOpacity onPress={handleSync} style={{ backgroundColor: T.primaryLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, alignItems: 'center' }}>
          <Text style={{ color: T.primary, fontWeight: '600' }}>{syncStatus || '🔄 同步到桌面端'}</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: T.primaryLight, padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.lg, alignItems: 'center' }}>
          <Text style={{ color: T.primary, fontSize: 13 }}>共 {stats.total} 条 · 已选 {selected.size} 条</Text>
        </View>

        <TextInput value={search} onChangeText={setSearch} placeholder="搜索筛选..." placeholderTextColor={T.textSecondary}
          style={{ backgroundColor: T.bgInput, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 14, marginBottom: SPACING.md }} />

        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
          <TouchableOpacity onPress={() => setSelected(new Set(filtered.map(i => i.id)))} style={[styles.btn, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 12 }}>全选</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(new Set())} style={[styles.btn, { backgroundColor: T.bgInput }]}><Text style={{ color: T.textSecondary, fontSize: 12 }}>取消</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleImport} style={[styles.btn, { backgroundColor: T.success }]}><Text style={{ color: '#fff', fontSize: 12 }}>📥 导入</Text></TouchableOpacity>
          <TouchableOpacity onPress={exportSelected} style={[styles.btn, { backgroundColor: T.primary, flex: 1 }]}>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>📤 导出 ({selected.size || '全部'})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList data={filtered} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleSelect(item.id)}
            style={[styles.item, { backgroundColor: selected.has(item.id) ? T.primaryLight : T.bgCard, borderColor: selected.has(item.id) ? T.primary : T.border }]}>
            <View style={[styles.checkbox, { borderColor: selected.has(item.id) ? T.primary : T.textSecondary, backgroundColor: selected.has(item.id) ? T.primary : 'transparent' }]}>
              {selected.has(item.id) && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.text, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{item.title}</Text>
              {(item.tags||[]).length > 0 && <Text style={{ color: T.textSecondary, fontSize: 11, marginTop: 2 }}>{item.tags.slice(0,3).join(' · ')}</Text>}
            </View>
          </TouchableOpacity>
        )} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, marginRight: SPACING.md, alignItems: 'center', justifyContent: 'center' },
});
