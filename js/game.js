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
  crawler: { name: '고블린 정찰병', img: 'enemy_crawler', hp: 48,  speed: 1.35, reward: 6,  h: 58,  dmg: 1, motion:{bob:4.8,sway:.045,tempo:5.5,weight:.55} },
  soldier: { name: '오크 전사',     img: 'enemy_soldier', hp: 130, speed: 0.92, reward: 11, h: 88,  dmg: 1, motion:{bob:3.0,sway:.028,tempo:4.0,weight:.85} },
  armored: { name: '갑옷 오크',     img: 'enemy_armored', hp: 220, speed: 0.72, reward: 17, h: 96,  dmg: 2, armor: 0.45, motion:{bob:2.1,sway:.016,tempo:3.2,weight:1.2} },
  shaman:  { name: '오크 샤먼',     img: 'enemy_shaman',  hp: 115, speed: 0.82, reward: 15, h: 90,  dmg: 1, heal: 9, motion:{bob:2.8,sway:.035,tempo:3.5,weight:.75} },
  flyer:   { name: '동굴 박쥐',     img: 'enemy_flyer',   hp: 76,  speed: 1.55, reward: 9,  h: 60,  dmg: 1, fly: true, motion:{bob:5.5,sway:.075,tempo:7.0,weight:.35} },
  golem:   { name: '산악 트롤',     img: 'enemy_golem',   hp: 440, speed: 0.58, reward: 28, h: 118, dmg: 3, motion:{bob:1.8,sway:.014,tempo:2.6,weight:1.45} },
  boss:    { name: '오우거 군주',   img: 'enemy_boss',    hp: 2300, speed: 0.48, reward: 150, h: 160, dmg: 8, motion:{bob:1.2,sway:.01,tempo:2.1,weight:1.75} },
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
  [['golem', 4], ['crawler', 14], ['shaman', 3], ['armored', 4]],
  [['boss', 1], ['golem', 4], ['soldier', 8], ['armored', 6], ['shaman', 4], ['flyer', 6]],
];
const SKILLS = {
  burst: { name: '화살비', cd: 15, key: 'Q' },
  root:  { name: '왕국의 결계', cd: 20, key: 'W' },
  bloom: { name: '긴급 지원', cd: 45, key: 'E' },
};
const heroStage = (wave) => (wave <= 3 ? 1 : wave <= 6 ? 2 : 3);
const TARGET_MODES = ['first', 'strong', 'weak'];
const TARGET_LABELS = { first:'선두', strong:'강한 적', weak:'약한 적' };
const WAVE_HINTS = {
  1: ['정찰대 접근', '빠른 고블린이 처음 등장합니다. 궁수 타워로 길목을 지켜보세요.'],
  3: ['오크 전사 등장', '고블린보다 체력이 높습니다. 타워를 분산 배치하세요.'],
  4: ['갑옷 오크 등장', '물리 피해를 줄여 받습니다. 마법 타워가 효과적입니다.'],
  5: ['비행 적 등장', '박쥐는 병영과 포병을 무시합니다. 궁수·마법 타워를 준비하세요.'],
  6: ['오크 샤먼 등장', '주변 지상 적을 회복합니다. 우선 처치가 중요합니다.'],
  7: ['산악 트롤 등장', '느리지만 매우 튼튼합니다. 병영으로 시간을 버세요.'],
  10:['최종 웨이브', '오우거 군주가 직접 진격합니다. 모든 자원을 사용하세요.']
};

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
  // CLEAN PREVIEW MODE:
  // Use one verified legacy art family only. New Stage-1 artwork is reintroduced
  // only after per-asset QA, preventing mixed styles and contaminated crops.
  map_background: [],
  map_pad: [],
  map_core: ['assets/img/map_core.webp'],
  map_path: [],
  map_decor: [],

  tower_ballista: ['assets/img/tower_ballista.webp'],
  tower_ballista_l2: ['assets/img/tower_ballista.webp'],
  tower_ballista_l3: ['assets/img/tower_ballista.webp'],
  tower_mortar: ['assets/img/tower_mortar.webp'],
  tower_mortar_l2: ['assets/img/tower_mortar.webp'],
  tower_mortar_l3: ['assets/img/tower_mortar.webp'],
  tower_vine: ['assets/img/tower_vine.webp'],
  tower_vine_l2: ['assets/img/tower_vine.webp'],
  tower_vine_l3: ['assets/img/tower_vine.webp'],
  tower_wall: ['assets/img/tower_wall.webp'],
  tower_wall_l2: ['assets/img/tower_wall.webp'],
  tower_wall_l3: ['assets/img/tower_wall.webp'],

  enemy_crawler: ['assets/img/enemy_crawler.webp'],
  enemy_soldier: ['assets/img/enemy_soldier.webp'],
  enemy_armored: ['assets/img/enemy_soldier.webp'],
  enemy_shaman: ['assets/img/enemy_soldier.webp'],
  enemy_flyer: ['assets/img/enemy_flyer.webp'],
  enemy_golem: ['assets/img/enemy_golem.webp'],
  enemy_boss: ['assets/img/enemy_boss.webp'],

  hero_stage1: ['assets/img/hero_stage1.webp'],
  hero_stage2: ['assets/img/hero_stage2.webp'],
  hero_stage3: ['assets/img/hero_stage3.webp'],
  friendly_soldier: ['assets/img/hero_stage1.webp'],

  // Disable unverified animation atlases in the public preview.
  friendly_soldier_atlas: [],
  anim_knight_idle: [],
  anim_knight_walk: [],
  anim_knight_attack: [],
  anim_knight_death: [],
  tower_combat_atlas: [],

  projectile_magic: [],
  projectile_cannon: [],
  vfx_explosion: [],
}
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
const IMG_NAMES = ['map_background', 'map_pad', 'map_core', 'map_path', 'map_decor',
  'tower_ballista', 'tower_ballista_l2', 'tower_ballista_l3',
  'tower_mortar', 'tower_mortar_l2', 'tower_mortar_l3',
  'tower_vine', 'tower_vine_l2', 'tower_vine_l3',
  'tower_wall', 'tower_wall_l2', 'tower_wall_l3',
  'enemy_crawler', 'enemy_soldier', 'enemy_armored', 'enemy_shaman', 'enemy_flyer', 'enemy_golem', 'enemy_boss',
  'hero_stage1', 'hero_stage2', 'hero_stage3', 'friendly_soldier',
  'anim_knight_idle', 'anim_knight_walk', 'anim_knight_attack', 'anim_knight_death',
  'tower_combat_atlas',
  'projectile_magic', 'projectile_cannon', 'vfx_explosion'];

// ---------- state ----------
const cv = document.getElementById('game'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const $ = (id) => document.getElementById(id);
const S = {
  gold: START_GOLD, lives: START_LIVES, wave: 0, phase: 'prep', speed: 1,
  towers: new Map(), guards: [], enemies: [], deaths: [], shots: [], fx: [], queue: [], spawnT: 0,
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
function showWaveIntro(wave) {
  const h = WAVE_HINTS[wave]; if (!h) return;
  $('waveIntroTitle').textContent = h[0]; $('waveIntroText').textContent = h[1];
  $('waveIntro').hidden = false; clearTimeout(showWaveIntro.t);
  showWaveIntro.t = setTimeout(() => $('waveIntro').hidden = true, 3200);
}
function refreshBossHud() {
  const boss = S.enemies.find((e) => e.type === 'boss' && !e.dead);
  const hud = $('bossHud');
  hud.hidden = !boss;
  if (boss) $('bossFill').style.width = Math.max(0, Math.min(100, boss.hp / boss.max * 100)) + '%';
}
const addFx = (o) => S.fx.push({ t: 0, dur: 0.5, ...o });
function applyDamage(e, amount, kind = 'physical') {
  const d = ENEMIES[e.type];
  let dealt = amount;
  if (kind === 'physical' && d.armor) dealt *= (1 - d.armor);
  e.hp -= dealt;
  e.hitT = 0.14;
  return dealt;
}
function chooseTarget(t, candidates) {
  if (!candidates.length) return null;
  const mode = t.targetMode || 'first';
  if (mode === 'strong') return candidates.reduce((a,b) => b.hp > a.hp ? b : a);
  if (mode === 'weak') return candidates.reduce((a,b) => b.hp < a.hp ? b : a);
  return candidates.reduce((a,b) => b.d > a.d ? b : a);
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
    const unit = { towerKey, slot, homeD: homeD + (slot - (wanted - 1) / 2) * 0.16, visualD: homeD, hp, max: hp, cd: 0, dead: false, respawn: 0, target: null, attackT: 0, hurtT: 0, stepT: slot * 0.45, animT: slot * .12 };
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
  showWaveIntro(S.wave);
  const st = heroStage(S.wave);
  if (st !== S.heroStage) { S.heroStage = st; toast(`지휘관의 전투 오라가 ${st === 2 ? '강화' : '최대로 강화'}되었습니다!`); }
  refreshHUD();
}
function seedDemo() {
  const demoTowers = [
    ['2,2','ballista',2,'first'],
    ['5,3','vine',2,'strong'],
    ['6,6','mortar',2,'weak'],
    ['4,8','wall',2,'first']
  ];
  for (const [k,type,lvl,targetMode] of demoTowers) {
    if (!pads.has(k)) continue;
    const [i,j] = k.split(',').map(Number);
    S.towers.set(k,{type,i,j,lvl,cool:0,targetMode});
    syncBarracks(S.towers.get(k), k);
  }
  S.gold = 180;
  S.wave = 5;
  S.phase = 'prep';
  refreshHUD();
  showWaveIntro(6);
}
function spawn(type) {
  const d = ENEMIES[type], scale = 1 + 0.16 * (S.wave - 1);
  const e = { type, hp: d.hp * scale, max: d.hp * scale, d: 0, slow: 1, root: 0, dead: false, hitT: 0, attackT: 0, walkT: Math.random() * 6.28 };
  if (type === 'boss') e.special = 4.5;
  S.enemies.push(e);
  if (type === 'boss') toast('보스 등장! 오우거 군주가 진격합니다!');
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
    e.hitT = Math.max(0, (e.hitT || 0) - dt);
    e.attackT = Math.max(0, (e.attackT || 0) - dt);
    const motion = ENEMIES[e.type].motion || {};
    e.walkT = (e.walkT || 0) + dt * (motion.tempo || (ENEMIES[e.type].fly ? 5.5 : 4.2));
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
    guard.attackT = Math.max(0, (guard.attackT || 0) - dt);
    guard.hurtT = Math.max(0, (guard.hurtT || 0) - dt);
    guard.stepT = (guard.stepT || 0) + dt;
    guard.animT = (guard.animT || 0) + dt;
    const desiredD = target && !target.dead ? target.d : guard.homeD;
    if (guard.visualD == null) guard.visualD = guard.homeD;
    const deltaD = desiredD - guard.visualD;
    const maxStep = (target ? 1.25 : .9) * dt;
    guard.visualD += Math.max(-maxStep, Math.min(maxStep, deltaD));
    if (target) {
      target.blocked = true;
      target.attackT = Math.max(target.attackT || 0, 0.18);
      guard.cd -= dt;
      if (guard.cd <= 0) {
        guard.attackT = 0.18;
        guard.cd = Math.max(0.55, 0.95 - 0.08 * (tower.lvl - 1));
        applyDamage(target, (15 + 8 * (tower.lvl - 1)) * heroBuff(tower), 'physical');
        const p = posAt(target.d); addFx({ gx:p[0], gy:p[1], r:0.22, dur:0.18, color:'255,230,170', ring:true, alpha:0.8 });
      }
      const ed = ENEMIES[target.type];
      guard.hp -= (7 + ed.dmg * 5) * dt;
      guard.hurtT = 0.08;
      if (guard.hp <= 0) { guard.dead = true; guard.respawn = Math.max(5, 9 - tower.lvl); guard.target = null; }
    }
  }
  S.guards = S.guards.filter((x) => !x.remove);
  for (const t of S.towers.values()) {
    t.attackT = Math.max(0, (t.attackT || 0) - dt);
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
        const candidates = [];
        for (const e of S.enemies) {
          if (e.dead) continue;
          const [ex, ey] = posAt(e.d);
          if (TOWERS[t.type].groundOnly && ENEMIES[e.type].fly) continue;
          if (Math.hypot(ex - tx, ey - ty) <= st.range) candidates.push(e);
        }
        const best = chooseTarget(t, candidates);
        if (best) {
          t.cool = st.cd;
          t.attackT = t.type === 'mortar' ? 0.76 : t.type === 'vine' ? 0.50 : 0.34;
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

    if (e.type === 'boss') {
      e.special -= dt;
      if (e.special <= 0) {
        e.special = 6.5;
        const [bx, by] = posAt(e.d);
        addFx({ gx: bx, gy: by, r: 1.55, dur: 0.55, color: '255,120,70', ring: true, fill: true, alpha: 0.8 });
        for (const guard of S.guards) {
          if (guard.dead) continue;
          const gd = guard.target && !guard.target.dead ? guard.target.d : guard.homeD;
          if (Math.abs(gd - e.d) <= 1.25) {
            guard.hp -= 48;
            if (guard.hp <= 0) { guard.dead = true; guard.respawn = 7; guard.target = null; }
          }
        }
        toast('오우거 군주의 대지 강타!');
      }
    }

    let rage = 1;
    if (e.type === 'boss' && e.hp / e.max <= 0.25) rage = 1.3;
    else if (e.type === 'boss' && e.hp / e.max <= 0.5) rage = 1.15;

    let m = e.slow; if (e.root > 0) m = Math.min(m, 0.08); if (e.blocked && !d.fly) m = 0;
    e.d += d.speed * m * rage * dt;
    if (e.d >= total) {
      e.dead = true; S.lives -= d.dmg; addFx({ gx: CORE[0] + 0.5, gy: CORE[1] + 0.5, r: 1.2, dur: 0.5, color: '255,90,90', ring: true, alpha: 0.6 });
      refreshHUD(); refreshBossHud(); if (S.lives <= 0) endGame(false);
    } else if (e.hp <= 0) {
      e.dead = true;
      S.deaths.push({ type:e.type, d:e.d, t:0, dur:e.type === 'boss' ? 1.2 : 0.55, phase:e.walkT || 0 });
      S.gold += d.reward; const p = posAt(e.d);
      addFx({ gx: p[0], gy: p[1], text: '+' + d.reward, dur: 0.8, color: '255,214,90' });
      refreshHUD(); refreshBossHud();
    }
  }
  S.enemies = S.enemies.filter((e) => !e.dead);
  for (const d of S.deaths) d.t += dt;
  S.deaths = S.deaths.filter((d) => d.t < d.dur);
  refreshBossHud();
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
function drawBackdrop() {
  const im = IMG.map_background;
  if (!im) return false;
  const scale = Math.max(W / im.width, H / im.height);
  const dw = im.width * scale, dh = im.height * scale;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();
  return true;
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
function drawSpriteCentered(name, x, y, h, angle = 0) {
  const im = IMG[name]; if (!im) return false;
  const w = im.width * h / im.height;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.drawImage(im, -w/2, -h/2, w, h); ctx.restore();
  return true;
}
function towerSpriteName(t) {
  return t.lvl <= 1 ? TOWERS[t.type].img : `${TOWERS[t.type].img}_l${Math.min(3, t.lvl)}`;
}
function sprite(name, x, y, h, flip) { // bottom-centre anchored
  const im = IMG[name]; if (!im) return;
  const w = im.width * h / im.height;
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
}
const STRIP_META = {
  anim_knight_idle: { frames:4, fps:6 },
  anim_knight_walk: { frames:8, fps:12 },
  anim_knight_attack: { frames:6, fps:15 },
  anim_knight_death: { frames:7, fps:10, once:true },
};
function stripAvailable(name) { return !!IMG[name]; }
function drawStrip(name, x, y, h, time, opt = {}) {
  const im = IMG[name], meta = STRIP_META[name];
  if (!im || !meta) return false;
  const fw = im.width / meta.frames, fh = im.height;
  let frame = Math.floor(time * meta.fps);
  if (meta.once) frame = Math.min(meta.frames - 1, frame);
  else frame %= meta.frames;
  const w = fw * h / fh;
  ctx.save();
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.translate(x + (opt.dx || 0), y + (opt.dy || 0));
  if (opt.flip) ctx.scale(-1,1);
  ctx.drawImage(im, frame * fw, 0, fw, fh, -w/2, -h, w, h);
  ctx.restore();
  return true;
}
const ANIM_ATLAS = {
  friendly_soldier_atlas: {
    frame: 72,
    rows: { idle:0, walk:1, attack:2, death:3 },
    counts: { idle:4, walk:8, attack:6, death:7 },
    fps: { idle:7, walk:12, attack:15, death:10 }
  }
};
const TOWER_COMBAT_ATLAS = {
  name:'tower_combat_atlas', frame:64,
  rows:{
    archer:{row:0,count:6,dur:.34},
    mage:{row:1,count:8,dur:.50},
    artilleryFire:{row:2,count:8,dur:.46},
    artilleryRecoil:{row:3,count:4,dur:.30}
  }
};
function drawTowerCombatFrame(kind, x, y, h, elapsed, opt={}) {
  const im=IMG[TOWER_COMBAT_ATLAS.name], meta=TOWER_COMBAT_ATLAS.rows[kind];
  if(!im || !meta) return false;
  const p=Math.max(0,Math.min(.999,elapsed/meta.dur));
  const frame=Math.min(meta.count-1,Math.floor(p*meta.count));
  const fs=TOWER_COMBAT_ATLAS.frame, sx=frame*fs, sy=meta.row*fs;
  const scale=h/fs, dw=fs*scale, dh=fs*scale;
  ctx.save();
  ctx.globalAlpha=opt.alpha==null?1:opt.alpha;
  ctx.translate(x+(opt.dx||0),y+(opt.dy||0));
  if(opt.flip) ctx.scale(-1,1);
  ctx.drawImage(im,sx,sy,fs,fs,-dw/2,-dh,dw,dh);
  ctx.restore();
  return true;
}
function drawAtlasAnim(name, state, x, y, h, time, opt = {}) {
  const im = IMG[name], meta = ANIM_ATLAS[name];
  if (!im || !meta || meta.rows[state] == null) return false;
  const count = meta.counts[state], fps = meta.fps[state] || 10;
  let frame;
  if (state === 'death') frame = Math.min(count - 1, Math.floor(time * fps));
  else if (state === 'attack') frame = Math.min(count - 1, Math.floor(time * fps));
  else frame = Math.floor(time * fps) % count;
  const fs = meta.frame, sx0 = frame * fs, sy0 = meta.rows[state] * fs;
  const scale = h / fs;
  const dw = fs * scale, dh = fs * scale;
  ctx.save();
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.translate(x + (opt.dx || 0), y + (opt.dy || 0));
  ctx.rotate(opt.rot || 0);
  if (opt.flip) ctx.scale(-1,1);
  ctx.drawImage(im, sx0, sy0, fs, fs, -dw/2, -dh, dw, dh);
  if (opt.flash) {
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=Math.min(.7,opt.flash);
    ctx.fillStyle='#fff';
    ctx.fillRect(-dw/2,-dh,dw,dh);
  }
  ctx.restore();
  return true;
}
function spriteMotion(name, x, y, h, opt = {}) {
  const im = IMG[name]; if (!im) return;
  const sx = (opt.flip ? -1 : 1) * (opt.sx || 1), sy = opt.sy || 1;
  const w = im.width * h / im.height;
  ctx.save();
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.translate(x + (opt.dx || 0), y + (opt.dy || 0));
  ctx.rotate(opt.rot || 0);
  ctx.scale(sx, sy);
  ctx.drawImage(im, -w / 2, -h, w, h);
  if (opt.flash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = Math.min(0.7, opt.flash);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2, -h, w, h);
  }
  ctx.restore();
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
  } else {
    const breathe = Math.sin(S.time * 2.1);
    spriteMotion('hero_stage' + st, c.x, c.y + 14, hgt, {dy:-Math.abs(breathe)*2, sx:1+breathe*0.008, sy:1-breathe*0.006, rot:Math.sin(S.time*0.9)*0.008});
  }
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
  const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700); grad.addColorStop(0, '#28492d'); grad.addColorStop(1, '#0b160d');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  const hasBackdrop = drawBackdrop();
  ctx.save(); if (hasBackdrop) ctx.globalAlpha = 0.76;
  drawGround(); drawGroundDetail();
  ctx.restore();
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
      const atk = t.attackT || 0;
      const towerH=d.h*(1+.07*(t.lvl-1));
      let animated=false;
      if(atk>0 && IMG.tower_combat_atlas){
        if(t.type==='ballista'){
          // Keep the wooden tower body stable; only animate the archer operator.
          spriteMotion(towerSpriteName(t),c.x,c.y+10,towerH,{});
          const elapsed=.34-atk;
          animated=drawTowerCombatFrame('archer',c.x,c.y-18,64,elapsed,{});
        }else if(t.type==='vine'){
          animated=drawTowerCombatFrame('mage',c.x,c.y+10,towerH,.50-atk,{});
        }else if(t.type==='mortar'){
          const elapsed=.76-atk;
          if(elapsed<=.46) animated=drawTowerCombatFrame('artilleryFire',c.x,c.y+10,towerH,elapsed,{});
          else animated=drawTowerCombatFrame('artilleryRecoil',c.x,c.y+10,towerH,elapsed-.46,{});
        }
      }
      if(!animated){
        let dx=0,dy=0,rot=0,sx=1,sy=1;
        if(atk>0){
          const dur=t.type==='mortar'?.76:t.type==='vine'?.50:.34;
          const p=atk/dur;
          if(t.type==='mortar'){dy=5*Math.sin(p*Math.PI);sx=1+.05*p;sy=1-.06*p;}
          else if(t.type==='ballista'){dx=-4*p;rot=-.025*p;}
          else if(t.type==='vine'){dy=-3*Math.sin(p*Math.PI);sx=sy=1+.035*Math.sin(p*Math.PI);}
        }
        spriteMotion(towerSpriteName(t),c.x,c.y+10,towerH,{dx,dy,rot,sx,sy});
      }
      for (let l = 0; l < t.lvl; l++) { ctx.fillStyle = '#ffd95a'; ctx.beginPath(); ctx.arc(c.x - 12 + l * 12, c.y + 24, 3.6, 0, 7); ctx.fill(); }
      if (heroBuff(t) > 1) { ctx.fillStyle = 'rgba(120,255,160,.9)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('▲', c.x + 30, c.y + 26); }
    } });
  }
  for (const guard of S.guards) {
    if (guard.dead) continue;
    const targetD = guard.visualD == null ? guard.homeD : guard.visualD;
    const [gx, gy] = posAt(targetD), c = iso(gx, gy);
    items.push({ d: gx + gy + 0.46 + guard.slot * 0.001, f: () => {
      const dx = (guard.slot % 2 === 0 ? -9 : 9);
      const attacking = (guard.attackT || 0) > 0;
      const moving = Math.abs((guard.target && !guard.target.dead ? guard.target.d : guard.homeD) - targetD) > .03;
      const flip = guard.slot % 2 === 1;
      let animated = false;
      if (attacking) {
        const attackElapsed = .18 - guard.attackT;
        animated = drawStrip('anim_knight_attack', c.x + dx, c.y + 6, 62, attackElapsed * 2.1, {flip});
      } else if (moving) {
        animated = drawStrip('anim_knight_walk', c.x + dx, c.y + 6, 60, guard.animT || 0, {flip});
      } else {
        animated = drawStrip('anim_knight_idle', c.x + dx, c.y + 6, 60, guard.animT || 0, {flip});
      }
      if (!animated) {
        const swing = attacking ? Math.sin((guard.attackT / 0.18) * Math.PI) : 0;
        const step = moving ? Math.sin(guard.stepT || 0) : Math.sin((guard.stepT || 0) * .45) * .35;
        spriteMotion('friendly_soldier', c.x + dx, c.y + 5, 54, {
          flip, dy:-Math.abs(step)*2,
          rot:attacking ? (flip ? -1 : 1)*.12*swing : step*.02,
          sx:1+.04*swing, sy:1-.04*swing,
          flash:guard.hurtT > 0 ? .45 : 0
        });
      }
      hpBar(c.x + dx, c.y - 62, 32, guard.hp / guard.max);
    }});
  }
  for (const dead of S.deaths) {
    const [gx, gy] = posAt(dead.d), c = iso(gx, gy), d = ENEMIES[dead.type];
    const p = Math.min(1, dead.t / dead.dur);
    const fall = dead.type === 'boss' ? 0.65 : 1;
    items.push({ d: gx + gy + 0.49, f: () => {
      if (d.fly) {
        ctx.fillStyle = `rgba(0,0,0,${0.22*(1-p)})`; ctx.beginPath(); ctx.ellipse(c.x, c.y, 22, 8, 0, 0, 7); ctx.fill();
      }
      spriteMotion(d.img, c.x, c.y + 6 + p * (d.fly ? 30 : 5), d.h, {
        rot:(d.fly ? .7 : .95) * p * fall,
        sx:1 + .08*p,
        sy:1 - .12*p,
        alpha:1-p,
        flash:p < .18 ? .55 : 0
      });
    }});
  }
  for (const e of S.enemies) {
    const [gx, gy] = posAt(e.d), c = iso(gx, gy), d = ENEMIES[e.type], lift = d.fly ? 34 + Math.sin(S.time * 6 + e.d) * 4 : 0;
    items.push({ d: gx + gy + 0.5, f: () => {
      if (d.fly) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 22, 8, 0, 0, 7); ctx.fill(); }
      const phase = e.walkT || 0, motion = d.motion || {};
      const walkBob = d.fly ? Math.sin(phase) * (motion.bob || 4) : Math.abs(Math.sin(phase)) * (motion.bob || 3);
      const sway = Math.sin(phase * (d.fly ? .72 : .5)) * (motion.sway || .025);
      const atk = e.attackT > 0 ? Math.sin((e.attackT / 0.18) * Math.PI) : 0;
      const bossBreath = e.type === 'boss' ? 1 + Math.sin(S.time * 1.7) * 0.012 : 1;
      spriteMotion(d.img, c.x, c.y + 6 - lift - walkBob, d.h, {
        rot: sway + atk * 0.08,
        sx: bossBreath * (1 + atk * 0.035),
        sy: (2 - bossBreath) * (1 - atk * 0.025),
        flash: e.hitT > 0 ? Math.min(0.65, e.hitT * 4.2) : 0
      });
      if (e.type === 'armored') {
        ctx.save(); ctx.fillStyle = 'rgba(160,190,220,.92)'; ctx.strokeStyle = 'rgba(50,75,95,.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.x + 24, c.y - lift - d.h + 7); ctx.lineTo(c.x + 32, c.y - lift - d.h + 11);
        ctx.lineTo(c.x + 30, c.y - lift - d.h + 22); ctx.lineTo(c.x + 24, c.y - lift - d.h + 27);
        ctx.lineTo(c.x + 18, c.y - lift - d.h + 22); ctx.lineTo(c.x + 16, c.y - lift - d.h + 11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      if (e.type === 'shaman') {
        ctx.save(); ctx.strokeStyle = `rgba(90,235,120,${0.35 + 0.18 * Math.sin(S.time * 5)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, RX * 1.15, RY * 1.15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (e.root > 0) { ctx.strokeStyle = 'rgba(90,220,120,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 24, 9, 0, 0, 7); ctx.stroke(); }
      hpBar(c.x, c.y + 6 - lift - d.h - 8, Math.max(30, d.h * 0.5), e.hp / e.max);
      if (e.type === 'boss' && e.hp / e.max <= 0.5) {
        ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(S.time * 8); ctx.strokeStyle = '#ff6a3d'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 34, 12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
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
      if (!drawSpriteCentered('projectile_magic', x, y, 30)) {
        const glow = 1 - p * 0.45; ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = '#5cc8ff'; ctx.fillStyle = `rgba(100,170,255,${glow})`; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.restore();
      }
    } else {
      const p = Math.min(1, s.t / s.dur), x = a.x + (b.x - a.x) * p, y = a.y - 70 + (b.y - a.y + 70) * p - Math.sin(p * Math.PI) * 90;
      if (!drawSpriteCentered('projectile_cannon', x, y, 26)) {
        ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
      }
    }
  }
  for (const f of S.fx) if (f.text) { const c = iso(f.gx, f.gy), p = f.t / f.dur; ctx.fillStyle = `rgba(${f.color},${1 - p})`; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText(f.text, c.x, c.y - 70 - p * 30); }
}

// ---------- HUD ----------
function nextWaveSummary() {
  if (S.wave >= LAST_WAVE) return '최종 전투 완료';
  const wave = WAVES[S.wave];
  return wave.map(([type,n]) => `${ENEMIES[type].name} ×${n}`).join(' · ');
}
function refreshHUD() {
  $('gold').textContent = S.gold; $('lives').textContent = S.lives; $('wave').textContent = `${S.wave} / ${LAST_WAVE}`;
  $('startBtn').disabled = S.phase !== 'prep' || S.over;
  $('nextWave').textContent = S.phase === 'prep' ? nextWaveSummary() : '현재 웨이브 진행 중';
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
    const targetBtn = $('targetBtn');
    targetBtn.disabled = !!d.barracks;
    targetBtn.textContent = d.barracks ? '병영: 근접 교전' : `공격 우선: ${TARGET_LABELS[t.targetMode || 'first']}`;
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
    S.gold -= d.cost; S.towers.set(k, { type: S.build, i, j, lvl: 1, cool: 0, targetMode: 'first' });
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
$('targetBtn').addEventListener('click', () => {
  const t = S.towers.get(S.sel); if (!t || TOWERS[t.type].barracks) return;
  const ix = TARGET_MODES.indexOf(t.targetMode || 'first');
  t.targetMode = TARGET_MODES[(ix + 1) % TARGET_MODES.length];
  refreshHUD();
});
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
  // Show the game immediately. Asset loading continues in the background so
  // a missing or large optional file can never leave the battlefield black.
  refreshHUD();
  if (new URLSearchParams(location.search).get('demo') === '1') seedDemo();

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (let s = 0; s < S.speed; s++) update(dt);
    render();
    if (S.frame !== undefined) S.frame++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Load 2D artwork without blocking the game loop.
  Promise.all(IMG_NAMES.map(loadImg)).then(() => {
    document.querySelectorAll('.tbtn img').forEach((im) => {
      const n = TOWERS[im.closest('.tbtn').dataset.t].img;
      im.src = IMG[n]?.src || imgSources(n)[0];
    });
  }).catch((err) => console.warn('2D asset load warning:', err));

  // Clean preview: keep the hero in the same 2D art family as towers/enemies.
  hero.ok = false;
  $('heroTag').textContent = '2D';
  window.__game = { S, pads, iso, hero, update, render, startWave, ready: true };
}
boot();
