# -*- coding: utf-8 -*-
"""
知识库管理工具 - Hermes Agent 直接调用
用法: python knowledge.py add "标题" "内容" --tags "AI,设计" --group "技术"
      python knowledge.py list
      python knowledge.py search "关键词"
      python knowledge.py export
"""
import json
import sys
import os
from pathlib import Path
from datetime import datetime

DB_DIR = Path(os.environ.get("KNOWLEDGE_DIR", r"C:\Users\WenPeng Huang\knowledge-sink\data"))
DB_DIR.mkdir(parents=True, exist_ok=True)
KB_FILE = DB_DIR / "knowledge.json"

def load_kb():
    if KB_FILE.exists():
        with open(KB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"items": [], "groups": [], "conflicts": [], "next_id": 1}

def save_kb(kb):
    with open(KB_FILE, "w", encoding="utf-8") as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)

def add_item(title, content, summary=None, annotations=None, thoughts=None, tags=None, group=None, source="chat"):
    kb = load_kb()
    item = {
        "id": kb["next_id"],
        "title": title,
        "content": content,
        "summary": summary or content,
        "annotations": annotations or "",
        "thoughts": thoughts or "",
        "tags": tags or [],
        "group": group or "未分类",
        "source": source,
        "status": "processed",
        "created_at": datetime.now().isoformat(),
    }
    kb["items"].insert(0, item)
    kb["next_id"] += 1

    # 自动分组
    if group and group not in [g["name"] for g in kb["groups"]]:
        kb["groups"].append({"name": group, "color": "#2563EB"})

    save_kb(kb)
    print(f"✅ 已添加: [{item['id']}] {title[:40]} | 标签:{tags} | 分组:{group}")
    return item["id"]

def list_items(limit=20):
    kb = load_kb()
    items = kb["items"][:limit]
    print(f"📚 知识库共 {len(kb['items'])} 条\n")
    for item in items:
        tags_str = " ".join([f"[{t}]" for t in item.get("tags", [])])
        print(f"  [{item['id']}] {item['title'][:45]}")
        print(f"       分组:{item.get('group','?')} | {tags_str}")
        if item.get("summary"):
            print(f"       📝 {item['summary'][:60]}...")
        print()

def search(query):
    kb = load_kb()
    results = [i for i in kb["items"] if query.lower() in (i["title"]+i["content"]+i.get("summary","")+" ".join(i.get("tags",[]))).lower()]
    print(f"🔍 搜索'{query}': {len(results)}条\n")
    for item in results[:10]:
        print(f"  [{item['id']}] {item['title'][:50]} | {item.get('group','?')}")

def export_md():
    kb = load_kb()
    md = "# Maze 知识导出\\n\\n"
    for item in kb["items"]:
        md += f"## {item['title']}\n\n"
        if item.get("tags"): md += f"标签: {', '.join(item['tags'])}\n\n"
        if item.get("summary"): md += f"### 总结\n{item['summary']}\n\n"
        if item.get("annotations"): md += f"### 注解\n{item['annotations']}\n\n"
        if item.get("thoughts"): md += f"### 思考\n{item['thoughts']}\n\n"
        md += f"### 原文\n{item['content']}\n\n---\n\n"
    out = DB_DIR / "export.md"
    with open(out, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"📤 已导出 {len(kb['items'])} 条到 {out}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    if cmd == "add":
        add_item(sys.argv[2], sys.argv[3],
                 tags=json.loads(sys.argv[4]) if len(sys.argv) > 4 else [],
                 group=sys.argv[5] if len(sys.argv) > 5 else None)
    elif cmd == "list": list_items()
    elif cmd == "search": search(sys.argv[2])
    elif cmd == "export": export_md()
    else: print("用法: python knowledge.py add/list/search/export")
