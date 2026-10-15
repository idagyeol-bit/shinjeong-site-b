/* 신정개발 홈페이지 — 첫 화면 구호·가치 5장면 자동 전환 (시안 B, 큰 틀 'slides', 시안B 1차)
   - 7초마다 다음 장면으로 바뀐다(교차 흐림 1.1초, 사진 느린 축소·글 올라오기는 css/site.css 의 .heroB 규칙).
   - 이전·다음 버튼, 오른쪽 아래 장면 이름표, ← → 키로 장면을 고르면 그 장면부터 7초를 다시 센다.
   - 멈춤 버튼: 자동 전환과 진행 막대를 멈춘다. 다시 누르면 지금 장면부터 다시 센다.
   - 움직임 줄이기: 처음부터 멈춘 상태(1장면). 버튼으로 넘기는 것은 된다.
   - 다른 탭으로 가 있는 동안은 시간을 세지 않는다.
   - 화면에 보이는 글은 HTML 에만 있다. */
(function () {
  'use strict';
  var root = document.getElementById('heroB');
  if (!root) return;
  var slides = [].slice.call(root.querySelectorAll('.heroB__slide'));
  var tabs = [].slice.call(root.querySelectorAll('.heroB__tab'));
  var stage = root.querySelector('.heroB__stage');
  var count = root.querySelector('.heroB__count b');
  var bar = root.querySelector('.heroB__bar i');
  var pp = root.querySelector('[data-pp]');
  var n = slides.length;
  if (n < 2) return;
  var DELAY = 7000;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = null, playing = !reduce;

  function pad(k) { return (k < 10 ? '0' : '') + k; }
  function restartBar() {
    if (!bar) return;
    bar.style.animation = 'none';
    void bar.offsetWidth;   // 막대 움직임을 처음부터 다시
    bar.style.animation = '';
  }
  function go(i) {
    cur = (i + n) % n;
    slides.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle('is-on', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
    });
    tabs.forEach(function (t, k) {
      t.classList.toggle('is-on', k === cur);
      if (k === cur) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    if (count) count.textContent = pad(cur + 1);
    restartBar();
  }
  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (playing && !document.hidden) timer = setTimeout(function () { go(cur + 1); schedule(); }, DELAY);
  }
  function setPlaying(on) {
    playing = on;
    root.classList.toggle('is-playing', on);
    if (pp) pp.setAttribute('aria-label', on ? '자동 전환 멈춤' : '자동 전환 재생');
    stage.setAttribute('aria-live', on ? 'off' : 'polite');   // 멈췄을 때만 바뀐 장면을 읽어 준다
    restartBar();
    schedule();
  }
  function jump(i) { go(i); schedule(); }

  root.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { jump(cur + Number(b.getAttribute('data-go'))); });
  });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { jump(Number(t.getAttribute('data-to'))); });
  });
  if (pp) pp.addEventListener('click', function () { setPlaying(!playing); });
  root.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('a, input, textarea, select')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); jump(cur - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); jump(cur + 1); }
  });
  document.addEventListener('visibilitychange', function () { restartBar(); schedule(); });

  root.classList.add('is-ready');
  setPlaying(playing);
})();
