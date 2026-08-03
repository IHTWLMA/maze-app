import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTheme, SPACING, RADIUS } from '../lib/theme';
import { getAllItems, deleteItem, updateItem } from '../lib/db';
import { useFocusEffect } from 'expo-router';

export default function LibraryScreen() {
  const T = useTheme();
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('list');

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    const all = await getAllItems();
    setItems(all);
    const g = [...new Set(all.map(i => i.group || i.group_name).filter(Boolean))];
    setGroups(g.map(name => ({ name })));
  }

  let filtered = selectedGroup ? items.filter(i => (i.group || i.group_name) === selectedGroup) : items;
  if (sort === 'newest') filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  else if (sort === 'oldest') filtered.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  else if (sort === 'alpha') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const grouped = {};
  filtered.forEach(i => { const g = i.group || i.group_name || '未分类'; if (!grouped[g]) grouped[g] = []; grouped[g].push(i); });

  const startEdit = (item) => { setEditingId(item.id); setEditTitle(item.title); setEditTags([...(item.tags || [])]); setNewTag(''); };
  const saveEdit = async () => { await updateItem(editingId, { title: editTitle, tags: editTags }); setEditingId(null); loadData(); };
  const addTag = () => { if (newTag.trim() && !editTags.includes(newTag.trim())) { setEditTags([...editTags, newTag.trim()]); setNewTag(''); } };
  const removeTag = (tag) => { setEditTags(editTags.filter(t => t !== tag)); };
  const handleDelete = async (id) => { Alert.alert('确认删除', '删除后不可恢复', [{ text: '取消' }, { text: '删除', style: 'destructive', onPress: async () => { await deleteItem(id); setExpandedItem(null); setEditingId(null); loadData(); } }]); };

  const renderItem = ({ item }) => {
    const expanded = expandedItem === item.id;
    const editing = editingId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: T.bgCard, borderColor: editing ? T.primary : T.primary + '30' }]}>
        <View style={styles.header}>
          {editing ? <TextInput value={editTitle} onChangeText={setEditTitle} style={[styles.input, { color: T.text, borderColor: T.border }]} />
            : <Text style={[styles.title, { color: T.text }]} numberOfLines={2}>{item.title}</Text>}
          <View style={styles.actions}>
            {editing ? (<><TouchableOpacity onPress={saveEdit}><Text style={{ color: T.success, fontSize: 13 }}>✓保存</Text></TouchableOpacity><TouchableOpacity onPress={() => setEditingId(null)}><Text style={{ color: T.textSecondary, fontSize: 13, marginLeft: 8 }}>取消</Text></TouchableOpacity></>)
              : (<><TouchableOpacity onPress={() => startEdit(item)}><Text style={{ color: T.primary, fontSize: 13 }}>编辑</Text></TouchableOpacity><TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={{ color: T.danger, fontSize: 13, marginLeft: 8 }}>删除</Text></TouchableOpacity><TouchableOpacity onPress={() => { setExpandedItem(expanded ? null : item.id); setEditingId(null); }}><Text style={{ color: T.textSecondary, fontSize: 13, marginLeft: 8 }}>{expanded ? '收起' : '展开'}</Text></TouchableOpacity></>)}
          </View>
        </View>
        <View style={styles.tags}>
          {editing ? (<>{editTags.map(tag => (<TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={[styles.tag, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 11 }}>{tag} ×</Text></TouchableOpacity>))}<TextInput value={newTag} onChangeText={setNewTag} onSubmitEditing={addTag} placeholder="新标签" placeholderTextColor={T.textSecondary} style={[styles.tagInput, { color: T.text, borderColor: T.border }]} /></>)
            : (<>{(item.tags || []).map(tag => <View key={tag} style={[styles.tag, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 11 }}>{tag}</Text></View>)}</>)}
        </View>
        {item.group && <Text style={{ color: T.textSecondary, fontSize: 11, marginTop: 4 }}>📁 {item.group || item.group_name}</Text>}
        {expanded && !editing && (
          <View style={{ marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: T.border, paddingTop: SPACING.md }}>
            {item.summary && <View style={styles.section}><Text style={{ color: T.primary, fontSize: 13, fontWeight: '600' }}>📝 总结</Text><Text style={{ color: T.text, fontSize: 14, lineHeight: 21, marginTop: 4 }}>{item.summary}</Text></View>}
            {item.annotations && <View style={styles.section}><Text style={{ color: T.success, fontSize: 13, fontWeight: '600' }}>📖 注解</Text><Text style={{ color: T.text, fontSize: 14, lineHeight: 21, marginTop: 4 }}>{item.annotations}</Text></View>}
            {item.thoughts && <View style={styles.section}><Text style={{ color: T.warning, fontSize: 13, fontWeight: '600' }}>💭 思考</Text><Text style={{ color: T.text, fontSize: 14, lineHeight: 21, marginTop: 4 }}>{item.thoughts}</Text></View>}
            <View style={styles.section}><Text style={{ color: T.textSecondary, fontSize: 13, fontWeight: '600' }}>📄 原文</Text><Text style={{ color: T.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{item.content}</Text></View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* 工具栏 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
        <Text style={{ color: T.textSecondary, fontSize: 12 }}>{filtered.length} 条</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={() => setView(view === 'list' ? 'folder' : 'list')} style={[styles.smallBtn, { backgroundColor: T.bgInput }]}><Text style={{ color: T.text, fontSize: 11 }}>{view === 'list' ? '📁' : '📋'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSort(sort === 'newest' ? 'oldest' : sort === 'oldest' ? 'alpha' : 'newest')} style={[styles.smallBtn, { backgroundColor: T.bgInput }]}><Text style={{ color: T.text, fontSize: 11 }}>{sort === 'newest' ? '最新' : sort === 'oldest' ? '最早' : 'A-Z'}</Text></TouchableOpacity>
        </View>
      </View>
      {/* 分组筛选 */}
      <FlatList horizontal data={[{ name: '全部' }, ...groups]} keyExtractor={g => g.name} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}
        renderItem={({ item: g }) => (<TouchableOpacity onPress={() => setSelectedGroup(g.name === '全部' ? null : (g.name === selectedGroup ? null : g.name))} style={[styles.chip, { backgroundColor: (g.name === '全部' && !selectedGroup) || selectedGroup === g.name ? T.primary : T.bgInput }]}><Text style={{ color: (g.name === '全部' && !selectedGroup) || selectedGroup === g.name ? '#fff' : T.text, fontSize: 13 }}>{g.name}</Text></TouchableOpacity>)} />
      {/* 内容 */}
      {view === 'folder' ? (
        <FlatList data={Object.entries(grouped)} keyExtractor={([g]) => g} contentContainerStyle={{ padding: SPACING.md, paddingTop: 0 }}
          renderItem={([group, groupItems]) => (
            <View style={[styles.folder, { backgroundColor: T.bgCard, borderColor: T.border }]}>
              <Text style={{ fontWeight: '600', color: T.text, marginBottom: SPACING.sm }}>📁 {group} ({groupItems.length})</Text>
              {groupItems.map(item => <View key={item.id}>{renderItem({ item })}</View>)}
            </View>
          )} />
      ) : (
        <FlatList data={filtered} keyExtractor={i => String(i.id)} renderItem={renderItem} contentContainerStyle={{ padding: SPACING.md, paddingTop: 0 }}
          ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 80 }}><Text style={{ fontSize: 40 }}>📚</Text><Text style={{ color: T.textSecondary, marginTop: SPACING.md }}>暂无知识</Text></View>} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 6, fontSize: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  tagInput: { width: 70, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8, maxWidth: 160, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  folder: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  section: { marginBottom: 12 },
});
