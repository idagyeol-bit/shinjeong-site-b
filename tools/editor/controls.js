/* 신정개발 홈페이지 — 시안 편집기 조절 칸 (42차)
   - 칸마다 설정 파일(tools/site.config.js)의 항목 하나 이상을 바꾼다. 사실(숫자·업무 이름·사실 문장·사진 번호)은 잠근다.
   - 기본판과 다른 칸에는 노란 점이 붙고, 점을 누르면 그 칸만 기본판 값으로 돌아간다.
   - ED.validate() 는 저장 전에 글 칸의 안전장치(새 숫자·자리표시·태그·빈 칸)를 확인한다. */
(function () {
  'use strict';
  var ED = window.ED;
  var syncs = [];          // 상태가 바뀔 때마다 칸 모양을 맞추는 함수들
  var textRules = [];      // 저장 전 확인할 글 칸: { path, label }

  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var base = function (p) { return ED.get(ED.base, p); };
  var val = function (p) { return ED.get(ED.cur.state, p); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var key = function (p) { return p.join('.'); };

  /* ---------- 색 계산 ---------- */
  var HEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function hex(c) { return '#' + c.map(function (x) { var s = Math.max(0, Math.min(255, Math.round(x))).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
  function darken(h, f) { return hex(rgb(h).map(function (x) { return x * f; })); }
  function towardWhite(h, a) { return hex(rgb(h).map(function (x) { return x + (255 - x) * a; })); }
  function lum(h) { return rgb(h).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce(function (s, x, i) { return s + x * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  /* ---------- 단계 계산 (clamp 안 숫자에 배수) ---------- */
  function round1(n) { return Math.round(n * 10) / 10; }
  function scaleClamp(s, f) { return String(s).replace(/(\d*\.?\d+)(px|vw|vh|rem|em|%)?/g, function (m, n, u) { return String(round1(parseFloat(n) * f)) + (u || ''); }); }
  function doubleAlpha(s) { return String(s).replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})/g, function (m, c, a) { var v = Math.min(255, parseInt(a, 16) * 2).toString(16); return '#' + c + (v.length < 2 ? '0' + v : v); }); }

  /* ---------- 칸의 공통 모양 ---------- */
  /* paths: 이 칸이 바꾸는 항목들. 노란 점을 누르면 이 항목들이 기본판 값으로 돌아간다 */
  function ctl(parent, label, help, paths) {
    var box = el('div', 'ctl');
    var head = el('div', 'ctl__head');
    head.appendChild(el('span', 'ctl__label', label));
    var dot = el('button', 'ctl__dot');
    dot.type = 'button'; dot.title = '기본판과 다름 — 누르면 이 칸만 기본판 값으로 돌아갑니다';
    dot.setAttribute('aria-label', label + ' 기본판 값으로 돌리기');
    dot.addEventListener('click', function () {
      ED.update(function (s) { paths.forEach(function (p) { ED.set(s, p, ED.clone(base(p))); }); }, null);
    });
    head.appendChild(dot);
    box.appendChild(head);
    if (help) box.appendChild(el('div', 'ctl__help', help));
    parent.appendChild(box);
    syncs.push(function () { dot.hidden = paths.every(function (p) { return same(base(p), val(p)); }); });
    return box;
  }
  function lockLine(parent, label, text) {
    var box = el('div', 'ctl');
    var head = el('div', 'ctl__head'); head.appendChild(el('span', 'ctl__label', label)); box.appendChild(head);
    var l = el('div', 'ctl__lock');
    l.appendChild(el('b', null, '잠금 · ')); l.appendChild(document.createTextNode(text));
    box.appendChild(l);
    parent.appendChild(box);
  }
  function group(panel, title, paths, open) {
    var d = el('details', 'grp'); if (open) d.open = true;
    var s = el('summary'); s.appendChild(document.createTextNode(title));
    var c = el('span', 'grp__count'); s.appendChild(c);
    d.appendChild(s);
    var body = el('div', 'grp__body'); d.appendChild(body);
    panel.appendChild(d);
    syncs.push(function () {
      var n = paths.reduce(function (t, p) { return t + ED.countDiff(base(p), val(p)); }, 0);
      c.textContent = '바뀐 것 ' + n; c.dataset.n = n;
    });
    return body;
  }

  /* ---------- 글 칸 (안전장치: 새 숫자·자리표시·태그·빈 칸) ---------- */
  function textProblem(p, v) {
    var b = String(base(p) == null ? '' : base(p));
    v = String(v == null ? '' : v);
    if (!v.trim()) return '빈 칸으로는 저장할 수 없습니다.';
    var bn = b.match(/\d+/g) || [];
    var vn = v.match(/\d+/g) || [];
    if (vn.some(function (n) { return bn.indexOf(n) < 0; })) return '숫자는 회사 사실이라 편집기에서 넣을 수 없습니다. 필요하면 이다결 님이 지시서로 고칩니다.';
    var ph = b.match(/\{\w+\}/g) || [];
    var miss = ph.filter(function (t) { return v.indexOf(t) < 0; });
    if (miss.length) return miss.join(' ') + ' 는 숫자가 들어가는 자리표시라 지울 수 없습니다.';
    if (/[<>]/.test(v.replace(/<br>/g, ''))) return '글 칸에 쓸 수 있는 태그는 <br>(PC 줄바꿈) 하나뿐입니다.';
    return '';
  }
  function text(parent, label, help, p, opts) {
    opts = opts || {};
    var box = ctl(parent, label, help, [p]);
    var input = opts.multi ? el('textarea') : el('input');
    if (!opts.multi) input.type = 'text';
    input.setAttribute('aria-label', label);
    box.appendChild(input);
    var err = el('div', 'ctl__err'); err.hidden = true; box.appendChild(err);
    if (opts.br) {
      var br = el('button', 'btn btn--sm ctl__br', '↵ PC에서 줄바꿈');
      br.type = 'button';
      br.title = '글자 사이에 <br> 을 넣습니다(PC 화면에서만 줄이 나뉩니다)';
      br.addEventListener('click', function () {
        var a = input.selectionStart == null ? input.value.length : input.selectionStart;
        var z = input.selectionEnd == null ? a : input.selectionEnd;
        var v = input.value.slice(0, a) + '<br>' + input.value.slice(z);
        ED.update(function (s) { ED.set(s, p, v); }, null);
        input.focus(); input.setSelectionRange(a + 4, a + 4);
      });
      box.appendChild(br);
    }
    input.addEventListener('input', function () { ED.update(function (s) { ED.set(s, p, input.value); }, key(p)); });
    textRules.push({ path: p, label: label });
    syncs.push(function () {
      var v = val(p);
      if (input.value !== v) input.value = v == null ? '' : v;
      var problem = textProblem(p, v);
      err.textContent = problem; err.hidden = !problem;
      box.classList.toggle('ctl--bad', !!problem);
    });
    return box;
  }

  /* ---------- 색 칸 ---------- */
  function colorRow(parent, p, onPick) {
    var row = el('div', 'ctl__row');
    var pick = el('input', 'colorpick'); pick.type = 'color';
    var hx = el('input', 'hex'); hx.type = 'text'; hx.spellcheck = false; hx.setAttribute('aria-label', '색 번호');
    var setColor = function (v) { if (onPick) onPick(v); else ED.update(function (s) { ED.set(s, p, v); }, key(p)); };
    pick.addEventListener('input', function () {
      var cur = String(val(p)); var alpha = cur.length === 9 ? cur.slice(7) : '';
      setColor(pick.value + alpha);
    });
    hx.addEventListener('change', function () {
      var v = hx.value.trim(); if (v.charAt(0) !== '#') v = '#' + v;
      if (!HEX.test(v)) { hx.value = val(p); ED.flash('색 번호는 #과 여섯 자리(또는 여덟 자리) 영어·숫자입니다. 예: #12558c', 'err'); setTimeout(ED.clearFlash, 3000); return; }
      setColor(v.toLowerCase());
    });
    row.appendChild(pick); row.appendChild(hx);
    parent.appendChild(row);
    syncs.push(function () {
      var v = String(val(p));
      if (pick.value !== v.slice(0, 7)) pick.value = v.slice(0, 7);
      if (document.activeElement !== hx) hx.value = v;
    });
    return row;
  }
  function mainColor(parent, label, help, p, auto, presets, warnOn) {
    var paths = [p].concat(auto.map(function (a) { return a.path; }));
    var box = ctl(parent, label, help, paths);
    var apply = function (v) {
      ED.update(function (s) {
        ED.set(s, p, v);
        /* 함께 맞추는 색: 기본판 색으로 돌아오면 기본판 값 그대로, 아니면 계산 */
        auto.forEach(function (a) { ED.set(s, a.path, v.toLowerCase() === String(base(p)).toLowerCase() ? base(a.path) : a.make(v.slice(0, 7))); });
      }, key(p));
    };
    var sw = el('div', 'swatches');
    presets.forEach(function (c) {
      var b = el('button', 'swatch'); b.type = 'button'; b.style.background = c[0]; b.title = c[1] + ' ' + c[0];
      b.setAttribute('aria-label', c[1]);
      b.addEventListener('click', function () { apply(c[0]); });
      sw.appendChild(b);
      syncs.push(function () { b.setAttribute('aria-pressed', String(String(val(p)).toLowerCase() === c[0])); });
    });
    box.appendChild(sw);
    colorRow(box, p, apply);
    box.appendChild(el('div', 'ctl__help', '바꾸면 ' + auto.map(function (a) { return a.name; }).join('·') + '도 함께 맞춥니다(자세히에서 따로 고칠 수 있음).'));
    var warn = el('div', 'ctl__warn'); warn.hidden = true; box.appendChild(warn);
    syncs.push(function () {
      var v = String(val(p)).slice(0, 7);
      var r = HEX.test(v) ? contrast(v, warnOn) : 21;
      warn.hidden = r >= 4.5;
      warn.textContent = '흰 글자와의 대비가 ' + r.toFixed(1) + ':1 입니다(4.5:1보다 낮음). 글자가 잘 안 보일 수 있습니다. 저장은 됩니다.';
    });
  }

  /* ---------- 단계 고르기 ---------- */
  function steps(parent, label, help, paths, options) {   // options: [{ name, values: [값...] }] — paths 와 같은 순서
    var box = ctl(parent, label, help, paths);
    var seg = el('div', 'steps');
    var other = el('div', 'ctl__help', '지금 값은 단계 밖의 값입니다(설정 파일에서 직접 고친 값).'); other.hidden = true;
    options.forEach(function (o) {
      var b = el('button', null, o.name); b.type = 'button';
      b.addEventListener('click', function () { ED.update(function (s) { paths.forEach(function (p, i) { ED.set(s, p, o.values[i]); }); }, null); });
      seg.appendChild(b);
      syncs.push(function () { b.setAttribute('aria-pressed', String(paths.every(function (p, i) { return val(p) === o.values[i]; }))); });
    });
    syncs.push(function () { other.hidden = options.some(function (o) { return paths.every(function (p, i) { return val(p) === o.values[i]; }); }); });
    box.appendChild(seg); box.appendChild(other);
  }

  /* ---------- 메인 구역 순서 ---------- */
  var SECTION_NAMES = { trust: '숫자 띠', what: '사업분야', projects: '주요 수행 이력', process: '현장 진행 방식', scenes: '현장의 장면', company: '회사 소개' };
  var BG_NAMES = { white: '흰색', soft: '연회색', navy: '남색' };
  function sectionOrder(parent) {
    var p = ['home', 'sections'];
    var box = ctl(parent, '구역 순서와 바탕', '위에서부터 이 순서로 놓입니다. ⠿ 를 끌어서 옮기거나 ▲▼ 를 누릅니다. 구역마다 바탕(흰색·연회색·남색)을 고릅니다.', [p]);
    var list = el('ol', 'order'); box.appendChild(list);
    var warn = el('div', 'ctl__warn', '현장 진행 방식 구역의 버튼은 남색 바탕용이라 잘 안 보일 수 있습니다.'); warn.hidden = true; box.appendChild(warn);
    var dragFrom = -1;
    var move = function (from, to) {
      ED.update(function (s) { var a = s.home.sections; var x = a.splice(from, 1)[0]; a.splice(to, 0, x); }, null);
    };
    function draw() {
      var secs = val(p);
      list.innerHTML = '';
      secs.forEach(function (s, i) {
        var li = el('li'); li.draggable = true; li.dataset.i = i;
        li.appendChild(el('span', 'order__grip', '⠿'));
        li.appendChild(el('span', 'order__name', SECTION_NAMES[s.id] || s.id));
        var sel = el('select'); sel.setAttribute('aria-label', (SECTION_NAMES[s.id] || s.id) + ' 바탕');
        (ED.info.backgrounds || Object.keys(BG_NAMES)).forEach(function (b) { var o = el('option', null, BG_NAMES[b] || b); o.value = b; sel.appendChild(o); });
        sel.value = s.bg;
        sel.addEventListener('change', function () { ED.update(function (st) { st.home.sections[i].bg = sel.value; }, null); });
        li.appendChild(sel);
        var mv = el('span', 'order__mv');
        var up = el('button', null, '▲'); up.type = 'button'; up.title = '위로'; up.disabled = i === 0;
        var dn = el('button', null, '▼'); dn.type = 'button'; dn.title = '아래로'; dn.disabled = i === secs.length - 1;
        up.addEventListener('click', function () { move(i, i - 1); });
        dn.addEventListener('click', function () { move(i, i + 1); });
        mv.appendChild(up); mv.appendChild(dn); li.appendChild(mv);
        li.addEventListener('dragstart', function (e) { dragFrom = i; li.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        li.addEventListener('dragend', function () { li.classList.remove('is-drag'); });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('is-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('is-over'); });
        li.addEventListener('drop', function (e) { e.preventDefault(); li.classList.remove('is-over'); if (dragFrom >= 0 && dragFrom !== i) move(dragFrom, i); dragFrom = -1; });
        list.appendChild(li);
      });
      var proc = secs.filter(function (s) { return s.id === 'process'; })[0];
      warn.hidden = !proc || proc.bg === 'navy';
    }
    var last = '';
    syncs.push(function () { var now = JSON.stringify(val(p)); if (now !== last) { last = now; draw(); } });
  }

  /* ---------- 첫 화면 배경 사진 ---------- */
  function heroPhoto(parent) {
    var p = ['hero', 'photo'];
    var box = ctl(parent, '배경 사진', '이미 있는 사진 가운데 960·1600·2400 세 크기 파일이 모두 있는 것만 고를 수 있습니다. 사진 설명(alt)은 사진 목록의 것을 그대로 씁니다.', [p]);
    var grid = el('div', 'photos'); box.appendChild(grid);
    var note = el('div', 'ctl__help'); box.appendChild(note);
    var SIZES = [960, 1600, 2400];
    var photos = Object.keys(ED.info.photos).map(function (k) { return ED.info.photos[k]; })
      .filter(function (ph) { return SIZES.every(function (s) { return (ph.sizes || []).indexOf(s) >= 0; }); });
    var shown = 0;
    photos.forEach(function (ph) {
      /* 파일이 세 크기 모두 실제로 있는지 확인한 뒤에만 보인다 */
      Promise.all(SIZES.map(function (s) { return fetch('/assets/photos/' + ph.id + '-' + s + '.jpg', { method: 'HEAD', cache: 'no-store' }).then(function (r) { return r.ok; }); }))
        .then(function (oks) {
          if (!oks.every(Boolean)) return;
          var b = el('button', 'photo'); b.type = 'button'; b.title = ph.id + ' — ' + ph.alt;
          var img = el('img'); img.src = '/assets/photos/' + ph.id + '-960.jpg'; img.alt = ph.alt; img.loading = 'lazy';
          b.appendChild(img);
          b.addEventListener('click', function () {
            ED.update(function (s) { s.hero.photo = { id: ph.id, w: ph.w, h: ph.h, sizes: SIZES.slice(), alt: ph.alt }; }, null);
          });
          grid.appendChild(b);
          shown++;
          note.textContent = '고를 수 있는 사진 ' + shown + '장. 더 넣으려면 사진을 세 크기로 준비하는 지시서가 필요합니다.';
          var sync = function () { b.setAttribute('aria-pressed', String(val(p) && val(p).id === ph.id)); };
          syncs.push(sync); sync();
        });
    });
    if (!photos.length) note.textContent = '고를 수 있는 사진이 없습니다.';
  }

  /* ---------- 칸 전체 ---------- */
  ED.renderControls = function (panel, locked) {
    syncs = []; textRules = [];
    var fs = el('fieldset'); fs.disabled = !!locked;
    panel.appendChild(fs);
    var g;

    /* 색 */
    g = group(fs, '색', [['tokens', 'color']], true);
    mainColor(g, '포인트 색', '링크·현재 메뉴 표시·아이콘·버튼', ['tokens', 'color', '--brand'],
      [{ path: ['tokens', 'color', '--brand-hover'], name: '마우스를 올렸을 때 색', make: function (v) { return darken(v, 0.78); } },
       { path: ['tokens', 'color', '--brand-tint'], name: '아주 옅은 바탕', make: function (v) { return towardWhite(v, 0.9); } }],
      [['#12558c', '기본 파랑'], ['#1f7a4d', '초록'], ['#c2410c', '주황'], ['#0f766e', '청록'], ['#6d28d9', '보라'], ['#b91c1c', '빨강']], '#ffffff');
    mainColor(g, '진한 바탕색', '남색 구역 바탕과 맨 아래 문의 띠', ['tokens', 'color', '--navy'],
      [{ path: ['tokens', 'color', '--navy-deep'], name: '더 짙은 바탕', make: function (v) { return darken(v, 0.75); } }],
      [['#0e2e4a', '기본 남색'], ['#1f2937', '먹색'], ['#14532d', '짙은 초록'], ['#3b0764', '짙은 보라'], ['#7c2d12', '짙은 갈색'], ['#0f172a', '검은 남색']], '#ffffff');
    var more = el('details', 'more'); more.appendChild(el('summary', null, '자세히 — 그 밖의 색 ' + Object.keys(ED.base.tokens.color).length + '개'));
    var mb = el('div', 'grp__body'); more.appendChild(mb); g.appendChild(more);
    var COLOR_HELP = {
      '--white': '흰색 (흰 바탕, 버튼 글자)', '--ink': '제목 글자색', '--text': '본문 글자색', '--muted': '보조 설명 글자색 (작은 회색 글)',
      '--line': '구분선 색', '--line-soft': '더 옅은 구분선 색', '--soft': '연회색 구역 바탕, 바닥글', '--soft-2': '조금 더 진한 연회색 바탕',
      '--brand': '포인트 색', '--brand-hover': '포인트 색 버튼에 마우스를 올렸을 때', '--brand-tint': '포인트 색의 아주 옅은 바탕',
      '--navy': '남색 구역 바탕, 맨 아래 문의 띠', '--navy-deep': '더 짙은 남색', '--on-navy': '남색 바탕 위 글자색',
      '--on-navy-sub': '남색 바탕 위 보조 글자색', '--on-navy-line': '남색 바탕 위 구분선 (끝 두 자리는 투명도)', '--focus': '키보드로 고를 때 보이는 테두리 색'
    };
    Object.keys(ED.base.tokens.color).forEach(function (k) {
      var p = ['tokens', 'color', k];
      var b = ctl(mb, COLOR_HELP[k] || k, k, [p]);
      colorRow(b, p);
    });

    /* 글꼴·모양 */
    g = group(fs, '글꼴·모양', [['tokens', 'type'], ['tokens', 'shape']]);
    var fsP = ['--fs-display', '--fs-h1', '--fs-h2'].map(function (k) { return ['tokens', 'type', k]; });
    steps(g, '제목 크기', '첫 화면 큰 제목·페이지 제목·구역 제목의 크기 (작게 ×0.9 · 크게 ×1.12)', fsP,
      [0.9, 1, 1.12].map(function (f, i) { return { name: ['작게', '보통', '크게'][i], values: fsP.map(function (p) { return scaleClamp(base(p), f); }) }; }));
    var rP = [['tokens', 'shape', '--radius'], ['tokens', 'shape', '--radius-lg']];
    steps(g, '모서리', '버튼·작은 칸 / 카드·사진의 모서리 둥글기', rP,
      [{ name: '각지게', values: ['2px', '4px'] }, { name: '살짝 둥글게', values: [base(rP[0]), base(rP[1])] }, { name: '둥글게', values: ['10px', '18px'] }]);
    var sP = [['tokens', 'shape', '--shadow'], ['tokens', 'shape', '--shadow-lift']];
    steps(g, '그림자', '카드 그림자와 마우스를 올렸을 때 떠오르는 그림자 (진하게 = 투명도 두 배)', sP,
      [{ name: '없음', values: ['none', 'none'] }, { name: '보통', values: [base(sP[0]), base(sP[1])] }, { name: '진하게', values: [doubleAlpha(base(sP[0])), doubleAlpha(base(sP[1]))] }]);
    lockLine(g, '글꼴 종류', 'Pretendard 만 씁니다.');

    /* 여백 */
    g = group(fs, '여백', [['tokens', 'space']]);
    var yP = [['tokens', 'space', '--sec-y'], ['tokens', 'space', '--sec-y-sm']];
    steps(g, '구역 위아래 여백', '구역과 구역 사이의 위아래 여백 (좁게 ×0.8 · 넓게 ×1.2)', yP,
      [0.8, 1, 1.2].map(function (f, i) { return { name: ['좁게', '보통', '넓게'][i], values: yP.map(function (p) { return scaleClamp(base(p), f); }) }; }));

    /* 첫 화면 */
    g = group(fs, '첫 화면', [['hero']]);
    heroPhoto(g);
    lockLine(g, '큰 제목 위 머리글', ED.base.hero.eyebrow.replace('{founded}', '(설립 연도)') + ' — 사실이라 바꿀 수 없습니다.');
    lockLine(g, '업무 다섯 개 이름', ED.base.hero.services.map(function (s) { return s.label; }).join(' · ') + ' — 사실이라 바꿀 수 없습니다.');
    text(g, '아래 한 줄', '큰 제목 아래 한 줄', ['hero', 'lead']);
    text(g, '버튼 글자', '첫 화면 버튼 (사업분야 페이지로 갑니다)', ['hero', 'button', 'label']);

    /* 메인 구역 순서 */
    g = group(fs, '메인 구역 순서', [['home', 'sections']]);
    sectionOrder(g);

    /* 메인 문구 */
    g = group(fs, '메인 문구', [['home', 'copy']]);
    var c = ['home', 'copy'];
    g.appendChild(el('div', 'sub', '숫자 띠'));
    text(g, '숫자 띠 이름', '화면 읽기 프로그램이 읽는 이름', c.concat(['trust', 'label']));
    text(g, '주요 현장 제목', '숫자 아래 현장 칩 앞의 작은 제목 (칩 내용은 사실)', c.concat(['trust', 'sitesTitle']));
    g.appendChild(el('div', 'sub', '사업분야'));
    text(g, '구역 제목', null, c.concat(['what', 'title']));
    text(g, '버튼 글자', '카드 아래 버튼 (문의 페이지로 갑니다)', c.concat(['what', 'button']));
    g.appendChild(el('div', 'sub', '주요 수행 이력'));
    text(g, '구역 제목', null, c.concat(['projects', 'title']));
    lockLine(g, '설명 문장', ED.base.home.copy.projects.lead + ' — 사실 문장이라 바꿀 수 없습니다.');
    text(g, '버튼 글자', '{n} 자리에 수행 이력 전체 건수가 들어갑니다. {n} 은 지울 수 없습니다.', c.concat(['projects', 'button']));
    g.appendChild(el('div', 'sub', '현장 진행 방식'));
    text(g, '구역 제목', null, c.concat(['process', 'title']));
    text(g, '사진 설명', '사진 아래 설명 (단계 이름은 현장 진행 방식 페이지와 같은 데이터)', c.concat(['process', 'caption']), { multi: true });
    text(g, '버튼 글자', null, c.concat(['process', 'button']));
    g.appendChild(el('div', 'sub', '현장의 장면'));
    text(g, '구역 제목', null, c.concat(['scenes', 'title']));
    ED.base.home.copy.scenes.cards.forEach(function (k, i) {
      text(g, '카드 ' + (i + 1) + ' 제목', '사진에 보이는 것만 씁니다. 사진(' + k.photo + ')과 분야 이름(' + k.field + ')은 잠금', c.concat(['scenes', 'cards', i, 'title']));
    });
    g.appendChild(el('div', 'sub', '회사 소개'));
    text(g, '구역 제목', '소개 문장은 사실이라 바꿀 수 없습니다', c.concat(['company', 'title']));
    text(g, '버튼 글자', null, c.concat(['company', 'button']));
    g.appendChild(el('div', 'sub', '맨 아래 문의 띠 (메인 페이지만)'));
    text(g, '제목', '메인 페이지 문의 띠에만 쓰입니다', c.concat(['cta', 'title']), { br: true });
    text(g, '설명 문장', null, c.concat(['cta', 'text']), { multi: true });
    text(g, '버튼 글자', null, c.concat(['cta', 'button']));

    /* 메뉴·공통 문구 */
    g = group(fs, '메뉴·공통 문구', [['nav'], ['common']]);
    g.appendChild(el('div', 'sub', '맨 위 메뉴 (주소·순서는 잠금)'));
    ED.base.nav.forEach(function (n, i) { text(g, '메뉴 ' + (i + 1), n.href, ['nav', i, 'label']); });
    g.appendChild(el('div', 'sub', '문의 버튼'));
    text(g, 'PC 머리말 버튼', 'PC 머리말 오른쪽 버튼', ['common', 'headerCta']);
    text(g, '휴대폰 메뉴 항목', '휴대폰 메뉴(☰) 맨 아래 항목', ['common', 'drawerContact']);
    text(g, '휴대폰 아래 버튼', '휴대폰 화면 맨 아래 줄 오른쪽 버튼', ['common', 'mobileCta']);
    g.appendChild(el('div', 'sub', '바닥글 묶음 제목'));
    [['services', '첫째 묶음 (업무 다섯 개)'], ['tech', '둘째 묶음 (현장 진행 방식·장비·로봇·탈수 과정)'], ['company', '셋째 묶음 (수행 이력·회사 소개·소개서 PDF)'], ['contact', '넷째 묶음 (현장 문의·이메일)']]
      .forEach(function (f) { text(g, f[1], null, ['common', 'footerGroups', f[0]]); });
    g.appendChild(el('div', 'sub', '메인 밖 문의 띠 (회사 소개의 기본 문구, 모든 페이지의 버튼 글자)'));
    text(g, '제목', '다른 페이지가 정한 제목이 있으면 그것이 먼저입니다', ['common', 'cta', 'title'], { br: true });
    text(g, '설명 문장', null, ['common', 'cta', 'text'], { multi: true });
    text(g, '버튼 글자', null, ['common', 'cta', 'button']);

    /* 큰 틀 */
    g = group(fs, '큰 틀', [['frame']]);
    g.appendChild(el('div', 'ctl__help', '지금은 base(지금 모양) 하나뿐입니다. 새 큰 틀은 그림 시안으로 고른 뒤 지시서로 더합니다.'));
    [['hero', '첫 화면 틀'], ['sections', '메인 구역 틀'], ['header', '머리말 틀']].forEach(function (f) {
      var p = ['frame', f[0]];
      var b = ctl(g, f[1], null, [p]);
      var sel = el('select'); sel.setAttribute('aria-label', f[1]);
      (ED.info.frames[f[0]] || ['base']).forEach(function (n) { var o = el('option', null, n); o.value = n; sel.appendChild(o); });
      sel.addEventListener('change', function () { ED.update(function (s) { ED.set(s, p, sel.value); }, null); });
      b.appendChild(sel);
      syncs.push(function () { if (sel.value !== val(p)) sel.value = val(p); });
    });

    syncAll();
  };

  function syncAll() { if (ED.cur) syncs.forEach(function (f) { f(); }); }
  ED.on('sync', syncAll);

  /* 저장 전 확인: 문제가 있는 글 칸 목록 */
  ED.validate = function () {
    return textRules.map(function (r) { return { label: r.label, path: r.path, msg: textProblem(r.path, val(r.path)) }; })
      .filter(function (x) { return x.msg; });
  };
})();
