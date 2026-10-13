/* 신정개발 홈페이지 — 첫 화면 사업분야 가로 흐름 (시안 A, 큰 틀 'reel')
   - PC(가로 961px 이상, 움직임 줄이기 꺼짐): 구역이 화면 높이만큼 고정된 동안 내린 만큼 업무명이 화면 가로 전체를 오른쪽→왼쪽으로 지나간다.
     올리면 반대로 돌아온다. 시간에 따라 저절로 움직이는 것은 없다(스크롤 위치만 따른다).
     업무 k 의 가운데가 밝은 영역 가운데(화면 가로 50%)에 올 때 배경 사진(영상)·설명·번호가 k 로 바뀐다. 마지막 업무를 지나면 다음 구역으로 내려간다.
   - 키보드: 업무명(링크)에 초점이 가면 그 업무 자리로 스크롤, 구역 안에서 ← → 로 이전·다음.
   - 그 밖(휴대폰·움직임 줄이기·좁은 화면): 화면을 채우는 배경 장을 손가락으로 넘기는 목록. 이전·다음 버튼과 01 / 05 번호를 맞춘다.
   - 화면에 보이는 글은 HTML 에만 있다(영어판은 build-en 이 HTML 을 옮긴다). */
(function () {
  'use strict';
  var root = document.getElementById('reel');
  if (!root) return;
  var pad = function (k) { return (k < 10 ? '0' : '') + k; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- PC: 고정·가로 흐름 ---------- */
  var pin = root.querySelector('.reel__pin');
  var tracks = [].slice.call(root.querySelectorAll('.reel__pin .reel__track'));
  var words = tracks.length ? [].slice.call(tracks[0].querySelectorAll('.reel__word')) : [];
  var figs = [].slice.call(root.querySelectorAll('.reel__fig'));
  var items = [].slice.call(root.querySelectorAll('.reel__item'));
  var pinCount = root.querySelector('.reel__ctrl .reel__count b');
  var pinBtns = [].slice.call(root.querySelectorAll('.reel__ctrl .reel__btn'));
  var n = words.length;
  var centers = [], cur = 0, target = 0, raf = 0, active = -1;

  function pinned() { return pin && getComputedStyle(pin).display !== 'none'; }
  function measure() { centers = words.map(function (w) { return w.offsetLeft + w.offsetWidth / 2; }); }
  function span() { return Math.max(1, root.offsetHeight - window.innerHeight); }
  function topOf() { return root.getBoundingClientRect().top + window.pageYOffset; }
  function progress() { return clamp((window.pageYOffset - topOf()) / span(), 0, 1); }

  /* 배경 영상(있을 때만): 지금 업무의 영상만 무음·반복 재생. 재생이 시작돼야 대체 사진 위로 보이고, 실패하면 사진이 그대로 보인다.
     글자 이동과는 따로 움직인다(글자는 스크롤만 따른다). 움직임 줄이기에서는 재생하지 않는다 */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function playOnly(box, on) {
    var v = box && box.querySelector('video.reel-video');
    if (!v) return;
    if (!on || reduceMotion) { if (!v.paused) v.pause(); return; }
    if (!v.getAttribute('src')) {
      v.addEventListener('playing', function () { v.classList.add('is-playing'); });
      v.addEventListener('error', function () { v.classList.remove('is-playing'); });
      v.setAttribute('src', v.getAttribute('data-src'));
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.classList.remove('is-playing'); });
  }
  function setActive(a) {
    if (a === active) return;
    active = a;
    figs.forEach(function (f, i) { f.classList.toggle('is-on', i === a); playOnly(f, i === a); });
    items.forEach(function (it, i) { it.classList.toggle('is-on', i === a); });
    if (pinCount) pinCount.textContent = pad(a + 1);
    pinBtns.forEach(function (b) { b.disabled = (+b.getAttribute('data-go') < 0 && a === 0) || (+b.getAttribute('data-go') > 0 && a === n - 1); });
  }
  function render(p) {
    if (!n || !centers.length) return;
    if (pin.scrollLeft) pin.scrollLeft = 0;   /* 키보드 초점이 고정 화면을 옆으로 밀었으면 되돌린다 */
    var f = p * (n - 1);
    var i0 = n > 1 ? Math.min(n - 2, Math.floor(f)) : 0;
    var t = n > 1 ? f - i0 : 0;
    var c = n > 1 ? centers[i0] + (centers[i0 + 1] - centers[i0]) * t : centers[0];
    var x = window.innerWidth * 0.5 - c;   /* 밝은 영역(가로 12~88%)의 가운데 */
    tracks.forEach(function (tr) { tr.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)'; });
    var a = Math.round(f);
    setActive(a);
    if (figs[a]) figs[a].style.setProperty('--py', (-(f - a) * 18).toFixed(1) + 'px');   /* 사진은 아주 조금만 따라 움직인다 */
  }
  function tick() {
    cur += (target - cur) * 0.22;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    render(cur);
    raf = cur !== target ? requestAnimationFrame(tick) : 0;
  }
  function darkHeader() {
    var r = root.getBoundingClientRect();
    var hdr = document.querySelector('.hdr');
    var h = hdr ? hdr.offsetHeight : 0;
    document.body.classList.toggle('reel-dark', pinned() && r.top <= 1 && r.bottom > h);
  }
  function onScroll() {
    darkHeader();
    if (!pinned()) return;
    target = progress();
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function go(i) {
    i = clamp(i, 0, n - 1);
    window.scrollTo({ top: topOf() + span() * (n > 1 ? i / (n - 1) : 0), behavior: 'smooth' });
  }
  function layout() {
    if (!pinned()) { document.body.classList.remove('reel-dark'); return; }
    measure();
    cur = target = progress();
    render(cur);
    darkHeader();
  }
  pinBtns.forEach(function (b) { b.addEventListener('click', function () { go(active + (+b.getAttribute('data-go'))); }); });
  words.forEach(function (w, i) {
    /* 키보드로 업무명에 오면 그 업무 자리로 (마우스 클릭은 링크 그대로) */
    w.addEventListener('focus', function () { if (pinned() && w.matches(':focus-visible') && i !== active) go(i); });
  });
  if (pin) {
    pin.addEventListener('scroll', function () { if (pin.scrollLeft) { pin.scrollLeft = 0; render(cur); } });
    pin.addEventListener('keydown', function (e) {
      if (!pinned()) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  layout();

  /* ---------- 휴대폰·움직임 줄이기: 넘겨 보는 목록 ---------- */
  var list = root.querySelector('.reel-list__track');
  var slides = list ? [].slice.call(list.querySelectorAll('.reel-list__slide')) : [];
  var lCount = root.querySelector('.reel-list__ctrl .reel__count b');
  var lBtns = [].slice.call(root.querySelectorAll('.reel-list__ctrl .reel__btn'));
  var lActive = 0;
  var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function lIndex() {
    if (slides.length < 2) return 0;
    if (list.scrollLeft > 0 && list.scrollLeft >= list.scrollWidth - list.clientWidth - 2) return slides.length - 1;   /* 끝까지 넘겼으면 마지막 */
    var step = slides[1].offsetLeft - slides[0].offsetLeft;
    return clamp(Math.round(list.scrollLeft / step), 0, slides.length - 1);
  }
  function lUpdate() {
    lActive = lIndex();
    if (getComputedStyle(root.querySelector('.reel-list')).display !== 'none') slides.forEach(function (s, i) { playOnly(s, i === lActive); });
    if (lCount) lCount.textContent = pad(lActive + 1);
    lBtns.forEach(function (b) { b.disabled = (+b.getAttribute('data-go') < 0 && lActive === 0) || (+b.getAttribute('data-go') > 0 && lActive === slides.length - 1); });
  }
  function lGo(i) {
    i = clamp(i, 0, slides.length - 1);
    list.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }
  if (list && slides.length) {
    var lt = 0;
    list.addEventListener('scroll', function () { clearTimeout(lt); lt = setTimeout(lUpdate, 60); }, { passive: true });
    lBtns.forEach(function (b) { b.addEventListener('click', function () { lGo(lActive + (+b.getAttribute('data-go'))); }); });
    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); lGo(lActive + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lGo(lActive - 1); }
    });
    window.addEventListener('resize', lUpdate);
    lUpdate();
  }
})();
