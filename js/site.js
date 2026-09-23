/* ============================================================
   신정개발 — 공통 스크립트
   헤더 고정/투명 전환 · 모바일 메뉴 · 스크롤 등장 · 숫자 카운트 · 맨 위로
   (외부 라이브러리 없음. 자바스크립트가 꺼져 있어도 내용은 모두 보입니다.)
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 스크립트가 살아 있을 때만 등장 효과를 켠다 */
  document.documentElement.classList.add('js-on');

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- 1. 헤더: 스크롤하면 흰 배경으로 ---------- */
    var hdr = document.querySelector('.hdr');
    if (hdr) {
      var onScroll = function () {
        hdr.classList.toggle('is-scrolled', window.scrollY > 24);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- 1-2. 히어로 등장 ---------- */
    var hero = document.querySelector('.hero');
    if (hero) {
      // 다음 프레임에 클래스를 붙여 전환이 확실히 일어나게 한다.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { hero.classList.add('is-in'); });
      });
      // 어떤 이유로든 위가 실패하더라도 1.2초 뒤에는 반드시 보이게 한다.
      setTimeout(function () { hero.classList.add('is-in'); }, 1200);
    }

    /* ---------- 2. 모바일 전체 메뉴 ---------- */
    var burger = document.querySelector('.burger');
    var drawer = document.getElementById('drawer');
    if (burger && drawer) {
      var setMenu = function (open) {
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', String(!open));
        document.documentElement.classList.toggle('is-locked', open);
      };
      setMenu(false);
      burger.addEventListener('click', function () {
        setMenu(burger.getAttribute('aria-expanded') !== 'true');
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
          setMenu(false);
          burger.focus();
        }
      });
      // 데스크톱 폭으로 넓어지면 메뉴를 닫는다
      var mq = window.matchMedia('(min-width: 961px)');
      var mqHandler = function (e) { if (e.matches) setMenu(false); };
      if (mq.addEventListener) mq.addEventListener('change', mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    }

    /* ---------- 3. 스크롤 등장 ---------- */
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!targets.length) { /* 없음 */ }
    else if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
          if (delay) el.style.transitionDelay = (delay / 1000) + 's';
          el.classList.add('is-in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      targets.forEach(function (el) { io.observe(el); });
    }

    /* ---------- 4. 숫자 카운트 ---------- */
    var nums = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (nums.length) {
      var run = function (el) {
        var end = parseFloat(el.getAttribute('data-count'));
        if (isNaN(end)) return;
        if (reduce) { el.textContent = String(end); return; }
        var dur = 1400, t0 = null;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(end * eased));
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = String(end);
        };
        requestAnimationFrame(step);
      };
      if (!('IntersectionObserver' in window)) {
        nums.forEach(run);
      } else {
        var io2 = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            run(entry.target);
            io2.unobserve(entry.target);
          });
        }, { threshold: 0.4 });
        nums.forEach(function (el) { io2.observe(el); });
      }
    }

    /* ---------- 5. 맨 위로 ---------- */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-totop]');
      if (!btn) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var skip = document.querySelector('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });

    /* ---------- 5-2. 사업분야 하위 메뉴: Esc로 닫기 ---------- */
    /* 여는 것은 CSS(:hover·:focus-within)가 맡고, 여기서는 Esc로 닫는 것만 처리한다. */
    Array.prototype.forEach.call(document.querySelectorAll('.gnb__item[data-sub]'), function (item) {
      var top = item.querySelector('a');
      // 마우스만 올려 둔 상태에서도 닫히도록 문서 전체에서 Esc를 받는다.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var hasFocus = item.contains(document.activeElement);
        if (!hasFocus && !item.matches(':hover')) return;
        item.classList.add('is-esc');
        if (hasFocus && top) top.focus();
      });
      item.addEventListener('mouseleave', function () { item.classList.remove('is-esc'); });
      item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) item.classList.remove('is-esc'); });
    });

    /* ---------- 6. 현재 연도 ---------- */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
  });
})();
