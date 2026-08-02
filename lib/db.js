// 数据库模块 - 本地存储+WiFi自动同步
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db = null;
const API_BASE = 'http://192.168.0.213:8099';

// 检测是否能连接到桌面端API
async function canSync() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/api/knowledge`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch { return false; }
}

// 同步到桌面端
async function syncToDesktop() {
  try {
    const database = await getDB();
    const all = await database.getAllAsync('SELECT * FROM items WHERE synced = 0');
    for (const item of all) {
      await fetch(`${API_BASE}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title, content: item.content, summary: item.summary || '',
          annotations: item.annotations || '', thoughts: item.thoughts || '',
          tags: JSON.parse(item.tags || '[]'), group: item.group_name || '未分类'
        })
      });
      await database.runAsync('UPDATE items SET synced = 1 WHERE id = ?', [item.id]);
    }
    // 从桌面端拉取新数据
    const res = await fetch(`${API_BASE}/api/knowledge`);
    const data = await res.json();
    for (const serverItem of (data.items || [])) {
      const exists = await database.getFirstAsync('SELECT id FROM items WHERE remote_id = ?', [String(serverItem.id)]);
      if (!exists) {
        await database.runAsync(
          `INSERT INTO items (remote_id, title, content, summary, annotations, thoughts, tags, group_name, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [String(serverItem.id), serverItem.title, serverItem.content, serverItem.summary || '',
           serverItem.annotations || '', serverItem.thoughts || '',
           JSON.stringify(serverItem.tags || []), serverItem.group || '未分类']
        );
      }
    }
    return true;
  } catch { return false; }
}

async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('maze.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        remote_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT DEFAULT '',
        annotations TEXT DEFAULT '',
        thoughts TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        group_name TEXT DEFAULT '未分类',
        synced INTEGER DEFAULT 0,
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
  // 尝试同步
  canSync().then(ok => { if (ok) syncToDesktop(); });
  return result.lastInsertRowId;
}

export async function updateItem(id, updates) {
  const database = await getDB();
  const fields = []; const values = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.summary !== undefined) { fields.push('summary = ?'); values.push(updates.summary); }
  if (updates.group !== undefined) { fields.push('group_name = ?'); values.push(updates.group); }
  fields.push("synced = 0"); fields.push("updated_at = datetime('now')");
  values.push(id);
  await database.runAsync(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
  canSync().then(ok => { if (ok) syncToDesktop(); });
}

export async function deleteItem(id) {
  const database = await getDB();
  await database.runAsync('DELETE FROM items WHERE id = ?', [id]);
  canSync().then(ok => { if (ok) syncToDesktop(); });
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
  const ok = await canSync();
  if (!ok) return { ok: false, msg: '未识别到桌面端数据' };
  const result = await syncToDesktop();
  return { ok: result, msg: result ? '同步成功' : '同步失败' };
}

// 自动同步(每30秒检测一次)
let syncInterval = null;
export function startAutoSync() {
  if (syncInterval) return;
  syncInterval = setInterval(async () => {
    const ok = await canSync();
    if (ok) await syncToDesktop();
  }, 30000);
}
