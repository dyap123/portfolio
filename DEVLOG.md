# portfolio — DEVLOG

Newest first. Live site: https://dyap123.github.io/portfolio/ (GitHub Pages serves `main`; a push to
`main` is a publish). Repo https://github.com/dyap123/portfolio. Anyone picking this up: read this file,
then `git log`, then the harness task files named below.

---

## 2026-11-11 — Wrap-up of this session (work performed 2026-11-05)

**Scope and release.** This session and its workers changed application code only in
`~/portfolio`. Three reviewed releases were published on November 5:
`5a7e1d7` (site visits and software montage), `bbac5b7` (minimal abstract mark), and
`a6a048e` (construction-first layout, model timelines, larger sheets and MEP).
The later Legacy apps commit `e7ed04a` belongs to another session and is not part
of this wrap-up. This November 11 entry and WHY comments are documentation only;
they are prepared on `docs/codex-wrapup-1111`, with no deployment.

**What was built and where.**
- `index.html` now leads with field experience/detailing, jobsite photographs and
  drawing exports, followed by OpenYap. Five existing visit photographs appear in
  “Across different jobsites.” The montage includes Olympic and Hill site footage.
- `tools/build_overview_montage.py` composes one silent 12-second, 1600×1500,
  24 fps H.264 stream (6,197,433 bytes at the final release), with whole source
  frames and white gutters. Construction occupies the first row; larger steel and
  foundation model tiles alternate sides farther down. Caption strips were removed
  to give the videos more space. One decoded stream limits simultaneous-player
  overhead on phones; faststart supports progressive playback.
- `assets/media/steel-schedule-prototype.*` and
  `assets/media/foundation-schedule-prototype.*` show the actual schedule UI,
  model-link date colouring and local steel/YapGrid geometry. The foundation model
  replaced the Gantt comparison on the overview. Full-size manual-play demos remain
  below the montage for inspection. Provenance, source commits/hashes, dimensions
  and illustrative-date caveats are in
  `assets/media/overview-montage-manifest.json`.
- `assets/openyap/mep-interface.png` shows the actual MEP Where interface with L250,
  equipment and level filters, using archived October 27 data. The overview links
  to the full-size capture. It is an equipment/grid map; its archive contained no
  drawing background.
- `assets/style.css` gives detailing roughly 950 px on a 1440 px desktop, with
  760 px drawings and 900 px exported sheets pannable within the phone viewport.
  `assets/carousels.mjs` resets the drawing's horizontal pan when `show()` changes
  the paired sheet, so a new sheet does not inherit the previous inspection offset.
  Solo field clips hide the drawing and hint. `assets/site.js` and page cache keys
  were updated for the changed assets/module.
- `assets/dy-mark.svg`, `assets/favicon-dy.svg` and `assets/favicon.svg` share two
  monochrome, opposing right-angle forms. The user rejected the earlier calligraphic
  DY as too elaborate; the open frame stays clear at favicon size. Header sizing and
  asset references were updated across the rendered pages.

**Decisions and limits.** Model dates and spatial pour zones are illustrative
January 2030 data, not actual project sequencing or reported completion. Gray
geometry is unlinked. Captures ran against local application code/geometry with
live services blocked; no live records were written. The future concept and
recreational excavator clip are identified by text outside the caption-free montage.
The old schedule-comparison clip remains in the assets archive but is no longer
shown in the overview. A signed-in capture of live project progress and an MEP
view with a drawing background were not part of the delivered work. Capture/QA
scripts and screenshots were temporary `/tmp/portfolio-*` artifacts, not application
source; the portable evidence is the checked-in media/provenance, not those scratch
paths. No source changes were made to the OpenYap application repos. Its harness
received task/handoff Markdown only.

**Run and verify.** Serve this static repo with `python3 -m http.server 8080`, then
open `http://localhost:8080/`. Rebuild the montage, only when intentionally updating
media, with `python3 tools/build_overview_montage.py` (requires `ffmpeg` with H.264
encoding); rebuilding overwrites the montage and poster. Run
`node tools/check_refs.mjs`, `node --check assets/site.js`,
`node --check assets/carousels.mjs`, and `git diff --check`. Inspect desktop and
390 px layouts, enlarged/pannable sheets, carousel next/reset/solo behavior,
reduced-motion paused/unloaded montage, play/pause/offscreen pause, and individual
model playback. November 5 independent full harness gates passed 188/0; final
browser QA reported no runtime errors. All 18 files in the final release were
verified byte-for-byte over public HTTPS. The November 11 wrap-up adds only this
entry and explanatory code comments; no media is rebuilt or republished.
Wrap-up checks on November 11: local references passed for all 10 current pages,
JavaScript syntax and whitespace checks passed, Python AST and JavaScript
non-comment text matched the branch base, and the independent full `oy check`
passed 188 tests with zero failures (local emulators only).

---

## 2026-11-02 — Break automation, steel spreadsheets, detailing beside the field notes (Claude)

**Asked (verbatim):** "pick up on fixing my website since we ran out of codex credits - also i don't see
any mention of the break data automation and showcasing how many steel spreadsheets we saved. in the
overview as well for the field note videos - show the detailing side by side there as well" and "log the
changes codex made to dev log so anyone can pick on that".

**State found.** The live site was already Codex's finished refresh (origin/main `6dba260`, see the entry
below); nothing of Codex's was half done. Two local checkouts were stale and dirty: `~/portfolio` (main at
`7983e4c`, 216 files differing from origin/main, a partial copy of the refresh) and
`~/portfolio-refresh-20261031` (the directory Codex's builder worked in, same stale shape). The `~/portfolio`
working copy was snapshotted on branch `wip/stale-local-copy-20261102` (reference only, never merge) and
`main` fast-forwarded to origin/main. `~/portfolio-refresh-20261031` was left untouched.

**Changes (local commits on `main`, NOT pushed; a push publishes).**
- `82b907e` Overview field notes: each carousel item is a two-up, field clip left and the matching
  drawing or model right, stacking on mobile. Pairs: knife plate crane setting ↔ knife plate support
  details; elevator pit (half speed, now item 2, counter 1 / 6) ↔ elevator pit shop drawing; exiting a
  pile cap ↔ YapGrid foundation model (`assets/openyap/model-rebar.png`, a judgement call: the model shows
  pile caps and embeds, not bars). Left alone on purpose: night rebar coordination, mass concrete
  coordination, grade beam inspection, because no drawing of those exact elements exists in the repo.
  Carousel controls, autoplay/pause, reduced motion and keyboard behaviour untouched (`assets/carousels.mjs`
  extended, `assets/style.css`, cache keys bumped on every page). New `tools/check_refs.mjs` (local
  reference and absolute-path check, 0 errors on 9 pages).
- `4ff46e4` Two evidence cards in `#system` on the overview and after the steel evidence on the OpenYap
  page. "Workbooks read, not retyped": 41 workbooks and 405 PDFs in the fabricator steel folder (counting
  revisions; `assets/openyap/steel-evidence.json`), ADF and SME reports attributed by contents not
  filenames, tracker v25 reconciled 6,319 fabrication events from 3 documents, versions published through
  v33 (the highest version named in the OpenYap DEVLOGs; Esskay's report is a detailing status report, so
  it is not called a fabrication shop); source line states no time or cost savings were measured.
  "Break reports, graded automatically": the watcher reads cylinder break reports every hour, each break is
  graded pass/fail against the strength its own report specifies, reports are filed per mix design on
  Drive, a 7:01 daily digest lists failed breaks with area, nearby breaks and proposed responses (sources:
  openyap-vps DEVLOG 2026-08-25 and 2026-10-02). No break counts are stated because the logs do not state
  one.
- Validation: `node tools/check_refs.mjs` 0 errors; `tools/contrast-scan.js` injected in headless Chrome
  on index and projects, nothing flagged; desktop and 390 px renders without console errors; every new
  caption ≤ 5 words. Screenshots in the session scratchpad `portfolio/shots/`.
- Not done: no new Command Center captures (those need the user), no break-count figure, and
  `~/portfolio-refresh-20261031` was not cleaned up.

---

## 2026-10-31 → 2026-11-01 — Full refresh by Codex (seven commits, all published)

Codex ran as orchestrator/manager with a "portfolio-builder" developer agent and a media sub-agent,
building in `~/portfolio-refresh-20261031` and publishing to `main` through "the previously authorized
GitHub Pages main-branch route". Tasks live in the OpenYap harness queue
(`~/openyap-infra/harness/queue/`): `refresh-portfolio-with-october-31-resume-and-construction-films`,
`portfolio-project-media`, `portfolio-motion-and-steel-evidence`, `portfolio-overview-motion-and-dy-mark`
(all `done`, each with a manager release note: full `oy check` 188 passed / 0 failed, local reference
checks 125 → 184 → 191 references with zero errors, resume PDF byte-exact, released files verified
byte-for-byte over public HTTPS).

**What the user asked Codex for (verbatim, from the Codex session 2026-10-31T18:16):** "update my
portfolio website with my latest resume - 'Danzel Yap October 31 2026 Resume.pdf'. I want the whole site
to be refreshed as minimal and modern similar to apple, but with a twist of construction. Keep the
excavation video, and you can take screenshots of my openyap command center application … POV videos …
late night concrete pours, rebar coordination, and installing temperature sensors … the video I made of
what I envision the future to be"; then "make the captions less corny and 3-5 words max. The videos are
also kind of laggy, and I want more snapshots of the command center like the schedule module, steel
module, MEP module. The first video should also show the whole video … put the first overview video as a
compilation of all the videos in a grid (playing at the same time)"; then "make the montage cleaner - no
black background. Also for the excavator video note I didn't actually excavate i was just driving it for
the love of the game. Add the MEP visual (overall plan view of L250 and the levels) to openyap. After done
push it to prod."

**Commits on `main` (oldest first):**
- `449e53c` 2026-10-31 — Refresh portfolio with field films, current resume and OpenYap views
- `c2082db` 2026-11-01 — Show construction research visits and Olympic and Hill footage
- `64f8a8b` 2026-11-01 — Show field execution, shop drawings, and layered OpenYap exports
- `1cee20f` 2026-11-01 — Add subtle scroll motion and explain steel coordination at scale
- `8732c32` 2026-11-01 — Refresh overview films, DY identity, motion, and redacted drawing showcases
- `d6fa80f` 2026-11-01 — Unify the DY monogram and introduce midnight blue accents
- `6dba260` 2026-11-01 — Replace stacked logo with interlocking calligraphic DY

**What landed, per Codex's handoff notes:** nine pages (index, fieldwork, projects, journey, ecosystem,
vision, case-studies, research, resume) in a new minimal style (`assets/style.css`, `assets/site.js`,
`assets/favicon.svg`); the October 31 resume byte-exact at `assets/resume/`; a silent 1008×892 24 fps
ten-second composite of the field films playing at once (`assets/media/grid-seven.mp4`, white background
after the user's note), individual clips under `assets/field-details/` and `assets/media/` with 3–4 word
factual captions; real Command Center captures (steel fabrication lot, September 30 2026; an earlier
SuperYap scheduling capture; the L250 MEP plan rendered from live data as `assets/openyap/mep-l250.svg`),
redacted drawing showcases (`assets/detailing/`, `assets/yapgrid/`), the Olympic and Hill and other site
visit footage, subtle scroll motion with reduced-motion and offscreen guards, the steel evidence file
`assets/openyap/steel-evidence.json` (41 workbooks, 405 PDFs, 23,179 assemblies, 13,876 marks; "No
measured time or monetary savings claimed"), and the DY monogram (stacked → unified → interlocking
calligraphic). The excavator clip is captioned "Driving for fun" at the user's request. No MEP module
capture existed, so none was fabricated. Browser runtime QA was partly unavailable to Codex (its browser
host disconnected), so layout was validated by screenshot and static checks.

**Where the pieces are:** build directory `~/portfolio-refresh-20261031` (stale now); private originals
`~/portfolio-private-archive/2026-09-28/` (never published); Codex transcripts
`~/.codex/sessions/2026/10/31/rollout-2026-10-31T18-16-20-*.jsonl` (main), `…T18-25-*`, `…T19-12-*`,
`…/2026/11/01/rollout-2026-11-01T01-*` and `T05-35-53-*` (builder, media and approval sub-sessions).

**Why Codex stopped:** its OpenAI usage window ran out on 2026-11-02 ("try again at Nov 4th, 2026
1:58 AM"); the refresh itself was complete.
