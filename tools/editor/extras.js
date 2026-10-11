/* 신정개발 홈페이지 — 시안 편집기 다른 시안에서 가져오기·새 시안 (42차)
   - 가져오기: 기본판이나 다른 시안(저장된 판)의 묶음을 골라 지금 화면에 넣는다. 되돌리기 되고, 저장 전까지 파일은 그대로.
   - 새 시안: 시안 이름(주소)과 표시 이름(8자 이하)을 넣고 기본판에서 시작하거나 다른 시안을 복사한다. 처음 저장할 때 파일과 폴더가 생긴다.
   - 넣지 않는 것: 시안 지우기, 커밋·푸시, 비교 화면, 다른 페이지 본문 문구 고치기. */
(function () {
  'use strict';
  var ED = window.ED;
  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  var GROUPS = [
    { name: '색', paths: [['tokens', 'color']] },
    { name: '글꼴·모양·여백', paths: [['tokens', 'type'], ['tokens', 'shape'], ['tokens', 'space'], ['tokens', 'motion']] },
    { name: '첫 화면', paths: [['hero']] },
    { name: '메인 구역 순서', paths: [['home', 'sections']] },
    { name: '메인 문구', paths: [['home', 'copy']] },
    { name: '메뉴·공통 문구', paths: [['nav'], ['common']] },
    { name: '큰 틀', paths: [['frame']] }
  ];
  function sources(exclude) {
    var list = [{ value: 'base', text: '기본판', state: ED.base }];
    Object.keys(ED.variants).sort().forEach(function (n) {
      if (n !== exclude) list.push({ value: n, text: ED.variants[n].label + ' (/' + n + '/)', state: ED.variants[n].state });
    });
    return list;
  }

  /* ---------- 다른 시안에서 가져오기 ---------- */
  ED.openImport = function () {
    if (ED.isBase()) return;
    ED.dialog('다른 시안에서 가져오기', function (box, close) {
      var src = sources(ED.cur.name);
      var lab = el('label', null, '가져올 곳');
      var sel = el('select');
      src.forEach(function (s) { var o = el('option', null, s.text); o.value = s.value; sel.appendChild(o); });
      lab.appendChild(sel); box.appendChild(lab);
      box.appendChild(el('p', 'muted', '가져올 묶음을 고릅니다. 저장된 판에서 가져오며, 저장을 눌러야 파일이 바뀝니다(되돌리기 됨).'));
      var checks = el('div', 'checks');
      var boxes = GROUPS.map(function (g) {
        var l = el('label'); var c = el('input'); c.type = 'checkbox'; c.value = g.name;
        l.appendChild(c); l.appendChild(document.createTextNode(g.name)); checks.appendChild(l);
        return c;
      });
      box.appendChild(checks);
      var err = el('p', 'dlg__err'); box.appendChild(err);
      var acts = el('div', 'dlg__acts');
      var cancel = el('button', 'btn', '닫기'); cancel.type = 'button'; cancel.addEventListener('click', close);
      var go = el('button', 'btn btn--primary', '가져오기'); go.type = 'button';
      go.addEventListener('click', function () {
        var picked = GROUPS.filter(function (g, i) { return boxes[i].checked; });
        if (!picked.length) { err.textContent = '가져올 묶음을 하나 이상 고르세요.'; return; }
        var from = src.filter(function (s) { return s.value === sel.value; })[0];
        ED.update(function (s) {
          picked.forEach(function (g) { g.paths.forEach(function (p) { ED.set(s, p, ED.clone(ED.get(from.state, p))); }); });
        }, null);
        ED.flash(from.text + '에서 ' + picked.map(function (g) { return g.name; }).join('·') + ' 을 가져왔습니다. 저장을 눌러야 파일이 바뀝니다.', 'dirty');
        setTimeout(ED.clearFlash, 4000);
        close();
      });
      acts.appendChild(cancel); acts.appendChild(go); box.appendChild(acts);
    });
  };
  $('#btn-import').addEventListener('click', function () { ED.openImport(); });
  $('#btn-import').dataset.ready = '1';

  /* ---------- 새 시안 ---------- */
  ED.checkNewName = function (name) {
    var reserved = (ED.info && ED.info.reserved) || ['assets', 'css', 'en', 'guide', 'js', 'tools'];
    if (!name) return '시안 이름(주소)을 넣어 주세요. 예: a';
    if (name.charAt(0) === '_') return '_ 로 시작하는 이름은 보관·예시용이라 쓸 수 없습니다.';
    if (!/^[a-z0-9-]+$/.test(name)) return '시안 이름은 영어 소문자·숫자·- 만 씁니다(주소가 됩니다). 예: a, b, plan-1';
    if (reserved.indexOf(name) >= 0) return "'" + name + "'은 이미 있는 폴더 이름이라 쓸 수 없습니다: " + reserved.join(', ');
    if (ED.variants[name] || (ED.cur && ED.cur.name === name)) return "'" + name + "'은 이미 있는 시안 이름입니다.";
    return '';
  };
  ED.checkLabel = function (label) {
    if (!label.trim()) return '표시 이름을 넣어 주세요. 예: 시안 A';
    if (label.length > 8) return '표시 이름은 8자 이하로 넣어 주세요(휴대폰 안내 줄이 꽉 차지 않게). 지금 ' + label.length + '자';
    if (/[<>{}'"\\]/.test(label)) return '표시 이름에는 < > { } 따옴표를 쓸 수 없습니다.';
    return '';
  };
  ED.newVariant = function () {
    ED.dialog('+ 새 시안', function (box, close) {
      var l1 = el('label', null, '시안 이름 (주소)');
      var name = el('input'); name.type = 'text'; name.placeholder = '예: a  →  주소 /a/'; name.spellcheck = false;
      l1.appendChild(name); box.appendChild(l1);
      var l2 = el('label', null, '표시 이름 (8자 이하)');
      var label = el('input'); label.type = 'text'; label.placeholder = '예: 시안 A'; label.maxLength = 20;
      l2.appendChild(label); box.appendChild(l2);
      var radios = el('div', 'radios');
      var r1 = el('label'); var i1 = el('input'); i1.type = 'radio'; i1.name = 'from'; i1.value = 'base'; i1.checked = true;
      r1.appendChild(i1); r1.appendChild(document.createTextNode('기본판에서 시작')); radios.appendChild(r1);
      var r2 = el('label'); var i2 = el('input'); i2.type = 'radio'; i2.name = 'from'; i2.value = 'copy';
      r2.appendChild(i2); r2.appendChild(document.createTextNode('다른 시안 복사: '));
      var sel = el('select');
      Object.keys(ED.variants).sort().forEach(function (n) { var o = el('option', null, ED.variants[n].label + ' (/' + n + '/)'); o.value = n; sel.appendChild(o); });
      if (!sel.options.length) { i2.disabled = true; sel.disabled = true; }
      sel.addEventListener('change', function () { i2.checked = true; });
      r2.appendChild(sel); radios.appendChild(r2);
      box.appendChild(radios);
      var err = el('p', 'dlg__err'); box.appendChild(err);
      box.appendChild(el('p', 'muted', '처음 저장할 때 tools/variants/<이름>.js, <이름>/ 폴더, css/tokens.<이름>.css 가 생깁니다.'));
      var acts = el('div', 'dlg__acts');
      var cancel = el('button', 'btn', '닫기'); cancel.type = 'button'; cancel.addEventListener('click', close);
      var go = el('button', 'btn btn--primary', '만들기'); go.type = 'button';
      go.addEventListener('click', function () {
        var n = name.value.trim(), lb = label.value.trim();
        var problem = ED.checkNewName(n) || ED.checkLabel(lb);
        if (problem) { err.textContent = problem; return; }
        if (!ED.confirmLeave()) return;
        var from = i2.checked && sel.value ? ED.variants[sel.value].state : ED.base;
        close();
        ED.openTab({ name: n, label: lb, state: ED.clone(from), isNew: true });
        ED.flash('새 시안 ' + lb + ' (/' + n + '/) — 저장을 누르면 파일과 폴더가 생깁니다.', 'dirty');
        setTimeout(ED.clearFlash, 4000);
      });
      acts.appendChild(cancel); acts.appendChild(go); box.appendChild(acts);
      setTimeout(function () { name.focus(); }, 0);
    });
  };
  ED.on('ready', function () { ED.renderTabs(); });
})();
