#!/usr/bin/env python3
"""Build one silent, whole-frame overview film from the portfolio's actual footage."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
# A single decode keeps the simultaneous montage smooth on phones. Every source fits
# within its tile, with white space rather than cuts to the original framing.
# Tuples are (source, start seconds, x, y, width, height): offsets select excerpts;
# coordinates and dimensions keep the field/model layout reproducible.
SOURCES = [
    # Construction leads; model views alternate sides among the remaining fieldwork.
    ('assets/field-details/knife-plate-setting.mp4', 6, 0, 0, 400, 420),
    ('assets/media/night-pour-1.mp4', 0, 400, 0, 400, 420),
    ('assets/field-details/pile-cap-exit.mp4', 0, 800, 0, 400, 420),
    ('assets/research-media/olympic-hill-walk.mp4', 4, 1200, 0, 400, 420),
    ('assets/media/steel-schedule-prototype.mp4', 0, 0, 420, 960, 540),
    ('assets/media/grade-beam.mp4', 22, 960, 420, 320, 540),
    ('assets/media/night-pour-2.mp4', 0, 1280, 420, 320, 540),
    ('assets/photos/journey/07-field/excavator.mp4', 0, 0, 960, 320, 540),
    ('assets/media/future-concept.mp4', 12, 320, 960, 320, 540),
    ('assets/media/foundation-schedule-prototype.mp4', 0, 640, 960, 960, 540),
]
cmd=['ffmpeg','-y','-filter_complex_threads','1']
for source,start,*_ in SOURCES:
    cmd += ['-stream_loop','-1','-ss',str(start),'-i',str(ROOT/source)]
filters=[]
# Normalize each independently sought input's timestamps so every tile starts together.
for i,(_,_,x,y,w,h) in enumerate(SOURCES):
    filters.append(f'[{i}:v]fps=24,scale={w-12}:{h-12}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,setpts=PTS-STARTPTS[v{i}]')
layout='|'.join(f'{x}_{y}' for _,_,x,y,_,_ in SOURCES)
filters.append(''.join(f'[v{i}]' for i in range(len(SOURCES)))+f'xstack=inputs={len(SOURCES)}:layout={layout}:fill=white[out]')
out=ROOT/'assets/media/overview-montage.mp4'
# Faststart places playback metadata first so the browser need not download the whole film.
cmd+=['-filter_complex',';'.join(filters),'-map','[out]','-t','12','-an','-c:v','libx264','-preset','medium','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-y','-ss','3','-i',str(out),'-frames:v','1','-q:v','3',str(ROOT/'assets/media/overview-montage-poster.jpg')],check=True)
