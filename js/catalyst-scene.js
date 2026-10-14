/* 신정개발 홈페이지 — '촉매·충진물 교체' 배경 3D 장면 (시안 A 첫 화면 큰 틀 'reel', 단독 미리보기: tools/preview/catalyst-3d.html)
   - 장비 모델은 assets/3d/ 의 GLB 세 개다(Meshy 로 만든 로봇·절개 탱크·외부 분리장치 원본을 웹용으로 줄인 판, 원본은 바꾸지 않음).
     호스와 밝은 회색 고체 입자층만 이 파일에서 만든다(입자는 InstancedMesh 하나).
   - 약 9초 동작을 되풀이한다: 로봇이 탱크 바닥을 지나가며 흡입 헤드 앞의 입자만 거둬 들이고, 지나간 자리는 금속 바닥이 드러난다.
     끝에서 장면만 밝은 바탕으로 잠깐 가린 동안 처음 상태로 되돌린다(순간 이동·갑자기 생기는 입자가 보이지 않게).
   - 설명용 동작이다. 실제 물리 시뮬레이션이 아니며, 장비 치수·분리 원리·배출물은 나타내지 않는다(분리장치는 움직이지 않음).
   - 첫 화면 배경일 때는 보기만 한다(마우스·손가락 입력을 받지 않음). 미리보기 페이지는 interactive:true 로 끌어서 돌려 본다.
   - 가볍게: 모델·텍스처·셰이더는 처음 한 번만 준비하고 다시 쓴다. 호스는 같은 형상의 꼭짓점만 고치고, 입자는 흡입 헤드 근처 칸만 살피며
     거둔 입자는 그리는 목록에서 뺀다. 그림자 지도 대신 장비 밑 부드러운 그림자 판, 큰 화면은 그리는 점 수를 제한하고 버거우면 해상도를 스스로 낮춘다.
   - 첫 화면 배경일 때는 입력을 받지 않는다. explorable:true 면 setExplore(true) 일 때만 끌기 회전·휠(두 손가락) 확대를 켠다(같은 장면·같은 렌더 루프).
   - 지금 업무가 아니거나(setActive(false)) 화면 밖·숨은 탭이면 그리지 않는다. 다시 지금 업무가 되면 처음부터 저절로 돈다.
   - 3D 를 못 쓰거나 움직임 줄이기면 Promise 가 실패하고, 부르는 쪽이 밝은 정지 그림을 그대로 둔다. */
import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';
import { OrbitControls } from './vendor/three/controls/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/environments/RoomEnvironment.js';

/* ---------- 시간(초) ---------- */
export const LOOP = 9.2;                      /* 한 번 도는 시간 */
const FADE_IN = 0.35;                         /* 되풀이 시작: 밝은 가림막이 걷힌다 */
const MOVE = [0.35, 8.05];                    /* 로봇 이동·회수 (이전 10초 → 7.7초, 약 1.3배 빠르게) */
const RAMP = [0.35, 0.6];                     /* 출발 가속·도착 감속 시간 (처음부터 바로 움직여 1초 안에 회수가 보이게) */
const FADE_OUT = [8.5, 9.05];                 /* 끝: 밝은 바탕으로 가린다 */

/* ---------- 모델 크기·자리 (모델 원래 좌표를 재서 정한 값) ---------- */
const TANK = { s: 3.2, floor: -0.2271, minY: -0.3606 };          /* 바닥 윗면이 세계 y=0 이 되게 올린다 */
const R_IN = 0.897 * TANK.s;                                       /* 안쪽 벽 반지름 */
const GROUND = (TANK.minY - TANK.floor) * TANK.s;                  /* 탱크 밑면 = 바깥 땅 */
const RIM = (0.279 - TANK.floor) * TANK.s;                         /* 벽 윗면 */
const NOZ = (0.353 - TANK.floor) * TANK.s;                         /* 벽 위 노즐 꼭대기 */
const NOZ_DEG = [210, 230, 280, 310];
const CUT_DEG = [38, 142];                                         /* 절개되어 벽이 없는 쪽(앞) */
const ROBOT = { s: 0.85, bottom: -0.448, coupling: [-0.36, 0.385, 0.075], head: [-0.952, -0.602, 0.602], box: [-0.952, -0.448, -0.602, 0.948, 0.443, 0.604] };
const SEP = { s: 1.37, bottom: -0.952, at: [5.3, -1.0], flange: [-0.66, -0.672, -0.024] };
const HOSE_R = 0.06;
const CROSS_DEG = -13;                                             /* 호스가 벽을 넘는 방향 */
const PATH = [[1.0, 1.05], [0.2, 1.22], [-0.6, 1.0], [-1.45, 0.3]];   /* 로봇이 지나가는 길(위에서 본 x,z) */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
/* 로봇 진행률(0~1): 짧게 가속 → 일정한 속도 → 짧게 감속 */
function moveS(t) {
  const D = MOVE[1] - MOVE[0], a = RAMP[0], b = RAMP[1], v = 1 / (D - a / 2 - b / 2), x = t - MOVE[0];
  if (x <= 0) return 0;
  if (x >= D) return 1;
  if (x < a) return v * x * x / (2 * a);
  if (x > D - b) { const y = D - x; return 1 - v * y * y / (2 * b); }
  return v * (a / 2 + (x - a));
}
function veilAt(t) {
  if (t < FADE_IN) return 1 - smooth(t / FADE_IN);
  if (t > FADE_OUT[0]) return smooth((t - FADE_OUT[0]) / (FADE_OUT[1] - FADE_OUT[0]));
  return 0;
}

export async function createCatalystScene(host, opt = {}) {
  const small = !!opt.small;                          /* 휴대폰: 가벼운 모델·적은 입자 */
  const lite = !!opt.lite || /[?&]lite3d/.test(location.search);   /* 시험용(그래픽 카드 없는 자동 시험): 아주 낮은 해상도·그림자 없음. 동작 논리는 같다 */
  const interactive = !!opt.interactive;
  const base = opt.models || 'assets/3d/';
  const bg = new THREE.Color(opt.bg || '#eef0f2');
  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  if (reduce.matches && !opt.allowReduced) throw new Error('reduced-motion');

  /* ---------- 그리기 준비 (3D 를 못 쓰면 여기서 실패) ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'c3d__gl';
  const veil = document.createElement('div');
  veil.className = 'c3d__veil';
  veil.style.background = bg.getStyle();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { throw e; }
  renderer.setClearColor(bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = false;                               /* 그림자 지도는 쓰지 않는다(내장 그래픽에서 화면마다 그림자 계산이 가장 무거웠다) — 장비 밑에 부드러운 그림자 판을 깐다 */
  const PR_MAX = opt.pixelRatio || (lite ? 0.2 : Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.25));   /* 배경 그림이라 PC 는 1.25배까지 */
  const PR_MIN = Math.min(PR_MAX, small ? 0.65 : 0.75);
  let PR = PR_MAX;

  const scene = new THREE.Scene();
  scene.background = bg;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bfc6, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(4, 9, 6);
  sun.target.position.set(1, 0, 0);
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 25 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  /* 바깥 땅: 그림자만 받는 투명 면 */
  /* 바깥 땅의 부드러운 그림자 판: 탱크 둘레·분리장치 밑(빛이 오는 반대쪽으로 조금 밀림) */
  const softShadow = (w, h, x, z, op, round) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x1b2026, alphaMap: blobTex(round), transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, GROUND + 0.004, z); m.renderOrder = 1; scene.add(m); return m; };
  softShadow(8.6, 8.6, -0.35, -0.3, 0.32, true);

  /* ---------- 모델 세 개 (처음 한 번만 불러온다) ---------- */
  const loader = new GLTFLoader();
  const suf = small || lite ? '-m' : '';
  const [gTank, gRobot, gSep] = await Promise.all(['tank', 'robot', 'separator'].map((n) => loader.loadAsync(base + n + suf + '.glb')));
  /* 재질: Meshy 원본은 금속 1.0 이라 밝은 바탕에서 거울처럼 검게 보인다 → 금속 정도만 낮춘다(색·텍스처는 그대로) */
  const prep = (g, shadow, metal) => { g.scene.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; if (metal != null) m.material.metalness = metal; } }); return g.scene; };

  const tank = prep(gTank, true, 0.55);
  tank.scale.setScalar(TANK.s); tank.position.y = -TANK.floor * TANK.s;
  scene.add(tank);

  const robot = new THREE.Group();
  const robotModel = prep(gRobot, false);                           /* 움직이는 로봇은 그림자 지도 대신 바닥의 부드러운 그림자 판(매 화면 그림자를 다시 그리지 않게) */
  robotModel.scale.setScalar(ROBOT.s); robotModel.position.y = -ROBOT.bottom * ROBOT.s;
  robot.add(robotModel);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry((ROBOT.box[3] - ROBOT.box[0]) * ROBOT.s + 0.5, (ROBOT.box[5] - ROBOT.box[2]) * ROBOT.s + 0.45),
    new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: blobTex(), transparent: true, opacity: 0.5, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0.05, 0.012, 0); blob.renderOrder = 1;
  robot.add(blob);
  scene.add(robot);
  const couplingLocal = new THREE.Vector3(...ROBOT.coupling).multiplyScalar(ROBOT.s).add(new THREE.Vector3(0, -ROBOT.bottom * ROBOT.s, 0));

  const sep = prep(gSep, true, 0.6);
  sep.scale.setScalar(SEP.s);
  sep.position.set(SEP.at[0], GROUND - SEP.bottom * SEP.s, SEP.at[1]);
  scene.add(sep);
  sep.updateMatrixWorld(true);
  const flange = new THREE.Vector3(...SEP.flange).applyMatrix4(sep.matrixWorld);
  const sepBox = new THREE.Box3().setFromObject(sep);
  softShadow(3.4, 2.8, SEP.at[0] - 0.25, SEP.at[1] - 0.2, 0.28);
  [tank, sep].forEach((o) => { o.traverse((m) => { m.matrixAutoUpdate = false; m.updateMatrix(); }); o.updateMatrixWorld(true); });   /* 움직이지 않는 것 */

  /* ---------- 로봇이 지나가는 길 ---------- */
  const path = new THREE.CatmullRomCurve3(PATH.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const tmpV = new THREE.Vector3(), tmpT = new THREE.Vector3();
  function placeRobot(s) {
    path.getPointAt(s, tmpV); path.getTangentAt(s, tmpT);
    robot.position.copy(tmpV);
    robot.rotation.y = Math.atan2(tmpT.z, -tmpT.x);          /* 로봇 앞(모델 -x)을 가는 방향으로 */
    robot.updateMatrixWorld(true);
  }

  /* ---------- 입자층 (InstancedMesh 하나) ---------- */
  const gap = (small ? 0.088 : 0.064) * (lite ? 3 : 1), pr = small ? 0.038 : 0.029;
  const pts = [];
  const rand = mulberry(7);
  for (let layer = 0; layer < 2; layer++) {
    const off = layer ? gap / 2 : 0;
    for (let x = -R_IN; x <= R_IN; x += gap) for (let z = -R_IN; z <= R_IN; z += gap) {
      const px = x + off + (rand() - 0.5) * gap * 0.7, pz = z + off + (rand() - 0.5) * gap * 0.7;
      if (Math.hypot(px, pz) > R_IN - pr * 1.6) continue;
      if (layer && rand() < 0.3) continue;
      pts.push([px, pr * (layer ? 2.2 : 0.95) + (rand() - 0.5) * pr * 0.3, pz]);
    }
  }
  const N = pts.length;
  const pGeo = small || lite ? new THREE.SphereGeometry(1, 5, 3) : new THREE.SphereGeometry(1, 6, 4);   /* 작은 알갱이라 낮은 다각형으로 충분(매끈한 면) — 화면당 삼각형 수를 줄인다 */
  const pGeoNear = small || lite ? new THREE.SphereGeometry(1, 7, 5) : new THREE.SphereGeometry(1, 9, 6);   /* 자세히 보기(가까이)에서만 더 둥글게 — 처음에 만들어 두고 바꿔 끼우기만 */
  const pMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x34373a });   /* 무광 알갱이 — 가벼운 재질(주변 빛 대신 약한 자체 밝기로 밝은 회색을 맞춘다) */
  const pellets = new THREE.InstancedMesh(pGeo, pMat, N);
  pellets.receiveShadow = false;
  pellets.frustumCulled = false;
  pellets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const P0 = new Float32Array(N * 3), PS = new Float32Array(N * 3), PQ = new Float32Array(N * 4);
  const baseM = new Float32Array(N * 16), baseC = new Float32Array(N * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    P0.set(pts[i], i * 3);
    const k = pr * (0.82 + rand() * 0.36);
    PS.set([k * (0.9 + rand() * 0.25), k * (0.78 + rand() * 0.2), k * (0.9 + rand() * 0.25)], i * 3);
    q.setFromEuler(e.set(rand() * 6.3, rand() * 6.3, rand() * 6.3)); PQ.set([q.x, q.y, q.z, q.w], i * 4);
    m4.compose(pv.set(pts[i][0], pts[i][1], pts[i][2]), q, sv.set(PS[i * 3], PS[i * 3 + 1], PS[i * 3 + 2])).toArray(baseM, i * 16);
    const g = 0.8 + rand() * 0.1; col.setRGB(g, g * 1.005, g * 1.01); baseC.set([col.r, col.g, col.b], i * 3);
    pellets.setColorAt(i, col);
  }
  scene.add(pellets);
  const IM = pellets.instanceMatrix, IC = pellets.instanceColor, AM = IM.array, AC = IC.array;
  /* 흡입 헤드 근처만 살피도록 바닥을 칸으로 나눈다 */
  const CELL = 0.3, GN = Math.ceil(2 * R_IN / CELL) + 1;
  const cellOf = (x, z) => clamp(Math.floor((x + R_IN) / CELL), 0, GN - 1) * GN + clamp(Math.floor((z + R_IN) / CELL), 0, GN - 1);
  const cellStart = new Int32Array(GN * GN + 1), cellIds = new Int32Array(N);
  { const cnt = new Int32Array(GN * GN); for (let i = 0; i < N; i++) cnt[cellOf(P0[i * 3], P0[i * 3 + 2])]++; for (let c = 0; c < GN * GN; c++) cellStart[c + 1] = cellStart[c] + cnt[c]; const fill = cellStart.slice(0, GN * GN); for (let i = 0; i < N; i++) cellIds[fill[cellOf(P0[i * 3], P0[i * 3 + 2])]++] = i; }
  /* 그리는 자리(slot): 거둔 입자는 마지막 자리와 바꿔 그리는 개수에서 뺀다 */
  const slotOf = new Int32Array(N), idAt = new Int32Array(N), state = new Uint8Array(N), tcap = new Float32Array(N);
  const sucking = new Int32Array(N); let nSuck = 0, count = N;
  let dMin = Infinity, dMax = -1, cMin = Infinity, cMax = -1;
  const markM = (s) => { if (s < dMin) dMin = s; if (s > dMax) dMax = s; };
  const markC = (s) => { if (s < cMin) cMin = s; if (s > cMax) cMax = s; };
  function writePellet(i, x, y, z, k) {
    pv.set(x, y, z); q.set(PQ[i * 4], PQ[i * 4 + 1], PQ[i * 4 + 2], PQ[i * 4 + 3]);
    sv.set(PS[i * 3] * k, PS[i * 3 + 1] * k, PS[i * 3 + 2] * k);
    const s = slotOf[i]; m4.compose(pv, q, sv).toArray(AM, s * 16); markM(s);
  }
  function removePellet(i) {
    const s = slotOf[i], last = count - 1;
    if (s !== last) {
      const j = idAt[last];
      AM.copyWithin(s * 16, last * 16, last * 16 + 16); AC.copyWithin(s * 3, last * 3, last * 3 + 3);
      slotOf[j] = s; idAt[s] = j; markM(s); markC(s);
    }
    slotOf[i] = -1; count--; pellets.count = count;
  }
  function flushPellets() {
    if (dMax >= 0) { IM.clearUpdateRanges(); IM.addUpdateRange(dMin * 16, (dMax - dMin + 1) * 16); IM.needsUpdate = true; }
    if (cMax >= 0) { IC.clearUpdateRanges(); IC.addUpdateRange(cMin * 3, (cMax - cMin + 1) * 3); IC.needsUpdate = true; }
    dMin = cMin = Infinity; dMax = cMax = -1;
  }
  /* 흡입 헤드 앞의 상자(로봇 좌표, 세계 크기)와 빨려 들어가는 점 */
  const hs = ROBOT.s;
  const zone = { x0: ROBOT.head[0] * hs - 0.05, x1: (ROBOT.head[0] + 0.33) * hs, z: ROBOT.head[2] * hs + 0.01 };
  const inletLocal = new THREE.Vector3((ROBOT.head[0] + 0.17) * hs, 0.07, 0);
  const foot = { x1: ROBOT.box[3] * hs + 0.04, z: ROBOT.box[5] * hs + 0.04 };   /* 처음 자리의 로봇 몸 아래 */
  const inv = new THREE.Matrix4(), lp = new THREE.Vector3(), inletW = new THREE.Vector3(), corner = new THREE.Vector3();
  function resetPellets() {
    AM.set(baseM); AC.set(baseC);
    for (let i = 0; i < N; i++) { slotOf[i] = i; idAt[i] = i; state[i] = 0; }
    count = N; nSuck = 0; pellets.count = N;
    placeRobot(0);
    inv.copy(robot.matrixWorld).invert();
    for (let i = N - 1; i >= 0; i--) {                    /* 처음 자리의 로봇 아래(가려지는 곳)만 비운다 */
      lp.set(P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]).applyMatrix4(inv);
      if (lp.x > zone.x0 && lp.x < foot.x1 && Math.abs(lp.z) < foot.z) { state[i] = 2; removePellet(i); }
    }
    IM.clearUpdateRanges(); IC.clearUpdateRanges(); IM.needsUpdate = true; IC.needsUpdate = true;
    dMin = cMin = Infinity; dMax = cMax = -1;
  }
  const CAP_T = 0.45;
  function suck(t) {
    inv.copy(robot.matrixWorld).invert();
    inletW.copy(inletLocal).applyMatrix4(robot.matrixWorld);
    /* 헤드 상자를 감싸는 칸만 본다 */
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let c4 = 0; c4 < 4; c4++) {                          /* 새 배열을 만들지 않고 네 모서리 */
      corner.set(c4 < 2 ? zone.x0 : zone.x1, 0, c4 % 2 ? zone.z : -zone.z).applyMatrix4(robot.matrixWorld);
      x0 = Math.min(x0, corner.x); x1 = Math.max(x1, corner.x); z0 = Math.min(z0, corner.z); z1 = Math.max(z1, corner.z);
    }
    const gx0 = clamp(Math.floor((x0 + R_IN) / CELL), 0, GN - 1), gx1 = clamp(Math.floor((x1 + R_IN) / CELL), 0, GN - 1);
    const gz0 = clamp(Math.floor((z0 + R_IN) / CELL), 0, GN - 1), gz1 = clamp(Math.floor((z1 + R_IN) / CELL), 0, GN - 1);
    for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
      const c = gx * GN + gz;
      for (let k = cellStart[c]; k < cellStart[c + 1]; k++) {
        const i = cellIds[k];
        if (state[i] !== 0) continue;
        lp.set(P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]).applyMatrix4(inv);
        if (lp.x > zone.x0 && lp.x < zone.x1 && Math.abs(lp.z) < zone.z) { state[i] = 1; tcap[i] = t; sucking[nSuck++] = i; }
      }
    }
    /* 빨려 드는 입자: 흡입구로 끌려가며 작아지다가 사라진다 */
    for (let n = nSuck - 1; n >= 0; n--) {
      const i = sucking[n], k = clamp((t - tcap[i]) / CAP_T, 0, 1), a = k * k;
      if (k >= 1) { state[i] = 2; removePellet(i); sucking[n] = sucking[--nSuck]; continue; }
      const bx = P0[i * 3], by = P0[i * 3 + 1], bz = P0[i * 3 + 2];
      writePellet(i, bx + (inletW.x - bx) * a, by + (inletW.y - by) * a + Math.sin(k * Math.PI) * 0.05, bz + (inletW.z - bz) * a, 1 - 0.85 * a);
    }
    flushPellets();
  }

  /* ---------- 호스: 한 번 만든 형상의 꼭짓점만 고친다 ---------- */
  const SEG = small ? 110 : 160, RAD = small ? 10 : 12;
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.05, bumpMap: ribs(), bumpScale: 1.4 });
  hoseMat.bumpMap.repeat.set(small ? 70 : 110, 1);
  const hoseGeo = new THREE.BufferGeometry();
  const HP = new Float32Array((SEG + 1) * (RAD + 1) * 3), HN = new Float32Array((SEG + 1) * (RAD + 1) * 3), HUV = new Float32Array((SEG + 1) * (RAD + 1) * 2);
  const HI = new Uint16Array(SEG * RAD * 6);
  for (let i = 0, w = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
    const a = i * (RAD + 1) + j, b = (i + 1) * (RAD + 1) + j;
    HI[w++] = a; HI[w++] = b; HI[w++] = a + 1; HI[w++] = b; HI[w++] = b + 1; HI[w++] = a + 1;
  }
  for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) { const v = i * (RAD + 1) + j; HUV[v * 2] = i / SEG; HUV[v * 2 + 1] = j / RAD; }
  hoseGeo.setAttribute('position', new THREE.BufferAttribute(HP, 3).setUsage(THREE.DynamicDrawUsage));
  hoseGeo.setAttribute('normal', new THREE.BufferAttribute(HN, 3).setUsage(THREE.DynamicDrawUsage));
  hoseGeo.setAttribute('uv', new THREE.BufferAttribute(HUV, 2));
  hoseGeo.setIndex(new THREE.BufferAttribute(HI, 1));
  const hose = new THREE.Mesh(hoseGeo, hoseMat);
  hose.frustumCulled = false;
  scene.add(hose);
  const RC = Array.from({ length: RAD + 1 }, (_, j) => [Math.cos(j / RAD * Math.PI * 2), Math.sin(j / RAD * Math.PI * 2)]);
  const HPTS = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  const tA = new THREE.Vector3(), nA = new THREE.Vector3(), bA = new THREE.Vector3(), dA = new THREE.Vector3();
  const cuffMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.8 });
  const cuffs = [0, 1].map(() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(HOSE_R * 1.3, HOSE_R * 1.3, 0.1, 20), cuffMat); scene.add(c); return c; });
  const crossDir = new THREE.Vector3(Math.cos(CROSS_DEG * Math.PI / 180), 0, Math.sin(CROSS_DEG * Math.PI / 180));
  const hoseIn = crossDir.clone().multiplyScalar(R_IN - 0.25).setY(RIM + 0.22);
  const hoseOut = crossDir.clone().multiplyScalar(R_IN + 0.45).setY(RIM + 0.22);
  const flangeLead = flange.clone().addScaledVector(new THREE.Vector3(-1, 0, 0).applyQuaternion(sep.quaternion), 0.42);
  const hosePts = Array.from({ length: 9 }, () => new THREE.Vector3());
  const hoseCurve = new THREE.CatmullRomCurve3(hosePts, false, 'centripetal');
  hoseCurve.arcLengthDivisions = 120;
  const back = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), cw = new THREE.Vector3();
  function shapeHose() {
    cw.copy(couplingLocal).applyMatrix4(robot.matrixWorld);
    back.set(1, 0, 0).applyQuaternion(robot.quaternion);                 /* 로봇 뒤쪽 */
    hosePts[0].copy(cw);
    hosePts[1].copy(cw).addScaledVector(back, 0.22).addScaledVector(up, 0.2);
    const a = hosePts[1], b = hoseIn, d = a.distanceTo(b);
    hosePts[2].lerpVectors(a, b, 0.33).setY(Math.max(a.y, 0.5) + (b.y - a.y) * 0.25 - Math.min(0.18, d * 0.05));
    hosePts[3].lerpVectors(a, b, 0.7).setY(a.y + (b.y - a.y) * 0.78);
    hosePts[4].copy(hoseIn);
    hosePts[5].copy(hoseOut);
    hosePts[6].lerpVectors(hoseOut, flangeLead, 0.5).setY((hoseOut.y + flangeLead.y) * 0.5 - 0.05);
    hosePts[7].copy(flangeLead);
    hosePts[8].copy(flange);
    hoseCurve.updateArcLengths();
    for (let i = 0; i <= SEG; i++) hoseCurve.getPointAt(i / SEG, HPTS[i]);
    /* 관을 따라 틀(접선·법선)을 옮겨 가며 둥근 단면을 놓는다 — 뒤틀림 없이, 새 객체를 만들지 않고 */
    for (let i = 0; i <= SEG; i++) {
      tA.subVectors(HPTS[Math.min(SEG, i + 1)], HPTS[Math.max(0, i - 1)]).normalize();
      if (i === 0) { nA.crossVectors(tA, up); if (nA.lengthSq() < 1e-6) nA.set(1, 0, 0); nA.normalize(); }
      else { nA.addScaledVector(tA, -tA.dot(nA)).normalize(); }
      bA.crossVectors(tA, nA);
      const P = HPTS[i];
      for (let j = 0; j <= RAD; j++) {
        const v = (i * (RAD + 1) + j) * 3, c = RC[j][0], s = RC[j][1];
        dA.set(nA.x * c + bA.x * s, nA.y * c + bA.y * s, nA.z * c + bA.z * s);
        HN[v] = dA.x; HN[v + 1] = dA.y; HN[v + 2] = dA.z;
        HP[v] = P.x + dA.x * HOSE_R; HP[v + 1] = P.y + dA.y * HOSE_R; HP[v + 2] = P.z + dA.z * HOSE_R;
      }
      if (i === 0) putCuff(cuffs[0], 0, 2);
      if (i === SEG) putCuff(cuffs[1], SEG, SEG - 2);
    }
    hoseGeo.attributes.position.needsUpdate = true; hoseGeo.attributes.normal.needsUpdate = true;
  }
  function putCuff(c, at, toward) {
    c.position.copy(HPTS[at]).lerp(HPTS[toward], 0.5);
    tmpT.subVectors(HPTS[toward], HPTS[at]).normalize();
    c.quaternion.setFromUnitVectors(up, tmpT);
  }

  /* ---------- 카메라 ---------- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const DEF = { az: 20 * Math.PI / 180, polar: 59 * Math.PI / 180 };            /* 첫 화면 배경 구도 */
  const EXP = { az: 22 * Math.PI / 180, polar: 50 * Math.PI / 180 };            /* 자세히 보기: 탱크 안 입자와 로봇이 크게 보이는 구도 */
  const view = { userMoved: false, tween: null, defaultDist: 14, expDist: 8, target: new THREE.Vector3(), expTarget: new THREE.Vector3() };
  const R_OUT = 0.952 * TANK.s + 0.05;                                           /* 탱크 바깥 테두리 */
  const explorable = interactive || !!opt.explorable;
  let controls = null, lastChange = 0, camT0 = 0, exploring = false;
  if (explorable) {
    /* 조작 도구는 처음 한 번만 만든다. 첫 화면 배경일 때는 꺼 두고(누를 수 없음), '3D 자세히 보기'에서만 켠다 */
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false; controls.zoomToCursor = true; controls.zoomSpeed = 0.9;
    controls.rotateSpeed = 0.7;
    controls.addEventListener('start', () => { view.userMoved = true; view.tween = null; });
    controls.addEventListener('change', () => { lastChange = performance.now(); kick(); });
    /* 휠은 장면 안에서만 확대·축소에 쓰고 페이지 스크롤(업무명 넘김)로 넘기지 않는다 */
    canvas.addEventListener('wheel', (e) => { if (controls.enabled) e.preventDefault(); }, { passive: false });
  }
  const target = controls ? controls.target : new THREE.Vector3();
  function setInput(on) {
    if (!controls) { canvas.style.pointerEvents = 'none'; return; }
    controls.enabled = on;
    controls.enableZoom = exploring || !!opt.zoom;
    canvas.style.pointerEvents = on ? 'auto' : 'none';
    canvas.style.touchAction = on ? (exploring ? 'none' : 'pan-y') : '';   /* 자세히 보기에서는 손가락 회전·두 손가락 확대, 아니면 세로 스크롤은 페이지로 */
    canvas.style.cursor = on ? 'grab' : '';
  }
  function limits() {
    if (!controls) return;
    if (exploring) { controls.minDistance = 2.4; controls.maxDistance = Math.max(10, view.defaultDist * 1.02); controls.minPolarAngle = 0.22; controls.maxPolarAngle = 1.22; }   /* 가장 멀리는 첫 화면 구도 정도까지 */
    else { controls.minDistance = 6; controls.maxDistance = view.defaultDist * 1.6; controls.minPolarAngle = 0.32; controls.maxPolarAngle = 1.36; }
  }
  const sph = new THREE.Spherical();
  function fit() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1, asp = w / h;
    /* 큰 화면에서는 그리는 점의 수가 약 150만(휴대폰 120만)을 넘지 않게 처음부터 맞춘다 */
    renderer.setPixelRatio(opt.pixelRatio ? PR : Math.min(PR, Math.sqrt((small ? 1.2e6 : 1.5e6) / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = asp;
    const portrait = asp < 0.9;
    camera.fov = portrait ? 40 : 30;
    camera.updateProjectionMatrix();
    const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const halfW = portrait ? 3.3 : 4.9, halfH = 2.6;
    view.defaultDist = Math.max(halfW / Math.tan(hf / 2), halfH / Math.tan(vf / 2)) + 2.2;
    view.target.set(portrait ? 0.25 : 1.45, portrait ? 0.1 : 0.35, portrait ? 0.1 : -0.25);
    view.expDist = portrait ? 10.5 : 7.4;
    view.expTarget.set(portrait ? 0.1 : 0.0, 0.25, portrait ? 0.6 : 0.75);
    limits();
    if (!view.userMoved && !view.tween) {
      if (exploring) { target.copy(view.expTarget); placeCam(EXP.az, EXP.polar, view.expDist); }
      else { target.copy(view.target); placeCam(DEF.az, DEF.polar, view.defaultDist); }
    }
  }
  function placeCam(az, polar, dist) {
    sph.set(dist, polar, az);
    camera.position.setFromSpherical(sph).add(target);
    camera.lookAt(target);
  }
  /* 지금 시점에서 정한 시점으로 부드럽게 옮긴다(가장 짧은 쪽으로 돈다) */
  function tweenTo(az, polar, dist, tg, dur, done) {
    sph.setFromVector3(tmpV.copy(camera.position).sub(target));
    let fa = sph.theta, d = az - fa;
    while (d > Math.PI) { fa += 2 * Math.PI; d -= 2 * Math.PI; }
    while (d < -Math.PI) { fa -= 2 * Math.PI; d += 2 * Math.PI; }
    view.tween = { t0: performance.now(), dur, from: { az: fa, polar: sph.phi, dist: sph.radius, target: target.clone() }, to: { az, polar, dist, target: tg.clone() }, done };
    kick();
  }
  function autoCam(now) {
    if (view.tween) {
      const tw = view.tween, k = smooth(clamp((now - tw.t0) / tw.dur, 0, 1));
      target.lerpVectors(tw.from.target, tw.to.target, k);
      placeCam(tw.from.az + (tw.to.az - tw.from.az) * k, tw.from.polar + (tw.to.polar - tw.from.polar) * k, tw.from.dist + (tw.to.dist - tw.from.dist) * k);
      if (k >= 1) { view.tween = null; if (tw.done) tw.done(now); }
      return;
    }
    if (exploring || view.userMoved || opt.autoCamera === false) return;
    const s = (now - camT0) / 1000;                              /* 처음 그림(정지 그림)과 같은 시점에서 천천히 흔든다 */
    placeCam(DEF.az + Math.sin(s * 2 * Math.PI / 24) * 0.08, DEF.polar + Math.sin(s * 2 * Math.PI / 31) * 0.02, view.defaultDist);
  }
  /* 카메라가 바닥·탱크 벽·분리장치를 뚫거나 장면에서 멀리 벗어나지 않게 */
  const sepGuard = sepBox.clone().expandByScalar(0.25), sceneMid = new THREE.Vector3(1.4, 0.4, -0.2);
  function constrain() {
    const p = camera.position, t = target;
    t.x = clamp(t.x, -3.0, 6.0); t.y = clamp(t.y, 0.05, 2.2); t.z = clamp(t.z, -3.0, 3.0);
    const r = Math.hypot(p.x, p.z);
    const minY = r < R_OUT + 0.3 ? 0.95 : GROUND + 0.7;                          /* 탱크 안에서는 입자·로봇 위로 */
    if (p.y < minY) p.y = minY;
    if (p.y < RIM + 0.35 && r > R_IN - 0.3 && r < R_OUT + 0.35) {               /* 벽 두께 안으로 들어가면 안쪽·바깥 가까운 쪽으로 */
      const deg = ((Math.atan2(p.z, p.x) * 180 / Math.PI) + 360) % 360;
      if (!(deg > CUT_DEG[0] + 4 && deg < CUT_DEG[1] - 4)) { const k = (r < (R_IN + R_OUT) / 2 ? R_IN - 0.3 : R_OUT + 0.35) / r; p.x *= k; p.z *= k; }
    }
    if (sepGuard.containsPoint(p)) p.y = sepGuard.max.y;
    const dm = p.distanceTo(sceneMid); if (dm > 26) p.lerp(sceneMid, 1 - 26 / dm);
  }

  /* ---------- 시간·되풀이 (실제 시간 기준: 화면이 1초에 몇 번 그려지든 같은 빠르기) ---------- */
  let lt = FADE_IN, playing = true, running = false, active = !!opt.active, onScreen = true, raf = 0, last = 0, frameNo = 0, lastVeil = '';
  const watch = { resets: [], jumps: 0, maxStep: 0, starts: 0, restarts: 0, prPath: [] }, prevPos = new THREE.Vector3(), prev = { veil: 1 };
  function step(t) {
    placeRobot(moveS(t));
    const v = veilAt(t), d = prevPos.distanceTo(robot.position); prevPos.copy(robot.position);
    if (prev.veil < 0.98 && v < 0.98) { watch.maxStep = Math.max(watch.maxStep, d); if (d > 0.08) watch.jumps++; }
    prev.veil = v;
    suck(t);
    shapeHose();
    const vs = v > 0.001 ? v.toFixed(3) : '0';
    if (vs !== lastVeil) { veil.style.opacity = vs; lastVeil = vs; }      /* 바뀔 때만 */
  }
  function advance(dt) {
    lt += dt;
    if (lt >= LOOP) { watch.resets.push(+prev.veil.toFixed(3)); lt -= LOOP; resetPellets(); placeRobot(0); prevPos.copy(robot.position); }
    step(lt);
  }
  /* 처음부터(가림막 없이) — 지금 업무가 될 때마다. 사용자가 정한 시점은 건드리지 않는다 */
  function restart() { camT0 = performance.now(); if (!view.userMoved && !exploring && !view.tween) placeCam(DEF.az, DEF.polar, view.defaultDist); lt = FADE_IN; resetPellets(); placeRobot(0); prevPos.copy(robot.position); prev.veil = 0; step(lt); watch.restarts++; }
  /* 저사양 대응: 1초쯤 재서 느리면 해상도를 0.15씩 낮춘다(PC 0.75, 휴대폰 0.65까지). 장비 모양·입자·회수 과정은 그대로 */
  let aSum = 0, aN = 0, aSlow = 0, lastAdapt = 0;
  function adapt(raw, now) {
    if (frameNo < 30 || lite || opt.pixelRatio) return;
    aSum += raw; aN++; if (raw > 0.0175) aSlow++;
    if (aN < 60) return;
    const avg = aSum / aN, slowShare = aSlow / aN; aSum = 0; aN = 0; aSlow = 0;
    if ((avg <= 0.018 && slowShare < 0.1) || now - lastAdapt < 1200) return;   /* 평균이 55fps 아래이거나, 60Hz 한 화면(17ms)을 넘는 화면이 10% 넘으면 */
    lastAdapt = now;
    if (PR > PR_MIN + 0.001) { PR = Math.max(PR_MIN, +(PR - 0.15).toFixed(2)); watch.prPath.push('pr' + PR); fit(); return; }
  }
  let inFrame = false;
  function frame(now) {
    raf = 0;
    if (!running) return;
    inFrame = true;
    const raw = last ? (now - last) / 1000 : 1 / 60; last = now;
    const dt = Math.min(0.1, raw);
    frameNo++;
    if (playing) advance(dt);
    adapt(raw, now);
    if (view.tween || (playing && !exploring)) autoCam(now);
    if (controls && controls.enabled) { controls.update(); constrain(); }
    inFrame = false;
    renderer.render(scene, camera);
    /* 다음 화면은 한 번만 부탁한다(조작 도구의 바뀜 알림이 이미 부탁했으면 또 부탁하지 않는다 — 겹치면 화면 부탁이 불어난다) */
    if (!raf && (playing || view.tween || now - lastChange < 700)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (running && !raf && !inFrame) raf = requestAnimationFrame(frame); }
  function wake() {
    const should = active && onScreen && !document.hidden;
    if (should && !running) { running = true; last = 0; frameNo = 0; aSum = 0; aN = 0; aSlow = 0; watch.starts++; }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    kick();
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { onScreen = en[en.length - 1].isIntersecting; wake(); }, { threshold: 0 }) : null;
  const onVis = () => wake();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { fit(); renderer.render(scene, camera); lastChange = performance.now(); }) : null;
  const onResize = () => { fit(); renderer.render(scene, camera); };

  /* ---------- 미리 준비: 셰이더·텍스처를 지금 올려 두고, 그림자(움직이지 않는 장비)와 첫 화면을 그려 둔다 ---------- */
  fit();
  setInput(interactive && !opt.explorable);
  restart();
  watch.restarts = 0;
  veil.style.opacity = '0'; lastVeil = '0';
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
  scene.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'alphaMap'].forEach((k) => { if (m[k]) renderer.initTexture(m[k]); }));
  });
  pellets.geometry = pGeoNear; renderer.render(scene, camera); pellets.geometry = pGeo;   /* 가까이 볼 때 쓸 알갱이 형상도 미리 올려 둔다 */
  renderer.render(scene, camera);
  host.appendChild(canvas); host.appendChild(veil);
  if (io) io.observe(host);
  document.addEventListener('visibilitychange', onVis);
  if (ro) ro.observe(host); else window.addEventListener('resize', onResize);

  const api = {
    LOOP,
    get time() { return lt; },
    get playing() { return playing; },
    get running() { return running; },
    get userMoved() { return view.userMoved; },
    get exploring() { return exploring; },
    get pixelRatio() { return renderer.getPixelRatio(); },
    lite, canvas, veil, controls, camera,
    play() { playing = true; last = 0; wake(); },
    pause() { playing = false; renderer.render(scene, camera); },
    toggle() { playing ? api.pause() : api.play(); return playing; },
    /* 지금 업무가 되면 처음부터 저절로 돈다. 아니면 그리지 않는다 */
    setActive(on) {
      on = !!on;
      if (on && !active) { restart(); renderer.render(scene, camera); }
      active = on; wake();
    },
    /* '3D 자세히 보기': 같은 장면을 그대로 쓰며 카메라만 가까운 구도로 옮기고 조작을 켠다. 끄면 원래 구도로 돌아간다 */
    setExplore(on) {
      on = !!on;
      if (!controls || on === exploring) return;
      exploring = on;
      view.userMoved = false;
      pellets.geometry = on ? pGeoNear : pGeo;
      setInput(on);
      limits();
      if (on) tweenTo(EXP.az, EXP.polar, view.expDist, view.expTarget, 900);
      else tweenTo(DEF.az, DEF.polar, view.defaultDist, view.target, 900, (now) => { view.userMoved = false; camT0 = now; });
      wake();
    },
    resetView() {
      if (!controls) return;
      if (exploring) tweenTo(EXP.az, EXP.polar, view.expDist, view.expTarget, 800, () => { view.userMoved = false; });
      else tweenTo(DEF.az, DEF.polar, view.defaultDist, view.target, 900, (now) => { view.userMoved = false; camT0 = now; });
    },
    /* 정지 그림 만들기·시험용: 그 순간을 바로 그린다 */
    seek(t) { lt = FADE_IN; resetPellets(); placeRobot(0); for (let x = FADE_IN; x <= t; x += 1 / 30) { placeRobot(moveS(x)); suck(x); } lt = clamp(t, 0, LOOP - 0.001); step(lt); prevPos.copy(robot.position); prev.veil = veilAt(lt); if (controls) controls.update(); renderer.render(scene, camera); },
    capture(type, quality) { renderer.render(scene, camera); return canvas.toDataURL(type || 'image/jpeg', quality || 0.86); },
    check() { return clearance(); },
    /* 시험용: 어느 부분이 무거운지 나눠 재기 */
    tune(o) {
      if (o.pellets != null) pellets.visible = o.pellets;
      if (o.pr != null) { PR = o.pr; fit(); }
      if (o.models != null) { tank.visible = sep.visible = robot.visible = o.models; }
    },
    /* 시험용: 한 화면(계산+그리기)을 그래픽 카드가 끝낼 때까지 걸리는 시간을 n 번 재서 평균·최대(ms) */
    bench(n) {
      const gl = renderer.getContext(), px = new Uint8Array(4); let sum = 0, max = 0;
      for (let k = 0; k < (n || 60); k++) {
        const a = performance.now();
        advance(1 / 60); renderer.render(scene, camera);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const d = performance.now() - a; sum += d; max = Math.max(max, d);
      }
      return { avgMs: +(sum / (n || 60)).toFixed(2), maxMs: +max.toFixed(1), canvas: canvas.width + 'x' + canvas.height, pr: PR };
    },
    /* 시험용: 그리지 않고 sec 초를 1/60초씩 돌리며 되풀이·관통·한 화면 계산 시간을 잰다 */
    simulate(sec) {
      const worst = clearance(); let ms = 0, n = 0;
      for (let x = 0; x < sec; x += 1 / 60) {
        const a = performance.now(); advance(1 / 60); ms += performance.now() - a; n++;
        if (n % 6 === 0) { const c = clearance(); Object.keys(c).forEach((k) => { worst[k] = k === 'ends' ? Math.max(worst[k], c[k]) : Math.min(worst[k], c[k]); }); }
      }
      return { loops: +(n / 60 / LOOP).toFixed(2), resetsVeil: watch.resets.slice(), jumps: watch.jumps, maxStep: +watch.maxStep.toFixed(4), stepMs: +(ms / n).toFixed(3), worst };
    },
    /* 시험용: 카메라가 장면을 뚫지 않았는지(바닥 위·벽 밖) */
    camCheck() { const p = camera.position, r = Math.hypot(p.x, p.z); return { y: +p.y.toFixed(2), r: +r.toFixed(2), dist: +p.distanceTo(target).toFixed(2), target: target.toArray().map((v) => +v.toFixed(2)) }; },
    stats() { return { starts: watch.starts, restarts: watch.restarts, running, playing, exploring, prPath: watch.prPath.join(','), resets: watch.resets.join(','), jumps: watch.jumps, pellets: N, drawn: count, sucking: nSuck, t: +lt.toFixed(2), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
    dispose() {
      running = false; if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect(); if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (controls) controls.dispose(); renderer.dispose(); canvas.remove(); veil.remove();
    }
  };

  function clearance() {
    const out = { hoseFloor: 9, hoseBed: 9, hoseWall: 9, hoseGround: 9, hoseRobot: 9, hoseSep: 9, robotWall: 9, ends: 0 };
    const rb = new THREE.Box3(new THREE.Vector3(ROBOT.box[0], ROBOT.box[1], ROBOT.box[2]).multiplyScalar(ROBOT.s), new THREE.Vector3(ROBOT.box[3], ROBOT.box[4], ROBOT.box[5]).multiplyScalar(ROBOT.s));
    rb.translate(new THREE.Vector3(0, -ROBOT.bottom * ROBOT.s, 0));
    const p = new THREE.Vector3(), l = new THREE.Vector3(), ri = new THREE.Matrix4().copy(robot.matrixWorld).invert();
    for (let k = 0; k <= 400; k++) {
      const u = k / 400; hoseCurve.getPointAt(u, p);
      const r = Math.hypot(p.x, p.z), deg = ((Math.atan2(p.z, p.x) * 180 / Math.PI) + 360) % 360;
      const inCut = deg > CUT_DEG[0] && deg < CUT_DEG[1];
      if (r < R_IN) { out.hoseFloor = Math.min(out.hoseFloor, p.y - HOSE_R); if (u > 0.08) out.hoseBed = Math.min(out.hoseBed, p.y - HOSE_R - pr * 3.2); }
      else if (r < R_IN + 0.2 && !inCut) { const top = NOZ_DEG.some((n) => Math.abs(((deg - n + 540) % 360) - 180) < 7) ? NOZ : RIM; out.hoseWall = Math.min(out.hoseWall, p.y - HOSE_R - top); }
      else out.hoseGround = Math.min(out.hoseGround, p.y - HOSE_R - GROUND);
      if (u > 0.1) { l.copy(p).applyMatrix4(ri); out.hoseRobot = Math.min(out.hoseRobot, rb.distanceToPoint(l) - HOSE_R); }
      if (u < 0.88) out.hoseSep = Math.min(out.hoseSep, sepBox.distanceToPoint(p) - HOSE_R);
    }
    for (const [x, z] of [[ROBOT.box[0], ROBOT.box[2]], [ROBOT.box[0], ROBOT.box[5]], [ROBOT.box[3], ROBOT.box[2]], [ROBOT.box[3], ROBOT.box[5]]]) {
      l.set(x * ROBOT.s, 0, z * ROBOT.s).applyMatrix4(robot.matrixWorld);
      out.robotWall = Math.min(out.robotWall, R_IN - Math.hypot(l.x, l.z));
    }
    /* 호스 양 끝이 연결구에 붙어 있는지(그려진 관의 첫·끝 단면 중심과 연결구 사이 거리) */
    cw.copy(couplingLocal).applyMatrix4(robot.matrixWorld);
    out.ends = Math.max(HPTS[0].distanceTo(cw), HPTS[SEG].distanceTo(flange));
    Object.keys(out).forEach((k) => { out[k] = +out[k].toFixed(3); });
    return out;
  }

  wake();
  return api;
}

/* 로봇 아래 부드러운 그림자: 가운데가 진하고 가장자리로 사라지는 둥근 판(투명도 지도) */
function blobTex(round) {
  const c = document.createElement('canvas'); c.width = 128; c.height = round ? 128 : 96;
  const x = c.getContext('2d');
  if (round) {                                                   /* 둥근 판(탱크 둘레): 가장자리 가까이까지 진하다가 사라진다 */
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, '#fff'); g.addColorStop(0.7, '#d0d0d0'); g.addColorStop(0.86, '#555'); g.addColorStop(1, '#000');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const g = x.createRadialGradient(64, 62, 6, 64, 62, 62);
  g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#bbb'); g.addColorStop(1, '#000');
  x.save(); x.scale(1, 0.78); x.fillStyle = g; x.fillRect(0, 0, 128, 124); x.restore();
  return new THREE.CanvasTexture(c);
}
/* 주름 호스 결: 길이 방향 줄무늬(울퉁불퉁 지도) */
function ribs() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 4;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 16, 0);
  g.addColorStop(0, '#000'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, 16, 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/* 늘 같은 배치가 나오도록 하는 난수 */
function mulberry(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
