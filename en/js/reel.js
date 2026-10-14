/* 신정개발 홈페이지 — 첫 화면 사업분야 회전 기둥 (시안 A, 큰 틀 'reel')
   - 업무명 N개가 보이지 않는 입체 기둥(N각 기둥, 세로축)의 면에 하나씩 붙어 있다. 회전 상태 f(0 = 첫 업무, N-1 = 마지막)만 바꾸면
     면마다 회전 각도·깊이·투명도가 정해진다. 정면에서 58° 넘게 돌아간 면은 완전히 투명, 뒷면은 그리지 않는다(멈추면 한 이름만).
     f 가 커지면(아래로) 지금 업무는 왼쪽 옆면으로 돌아가 뒤로 물러나고, 다음 업무가 오른쪽 옆면에서 정면으로 온다.
   - PC(가로 961px 이상, 움직임 허용): 구역이 고정된 동안 스크롤 위치가 곧 f 다. 휠도 끌기도 스크롤 위치를 움직이므로 서로 튀지 않는다.
     움직임이 멈추면 움직인 방향의 가까운 업무 정면으로 맞춘다(짧은 입력은 제자리). 구역 처음·끝 밖으로는 맞추지 않아 갇히지 않는다.
   - 휴대폰·움직임 줄이기: 고정하지 않는다. 가로 끌기·이전·다음 버튼·← → 키로 f 를 바꾼다(세로 스와이프는 페이지 스크롤).
     움직임 줄이기에서는 회전 없이 이름만 바뀐다.
   - 시간에 따라 저절로 돌지 않는다. 화면에 보이는 글은 HTML 에만 있다(영어판은 build-en 이 HTML 을 옮긴다).
   - 배경에 3D 장면이 있는 업무(.reel__fig.has-3d)는 아래 '3D 장면'에서 js/catalyst-scene.js 를 불러와 사진 위에 얹는다. */
(function () {
  'use strict';
  var root = document.getElementById('reel');
  if (!root) return;
  var pin = root.querySelector('.reel__pin');
  var stage = root.querySelector('.reel__stage');
  if (!pin || !stage) return;
  var faces = [].slice.call(root.querySelectorAll('.reel__face'));
  var figs = [].slice.call(root.querySelectorAll('.reel__fig'));
  var items = [].slice.call(root.querySelectorAll('.reel__item'));
  var countB = root.querySelector('.reel__ctrl .reel__count b');
  var btns = [].slice.call(root.querySelectorAll('.reel__ctrl .reel__btn[data-go]'));
  var N = faces.length;
  if (!N) return;
  var STEP = 360 / N;
  var pad = function (k) { return (k < 10 ? '0' : '') + k; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var f = 0;          /* 지금 그려진 회전 상태 */
  var target = 0;     /* 가야 할 회전 상태 */
  var settled = 0;    /* 마지막으로 맞춘 업무 */
  var active = -1, raf = 0, R = 0, dragging = false;

  function shown() { return getComputedStyle(pin).display !== 'none'; }
  function linked() { return shown() && getComputedStyle(pin).position === 'sticky'; }   /* PC: 스크롤 위치 = 회전 상태 */
  function flat() { return mqReduce.matches; }

  /* ---------- 기둥 크기와 글자 맞춤 ---------- */
  function measure() {
    var SW = stage.clientWidth, widest = 0;
    faces.forEach(function (face) {
      var s = face.firstElementChild;
      s.style.fontSize = '';
      var max = SW - 2 * Math.max(16, SW * 0.04), w = s.scrollWidth;
      if (w > max) { s.style.fontSize = (parseFloat(getComputedStyle(s).fontSize) * max / w).toFixed(1) + 'px'; w = s.scrollWidth; }   /* 긴 업무명만 줄인다 */
      widest = Math.max(widest, w);
    });
    /* 면 너비 = 가장 긴 업무명보다 조금 넓게(화면 폭은 넘지 않게). 기둥이 화면만큼 넓으면 옆으로 미끄러지는 것처럼 보이고,
       업무명 폭에 맞추면 제자리에서 도는 입체감이 난다 */
    var W = Math.min(SW, widest * 1.08);
    R = W / (2 * Math.tan(Math.PI / N));   /* 면 너비가 W 인 N각 기둥의 중심~면 거리 */
    /* 원근 거리를 기둥 크기에 맞춘다(멀어지는 쪽 글자가 눈에 띄게 작아지도록) */
    stage.style.perspective = Math.max(420, R * 1.8).toFixed(0) + 'px';
  }

  /* ---------- 그리기 ---------- */
  function render() {
    var isFlat = flat();
    var front = Math.round(f);
    faces.forEach(function (face, i) {
      var phi = (i - f) * STEP;                       /* 양수 = 오른쪽 옆면, 음수 = 왼쪽 옆면 */
      var a = Math.abs(phi);
      var o = isFlat ? (i === front ? 1 : 0) : clamp((58 - a) / 40, 0, 1);
      face.style.opacity = o.toFixed(3);
      face.style.visibility = o > 0.002 ? 'visible' : 'hidden';
      face.style.transform = isFlat ? 'none' : 'translateZ(' + (-R).toFixed(1) + 'px) rotateY(' + phi.toFixed(2) + 'deg) translateZ(' + R.toFixed(1) + 'px)';
    });
    setActive(front);
  }
  function setActive(a) {
    a = clamp(a, 0, N - 1);
    if (a === active) return;
    active = a;
    faces.forEach(function (x, i) { x.classList.toggle('is-front', i === a); });
    figs.forEach(function (x, i) { x.classList.toggle('is-on', i === a); playOnly(x, i === a); });
    items.forEach(function (x, i) { x.classList.toggle('is-on', i === a); });
    if (countB) countB.textContent = pad(a + 1);
    btns.forEach(function (b) { var d = +b.getAttribute('data-go'); b.disabled = (d < 0 && a === 0) || (d > 0 && a === N - 1); });
    bright();
    if (s3) s3.update();
  }
  /* 밝은 배경 업무(.reel__fig.is-light: 밝은 사진·3D 장면)에서는 어두운 덮개를 걷고 글자를 진한 색으로 */
  function bright() {
    var on = shown() && !!figs[active] && figs[active].classList.contains('is-light');
    root.classList.toggle('is-bright', on);
    document.body.classList.toggle('reel-bright', on);
  }
  var lastT = 0;
  function tick(now) {
    /* 따라가는 정도를 시간으로 정한다(화면이 1초에 몇 번 그려지든 같은 빠르기 — 60번일 때 한 번에 20%) */
    var dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60; lastT = now;
    if (dragging || flat()) f = target;
    else f += (target - f) * (1 - Math.pow(0.8, dt * 60));
    if (Math.abs(target - f) < 0.0005) f = target;
    render();
    raf = f !== target ? requestAnimationFrame(tick) : 0;
    if (!raf) lastT = 0;
  }
  function kick() { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } }

  /* 배경 영상(있을 때만): 지금 업무의 영상만 무음·반복 재생. 재생이 시작돼야 대체 사진 위로 보이고, 실패하면 사진이 보인다.
     회전과는 따로 움직인다. 움직임 줄이기에서는 재생하지 않는다 */
  function playOnly(box, on) {
    var v = box.querySelector('video.reel-video');
    if (!v) return;
    if (!on || flat()) { if (!v.paused) v.pause(); return; }
    if (!v.getAttribute('src')) {
      v.addEventListener('playing', function () { v.classList.add('is-playing'); });
      v.addEventListener('error', function () { v.classList.remove('is-playing'); });
      v.setAttribute('src', v.getAttribute('data-src'));
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.classList.remove('is-playing'); });
  }

  /* ---------- PC: 스크롤 위치와 회전 상태 ---------- */
  function sectionTop() { return root.getBoundingClientRect().top + window.pageYOffset; }
  function span() { return Math.max(1, root.offsetHeight - window.innerHeight); }
  function scrollF() { return N > 1 ? clamp((window.pageYOffset - sectionTop()) / span(), 0, 1) * (N - 1) : 0; }
  function yOf(x) { return sectionTop() + span() * (N > 1 ? x / (N - 1) : 0); }
  /* 움직인 방향으로 0.12칸 넘게 갔으면 그 방향의 다음 업무, 아니면 제자리 */
  function nearest(x, from) {
    var t;
    if (x >= from) t = Math.floor(x) + (x - Math.floor(x) > 0.12 ? 1 : 0);
    else t = Math.ceil(x) - (Math.ceil(x) - x > 0.12 ? 1 : 0);
    return clamp(t, 0, N - 1);
  }
  var snapT = 0;
  function snap() {
    if (!linked() || dragging) return;
    var r = root.getBoundingClientRect();
    if (r.top > 1 || r.bottom < window.innerHeight - 1) return;   /* 고정 구역 밖(처음 위·끝 아래)에서는 맞추지 않는다 */
    var x = scrollF();
    if (Math.abs(x - Math.round(x)) < 0.01) { settled = Math.round(x); return; }
    settled = nearest(x, settled);
    window.scrollTo({ top: yOf(settled), behavior: 'smooth' });
  }
  function darkHeader() {
    var r = root.getBoundingClientRect();
    var hdr = document.querySelector('.hdr');
    document.body.classList.toggle('reel-dark', linked() && r.top <= 1 && r.bottom > (hdr ? hdr.offsetHeight : 0));
  }
  function onScroll() {
    darkHeader();
    if (!linked()) return;
    target = scrollF();
    kick();
    clearTimeout(snapT);
    snapT = setTimeout(snap, 160);
  }

  /* ---------- 업무로 가기 (버튼·키보드) ---------- */
  function go(i) {
    i = clamp(i, 0, N - 1);
    settled = i;
    if (linked()) window.scrollTo({ top: yOf(i), behavior: 'smooth' });
    else { target = i; kick(); }
  }
  /* 빠르게 여러 번 눌러도 누른 만큼 넘어가게: 지금 그려진 위치가 아니라 가고 있는 업무에서 센다 */
  btns.forEach(function (b) { b.addEventListener('click', function () { go((linked() ? settled : Math.round(target)) + (+b.getAttribute('data-go'))); }); });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(Math.round(f) + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(Math.round(f) - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
  });

  /* ---------- 끌기: 왼쪽으로 끌면 다음, 오른쪽으로 끌면 이전. 놓으면 거리·속도로 가까운 업무 정면에 맞춘다 ---------- */
  var startX = 0, startY = 0, startF = 0, pid = null, moved = false, samples = [];
  function perItem() { return Math.max(160, stage.clientWidth * 0.42); }   /* 이만큼 끌면 업무 하나 */
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !shown()) return;
    pid = e.pointerId; startX = e.clientX; startY = e.clientY; moved = false;
    startF = linked() ? scrollF() : target;
    samples = [{ t: performance.now(), x: e.clientX }];
    if (e.pointerType === 'mouse') e.preventDefault();          /* 끄는 동안 글자가 선택되지 않게 */
  });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerId !== pid) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;   /* 세로 움직임은 페이지 스크롤에 맡긴다 */
      dragging = true; moved = true;
      try { stage.setPointerCapture(pid); } catch (err) { /* 잡지 못해도 끌기는 된다 */ }
      stage.classList.add('is-grabbing');
    }
    var nf = clamp(startF - dx / perItem(), 0, N - 1);
    samples.push({ t: performance.now(), x: e.clientX });
    if (samples.length > 6) samples.shift();
    if (linked()) window.scrollTo({ top: yOf(nf), behavior: 'instant' });
    target = nf; kick();
  });
  function release(e) {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-grabbing');
    var a = samples[0], b = samples[samples.length - 1], dt = Math.max(1, b.t - a.t);
    var v = -((b.x - a.x) / dt) * 1000 / perItem();              /* 업무/초 (왼쪽으로 빠르게 = +) */
    var x = linked() ? scrollF() : target;
    var from = Math.round(startF);
    var t = nearest(clamp(x + v * 0.18, 0, N - 1), from);
    var most = Math.max(1, Math.round(Math.abs(x - startF)));   /* 빠르게 휙 끌어도 끈 거리보다 많이 건너뛰지 않게 */
    go(clamp(t, from - most, from + most));
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', function (e) { if (e.pointerId === pid) { var was = dragging; dragging = false; pid = null; stage.classList.remove('is-grabbing'); if (was) go(Math.round(linked() ? scrollF() : target)); } });
  stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* ---------- 3D 장면 (.reel__fig.has-3d, 지금은 '촉매·충진물 교체') ----------
     - 페이지를 다 불러온 뒤 한가할 때 한 번만 준비해 두고(모델·셰이더·첫 화면), 업무를 넘길 때마다 다시 만들지 않는다.
       준비되기 전에는 밝은 정지 그림이 보이고, 준비되면 같은 첫 화면의 장면으로 자연스럽게 바뀐다.
     - 그 업무가 되면 클릭 없이 처음부터 돌고, 다른 업무·화면 밖·숨은 탭에서는 그리지 않는다. 평소에는 배경일 뿐이라 휠·끌기는 업무명 회전이 받는다.
     - '3D 자세히 보기'를 눌렀을 때만 탐색 모드(.reel.is-explore): 제목·설명·넘김 버튼을 0.3초에 걸쳐 숨기고, 같은 장면을 가까운 구도로 옮겨
       끌기 회전·휠(두 손가락) 확대를 켠다. '닫기'·Esc·다른 업무로 넘어가기로 끝나고, 끝나면 원래 구도·글자·초점(진입 버튼)으로 돌아간다.
     - 움직임 줄이기면 장면을 만들지 않고 정지 그림만 둔다. 자동 움직임은 작은 멈춤 버튼(.reel__btn--motion)으로 멈출 수 있다 */
  var s3 = (function () {
    var fig = root.querySelector('.reel__fig.has-3d');
    var box = fig && fig.querySelector('.reel-3d');
    if (!fig || !box) return null;
    var idx = figs.indexOf(fig);
    var motion = root.querySelector('[data-motion]');
    var enterBtn = root.querySelector('[data-explore]');
    var xbar = root.querySelector('.reel__xbar');
    var xb = function (k) { return xbar && xbar.querySelector('[data-x="' + k + '"]'); };
    var scene = null, loading = false, failed = false, paused = false, exploring = false, hinted = false, hideT = 0;
    var mqPC = window.matchMedia ? window.matchMedia('(min-width: 961px)') : { matches: true };
    var dynImport = null;
    try { dynImport = new Function('u', 'return import(u)'); } catch (err) { dynImport = null; }   /* 오래된 브라우저에서 이 파일 전체가 멈추지 않게 */
    function can() { return dynImport && !flat() && !failed && !!window.WebGLRenderingContext; }
    function load() {
      if (scene || loading || !can()) return;
      loading = true;
      var src = new URL(box.getAttribute('data-scene'), document.baseURI).href;
      var models = new URL(box.getAttribute('data-models'), document.baseURI).href;
      dynImport(src).then(function (m) { return m.createCatalystScene(box, { models: models, small: !mqPC.matches, explorable: true }); })
        .then(function (s) { scene = s; loading = false; box.__scene = s; if (paused) s.pause(); fig.classList.add('is-3d-ready'); update(); })
        .catch(function (err) { loading = false; failed = true; box.__error = String((err && err.message) || err); update(); });
    }
    function syncPaused() {
      if (motion) motion.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (xb('pp')) xb('pp').setAttribute('aria-pressed', paused ? 'true' : 'false');
    }
    function togglePlay() { if (!scene) return; paused = !scene.toggle(); syncPaused(); }
    function update() {
      var on = shown() && active === idx;
      if (on || (shown() && Math.abs(active - idx) <= 1)) load();
      if (exploring && (!on || flat() || !scene)) exit(false);
      if (scene) scene.setActive(on && !flat());
      var ok = on && scene && !flat();
      if (motion) motion.hidden = !ok;
      if (enterBtn) enterBtn.hidden = !ok;
    }
    function enter() {
      if (!scene || exploring || flat()) return;
      exploring = true;
      clearTimeout(hideT);
      xbar.hidden = false;
      root.classList.add('is-explore');
      scene.setExplore(true);
      if (!hinted) { hinted = true; root.classList.add('show-hint'); setTimeout(function () { root.classList.remove('show-hint'); }, 3200); }   /* 조작 안내는 처음에만 */
      setTimeout(function () { if (exploring && xb('close')) xb('close').focus({ preventScroll: true }); }, 50);
    }
    function exit(focusBack) {
      if (!exploring) return;
      exploring = false;
      root.classList.remove('is-explore', 'show-hint');
      if (scene) scene.setExplore(false);
      hideT = setTimeout(function () { if (!exploring) xbar.hidden = true; }, 320);
      if (focusBack !== false && enterBtn) enterBtn.focus({ preventScroll: true });
    }
    if (enterBtn) {
      /* 버튼을 누른 것이 업무명 끌기로 처리되지 않게 */
      enterBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      enterBtn.addEventListener('click', function (e) { e.preventDefault(); enter(); });
    }
    if (xbar) {
      xb('pp').addEventListener('click', togglePlay);
      xb('reset').addEventListener('click', function () { if (scene) scene.resetView(); });
      xb('close').addEventListener('click', function () { exit(true); });
    }
    if (motion) motion.addEventListener('click', togglePlay);
    document.addEventListener('keydown', function (e) { if (exploring && (e.key === 'Escape' || e.key === 'Esc')) { e.preventDefault(); exit(true); } });
    /* 미리 준비: 페이지를 다 불러오고 한가할 때 (데이터 절약 설정이면 그 업무 가까이 갔을 때만) */
    function idle(fn) { if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 1200); }
    window.addEventListener('load', function () {
      var save = navigator.connection && navigator.connection.saveData;
      if (!save) idle(load);
    });
    return { update: update, exit: exit, get exploring() { return exploring; } };
  })();

  /* ---------- 시작·크기 바뀜 ---------- */
  function layout() {
    root.classList.toggle('is-flat', flat());
    if (!shown()) { document.body.classList.remove('reel-dark'); bright(); return; }
    measure();
    if (linked()) { f = target = scrollF(); settled = Math.round(f); }
    else { f = target = clamp(Math.round(target), 0, N - 1); }
    render();
    darkHeader();
    bright();
    if (s3) s3.update();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  layout();
})();
