# -*- coding: utf-8 -*-
"""知识库API服务器 - 完整CRUD"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime

KB_FILE = Path(__file__).parent / "data" / "knowledge.json"
KB_FILE.parent.mkdir(parents=True, exist_ok=True)

def load():
    if KB_FILE.exists():
        with open(KB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"items": [], "groups": [], "next_id": 1}

def save(data):
    with open(KB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class Handler(BaseHTTPRequestHandler):
    def _json(self, code, obj):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        self._json(200, {})

    def do_GET(self):
        if self.path == "/api/knowledge":
            self._json(200, load())
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/knowledge":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            kb = load()
            item = {k: v for k, v in body.items() if k != "id"}
            item["id"] = kb["next_id"]
            item["created_at"] = datetime.now().isoformat()
            item["status"] = item.get("status", "processed")
            kb["items"].insert(0, item)
            kb["next_id"] += 1
            save(kb)
            self._json(201, {"id": item["id"]})
        elif self.path == "/api/knowledge/import":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            kb = load()
            count = 0
            for item in body.get("items", []):
                item["id"] = kb["next_id"]
                item["created_at"] = item.get("created_at", datetime.now().isoformat())
                kb["items"].insert(0, item)
                kb["next_id"] += 1
                count += 1
            save(kb)
            self._json(200, {"count": count})
        elif self.path.startswith("/api/knowledge/") and self.path.endswith("/export"):
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            kb = load()
            ids = body.get("ids", [])
            items = [i for i in kb["items"] if i["id"] in ids] if ids else kb["items"]
            self._json(200, {"items": items})
        else:
            self._json(404, {"error": "not found"})

    def do_PUT(self):
        if self.path.startswith("/api/knowledge/") and self.path != "/api/knowledge/import":
            try:
                item_id = int(self.path.split("/")[-1])
            except ValueError:
                self._json(400, {"error": "invalid id"})
                return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            kb = load()
            for item in kb["items"]:
                if item["id"] == item_id:
                    item.update(body)
                    save(kb)
                    self._json(200, {"ok": True})
                    return
            self._json(404, {"error": "not found"})
        else:
            self._json(404, {"error": "not found"})

    def do_DELETE(self):
        if self.path.startswith("/api/knowledge/"):
            try:
                item_id = int(self.path.split("/")[-1])
            except ValueError:
                self._json(400, {"error": "invalid id"})
                return
            kb = load()
            kb["items"] = [i for i in kb["items"] if i["id"] != item_id]
            save(kb)
            self._json(200, {"ok": True})
        else:
            self._json(404, {"error": "not found"})

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8099), Handler)
    print("API服务器启动: http://127.0.0.1:8099")
    server.serve_forever()
