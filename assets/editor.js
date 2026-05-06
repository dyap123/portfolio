/*
 * Portfolio editor overlay — activates ONLY when the edit server
 * (edit_server.py) responds on /edit/status. On GitHub Pages or under
 * plain `python3 -m http.server` this file does nothing.
 */
(function () {
  'use strict';

  const PAGE = (() => {
    const name = location.pathname.split('/').pop() || 'index.html';
    return name.replace(/\.html?$/, '') || 'index';
  })();

  // ─── Probe server ────────────────────────────────────────────
  async function probe() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 900);
      const r = await fetch('/edit/status', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (!r.ok) return false;
      const j = await r.json();
      return !!(j && j.ok);
    } catch { return false; }
  }

  probe().then(active => { if (active) boot(); });

  // ─── Boot editor UI ──────────────────────────────────────────
  function boot() {
    injectStyles();
    injectChip();
    wireText();
    wireImages();
    wireHotkeys();
    toast('edit mode · live', 'info', 1800);
  }

  function injectStyles() {
    const css = `
      .fp-edit-chip {
        position: fixed; top: 96px; right: 24px; z-index: 80;
        padding: 9px 14px; background: rgba(14,13,21,0.92);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(217,185,255,0.35); border-radius: 999px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
        color: #d9b9ff; display: inline-flex; align-items: center; gap: 9px;
        box-shadow: 0 10px 24px rgba(217,185,255,0.18);
      }
      .fp-edit-chip .d {
        width: 8px; height: 8px; border-radius: 50%;
        background: #d9b9ff; box-shadow: 0 0 10px rgba(217,185,255,0.55);
        animation: fp-pulse 1.6s ease-in-out infinite;
      }
      @keyframes fp-pulse {
        0%, 100% { opacity: 0.6; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      [data-edit] { cursor: text; transition: background 0.15s, outline-color 0.15s; border-radius: 3px; }
      [data-edit]:hover { outline: 1.2px dashed rgba(217,185,255,0.45); outline-offset: 3px; }
      [data-edit]:focus { outline: 2px solid #d9b9ff; outline-offset: 3px; background: rgba(217,185,255,0.07); }
      [data-edit-img] { transition: outline-color 0.2s, filter 0.2s, box-shadow 0.25s; }
      [data-edit-img]:hover { outline: 1.5px dashed rgba(217,185,255,0.45); outline-offset: 3px; cursor: copy; }
      .fp-drop-active { outline: 2.5px solid #d9b9ff !important; outline-offset: 4px !important; box-shadow: 0 0 26px rgba(217,185,255,0.45); }
      .fp-drop-active::after {
        content: "drop to replace"; position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
        color: #d9b9ff; background: rgba(14,13,21,0.55); backdrop-filter: blur(2px); pointer-events: none;
      }
      .fp-toast-stack {
        position: fixed; bottom: 22px; right: 22px; z-index: 100;
        display: flex; flex-direction: column; gap: 8px; max-width: 380px;
      }
      .fp-toast {
        background: rgba(14,13,21,0.95); backdrop-filter: blur(14px);
        border: 1px solid rgba(217,185,255,0.3); border-radius: 6px;
        color: #e4e1ec; padding: 10px 14px;
        font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.08em;
        box-shadow: 0 12px 30px rgba(0,0,0,0.45);
        animation: fp-toast-in 0.25s cubic-bezier(.22,.8,.3,1);
      }
      .fp-toast b { color: #d9b9ff; font-weight: 700; }
      .fp-toast.error { border-color: rgba(229,73,73,0.55); color: #ffb6b6; }
      .fp-toast.success { border-color: rgba(61,220,132,0.5); }
      @keyframes fp-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    `;
    const style = document.createElement('style');
    style.id = 'fp-editor-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectChip() {
    // Reuse the existing editBtn if present, otherwise inject a fresh chip
    const existing = document.getElementById('editBtn');
    if (existing) {
      existing.className = 'fp-edit-chip';
      existing.innerHTML = '<span class="d"></span>EDIT MODE · live';
      existing.onclick = () => toast(`page: ${PAGE}.html · direct edits → disk`, 'info');
    } else {
      const chip = document.createElement('div');
      chip.className = 'fp-edit-chip';
      chip.innerHTML = '<span class="d"></span>EDIT MODE · live';
      document.body.appendChild(chip);
    }

    const stack = document.createElement('div');
    stack.className = 'fp-toast-stack';
    stack.id = 'fp-toast-stack';
    document.body.appendChild(stack);
  }

  // ─── Toasts ──────────────────────────────────────────────────
  function toast(msg, kind = 'info', ms = 3200) {
    const stack = document.getElementById('fp-toast-stack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'fp-toast' + (kind ? ' ' + kind : '');
    t.innerHTML = msg;
    stack.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(6px)';
      t.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => t.remove(), 220);
    }, ms);
  }

  // ─── Text editing ────────────────────────────────────────────
  function wireText() {
    document.querySelectorAll('[data-edit]').forEach(el => {
      // Don't wire if inside something that shouldn't be edited
      el.setAttribute('contenteditable', 'plaintext-only');
      el.spellcheck = false;

      let original = el.innerText;
      el.addEventListener('focus', () => { original = el.innerText; });
      el.addEventListener('keydown', e => {
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault();
          el.blur();
        }
        if (e.key === 'Escape') {
          el.innerText = original;
          el.blur();
        }
      });
      el.addEventListener('blur', () => {
        const next = el.innerText.trim();
        if (next === original.trim()) return;
        saveText(el.dataset.edit, next).catch(err => {
          toast(`❌ text save failed — ${err.message}`, 'error', 5000);
          el.innerText = original;
        });
      });
    });
  }

  async function saveText(key, value) {
    const r = await fetch('/edit/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: PAGE, edits: { [key]: value } }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || ('http ' + r.status));
    const hit = (j.applied || []).find(a => a.key === key);
    if (!hit || hit.status !== 'ok') {
      toast(`⚠️ no element matched <b>${key}</b> in ${PAGE}.html`, 'error', 4500);
      return;
    }
    toast(`✓ saved → <b>${key}</b> · ${PAGE}.html`, 'success', 2200);
  }

  // ─── Image drag-drop + click-to-pick ─────────────────────────
  let _pickInput = null;
  function ensurePicker() {
    if (_pickInput) return _pickInput;
    _pickInput = document.createElement('input');
    _pickInput.type = 'file';
    _pickInput.accept = 'image/jpeg,image/png,image/webp,image/jpg';
    _pickInput.style.display = 'none';
    document.body.appendChild(_pickInput);
    return _pickInput;
  }

  function wireImages() {
    document.querySelectorAll('[data-edit-img]').forEach(img => {
      attachDrop(img);
      attachClick(img);
    });
    // Also catch .visual wrappers as drop targets so the overlay text shows
    document.querySelectorAll('.story .visual').forEach(v => v.style.position = 'relative');
  }

  function attachClick(img) {
    img.addEventListener('click', e => {
      // ignore clicks that bubble from any contenteditable child or modifier-clicks (lightbox etc.)
      if (e.target !== img) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      const inp = ensurePicker();
      inp.value = '';
      inp.onchange = async () => {
        const file = inp.files && inp.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast(`❌ not an image — ${file.type || 'unknown'}`, 'error'); return; }
        if (file.size > 20 * 1024 * 1024) { toast(`❌ image too large (${(file.size/1024/1024).toFixed(1)}MB, max 20)`, 'error', 5000); return; }
        try { await uploadImage(img, file); }
        catch (err) { toast(`❌ upload failed — ${err.message}`, 'error', 5500); }
      };
      inp.click();
    }, true); // capture so lightbox listeners don't swallow first
  }

  function attachDrop(img) {
    // Wrap the image's parent so the ::after hint has a positioning context
    const host = img.parentElement;
    if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const onOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; host.classList.add('fp-drop-active'); };
    const onLeave = () => host.classList.remove('fp-drop-active');
    const onDrop = async (e) => {
      e.preventDefault();
      host.classList.remove('fp-drop-active');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) { toast('❌ no file detected', 'error'); return; }
      if (!file.type.startsWith('image/')) { toast(`❌ not an image — ${file.type || 'unknown'}`, 'error'); return; }
      if (file.size > 20 * 1024 * 1024) { toast(`❌ image too large (${(file.size/1024/1024).toFixed(1)}MB, max 20)`, 'error', 5000); return; }
      try {
        await uploadImage(img, file);
      } catch (err) {
        toast(`❌ upload failed — ${err.message}`, 'error', 5500);
      }
    };

    host.addEventListener('dragenter', onOver);
    host.addEventListener('dragover', onOver);
    host.addEventListener('dragleave', onLeave);
    host.addEventListener('drop', onDrop);
  }

  async function uploadImage(img, file) {
    const slot = img.dataset.editImg;
    const form = new FormData();
    form.append('page', PAGE);
    form.append('slot', slot);
    form.append('file', file, file.name || 'drop.jpg');

    const r = await fetch('/edit/image', { method: 'POST', body: form });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || ('http ' + r.status));

    // Hot-swap without full reload. Add a cachebust so the browser grabs the new bytes.
    const bust = Date.now();
    img.src = j.newSrc + '?v=' + bust;
    toast(`✓ saved → <b>${slot}</b> · ${(j.bytes/1024).toFixed(0)}KB`, 'success', 2400);
  }

  // ─── Hotkeys ────────────────────────────────────────────────
  function wireHotkeys() {
    document.addEventListener('keydown', e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        // If a data-edit element is currently focused, blur it to flush.
        const active = document.activeElement;
        if (active && active.hasAttribute && active.hasAttribute('data-edit')) {
          active.blur();
        } else {
          toast('cmd-s noted · changes save on blur', 'info', 1500);
        }
      }
    });
  }
})();
