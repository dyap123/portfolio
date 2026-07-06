// Regenerate ../assets/lacc-geo.js to match the LIVE CUP dashboard footing map.
// Reuses the dashboard's own derivation (foundation_geo.js base + the live
// cup-foundation/footingEdits from Firebase) so the portfolio hero shows the
// same footings/orientations/grade-beam spans as dyap123.github.io/cup-dashboard.
//
//   node tools/build_lacc_geo.mjs        # fetch live edits + rebuild
//
// Re-run whenever the live map is edited. Node 18+ (uses fetch).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const GEO_SRC = '/Users/jjiii/cup-dashboard/foundation_geo.js';
// Live-edits URL is kept OUT of the repo — pass it locally, e.g.:
//   CUP_RTDB_URL='https://<your-rtdb>/cup-foundation/footingEdits.json' node tools/build_lacc_geo.mjs
// (no URL → base geometry only, no Firebase exposure in the published site)
const EDITS_URL = process.env.CUP_RTDB_URL || '';
const OUT = resolve(HERE, '../assets/lacc-geo.js');

// ── base geometry (window.FOUNDATION_GEO) ──
const raw = readFileSync(GEO_SRC, 'utf8').trim().replace(/^window\.FOUNDATION_GEO\s*=\s*/, '').replace(/;\s*$/, '');
const geo = JSON.parse(raw);
geo.precise = true;

// ── live edits (only if a URL is supplied via env) ──
let _footEdits = {};
if (EDITS_URL) {
  try {
    const res = await fetch(EDITS_URL);
    _footEdits = (await res.json()) || {};
    console.log('fetched live footingEdits:', Object.keys(_footEdits).length);
  } catch (e) {
    console.warn('WARN could not fetch live edits, using base only:', e.message);
  }
} else {
  console.warn('CUP_RTDB_URL not set — using base geometry only (no live edits).');
}

// ════════════════════════════════════════════════════════════════════════
// VERBATIM from cup-dashboard/index.html (createFoundationMap). Only pours /
// site-hull / rendering are dropped — geometry derivation is unchanged.
// ════════════════════════════════════════════════════════════════════════
const FOOTING_TYPE_LIBRARY = {'F6':{wFt:6,lFt:6,thk:24}, 'F6A':{wFt:9,lFt:6,thk:36}, 'F7':{wFt:7,lFt:7,thk:27}, 'F7A':{wFt:7,lFt:4.5,thk:54}, 'F8':{wFt:8,lFt:8,thk:30}, 'F8A':{wFt:8,lFt:8,thk:36}, 'F9':{wFt:9,lFt:9,thk:36}, 'F10':{wFt:10,lFt:10,thk:39}, 'F10A':{wFt:15,lFt:10,thk:51}, 'F11':{wFt:11,lFt:11,thk:42}, 'F12':{wFt:12,lFt:12,thk:45}, 'F12B':{wFt:12,lFt:12,thk:54}, 'F12C':{wFt:29.33,lFt:12,thk:54}, 'F14':{wFt:14,lFt:14,thk:54}, 'WF1':{wFt:2,thk:12}, 'GB1':{wFt:2,thk:24}, 'GB2':{wFt:3.5,thk:36}, 'GB3':{wFt:3,thk:36}, 'GB4':{wFt:3,lFt:1,thk:96}, 'GB5':{wFt:3,thk:36}, 'GB6':{wFt:3.5,thk:72}, 'GB7':{wFt:3.5,thk:66}, 'GB8':{wFt:3.5,thk:60}, 'GB9':{wFt:3.5,thk:45}, 'GB10':{wFt:3.5,thk:69}, 'PC1A':{wFt:3.5,lFt:3.5,thk:42}, 'PC1B':{wFt:3.5,lFt:3.5,thk:42}, 'PC1C':{wFt:3.5,lFt:3.5,thk:42}, 'PC1D':{wFt:3.5,lFt:3.5,thk:42}, 'PC2A':{wFt:3.5,lFt:9.5,thk:60}, 'PC2B':{wFt:3.5,lFt:9.5,thk:60}, 'PC2C':{wFt:3.5,lFt:9.5,thk:60}, 'PC2D':{wFt:3.5,lFt:9.5,thk:60}, 'PC2E':{wFt:3.5,lFt:9.5,thk:60}, 'PC2F':{wFt:3.5,lFt:9.5,thk:60}, 'PC2G':{wFt:3.5,lFt:9.5,thk:90}, 'PC2H':{wFt:7,lFt:19,thk:48}, 'PC2J':{wFt:3.5,lFt:12.125,thk:60}, 'PC2K':{wFt:6,lFt:18,thk:96}, 'PC3A':{wFt:9,lFt:10,thk:60}, 'PC3E':{wFt:9,lFt:10,thk:60}, 'PC4A':{wFt:9.5,lFt:9.5,thk:66}, 'PC4C':{wFt:9.5,lFt:9.5,thk:66}, 'PC4D':{wFt:9.5,lFt:9.5,thk:66}, 'PC4E':{wFt:9.5,lFt:9.5,thk:66}, 'PC4F':{wFt:9.5,lFt:9.5,thk:66}, 'PC4G':{wFt:18,lFt:18,thk:96}, 'PC6A':{wFt:9.5,lFt:15.5,thk:72}, 'PC6C':{wFt:9.5,lFt:15.5,thk:72}, 'PC6D':{wFt:9.5,lFt:15.5,thk:72}, 'PC6E':{wFt:9.5,lFt:15.5,thk:72}, 'PC6F':{wFt:9.5,lFt:15.5,thk:72}, 'PC6G':{wFt:9.5,lFt:15.5,thk:90}, 'PC8A':{wFt:12,lFt:20.5,thk:96}, 'PC8E':{wFt:12,lFt:20.5,thk:96}, 'PC8F':{wFt:12,lFt:20.5,thk:96}, 'PC8G':{wFt:4,lFt:21.5,thk:78}, 'PC8H':{wFt:9.5,lFt:23.5,thk:72}, 'PC9A':{wFt:10.417,lFt:30,thk:120}, 'PC10A':{wFt:9.5,lFt:27.5,thk:66}, 'PC15A':{wFt:35.5,lFt:98,thk:96}, 'PC45E':{wFt:15.5,lFt:87.5,thk:72}, 'MPC1':{wFt:2.5,lFt:2.5,thk:36}, 'MPC4A':{wFt:7,lFt:7}, 'MPC4B':{wFt:7,lFt:7,thk:54}, 'MPC6A':{wFt:7,lFt:11,thk:66}, 'MPC6B':{wFt:7,lFt:11,thk:66}, 'MPC6C':{wFt:7,lFt:11,thk:96}, 'MPC8A':{wFt:7,lFt:15,thk:75}, 'MPC8B':{wFt:7,lFt:15,thk:60}, 'MPC9A':{wFt:11,lFt:11,thk:60}, 'MPC9B':{wFt:11,lFt:11,thk:60}, 'MPC10A':{wFt:7,lFt:19,thk:66}, 'MPC18A':{thk:69.96}, 'MPC39A':{thk:75.96}, 'MPC6A-R':{wFt:11,lFt:20,thk:72}, 'MPC6B-R':{wFt:11,lFt:20,thk:75.96}, 'MPC8A-R':{wFt:14.5,lFt:15,thk:63.96}, 'MPC10A-R':{wFt:19,lFt:20,thk:75.96}, 'MPC12A-R':{wFt:20,lFt:20,thk:75.96}, 'MPC14A-R':{wFt:20,lFt:20,thk:75.96}, 'CP1':{wFt:3.5,lFt:3.5}, '12" Pit Slab':{wFt:17.1,lFt:20.75,thk:12}, '18" Pit Slab':{wFt:20,lFt:20,thk:18}, '5 x 2.5':{wFt:2.5,lFt:5,thk:24}, 'PC15A Mini':{wFt:15,lFt:17.5,thk:96}};

function sideFt(t){
  t=String(t).toUpperCase();
  const F={F6:5,F6A:5,F7:5.5,F7A:6,F8:6.5,F8A:7,F9:7.5,F10:8,F10A:8.5,F11:9,F12:9.5,F12B:10,F12C:10,F14:11,F201:6,F202:6};
  if(F[t]!=null) return F[t];
  if(t.indexOf('MPC')===0){ const n=parseInt(t.replace(/\D/g,''))||6; return n>=18?26:(n>=8?22:(n>=6?20:18)); }
  if(t[0]==='F') return 6.5;
  if(t.indexOf('PC')===0){ const n=parseInt(t.slice(2))||2; const m={1:8,2:10,3:10.5,4:11,6:12,8:14,9:16,10:12,15:16,45:12}; return m[n]||10; }
  if(t.indexOf('GB')===0) return 3;
  return 7;
}
function median(a){ if(!a||!a.length)return 0; const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; }
function clusterLines(vals,gap){ const v=[...vals].sort((a,b)=>a-b); if(!v.length)return[]; const out=[]; let sum=v[0],cnt=1;
  for(let i=1;i<v.length;i++){ if(v[i]-v[i-1]>gap){ out.push({c:sum/cnt,n:cnt}); sum=0;cnt=0; } sum+=v[i]; cnt++; }
  out.push({c:sum/cnt,n:cnt}); return out; }
function phaseOf(centers,pitch){ if(!centers.length)return 0; const m=centers.map(c=>((c%pitch)+pitch)%pitch); return median(m); }

let footings=null, gridCols=null, gridRows=null;
let ox=0, oy=0, planW=0, planH=0, colPitch=73, rowPitch=72;
let _baseFoot=null;
const _typeDefs=null;

function recompFoot(f){ const w=Math.max(0.5,+f.wFt||1), l=Math.max(0.5,+f.lFt||1), t=Math.max(0.5,+f.thk||1);
  f.w=Math.max(9, w*2.43); f.h=Math.max(9, l*2.43); f.cyv=+(((w*l*(t/12))/27).toFixed(2)); }
function dimFor(field, type, e, fallback){
  if(e && e[field]!=null) return +e[field];
  const td=_typeDefs && _typeDefs[type];
  if(td && td[field]!=null && td[field]!=='') return +td[field];
  const bl=(typeof FOOTING_TYPE_LIBRARY!=='undefined') && FOOTING_TYPE_LIBRARY[type];
  if(bl && bl[field]!=null) return +bl[field];
  return fallback;
}
function materializeFootings(){
  if(!_baseFoot) return;
  const E=_footEdits||{};
  const arr=_baseFoot.map(b=>{ const f=Object.assign({}, b); const e=E[b.no];
    if(e){ if(e.type!=null)f.type=e.type; if(e.cx!=null)f.cx=+e.cx; if(e.cy!=null)f.cy=+e.cy; if(e.note!=null)f.note=e.note; f.del=!!e.deleted; }
    if(b.beam){ if(e && e.beam){ f.beam=Object.assign({}, e.beam); }
      else { const dx=f.cx-b.cx, dy=f.cy-b.cy; f.beam={x1:b.beam.x1+dx,y1:b.beam.y1+dy,x2:b.beam.x2+dx,y2:b.beam.y2+dy,horizontal:b.beam.horizontal}; } }
    f.wFt=dimFor('wFt',f.type,e,b.wFt); f.lFt=dimFor('lFt',f.type,e,b.lFt); f.thk=dimFor('thk',f.type,e,b.thk);
    recompFoot(f); return f; });
  Object.keys(E).forEach(k=>{ const e=E[k]; if(!e||!e.added) return; const no=+k; const t=e.type||'F8'; const s=sideFt(t);
    const f={ no, type:t, thk:dimFor('thk',t,e,30), cx:+e.cx||planW/2, cy:+e.cy||planH/2, wFt:dimFor('wFt',t,e,s), lFt:dimFor('lFt',t,e,s), tag:'#'+no, note:e.note||'', pourId:null, seq:null, added:true, del:!!e.deleted, isBeam:false };
    recompFoot(f); arr.push(f); });
  footings=arr;
}
function buildData(geo){
  const PAD=80;
  const fb=geo.fb; ox=fb.x0-PAD; oy=fb.y0-PAD;
  planW=(fb.x1-fb.x0)+PAD*2; planH=(fb.y1-fb.y0)+PAD*2;
  footings=geo.foot.map((r,i)=>{
    const t=r[0], cx=r[1]-ox, cy=r[2]-oy, thk=r[3]||30; const s=sideFt(t);
    const f={ no:i+1, type:t, thk, cx, cy, wFt:s, lFt:s, tag:'#'+(i+1), note:'', pourId:null, seq:null };
    recompFoot(f); return f;
  });
  const colC=clusterLines(footings.map(f=>f.cx+ox),34);
  const rowC=clusterLines(footings.map(f=>f.cy+oy),34);
  colPitch=73;
  const gaps=[]; for(let i=1;i<rowC.length;i++){ const g=rowC[i].c-rowC[i-1].c; if(g<110) gaps.push(g); }
  rowPitch=Math.max(58, Math.min(82, median(gaps)||72));
  footings.forEach(g=>{ g.isBeam=/^GB/i.test(g.type); });
  _baseFoot=footings.map(f=>({ no:f.no, type:f.type, cx:f.cx, cy:f.cy, thk:f.thk, wFt:f.wFt, lFt:f.lFt, tag:f.tag, note:'', isBeam:f.isBeam }));
  // beams need base neighbor search first — done on the base (pre-edit) set, then
  // materialize translates each beam by its footing's move (matches dashboard).
  const maxRun=colPitch*3.4, tolX=colPitch*0.5, tolY=rowPitch*0.5;
  _baseFoot.forEach(g=>{ if(!g.isBeam) return;
    let L=null,R=null,U=null,D=null;
    for(const f of _baseFoot){ if(f===g||f.isBeam) continue;
      const dx=f.cx-g.cx, dy=f.cy-g.cy;
      if(Math.abs(dy)<tolY && Math.abs(dx)<maxRun){ if(dx<0){ if(!L||f.cx>L.cx)L=f; } else if(dx>0){ if(!R||f.cx<R.cx)R=f; } }
      if(Math.abs(dx)<tolX && Math.abs(dy)<maxRun){ if(dy<0){ if(!U||f.cy>U.cy)U=f; } else if(dy>0){ if(!D||f.cy<D.cy)D=f; } }
    }
    const hSpan=(L&&R)?(R.cx-L.cx):(L?(g.cx-L.cx):(R?(R.cx-g.cx):1e9));
    const vSpan=(U&&D)?(D.cy-U.cy):(U?(g.cy-U.cy):(D?(D.cy-g.cy):1e9));
    const horizontal = hSpan<=vSpan;
    let x1,y1,x2,y2;
    if(horizontal){ y1=y2=g.cy; x1=L?L.cx:(R?R.cx-colPitch:g.cx-colPitch*0.55); x2=R?R.cx:(L?L.cx+colPitch:g.cx+colPitch*0.55); }
    else { x1=x2=g.cx; y1=U?U.cy:(D?D.cy-rowPitch:g.cy-rowPitch*0.55); y2=D?D.cy:(U?U.cy+rowPitch:g.cy+rowPitch*0.55); }
    g.beam={x1,y1,x2,y2,horizontal};
  });
  materializeFootings();
  if(geo.vlines && geo.hlines){
    gridCols=geo.vlines.map(v=>({x:v.x, l:v.l}));
    gridRows=geo.hlines.map(v=>({y:v.y, l:String(v.l).replace(/^W/,'')}));
  }
}

buildData(geo);

// ════════════════════════════════════════════════════════════════════════
// Emit — convert internal coords back to plan coords (+ox/+oy).
// ════════════════════════════════════════════════════════════════════════
const live = footings.filter(f => !f.del);
const points = live.filter(f => !f.isBeam);
const beams  = live.filter(f => f.isBeam && f.beam);

const fb = geo.fb, M = 110;
const view = [fb.x0 - M, fb.y0 - M, (fb.x1 - fb.x0) + 2 * M, (fb.y1 - fb.y0) + 2 * M];
const CUP  = { x0: 1179, y0: 365, x1: 1920, y1: 663 };  // gridline F–Q.1 / W33–W30
const SL   = { x0: 2090, x1: 2215 };                    // S-line complex

const r = n => Math.round(n);
const footRows = points.map(f => `[${r(f.cx + ox)},${r(f.cy + oy)},${r(f.w)},${r(f.h)}]`);
const beamRows = beams.map(f => {
  const b = f.beam, thk = Math.max(7, (FOOTING_TYPE_LIBRARY[f.type]?.wFt || 3) * 2.43);
  return `[${r(b.x1 + ox)},${r(b.y1 + oy)},${r(b.x2 + ox)},${r(b.y2 + oy)},${r(thk)}]`;
});

// counts for HUD copy
const inCup = (x, y) => x >= CUP.x0 && x <= CUP.x1 && y >= CUP.y0 && y <= CUP.y1;
const inSl  = (x, y) => !inCup(x, y) && x >= SL.x0 && x <= SL.x1;
const allEls = [
  ...points.map(f => [f.cx + ox, f.cy + oy]),
  ...beams.map(f => [(f.beam.x1 + f.beam.x2) / 2 + ox, (f.beam.y1 + f.beam.y2) / 2 + oy]),
];
const nCup = allEls.filter(([x, y]) => inCup(x, y)).length;
const nSl  = allEls.filter(([x, y]) => inSl(x, y)).length;
console.log(`elements: ${allEls.length} (points ${points.length} + beams ${beams.length}) | CUP ${nCup} | S-line ${nSl} | planned ${allEls.length - nCup - nSl}`);

const vl = geo.vlines.map(v => `[${v.x},${JSON.stringify(v.l)}]`).join(',');
const hl = geo.hlines.map(v => `[${v.y},${JSON.stringify(String(v.l).replace(/^W/, ''))}]`).join(',');

const out = `// LACC Expansion — foundation geometry for the projects-page hero.
// GENERATED by tools/build_lacc_geo.mjs — do not hand-edit.
// Matches the LIVE CUP dashboard: base foundation_geo.js + ${Object.keys(_footEdits).length} live
// footingEdits (moves/retypes/adds/deletes/beam re-orientations) applied with the
// dashboard's own derivation. foot rows = [cx,cy,w,h]; beams = [x1,y1,x2,y2,thk].
// Total ${allEls.length} elements · CUP ${nCup} · S-line ${nSl} · planned ${allEls.length - nCup - nSl}.
export const LACC_GEO = {
  pw: ${geo.pw}, ph: ${geo.ph},
  view: [${view.join(', ')}],
  fb: { x0: ${fb.x0}, x1: ${fb.x1}, y0: ${fb.y0}, y1: ${fb.y1} },
  vlines: [${vl}],
  hlines: [${hl}],
  // CUP foundations run gridline F -> Q.1 / W33 -> W30; complete 5.29.26
  cup: { x0: ${CUP.x0}, y0: ${CUP.y0}, x1: ${CUP.x1}, y1: ${CUP.y1} },
  // S-line complex — the only other foundations poured so far
  sline: { x0: ${SL.x0}, x1: ${SL.x1} },
  foot: [${footRows.join(',')}],
  beams: [${beamRows.join(',')}],
  milestones: [
    { id:'site',   label:'Schedule aligned with the trades',       date:'2025' },
    { id:'grid',   label:'Layout & sequencing complete',           date:'2025' },
    { id:'layout', label:'Concrete takeoffs performed',            date:'2025' },
    { id:'cup',    label:'Embeds tracked · QC verified',           date:'2026' },
    { id:'found',  label:'Pouring foundations',                    date:'→ AUG 2026' }
  ]
};
`;
writeFileSync(OUT, out);
console.log('wrote', OUT, `(${out.length} bytes)`);
