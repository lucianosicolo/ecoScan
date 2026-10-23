"""Isolated HTTP fixture for EcoScan Android functional smoke tests.

This never calls Gemini or writes to production. It returns clearly synthetic scan data.
"""
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import base64
import json
import os
import threading

PORT = 3000
OUT = Path("android-feature-audit")
OUT.mkdir(exist_ok=True)
REPORT = OUT / "requests.jsonl"
LOCK = threading.Lock()
USER = {
    "id": 42, "nombre": "Luciano", "apellido": "Prueba",
    "email": "test@ecoscan.local", "ciudad": "Cipolletti",
    "createdAt": "2026-10-20T12:00:00.000Z",
}
HISTORY = []
RESULT = {
    "categoria": "plastico",
    "objeto": "Botella de bebida (PRUEBA SIMULADA)",
    "material": "Plástico compatible con PET (simulado)",
    "reciclable": True,
    "estado": "apto",
    "confianza": 89,
    "preparacion": ["Vaciar el envase", "Enjuagar y dejar secar"],
    "observacion": "Dato simulado para comprobar el flujo técnico; no confirma precisión de Gemini.",
    "imagenUrl": None
}

def token():
    def encode(obj):
        return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip("=")
    return encode({"alg": "HS256", "typ": "JWT"}) + "." + encode({
        "sub": USER["id"], "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }) + ".placeholder_signature"

def record(verb, endpoint, headers, length):
    with LOCK:
        with REPORT.open("a", encoding="utf-8") as f:
            f.write(json.dumps({
                "method": verb, "path": endpoint,
                "length": length,
                "hasAuth": bool(headers.get("Authorization")),
                "contentType": headers.get("Content-Type", "")
            }, ensure_ascii=False) + "\n")

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Cache-Control", "no-cache")
    def send_json(self, obj, status=200):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()
    def do_GET(self):
        path = urlsplit(self.path).path
        record("GET", path, self.headers, 0)
        if path == "/health":
            return self.send_json({"status": "ok", "mock": True})
        if path == "/historial":
            return self.send_json(list(reversed(HISTORY)))
        if path.startswith("/historial/"):
            try:
                item = next(x for x in HISTORY if x["id"] == int(path.split("/")[-1]))
                return self.send_json(item)
            except Exception:
                return self.send_json({"message": "No existe"}, 404)
        if path.startswith("/users/"):
            return self.send_json(USER)
        return self.send_json({"message": "Ruta simulada no encontrada"}, 404)
    def do_POST(self):
        path = urlsplit(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length > 0 else b""
        record("POST", path, self.headers, length)
        if path == "/auth/login":
            try:
                obj = json.loads(body)
            except Exception:
                return self.send_json({"message": "JSON inválido"}, 400)
            if obj.get("email", "").lower() != USER["email"] or obj.get("password") != "Prueba123!":
                return self.send_json({"message": "Credenciales de prueba incorrectas"}, 401)
            return self.send_json({"accessToken": token(), "user": USER})
        if path == "/scan":
            if not self.headers.get("Authorization"):
                return self.send_json({"message": "Sin token"}, 401)
            if "image" not in body.decode("latin-1", errors="ignore")[:500]:
                return self.send_json({"message": "No se recibió campo image"}, 422)
            row = {
                **RESULT, "id": len(HISTORY)+1,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
            HISTORY.append(row)
            return self.send_json(RESULT)
        return self.send_json({"message": "Ruta simulada no implementada"}, 404)
    def do_DELETE(self):
        path = urlsplit(self.path).path
        record("DELETE", path, self.headers, 0)
        if path.startswith("/historial/"):
            try:
                idx = int(path.split("/")[-1])
                HISTORY[:] = [item for item in HISTORY if item["id"] != idx]
                return self.send_json({})
            except ValueError:
                pass
        return self.send_json({"message":"No existe"},404)

if __name__ == "__main__":
    print("MOCK_BACKEND_READY 127.0.0.1:3000", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
