#!/usr/bin/env python3
"""Build one silent, whole-frame overview film from the portfolio's actual footage."""
from pathlib import Path
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
# A single decode keeps the simultaneous montage smooth on phones. Every source fits
# within its tile, with white space rather than cuts to the original framing.
SOURCES = [
    ('assets/media/steel-schedule-prototype.mp4', 0, 'Steel schedule prototype', 0, 0, 600, 360),
    ('assets/media/schedule-changes-prototype.mp4', 0, 'Schedule comparison prototype', 600, 0, 600, 360),
    ('assets/field-details/pile-cap-exit.mp4', 0, 'Pile-cap fieldwork', 0, 360, 300, 390),
    ('assets/field-details/knife-plate-setting.mp4', 6, 'Knife plate setting', 300, 360, 300, 390),
    ('assets/media/night-pour-1.mp4', 0, 'Night pour coordination', 600, 360, 300, 390),
    ('assets/research-media/olympic-hill-walk.mp4', 4, 'Olympic and Hill visit', 900, 360, 300, 390),
    ('assets/media/night-pour-2.mp4', 0, 'Rebar coordination', 0, 750, 300, 390),
    ('assets/media/grade-beam.mp4', 22, 'Grade beam inspection', 300, 750, 300, 390),
    ('assets/photos/journey/07-field/excavator.mp4', 0, 'Driving for fun', 600, 750, 300, 390),
    ('assets/media/future-concept.mp4', 12, 'Future workflow concept', 900, 750, 300, 390),
]
cmd=['ffmpeg','-y','-filter_complex_threads','1']
for source,start,*_ in SOURCES:
    cmd += ['-stream_loop','-1','-ss',str(start),'-i',str(ROOT/source)]
labels=Image.new('RGBA',(1200,1140),(0,0,0,0))
draw=ImageDraw.Draw(labels)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',16)
for _,_,caption,x,y,w,h in SOURCES:
    draw.text((x+w/2,y+h-22),caption,font=font,fill='#4b4b50',anchor='mt')
label_file=Path(tempfile.gettempdir())/'portfolio-montage-labels.png'
labels.save(label_file)
cmd += ['-loop','1','-i',str(label_file)]
filters=[]
for i,(_,_,caption,x,y,w,h) in enumerate(SOURCES):
    filters.append(f'[{i}:v]fps=24,scale={w-16}:{h-44}:force_original_aspect_ratio=decrease,pad={w}:{h-28}:(ow-iw)/2:(oh-ih)/2:color=white,pad={w}:{h}:0:0:color=white,setsar=1,setpts=PTS-STARTPTS[v{i}]')
layout='|'.join(f'{x}_{y}' for _,_,_,x,y,_,_ in SOURCES)
filters.append(''.join(f'[v{i}]' for i in range(len(SOURCES)))+f'xstack=inputs={len(SOURCES)}:layout={layout}:fill=white[grid]')
filters.append(f'[grid][{len(SOURCES)}:v]overlay=0:0[out]')
out=ROOT/'assets/media/overview-montage.mp4'
cmd+=['-filter_complex',';'.join(filters),'-map','[out]','-t','12','-an','-c:v','libx264','-preset','medium','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-y','-ss','3','-i',str(out),'-frames:v','1','-q:v','3',str(ROOT/'assets/media/overview-montage-poster.jpg')],check=True)
