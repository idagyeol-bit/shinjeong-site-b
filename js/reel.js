/* 신정개발 홈페이지 — 첫 화면 사업분야 회전 기둥 (시안 A, 큰 틀 'reel')
   - 업무명 N개가 보이지 않는 입체 기둥(N각 기둥, 세로축)의 면에 하나씩 붙어 있다. 회전 상태 f(0 = 첫 업무, N-1 = 마지막)만 바꾸면
     면마다 회전 각도·깊이·투명도가 정해진다. 정면에서 58° 넘게 돌아간 면은 완전히 투명, 뒷면은 그리지 않는다(멈추면 한 이름만).
     f 가 커지면(아래로) 지금 업무는 왼쪽 옆면으로 돌아가 뒤로 물러나고, 다음 업무가 오른쪽 옆면에서 정면으로 온다.
   - PC(가로 961px 이상, 움직임 허용): 구역이 고정된 동안 스크롤 위치가 곧 f 다. 휠도 끌기도 스크롤 위치를 움직이므로 서로 튀지 않는다.
     움직임이 멈추면 움직인 방향의 가까운 업무 정면으로 맞춘다(짧은 입력은 제자리). 구역 처음·끝 밖으로는 맞추지 않아 갇히지 않는다.
   - 휴대폰·움직임 줄이기: 고정하지 않는다. 가로 끌기·이전·다음 버튼·← → 키로 f 를 바꾼다(세로 스와이프는 페이지 스크롤).
     움직임 줄이기에서는 회전 없이 이름만 바뀐다.
   - 시간에 따라 저절로 돌지 않는다. 화면에 보이는 글은 HTML 에만 있다(영어판은 build-en 이 HTML 을 옮긴다).
   - 배경에 3D 장면이 있는 업무(.reel__fig.has-3d)는 아래 '3D 장면'에서 장면 파일(js/robot-scene.js, js/catalyst-scene.js)을 불러와 정지 그림 위에 얹는다. */
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

  /* ---------- 3D 장면 (.reel__fig.has-3d: '자체 개발 로봇'의 로봇, '촉매·충진물 교체'의 장면) ----------
     - 장면마다 한 번만 준비한다(모델·셰이더·첫 화면). 페이지를 다 불러온 뒤 한가할 때 가까운 업무부터 하나씩 준비하고(휴대폰은 바로 옆 업무만),
       업무를 넘길 때마다 다시 만들지 않는다. 준비되기 전에는 밝은 정지 그림이 보이고, 준비되면 같은 첫 화면의 장면으로 바뀐다.
     - 평소에는 배경일 뿐이라 휠·끌기는 업무명 회전이 받는다. 다른 업무·숨은 탭에서는 그리지 않는다.
     - '로봇 자세히 보기'·'3D 자세히 보기'를 누르거나 로봇을 클릭(끌기가 아닌 짧은 누름)하면 탐색 모드(.reel.is-explore): 제목·설명·넘김 버튼을
       0.3초에 걸쳐 숨기고, 같은 장면을 가까운 구도로 옮겨 끌기 회전·휠(두 손가락) 확대를 켠다. 탐색 중 휠은 확대·축소만 하고 업무명은 넘어가지 않는다.
       '닫기'·Esc·메뉴 누르기로 끝나고, 끝나면 원래 구도·글자·휠 동작·초점(진입 버튼)으로 돌아간다.
     - 움직이는 장면(촉매)은 움직임 줄이기면 만들지 않고 정지 그림만 둔다. 움직이지 않는 장면(로봇, data-still)은 움직임 줄이기에서도 쓴다 */
  var s3 = (function () {
    var xbar = root.querySelector('.reel__xbar');
    var xb = function (k) { return xbar && xbar.querySelector('[data-x="' + k + '"]'); };
    var motion = root.querySelector('[data-motion]');
    var hdr = document.querySelector('.hdr');
    var mqPC = window.matchMedia ? window.matchMedia('(min-width: 961px)') : { matches: true };
    var dynImport = null;
    try { dynImport = new Function('u', 'return import(u)'); } catch (err) { dynImport = null; }   /* 오래된 브라우저에서 이 파일 전체가 멈추지 않게 */
    var cur = null, hinted = false, hideT = 0, pageLoaded = false, busy = false;

    /* 로봇을 놓을 자리(그림 안 px): 후보는 ① 진입 버튼 바로 아래 가운데 ② 제목 글자 아래, 버튼 오른쪽(낮은 화면에서 더 크게 보일 때).
       제목 글자·진입 버튼·아래 설명 카드·넘김 버튼·위 소개 카드(avoid)에 닿지 않게 장면이 크기와 자리를 고른다. 탐색 때는 메뉴 아래~조작 버튼 위 */
    function frameFor(c) {
      return function (W, H) {
        var fr = c.fig.getBoundingClientRect();
        if (!fr.width) return null;
        var rel = function (el) { var r = el.getBoundingClientRect(); return { l: r.left - fr.left, t: r.top - fr.top, r: r.right - fr.left, b: r.bottom - fr.top }; };
        var gap = Math.max(12, H * 0.016);
        var st = rel(stage), mid = (st.t + st.b) / 2;
        var span = faces[c.idx] && faces[c.idx].firstElementChild;
        var fs = span ? parseFloat(getComputedStyle(span).fontSize) : 60, tw = span ? span.scrollWidth : W * 0.6;
        var title = { l: (W - tw) / 2, t: mid - fs * 0.52, r: (W + tw) / 2, b: mid + fs * 0.52 };   /* 큰 제목 글자 */
        var btn = { l: W / 2 - 90, t: st.b + 4, r: W / 2 + 90, b: st.b + 46 };                  /* 진입 버튼 자리(숨어 있어도 같은 곳) */
        var avoid = [title, btn];
        [items[c.idx], root.querySelector('.reel__ctrl'), root.querySelector('.reel__intro')].forEach(function (el) { if (el) avoid.push(rel(el)); });
        var side = title.b + gap * 2;
        var cands = [{ x: W / 2, t: btn.b + gap, prefer: 1.2 }];
        if (W / H >= 0.9) cands.push({ x: W * 0.6, t: side }, { x: W * 0.66, t: side });
        var xt = (hdr ? Math.max(0, hdr.getBoundingClientRect().bottom - fr.top) : 0) + gap;
        /* 탐색 모드 아래 조작 줄의 높이: 버튼·안내(84) + 로봇 모델 한계 한 줄 + 로봇 선택 버튼(있을 때) */
        var xbarH = 84 + (c.kind === 'robot' && xbar && xbar.querySelector('.reel__xnote') ? 34 : 0) + (xbar && xbar.querySelector('.reel__rsel') ? 118 : 0);
        var xb2 = H - (mqPC.matches ? H * 0.06 : 24) - xbarH;
        var X = { l: W * 0.1, t: xt + (xb2 - xt) * 0.06, w: W * 0.8, h: (xb2 - xt) * 0.88 };
        return {
          cands: cands, avoid: avoid,
          bottom: H - Math.max(22, H * 0.05),                 /* 아래 끝은 바닥 그림자가 잘리지 않게 조금 남긴다 */
          maxW: W * (W / H < 0.9 ? 0.9 : 0.52),               /* 배경으로 남게: 가로는 화면의 52%(세로 화면 90%)까지 */
          edge: Math.max(16, W * 0.03),
          explore: X
        };
      };
    }

    var ctls = figs.map(function (fig, idx) {
      var box = fig.classList.contains('has-3d') && fig.querySelector('.reel-3d');
      if (!box) return null;
      var c = { fig: fig, box: box, idx: idx, kind: box.getAttribute('data-kind') || 'scene', still: box.hasAttribute('data-still'), scene: null, loading: false, failed: false, paused: false };
      c.enterBtn = root.querySelector('[data-explore="' + c.kind + '"]');
      c.usable = function () { return c.still || !flat(); };
      c.can = function () { return dynImport && c.usable() && !c.failed && !!window.WebGLRenderingContext; };
      c.load = function (done) {
        if (c.scene || c.loading || !c.can()) { if (done) done(); return; }
        c.loading = true;
        var src = new URL(box.getAttribute('data-scene'), document.baseURI).href;
        var models = new URL(box.getAttribute('data-models'), document.baseURI).href;
        dynImport(src).then(function (m) {
          var make = m.create || m.createCatalystScene;
          return make(box, { models: models, model: box.getAttribute('data-model') || undefined, small: !mqPC.matches, explorable: true, frame: frameFor(c), onLost: function () { lost(c); }, onFrame: function () { placeTag(c); } });
        }).then(function (s) { c.scene = s; c.loading = false; box.__scene = s; if (c.paused) s.pause(); fig.classList.add('is-3d-ready'); update(); if (done) done(); })
          .catch(function (err) { c.loading = false; c.failed = true; box.__error = String((err && err.message) || err); update(); if (done) done(); });
      };
      if (c.enterBtn) {
        c.enterBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });   /* 버튼 누름이 업무명 끌기로 처리되지 않게 */
        c.enterBtn.addEventListener('click', function (e) { e.preventDefault(); enter(c); });
      }
      /* 로봇 전시(53차-3): 로봇마다 이름표 하나(지금 고른 것만 보임) */
      c.tags = c.kind === 'robot' ? [].slice.call(root.querySelectorAll('[data-rtag]')) : [];
      c.sel = 0; c.want = 0; c.pinned = false;
      c.tags.forEach(tagEvents);
      return c;
    }).filter(Boolean);
    if (!ctls.length) return null;
    var at = function (i) { for (var k = 0; k < ctls.length; k++) if (ctls[k].idx === i) return ctls[k]; return null; };

    /* ---------- 로봇 이름표: 로봇 화면 상자 옆에 붙인다 ----------
       후보 자리(위 오른쪽 → 위 → 오른쪽 → 위 왼쪽 → 왼쪽)를 차례로 보고, 화면 안(메뉴 아래)이면서 큰 제목·진입 버튼·카드·넘김 버튼·
       탐색 조작 줄과 겹치지 않는 첫 자리에 둔다. 탐색 중 로봇이 화면을 벗어나거나 둘 곳이 없으면 메뉴 아래 왼쪽에 고정한다(.is-pinned).
       3D 가 없으면(정지 그림) 오른쪽 아래 넘김 버튼 위에 둔다 */
    function placeTag(c) {
      var tag = c.tags[c.sel];
      var on = !!(tag && shown() && active === c.idx && c.usable());
      root.classList.toggle('show-rtag', on);
      if (!on) return;
      var pr = pin.getBoundingClientRect(), W = pr.width, H = pr.height;
      var rel = function (el) { var r = el.getBoundingClientRect(); return r.width ? { l: r.left - pr.left, t: r.top - pr.top, r: r.right - pr.left, b: r.bottom - pr.top } : null; };
      var tw = tag.offsetWidth, th = tag.offsetHeight, gut = W < 600 ? 14 : 22, pad = 8;
      var top = (hdr ? Math.max(0, hdr.getBoundingClientRect().bottom - pr.top) : 0) + 12, bottom = H - 12;
      var exploring = cur === c, obst = [];
      if (exploring) { if (xbar && !xbar.hidden) obst.push(rel(xbar)); }
      else {
        var span = faces[c.idx] && faces[c.idx].firstElementChild;
        [span, c.enterBtn && !c.enterBtn.hidden ? c.enterBtn : null, items[c.idx], root.querySelector('.reel__ctrl'), root.querySelector('.reel__intro')].forEach(function (el) { if (el) obst.push(rel(el)); });
      }
      obst = obst.filter(Boolean);
      var free = function (x, y) {
        if (x < gut || x + tw > W - gut || y < top || y + th > bottom) return false;
        for (var i = 0; i < obst.length; i++) { var o = obst[i]; if (x < o.r + pad && x + tw > o.l - pad && y < o.b + pad && y + th > o.t - pad) return false; }
        return true;
      };
      var pos = null, pinned = false;
      if (c.scene) {
        var b = c.scene.onScreen(), cr = c.scene.canvas.getBoundingClientRect();
        var rb = { l: cr.left - pr.left + b.l, r: cr.left - pr.left + b.r, t: cr.top - pr.top + b.t, b: cr.top - pr.top + b.b };
        var gone = rb.l < -24 || rb.r > W + 24 || rb.t < top - 24 || rb.b > H + 24;
        if (!(exploring && gone)) {
          var cands = [[rb.r - tw * 0.75, rb.t - th * 0.35], [(rb.l + rb.r) / 2 - tw / 2, rb.t - th - 8], [rb.r + 10, rb.t + 6], [rb.l + tw * 0.1, rb.t - th - 8], [rb.l - tw - 10, rb.t + 6]];
          for (var k = 0; k < cands.length && !pos; k++) {
            var x = Math.min(Math.max(cands[k][0], gut), W - gut - tw), y = cands[k][1];
            if (free(x, y)) pos = [x, y];
          }
        }
        if (!pos && exploring) { pos = [gut, top + 4]; pinned = true; }
      }
      if (!pos) { var ct = rel(root.querySelector('.reel__ctrl')) || { t: H - 80 }; pos = [W - gut - tw, Math.max(top, ct.t - th - 12)]; }
      tag.classList.toggle('is-pinned', pinned); c.pinned = pinned;
      tag.style.transform = 'translate(' + Math.round(pos[0]) + 'px,' + Math.round(pos[1]) + 'px)';
    }
    /* 이름표 = 자세히 보기 링크. 누른 채 끈 것(6px 넘게)은 링크로 치지 않는다. 누를 때 로봇 돌리기·업무명 끌기가 시작되지 않게 하고,
       탐색 중에 누르면 탐색을 정리한 뒤 이동한다. 탐색 중 이름표 위의 휠은 로봇 확대·축소로 넘긴다 */
    function tagEvents(tag) {
      var d0 = null;
      tag.addEventListener('pointerdown', function (e) { d0 = { x: e.clientX, y: e.clientY, moved: false }; e.stopPropagation(); });
      tag.addEventListener('pointermove', function (e) { if (d0 && Math.abs(e.clientX - d0.x) + Math.abs(e.clientY - d0.y) > 6) d0.moved = true; });
      tag.addEventListener('click', function (e) {
        var moved = d0 && d0.moved; d0 = null;
        if (moved) { e.preventDefault(); return; }
        if (cur) exit(false);
      });
      tag.addEventListener('dragstart', function (e) { e.preventDefault(); });
      tag.addEventListener('wheel', function (e) {
        if (!cur || !cur.scene) return;
        e.preventDefault();
        cur.scene.canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY }));
      }, { passive: false });
    }
    /* ---------- 로봇 고르기(2대 이상일 때만 버튼이 있다) ----------
       고른 모델이 준비될 때까지 지금 로봇·이름표를 그대로 두고(빈 화면 없음), 준비되면 모델과 이름표를 함께 바꾼다.
       빠르게 여러 번 눌러도 마지막으로 누른 로봇만 남는다. 다른 로봇은 버튼에 마우스를 올리거나 눌렀을 때 처음 받는다 */
    var robotCtl = null; ctls.forEach(function (c) { if (c.kind === 'robot') robotCtl = c; });
    function pressed(k, busy) {
      [].forEach.call(root.querySelectorAll('[data-robot-pick]'), function (b) {
        var i = +b.getAttribute('data-robot-pick');
        b.setAttribute('aria-pressed', i === k ? 'true' : 'false');
        if (busy && i === k) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
      });
    }
    function pick(k) {
      var c = robotCtl;
      if (!c || !c.scene || !c.tags[k]) return;
      c.want = k;
      pressed(k, k !== c.sel);
      c.scene.setModel(c.tags[k].getAttribute('data-model')).then(function (ok) {
        if (!ok || c.want !== k) return;
        c.sel = k;
        c.tags.forEach(function (t, i) { t.classList.toggle('is-on', i === k); });
        [].forEach.call(root.querySelectorAll('[data-rnote]'), function (n) { n.classList.toggle('is-on', +n.getAttribute('data-rnote') === k); });
        pressed(k, false);
        placeTag(c);
      }).catch(function () { if (c.want === k) { c.want = c.sel; pressed(c.sel, false); } });
    }
    root.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-robot-pick]'); if (b) { e.preventDefault(); pick(+b.getAttribute('data-robot-pick')); } });
    root.addEventListener('pointerover', function (e) {
      var b = e.target.closest && e.target.closest('[data-robot-pick]'), c = robotCtl;
      if (b && c && c.scene && c.tags[+b.getAttribute('data-robot-pick')]) c.scene.prefetch(c.tags[+b.getAttribute('data-robot-pick')].getAttribute('data-model'));
    });

    /* 그래픽이 끊기면(드물다) 정지 그림으로 돌아간다 */
    function lost(c) { if (cur === c) exit(false); c.failed = true; c.scene = null; c.fig.classList.remove('is-3d-ready'); update(); }
    function update() {
      ctls.forEach(function (c) {
        var on = shown() && active === c.idx;
        if (on || (pageLoaded && shown() && Math.abs(active - c.idx) <= 1)) c.load();
        if (cur === c && (!on || !c.usable() || !c.scene)) exit(false);
        if (c.scene) c.scene.setActive(on && c.usable());
        if (c.enterBtn) c.enterBtn.hidden = !(on && c.scene && c.usable());
        if (c.tags.length) placeTag(c);
      });
      var a = at(active);
      if (motion) motion.hidden = !(a && a.scene && a.scene.animated !== false && !flat());
      syncPaused();
      if (!(a && a.scene && a.scene.hitTest)) root.classList.remove('is-hit');
    }
    function syncPaused() {
      var a = cur || at(active), p = !!(a && a.paused);
      if (motion) motion.setAttribute('aria-pressed', p ? 'true' : 'false');
      if (xb('pp')) xb('pp').setAttribute('aria-pressed', p ? 'true' : 'false');
    }
    function togglePlay() { var a = cur || at(active); if (!a || !a.scene) return; a.paused = !a.scene.toggle(); syncPaused(); }
    function relayout() { ctls.forEach(function (c) { if (c.scene && c.scene.relayout) c.scene.relayout(); if (c.tags.length) placeTag(c); }); }

    /* 탐색 중: 휠·스크롤 키가 페이지(= 업무명 넘김)를 움직이지 않게 */
    function noWheel(e) { e.preventDefault(); }
    function noKeys(e) {
      var k = e.key;
      if ((k === 'ArrowUp' || k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown' || k === 'Home' || k === 'End' || (k === ' ' && !(e.target.closest && e.target.closest('button, a')))) && !(e.target.closest && e.target.closest('input, textarea, select'))) e.preventDefault();
      if (k === 'Escape' || k === 'Esc') { e.preventDefault(); exit(true); }
    }
    function enter(c) {
      if (cur || !c.scene || !c.usable()) return;
      cur = c;
      clearTimeout(hideT);
      root.classList.remove('is-hit');
      if (xb('pp')) xb('pp').hidden = c.scene.animated === false;   /* 움직이지 않는 로봇에는 일시정지가 없다 */
      root.setAttribute('data-x', c.kind);   /* 이 장면의 이름표만 보이게 */
      xbar.hidden = false;
      root.classList.add('is-explore');
      c.scene.setExplore(true);
      root.addEventListener('wheel', noWheel, { passive: false });
      document.addEventListener('keydown', noKeys);
      syncPaused();
      if (!hinted) { hinted = true; root.classList.add('show-hint'); setTimeout(function () { root.classList.remove('show-hint'); }, 3200); }   /* 조작 안내는 처음에만 */
      setTimeout(function () { if (cur === c && xb('close')) xb('close').focus({ preventScroll: true }); }, 50);
    }
    function exit(focusBack) {
      var c = cur;
      if (!c) return;
      cur = null;
      root.classList.remove('is-explore', 'show-hint');
      root.removeEventListener('wheel', noWheel, { passive: false });
      document.removeEventListener('keydown', noKeys);
      if (c.scene) c.scene.setExplore(false);
      hideT = setTimeout(function () { if (!cur) { xbar.hidden = true; root.removeAttribute('data-x'); } }, 320);
      if (focusBack !== false && c.enterBtn && !c.enterBtn.hidden) c.enterBtn.focus({ preventScroll: true });
    }
    if (xbar) {
      xb('pp').addEventListener('click', togglePlay);
      xb('reset').addEventListener('click', function () { if (cur && cur.scene) cur.scene.resetView(); });
      xb('close').addEventListener('click', function () { exit(true); });
    }
    if (motion) motion.addEventListener('click', togglePlay);
    /* 메뉴(머리말·휴대폰 전체 메뉴·하단 문의)로 다른 곳에 가거나 메뉴를 열면 탐색을 정리한다 */
    document.addEventListener('click', function (e) { if (cur && e.target.closest && e.target.closest('.hdr, .drawer, .mcta')) exit(false); }, true);
    window.addEventListener('pagehide', function () { exit(false); });

    /* 로봇 클릭으로 들어가기: 짧게 누르고(0.6초 안) 거의 움직이지 않았을 때(6px 안)만. 끌기(업무명 넘김·세로 스크롤)는 들어가지 않는다.
       글자·버튼·카드 위, 큰 제목 글자 위는 제외. 로봇 위에 마우스를 올리면 손가락 모양 */
    var down = null, hoverT = 0;
    function onRobot(e) {
      var a = at(active);
      if (cur || !a || !a.scene || !a.scene.hitTest || !a.usable() || !shown()) return null;
      if (e.target.closest && e.target.closest('a, button, input, .reel__intro, .reel__info, .reel__ctrl, .reel__xbar')) return null;
      var t = faces[active] && faces[active].firstElementChild;
      if (t) { var r = t.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return null; }
      return a.scene.hitTest(e.clientX, e.clientY) ? a : null;
    }
    pin.addEventListener('pointerdown', function (e) {
      down = cur || (e.pointerType === 'mouse' && e.button !== 0) ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), far: 0 };
    });
    pin.addEventListener('pointermove', function (e) {
      if (down && e.pointerId === down.id) down.far = Math.max(down.far, Math.abs(e.clientX - down.x), Math.abs(e.clientY - down.y));
      if (e.pointerType !== 'mouse' || e.buttons || cur) return;
      var now = performance.now();
      if (now - hoverT < 100) return;
      hoverT = now;
      root.classList.toggle('is-hit', !!onRobot(e));
    });
    pin.addEventListener('pointerup', function (e) {
      var d = down;
      down = null;
      if (!d || e.pointerId !== d.id || cur || dragging) return;
      if (Math.max(d.far, Math.abs(e.clientX - d.x), Math.abs(e.clientY - d.y)) > 6 || performance.now() - d.t > 600) return;
      var c = onRobot(e);
      if (c) enter(c);
    });
    pin.addEventListener('pointercancel', function () { down = null; });
    pin.addEventListener('pointerleave', function () { root.classList.remove('is-hit'); });

    /* 미리 준비: 페이지를 다 불러오고 한가할 때 가까운 업무부터 하나씩(휴대폰은 바로 옆 업무만, 데이터 절약 설정이면 하지 않음) */
    function idle(fn) { if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 1200); }
    function preload() {
      if (busy) return;
      var next = ctls.filter(function (c) { return !c.scene && !c.loading && c.can() && (mqPC.matches || Math.abs(active - c.idx) <= 1); })
        .sort(function (p, q) { return Math.abs(active - p.idx) - Math.abs(active - q.idx); })[0];
      if (!next) return;
      busy = true;
      next.load(function () { busy = false; idle(preload); });
    }
    window.addEventListener('load', function () {
      pageLoaded = true;
      var save = navigator.connection && navigator.connection.saveData;
      if (!save) idle(preload);
    });
    return { update: update, relayout: relayout, exit: exit, get exploring() { return !!cur; }, ctls: ctls };
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
    if (s3) { s3.update(); s3.relayout(); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  layout();
})();
