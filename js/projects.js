/* ============================================================
   수행 이력 — 분야 필터 · 검색 · 로봇 적용만 보기
   이력 항목은 HTML에 이미 들어 있고, 이 파일은 보이기/숨기기만 합니다.
   (자바스크립트가 꺼져 있으면 6건이 모두 보입니다.)
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('recList');
    if (!root) return;

    var rows = Array.prototype.slice.call(root.querySelectorAll('[data-cat]'));
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var search = document.getElementById('recSearch');
    var robotOnly = document.getElementById('recRobot');
    var countEl = document.getElementById('recCount');
    var emptyEl = document.getElementById('recEmpty');

    var state = { cat: '전체', q: '', robot: false };

    function apply() {
      var shown = 0;
      var q = state.q.trim().toLowerCase();

      rows.forEach(function (row) {
        var okCat = state.cat === '전체' || row.getAttribute('data-cat') === state.cat;
        var okRobot = !state.robot || row.getAttribute('data-robot') === 'stated';
        var okQ = !q || (row.getAttribute('data-search') || '').toLowerCase().indexOf(q) !== -1;
        var ok = okCat && okRobot && okQ;
        row.hidden = !ok;
        if (ok) shown++;
      });

      if (countEl) countEl.textContent = String(shown);
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.cat = btn.getAttribute('data-filter');
        btns.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply();
      });
    });

    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value;
        apply();
      });
    }

    if (robotOnly) {
      robotOnly.addEventListener('change', function () {
        state.robot = robotOnly.checked;
        apply();
      });
    }

    apply();
  });
})();
