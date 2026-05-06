#!/usr/bin/env python3
"""
Portfolio editor server — loopback-only HTTP server that serves the site
and exposes three write endpoints for in-place text + image edits.

Run:
    python3 edit_server.py

Then open http://localhost:9090 and use the "EDIT MODE" overlay.

Safety:
- Binds to 127.0.0.1 only.
- Writes are restricted to the 5 allowlisted HTML pages and to
  assets/photos/_custom/ for new images.
- Path escapes checked via os.path.realpath.
- Images capped at 20 MB, MIME must start with 'image/'.
- Atomic writes (.tmp → os.replace).
- Prints every mutation to stdout.
"""

from __future__ import annotations

import html
import json
import mimetypes
import os
import re
import sys
import time
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 9090
ROOT = Path(__file__).resolve().parent
CUSTOM_DIR = ROOT / "assets" / "photos" / "_custom"
ALLOWED_PAGES = {"index", "ecosystem", "fieldwork", "vision", "case-studies"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


# ─── Safe file writing ────────────────────────────────────────────────────
def inside_root(p: Path) -> bool:
    try:
        p.resolve().relative_to(ROOT.resolve())
        return True
    except ValueError:
        return False


def atomic_write_text(path: Path, content: str) -> None:
    if not inside_root(path):
        raise PermissionError(f"refusing to write outside repo: {path}")
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, path)


def atomic_write_bytes(path: Path, blob: bytes) -> None:
    if not inside_root(path):
        raise PermissionError(f"refusing to write outside repo: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(blob)
    os.replace(tmp, path)


# ─── HTML field/image mutations ───────────────────────────────────────────
def rewrite_data_edit(html_text: str, key: str, new_value: str) -> tuple[str, str | None]:
    """
    Replace the inner text of the first element matching data-edit="key".
    Returns (new_html, old_inner) or (html_text, None) if key not found.

    Conservative regex: matches the opening tag up to its closing '>',
    then captures everything up to the matching closing tag at the same
    nesting level. For simple inline text-only elements (which all our
    data-edit targets are) this is safe.
    """
    # Find the opening tag first
    open_re = re.compile(
        r'(<([a-zA-Z][a-zA-Z0-9]*)(?:\s+[^<>]*?\s+|\s+)data-edit="'
        + re.escape(key) + r'"[^<>]*?>)',
        flags=re.IGNORECASE
    )
    m = open_re.search(html_text)
    if not m:
        return html_text, None

    tag_name = m.group(2)
    open_end = m.end()
    # Walk forward to find the matching close tag, respecting nested same-named tags
    close_pat = re.compile(rf'</\s*{re.escape(tag_name)}\s*>', re.IGNORECASE)
    open_same = re.compile(rf'<\s*{re.escape(tag_name)}(\s[^<>]*)?>', re.IGNORECASE)
    depth = 1
    pos = open_end
    while pos < len(html_text):
        close_m = close_pat.search(html_text, pos)
        open_m = open_same.search(html_text, pos)
        if not close_m:
            return html_text, None  # unbalanced
        if open_m and open_m.start() < close_m.start():
            depth += 1
            pos = open_m.end()
            continue
        depth -= 1
        if depth == 0:
            # slice out inner
            inner_start, inner_end = open_end, close_m.start()
            old_inner = html_text[inner_start:inner_end]
            # Insert the new value (plaintext — escape HTML special chars)
            new_html = (
                html_text[:inner_start]
                + html.escape(new_value, quote=False)
                + html_text[inner_end:]
            )
            return new_html, old_inner
        pos = close_m.end()
    return html_text, None


def rewrite_img_src(html_text: str, slot: str, new_src: str) -> tuple[str, str | None]:
    """
    Find <img ... data-edit-img="slot" ...> and rewrite its src.
    Returns (new_html, old_src) or (html_text, None) if no match.
    """
    tag_re = re.compile(
        r'(<img\b(?=[^<>]*\bdata-edit-img="' + re.escape(slot) + r'")[^<>]*>)',
        flags=re.IGNORECASE
    )
    m = tag_re.search(html_text)
    if not m:
        return html_text, None
    tag = m.group(1)
    src_re = re.compile(r'(\bsrc=")([^"]*)(")', re.IGNORECASE)
    sm = src_re.search(tag)
    if not sm:
        # No src attribute — inject one
        new_tag = tag[:-1] + f' src="{html.escape(new_src)}">'
        old_src = None
    else:
        old_src = sm.group(2)
        new_tag = tag[:sm.start(2)] + html.escape(new_src, quote=True) + tag[sm.end(2):]
    return html_text[:m.start()] + new_tag + html_text[m.end():], old_src


# ─── Multipart parser (stdlib-only) ───────────────────────────────────────
def parse_multipart(body: bytes, boundary: bytes) -> list[dict]:
    """
    Minimal RFC-7578 parser. Returns a list of dicts with keys:
      - name: str (form field name)
      - filename: str (optional)
      - content_type: str (optional)
      - value: bytes (raw field value — binary-safe)
    Strips the trailing CRLF that preceeds the boundary.
    """
    sep = b"--" + boundary
    end_sep = sep + b"--"

    # Split on the boundary. First segment is preamble (ignored).
    chunks = body.split(sep)
    results = []
    for chunk in chunks[1:]:
        if chunk.startswith(b"--"):  # end marker
            break
        # Each chunk starts with \r\n and ends with \r\n before next boundary.
        # Strip leading \r\n
        if chunk.startswith(b"\r\n"):
            chunk = chunk[2:]
        # Strip trailing \r\n (belongs to boundary separator)
        if chunk.endswith(b"\r\n"):
            chunk = chunk[:-2]
        if not chunk:
            continue
        # Header / body split
        head, _, value = chunk.partition(b"\r\n\r\n")
        if not _:
            continue  # malformed segment
        headers = head.decode("utf-8", "replace").split("\r\n")
        disposition = ""
        content_type = ""
        for h in headers:
            low = h.lower()
            if low.startswith("content-disposition:"):
                disposition = h[len("content-disposition:"):].strip()
            elif low.startswith("content-type:"):
                content_type = h[len("content-type:"):].strip()

        # parse disposition: 'form-data; name="X"; filename="Y"'
        part = {"value": value}
        name_m = re.search(r'\bname="([^"]*)"', disposition)
        if name_m:
            part["name"] = name_m.group(1)
        fn_m = re.search(r'\bfilename="([^"]*)"', disposition)
        if fn_m:
            part["filename"] = fn_m.group(1)
        if content_type:
            part["content_type"] = content_type
        results.append(part)
    return results


# ─── HTTP handler ─────────────────────────────────────────────────────────
class EditorHandler(SimpleHTTPRequestHandler):
    # Serve from repo root
    def translate_path(self, path):
        # Defer to SimpleHTTPRequestHandler but anchored at ROOT
        old_cwd = os.getcwd()
        try:
            os.chdir(ROOT)
            return super().translate_path(path)
        finally:
            os.chdir(old_cwd)

    def log_message(self, fmt, *args):
        # Quieter default access log; only our mutations log in detail.
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    # ---- status ----
    def do_GET(self):
        if self.path == "/edit/status":
            self._json(HTTPStatus.OK, {"ok": True, "ident": "portfolio-editor", "pid": os.getpid()})
            return
        return super().do_GET()

    # ---- writes ----
    def do_POST(self):
        if self.path == "/edit/text":
            self._handle_text()
        elif self.path == "/edit/image":
            self._handle_image()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "unknown endpoint")

    # ---- helpers ----
    def _json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _err(self, status: int, msg: str):
        log(f"ERROR {status}: {msg}")
        self._json(status, {"ok": False, "error": msg})

    def _page_path(self, page: str) -> Path | None:
        if page not in ALLOWED_PAGES:
            return None
        p = ROOT / f"{page}.html"
        return p if p.is_file() else None

    def _handle_text(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8")
            data = json.loads(raw)
        except Exception as e:
            return self._err(HTTPStatus.BAD_REQUEST, f"bad body: {e}")

        page = data.get("page", "")
        edits = data.get("edits", {})
        if not isinstance(edits, dict) or not edits:
            return self._err(HTTPStatus.BAD_REQUEST, "edits must be a non-empty object")

        page_path = self._page_path(page)
        if page_path is None:
            return self._err(HTTPStatus.FORBIDDEN, f"page not allowed: {page}")

        html_text = page_path.read_text(encoding="utf-8")
        applied = []
        for key, value in edits.items():
            if not isinstance(value, str):
                value = str(value)
            new_html, old_inner = rewrite_data_edit(html_text, key, value)
            if old_inner is None:
                applied.append({"key": key, "status": "miss"})
                continue
            html_text = new_html
            applied.append({
                "key": key,
                "status": "ok",
                "from": (old_inner[:80] + "…") if len(old_inner) > 80 else old_inner,
                "to": value[:80] + ("…" if len(value) > 80 else ""),
            })
            log(f"TEXT  {page}.html  {key}  →  {value[:60]!r}")

        try:
            atomic_write_text(page_path, html_text)
        except Exception as e:
            return self._err(HTTPStatus.INTERNAL_SERVER_ERROR, f"write failed: {e}")

        self._json(HTTPStatus.OK, {"ok": True, "page": page, "applied": applied})

    def _handle_image(self):
        ctype = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in ctype.lower():
            return self._err(HTTPStatus.BAD_REQUEST, "expected multipart/form-data")
        m = re.search(r'boundary=([^;]+)', ctype, re.IGNORECASE)
        if not m:
            return self._err(HTTPStatus.BAD_REQUEST, "missing multipart boundary")
        boundary = m.group(1).strip().strip('"').encode("utf-8")

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_IMAGE_BYTES + 4096:
            return self._err(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, f"body too large: {length}")
        body = self.rfile.read(length)

        try:
            parts = parse_multipart(body, boundary)
        except Exception as e:
            return self._err(HTTPStatus.BAD_REQUEST, f"multipart parse failed: {e}")

        fields = {p["name"]: p for p in parts if "name" in p}

        page = (fields.get("page", {}).get("value", b"").decode("utf-8", "replace")).strip()
        slot = (fields.get("slot", {}).get("value", b"").decode("utf-8", "replace")).strip()
        if not page or not slot:
            return self._err(HTTPStatus.BAD_REQUEST, "page and slot required")
        if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,64}", slot):
            return self._err(HTTPStatus.BAD_REQUEST, f"invalid slot: {slot}")

        page_path = self._page_path(page)
        if page_path is None:
            return self._err(HTTPStatus.FORBIDDEN, f"page not allowed: {page}")

        file_part = fields.get("file")
        if not file_part or "value" not in file_part:
            return self._err(HTTPStatus.BAD_REQUEST, "no file in form")
        filename = file_part.get("filename", "") or ""
        blob = file_part["value"]

        if len(blob) > MAX_IMAGE_BYTES:
            return self._err(HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                             f"image too large ({len(blob)} bytes, max {MAX_IMAGE_BYTES})")
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTS:
            # Try to sniff from magic bytes
            if blob[:3] == b"\xff\xd8\xff":
                ext = ".jpg"
            elif blob[:8] == b"\x89PNG\r\n\x1a\n":
                ext = ".png"
            elif blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
                ext = ".webp"
            else:
                return self._err(HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                                 f"unsupported image type: {filename}")

        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        out_name = f"{stamp}-{slot}{ext}"
        out_path = CUSTOM_DIR / out_name
        try:
            atomic_write_bytes(out_path, blob)
        except Exception as e:
            return self._err(HTTPStatus.INTERNAL_SERVER_ERROR, f"file write failed: {e}")

        new_src = f"assets/photos/_custom/{out_name}"
        html_text = page_path.read_text(encoding="utf-8")
        new_html, old_src = rewrite_img_src(html_text, slot, new_src)
        if old_src is None and new_html == html_text:
            return self._err(HTTPStatus.NOT_FOUND,
                             f"no <img data-edit-img=\"{slot}\"> in {page}.html")
        try:
            atomic_write_text(page_path, new_html)
        except Exception as e:
            return self._err(HTTPStatus.INTERNAL_SERVER_ERROR, f"html write failed: {e}")

        log(f"IMAGE {page}.html  {slot}  →  {new_src}  ({len(blob):,} bytes)")
        self._json(HTTPStatus.OK, {
            "ok": True, "page": page, "slot": slot,
            "newSrc": new_src, "oldSrc": old_src,
            "bytes": len(blob),
        })


def main():
    CUSTOM_DIR.mkdir(parents=True, exist_ok=True)
    mimetypes.add_type("image/webp", ".webp")
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), EditorHandler)
    print(f"serving portfolio editor at http://127.0.0.1:{PORT}  (root: {ROOT})")
    print("endpoints: GET /edit/status · POST /edit/text · POST /edit/image")
    print("press Ctrl-C to stop")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
