/* 신정개발 홈페이지 — '촉매·충진물 교체' 설명용 3D 장면 (시안 A 첫 화면 큰 틀 'reel' 의 배경, 단독 미리보기: tools/preview/catalyst-3d.html)
   - 장비 모델은 assets/3d/ 의 GLB 세 개다(Meshy 로 만든 로봇·절개 탱크·외부 분리장치 원본을 웹용으로 줄인 판, 원본은 바꾸지 않음).
     호스와 밝은 회색 고체 입자층만 이 파일에서 만든다(입자는 InstancedMesh 하나).
   - 약 12초 동작을 되풀이한다: 로봇이 탱크 바닥을 천천히 지나가며 흡입 헤드 앞의 입자만 거둬 들이고, 지나간 자리는 금속 바닥이 드러난다.
     끝에서 장면만 밝은 바탕으로 가린 동안 처음 상태로 되돌린다(순간 이동·갑자기 생기는 입자가 보이지 않게).
   - 설명용 동작이다. 실제 물리 시뮬레이션이 아니며, 장비 치수·분리 원리·배출물은 나타내지 않는다(분리장치는 움직이지 않음).
   - 마우스(손가락) 끌기로 보는 방향을 바꾼다. 사용자가 돌리면 자동 카메라는 멈추고, 되풀이할 때도 그 시점을 지킨다. resetView() 로 기본 시점.
   - 화면 밖·숨은 탭·setActive(false) 이면 멈춘다. 3D 를 못 쓰면 Promise 가 실패하고, 부르는 쪽이 대표 사진을 그대로 둔다. */
import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';
import { OrbitControls } from './vendor/three/controls/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/environments/RoomEnvironment.js';

export const LOOP = 12;                       /* 한 번 도는 시간(초) */
const MOVE = [0.7, 10.7];                     /* 로봇이 움직이는 구간 */
const FADE_IN = 0.7, FADE_OUT = [11.15, 11.85];

/* ---------- 모델 크기·자리 (모델 원래 좌표를 재서 정한 값, tools: 측정) ---------- */
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
/* 로봇이 지나가는 길(바닥 위, 위에서 본 x,z) */
const PATH = [[1.35, 0.85], [0.45, 1.12], [-0.45, 0.95], [-1.2, 0.35]];

const easeInOut = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export async function createCatalystScene(host, opt = {}) {
  const small = !!opt.small;                          /* 휴대폰: 가벼운 모델·적은 입자 */
  const lite = !!opt.lite || /[?&]lite3d/.test(location.search);   /* 시험용(그래픽 카드 없는 자동 시험): 아주 낮은 해상도·그림자 없음. 동작 논리는 같다 */
  const base = opt.models || 'assets/3d/';
  const bg = new THREE.Color(opt.bg || '#eef0f2');

  /* ---------- 그리기 준비 (3D 를 못 쓰면 여기서 실패) ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'c3d__gl';
  const veil = document.createElement('div');
  veil.className = 'c3d__veil';
  veil.style.background = bg.getStyle();
  host.appendChild(canvas); host.appendChild(veil);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); veil.remove(); throw e; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const PR = lite ? 0.2 : Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);

  const scene = new THREE.Scene();
  scene.background = bg;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bfc6, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(4, 9, 6);
  sun.target.position.set(1, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 25 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  /* 바깥 땅: 그림자만 받는 투명 면 */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.13 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND; ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- 모델 세 개 ---------- */
  const loader = new GLTFLoader();
  const suf = small || lite ? '-m' : '';
  const [gTank, gRobot, gSep] = await Promise.all(['tank', 'robot', 'separator'].map((n) => loader.loadAsync(base + n + suf + '.glb')));
  /* 재질: Meshy 원본은 금속 1.0 이라 밝은 바탕에서 거울처럼 검게 보인다 → 금속 정도만 낮춘다(색·텍스처는 그대로) */
  const prep = (g, shadow, metal) => { g.scene.traverse((m) => { if (m.isMesh) { m.castShadow = shadow; m.receiveShadow = true; if (metal != null) m.material.metalness = metal; } }); return g.scene; };

  const tank = prep(gTank, true, 0.55);
  tank.scale.setScalar(TANK.s); tank.position.y = -TANK.floor * TANK.s;
  scene.add(tank);

  const robot = new THREE.Group();
  const robotModel = prep(gRobot, true);
  robotModel.scale.setScalar(ROBOT.s); robotModel.position.y = -ROBOT.bottom * ROBOT.s;
  robot.add(robotModel);
  scene.add(robot);
  const couplingLocal = new THREE.Vector3(...ROBOT.coupling).multiplyScalar(ROBOT.s).add(new THREE.Vector3(0, -ROBOT.bottom * ROBOT.s, 0));

  const sep = prep(gSep, true, 0.6);
  sep.scale.setScalar(SEP.s);
  sep.position.set(SEP.at[0], GROUND - SEP.bottom * SEP.s, SEP.at[1]);
  scene.add(sep);
  sep.updateMatrixWorld(true);
  const flange = new THREE.Vector3(...SEP.flange).applyMatrix4(sep.matrixWorld);
  const sepBox = new THREE.Box3().setFromObject(sep);

  /* ---------- 로봇이 지나가는 길 ---------- */
  const path = new THREE.CatmullRomCurve3(PATH.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const tmpV = new THREE.Vector3(), tmpT = new THREE.Vector3();
  function placeRobot(s) {
    path.getPointAt(s, tmpV); path.getTangentAt(s, tmpT);
    robot.position.copy(tmpV);
    robot.rotation.y = Math.atan2(tmpT.z, -tmpT.x);          /* 로봇 앞(모델 -x)을 가는 방향으로 */
    robot.updateMatrixWorld(true);
  }

  /* ---------- 입자층 (InstancedMesh) ---------- */
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
  const pGeo = new THREE.IcosahedronGeometry(1, small || lite ? 0 : 1);
  const pMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.0 });
  const pellets = new THREE.InstancedMesh(pGeo, pMat, N);
  pellets.receiveShadow = true;
  pellets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const P0 = new Float32Array(N * 3), PS = new Float32Array(N * 3), PQ = new Float32Array(N * 4), state = new Uint8Array(N), tcap = new Float32Array(N), cap0 = new Float32Array(N * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    P0.set(pts[i], i * 3);
    const k = pr * (0.82 + rand() * 0.36);
    PS.set([k * (0.9 + rand() * 0.25), k * (0.78 + rand() * 0.2), k * (0.9 + rand() * 0.25)], i * 3);
    q.setFromEuler(e.set(rand() * 6.3, rand() * 6.3, rand() * 6.3)); PQ.set([q.x, q.y, q.z, q.w], i * 4);
    const g = 0.62 + rand() * 0.12; pellets.setColorAt(i, col.setRGB(g, g * 1.005, g * 1.01));
  }
  scene.add(pellets);
  function setPellet(i, x, y, z, k) {
    pv.set(x, y, z); q.set(PQ[i * 4], PQ[i * 4 + 1], PQ[i * 4 + 2], PQ[i * 4 + 3]);
    sv.set(PS[i * 3] * k, PS[i * 3 + 1] * k, PS[i * 3 + 2] * k);
    pellets.setMatrixAt(i, m4.compose(pv, q, sv));
  }
  /* 흡입 헤드 앞의 상자(로봇 좌표, 세계 크기) 와 빨려 들어가는 점 */
  const hs = ROBOT.s;
  const zone = { x0: ROBOT.head[0] * hs - 0.05, x1: (ROBOT.head[0] + 0.33) * hs, z: ROBOT.head[2] * hs + 0.01 };
  const inletLocal = new THREE.Vector3((ROBOT.head[0] + 0.17) * hs, 0.07, 0);
  const foot = { x0: zone.x1, x1: ROBOT.box[3] * hs + 0.04, z: ROBOT.box[5] * hs + 0.04 };   /* 처음 자리의 로봇 몸 아래 */
  const inv = new THREE.Matrix4(), lp = new THREE.Vector3(), inletW = new THREE.Vector3();
  function resetPellets() {
    placeRobot(0);
    inv.copy(robot.matrixWorld).invert();
    for (let i = 0; i < N; i++) {
      lp.set(P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]).applyMatrix4(inv);
      const under = lp.x > zone.x0 && lp.x < foot.x1 && Math.abs(lp.z) < foot.z;
      state[i] = under ? 2 : 0;
      setPellet(i, P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2], under ? 0 : 1);
    }
    pellets.instanceMatrix.needsUpdate = true;
  }
  const CAP_T = 0.5;
  function suck(t) {
    inv.copy(robot.matrixWorld).invert();
    inletW.copy(inletLocal).applyMatrix4(robot.matrixWorld);
    let dirty = false;
    for (let i = 0; i < N; i++) {
      const st = state[i];
      if (st === 2) continue;
      if (st === 0) {
        lp.set(P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]).applyMatrix4(inv);
        if (lp.x > zone.x0 && lp.x < zone.x1 && Math.abs(lp.z) < zone.z) { state[i] = 1; tcap[i] = t; cap0.set([P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]], i * 3); }
        else continue;
      }
      const k = clamp((t - tcap[i]) / CAP_T, 0, 1), a = k * k;
      if (k >= 1) { state[i] = 2; setPellet(i, 0, -5, 0, 0); dirty = true; continue; }
      setPellet(i, cap0[i * 3] + (inletW.x - cap0[i * 3]) * a, cap0[i * 3 + 1] + (inletW.y - cap0[i * 3 + 1]) * a + Math.sin(k * Math.PI) * 0.05, cap0[i * 3 + 2] + (inletW.z - cap0[i * 3 + 2]) * a, 1 - 0.85 * a);
      dirty = true;
    }
    if (dirty) pellets.instanceMatrix.needsUpdate = true;
  }

  /* ---------- 호스 ---------- */
  const SEG = small ? 110 : 180, RAD = small ? 10 : 14;
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.05, bumpMap: ribs(), bumpScale: 1.4 });
  hoseMat.bumpMap.repeat.set(small ? 70 : 110, 1);
  const crossDir = new THREE.Vector3(Math.cos(CROSS_DEG * Math.PI / 180), 0, Math.sin(CROSS_DEG * Math.PI / 180));
  const hoseIn = crossDir.clone().multiplyScalar(R_IN - 0.25).setY(RIM + 0.22);
  const hoseOut = crossDir.clone().multiplyScalar(R_IN + 0.45).setY(RIM + 0.22);
  const flangeDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(sep.quaternion);
  const flangeLead = flange.clone().addScaledVector(flangeDir, 0.42);
  const hosePts = Array.from({ length: 9 }, () => new THREE.Vector3());
  const hoseCurve = new THREE.CatmullRomCurve3(hosePts, false, 'centripetal');
  let hoseGeo = new THREE.TubeGeometry(hoseCurve, SEG, HOSE_R, RAD, false);
  const hose = new THREE.Mesh(hoseGeo, hoseMat);
  hose.castShadow = true; hose.receiveShadow = true;
  scene.add(hose);
  const cuffMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.8 });
  const cuffs = [0, 1].map(() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(HOSE_R * 1.3, HOSE_R * 1.3, 0.1, 20), cuffMat); c.castShadow = true; scene.add(c); return c; });
  const back = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), cw = new THREE.Vector3();
  function shapeHose() {
    cw.copy(couplingLocal).applyMatrix4(robot.matrixWorld);
    back.set(1, 0, 0).applyQuaternion(robot.quaternion);                 /* 로봇 뒤쪽 */
    hosePts[0].copy(cw);
    hosePts[1].copy(cw).addScaledVector(back, 0.22).addScaledVector(up, 0.2);
    const a = hosePts[1], b = hoseIn;
    const d = a.distanceTo(b);
    hosePts[2].lerpVectors(a, b, 0.33).setY(Math.max(a.y, 0.5) + (b.y - a.y) * 0.25 - Math.min(0.18, d * 0.05));
    hosePts[3].lerpVectors(a, b, 0.7).setY(a.y + (b.y - a.y) * 0.78);
    hosePts[4].copy(hoseIn);
    hosePts[5].copy(hoseOut);
    hosePts[6].lerpVectors(hoseOut, flangeLead, 0.5).setY((hoseOut.y + flangeLead.y) * 0.5 - 0.05);
    hosePts[7].copy(flangeLead);
    hosePts[8].copy(flange);
    hoseCurve.updateArcLengths();
    const g = new THREE.TubeGeometry(hoseCurve, SEG, HOSE_R, RAD, false);
    hoseGeo.attributes.position.array.set(g.attributes.position.array);
    hoseGeo.attributes.normal.array.set(g.attributes.normal.array);
    hoseGeo.attributes.position.needsUpdate = true; hoseGeo.attributes.normal.needsUpdate = true;
    hoseGeo.computeBoundingSphere();
    g.dispose();
    putCuff(cuffs[0], 0, 0.02); putCuff(cuffs[1], 1, 0.98);
  }
  function putCuff(c, end, at) {
    hoseCurve.getPointAt(at, c.position); hoseCurve.getTangentAt(at, tmpT);
    c.quaternion.setFromUnitVectors(up, tmpT);
  }

  /* ---------- 가림막 ---------- */
  function veilAt(t) {
    if (t < FADE_IN) return 1 - easeInOut(t / FADE_IN);
    if (t > FADE_OUT[0]) return easeInOut((t - FADE_OUT[0]) / (FADE_OUT[1] - FADE_OUT[0]));
    return 0;
  }

  /* ---------- 카메라 ---------- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 0.32; controls.maxPolarAngle = 1.36;
  controls.minDistance = 6; controls.maxDistance = 30;
  canvas.style.touchAction = opt.touchAction || 'pan-y';             /* 휴대폰 세로 스크롤은 페이지로 */
  const DEF = { az: 20 * Math.PI / 180, polar: 59 * Math.PI / 180 };
  const view = { userMoved: false, tween: null, defaultDist: 14, target: new THREE.Vector3() };
  controls.addEventListener('start', () => { view.userMoved = true; view.tween = null; if (api.onUser) api.onUser(); });
  controls.addEventListener('change', () => { lastChange = performance.now(); if (running && !raf) raf = requestAnimationFrame(frame); });
  const sph = new THREE.Spherical();
  function fit() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1, asp = w / h;
    renderer.setPixelRatio(PR);
    renderer.setSize(w, h, false);
    camera.aspect = asp;
    const portrait = asp < 0.9;
    camera.fov = portrait ? 40 : 30;
    camera.updateProjectionMatrix();
    const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const halfW = portrait ? 3.3 : 4.9, halfH = 2.6;
    view.defaultDist = Math.max(halfW / Math.tan(hf / 2), halfH / Math.tan(vf / 2)) + 2.2;
    view.target.set(portrait ? 0.25 : 1.45, portrait ? 0.1 : 0.35, portrait ? 0.1 : -0.25);
    controls.maxDistance = view.defaultDist * 1.6;
    if (!view.userMoved) { controls.target.copy(view.target); placeCam(DEF.az, DEF.polar, view.defaultDist); }
  }
  function placeCam(az, polar, dist) {
    sph.set(dist, polar, az);
    camera.position.setFromSpherical(sph).add(controls.target);
    camera.lookAt(controls.target);
  }
  function autoCam(now) {
    if (view.tween) {
      const tw = view.tween, k = easeInOut(clamp((now - tw.t0) / 900, 0, 1));
      controls.target.lerpVectors(tw.from.target, view.target, k);
      placeCam(tw.from.az + (DEF.az - tw.from.az) * k, tw.from.polar + (DEF.polar - tw.from.polar) * k, tw.from.dist + (view.defaultDist - tw.from.dist) * k);
      if (k >= 1) { view.tween = null; view.userMoved = false; }
      return;
    }
    if (view.userMoved || opt.autoCamera === false) return;
    placeCam(DEF.az + Math.sin(now / 1000 * 2 * Math.PI / 24) * 0.11, DEF.polar + Math.sin(now / 1000 * 2 * Math.PI / 31) * 0.025, view.defaultDist);
  }

  /* ---------- 시간·되풀이 ---------- */
  let T = 0, cycle = -1, playing = true, running = false, active = true, onScreen = true, raf = 0, last = 0, lastChange = 0;
  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  /* 되풀이 감시(시험용): 초기화할 때 가림막이 다 덮였는지, 덮이지 않은 동안 로봇이 튀지 않았는지 */
  const watch = { resets: [], jumps: 0, maxStep: 0 }, prevPos = new THREE.Vector3(), prevVeil = { v: 1 };
  function step(t) {
    const c = Math.floor(T / LOOP);
    if (c !== cycle) { if (cycle >= 0) watch.resets.push(+prevVeil.v.toFixed(3)); cycle = c; resetPellets(); }
    const s = easeInOut((t - MOVE[0]) / (MOVE[1] - MOVE[0]));
    placeRobot(s);
    const d = prevPos.distanceTo(robot.position); prevPos.copy(robot.position);
    const v = veilAt(t);
    if (prevVeil.v < 0.98 && v < 0.98) { watch.maxStep = Math.max(watch.maxStep, d); if (d > 0.08) watch.jumps++; }
    prevVeil.v = v;
    suck(t);
    shapeHose();
    veil.style.opacity = v.toFixed(3);
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (playing) { T += dt; step(T % LOOP); }
    autoCam(now);
    controls.update();
    renderer.render(scene, camera);
    if (playing || view.tween || (!view.userMoved && opt.autoCamera !== false) || now - lastChange < 700) raf = requestAnimationFrame(frame);
  }
  function wake() {
    const should = active && onScreen && !document.hidden;
    if (should && !running) { running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    if (running && !raf) raf = requestAnimationFrame(frame);
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; wake(); }, { threshold: 0.01 }) : null;
  if (io) io.observe(host);
  const onVis = () => wake();
  document.addEventListener('visibilitychange', onVis);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { fit(); lastChange = performance.now(); wake(); }) : null;
  if (ro) ro.observe(host); else window.addEventListener('resize', fit);

  fit();
  step(0);
  veil.style.opacity = '1';
  renderer.compile(scene, camera);

  const api = {
    LOOP,
    get time() { return T; },
    get playing() { return playing; },
    get userMoved() { return view.userMoved; },
    get pixelRatio() { return renderer.getPixelRatio(); },
    lite,
    canvas, veil, controls, camera,
    onUser: null,
    play() { playing = true; wake(); },
    pause() { playing = false; },
    toggle() { playing ? api.pause() : api.play(); return playing; },
    resetView() {
      sph.setFromVector3(tmpV.copy(camera.position).sub(controls.target));
      view.tween = { t0: performance.now(), from: { az: sph.theta, polar: sph.phi, dist: sph.radius, target: controls.target.clone() } };
      /* 가장 짧은 쪽으로 돈다 */
      let dAz = DEF.az - view.tween.from.az; while (dAz > Math.PI) { view.tween.from.az += 2 * Math.PI; dAz -= 2 * Math.PI; } while (dAz < -Math.PI) { view.tween.from.az -= 2 * Math.PI; dAz += 2 * Math.PI; }
      wake(); if (!raf && running) raf = requestAnimationFrame(frame);
    },
    setActive(on) { active = !!on; wake(); },
    setInteractive(on, o = {}) {
      controls.enabled = !!on;
      controls.enableZoom = !!(on && o.zoom);
      canvas.style.touchAction = on && o.touch ? 'none' : (opt.touchAction || 'pan-y');
      wake();
    },
    /* 시험용: 장면 시간을 옮기고 그 순간을 그린다 */
    seek(t) { T = Math.floor(T / LOOP) * LOOP + clamp(t, 0, LOOP - 0.001); const c = Math.floor(T / LOOP); if (c !== cycle) { cycle = c; } resetPellets(); for (let x = 0; x <= t; x += 1 / 30) { placeRobot(easeInOut((x - MOVE[0]) / (MOVE[1] - MOVE[0]))); suck(x); } step(T % LOOP); controls.update(); renderer.render(scene, camera); },
    /* 시험용: 호스·로봇이 벽·바닥·장비를 뚫지 않는지 잰다(여유가 0보다 커야 함) */
    check() { return clearance(); },
    /* 시험용: 그리지 않고 sec 초를 1/60초씩 돌리며 되풀이·관통을 잰다(그 뒤 처음부터 다시) */
    simulate(sec) {
      const worst = clearance(); let ms = 0, n = 0;
      for (let x = 0; x < sec; x += 1 / 60) {
        T += 1 / 60; const a = performance.now(); step(T % LOOP); ms += performance.now() - a; n++;
        if (n % 6 === 0) { const c = clearance(); Object.keys(c).forEach((k) => { worst[k] = k === 'ends' ? Math.max(worst[k], c[k]) : Math.min(worst[k], c[k]); }); }
      }
      return { loops: +(T / LOOP).toFixed(2), resetsVeil: watch.resets.slice(), jumps: watch.jumps, maxStep: +watch.maxStep.toFixed(4), stepMs: +(ms / n).toFixed(3), worst };
    },
    stats() { return { resets: watch.resets.join(","), jumps: watch.jumps, maxStep: +watch.maxStep.toFixed(4), pellets: N, left: state.reduce((s, v) => s + (v === 0 ? 1 : 0), 0), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; },
    dispose() {
      running = false; if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect(); if (ro) ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      controls.dispose(); renderer.dispose(); canvas.remove(); veil.remove();
    }
  };
  if (reduce.matches && !opt.allowReduced) { api.dispose(); throw new Error('reduced-motion'); }

  function clearance() {
    const out = { hoseFloor: 9, hoseBed: 9, hoseWall: 9, hoseGround: 9, hoseRobot: 9, hoseSep: 9, robotWall: 9, ends: 0 };
    const rb = new THREE.Box3(new THREE.Vector3(ROBOT.box[0], ROBOT.box[1], ROBOT.box[2]).multiplyScalar(ROBOT.s), new THREE.Vector3(ROBOT.box[3], ROBOT.box[4], ROBOT.box[5]).multiplyScalar(ROBOT.s));
    rb.translate(new THREE.Vector3(0, -ROBOT.bottom * ROBOT.s, 0));
    const p = new THREE.Vector3(), l = new THREE.Vector3();
    for (let k = 0; k <= 400; k++) {
      const u = k / 400; hoseCurve.getPointAt(u, p);
      const r = Math.hypot(p.x, p.z), deg = ((Math.atan2(p.z, p.x) * 180 / Math.PI) + 360) % 360;
      const inCut = deg > CUT_DEG[0] && deg < CUT_DEG[1];
      if (r < R_IN) { out.hoseFloor = Math.min(out.hoseFloor, p.y - HOSE_R); if (u > 0.08) out.hoseBed = Math.min(out.hoseBed, p.y - HOSE_R - pr * 3.2); }
      else if (r < R_IN + 0.2 && !inCut) { const top = NOZ_DEG.some((n) => Math.abs(((deg - n + 540) % 360) - 180) < 7) ? NOZ : RIM; out.hoseWall = Math.min(out.hoseWall, p.y - HOSE_R - top); }
      else out.hoseGround = Math.min(out.hoseGround, p.y - HOSE_R - GROUND);
      if (u > 0.1) { l.copy(p).applyMatrix4(inv.copy(robot.matrixWorld).invert()); out.hoseRobot = Math.min(out.hoseRobot, rb.distanceToPoint(l) - HOSE_R); }
      if (u < 0.88) out.hoseSep = Math.min(out.hoseSep, sepBox.distanceToPoint(p) - HOSE_R);
    }
    /* 로봇 네 모서리가 안쪽 벽 안에 있는지 */
    for (const [x, z] of [[ROBOT.box[0], ROBOT.box[2]], [ROBOT.box[0], ROBOT.box[5]], [ROBOT.box[3], ROBOT.box[2]], [ROBOT.box[3], ROBOT.box[5]]]) {
      l.set(x * ROBOT.s, 0, z * ROBOT.s).applyMatrix4(robot.matrixWorld);
      out.robotWall = Math.min(out.robotWall, R_IN - Math.hypot(l.x, l.z));
    }
    hoseCurve.getPointAt(0, p); out.ends = Math.max(p.distanceTo(cw), 0);
    hoseCurve.getPointAt(1, l); out.ends = Math.max(out.ends, l.distanceTo(flange));
    Object.keys(out).forEach((k) => { out[k] = +out[k].toFixed(3); });
    return out;
  }

  wake();
  return api;
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
