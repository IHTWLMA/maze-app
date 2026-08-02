// 知识库 - 同步桌面端功能(编辑/删除/标签管理)
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

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    const all = await getAllItems();
    setItems(all);
    const g = [...new Set(all.map(i => i.group || i.group_name).filter(Boolean))];
    setGroups(g.map(name => ({ name })));
  }

  const filtered = selectedGroup ? items.filter(i => (i.group || i.group_name) === selectedGroup) : items;

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditTags([...(item.tags || [])]);
    setNewTag('');
  };

  const saveEdit = async () => {
    await updateItem(editingId, { title: editTitle, tags: editTags });
    setEditingId(null);
    loadData();
  };

  const addTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag) => { setEditTags(editTags.filter(t => t !== tag)); };

  const handleDelete = async (id) => {
    Alert.alert('确认删除', '删除后不可恢复', [
      { text: '取消' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteItem(id); setExpandedItem(null); setEditingId(null); loadData(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <FlatList horizontal data={[{ name: '全部' }, ...groups]} keyExtractor={g => g.name}
        showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}
        renderItem={({ item: g }) => (
          <TouchableOpacity onPress={() => setSelectedGroup(g.name === '全部' ? null : (g.name === selectedGroup ? null : g.name))}
            style={[styles.chip, { backgroundColor: (g.name === '全部' && !selectedGroup) || selectedGroup === g.name ? T.primary : T.bgInput }]}>
            <Text style={{ color: (g.name === '全部' && !selectedGroup) || selectedGroup === g.name ? '#fff' : T.text, fontSize: 13, fontWeight: '500' }}>{g.name}</Text>
          </TouchableOpacity>
        )} />
      <FlatList data={filtered} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: SPACING.md, paddingTop: 0 }}
        renderItem={({ item }) => {
          const expanded = expandedItem === item.id;
          const editing = editingId === item.id;
          return (
            <View style={[styles.card, { backgroundColor: T.bgCard, borderColor: editing ? T.primary : T.primary + '30' }]}>
              <View style={styles.header}>
                {editing ? (
                  <TextInput value={editTitle} onChangeText={setEditTitle} style={[styles.input, { color: T.text, borderColor: T.border }]} />
                ) : (
                  <Text style={[styles.title, { color: T.text }]} numberOfLines={2}>{item.title}</Text>
                )}
                <View style={styles.actions}>
                  {editing ? (
                    <>
                      <TouchableOpacity onPress={saveEdit}><Text style={{ color: T.success, fontSize: 13 }}>✓保存</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingId(null)}><Text style={{ color: T.textSecondary, fontSize: 13, marginLeft: 8 }}>取消</Text></TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => startEdit(item)}><Text style={{ color: T.primary, fontSize: 13 }}>编辑</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={{ color: T.danger, fontSize: 13, marginLeft: 8 }}>删除</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setExpandedItem(expanded ? null : item.id); setEditingId(null); }}><Text style={{ color: T.textSecondary, fontSize: 13, marginLeft: 8 }}>{expanded ? '收起' : '展开'}</Text></TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.tags}>
                {editing ? (
                  <>
                    {editTags.map(tag => (
                      <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={[styles.tag, { backgroundColor: T.primaryLight }]}>
                        <Text style={{ color: T.primary, fontSize: 11 }}>{tag} ×</Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput value={newTag} onChangeText={setNewTag} onSubmitEditing={addTag}
                      placeholder="新标签" placeholderTextColor={T.textSecondary}
                      style={[styles.tagInput, { color: T.text, borderColor: T.border }]} />
                  </>
                ) : (
                  (item.tags || []).map(tag => (
                    <View key={tag} style={[styles.tag, { backgroundColor: T.primaryLight }]}><Text style={{ color: T.primary, fontSize: 11 }}>{tag}</Text></View>
                  ))
                )}
              </View>
              {item.group && <Text style={{ color: T.textSecondary, fontSize: 11, marginTop: 4 }}>📁 {item.group}</Text>}
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
        }}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 80 }}><Text style={{ fontSize: 40 }}>📚</Text><Text style={{ color: T.textSecondary, marginTop: SPACING.md }}>暂无知识</Text></View>} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 6, fontSize: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  tagInput: { width: 70, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  section: { marginBottom: 12 },
});
