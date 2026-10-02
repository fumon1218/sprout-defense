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
  ballista: { name: '궁수 타워', img: 'tower_ballista', cost: 60, range: 3.3, dmg: 22, cd: 0.7, h: 92, desc: '빠른 물리 단일 공격' },
  mortar:   { name: '포병 타워', img: 'tower_mortar',   cost: 90, range: 3.7, dmg: 42, cd: 1.7, splash: 1.15, groundOnly: true, h: 104, desc: '느리지만 강한 지상 범위 공격' },
  vine:     { name: '마법 타워', img: 'tower_vine',     cost: 70, range: 3.0, dmg: 31, cd: 1.05, magic: true, h: 128, desc: '갑옷을 무시하는 마법 단일 공격' },
  wall:     { name: '병영',       img: 'tower_wall',     cost: 45, range: 1.8, barracks: true, h: 66, desc: '병사를 배치해 지상 적을 막는 방어 거점' },
};
const ENEMIES = {
  crawler: { name: '고블린 정찰병', img: 'enemy_crawler', hp: 48,  speed: 1.35, reward: 6,  h: 58,  dmg: 1 },
  soldier: { name: '오크 전사',     img: 'enemy_soldier', hp: 130, speed: 0.92, reward: 11, h: 88,  dmg: 1 },
  armored: { name: '갑옷 오크',     img: 'enemy_armored', hp: 220, speed: 0.72, reward: 17, h: 96,  dmg: 2, armor: 0.45 },
  shaman:  { name: '오크 샤먼',     img: 'enemy_shaman',  hp: 115, speed: 0.82, reward: 15, h: 90,  dmg: 1, heal: 9 },
  flyer:   { name: '동굴 박쥐',     img: 'enemy_flyer',   hp: 76,  speed: 1.55, reward: 9,  h: 60,  dmg: 1, fly: true },
  golem:   { name: '산악 트롤',     img: 'enemy_golem',   hp: 440, speed: 0.58, reward: 28, h: 118, dmg: 3 },
  boss:    { name: '오우거 군주',   img: 'enemy_boss',    hp: 2300, speed: 0.48, reward: 150, h: 160, dmg: 8 },
};
const WAVES = [
  [['crawler', 8]],
  [['crawler', 12]],
  [['crawler', 8], ['soldier', 4]],
  [['soldier', 6], ['armored', 3]],
  [['flyer', 6], ['crawler', 10]],
  [['shaman', 2], ['soldier', 8], ['armored', 3]],
  [['golem', 2], ['soldier', 8]],
  [['flyer', 8], ['shaman', 3], ['armored', 5]],
  [['golem', 4], ['crawler', 16], ['shaman', 3]],
  [['golem', 5], ['soldier', 10], ['armored', 6], ['flyer', 6]],
  [['boss', 1], ['golem', 4], ['armored', 6], ['shaman', 4], ['flyer', 6]],
];
const SKILLS = {
  burst: { name: '화살비', cd: 15, key: 'Q' },
  root:  { name: '왕국의 결계', cd: 20, key: 'W' },
  bloom: { name: '긴급 지원', cd: 45, key: 'E' },
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
const ASSET_CANDIDATES = {
  map_pad: ['assets/ui/build-pad.png', 'assets/img/map_pad.webp'],
  map_core: ['assets/props/kingdom-gate.png', 'assets/img/map_core.webp'],
  map_path: ['assets/maps/grassland/road-straight.png', 'assets/img/map_path.webp'],
  map_decor: ['assets/props/grassland-decor.png', 'assets/img/map_decor.webp'],
  tower_ballista: ['assets/towers/archer/archer-l1.webp', 'assets/img/tower_ballista.webp'],
  tower_mortar: ['assets/towers/artillery/artillery-l1.png', 'assets/img/tower_mortar.webp'],
  tower_vine: ['assets/towers/mage/mage-l1.webp', 'assets/img/tower_vine.webp'],
  tower_wall: ['assets/towers/barracks/barracks-l1.webp', 'assets/img/tower_wall.webp'],
  enemy_crawler: ['assets/enemies/goblin-scout.png', 'assets/img/enemy_crawler.webp'],
  enemy_soldier: ['assets/enemies/orc-warrior.png', 'assets/img/enemy_soldier.webp'],
  enemy_armored: ['assets/enemies/armored-orc.png', 'assets/img/enemy_soldier.webp'],
  enemy_shaman: ['assets/enemies/orc-shaman.png', 'assets/img/enemy_soldier.webp'],
  enemy_flyer: ['assets/enemies/fantasy-bat.png', 'assets/img/enemy_flyer.webp'],
  enemy_golem: ['assets/enemies/mountain-troll.png', 'assets/img/enemy_golem.webp'],
  enemy_boss: ['assets/enemies/boss-ogre-king.png', 'assets/img/enemy_boss.webp'],
  hero_stage1: ['assets/heroes/knight-hero.png', 'assets/img/hero_stage1.webp'],
  hero_stage2: ['assets/heroes/knight-hero.png', 'assets/img/hero_stage2.webp'],
  hero_stage3: ['assets/heroes/knight-hero.png', 'assets/img/hero_stage3.webp'],
  friendly_soldier: ['assets/units/foot-soldier.png', 'assets/img/hero_stage1.webp'],
};
const imgSources = (n) => {
  if (window.IMG_DATA && window.IMG_DATA[n]) return [window.IMG_DATA[n]];
  return ASSET_CANDIDATES[n] || [`assets/img/${n}.webp`];
};
const b64buf = (b) => { const bin = atob(b), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const IMG = {};
const loadImg = (n) => new Promise((res) => {
  const sources = imgSources(n);
  let ix = 0;
  const tryNext = () => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; res(); };
    im.onerror = () => { ix++; if (ix < sources.length) tryNext(); else res(); };
    im.src = sources[ix];
  };
  tryNext();
});
const IMG_NAMES = ['map_pad', 'map_core', 'map_path', 'map_decor', 'tower_ballista', 'tower_mortar', 'tower_vine', 'tower_wall',
  'enemy_crawler', 'enemy_soldier', 'enemy_armored', 'enemy_shaman', 'enemy_flyer', 'enemy_golem', 'enemy_boss', 'hero_stage1', 'hero_stage2', 'hero_stage3', 'friendly_soldier'];

// ---------- state ----------
const cv = document.getElementById('game'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const S = {
  gold: START_GOLD, lives: START_LIVES, wave: 0, phase: 'prep', speed: 1,
  towers: new Map(), guards: [], enemies: [], shots: [], fx: [], queue: [], spawnT: 0,
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
function applyDamage(e, amount, kind = 'physical') {
  const d = ENEMIES[e.type];
  let dealt = amount;
  if (kind === 'physical' && d.armor) dealt *= (1 - d.armor);
  e.hp -= dealt;
  return dealt;
}
function nearestPathD(gx, gy) {
  let bestD = 0, bestDist = Infinity;
  for (let d = 0; d <= total; d += 0.08) {
    const [px, py] = posAt(d), dd = Math.hypot(px - gx, py - gy);
    if (dd < bestDist) { bestDist = dd; bestD = d; }
  }
  return bestD;
}
function syncBarracks(t, towerKey) {
  if (!TOWERS[t.type].barracks) return;
  const wanted = Math.min(4, 2 + (t.lvl - 1));
  const homeD = nearestPathD(t.i + 0.5, t.j + 0.5);
  let own = S.guards.filter((x) => x.towerKey === towerKey);
  while (own.length < wanted) {
    const slot = own.length;
    const hp = 90 + 40 * (t.lvl - 1);
    const unit = { towerKey, slot, homeD: homeD + (slot - (wanted - 1) / 2) * 0.16, hp, max: hp, cd: 0, dead: false, respawn: 0, target: null };
    S.guards.push(unit); own.push(unit);
  }
  for (const unit of own) {
    unit.max = 90 + 40 * (t.lvl - 1);
    unit.hp = Math.min(unit.max, Math.max(unit.hp, unit.max * 0.65));
    unit.homeD = homeD + (unit.slot - (wanted - 1) / 2) * 0.16;
  }
}

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
  if (st !== S.heroStage) { S.heroStage = st; toast(`지휘관의 전투 오라가 ${st === 2 ? '강화' : '최대로 강화'}되었습니다!`); }
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
    e.slow = 1;
    e.blocked = false;
  }
  // Barracks guards engage nearby ground enemies and physically stop them.
  for (const guard of S.guards) {
    const tower = S.towers.get(guard.towerKey);
    if (!tower) { guard.remove = true; continue; }
    if (guard.dead) {
      guard.respawn -= dt;
      if (guard.respawn <= 0) { guard.dead = false; guard.hp = guard.max; guard.target = null; }
      continue;
    }
    let target = guard.target;
    if (!target || target.dead || ENEMIES[target.type].fly || Math.abs(target.d - guard.homeD) > 0.85) {
      target = null;
      let best = 0.85;
      for (const e of S.enemies) {
        if (e.dead || ENEMIES[e.type].fly) continue;
        const dd = Math.abs(e.d - guard.homeD);
        if (dd < best) { best = dd; target = e; }
      }
      guard.target = target;
    }
    if (target) {
      target.blocked = true;
      guard.cd -= dt;
      if (guard.cd <= 0) {
        guard.cd = Math.max(0.55, 0.95 - 0.08 * (tower.lvl - 1));
        applyDamage(target, (15 + 8 * (tower.lvl - 1)) * heroBuff(tower), 'physical');
        const p = posAt(target.d); addFx({ gx:p[0], gy:p[1], r:0.22, dur:0.18, color:'255,230,170', ring:true, alpha:0.8 });
      }
      const ed = ENEMIES[target.type];
      guard.hp -= (7 + ed.dmg * 5) * dt;
      if (guard.hp <= 0) { guard.dead = true; guard.respawn = Math.max(5, 9 - tower.lvl); guard.target = null; }
    }
  }
  S.guards = S.guards.filter((x) => !x.remove);
  for (const t of S.towers.values()) {
    const st = towerStats(t), [tx, ty] = [t.i + 0.5, t.j + 0.5];
    const slowing = TOWERS[t.type].slow;
    if (slowing || TOWERS[t.type].dot) {
      for (const e of S.enemies) {
        if (e.dead) continue;
        const [ex, ey] = posAt(e.d);
        if (Math.hypot(ex - tx, ey - ty) <= st.range) {
          if (slowing && !ENEMIES[e.type].fly) e.slow = Math.min(e.slow, st.slow);
          if (st.dot) applyDamage(e, st.dot * heroBuff(t) * dt, 'magic');
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
          if (TOWERS[t.type].groundOnly && ENEMIES[e.type].fly) continue;
          if (Math.hypot(ex - tx, ey - ty) <= st.range && e.d > bd) { best = e; bd = e.d; }
        }
        if (best) {
          t.cool = st.cd;
          const dmg = st.dmg * heroBuff(t);
          if (t.type === 'ballista') {
            applyDamage(best, dmg, 'physical');
            const p = posAt(best.d); S.shots.push({ kind: 'bolt', from: [tx, ty], to: p, t: 0, dur: 0.14 });
          } else if (TOWERS[t.type].magic) {
            applyDamage(best, dmg, 'magic');
            const p = posAt(best.d); S.shots.push({ kind: 'magic', from: [tx, ty], to: p, t: 0, dur: 0.22 });
          } else {
            const p = posAt(best.d); S.shots.push({ kind: 'seed', from: [tx, ty], to: p, t: 0, dur: 0.65, dmg, splash: st.splash });
          }
        }
      }
    }
  }
  // Shaman support aura: nearby ground enemies regenerate slowly.
  for (const sh of S.enemies) {
    if (sh.dead || !ENEMIES[sh.type].heal) continue;
    const [sx, sy] = posAt(sh.d);
    for (const ally of S.enemies) {
      if (ally.dead || ally === sh || ENEMIES[ally.type].fly) continue;
      const [ax, ay] = posAt(ally.d);
      if (Math.hypot(ax - sx, ay - sy) <= 1.8) ally.hp = Math.min(ally.max, ally.hp + ENEMIES[sh.type].heal * dt);
    }
  }
  for (const e of S.enemies) {
    if (e.dead) continue;
    e.root = Math.max(0, e.root - dt);
    const d = ENEMIES[e.type];
    let m = e.slow; if (e.root > 0) m = Math.min(m, 0.08); if (e.blocked && !d.fly) m = 0;
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
      for (const e of S.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - s.to[0], ey - s.to[1]) <= s.splash) applyDamage(e, s.dmg, 'physical'); }
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
  $('endText').textContent = win ? '오우거 군주를 물리치고 초원 왕국을 지켜냈습니다.' : '왕국의 방어선이 무너졌습니다.';
  $('end').hidden = false;
}

// ---------- skills ----------
function useSkill(k) {
  if (S.over || S.cd[k] > 0) return;
  const hx = HERO_CELL[0] + 0.5, hy = HERO_CELL[1] + 0.5;
  if (k === 'burst') {
    for (const e of S.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - hx, ey - hy) <= 2.8) applyDamage(e, 140 + S.wave * 12, 'magic'); }
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
  const t = `왕국 지휘관 · ${['', '기본', '강화', '최대'][S.heroStage]}`;
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
  for (const guard of S.guards) {
    if (guard.dead) continue;
    const targetD = guard.target && !guard.target.dead ? guard.target.d : guard.homeD;
    const [gx, gy] = posAt(targetD), c = iso(gx, gy);
    items.push({ d: gx + gy + 0.46 + guard.slot * 0.001, f: () => {
      const dx = (guard.slot % 2 === 0 ? -9 : 9);
      sprite('friendly_soldier', c.x + dx, c.y + 5, 54, guard.slot % 2 === 1);
      hpBar(c.x + dx, c.y - 55, 30, guard.hp / guard.max);
    }});
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
    if (s.kind === 'bolt') {
      ctx.strokeStyle = `rgba(245,225,155,${1 - s.t / s.dur})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y - 60); ctx.lineTo(b.x, b.y - 30); ctx.stroke();
    } else if (s.kind === 'magic') {
      const p = Math.min(1, s.t / s.dur), x = a.x + (b.x - a.x) * p, y = a.y - 65 + (b.y - a.y + 40) * p;
      const glow = 1 - p * 0.45; ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = '#5cc8ff'; ctx.fillStyle = `rgba(100,170,255,${glow})`; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.restore();
    } else {
      const p = Math.min(1, s.t / s.dur), x = a.x + (b.x - a.x) * p, y = a.y - 70 + (b.y - a.y + 70) * p - Math.sin(p * Math.PI) * 90; ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
    }
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
    $('pInfo').textContent = [d.dmg ? `${d.magic ? '마법 피해' : '피해'} ${Math.round(st.dmg * heroBuff(t))}` : '', d.dot ? `초당 ${Math.round(st.dot * heroBuff(t))}` : '', d.barracks ? `병사 ${Math.min(4, 2 + (t.lvl - 1))}명` : '', d.slow ? `이동 ${Math.round(st.slow * 100)}%` : '', `사거리 ${st.range.toFixed(1)}`].filter(Boolean).join(' · ');
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
    syncBarracks(S.towers.get(k), k);
    addFx({ gx: i + 0.5, gy: j + 0.5, r: 0.9, dur: 0.4, color: '120,255,160', ring: true, fill: true, alpha: 0.8 });
    S.sel = k; refreshHUD(); return;
  }
  S.sel = null; if (!pads.has(k)) S.build = null; refreshHUD();
});
document.querySelectorAll('.tbtn').forEach((b) => b.addEventListener('click', () => { S.build = S.build === b.dataset.t ? null : b.dataset.t; S.sel = null; refreshHUD(); }));
for (const k in SKILLS) $('sk_' + k).addEventListener('click', () => useSkill(k));
$('startBtn').addEventListener('click', startWave);
$('speedBtn').addEventListener('click', () => { S.speed = S.speed === 1 ? 2 : 1; $('speedBtn').textContent = `x${S.speed}`; });
$('upBtn').addEventListener('click', () => { const t = S.towers.get(S.sel); if (!t || t.lvl >= 3 || S.gold < upgradeCost(t)) return; S.gold -= upgradeCost(t); t.lvl++; syncBarracks(t, S.sel); addFx({ gx: t.i + 0.5, gy: t.j + 0.5, r: 1, dur: 0.5, color: '255,220,90', ring: true, fill: true, alpha: 0.8 }); refreshHUD(); });
$('sellBtn').addEventListener('click', () => { const t = S.towers.get(S.sel); if (!t) return; S.gold += sellValue(t); const soldKey = S.sel; S.towers.delete(soldKey); S.guards = S.guards.filter((x) => x.towerKey !== soldKey); S.sel = null; refreshHUD(); });
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
  document.querySelectorAll('.tbtn img').forEach((im) => { const n = TOWERS[im.closest('.tbtn').dataset.t].img; im.src = IMG[n]?.src || imgSources(n)[0]; });
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
