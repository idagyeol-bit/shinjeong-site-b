/* 신정개발 홈페이지 — '자체 개발 로봇' 배경의 3D 로봇 (시안 A 첫 화면 큰 틀 'reel')
   - 모델: assets/3d/robot-show.glb (휴대폰 robot-show-m.glb). 이다결 님이 준 Meshy 로봇 모델을 웹용으로 줄인 판이다
     (삼각형·텍스처 크기만 줄였고 형태·비율·재질은 그대로, 원본 파일은 바꾸지 않음).
   - 움직이는 것이 없다: 자동 회전·카메라 순환·로봇이나 부품의 동작이 없다. 처음에는 로봇 전체가 보이는 사선 구도로 멈춰 있다.
   - 첫 화면 배경일 때는 입력을 받지 않는다(휠·끌기는 업무명 넘김이 받는다). setExplore(true) 일 때만 끌기 회전·휠(두 손가락) 확대를 켠다.
     카메라는 로봇을 감싼 공 밖·땅 위에서만 움직인다(로봇 속으로 들어가거나 로봇을 놓치지 않게).
   - 필요할 때만 그린다(조작·감속·구도 이동·크기 바뀜). 손을 놓으면 짧게 감속한 뒤 멈추고, 그리기도 멈춘다.
   - 로봇을 놓을 자리(제목 아래 빈 곳 후보와 피할 상자)는 부르는 쪽(js/reel.js)이 opt.frame() 으로 알려 준다.
   - 3D 를 못 쓰면 Promise 가 실패하고, 부르는 쪽은 밝은 정지 그림을 그대로 둔다. */
import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';
import { OrbitControls } from './vendor/three/controls/OrbitControls.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const DEG = Math.PI / 180;

export async function create(host, opt = {}) {
  const small = !!opt.small;
  const lite = !!opt.lite || /[?&]lite3d/.test(location.search);
  const base = opt.models || 'assets/3d/';
  const bg = new THREE.Color(opt.bg || '#eef0f2');
  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  const canvas = document.createElement('canvas');
  canvas.className = 'c3d__gl';
  canvas.style.pointerEvents = 'none';                              /* 배경일 때는 휠·끌기를 가로채지 않는다 */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  /* 해상도: 기기 배율(최대 2)과 화소 수 상한 중 작은 값. 조작 중 느리면 adapt() 가 조금씩 낮춘다(모델·텍스처는 그대로) */
  const PR0 = opt.pixelRatio || (lite ? 0.25 : Math.min(window.devicePixelRatio || 1, 2));
  let prCap = PR0;

  const scene = new THREE.Scene();
  scene.background = bg;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(studio(), 0.03).texture;           /* 밝은 연회색 방 + 큰 조명판: 금속 몸체가 밝고 부드럽게 비친다(재질 값은 그대로) */
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4cad0, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(4, 2, -3); scene.add(fill);

  /* ---------- 로봇 (처음 한 번만 불러온다). 앞(흡입 헤드)이 -X, 'SUCTION ROBOT' 글자가 있는 옆면이 +Z ---------- */
  const gltf = await new GLTFLoader().loadAsync(base + 'robot-show' + (small || lite ? '-m' : '') + '.glb');
  const robot = gltf.scene;
  const box0 = new THREE.Box3().setFromObject(robot), c0 = box0.getCenter(new THREE.Vector3());
  robot.position.set(-c0.x, -box0.min.y, -c0.z);                      /* 바닥(y=0) 위, 가운데 */
  scene.add(robot);
  robot.updateMatrixWorld(true);
  robot.traverse((o) => { o.matrixAutoUpdate = false; });
  const box = new THREE.Box3().setFromObject(robot), size = box.getSize(new THREE.Vector3());
  const target = box.getCenter(new THREE.Vector3());                  /* 돌려 볼 때의 중심 = 로봇 한가운데 */
  const R = box.getBoundingSphere(new THREE.Sphere()).radius;
  /* 화면에서 로봇이 차지하는 크기를 재는 표본 점(꼭짓점 일부) */
  const sample = [];
  robot.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 1500));
    for (let i = 0; i < p.count; i += step) sample.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld));
  });
  /* 바닥의 부드러운 그림자 판(그림자 지도 대신 — 느린 그래픽에서도 가볍다) */
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.3, size.z * 1.5), new THREE.MeshBasicMaterial({ color: 0x1b2026, alphaMap: blobTex(), transparent: true, opacity: 0.4, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.004, 0); blob.renderOrder = 1; scene.add(blob);

  /* ---------- 카메라·조작 ---------- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableDamping = true; controls.dampingFactor = 0.16;    /* 가볍게 감속하되 오래 미끄러지지 않게 */
  controls.rotateSpeed = 0.75; controls.zoomSpeed = 0.9;
  controls.minDistance = R * 1.35;                                    /* 로봇을 감싼 공 밖에서만(속으로 들어가지 않게) */
  controls.minPolarAngle = 10 * DEG; controls.maxPolarAngle = 84 * DEG;   /* 위에서 내려다보기 ~ 땅 바로 위까지(땅 밑으로는 안 간다) */
  canvas.addEventListener('wheel', (e) => { if (controls.enabled) e.preventDefault(); }, { passive: false });

  const DEF = { az: -42 * DEG, polar: 64 * DEG };                     /* 앞(흡입 헤드)과 글자 있는 옆면이 함께 보이는 사선 */
  const XDEF = { az: -42 * DEG, polar: 62 * DEG };
  const home = { dist: R * 4, ox: 0, oy: 0 }, xp = { dist: R * 3, ox: 0, oy: 0 };
  const view = { ox: 0, oy: 0, tween: null, exploring: false };
  let W = 1, H = 1, raf = 0, inFrame = false, lastChange = 0, frames = 0, active = false, dirty = true;
  const sph = new THREE.Spherical(), tmp = new THREE.Vector3();

  function placeCam(az, polar, dist) {
    sph.set(dist, polar, az);
    camera.position.setFromSpherical(sph).add(controls.target);
    camera.lookAt(controls.target);
  }
  function applyOffset() {
    if (Math.abs(view.ox) < 1e-5 && Math.abs(view.oy) < 1e-5) camera.clearViewOffset();
    else camera.setViewOffset(W, H, view.ox * W, view.oy * H, W, H);
    camera.updateProjectionMatrix();
  }
  /* 지금 카메라에서 로봇이 화면에 차지하는 범위(-1~1) */
  function ndcBounds() {
    camera.updateMatrixWorld();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const p of sample) { tmp.copy(p).project(camera); if (tmp.x < x0) x0 = tmp.x; if (tmp.x > x1) x1 = tmp.x; if (tmp.y < y0) y0 = tmp.y; if (tmp.y > y1) y1 = tmp.y; }
    return { x0, x1, y0, y1 };
  }
  function bounds(az, polar, dist) {
    camera.clearViewOffset(); camera.updateProjectionMatrix();
    controls.target.copy(target); placeCam(az, polar, dist);
    return ndcBounds();
  }
  /* 로봇이 rect(화면 안 px 상자) 안에 꽉 차도록 거리와 화면 비켜 놓기를 구한다 */
  function solve(rect, az, polar, minD) {
    let d = R * 4, b;
    for (let k = 0; k < 4; k++) {
      b = bounds(az, polar, d);
      const pw = (b.x1 - b.x0) / 2 * W, ph = (b.y1 - b.y0) / 2 * H;
      d = Math.max(minD, d / Math.min(rect.w / pw, rect.h / ph));
    }
    b = bounds(az, polar, d);
    const cx = ((b.x0 + b.x1) / 2 + 1) / 2 * W, cy = (1 - (b.y0 + b.y1) / 2) / 2 * H;
    return { dist: d, ox: (cx - (rect.l + rect.w / 2)) / W, oy: (cy - (rect.t + rect.h / 2)) / H };
  }
  /* 이 구도(sol)에서 로봇이 상자들(px, 10px 여유)에 닿는가 */
  function touches(sol, rects) {
    bounds(DEF.az, DEF.polar, sol.dist);
    camera.setViewOffset(W, H, sol.ox * W, sol.oy * H, W, H); camera.updateProjectionMatrix();
    for (const p of sample) {
      tmp.copy(p).project(camera);
      const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H;
      for (const r of rects) if (x > r.l - 10 && x < r.r + 10 && y > r.t - 10 && y < r.b + 10) return true;
    }
    return false;
  }
  const homeView = () => ({ az: DEF.az, polar: DEF.polar, dist: home.dist, ox: home.ox, oy: home.oy });
  const xpView = () => ({ az: XDEF.az, polar: XDEF.polar, dist: xp.dist, ox: xp.ox, oy: xp.oy });
  function fit() {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
    const pr = Math.min(prCap, Math.sqrt((small ? 1.8e6 : 2.6e6) / (W * H)));
    renderer.setPixelRatio(opt.pixelRatio ? PR0 : Math.max(0.5, pr));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = W / H < 0.9 ? 36 : 30;
    /* 놓을 자리: 부르는 쪽이 알려 준다. 없으면 화면 아래쪽 가운데 */
    const fr = (opt.frame && opt.frame(W, H)) || {};
    const xr = fr.explore || { l: W * 0.08, t: H * 0.12, w: W * 0.84, h: H * 0.7 };
    const keep = view.exploring && !view.tween ? camera.position.clone().sub(controls.target) : null;
    /* 첫 화면: 후보 자리(cands: 가로 중심 x, 위 끝 t)마다 로봇을 위 끝에 맞춰 놓고, 로봇 모양(표본 점)이 카드·버튼·제목(avoid)에
       닿지 않는 가장 큰 크기를 찾는다(반씩 좁혀 가며). 가장 크게 보이는 자리를 고르되 가운데(prefer)를 조금 더 쳐준다 */
    let sol = null, best = 0;
    for (const c of fr.cands || []) {
      const h0 = fr.bottom - c.t, w0 = Math.min(fr.maxW, 2 * Math.min(c.x - fr.edge, W - fr.edge - c.x));
      if (h0 < 30 || w0 < 60) continue;
      const at = (s) => solve({ l: c.x - w0 * s / 2, t: c.t, w: w0 * s, h: h0 * s }, DEF.az, DEF.polar, R * 1.6);
      let pick = at(1);
      if (touches(pick, fr.avoid)) {
        let lo = 0.1, hi = 1; pick = null;
        for (let k = 0; k < 7; k++) { const m = (lo + hi) / 2, t = at(m); if (touches(t, fr.avoid)) hi = m; else { lo = m; pick = t; } }
      }
      if (pick && (1 / pick.dist) * (c.prefer || 1) > best) { best = (1 / pick.dist) * (c.prefer || 1); sol = pick; }
    }
    Object.assign(home, sol || solve({ l: W * 0.25, t: H * 0.52, w: W * 0.5, h: H * 0.4 }, DEF.az, DEF.polar, R * 1.6));
    Object.assign(xp, solve(xr, XDEF.az, XDEF.polar, R * 1.6));
    /* 확대 한계: 가장 멀리 = 탐색 시작 거리의 1.8배(로봇이 너무 작아지지 않게) */
    controls.maxDistance = xp.dist * 1.8;
    controls.target.copy(target);
    if (view.tween) view.tween.to = view.exploring ? xpView() : homeView();
    else if (!view.exploring) { view.ox = home.ox; view.oy = home.oy; placeCam(DEF.az, DEF.polar, home.dist); }
    else { view.ox = xp.ox; view.oy = xp.oy; sph.setFromVector3(keep); placeCam(sph.theta, sph.phi, clamp(sph.radius, controls.minDistance, controls.maxDistance)); }
    applyOffset();
    dirty = true;
  }
  /* 손을 놓은 뒤 남은 회전 관성을 비운다(카메라는 그대로). 위아래 끝에 걸려 남은 관성이 '기본 시점'·확대 뒤에 다시 돌리지 않게 */
  function flush() {
    const p = camera.position.clone(), qt = camera.quaternion.clone();
    controls.enableDamping = false; controls.update(); controls.enableDamping = true;
    camera.position.copy(p); camera.quaternion.copy(qt);
  }
  function tweenTo(to, dur) {
    flush();
    sph.setFromVector3(tmp.copy(camera.position).sub(controls.target));
    let fa = sph.theta, d = to.az - fa;
    while (d > Math.PI) { fa += 2 * Math.PI; d -= 2 * Math.PI; }
    while (d < -Math.PI) { fa -= 2 * Math.PI; d += 2 * Math.PI; }
    view.tween = { t0: performance.now(), dur: reduce.matches ? 1 : dur, from: { az: fa, polar: sph.phi, dist: sph.radius, ox: view.ox, oy: view.oy }, to };
    kick();
  }
  controls.addEventListener('start', () => { view.tween = null; });
  controls.addEventListener('change', () => { lastChange = performance.now(); kick(); });

  /* ---------- 필요할 때만 그리기 ---------- */
  function kick() { if (!raf && !inFrame) raf = requestAnimationFrame(frame); }
  let lastT = 0, slow = 0, seen = 0;
  function frame(now) {
    raf = 0; inFrame = true; frames++;
    let more = false;
    if (view.tween) {
      const tw = view.tween, k = smooth(clamp((now - tw.t0) / tw.dur, 0, 1)), f = tw.from, t = tw.to;
      view.ox = f.ox + (t.ox - f.ox) * k; view.oy = f.oy + (t.oy - f.oy) * k; applyOffset();
      placeCam(f.az + (t.az - f.az) * k, f.polar + (t.polar - f.polar) * k, f.dist + (t.dist - f.dist) * k);
      if (k >= 1) view.tween = null; else more = true;
    }
    if (controls.enabled && !view.tween && controls.update()) more = true;
    inFrame = false;
    renderer.render(scene, camera);
    dirty = false;
    adapt(now);
    if (more || now - lastChange < 100) kick();
    else { lastT = 0; if (controls.enabled) { inFrame = true; flush(); inFrame = false; } }
  }
  /* 느린 그래픽: 이어서 그리는 동안 한 장에 25ms 넘게 걸리는 일이 잦으면 해상도를 조금 낮춘다(최저 0.6배, 모델·텍스처는 그대로) */
  function adapt(now) {
    if (opt.pixelRatio) return;
    if (lastT) { seen++; if (now - lastT > 25) slow++; }
    lastT = now;
    if (seen >= 30) {
      if (slow > 9 && renderer.getPixelRatio() > 0.65) { prCap = Math.max(0.6, renderer.getPixelRatio() - 0.2); const tw = view.tween; fit(); view.tween = tw; }
      seen = 0; slow = 0;
    }
  }
  function draw() { if (active || view.exploring) kick(); }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { fit(); draw(); }) : null;
  const onResize = () => { fit(); draw(); };

  /* ---------- 미리 준비: 셰이더·텍스처를 올리고 첫 화면을 그려 둔다(업무를 넘길 때 멈칫하지 않게) ---------- */
  fit();
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
  /* 텍스처는 한 장씩 나눠 올린다(한 번에 올리면 화면이 잠깐 멈출 수 있다) */
  const texs = new Set();
  robot.traverse((o) => { if (o.material) ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach((k) => { if (o.material[k]) texs.add(o.material[k]); }); });
  for (const t of texs) { renderer.initTexture(t); await new Promise((r) => setTimeout(r, 0)); }
  renderer.render(scene, camera); dirty = false;
  host.appendChild(canvas);
  if (ro) ro.observe(host); else window.addEventListener('resize', onResize);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; if (opt.onLost) opt.onLost(); });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hits = [];
  return {
    animated: false,
    canvas, camera, controls,
    get exploring() { return view.exploring; },
    get pixelRatio() { return renderer.getPixelRatio(); },
    get running() { return !!raf; },
    /* 화면 좌표(x, y)가 로봇 위인가 — 바깥 상자로 먼저 거르고, 실제 표면에 닿는지 확인한다 */
    hitTest(x, y) {
      const r = canvas.getBoundingClientRect();
      if (!r.width || x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectsBox(box)) return false;
      hits.length = 0;
      ray.intersectObject(robot, true, hits);
      return hits.length > 0;
    },
    /* 지금 업무일 때만 그린다(바뀐 것이 있을 때 한 장) */
    setActive(on) { active = !!on; if (active && dirty) kick(); },
    relayout() { fit(); draw(); },
    play() {}, pause() {}, toggle() { return false; },
    /* 로봇 자세히 보기: 로봇을 크게·가운데로 옮기고 끌기 회전·휠 확대를 켠다. 끄면 처음 구도로 돌아간다 */
    setExplore(on) {
      on = !!on;
      if (on === view.exploring) return;
      view.exploring = on;
      controls.enabled = on;
      canvas.style.pointerEvents = on ? 'auto' : 'none';
      canvas.style.touchAction = on ? 'none' : '';
      canvas.style.cursor = on ? 'grab' : '';
      tweenTo(on ? xpView() : homeView(), 650);
    },
    resetView() { tweenTo(view.exploring ? xpView() : homeView(), 550); },
    capture(type, q) { renderer.render(scene, camera); return canvas.toDataURL(type || 'image/jpeg', q || 0.88); },
    /* 시험용 */
    camCheck() {
      const p = camera.position, d = p.distanceTo(controls.target);
      return { dist: +d.toFixed(3), y: +p.y.toFixed(3), insideBox: box.containsPoint(p), minDist: +controls.minDistance.toFixed(3), maxDist: +controls.maxDistance.toFixed(3), az: Math.round(Math.atan2(p.x - controls.target.x, p.z - controls.target.z) / DEG), polar: Math.round(Math.acos(clamp((p.y - controls.target.y) / d, -1, 1)) / DEG), home: { ...home }, explore: { ...xp } };
    },
    /* 시험용: 지금 화면에서 로봇이 차지하는 px 상자 */
    onScreen() { const b = ndcBounds(); return { l: Math.round((b.x0 + 1) / 2 * W), r: Math.round((b.x1 + 1) / 2 * W), t: Math.round((1 - b.y1) / 2 * H), b: Math.round((1 - b.y0) / 2 * H), W, H }; },
    stats() { return { frames, drawing: !!raf, exploring: view.exploring, pixelRatio: renderer.getPixelRatio(), canvas: [canvas.width, canvas.height], geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, triangles: renderer.info.render.triangles, calls: renderer.info.render.calls }; },
    dispose() { if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize); controls.dispose(); renderer.dispose(); canvas.remove(); }
  };
}

/* 반사용 밝은 스튜디오: 연회색 방 안에 위·양옆·앞뒤 큰 조명판(빛나는 판). 한 번 PMREM 으로 구워 환경 지도로만 쓴다 */
function studio() {
  const sc = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 16), new THREE.MeshBasicMaterial({ color: 0xc4c9ce, side: THREE.BackSide }));
  room.position.y = 4; sc.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xb8bdc2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.99; sc.add(floor);
  const pane = (w, h, x, y, z, ry, rx, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); sc.add(m);
  };
  pane(10, 6, 0, 8.9, 0, 0, Math.PI / 2, 3.2);     /* 위 */
  pane(6, 5, -7.9, 3.5, 0, Math.PI / 2, 0, 2.2);   /* 왼쪽 */
  pane(6, 5, 7.9, 3.5, 0, -Math.PI / 2, 0, 1.6);   /* 오른쪽 */
  pane(8, 4, 0, 3, 7.9, Math.PI, 0, 1.8);          /* 앞 */
  pane(8, 4, 0, 3, -7.9, 0, 0, 1.2);               /* 뒤 */
  return sc;
}
/* 로봇 밑 부드러운 그림자: 가운데가 진하고 가장자리로 사라지는 판(투명도 지도) */
function blobTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, '#fff'); g.addColorStop(0.6, '#999'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
