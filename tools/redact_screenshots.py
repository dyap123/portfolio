#!/usr/bin/env python3
"""
Redact project data out of the app screenshots in assets/yapgrid/.

The screenshots are captures of a live internal tool, so they carry things the
prose on this site deliberately does not: takeoff quantities, level elevations,
per-layer element counts, the source model's file name, member marks with their
top/bottom-of-footing elevations, and a title block with the firm's address and
the job number.

Boxes are hard black on purpose. A visibly redacted screenshot reads as a
deliberate choice; a subtly blurred one reads as a mistake.

Usage:  python3 tools/redact_screenshots.py path/to/originals
        (writes redacted copies over assets/yapgrid/)

Requires Pillow and numpy. Re-running against already-redacted files is
harmless for the fixed boxes but will not find anything new to detect.
"""
import os
import sys
from collections import deque

from PIL import Image, ImageDraw, ImageFilter
import numpy as np

DEST = os.path.join(os.path.dirname(__file__), '..', 'assets', 'yapgrid')


def boxes(im, rects, fill=(0, 0, 0)):
    d = ImageDraw.Draw(im)
    for r in rects:
        d.rectangle(r, fill=fill)
    return im


# Fixed regions, in the 1600x913 capture space each screenshot was taken at.
MAP_BOXES = [
    (1310, 210, 1598, 354),   # "PROJECT TAKEOFF" panel — total CY and footing count
    (252, 285, 412, 341),     # LEVEL chips — elevations and per-level counts
    (252, 595, 400, 649),     # GRID chips — gridline label ranges and counts
    (362, 684, 410, 850),     # LAYERS list — per-layer counts
    (346, 80, 540, 97),       # toolbar "N footings . N pours . live"
    (612, 166, 760, 189),     # "N of N complete" chip
]

REBAR_BOXES = [
    (464, 11, 898, 35),       # source IFC file name and export provenance
    (161, 12, 452, 38),       # model picker — level, elevation, element count
    (238, 146, 284, 898),     # left panel — every per-layer element count
    (150, 558, 196, 579),     # pile diameter
    (108, 253, 144, 273),     # slab thickness
]

# Title block rows carrying the firm, its address, the job number and the
# project name/address. The sheet title, scale and "drawn by" rows are kept:
# they show the model really does plot a titled sheet, and say nothing.
SHEET_TITLE_BLOCK = (1268, 735, 1477, 799)

# Member annotations the detector misses because they sit on lighter fill.
SHEET_EXTRA = [
    (710, 503, 757, 535), (1174, 503, 1223, 535),
    (710, 711, 755, 742), (1175, 711, 1221, 742),
]


def find_annotation_clusters(im):
    """Locate the small dark annotation text sitting on the coloured member fills.

    Member marks and their top/bottom-of-footing elevations are drawn over
    lavender and blue fills, so restricting to saturated areas keeps the grid
    lines, dimension chains and sheet notes intact.
    """
    a = np.asarray(im).astype(int)
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    colored = (sat > 0.045) & (mx > 120)
    dark = a.sum(2) < 505

    # grow the colour mask so glyphs at a fill's edge still count
    cm = Image.fromarray((colored * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
    mask = dark & (np.asarray(cm) > 0)
    # then merge neighbouring glyphs into one block per annotation
    mm = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
    mask = np.asarray(mm) > 0

    H, W = mask.shape
    seen = np.zeros((H, W), bool)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)])
        seen[y0, x0] = True
        miny = maxy = y0
        minx = maxx = x0
        n = 0
        while q:
            y, x = q.popleft()
            n += 1
            miny, maxy = min(miny, y), max(maxy, y)
            minx, maxx = min(minx, x), max(maxx, x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        if n >= 45 and (maxx - minx) < 260 and (maxy - miny) < 70:
            out.append((minx - 2, miny - 2, maxx + 2, maxy + 2))
    return out


def main(src):
    dest = os.path.normpath(DEST)

    im = Image.open(os.path.join(src, 'map.png')).convert('RGB')
    boxes(im, MAP_BOXES).save(os.path.join(dest, 'map.png'))
    print('map.png redacted')

    im = Image.open(os.path.join(src, 'model-rebar.png')).convert('RGB')
    boxes(im, REBAR_BOXES).save(os.path.join(dest, 'model-rebar.png'))
    print('model-rebar.png redacted')

    im = Image.open(os.path.join(src, 'sheet.png')).convert('RGB')
    rects = find_annotation_clusters(im) + [SHEET_TITLE_BLOCK] + SHEET_EXTRA
    print(f'sheet.png: {len(rects)} regions')
    boxes(im, rects).save(os.path.join(dest, 'sheet.png'))
    print('sheet.png redacted')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
