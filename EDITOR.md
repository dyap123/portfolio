# Portfolio Editor

Local edit mode: drag-and-drop photos into slots, click text to rewrite it — straight to disk.

## Run

```bash
cd ~/portfolio
python3 edit_server.py
```

Then open **http://localhost:9090** (note the **9090**, not 8790).

You should see a pulsing **● EDIT MODE · live** chip in the top-right.

## What you can edit

### Text
Anything with a dashed purple outline on hover. Click → type → Tab or Enter or click away. A toast pops up when it saves to disk.

Shortcuts:
- `Enter` / `Tab` / blur — commit
- `Esc` — cancel and revert
- `⌘S` / `Ctrl-S` — flush the currently focused field

### Images
Drag a file from Finder onto any image that gets a dashed outline on hover. Drop → upload → hot-swap. No page reload needed.

**Slots on the Journey page (`/`):**
- `ai-demo-1`, `ai-demo-2`, `ai-demo-3`, `ai-demo-4` — Ch 01 OpenYap/demos quad
- `webcor-1`, `webcor-2`, `webcor-3`, `webcor-4` — Ch 02 jobsite quad
- `uci-1` through `uci-4` — Ch 03 interview-context strip (UCI)
- `vegas-1`, `vegas-2` — Ch 03 strip (Vegas)
- `cowtech-team`, `cowtech-robot` — Ch 06 dual panel

**Constraints:**
- Max 20 MB per image
- `.jpg` / `.jpeg` / `.png` / `.webp` only
- Landscape works best (images are cropped `object-fit: cover`)

**Slots on the Case Studies page (`/case-studies.html`):**

Hero / Launcher
- `cs-lede` · `launcher-h` · `launcher-tag`

Tier 1 — Mr. George (01)
- `cs1-h` · `cs1-tag` · `cs1-problem` · `cs1-approach-1` · `cs1-approach-2` · `cs1-a1`–`cs1-a8` · `cs1-callout` · `cs1-result`

Tier 1 — Command Center (02)
- `cs2cc-h` · `cs2cc-tag` · `cs2cc-problem` · `cs2cc-approach-1` · `cs2cc-a1`–`cs2cc-a5` · `cs2cc-result`

Tier 1 — CUP Dashboard (03)
- `cs2-h` · `cs2-tag` · `cs2-problem` · `cs2-approach-1` · `cs2-a1`–`cs2-a7` · `cs2-result`

Tier 1 — Formwork (04)
- `cs5-h` · `cs5-tag` · `cs5-problem` · `cs5-approach` · `cs5-a1`–`cs5-a5` · `cs5-result`

Tier 1 — Roadmap (05)
- `cs3-h` · `cs3-tag` · `cs3-problem` · `cs3-approach` · `cs3-a1`–`cs3-a6` · `cs3-result`

Tier 2 — Vault Brain · Todo · LACC Foundation
- `cs6-h` · `cs6-tag` · `cs6-a1`–`cs6-a5`
- `cs7-h` · `cs7-tag` · `cs7-a1`–`cs7-a4`
- `cs8-h` · `cs8-tag` · `cs8-a1`–`cs8-a4`

Tier 3 — Cost Codes + Foreman Posters
- `cs9-h` · `cs9-tag` · `cs9-cc` · `cs9-fp`

Rapid Ships
- `rs-handlab` · `rs-trip` · `rs-social` · `rs-ff` · `rs-smartrock` · `rs-cs2`

Deliverables (titles + subtitles + the `href` on each card)
- `dlv-bp-t` · `dlv-bp-s` · `dlv-bp-href`
- `dlv-nda-t` · `dlv-nda-s` · `dlv-nda-href`
- `dlv-consent-t` · `dlv-consent-s` · `dlv-consent-href`

**Image slot folders** (drop files here — see each `_NEEDS.md`):
- `assets/photos/case-studies/launcher/` · `mr-george/` · `command-center/` · `cup-dashboard/` · `formwork/` · `roadmap/`
- `assets/photos/case-studies/vault-brain/` · `todo/` · `lacc-foundation/` · `cost-codes/` · `foreman-posters/`
- `assets/photos/case-studies/rapid-ships/` (one thumbnail per card)

## Where things land

- **Text edits** → written directly into the page's HTML file (e.g. `index.html`). `git diff` will show them.
- **Image drops** → saved to `assets/photos/_custom/<timestamp>-<slot>.<ext>`, and the `<img src>` in the HTML is rewritten to point to that file. Original images aren't touched, so it's all reversible via `git restore`.

## Pushing

Stop the editor (Ctrl-C), then tell me to push. I'll commit `index.html` (and any new `_custom/` images) and `git push origin main`. GitHub Pages rebuilds in ~60s.

## Behavior in production

On GitHub Pages — or under `python3 -m http.server` — the editor script silently no-ops because `/edit/status` isn't available. Visitors see zero difference from today.

## Troubleshooting

- **"EDIT MODE" chip never appears** — you're probably on `:8790` or the deployed site. Use `:9090`.
- **Toast says "no element matched X"** — the slot or key isn't in the HTML. Check you're on the right page.
- **Drop shows "drop to replace" but upload fails** — check the terminal where `edit_server.py` is running; it logs every write and every error.
- **Want to undo** — just `cd ~/portfolio && git restore <file>` for any file you want to revert, or delete the specific image under `assets/photos/_custom/`.
