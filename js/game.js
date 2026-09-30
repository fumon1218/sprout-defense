// Classic script (works from file:// and http://). Requires js/glbview.js first.

// ---------- constants ----------
const TW = 112, TH = 56, N = 10, W = 1200, H = 740, OX = 600, OY = 120;
const iso = (gx, gy) => ({ x: OX + (gx - gy) * TW / 2, y: OY + (gx + gy) * TH / 2 });
const uniso = (x, y) => { const a = (x - OX) / (TW / 2), b = (y - OY) / (TH / 2); return { gx: (a + b) / 2, gy: (b - a) / 2 }; };
const key = (i, j) => i + ',' + j;
const RX = TW / Math.SQRT2, RY = TH / Math.SQRT2; // ellipse radii of a 1-tile circle

const WAY = [[0, 1], [7, 1], [7, 4], [2, 4], [2, 7], [8, 7], [8, 9]];
const HERO_CELL = [4, 2];
const START_LIVES = 20, START_GOLD = 220, LAST_WAVE = 10;

const TOWERS = {
  ballista: { name: '가시 발사대', img: 'tower_ballista', cost: 60, range: 3.3, dmg: 22, cd: 0.7, h: 92, desc: '단일 대상 고화력' },
  mortar:   { name: '폭발 씨앗포', img: 'tower_mortar',   cost: 90, range: 3.7, dmg: 42, cd: 1.7, splash: 1.15, h: 104, desc: '범위 폭발 피해' },
  vine:     { name: '덩굴 감옥',   img: 'tower_vine',     cost: 70, range: 2.3, dot: 11, slow: 0.55, h: 128, desc: '감속과 지속 피해' },
  wall:     { name: '뿌리 장벽',   img: 'tower_wall',     cost: 45, range: 1.7, slow: 0.32, h: 66, desc: '강한 감속' },
};
const ENEMIES = {
  crawler: { name: '뿌리 기어', img: 'enemy_crawler', hp: 46,  speed: 1.25, reward: 6,  h: 58,  dmg: 1 },
  soldier: { name: '부패 병사', img: 'enemy_soldier', hp: 120, speed: 0.95, reward: 11, h: 88,  dmg: 1 },
  flyer:   { name: '포자 나방', img: 'enemy_flyer',   hp: 70,  speed: 1.5,  reward: 9,  h: 60,  dmg: 1, fly: true },
  golem:   { name: '부식 골렘', img: 'enemy_golem',   hp: 420, speed: 0.6,  reward: 28, h: 118, dmg: 3 },
  boss:    { name: '부패의 군주', img: 'enemy_boss',  hp: 2200, speed: 0.5, reward: 150, h: 160, dmg: 8 },
};
const WAVES = [
  [['crawler', 8]],
  [['crawler', 12]],
  [['crawler', 8], ['soldier', 4]],
  [['soldier', 8], ['flyer', 4]],
  [['golem', 2], ['crawler', 10]],
  [['flyer', 8], ['soldier', 8]],
  [['golem', 4], ['soldier', 8]],
  [['crawler', 20], ['flyer', 8]],
  [['golem', 6], ['soldier', 10]],
  [['boss', 1], ['golem', 4], ['soldier', 10]],
];
const SKILLS = {
  burst: { name: '광합성 폭발', cd: 15, key: 'Q' },
  root:  { name: '덩굴 결계', cd: 20, key: 'W' },
  bloom: { name: '생명의 개화', cd: 45, key: 'E' },
};
const heroStage = (wave) => (wave <= 3 ? 1 : wave <= 6 ? 2 : 3);

// ---------- map ----------
const pathPts = WAY.map(([i, j]) => [i + 0.5, j + 0.5]);
const segLen = []; let total = 0;
for (let k = 1; k < pathPts.length; k++) { const l = Math.hypot(pathPts[k][0] - pathPts[k - 1][0], pathPts[k][1] - pathPts[k - 1][1]); segLen.push(l); total += l; }
function posAt(d) {
  d = Math.max(0, Math.min(total, d));
  for (let k = 0; k < segLen.length; k++) {
    if (d <= segLen[k] || k === segLen.length - 1) {
      const t = segLen[k] ? Math.min(1, d / segLen[k]) : 0;
      return [pathPts[k][0] + (pathPts[k + 1][0] - pathPts[k][0]) * t, pathPts[k][1] + (pathPts[k + 1][1] - pathPts[k][1]) * t];
    }
    d -= segLen[k];
  }
  return pathPts[pathPts.length - 1];
}
const pathCells = new Map(); // key -> 'h' | 'v' (direction of travel through the cell)
for (let k = 1; k < WAY.length; k++) {
  const [a, b] = WAY[k - 1], [c, d] = WAY[k];
  const horiz = b === d;
  const steps = Math.max(Math.abs(c - a), Math.abs(d - b));
  for (let s = 0; s <= steps; s++) {
    const i = a + Math.sign(c - a) * s, j = b + Math.sign(d - b) * s;
    const kk = key(i, j);
    pathCells.set(kk, pathCells.has(kk) ? 'x' : (horiz ? 'h' : 'v'));
  }
}
const CORE = WAY[WAY.length - 1];
const pads = new Set();
for (const kk of pathCells.keys()) {
  const [i, j] = kk.split(',').map(Number);
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
    if (pathCells.has(key(ni, nj))) continue;
    if ((ni + nj) % 2 !== 0) continue;
    pads.add(key(ni, nj));
  }
}
pads.delete(key(...HERO_CELL));
const DECOR = new Set(['0,9', '9,0', '0,5', '9,3', '5,9', '4,6'].filter((k) => !pathCells.has(k) && !pads.has(k)));

// ---------- assets ----------
const imgSrc = (n) => (window.IMG_DATA && window.IMG_DATA[n]) || `assets/img/${n}.webp`;
const b64buf = (b) => { const bin = atob(b), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const IMG = {};
const loadImg = (n) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => res(); im.src = imgSrc(n); });
const IMG_NAMES = ['map_pad', 'map_core', 'map_path', 'map_decor', 'tower_ballista', 'tower_mortar', 'tower_vine', 'tower_wall',
  'enemy_crawler', 'enemy_soldier', 'enemy_flyer', 'enemy_golem', 'enemy_boss', 'hero_stage1', 'hero_stage2', 'hero_stage3'];

// ---------- state ----------
const cv = document.getElementById('game'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const S = {
  gold: START_GOLD, lives: START_LIVES, wave: 0, phase: 'prep', speed: 1,
  towers: new Map(), enemies: [], shots: [], fx: [], queue: [], spawnT: 0,
  build: null, sel: null, hover: null, time: 0, cd: { burst: 0, root: 0, bloom: 0 },
  heroStage: 1, over: false,
};
let hero = { view: null, models: {}, ok: false };

// ---------- helpers ----------
const towerStats = (t) => {
  const d = TOWERS[t.type], m = Math.pow(1.38, t.lvl - 1);
  return {
    range: d.range + 0.28 * (t.lvl - 1), dmg: (d.dmg || 0) * m, dot: (d.dot || 0) * m, cd: d.cd ? d.cd * Math.pow(0.92, t.lvl - 1) : 0,
    slow: d.slow ? Math.max(0.15, d.slow - 0.06 * (t.lvl - 1)) : 1, splash: d.splash ? d.splash + 0.1 * (t.lvl - 1) : 0,
  };
};
const heroBuff = (t) => (Math.hypot(t.i - HERO_CELL[0], t.j - HERO_CELL[1]) <= 2.7 ? 1.25 : 1);
const upgradeCost = (t) => Math.round(TOWERS[t.type].cost * (t.lvl === 1 ? 0.8 : 1.2));
const sellValue = (t) => { let v = TOWERS[t.type].cost; for (let l = 1; l < t.lvl; l++) v += Math.round(TOWERS[t.type].cost * (l === 1 ? 0.8 : 1.2)); return Math.round(v * 0.6); };
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }
const addFx = (o) => S.fx.push({ t: 0, dur: 0.5, ...o });

// ---------- waves ----------
function startWave() {
  if (S.phase !== 'prep' || S.over) return;
  S.wave++;
  S.phase = 'wave';
  const list = [];
  for (const [type, n] of WAVES[S.wave - 1]) for (let k = 0; k < n; k++) list.push(type);
  // interleave for variety
  list.sort(() => Math.random() - 0.5);
  S.queue = list; S.spawnT = 0.4;
  const st = heroStage(S.wave);
  if (st !== S.heroStage) { S.heroStage = st; toast(`새싹맨이 ${st === 2 ? '묘목' : '거목'}으로 진화했다!`); }
  refreshHUD();
}
function spawn(type) {
  const d = ENEMIES[type], scale = 1 + 0.16 * (S.wave - 1);
  S.enemies.push({ type, hp: d.hp * scale, max: d.hp * scale, d: 0, slow: 1, root: 0, dead: false });
}

// ---------- update ----------
function update(dt) {
  if (S.over) return;
  S.time += dt;
  for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt);
  if (S.phase === 'wave') {
    S.spawnT -= dt;
    if (S.queue.length && S.spawnT <= 0) { spawn(S.queue.shift()); S.spawnT = Math.max(0.35, 1.0 - S.wave * 0.05); }
    if (!S.queue.length && !S.enemies.length) {
      S.phase = 'prep';
      const bonus = 30 + S.wave * 5; S.gold += bonus; toast(`웨이브 ${S.wave} 클리어! +${bonus} 골드`);
      if (S.wave >= LAST_WAVE) endGame(true);
      refreshHUD();
    }
  }
  // enemies
  for (const e of S.enemies) {
    const d = ENEMIES[e.type];
    e.slow = 1;
  }
  for (const t of S.towers.values()) {
    const st = towerStats(t), [tx, ty] = [t.i + 0.5, t.j + 0.5];
    const slowing = TOWERS[t.type].slow;
    if (slowing || TOWERS[t.type].dot) {
      for (const e of S.enemies) {
        if (e.dead) continue;
        const [ex, ey] = posAt(e.d);
        if (Math.hypot(ex - tx, ey - ty) <= st.range) {
          if (slowing && !ENEMIES[e.type].fly) e.slow = Math.min(e.slow, st.slow);
          if (st.dot) e.hp -= st.dot * heroBuff(t) * dt;
        }
      }
      if (slowing || st.dot) { t.pulse = (t.pulse || 0) + dt; if (t.pulse > 1.2) { t.pulse = 0; addFx({ gx: tx, gy: ty, r: st.range, dur: 0.9, color: TOWERS[t.type].dot ? '95,220,140' : '140,200,255', ring: true, alpha: 0.35 }); } }
    }
    if (TOWERS[t.type].cd) {
      t.cool = (t.cool || 0) - dt;
      if (t.cool <= 0) {
        let best = null, bd = -1;
        for (const e of S.enemies) {
          if (e.dead) continue;
          const [ex, ey] = posAt(e.d);
          if (Math.hypot(ex - tx, ey - ty) <= st.range && e.d > bd) { best = e; bd = e.d; }
        }
        if (best) {
          t.cool = st.cd;
          const dmg = st.dmg * heroBuff(t);
          if (t.type === 'ballista') {
            best.hp -= dmg;
            const p = posAt(best.d); S.shots.push({ kind: 'bolt', from: [tx, ty], to: p, t: 0, dur: 0.14 });
          } else {
            const p = posAt(best.d); S.shots.push({ kind: 'seed', from: [tx, ty], to: p, t: 0, dur: 0.65, dmg, splash: st.splash });
          }
        }
      }
    }
  }
  for (const e of S.enemies) {
    if (e.dead) continue;
    e.root = Math.max(0, e.root - dt);
    const d = ENEMIES[e.type];
    let m = e.slow; if (e.root > 0) m = Math.min(m, 0.08);
    e.d += d.speed * m * dt;
    if (e.d >= total) {
      e.dead = true; S.lives -= d.dmg; addFx({ gx: CORE[0] + 0.5, gy: CORE[1] + 0.5, r: 1.2, dur: 0.5, color: '255,90,90', ring: true, alpha: 0.6 });
      refreshHUD(); if (S.lives <= 0) endGame(false);
    } else if (e.hp <= 0) { e.dead = true; S.gold += d.reward; const p = posAt(e.d); addFx({ gx: p[0], gy: p[1], text: '+' + d.reward, dur: 0.8, color: '255,214,90' }); refreshHUD(); }
  }
  S.enemies = S.enemies.filter((e) => !e.dead);
  // shots
  for (const s of S.shots) {
    s.t += dt;
    if (s.kind === 'seed' && !s.done && s.t >= s.dur) {
      s.done = true;
      for (const e of S.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - s.to[0], ey - s.to[1]) <= s.splash) e.hp -= s.dmg; }
      addFx({ gx: s.to[0], gy: s.to[1], r: s.splash, dur: 0.4, color: '255,150,60', ring: true, alpha: 0.7, fill: true });
    }
  }
  S.shots = S.shots.filter((s) => s.t < s.dur + (s.kind === 'seed' ? 0.02 : 0));
  for (const f of S.fx) f.t += dt;
  S.fx = S.fx.filter((f) => f.t < f.dur);
}

function endGame(win) {
  S.over = true;
  $('endTitle').textContent = win ? '승리!' : '패배...';
  $('endText').textContent = win ? '부패의 군단을 물리치고 세계수를 지켜냈습니다.' : '세계수의 뿌리가 무너졌습니다.';
  $('end').hidden = false;
}

// ---------- skills ----------
function useSkill(k) {
  if (S.over || S.cd[k] > 0) return;
  const hx = HERO_CELL[0] + 0.5, hy = HERO_CELL[1] + 0.5;
  if (k === 'burst') {
    for (const e of S.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - hx, ey - hy) <= 2.8) e.hp -= 140 + S.wave * 12; }
    addFx({ gx: hx, gy: hy, r: 2.8, dur: 0.6, color: '120,255,150', ring: true, fill: true, alpha: 0.8 });
  } else if (k === 'root') {
    for (const e of S.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - hx, ey - hy) <= 3.8) e.root = 4; }
    addFx({ gx: hx, gy: hy, r: 3.8, dur: 0.8, color: '90,200,120', ring: true, fill: true, alpha: 0.6 });
  } else if (k === 'bloom') {
    S.lives = Math.min(START_LIVES, S.lives + 3); addFx({ gx: CORE[0] + 0.5, gy: CORE[1] + 0.5, r: 1.6, dur: 0.9, color: '255,230,120', ring: true, fill: true, alpha: 0.7 });
  }
  S.cd[k] = SKILLS[k].cd; refreshHUD();
}

// ---------- drawing ----------
function hash(i, j) { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }
function diamond(c, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(c.x, c.y - TH / 2); ctx.lineTo(c.x + TW / 2, c.y); ctx.lineTo(c.x, c.y + TH / 2); ctx.lineTo(c.x - TW / 2, c.y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function drawTileImg(name, c, wScale = 1.06, flip = false) {
  const im = IMG[name]; if (!im) return;
  const w = TW * wScale, h = im.height * w / im.width;
  ctx.save(); ctx.translate(c.x, c.y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, -w / 2, -w / 4, w, h); ctx.restore(); // diamond centre sits w/4 below the image top
}
function drawGround() {
  for (let s = 0; s <= 2 * N - 2; s++) for (let i = 0; i < N; i++) {
    const j = s - i; if (j < 0 || j >= N) continue;
    const c = iso(i + 0.5, j + 0.5), h = hash(i, j), k = key(i, j);
    if (pathCells.has(k)) diamond(c, `hsl(38,7%,${27 + h * 5}%)`, 'rgba(0,0,0,.4)');
    else diamond(c, `hsl(140,9%,${11 + h * 5}%)`, 'rgba(0,0,0,.35)');
  }
}
function drawGroundDetail() {
  // sprites for special tiles, back to front
  for (let s = 0; s <= 2 * N - 2; s++) for (let i = 0; i < N; i++) {
    const j = s - i; if (j < 0 || j >= N) continue;
    const c = iso(i + 0.5, j + 0.5), k = key(i, j);
    if (pathCells.has(k)) { const dir = pathCells.get(k); if (dir === 'h' || dir === 'v') drawTileImg('map_path', c, 1.02, dir === 'v'); }
    else if (pads.has(k)) drawTileImg('map_pad', c, 1.0);
    if (i === HERO_CELL[0] && j === HERO_CELL[1]) drawTileImg('map_pad', c, 1.0);
  }
}
function ring(gx, gy, r, color, alpha, fill, dashed) {
  const c = iso(gx, gy);
  ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, RX * r, RY * r, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = `rgba(${color},${alpha * 0.25})`; ctx.fill(); }
  ctx.strokeStyle = `rgba(${color},${alpha})`; ctx.lineWidth = 2; if (dashed) ctx.setLineDash([8, 6]); ctx.stroke(); ctx.restore();
}
function sprite(name, x, y, h, flip) { // bottom-centre anchored
  const im = IMG[name]; if (!im) return;
  const w = im.width * h / im.height;
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
}
function hpBar(x, y, w, f) {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
  ctx.fillStyle = f > 0.5 ? '#7bd66a' : f > 0.25 ? '#e0c04a' : '#e05a4a'; ctx.fillRect(x - w / 2, y, w * Math.max(0, f), 4);
}
function drawHero(c) {
  ring(HERO_CELL[0] + 0.5, HERO_CELL[1] + 0.5, 2.7, '120,255,160', 0.35 + 0.1 * Math.sin(S.time * 2), true, true);
  const st = S.heroStage, hgt = st === 1 ? 190 : st === 2 ? 200 : 214;
  if (hero.ok && hero.models[st]) {
    const cvs = hero.view.render(hero.models[st], Math.sin(S.time * 0.9) * 0.45);
    const w = hgt * (cvs.width / cvs.height);
    ctx.drawImage(cvs, c.x - w / 2, c.y + 14 - hgt, w, hgt);
  } else sprite('hero_stage' + st, c.x, c.y + 14, hgt);
}
function heroLabel() {
  const c = iso(HERO_CELL[0] + 0.5, HERO_CELL[1] + 0.5);
  ctx.font = '600 15px system-ui, sans-serif'; ctx.textAlign = 'center';
  const t = `새싹맨 · ${['', '새싹', '묘목', '거목'][S.heroStage]}`;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(c.x - ctx.measureText(t).width / 2 - 6, c.y + 40, ctx.measureText(t).width + 12, 22);
  ctx.fillStyle = '#d9ffd9'; ctx.fillText(t, c.x, c.y + 56);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700); g.addColorStop(0, '#1a2119'); g.addColorStop(1, '#080b08');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawGround(); drawGroundDetail();
  // hover / selection highlights
  if (S.hover && (S.build ? pads.has(key(...S.hover)) && !S.towers.has(key(...S.hover)) : true) && S.hover[0] >= 0) {
    const ok = pads.has(key(...S.hover)) && !S.towers.has(key(...S.hover));
    if (ok) diamond(iso(S.hover[0] + 0.5, S.hover[1] + 0.5), 'rgba(120,255,160,.22)', 'rgba(120,255,160,.8)');
  }
  if (S.build) for (const k of pads) { if (!S.towers.has(k)) { const [i, j] = k.split(',').map(Number); diamond(iso(i + 0.5, j + 0.5), null, 'rgba(120,255,160,.35)'); } }
  if (S.sel) { const t = S.towers.get(S.sel); if (t) ring(t.i + 0.5, t.j + 0.5, towerStats(t).range, '120,255,160', 0.8, true); }
  // ground effects
  for (const f of S.fx) if (f.ring) { const p = f.t / f.dur; ring(f.gx, f.gy, f.r * (f.fill ? 0.6 + 0.4 * p : 1), f.color, (f.alpha || 0.5) * (1 - p), f.fill); }
  // depth-sorted entities
  const items = [];
  const core = iso(CORE[0] + 0.5, CORE[1] + 0.5);
  items.push({ d: CORE[0] + CORE[1] + 1, f: () => { drawTileImg('map_core', core, 1.12); } });
  for (const k of DECOR) { const [i, j] = k.split(',').map(Number); items.push({ d: i + j, f: () => drawTileImg('map_decor', iso(i + 0.5, j + 0.5), 1.05) }); }
  const hc = iso(HERO_CELL[0] + 0.5, HERO_CELL[1] + 0.5);
  items.push({ d: HERO_CELL[0] + HERO_CELL[1] + 1.2, f: () => drawHero(hc) });
  for (const t of S.towers.values()) {
    const c = iso(t.i + 0.5, t.j + 0.5), d = TOWERS[t.type];
    items.push({ d: t.i + t.j + 1, f: () => {
      sprite(d.img, c.x, c.y + 10, d.h * (1 + 0.07 * (t.lvl - 1)));
      for (let l = 0; l < t.lvl; l++) { ctx.fillStyle = '#ffd95a'; ctx.beginPath(); ctx.arc(c.x - 12 + l * 12, c.y + 24, 3.6, 0, 7); ctx.fill(); }
      if (heroBuff(t) > 1) { ctx.fillStyle = 'rgba(120,255,160,.9)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('▲', c.x + 30, c.y + 26); }
    } });
  }
  for (const e of S.enemies) {
    const [gx, gy] = posAt(e.d), c = iso(gx, gy), d = ENEMIES[e.type], lift = d.fly ? 34 + Math.sin(S.time * 6 + e.d) * 4 : 0;
    items.push({ d: gx + gy + 0.5, f: () => {
      if (d.fly) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 22, 8, 0, 0, 7); ctx.fill(); }
      const bob = d.fly ? 0 : Math.abs(Math.sin(S.time * 5 + e.d * 3)) * 3;
      sprite(d.img, c.x, c.y + 6 - lift - bob, d.h);
      if (e.root > 0) { ctx.strokeStyle = 'rgba(90,220,120,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 24, 9, 0, 0, 7); ctx.stroke(); }
      hpBar(c.x, c.y + 6 - lift - d.h - 8, Math.max(30, d.h * 0.5), e.hp / e.max);
    } });
  }
  items.sort((a, b) => a.d - b.d); for (const it of items) it.f();
  heroLabel();
  // shots
  for (const s of S.shots) {
    const a = iso(...s.from), b = iso(...s.to);
    if (s.kind === 'bolt') { ctx.strokeStyle = `rgba(190,255,150,${1 - s.t / s.dur})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y - 60); ctx.lineTo(b.x, b.y - 30); ctx.stroke(); }
    else { const p = Math.min(1, s.t / s.dur), x = a.x + (b.x - a.x) * p, y = a.y - 70 + (b.y - a.y + 70) * p - Math.sin(p * Math.PI) * 90; ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
  }
  for (const f of S.fx) if (f.text) { const c = iso(f.gx, f.gy), p = f.t / f.dur; ctx.fillStyle = `rgba(${f.color},${1 - p})`; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText(f.text, c.x, c.y - 70 - p * 30); }
}

// ---------- HUD ----------
function refreshHUD() {
  $('gold').textContent = S.gold; $('lives').textContent = S.lives; $('wave').textContent = `${S.wave} / ${LAST_WAVE}`;
  $('startBtn').disabled = S.phase !== 'prep' || S.over;
  $('startBtn').textContent = S.over ? '종료' : S.wave === 0 ? '전투 시작' : S.phase === 'prep' ? `웨이브 ${S.wave + 1} 시작` : '전투 중...';
  document.querySelectorAll('.tbtn').forEach((b) => { const d = TOWERS[b.dataset.t]; b.classList.toggle('sel', S.build === b.dataset.t); b.classList.toggle('poor', S.gold < d.cost); });
  for (const k in SKILLS) { const b = $('sk_' + k), cd = S.cd[k]; b.disabled = cd > 0; b.querySelector('.cdv').textContent = cd > 0 ? Math.ceil(cd) : ''; }
  const t = S.sel && S.towers.get(S.sel), p = $('panel');
  p.hidden = !t;
  if (t) {
    const d = TOWERS[t.type], st = towerStats(t);
    $('pName').textContent = `${d.name} Lv.${t.lvl}`;
    $('pInfo').textContent = [d.dmg ? `피해 ${Math.round(st.dmg * heroBuff(t))}` : '', d.dot ? `초당 ${Math.round(st.dot * heroBuff(t))}` : '', d.slow ? `이동 ${Math.round(st.slow * 100)}%` : '', `사거리 ${st.range.toFixed(1)}`].filter(Boolean).join(' · ');
    const up = $('upBtn'); up.textContent = t.lvl >= 3 ? '최대 레벨' : `강화 (${upgradeCost(t)})`; up.disabled = t.lvl >= 3 || S.gold < upgradeCost(t);
    $('sellBtn').textContent = `판매 (+${sellValue(t)})`;
  }
}

// ---------- input ----------
function cellAt(ev) {
  const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
  const { gx, gy } = uniso(x, y); return [Math.floor(gx), Math.floor(gy)];
}
cv.addEventListener('pointermove', (ev) => { S.hover = cellAt(ev); });
cv.addEventListener('pointerleave', () => { S.hover = null; });
cv.addEventListener('pointerdown', (ev) => {
  if (S.over) return;
  const [i, j] = cellAt(ev), k = key(i, j);
  if (S.towers.has(k)) { S.sel = k; S.build = null; refreshHUD(); return; }
  if (S.build && pads.has(k)) {
    const d = TOWERS[S.build];
    if (S.gold < d.cost) { toast('골드가 부족합니다'); return; }
    S.gold -= d.cost; S.towers.set(k, { type: S.build, i, j, lvl: 1, cool: 0 });
    addFx({ gx: i + 0.5, gy: j + 0.5, r: 0.9, dur: 0.4, color: '120,255,160', ring: true, fill: true, alpha: 0.8 });
    S.sel = k; refreshHUD(); return;
  }
  S.sel = null; if (!pads.has(k)) S.build = null; refreshHUD();
});
document.querySelectorAll('.tbtn').forEach((b) => b.addEventListener('click', () => { S.build = S.build === b.dataset.t ? null : b.dataset.t; S.sel = null; refreshHUD(); }));
for (const k in SKILLS) $('sk_' + k).addEventListener('click', () => useSkill(k));
$('startBtn').addEventListener('click', startWave);
$('speedBtn').addEventListener('click', () => { S.speed = S.speed === 1 ? 2 : 1; $('speedBtn').textContent = `x${S.speed}`; });
$('upBtn').addEventListener('click', () => { const t = S.towers.get(S.sel); if (!t || t.lvl >= 3 || S.gold < upgradeCost(t)) return; S.gold -= upgradeCost(t); t.lvl++; addFx({ gx: t.i + 0.5, gy: t.j + 0.5, r: 1, dur: 0.5, color: '255,220,90', ring: true, fill: true, alpha: 0.8 }); refreshHUD(); });
$('sellBtn').addEventListener('click', () => { const t = S.towers.get(S.sel); if (!t) return; S.gold += sellValue(t); S.towers.delete(S.sel); S.sel = null; refreshHUD(); });
$('retry').addEventListener('click', () => location.reload());
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'q') useSkill('burst'); else if (k === 'w') useSkill('root'); else if (k === 'e') useSkill('bloom');
  else if (k === ' ') { e.preventDefault(); startWave(); } else if (k === 'escape') { S.build = null; S.sel = null; refreshHUD(); }
  else if (['1', '2', '3', '4'].includes(k)) { S.build = Object.keys(TOWERS)[+k - 1]; S.sel = null; refreshHUD(); }
});

// ---------- boot ----------
async function boot() {
  await Promise.all(IMG_NAMES.map(loadImg));
  document.querySelectorAll('.tbtn img').forEach((im) => { im.src = imgSrc(TOWERS[im.closest('.tbtn').dataset.t].img); });
  refreshHUD();
  let last = performance.now();
  const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (let s = 0; s < S.speed; s++) update(dt); render(); if (S.frame !== undefined) S.frame++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  // 3D hero (WebGL); falls back to the 2D sprite when unavailable
  try {
    hero.view = new GLBView(288, 320);
    await Promise.all([1, 2, 3].map(async (n) => { hero.models[n] = window.HERO_GLB ? await hero.view.loadBuffer(b64buf(window.HERO_GLB[n])) : await hero.view.load(`assets/hero/hero_stage${n}.glb`); }));
    hero.ok = true; $('heroTag').textContent = '3D';
  } catch (err) { console.warn('3D hero disabled:', err); $('heroTag').textContent = '2D'; }
  window.__game = { S, pads, iso, hero, update, render, startWave, ready: true };
}
boot();
