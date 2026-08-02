// 数据库模块 - 纯本地SQLite,完全离线
import * as SQLite from 'expo-sqlite';

let db = null;

async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('maze.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT DEFAULT '',
        annotations TEXT DEFAULT '',
        thoughts TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        group_name TEXT DEFAULT '未分类',
        source TEXT DEFAULT 'local',
        status TEXT DEFAULT 'processed',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}

export async function getAllItems() {
  const database = await getDB();
  const rows = await database.getAllAsync('SELECT * FROM items ORDER BY created_at DESC');
  return rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [], group: r.group_name }));
}

export async function addItem(title, content, summary, annotations, thoughts, tags, group) {
  const database = await getDB();
  const result = await database.runAsync(
    'INSERT INTO items (title, content, summary, annotations, thoughts, tags, group_name) VALUES (?,?,?,?,?,?,?)',
    [title, content, summary || '', annotations || '', thoughts || '', JSON.stringify(tags || []), group || '未分类']
  );
  return result.lastInsertRowId;
}

export async function updateItem(id, updates) {
  const database = await getDB();
  const fields = []; const values = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.summary !== undefined) { fields.push('summary = ?'); values.push(updates.summary); }
  if (updates.group !== undefined) { fields.push('group_name = ?'); values.push(updates.group); }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await database.runAsync(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteItem(id) {
  const database = await getDB();
  await database.runAsync('DELETE FROM items WHERE id = ?', [id]);
}

export async function searchItems(query) {
  const items = await getAllItems();
  const q = query.toLowerCase();
  return items.filter(i => (i.title + i.content + i.summary + (i.tags||[]).join('') + (i.group||'')).toLowerCase().includes(q));
}

export async function getItemsByGroup(groupName) {
  const items = await getAllItems();
  return items.filter(i => i.group === groupName);
}

export async function getAllGroups() {
  const items = await getAllItems();
  const g = [...new Set(items.map(i => i.group).filter(Boolean))];
  return g.map(name => ({ name }));
}

export async function manualSync() {
  return { ok: false, msg: '离线模式,无需同步' };
}

export function startAutoSync() {}
