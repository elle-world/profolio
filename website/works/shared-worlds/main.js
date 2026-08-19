import * as THREE from 'three';

/* =========================================================
 * 《我们看过的世界》 Shared Worlds — interactive web demo
 * 视觉参考：《舒舒服服小岛时光》的明亮治愈系小岛风格
 * （配色与氛围参考，场景与角色均为原创实现）
 * 岛上 3D 场景不使用文字，展品内容在弹窗中展开。
 * 未来接入真实 AI 时，只需替换下方 EXHIBITION 数据源。
 * ========================================================= */

// ---------- 本期展览数据（AI 策展结果的预设模拟） ----------
const EXHIBITION = {
  theme: '我们想暂时逃离城市的一周',
  period: '8 月 11 日 — 8 月 17 日',
  cardNote: '这一周，你们用三次关于海的对话、一段一起看完的视频和九张没有发出去的照片，练习了一次小小的逃离。',
  exhibits: [
    {
      id: 'watch', zone: '共看展区', source: '共同观看',
      title: '那段一起看到最后的旅行视频',
      body: '周三晚上，Elle 分享了一段 12 分钟的海岛公路视频，你们连麦看到了结尾。片尾那片没有名字的海滩，你们倒回去看了三次。',
      curator: '有些风景一个人看只是好看，两个人看完，就变成了“想去”。',
    },
    {
      id: 'wish', zone: '想去的地方', source: '共同收藏',
      title: '收藏夹里躺着的四个目的地',
      body: '莫干山的民宿、花鸟岛的灯塔、横沙岛的日落，还有一个只写了“海边”的收藏。你们谁都没说破，但都悄悄往里面加了新东西。',
      curator: '收藏夹是最诚实的愿望清单。',
    },
    {
      id: 'chat', zone: '对话展区', source: '聊天提及 × 3',
      title: '“等忙完这阵，就去海边住一周。”',
      body: '这句话这周在聊天里出现了三次。第一次是玩笑，第二次像计划，第三次，你们开始查民宿了。',
      curator: '你们这周三次聊到海，大概都需要一点离开城市的理由。',
    },
    {
      id: 'photo', zone: '照片展区', source: '由 Elle 分享',
      title: '九张没有发出去的照片',
      body: '相册里是这周互相发过、但没发朋友圈的照片：云、路边的猫、一顿很成功的晚餐，和两张拍糊了的自拍。',
      curator: '拍糊的那两张，反而是笑得最认真的。',
    },
  ],
};

// ---------- 常量 ----------
const ISLAND_R = 14.5;
const BOUND_R = 12.1;
const WALK_SPEED = 3.4;
const PARTNER_SPEED = 3.0;
const TREE_POS = new THREE.Vector3(0, 0, 1.2);
const ENTER_POS = new THREE.Vector3(0, 0, -10.4);
const ZONE_FLOOR_R = 2.5;

// 展区方位（参观顺序：西南 → 东南 → 东北 → 西北）
const ZONE_SPOTS = [
  { x: -7.2, z: -6.0 }, // 共看
  { x: 7.2, z: -6.0 },  // 想去的地方
  { x: 7.0, z: 8.0 },   // 对话
  { x: -7.0, z: 8.0 },  // 照片
];

// 蜿蜒小路的路径点（入口 → 01 → 02 → 03 → 04 → 记忆树）
const PATH_WAYPOINTS = [
  [0, -11.6], [-0.6, -9.2], [-3.2, -7.0], [-5.2, -5.0],
  [-1.8, -5.9], [2.0, -6.5], [5.2, -5.0],
  [6.6, -1.8], [5.4, 2.0], [5.1, 5.8],
  [2.0, 6.8], [-2.0, 6.6], [-5.1, 5.8],
  [-5.8, 2.4], [-3.4, -0.8], [-1.0, -0.5], [0, -0.8],
];

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const loadingEl = document.getElementById('loading');
const fallbackEl = document.getElementById('fallback');
const progressEl = document.getElementById('hud-progress');
const promptEl = document.getElementById('prompt');
const promptText = document.getElementById('prompt-text');
const modalEl = document.getElementById('modal');
const modalSource = document.getElementById('modal-source');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCurator = document.getElementById('modal-curator');
const modalClose = document.getElementById('modal-close');
const joystickEl = document.getElementById('joystick');
const joystickNub = joystickEl.querySelector('.nub');
const finaleEl = document.getElementById('finale');
const cardCanvas = document.getElementById('memory-card');
const downloadBtn = document.getElementById('download-card');
const closeFinaleBtn = document.getElementById('close-finale');
const camToggleBtn = document.getElementById('cam-toggle');

// ---------- 全局状态 ----------
let renderer, scene, clock;
let orthoCam, fpCam, camera;
let camMode = 'third';
let fpPitch = 0;
let player, partner;
let exhibits = [];
let colliders = [];
let memoryTree = null;
let petals = [];
let guideRing = null;
let pathSamples = [];
let visited = new Set();
let state = 'explore';
let moveTarget = null;
let camTarget = new THREE.Vector3().copy(ENTER_POS);
let firstFrameDone = false;

// ---------- 明亮治愈系配色 ----------
const PALETTE = {
  grass: 0xbde37e,
  grassDeep: 0xa3d266,
  zoneFloor: 0xd3ec9a,
  dirt: 0xf0c987,
  dirtDeep: 0xe4b878,
  sand: 0xf3d9a0,
  water: 0x8adcf0,
  waterDeep: 0x62c4e4,
  sky: 0xcdeef7,
  trunk: 0xb3795a,
  leaf: 0x6fbf5a,
  leafLight: 0x8fd471,
  wood: 0xc99b6e,
  woodDark: 0xa87b52,
  paper: 0xfffdf6,
  coral: 0xe07a54,
};

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...extra });
}

const MAT = {
  grass: std(PALETTE.grass),
  grassDeep: std(PALETTE.grassDeep),
  zoneFloor: std(PALETTE.zoneFloor),
  dirt: std(PALETTE.dirt),
  dirtDeep: std(PALETTE.dirtDeep),
  sand: std(PALETTE.sand),
  water: std(PALETTE.water, { roughness: 0.45 }),
  waterDeep: std(PALETTE.waterDeep, { roughness: 0.45 }),
  trunk: std(PALETTE.trunk),
  leaf: std(PALETTE.leaf),
  leafLight: std(PALETTE.leafLight),
  stone: std(0xd8d4c8),
  wood: std(PALETTE.wood),
  woodDark: std(PALETTE.woodDark),
  paper: std(PALETTE.paper, { roughness: 0.85 }),
  skin: std(0xffe0c7, { roughness: 0.8 }),
  dark: std(0x3a3a3e),
  hairDark: std(0x36302b, { roughness: 0.9 }),
  white: std(0xfffaf0),
  black: std(0x2a2422, { roughness: 0.55 }),
  blush: std(0xffb9a3),
};

function mesh(geo, mat, x = 0, y = 0, z = 0, castShadow = true, receiveShadow = false) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function faceCenterAngle(x, z) {
  return Math.atan2(-x, TREE_POS.z - z);
}

// =========================================================
//  场景搭建
// =========================================================

// 有机岛形：多组正弦叠加的不规则轮廓
function islandOutline(radius) {
  const shape = new THREE.Shape();
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = radius * (1 + 0.05 * Math.sin(a * 3 + 1.3) + 0.025 * Math.sin(a * 5 + 0.5) + 0.015 * Math.sin(a * 8 + 2.1));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

function buildIsland() {
  const geo = new THREE.ExtrudeGeometry(islandOutline(ISLAND_R), { depth: 1.8, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const island = new THREE.Mesh(geo, [MAT.grass, MAT.sand]);
  island.position.y = -1.8;
  island.receiveShadow = true;
  scene.add(island);

  const patches = [
    [-4.2, -1.8, 2.6], [4.6, 4.4, 2.2], [-2.8, 6.4, 1.8],
    [5.6, -3.6, 1.9], [-6.2, 2.8, 1.6], [1.6, -6.8, 2.0],
    [-8.8, -6.8, 1.7], [9.2, 5.6, 1.8],
  ];
  for (const [x, z, r] of patches) {
    const p = mesh(new THREE.CircleGeometry(r, 28), MAT.grassDeep, x, 0.012, z, false, true);
    p.rotation.x = -Math.PI / 2;
    scene.add(p);
  }
}

// 蜿蜒小路：单条连续带状网格，无重叠、颜色均匀、不会闪动
function buildPaths() {
  const curve = new THREE.CatmullRomCurve3(
    PATH_WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false, 'catmullrom', 0.35,
  );
  const N = 140;
  const Y = 0.03;
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    pathSamples.push(p);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    // 平滑的宽度变化，保持手绘蜿蜒感
    const w = 1.18 + 0.16 * Math.sin(t * 9.4) + 0.09 * Math.sin(t * 23 + 1.7);
    positions.push(p.x + perp.x * w, Y, p.z + perp.z * w);
    positions.push(p.x - perp.x * w, Y, p.z - perp.z * w);
    normals.push(0, 1, 0, 0, 1, 0);
    if (i < N) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  const ribbon = new THREE.Mesh(geo, MAT.dirt);
  ribbon.receiveShadow = true;
  scene.add(ribbon);
  // 两端圆头（放在路面略低处，边缘超出形成圆润端点）
  for (const t of [0, 1]) {
    const p = curve.getPoint(t);
    const cap = mesh(new THREE.CircleGeometry(1.22, 24), MAT.dirt, p.x, Y - 0.001, p.z, false, true);
    cap.rotation.x = -Math.PI / 2;
    scene.add(cap);
  }
  // 记忆树脚下的圆场（低于路面，避免叠面）
  const ring = mesh(new THREE.CircleGeometry(2.3, 36), MAT.dirt, TREE_POS.x, 0.018, TREE_POS.z, false, true);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
}

function buildPond() {
  const pond = mesh(new THREE.CircleGeometry(1.8, 32), MAT.water, -10.2, 0.03, -1.2, false, true);
  pond.rotation.x = -Math.PI / 2;
  scene.add(pond);
  const inner = mesh(new THREE.CircleGeometry(1.15, 28), MAT.waterDeep, -10.3, 0.045, -1.3, false, true);
  inner.rotation.x = -Math.PI / 2;
  scene.add(inner);
  for (const [dx, dz] of [[1.6, 0.9], [-1.4, 1.2], [0.6, -1.6]]) {
    scene.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.8, 5), MAT.leaf, -10.2 + dx, 0.4, -1.2 + dz, false));
  }
  colliders.push({ x: -10.2, z: -1.2, r: 2.0 });
}

function makeTree(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 1.4 * s, 12), MAT.trunk, 0, 0.7 * s, 0));
  const c1 = mesh(new THREE.SphereGeometry(1.0 * s, 24, 18), MAT.leaf, 0, 1.85 * s, 0);
  c1.scale.y = 0.92;
  const c2 = mesh(new THREE.SphereGeometry(0.68 * s, 20, 14), MAT.leafLight, -0.58 * s, 1.5 * s, 0.22 * s);
  const c3 = mesh(new THREE.SphereGeometry(0.6 * s, 20, 14), MAT.leaf, 0.62 * s, 1.55 * s, -0.15 * s);
  g.add(c1, c2, c3);
  g.position.set(x, 0, z);
  scene.add(g);
  colliders.push({ x, z, r: 0.7 * s });
  return g;
}

function buildTrees() {
  makeTree(-3.4, 10.9, 1.15);
  makeTree(5.2, 10.2, 0.95);
  makeTree(-6.6, -8.9, 0.85);
  makeTree(11.0, 3.4, 1.05);
  makeTree(4.4, -9.9, 0.75);
}

function buildStones() {
  const stones = [
    [3.6, -4.4, 0.4], [4.15, -4.2, 0.24], [-3.6, 4.2, 0.34],
    [9.6, -7.4, 0.38], [-7.8, 9.4, 0.3], [1.8, 11.2, 0.32],
  ];
  for (const [x, z, r] of stones) {
    const s = mesh(new THREE.SphereGeometry(r, 16, 12), MAT.stone, x, r * 0.5, z);
    s.scale.y = 0.6;
    scene.add(s);
  }
}

function nearPath(x, z, dist) {
  return pathSamples.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < dist * dist);
}

function buildFlowers() {
  const petalColors = [0xffd66b, 0xff9db4, 0xfffdf6, 0x8ab8ff, 0xff9d7a, 0xc9a2ff];
  const forbiddenCircles = [
    { x: 0, z: 1.2, r: 3.2 },
    { x: -10.2, z: -1.2, r: 2.5 },
    ...ZONE_SPOTS.map((s) => ({ x: s.x, z: s.z, r: ZONE_FLOOR_R + 0.5 })),
    ...colliders.map((c) => ({ x: c.x, z: c.z, r: c.r + 0.7 })),
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  let placed = 0;
  let guard = 0;
  while (placed < 44 && guard++ < 900) {
    const x = rand(-11.8, 11.8);
    const z = rand(-11.8, 11.8);
    if (x * x + z * z > 11.8 * 11.8) continue;
    if (nearPath(x, z, 1.35)) continue;
    if (forbiddenCircles.some((f) => (x - f.x) ** 2 + (z - f.z) ** 2 < f.r * f.r)) continue;
    const color = petalColors[placed % petalColors.length];
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 6), MAT.leaf, 0, 0.16, 0, false));
    const pm = std(color, { roughness: 0.85 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.09, 10, 8), pm, Math.cos(a) * 0.12, 0.36, Math.sin(a) * 0.12, false);
      petal.scale.y = 0.7;
      g.add(petal);
    }
    g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), MAT.paper, 0, 0.39, 0, false));
    g.position.set(x, 0, z);
    scene.add(g);
    placed++;
  }
}

function buildEntrance() {
  // 入口木拱：无文字，只挂彩旗
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.9, 10), MAT.wood, -1.0, 0.95, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.9, 10), MAT.wood, 1.0, 0.95, 0));
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.15, 0.15), MAT.woodDark, 0, 1.92, 0));
  const flagColors = [0xffd66b, 0xff9db4, 0x8ab8ff, 0x8fd471, 0xff9d7a];
  for (let i = 0; i < 5; i++) {
    const flag = mesh(new THREE.ConeGeometry(0.1, 0.24, 4), std(flagColors[i]), -0.8 + i * 0.4, 1.72, 0, false);
    flag.rotation.x = Math.PI;
    g.add(flag);
  }
  g.position.set(0, 0, -11.4);
  scene.add(g);
  colliders.push({ x: -1.0, z: -11.4, r: 0.3 }, { x: 1.0, z: -11.4, r: 0.3 });
}

// ---------- 展区地面与图标指示牌（无文字） ----------
function drawHeart(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.2, cy + s * 0.1, cx - s * 0.7, cy - s * 0.8, cx, cy - s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.8, cx + s * 1.2, cy + s * 0.1, cx, cy + s * 0.9);
  ctx.fill();
}

function zoneIconTexture(id) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#fffdf6';
    ctx.beginPath(); ctx.roundRect(10, 10, 236, 236, 40); ctx.fill();
    ctx.strokeStyle = '#e07a54'; ctx.fillStyle = '#e07a54';
    ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (id === 'watch') {
      ctx.strokeRect(52, 66, 152, 100);
      ctx.beginPath(); ctx.moveTo(112, 92); ctx.lineTo(112, 140); ctx.lineTo(150, 116); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(92, 196); ctx.lineTo(164, 196); ctx.stroke();
    } else if (id === 'wish') {
      // 图钉 + 爱心
      ctx.beginPath();
      ctx.moveTo(128, 210);
      ctx.quadraticCurveTo(70, 140, 82, 108);
      ctx.arc(128, 106, 47, Math.PI * 0.75, Math.PI * 2.25);
      ctx.quadraticCurveTo(186, 140, 128, 210);
      ctx.fill();
      drawHeart(ctx, 128, 100, 22, '#fffdf6');
    } else if (id === 'chat') {
      ctx.beginPath(); ctx.roundRect(52, 62, 152, 104, 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(88, 166); ctx.lineTo(78, 200); ctx.lineTo(112, 168); ctx.stroke();
      for (const dx of [-36, 0, 36]) {
        ctx.beginPath(); ctx.arc(128 + dx, 114, 9, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // 照片
      ctx.strokeRect(54, 66, 148, 116);
      ctx.beginPath(); ctx.arc(100, 106, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(54, 156); ctx.lineTo(104, 116); ctx.lineTo(140, 148); ctx.lineTo(164, 126); ctx.lineTo(202, 156); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(54, 182); ctx.lineTo(202, 182); ctx.stroke();
    }
  });
}

function buildZoneBase(spot, data) {
  const floor = mesh(new THREE.CircleGeometry(ZONE_FLOOR_R, 40), MAT.zoneFloor, spot.x, 0.02, spot.z, false, true);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // 图标指示牌（无文字）
  const angle = faceCenterAngle(spot.x, spot.z);
  const signG = new THREE.Group();
  signG.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.05, 8), MAT.wood, 0, 0.52, 0));
  signG.add(mesh(new THREE.BoxGeometry(0.78, 0.78, 0.07), MAT.woodDark, 0, 1.32, 0));
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ map: zoneIconTexture(data.id), transparent: true }),
  );
  face.position.set(0, 1.32, 0.04);
  signG.add(face);
  const sx = spot.x + Math.sin(angle) * 2.4;
  const sz = spot.z + Math.cos(angle) * 2.4;
  signG.position.set(sx, 0, sz);
  signG.rotation.y = angle;
  scene.add(signG);
  colliders.push({ x: sx, z: sz, r: 0.28 });
}

// =========================================================
//  四个展区（场景内无文字，内容在弹窗展开）
// =========================================================

// 迷你小照片绘制
function drawMiniPhoto(ctx, x, y, w, h, kind) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.clip();
  if (kind === 'sea') {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#a5e0f2'); grad.addColorStop(0.6, '#8adcf0'); grad.addColorStop(1, '#62c4e4');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(x + w * 0.72, y + h * 0.26, w * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a9ec4'; ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
  } else if (kind === 'cat') {
    ctx.fillStyle = '#f7ead2'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e8a05c';
    ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.58, w * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.42); ctx.lineTo(x + w * 0.36, y + h * 0.22); ctx.lineTo(x + w * 0.44, y + h * 0.4);
    ctx.moveTo(x + w * 0.7, y + h * 0.42); ctx.lineTo(x + w * 0.64, y + h * 0.22); ctx.lineTo(x + w * 0.56, y + h * 0.4);
    ctx.fill();
    ctx.fillStyle = '#2b2620';
    ctx.beginPath(); ctx.arc(x + w * 0.42, y + h * 0.56, 3, 0, Math.PI * 2); ctx.arc(x + w * 0.58, y + h * 0.56, 3, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'dinner') {
    ctx.fillStyle = '#ffd66b'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.34, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9d7a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.2, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'mountain') {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#cdeef7'); grad.addColorStop(1, '#a3d266');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6fbf5a';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.42, y + h * 0.3); ctx.lineTo(x + w * 0.7, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5aa848';
    ctx.beginPath(); ctx.moveTo(x + w * 0.4, y + h); ctx.lineTo(x + w * 0.74, y + h * 0.42); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(x + w * 0.8, y + h * 0.2, w * 0.08, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'lighthouse') {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#a5e0f2'); grad.addColorStop(0.65, '#8adcf0'); grad.addColorStop(1, '#62c4e4');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#4a9ec4'; ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(x + w * 0.42, y + h * 0.25, w * 0.16, h * 0.48);
    ctx.fillStyle = '#e05a4e';
    ctx.fillRect(x + w * 0.42, y + h * 0.36, w * 0.16, h * 0.08);
    ctx.fillRect(x + w * 0.42, y + h * 0.52, w * 0.16, h * 0.08);
    ctx.beginPath(); ctx.moveTo(x + w * 0.4, y + h * 0.25); ctx.lineTo(x + w * 0.5, y + h * 0.12); ctx.lineTo(x + w * 0.6, y + h * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.28, w * 0.04, 0, Math.PI * 2); ctx.fill();
  } else { // sunset 双人剪影
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#c9a2ff'); grad.addColorStop(0.55, '#ff9d7a'); grad.addColorStop(1, '#ffd66b');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(43,38,32,0.85)';
    ctx.beginPath(); ctx.arc(x + w * 0.4, y + h * 0.52, w * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.32, y + h * 0.62, w * 0.16, h * 0.38);
    ctx.beginPath(); ctx.arc(x + w * 0.62, y + h * 0.5, w * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.54, y + h * 0.6, w * 0.16, h * 0.4);
  }
  ctx.restore();
}

// 01 共看展区：露天小影院
function buildWatchExhibit(spot) {
  const g = new THREE.Group();
  const screenTex = canvasTexture(512, 300, (ctx, w, h) => {
    drawMiniPhoto(ctx, 0, 0, w, h, 'sunset');
    ctx.fillStyle = 'rgba(255,253,246,0.95)';
    ctx.beginPath(); ctx.moveTo(w / 2 - 18, h / 2 - 24); ctx.lineTo(w / 2 - 18, h / 2 + 24); ctx.lineTo(w / 2 + 28, h / 2); ctx.closePath(); ctx.fill();
  });
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.3, 10), MAT.wood, -1.3, 1.15, -0.4));
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.3, 10), MAT.wood, 1.3, 1.15, -0.4));
  g.add(mesh(new THREE.BoxGeometry(2.9, 1.75, 0.14), MAT.woodDark, 0, 1.6, -0.4));
  g.add(mesh(new THREE.PlaneGeometry(2.6, 1.5), new THREE.MeshBasicMaterial({ map: screenTex }), 0, 1.6, -0.32, false));
  for (const [bx, bz] of [[-0.6, 1.3], [0.6, 1.45]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.22, 14), MAT.wood, bx, 0.11, bz));
  }
  const flagColors = [0xffd66b, 0xff9db4, 0x8ab8ff, 0x8fd471];
  for (let i = 0; i < 5; i++) {
    const flag = mesh(new THREE.ConeGeometry(0.09, 0.2, 4), std(flagColors[i % 4]), -1.0 + i * 0.5, 2.42, -0.4, false);
    flag.rotation.x = Math.PI;
    g.add(flag);
  }
  g.position.set(spot.x, 0, spot.z);
  g.rotation.y = faceCenterAngle(spot.x, spot.z);
  scene.add(g);
  return g;
}

// 02 想去的地方：心愿图钉板（纯图片卡片）
function buildWishExhibit(spot) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), MAT.wood, -0.85, 0.5, -0.3));
  g.add(mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), MAT.wood, 0.85, 0.5, -0.3));
  g.add(mesh(new THREE.BoxGeometry(2.2, 1.5, 0.1), MAT.woodDark, 0, 1.35, -0.3));
  const boardTex = canvasTexture(640, 440, (ctx, w, h) => {
    ctx.fillStyle = '#f7ead2'; ctx.fillRect(0, 0, w, h);
    const kinds = ['mountain', 'lighthouse', 'sunset', 'sea'];
    kinds.forEach((k, i) => {
      const cx = 42 + (i % 2) * 300;
      const cy = 30 + Math.floor(i / 2) * 200;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i % 2 ? -1 : 1) * 0.035);
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath(); ctx.roundRect(0, 0, 256, 180, 12); ctx.fill();
      drawMiniPhoto(ctx, 12, 12, 232, 156, k);
      ctx.restore();
      // 爱心图钉
      drawHeart(ctx, cx + 128, cy - 2, 14, '#e05a4e');
    });
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.38), new THREE.MeshBasicMaterial({ map: boardTex }));
  face.position.set(0, 1.35, -0.24);
  g.add(face);
  // 小行李箱
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.42, 0.24), std(0xe8a05c), 1.35, 0.21, 0.7));
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.06, 0.26), MAT.woodDark, 1.35, 0.21, 0.7));
  g.add(mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 14, Math.PI), MAT.woodDark, 1.35, 0.46, 0.7));
  g.position.set(spot.x, 0, spot.z);
  g.rotation.y = faceCenterAngle(spot.x, spot.z);
  scene.add(g);
  return g;
}

// 03 对话展区：树下留言气泡（无文字，三个圆点）
function buildChatExhibit(spot) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.6, 12), MAT.trunk, 0, 0.8, 0));
  const c1 = mesh(new THREE.SphereGeometry(0.85, 22, 16), MAT.leaf, 0, 1.95, 0);
  c1.scale.y = 0.9;
  g.add(c1);
  g.add(mesh(new THREE.SphereGeometry(0.5, 18, 12), MAT.leafLight, 0.55, 1.55, 0.15));
  const bubble = new THREE.Group();
  const bmat = std(0xfffdf6, { roughness: 0.65 });
  const main = mesh(new THREE.SphereGeometry(0.55, 20, 14), bmat, 0, 0, 0);
  main.scale.set(1.5, 0.95, 0.7);
  bubble.add(main);
  bubble.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), bmat, -0.5, -0.5, 0));
  bubble.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), bmat, -0.68, -0.72, 0));
  // 三个跳动的圆点
  bubble.userData.dots = [];
  for (let i = 0; i < 3; i++) {
    const dot = mesh(new THREE.SphereGeometry(0.07, 10, 8), std(PALETTE.coral), -0.3 + i * 0.3, 0, 0.42, false);
    dot.userData.phase = i * 0.5;
    bubble.userData.dots.push(dot);
    bubble.add(dot);
  }
  bubble.position.set(1.3, 2.3, 0.3);
  g.add(bubble);
  g.userData.bubble = bubble;
  const mat = mesh(new THREE.CircleGeometry(0.85, 24), std(0xffc9b3), -0.9, 0.025, 0.9, false, true);
  mat.rotation.x = -Math.PI / 2;
  g.add(mat);
  g.position.set(spot.x, 0, spot.z);
  g.rotation.y = faceCenterAngle(spot.x, spot.z);
  scene.add(g);
  return g;
}

// 04 照片展区：纯相册合集 + 晾晒照片（无文字）
function buildPhotoExhibit(spot) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), MAT.wood, -1.0, 0.5, -0.35));
  g.add(mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), MAT.wood, 1.0, 0.5, -0.35));
  g.add(mesh(new THREE.BoxGeometry(2.4, 1.6, 0.1), MAT.woodDark, 0, 1.4, -0.35));
  const albumTex = canvasTexture(720, 480, (ctx, w, h) => {
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, w, h);
    const kinds = ['sea', 'cat', 'dinner', 'sunset', 'mountain', 'lighthouse'];
    kinds.forEach((k, i) => {
      const cx = 32 + (i % 3) * 226;
      const cy = 28 + Math.floor(i / 3) * 218;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((i * 7) % 3 - 1) * 0.02);
      ctx.fillStyle = '#f4efe0';
      ctx.beginPath(); ctx.roundRect(-8, -8, 212, 200, 10); ctx.fill();
      drawMiniPhoto(ctx, 0, 0, 196, 184, k);
      ctx.restore();
      // 和纸胶带
      ctx.save();
      ctx.translate(cx + 98, cy - 10);
      ctx.rotate(((i % 2) ? -1 : 1) * 0.06);
      ctx.fillStyle = 'rgba(255, 214, 107, 0.85)';
      ctx.fillRect(-34, -8, 68, 20);
      ctx.restore();
    });
  });
  const album = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.5), new THREE.MeshBasicMaterial({ map: albumTex }));
  album.position.set(0, 1.4, -0.29);
  g.add(album);
  // 晾晒照片绳
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), MAT.wood, -1.25, 0.8, 1.15));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), MAT.wood, 1.25, 0.8, 1.15));
  const rope = mesh(new THREE.CylinderGeometry(0.016, 0.016, 2.5, 6), MAT.woodDark, 0, 1.5, 1.15, false);
  rope.rotation.z = Math.PI / 2;
  g.add(rope);
  g.userData.photos = [];
  const kinds = ['sea', 'cat', 'dinner', 'sunset'];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Group();
    p.add(mesh(new THREE.BoxGeometry(0.46, 0.56, 0.02), MAT.paper, 0, -0.28, 0, false));
    const tex = canvasTexture(128, 120, (ctx) => drawMiniPhoto(ctx, 4, 4, 120, 112, kinds[i]));
    p.add(mesh(new THREE.PlaneGeometry(0.36, 0.34), new THREE.MeshBasicMaterial({ map: tex }), 0, -0.24, 0.02, false));
    p.position.set(-0.95 + i * 0.63, 1.5, 1.15);
    p.userData.phase = i * 1.3;
    g.userData.photos.push(p);
    g.add(p);
  }
  g.position.set(spot.x, 0, spot.z);
  g.rotation.y = faceCenterAngle(spot.x, spot.z);
  scene.add(g);
  return g;
}

function buildExhibits() {
  const builders = [buildWatchExhibit, buildWishExhibit, buildChatExhibit, buildPhotoExhibit];
  return EXHIBITION.exhibits.map((data, i) => {
    const spot = ZONE_SPOTS[i];
    buildZoneBase(spot, data);
    const group = builders[i](spot);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3, 12),
      new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(spot.x, 1, spot.z);
    hit.userData.exhibitId = data.id;
    scene.add(hit);
    colliders.push({ x: spot.x, z: spot.z, r: 1.3 });
    return { data, group, hit, x: spot.x, z: spot.z };
  });
}

// =========================================================
//  中央记忆树
// =========================================================
function buildMemoryTree() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.44, 2.4, 14), MAT.trunk, 0, 1.2, 0));
  const canopySpots = [[0, 3.1, 0, 1.55], [-1.0, 2.6, 0.3, 1.05], [1.0, 2.7, -0.2, 1.1], [0.1, 2.5, 0.9, 0.9]];
  const canopy = [];
  canopySpots.forEach(([cx, cy, cz, r], i) => {
    const c = mesh(new THREE.SphereGeometry(r, 24, 18), i % 2 ? MAT.leafLight : MAT.leaf, cx, cy, cz);
    c.scale.y = 0.92;
    g.add(c);
    canopy.push({ center: new THREE.Vector3(cx, cy, cz), r });
  });
  const blossomMats = [0xffb3c9, 0xffc9d9, 0xff9db4, 0xfffdf6].map((c) => std(c, { roughness: 0.8 }));
  const blossoms = [];
  for (let i = 0; i < 56; i++) {
    const c = canopy[i % canopy.length];
    const dir = new THREE.Vector3().randomDirection();
    const pos = c.center.clone().addScaledVector(dir, c.r * 0.98);
    const b = mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.1, 10, 8),
      blossomMats[i % 4], pos.x, pos.y, pos.z, false);
    b.scale.setScalar(0.001);
    b.userData.delay = i * 0.045;
    g.add(b);
    blossoms.push(b);
  }
  g.position.copy(TREE_POS);
  scene.add(g);
  colliders.push({ x: TREE_POS.x, z: TREE_POS.z, r: 0.85 });

  const petalGeo = new THREE.PlaneGeometry(0.14, 0.1);
  const petalMat = new THREE.MeshBasicMaterial({ color: 0xffc9d9, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 26; i++) {
    const p = new THREE.Mesh(petalGeo, petalMat);
    p.visible = false;
    p.userData = { seed: Math.random() * 100, speed: 0.5 + Math.random() * 0.5 };
    scene.add(p);
    petals.push(p);
  }
  return { group: g, blossoms, bloomed: false, bloomT: 0 };
}

// =========================================================
//  角色（大头小身，原创造型；圆润光滑 + Q 弹步态）
// =========================================================
function makeCharacter({ dress = false, hat = false, longHair = false }) {
  const g = new THREE.Group();
  const refs = { anim: 'idle', t: Math.random() * 10 };

  const legGeo = new THREE.CapsuleGeometry(0.085, 0.14, 6, 12);
  const legMat = dress ? MAT.skin : MAT.dark;
  refs.legL = mesh(legGeo, legMat, -0.13, 0.17, 0);
  refs.legR = mesh(legGeo, legMat, 0.13, 0.17, 0);
  g.add(refs.legL, refs.legR);

  let body;
  if (dress) {
    body = mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.62, 20), MAT.white, 0, 0.56, 0);
  } else {
    body = mesh(new THREE.CapsuleGeometry(0.27, 0.26, 8, 16), MAT.dark, 0, 0.58, 0);
  }
  refs.body = body;
  g.add(body);

  const armGeo = new THREE.CapsuleGeometry(0.07, 0.24, 6, 12);
  const armMat = dress ? MAT.skin : MAT.dark;
  refs.armL = mesh(armGeo, armMat, -0.33, 0.68, 0);
  refs.armR = mesh(armGeo, armMat, 0.33, 0.68, 0);
  refs.armL.rotation.z = 0.3;
  refs.armR.rotation.z = -0.3;
  g.add(refs.armL, refs.armR);

  refs.head = new THREE.Group();
  refs.head.add(mesh(new THREE.SphereGeometry(0.42, 28, 22), MAT.skin, 0, 0, 0));
  refs.head.add(mesh(new THREE.SphereGeometry(0.445, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), MAT.hairDark, 0, 0.02, 0));
  refs.head.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), MAT.black, -0.15, 0.02, 0.385, false));
  refs.head.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), MAT.black, 0.15, 0.02, 0.385, false));
  const blushL = mesh(new THREE.SphereGeometry(0.05, 10, 8), MAT.blush, -0.26, -0.08, 0.31, false);
  blushL.scale.z = 0.4;
  const blushR = blushL.clone(); blushR.position.x = 0.26;
  refs.head.add(blushL, blushR);
  const mouth = mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14, Math.PI), MAT.black, 0, -0.1, 0.395, false);
  mouth.rotation.z = Math.PI;
  refs.head.add(mouth);
  if (hat) {
    refs.head.add(mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.045, 24), MAT.dark, 0, 0.28, 0));
    refs.head.add(mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.3, 20), MAT.dark, 0, 0.44, 0));
  }
  if (longHair) {
    const back = mesh(new THREE.SphereGeometry(0.4, 20, 16), MAT.hairDark, 0, -0.42, -0.2);
    back.scale.set(0.92, 1.5, 0.62);
    refs.head.add(back);
  }
  refs.head.position.y = 1.18;
  g.add(refs.head);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, refs, facing: 0 };
}

function animateCharacter(ch, dt) {
  const { refs } = ch;
  refs.t += dt;
  const tt = refs.t;
  const walkCycle = Math.sin(tt * 11);
  const stretch = Math.abs(walkCycle);
  switch (refs.anim) {
    case 'walk':
      refs.legL.rotation.x = walkCycle * 0.62;
      refs.legR.rotation.x = -walkCycle * 0.62;
      refs.legL.scale.y = 1 + Math.max(0, walkCycle) * 0.25;
      refs.legR.scale.y = 1 + Math.max(0, -walkCycle) * 0.25;
      refs.armL.rotation.x = -walkCycle * 0.45;
      refs.armR.rotation.x = walkCycle * 0.45;
      refs.body.scale.set(1 - stretch * 0.04, 1 + stretch * 0.07, 1 - stretch * 0.04);
      refs.body.position.y = 0.58 + stretch * 0.05;
      refs.head.position.y = 1.18 + stretch * 0.035;
      break;
    case 'wave':
      refs.legL.rotation.x = 0; refs.legR.rotation.x = 0;
      refs.legL.scale.y = 1; refs.legR.scale.y = 1;
      refs.body.scale.set(1, 1, 1);
      refs.armR.rotation.z = -2.4 + Math.sin(tt * 9) * 0.35;
      refs.armL.rotation.z = 0.3;
      refs.body.position.y = 0.58;
      break;
    case 'celebrate': {
      const jump = Math.abs(Math.sin(tt * 6));
      ch.group.position.y = jump * 0.42;
      refs.body.scale.set(1 + jump * 0.05, 1 - jump * 0.03, 1 + jump * 0.05);
      refs.armL.rotation.z = 2.5; refs.armR.rotation.z = -2.5;
      refs.legL.rotation.x = 0; refs.legR.rotation.x = 0;
      break;
    }
    case 'view':
      refs.legL.rotation.x = 0; refs.legR.rotation.x = 0;
      refs.legL.scale.y = 1; refs.legR.scale.y = 1;
      refs.body.scale.set(1, 1, 1);
      refs.armL.rotation.z = 0.3; refs.armR.rotation.z = -0.3;
      refs.head.rotation.x = -0.18 + Math.sin(tt * 1.6) * 0.04;
      refs.body.position.y = 0.58 + Math.sin(tt * 2) * 0.012;
      break;
    default:
      refs.legL.rotation.x = 0; refs.legR.rotation.x = 0;
      refs.legL.scale.y = 1; refs.legR.scale.y = 1;
      refs.armL.rotation.x = 0; refs.armR.rotation.x = 0;
      refs.armL.rotation.z = 0.3; refs.armR.rotation.z = -0.3;
      refs.head.rotation.x = 0;
      refs.body.scale.set(1, 1 + Math.sin(tt * 2.2) * 0.012, 1);
      refs.body.position.y = 0.58 + Math.sin(tt * 2.2) * 0.014;
      refs.head.position.y = 1.18 + Math.sin(tt * 2.2) * 0.012;
      ch.group.position.y = 0;
  }
}

function faceTowards(ch, tx, tz, dt, rate = 10) {
  const dx = tx - ch.group.position.x;
  const dz = tz - ch.group.position.z;
  if (dx * dx + dz * dz < 0.0004) return;
  const target = Math.atan2(dx, dz);
  let diff = target - ch.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  ch.facing += diff * Math.min(1, dt * rate);
  ch.group.rotation.y = ch.facing;
}

function moveWithCollision(ch, dx, dz) {
  const p = ch.group.position;
  let nx = p.x + dx;
  let nz = p.z + dz;
  const d = Math.hypot(nx, nz);
  if (d > BOUND_R) { nx *= BOUND_R / d; nz *= BOUND_R / d; }
  for (const c of colliders) {
    const cx = nx - c.x;
    const cz = nz - c.z;
    const dist = Math.hypot(cx, cz);
    const min = c.r + 0.34;
    if (dist < min && dist > 0.0001) {
      nx = c.x + (cx / dist) * min;
      nz = c.z + (cz / dist) * min;
    }
  }
  p.x = nx; p.z = nz;
}

// =========================================================
//  视角切换：第三人称（上帝视角）/ 第一视角
// =========================================================
function setCamMode(mode) {
  camMode = mode;
  const isFirst = mode === 'first';
  camera = isFirst ? fpCam : orthoCam;
  player.group.visible = !isFirst;
  fpPitch = 0;
  camToggleBtn.textContent = isFirst ? '切换：第一视角' : '切换：上帝视角';
  if (isFirst) {
    moveTarget = null;
    const p = player.group.position;
    player.facing = Math.atan2(TREE_POS.x - p.x, TREE_POS.z - p.z);
    player.group.rotation.y = player.facing;
  }
  resize();
}

// =========================================================
//  输入：键盘 + 点击地面 + 虚拟摇杆 + 第一视角拖拽
// =========================================================
const keys = new Set();
const joyVec = { x: 0, z: 0 };
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let lookDrag = null;

function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === 'e' && state === 'explore') tryOpenNearest();
    if (k === 'v') setCamMode(camMode === 'third' ? 'first' : 'third');
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'explore') return;
    if (camMode === 'first') {
      lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(exhibits.map((x) => x.hit));
    if (hits.length) {
      const ex = exhibits.find((x) => x.hit === hits[0].object);
      if (ex && Math.hypot(player.group.position.x - ex.x, player.group.position.z - ex.z) < 3.4) {
        openExhibit(ex);
        return;
      }
    }
    const pt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, pt) && Math.hypot(pt.x, pt.z) < BOUND_R) {
      moveTarget = pt;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!lookDrag || e.pointerId !== lookDrag.id) return;
    player.facing += (e.clientX - lookDrag.x) * 0.008;
    fpPitch = THREE.MathUtils.clamp(fpPitch + (e.clientY - lookDrag.y) * 0.004, -0.35, 0.35);
    lookDrag.x = e.clientX; lookDrag.y = e.clientY;
  });
  const lookEnd = (e) => { if (lookDrag && e.pointerId === lookDrag.id) lookDrag = null; };
  canvas.addEventListener('pointerup', lookEnd);
  canvas.addEventListener('pointercancel', lookEnd);

  let joyId = null;
  const setNub = (dx, dy) => { joystickNub.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; };
  joystickEl.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joystickEl.setPointerCapture(joyId); });
  joystickEl.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyId) return;
    const r = joystickEl.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    const max = r.width / 2 - 20;
    if (len > max) { dx *= max / len; dy *= max / len; }
    setNub(dx, dy);
    joyVec.x = dx / max; joyVec.z = dy / max;
  });
  const joyEnd = (e) => {
    if (e.pointerId !== joyId) return;
    joyId = null; joyVec.x = 0; joyVec.z = 0; setNub(0, 0);
  };
  joystickEl.addEventListener('pointerup', joyEnd);
  joystickEl.addEventListener('pointercancel', joyEnd);

  promptEl.addEventListener('click', tryOpenNearest);
  modalClose.addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
  downloadBtn.addEventListener('click', downloadCard);
  closeFinaleBtn.addEventListener('click', () => {
    finaleEl.classList.remove('open');
    state = 'done';
    player.refs.anim = 'idle';
    partner.refs.anim = 'idle';
  });
  camToggleBtn.addEventListener('click', () => setCamMode(camMode === 'third' ? 'first' : 'third'));
}

function inputVector() {
  let x = 0, z = 0;
  if (keys.has('w') || keys.has('arrowup')) z -= 1;
  if (keys.has('s') || keys.has('arrowdown')) z += 1;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  x += joyVec.x; z += joyVec.z;
  const len = Math.hypot(x, z);
  return len > 1 ? { x: x / len, z: z / len } : { x, z };
}

// =========================================================
//  互动闭环
// =========================================================
function nearestExhibit() {
  let best = null, bestD = 2.8;
  for (const ex of exhibits) {
    const d = Math.hypot(player.group.position.x - ex.x, player.group.position.z - ex.z);
    if (d < bestD) { best = ex; bestD = d; }
  }
  return best;
}

function nextExhibit() {
  return exhibits.find((e) => !visited.has(e.data.id)) || null;
}

let currentExhibit = null;

function tryOpenNearest() {
  const ex = nearestExhibit();
  if (ex) openExhibit(ex);
}

function openExhibit(ex) {
  currentExhibit = ex;
  state = 'viewing';
  moveTarget = null;
  modalSource.textContent = `${ex.data.zone} · ${ex.data.source}`;
  modalTitle.textContent = ex.data.title;
  modalBody.textContent = ex.data.body;
  modalCurator.textContent = ex.data.curator;
  modalEl.classList.add('open');
  player.refs.anim = 'view';
  faceTowards(player, ex.x, ex.z, 1);
  partner.refs.anim = 'wave';
  setTimeout(() => { if (state === 'viewing') partner.refs.anim = 'idle'; }, 1800);
  if (!visited.has(ex.data.id)) {
    visited.add(ex.data.id);
    progressEl.textContent = `已参观 ${visited.size} / 4`;
  }
}

function closeModal() {
  modalEl.classList.remove('open');
  if (state === 'viewing') {
    player.refs.anim = 'idle';
    if (visited.size === 4) startFinale();
    else state = 'explore';
  }
}

// =========================================================
//  结尾：记忆树开花 + 回忆卡
// =========================================================
let celebrateT = 0;

function startFinale() {
  state = 'finale-walk';
  moveTarget = null;
  modalEl.classList.remove('open');
}

function updateFinale(dt) {
  if (state === 'finale-walk') {
    const pTarget = { x: TREE_POS.x - 0.85, z: TREE_POS.z - 1.7 };
    const bTarget = { x: TREE_POS.x + 0.85, z: TREE_POS.z - 1.55 };
    const arrive = (ch, t) => {
      const dx = t.x - ch.group.position.x;
      const dz = t.z - ch.group.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.15) {
        moveWithCollision(ch, (dx / d) * WALK_SPEED * dt, (dz / d) * WALK_SPEED * dt);
        faceTowards(ch, t.x, t.z, dt);
        ch.refs.anim = 'walk';
        return false;
      }
      return true;
    };
    const a = arrive(player, pTarget);
    const b = arrive(partner, bTarget);
    if (a && b) {
      state = 'celebrate';
      celebrateT = 0;
      faceTowards(player, TREE_POS.x, TREE_POS.z, 1);
      faceTowards(partner, TREE_POS.x, TREE_POS.z, 1);
      player.refs.anim = 'celebrate';
      partner.refs.anim = 'celebrate';
      memoryTree.bloomed = true;
    }
  } else if (state === 'celebrate') {
    celebrateT += dt;
    if (celebrateT > 3.2) {
      state = 'card';
      drawMemoryCard();
      finaleEl.classList.add('open');
    }
  }
}

function updateBloom(dt) {
  if (!memoryTree?.bloomed) return;
  memoryTree.bloomT += dt;
  for (const b of memoryTree.blossoms) {
    const t = Math.max(0, memoryTree.bloomT - b.userData.delay);
    const s = Math.min(1, t * 2.2);
    b.scale.setScalar(0.001 + (1 - Math.pow(1 - s, 3)));
  }
  const t = memoryTree.bloomT;
  for (const p of petals) {
    if (t < 1.2) break;
    p.visible = true;
    const s = p.userData.seed;
    const fall = ((t * p.userData.speed + s) % 4) / 4;
    p.position.set(
      TREE_POS.x + Math.sin(s * 7 + t * 0.8) * 2.2,
      3.6 - fall * 3.4,
      TREE_POS.z + Math.cos(s * 5 + t * 0.6) * 2.2,
    );
    p.rotation.set(t * 2 + s, s, t * 1.4);
  }
}

function drawMemoryCard() {
  const ctx = cardCanvas.getContext('2d');
  const W = cardCanvas.width, H = cardCanvas.height;
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#bde37e';
  ctx.beginPath(); ctx.ellipse(W / 2, -80, W * 0.85, 320, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a3d266';
  ctx.beginPath(); ctx.ellipse(W * 0.2, 60, 130, 60, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * 0.82, 40, 150, 70, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b3795a'; ctx.fillRect(W / 2 - 14, 130, 28, 90);
  ctx.fillStyle = '#6fbf5a';
  ctx.beginPath(); ctx.arc(W / 2, 120, 78, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffb3c9';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 74, 120 + Math.sin(a) * 70, 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a7f68';
  ctx.font = '700 30px Inter, "PingFang SC", sans-serif';
  ctx.fillText('我们看过的世界 · 本周共同回忆', W / 2, 320);
  ctx.fillStyle = '#2b2620';
  ctx.font = '620 64px "PingFang SC", sans-serif';
  ctx.fillText('我们想暂时逃离', W / 2, 430);
  ctx.fillText('城市的一周', W / 2, 510);
  ctx.fillStyle = '#8a7f68';
  ctx.font = '400 30px "PingFang SC", sans-serif';
  ctx.fillText(EXHIBITION.period, W / 2, 575);
  ctx.textAlign = 'left';
  EXHIBITION.exhibits.forEach((ex, i) => {
    const y = 700 + i * 108;
    ctx.fillStyle = '#f7f2e2';
    ctx.beginPath(); ctx.roundRect(90, y - 56, W - 180, 88, 18); ctx.fill();
    ctx.fillStyle = '#ff9d7a';
    ctx.beginPath(); ctx.arc(140, y - 12, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf6';
    ctx.font = '700 30px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 140, y - 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2b2620';
    ctx.font = '620 34px "PingFang SC", sans-serif';
    ctx.fillText(ex.zone, 196, y - 22);
    ctx.fillStyle = '#8a7f68';
    ctx.font = '400 26px "PingFang SC", sans-serif';
    ctx.fillText(ex.source, 196, y + 16);
  });
  ctx.fillStyle = '#5d5648';
  ctx.font = '400 28px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  const note = EXHIBITION.cardNote;
  const half = Math.ceil(note.length / 2);
  ctx.fillText(note.slice(0, half), W / 2, 1210);
  ctx.fillText(note.slice(half), W / 2, 1256);
  ctx.fillStyle = '#c9bfa8';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('WUTONG.WORLD · SHARED WORLDS · WEEK 01', W / 2, 1360);
}

function downloadCard() {
  cardCanvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '本周共同回忆-我们看过的世界.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// =========================================================
//  伙伴 AI：带路引导参观顺序 + 跟随 / 等待 / 望向展品
// =========================================================
function guideAnchor(ex) {
  const a = faceCenterAngle(ex.x, ex.z);
  return { x: ex.x + Math.sin(a) * 2.3, z: ex.z + Math.cos(a) * 2.3 };
}

function updatePartner(dt) {
  if (state === 'finale-walk' || state === 'celebrate') return;
  const pp = partner.group.position;
  const up = player.group.position;
  const dx = up.x - pp.x;
  const dz = up.z - pp.z;
  const dPlayer = Math.hypot(dx, dz);

  if (state === 'viewing' && currentExhibit) {
    if (dPlayer > 1.7) {
      moveWithCollision(partner, (dx / dPlayer) * PARTNER_SPEED * dt, (dz / dPlayer) * PARTNER_SPEED * dt);
      faceTowards(partner, up.x, up.z, dt);
      partner.refs.anim = 'walk';
    } else {
      if (partner.refs.anim !== 'wave') partner.refs.anim = 'view';
      faceTowards(partner, currentExhibit.x, currentExhibit.z, dt, 5);
    }
    return;
  }

  const next = nextExhibit();

  if (next && state === 'explore') {
    // 带路模式：走到下一个展区的引导点，等待并朝玩家挥手
    const anchor = guideAnchor(next);
    const dAnchor = Math.hypot(anchor.x - pp.x, anchor.z - pp.z);
    const playerNearNext = Math.hypot(up.x - next.x, up.z - next.z) < 3.6;

    if (playerNearNext) {
      // 玩家到了展区附近，伙伴陪在身边
      if (dPlayer > 1.9) {
        moveWithCollision(partner, (dx / dPlayer) * PARTNER_SPEED * dt, (dz / dPlayer) * PARTNER_SPEED * dt);
        faceTowards(partner, up.x, up.z, dt);
        partner.refs.anim = 'walk';
      } else {
        if (partner.refs.anim === 'walk') partner.refs.anim = 'idle';
        faceTowards(partner, next.x, next.z, dt, 4);
      }
    } else if (dAnchor > 0.4 && dPlayer < 8) {
      moveWithCollision(partner, ((anchor.x - pp.x) / dAnchor) * PARTNER_SPEED * dt, ((anchor.z - pp.z) / dAnchor) * PARTNER_SPEED * dt);
      faceTowards(partner, anchor.x, anchor.z, dt);
      partner.refs.anim = 'walk';
    } else {
      // 在引导点等待，周期性挥手吸引玩家
      partner.refs.anim = (partner.refs.t % 3.2) < 1.4 ? 'wave' : 'idle';
      faceTowards(partner, up.x, up.z, dt, 5);
    }
    return;
  }

  // 全部参观完 / 结尾后：普通跟随
  if (dPlayer > 3.4) {
    moveWithCollision(partner, (dx / dPlayer) * PARTNER_SPEED * dt, (dz / dPlayer) * PARTNER_SPEED * dt);
    faceTowards(partner, up.x, up.z, dt);
    partner.refs.anim = 'walk';
  } else {
    if (partner.refs.anim === 'walk') partner.refs.anim = 'idle';
    if (partner.refs.anim === 'idle') faceTowards(partner, up.x, up.z, dt, 4);
  }
}

// 下一个展区的地面光环提示（无文字的顺序引导）
function updateGuideRing(t) {
  const next = nextExhibit();
  if (next && state === 'explore') {
    guideRing.visible = true;
    guideRing.position.set(next.x, 0.045, next.z);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
    guideRing.material.opacity = 0.18 + pulse * 0.28;
    guideRing.scale.setScalar(1 + pulse * 0.1);
  } else {
    guideRing.visible = false;
  }
}

// =========================================================
//  主循环
// =========================================================
function update(dt, t) {
  if (state === 'explore') {
    const iv = inputVector();
    if (camMode === 'first') {
      const turn = (keys.has('a') || keys.has('arrowleft') ? 1 : 0) - (keys.has('d') || keys.has('arrowright') ? 1 : 0);
      player.facing += turn * 2.4 * dt;
      const fwd = -iv.z;
      if (Math.abs(fwd) > 0.05) {
        const dirX = Math.sin(player.facing);
        const dirZ = Math.cos(player.facing);
        moveWithCollision(player, dirX * fwd * WALK_SPEED * dt, dirZ * fwd * WALK_SPEED * dt);
        player.refs.anim = 'walk';
      } else if (player.refs.anim === 'walk') {
        player.refs.anim = 'idle';
      }
      player.group.rotation.y = player.facing;
    } else {
      if (Math.hypot(iv.x, iv.z) > 0.05) {
        moveTarget = null;
        moveWithCollision(player, iv.x * WALK_SPEED * dt, iv.z * WALK_SPEED * dt);
        faceTowards(player, player.group.position.x + iv.x, player.group.position.z + iv.z, dt);
        player.refs.anim = 'walk';
      } else if (moveTarget) {
        const dx = moveTarget.x - player.group.position.x;
        const dz = moveTarget.z - player.group.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.25) { moveTarget = null; player.refs.anim = 'idle'; }
        else {
          moveWithCollision(player, (dx / d) * WALK_SPEED * dt, (dz / d) * WALK_SPEED * dt);
          faceTowards(player, moveTarget.x, moveTarget.z, dt);
          player.refs.anim = 'walk';
        }
      } else if (player.refs.anim === 'walk') {
        player.refs.anim = 'idle';
      }
    }

    const near = nearestExhibit();
    if (near) {
      promptText.textContent = visited.has(near.data.id)
        ? `再看一次「${near.data.zone}」`
        : `查看「${near.data.zone}」`;
      promptEl.classList.add('visible');
    } else {
      promptEl.classList.remove('visible');
    }
  } else {
    promptEl.classList.remove('visible');
  }

  updatePartner(dt);
  updateFinale(dt);
  updateBloom(dt);
  updateGuideRing(t);
  animateCharacter(player, dt);
  animateCharacter(partner, dt);

  for (const ex of exhibits) {
    const bubble = ex.group.userData.bubble;
    if (bubble) {
      bubble.position.y = 2.3 + Math.sin(t * 1.4) * 0.09;
      if (bubble.userData.dots) {
        for (const dot of bubble.userData.dots) {
          dot.position.y = Math.abs(Math.sin(t * 3 + dot.userData.phase)) * 0.08;
        }
      }
    }
    if (ex.group.userData.photos) {
      for (const p of ex.group.userData.photos) {
        p.rotation.x = Math.sin(t * 1.1 + p.userData.phase) * 0.07;
      }
    }
  }

  if (camMode === 'first') {
    const dirX = Math.sin(player.facing);
    const dirZ = Math.cos(player.facing);
    const eyeX = player.group.position.x + dirX * 0.2;
    const eyeZ = player.group.position.z + dirZ * 0.2;
    camera.position.set(eyeX, 1.5, eyeZ);
    camera.lookAt(eyeX + dirX * 4, 1.35 - fpPitch * 4, eyeZ + dirZ * 4);
  } else {
    camTarget.lerp(player.group.position, Math.min(1, dt * 3.2));
    camera.position.set(camTarget.x, camTarget.y + 13.5, camTarget.z + 11.5);
    camera.lookAt(camTarget.x, 0.6, camTarget.z);
  }
}

// =========================================================
//  初始化
// =========================================================
function resize() {
  const aspect = innerWidth / innerHeight;
  const frustumH = innerWidth < 720 ? 15.5 : 13;
  orthoCam.left = (-frustumH * aspect) / 2;
  orthoCam.right = (frustumH * aspect) / 2;
  orthoCam.top = frustumH / 2;
  orthoCam.bottom = -frustumH / 2;
  orthoCam.updateProjectionMatrix();
  fpCam.aspect = aspect;
  fpCam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function init() {
  if (!window.WebGLRenderingContext) throw new Error('WebGL unavailable');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 28, 58);

  orthoCam = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100);
  fpCam = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.05, 120);
  camera = orthoCam;

  const hemi = new THREE.HemisphereLight(0xfff8e6, 0xa3d266, 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 2.0);
  sun.position.set(9, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.0015;
  scene.add(sun);

  buildIsland();
  buildPaths();
  buildPond();
  buildTrees();
  buildStones();
  buildFlowers();
  buildEntrance();
  exhibits = buildExhibits();
  memoryTree = buildMemoryTree();

  // 下一个展区的引导光环
  guideRing = new THREE.Mesh(
    new THREE.RingGeometry(1.95, 2.4, 40),
    new THREE.MeshBasicMaterial({ color: 0xfff3c9, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
  );
  guideRing.rotation.x = -Math.PI / 2;
  scene.add(guideRing);

  player = makeCharacter({ hat: true });
  player.group.position.copy(ENTER_POS);
  player.facing = 0;
  scene.add(player.group);

  partner = makeCharacter({ dress: true, longHair: true });
  partner.group.position.set(-1.7, 0, -9.2);
  scene.add(partner.group);

  setupInput();
  window.addEventListener('resize', resize);
  resize();

  clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    renderer.render(scene, camera);
    if (!firstFrameDone) {
      firstFrameDone = true;
      loadingEl.classList.add('hidden');
    }
  });
}

try {
  init();
  // 自动化验收钩子（Playwright 截图与状态检查用，不影响正常体验）
  window.__sharedWorlds = {
    get state() { return state; },
    get visitedCount() { return visited.size; },
    get playerPos() { const p = player.group.position; return { x: p.x, z: p.z }; },
    teleport(x, z) { player.group.position.set(x, 0, z); camTarget.set(x, 0, z); },
    open(id) { const ex = exhibits.find((e) => e.data.id === id); if (ex) openExhibit(ex); },
    closeModal,
    setCamMode,
  };
} catch (err) {
  console.error('[shared-worlds] init failed:', err);
  loadingEl.classList.add('hidden');
  fallbackEl.style.display = 'flex';
}
