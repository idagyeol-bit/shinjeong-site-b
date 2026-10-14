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
  var btns = [].slice.call(root.querySelectorAll('.reel__ctrl .reel__btn'));
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
    if (s3) s3.update();
  }
  function tick() {
    if (dragging || flat()) f = target;
    else f += (target - f) * 0.2;
    if (Math.abs(target - f) < 0.0005) f = target;
    render();
    raf = f !== target ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

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
  btns.forEach(function (b) { b.addEventListener('click', function () { go(Math.round(f) + (+b.getAttribute('data-go'))); }); });
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

  /* ---------- 3D 장면 (.reel__fig.has-3d, 지금은 '촉매·충진물 교체'): 그 업무에 가까워지면 불러와 대표 사진 위에 얹는다 ----------
     - 지금 업무일 때만 돌고, 다른 업무·화면 밖·숨은 탭에서는 멈춘다. 움직임 줄이기·3D 미지원·불러오기 실패면 사진 그대로.
     - 평소에는 배경일 뿐이라 끌기·휠은 업무명 회전이 받는다. '3D로 둘러보기'를 누르면 3D 조작 모드: 글자를 걷고 끌어서 돌려 본다.
       '3D 끝내기'·Esc·다른 업무로 넘어가기·구역 밖으로 스크롤하면 끝난다. 휠은 계속 페이지 스크롤이라 갇히지 않는다 */
  var s3 = (function () {
    var fig = root.querySelector('.reel__fig.has-3d');
    var bar = root.querySelector('.reel__3d');
    var box = fig && fig.querySelector('.reel-3d');
    if (!fig || !bar || !box) return null;
    var idx = figs.indexOf(fig);
    var scene = null, loading = false, failed = false, mode = false;
    var mqPC = window.matchMedia ? window.matchMedia('(min-width: 961px)') : { matches: true };
    var btn = function (k) { return bar.querySelector('[data-3d="' + k + '"]'); };
    var dynImport = null;
    try { dynImport = new Function('u', 'return import(u)'); } catch (err) { dynImport = null; }   /* 오래된 브라우저에서 이 파일 전체가 멈추지 않게 */
    function can() { return dynImport && !flat() && !failed && !!window.WebGLRenderingContext; }
    function load() {
      if (scene || loading || !can()) return;
      loading = true;
      var src = new URL(box.getAttribute('data-scene'), document.baseURI).href;
      var models = new URL(box.getAttribute('data-models'), document.baseURI).href;
      dynImport(src).then(function (m) { return m.createCatalystScene(box, { models: models, small: !mqPC.matches }); })
        .then(function (s) { scene = s; loading = false; s.setInteractive(false); fig.classList.add('is-3d-ready'); update(); })
        .catch(function () { loading = false; failed = true; update(); });
    }
    function update() {
      var near = shown() && Math.abs(active - idx) <= 1;
      var on = shown() && active === idx;
      if (near) load();
      if (scene) scene.setActive(on && !flat());
      bar.hidden = !(scene && on && !flat());
      if (mode && (!on || flat())) exit();
    }
    function enter() {
      if (!scene || mode) return;
      mode = true;
      root.classList.add('is-3d');
      scene.setInteractive(true, { touch: true });
      btn('exit').focus({ preventScroll: true });
    }
    function exit() {
      if (!mode) return;
      mode = false;
      root.classList.remove('is-3d');
      if (scene) scene.setInteractive(false);
      if (bar.contains(document.activeElement)) btn('enter').focus({ preventScroll: true });
    }
    btn('enter').addEventListener('click', enter);
    btn('exit').addEventListener('click', exit);
    btn('reset').addEventListener('click', function () { if (scene) scene.resetView(); });
    btn('pp').addEventListener('click', function () { if (!scene) return; var on = scene.toggle(); btn('pp').classList.toggle('is-paused', !on); });
    document.addEventListener('keydown', function (e) { if (mode && e.key === 'Escape') { e.preventDefault(); exit(); } });
    /* 구역을 벗어나면 끝낸다 */
    window.addEventListener('scroll', function () {
      if (!mode) return;
      var r = root.getBoundingClientRect();
      if (r.bottom < window.innerHeight * 0.5 || r.top > window.innerHeight * 0.5) exit();
    }, { passive: true });
    /* PC: 첫 화면을 보고 있으면 잠시 뒤 미리 불러 둔다(휴대폰은 그 업무 가까이 갔을 때만) */
    window.addEventListener('load', function () {
      setTimeout(function () { if (mqPC.matches && shown() && root.getBoundingClientRect().top > -window.innerHeight) load(); }, 3000);
    });
    return { update: update, exit: exit };
  })();

  /* ---------- 시작·크기 바뀜 ---------- */
  function layout() {
    root.classList.toggle('is-flat', flat());
    if (!shown()) { document.body.classList.remove('reel-dark'); return; }
    measure();
    if (linked()) { f = target = scrollF(); settled = Math.round(f); }
    else { f = target = clamp(Math.round(target), 0, N - 1); }
    render();
    darkHeader();
    if (s3) s3.update();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  layout();
})();
