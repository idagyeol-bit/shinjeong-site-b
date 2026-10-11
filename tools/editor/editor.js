/* 신정개발 홈페이지 — 시안 편집기 바탕 (42차)
   - 미리보기·저장은 홈페이지와 같은 생성기 tools/build.js 를 이 브라우저 안에서 그대로 돌려 만든다(Node 와 같은 코드).
     생성기가 쓰는 파일 읽기·쓰기만 메모리에서 흉내 낸다. 편집기 안에 페이지 틀은 없다.
   - 시안 설정은 "기본 설정 + 다른 점"(41차 규칙: 묶음은 항목별, 목록은 통째로)으로 다룬다.
   - 조절 칸(controls.js), 저장·되돌리기·보관(save.js), 가져오기·새 시안(extras.js)은 ED 에 기능을 더한다. */
(function () {
  'use strict';
  var ED = window.ED = {};
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- 알림 (다른 파일이 기능을 더할 때 쓰는 간단한 이벤트) ---------- */
  var handlers = {};
  ED.on = function (name, fn) { (handlers[name] = handlers[name] || []).push(fn); };
  ED.emit = function (name, data) { (handlers[name] || []).forEach(function (fn) { fn(data); }); };

  /* ---------- 파일 읽기 ---------- */
  ED.getText = function (p) {
    return fetch('/' + p + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(p + ' 파일을 읽지 못했습니다 (' + r.status + ')');
      return r.text();
    });
  };
  ED.getJson = function (p) {
    return fetch('/' + p + (p.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(p + ' 을 읽지 못했습니다 (' + r.status + ')');
      return r.json();
    });
  };

  /* ---------- 설정 다루기 ---------- */
  var isGroup = ED.isGroup = function (x) { return x !== null && typeof x === 'object' && !Array.isArray(x); };
  var clone = ED.clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  ED.evalModule = function (text) { var m = { exports: {} }; new Function('module', 'exports', text)(m, m.exports); return m.exports; };

  /* 기본 설정 + 시안의 다른 점 (생성기 tools/build.js 의 mergeConfig 와 같은 규칙. 틀린 이름은 생성기가 알린다) */
  ED.merge = function merge(base, over) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = clone(base[k]); });
    Object.keys(over || {}).forEach(function (k) {
      if (isGroup(base[k]) && isGroup(over[k])) out[k] = merge(base[k], over[k]);
      else out[k] = clone(over[k]);
    });
    return out;
  };
  /* 기본 설정과 다른 것만 (묶음은 안쪽까지, 목록은 통째로). 같으면 undefined */
  ED.diff = function diff(base, cur) {
    if (isGroup(base) && isGroup(cur)) {
      var out = {}, any = false;
      Object.keys(base).forEach(function (k) {
        if (!(k in cur)) return;
        var d = diff(base[k], cur[k]);
        if (d !== undefined) { out[k] = d; any = true; }
      });
      return any ? out : undefined;
    }
    return JSON.stringify(base) === JSON.stringify(cur) ? undefined : clone(cur);
  };
  /* 서로 다른 칸의 수 (목록은 하나로 센다) */
  ED.countDiff = function countDiff(a, b) {
    if (isGroup(a) && isGroup(b)) {
      var n = 0;
      Object.keys(a).forEach(function (k) { n += countDiff(a[k], b[k]); });
      return n;
    }
    return JSON.stringify(a) === JSON.stringify(b) ? 0 : 1;
  };
  ED.get = function (o, path) { return path.reduce(function (x, k) { return x == null ? undefined : x[k]; }, o); };
  ED.set = function (o, path, v) {
    var x = o;
    for (var i = 0; i < path.length - 1; i++) x = x[path[i]];
    x[path[path.length - 1]] = v;
  };

  /* 시안 설정 파일 글 — 41차 모양(맨 위 사용법 주석 + label + 기본판과 다른 항목) */
  var USAGE = '/* 시안 설정 — 기본 설정(tools/site.config.js)과 "다른 점만" 적는다.\n' +
    '   - 파일 이름이 시안 주소가 된다: tools/variants/a.js → 사이트 주소 /a/\n' +
    '   - 적지 않은 항목은 기본 설정 그대로다. 목록([ ])은 통째로 바뀐다.\n' +
    '   - 숫자와 회사 정보(사실)는 여기서 바꿀 수 없다. 시안은 한국어만 만든다.\n' +
    '   - 바꾼 뒤에는 node tools/build.js 로 다시 만든다(기본판과 모든 시안이 함께 만들어진다). */\n';
  var IDENT = /^[A-Za-z_$][\w$]*$/;
  function q(s) { return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n') + "'"; }
  function key(k) { return IDENT.test(k) ? k : q(k); }
  function flat(v) { return !isGroup(v) && !Array.isArray(v); }
  function lit(v, ind) {
    if (typeof v === 'string') return q(v);
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
    if (Array.isArray(v)) {
      if (v.every(flat)) return '[' + v.map(function (x) { return lit(x, ind); }).join(', ') + ']';
      return '[\n' + v.map(function (x) { return ind + '  ' + item(x, ind + '  '); }).join(',\n') + '\n' + ind + ']';
    }
    var ks = Object.keys(v);
    return '{\n' + ks.map(function (k) { return ind + '  ' + key(k) + ': ' + lit(v[k], ind + '  '); }).join(',\n') + '\n' + ind + '}';
  }
  function item(x, ind) {   // 목록 안의 작은 묶음은 한 줄로: { id: 'trust', bg: 'white' }
    if (isGroup(x) && Object.keys(x).every(function (k) { return flat(x[k]) || (Array.isArray(x[k]) && x[k].every(flat)); })) {
      return '{ ' + Object.keys(x).map(function (k) { return key(k) + ': ' + lit(x[k], ind); }).join(', ') + ' }';
    }
    return lit(x, ind);
  }
  ED.serialize = function (label, over) {
    var body = { label: label };
    Object.keys(over || {}).forEach(function (k) { body[k] = over[k]; });
    return USAGE + '\nmodule.exports = ' + lit(body, '') + ';\n';
  };

  /* ---------- 생성기(tools/build.js)를 브라우저에서 돌리기 ---------- */
  var T = {};          // build.js · site.config.js · tokens.head.css 글
  var buildFn = null;
  function Exit(code) { this.code = code; }
  ED.runBuild = function (variantName, variantText) {
    var t0 = performance.now();
    var files = { '/R/tools/build.js': T.build, '/R/tools/site.config.js': T.config, '/R/tools/tokens.head.css': T.head };
    if (variantName) files['/R/tools/variants/' + variantName + '.js'] = variantText;
    var writes = {}, errors = [];
    var norm = function (p) { var o = []; p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') o.pop(); else o.push(s); }); return '/' + o.join('/'); };
    var path = { join: function () { return norm([].slice.call(arguments).join('/')); }, resolve: function () { return norm([].slice.call(arguments).join('/')); }, dirname: function (p) { return norm(p + '/..'); } };
    var fs = {
      existsSync: function (p) { return p in files || p === '/R' || Object.keys(files).some(function (k) { return k.indexOf(p + '/') === 0; }); },
      mkdirSync: function () {},
      readFileSync: function (p) { if (!(p in files)) throw new Error('파일 없음: ' + p); return files[p]; },
      writeFileSync: function (p, s) { writes[p] = s; },
      unlinkSync: function () {},
      readdirSync: function (d) { return Object.keys(files).filter(function (k) { return k.indexOf(d + '/') === 0 && k.slice(d.length + 1).indexOf('/') < 0; }).map(function (k) { return k.slice(d.length + 1); }); }
    };
    var req = function (m) {
      if (m === 'fs') return fs; if (m === 'path') return path;
      var p = m.charAt(0) === '/' ? norm(m) : path.join('/R/tools', m);
      if (!(p in files)) throw new Error("Cannot find module '" + m + "'");
      var mod = { exports: {} };
      new Function('module', 'exports', 'require', '__dirname', files[p])(mod, mod.exports, req, path.dirname(p));
      return mod.exports;
    };
    var proc = { argv: ['node', '/R/tools/build.js'].concat(variantName ? ['--variant', variantName] : []), exit: function (c) { throw new Exit(c); } };
    var con = { log: function () {}, warn: function () {}, error: function () { errors.push([].slice.call(arguments).join(' ')); } };
    var mod = { exports: {} };
    var ok = true;
    try { buildFn(req, '/R/tools', proc, con, mod); }
    catch (e) {
      ok = false;
      if (!(e instanceof Exit)) errors.push('생성기 오류: ' + (e && e.message ? e.message : e));
    }
    return { ok: ok && !errors.length, error: errors.join('\n'), writes: writes, info: mod.exports, ms: performance.now() - t0 };
  };

  /* ---------- 상태 ---------- */
  ED.variants = {};     // 디스크에 있는 시안: { 이름: { label, state, text } }
  ED.cur = null;        // 지금 탭: { name, label, state, savedState, savedText, isNew, savedAt }
  ED.page = 'index.html';
  ED.device = 'pc';
  ED.isBase = function () { return !ED.cur || ED.cur.name === 'base'; };
  ED.overOf = function (state) { return ED.diff(ED.base, state) || {}; };
  ED.textOf = function (cur) { return ED.serialize(cur.label, ED.overOf(cur.state)); };
  ED.isDirty = function () { return !ED.isBase() && (ED.cur.isNew || ED.textOf(ED.cur) !== ED.cur.savedText); };
  ED.brandOf = function (state) { return ED.get(state, ['tokens', 'color', '--brand']) || '#999'; };

  /* 조절 칸이 상태를 바꿀 때: ED.update(바꾸는 함수, 묶어서 되돌릴 이름) */
  ED.update = function (fn, coalesce) {
    if (ED.isBase()) return;
    var before = clone(ED.cur.state);
    fn(ED.cur.state);
    if (JSON.stringify(before) === JSON.stringify(ED.cur.state)) return;
    ED.emit('change', { before: before, coalesce: coalesce || null });
    ED.changed();
  };
  /* 상태를 통째로 바꿀 때(되돌리기·불러오기) */
  ED.replaceState = function (state, record) {
    var before = clone(ED.cur.state);
    ED.cur.state = clone(state);
    if (record) ED.emit('change', { before: before, coalesce: null });
    ED.emit('replaced');
    ED.changed();
  };
  ED.changed = function () {
    ED.emit('sync');
    renderTabs();
    ED.refreshStatus();
    schedulePreview(120);
  };

  /* ---------- 탭 ---------- */
  function renderTabs() {
    var box = $('#tabs');
    box.innerHTML = '';
    var add = function (name, text, dotColor, extra) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(ED.cur && ED.cur.name === name));
      if (dotColor) { var d = document.createElement('span'); d.className = 'tab__dot'; d.style.background = dotColor; b.appendChild(d); }
      b.appendChild(document.createTextNode(text));
      if (extra) b.appendChild(extra);
      b.addEventListener('click', function () { ED.switchTab(name); });
      box.appendChild(b);
      return b;
    };
    var lock = document.createElement('span'); lock.className = 'tab__lock'; lock.textContent = '보기만';
    add('base', '기본판', ED.brandOf(ED.base), lock);
    var names = Object.keys(ED.variants);
    if (ED.cur && ED.cur.isNew && names.indexOf(ED.cur.name) < 0) names.push(ED.cur.name);
    names.sort().forEach(function (n) {
      var isCur = ED.cur && ED.cur.name === n;
      var label = isCur ? ED.cur.label : ED.variants[n].label;
      var color = ED.brandOf(isCur ? ED.cur.state : ED.variants[n].state);
      var dirty = null;
      if (isCur && ED.isDirty()) { dirty = document.createElement('span'); dirty.className = 'tab__unsaved'; dirty.title = '저장 안 됨'; }
      add(n, label, color, dirty).title = '주소 /' + n + '/';
    });
    var nb = document.createElement('button');
    nb.type = 'button'; nb.className = 'tab tab__new'; nb.id = 'btn-new'; nb.textContent = '+ 새 시안';
    nb.disabled = !ED.newVariant;
    nb.addEventListener('click', function () { if (ED.newVariant) ED.newVariant(); });
    box.appendChild(nb);
    /* 나중에 붙일 "비교 보기" 탭 자리(그림 시안 "다", 시안이 여러 개 생긴 뒤) — 지금은 보이지 않는다 */
    var cmp = document.createElement('button');
    cmp.type = 'button'; cmp.className = 'tab tab--compare'; cmp.hidden = true; cmp.textContent = '비교 보기';
    box.appendChild(cmp);
  }
  ED.renderTabs = renderTabs;

  ED.confirmLeave = function () {
    return !ED.isDirty() || window.confirm('저장하지 않은 것이 있습니다. 저장하지 않고 넘어갈까요?');
  };
  ED.openTab = function (cur) {   // cur: { name, label, state, isNew }
    cur.savedState = clone(cur.state);
    cur.savedText = cur.name === 'base' ? '' : ED.textOf(cur);
    cur.savedAt = null;
    ED.cur = cur;
    ED.emit('tab');
    renderPanel();
    ED.changed();
    schedulePreview(0);
  };
  ED.switchTab = function (name) {
    if (ED.cur && name === ED.cur.name) return;
    if (!ED.confirmLeave()) return;
    if (name === 'base') ED.openTab({ name: 'base', label: '기본판', state: clone(ED.base), isNew: false });
    else ED.openTab({ name: name, label: ED.variants[name].label, state: clone(ED.variants[name].state), isNew: false });
  };

  /* ---------- 조절 칸 자리 ---------- */
  function renderPanel() {
    var panel = $('#panel');
    panel.innerHTML = '';
    if (ED.isBase()) {
      var n = document.createElement('p');
      n.className = 'notice notice--lock';
      n.textContent = '기본판은 지시서로만 바꿉니다. 시안을 만들려면 + 새 시안을 누르세요.';
      panel.appendChild(n);
    }
    if (ED.renderControls) ED.renderControls(panel, ED.isBase());
    ['btn-save', 'btn-import', 'btn-backups'].forEach(function (id) { var b = $('#' + id); if (b) b.disabled = ED.isBase() || !b.dataset.ready; });
  }
  ED.renderPanel = renderPanel;

  /* ---------- 미리보기 ---------- */
  var timer = null;
  function schedulePreview(ms) { clearTimeout(timer); timer = setTimeout(preview, ms); }
  ED.schedulePreview = schedulePreview;
  var keepScroll = true;
  var INTERCEPT = '(function(){document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;' +
    'var h=a.getAttribute("href");if(a.target==="_blank")return;e.preventDefault();' +
    'if(h.charAt(0)==="#"){var t=h.length>1&&document.getElementById(decodeURIComponent(h.slice(1)));if(t)t.scrollIntoView({behavior:"smooth"});else window.scrollTo({top:0,behavior:"smooth"});return;}' +
    'var m=h.match(/^([a-z0-9-]+\\.html)(#.*)?$/);if(m)parent.postMessage({sianPage:m[1],hash:m[2]||""},"*");},true);})();';
  ED.previewMs = 0;
  function preview() {
    if (!ED.cur) return;
    var base = ED.isBase();
    var r = base ? ED.runBuild(null) : ED.runBuild(ED.cur.name, ED.textOf(ED.cur));
    ED.previewMs = r.ms;
    var err = $('#preview-err');
    if (!r.ok) {
      err.textContent = r.error || '미리보기를 만들지 못했습니다.';
      err.hidden = false;
      ED.lastBuildError = r.error;
      ED.refreshStatus();
      return;
    }
    err.hidden = true;
    ED.lastBuildError = null;
    var folder = base ? '' : ED.cur.name + '/';
    var html = r.writes['/R/' + folder + ED.page];
    var css = r.writes['/R/css/' + (base ? 'tokens.css' : 'tokens.' + ED.cur.name + '.css')];
    if (!html) { err.textContent = '이 페이지는 이 판에 없습니다: ' + ED.page; err.hidden = false; return; }
    html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)?css\/tokens(?:\.[a-z0-9-]+)?\.css">/, function () { return '<style>\n' + css + '</style>'; });
    html = html.replace('<head>', '<head>\n<base href="/' + folder + '">\n<script>' + INTERCEPT + '<\/script>');
    var frame = $('#preview');
    var y = 0;
    try { if (keepScroll && frame.contentWindow) y = frame.contentWindow.scrollY || 0; } catch (e) { y = 0; }
    var hash = ED.pendingHash; ED.pendingHash = '';
    keepScroll = true;
    frame.onload = function () {
      try {
        var w = frame.contentWindow;
        if (hash) { var t = w.document.getElementById(decodeURIComponent(hash.slice(1))); if (t) t.scrollIntoView(); }
        else if (y) w.scrollTo(0, y);
      } catch (e) { /* 미리보기 안 스크롤은 못 맞춰도 된다 */ }
    };
    frame.srcdoc = html;
    $('#status-time').textContent = '미리보기 ' + (r.ms / 1000).toFixed(2) + '초';
    ED.refreshStatus();
  }
  ED.previewNow = function () { clearTimeout(timer); preview(); };
  ED.goPage = function (page, hash) {
    ED.page = page; ED.pendingHash = hash || ''; keepScroll = false;
    $('#page').value = page;
    schedulePreview(0);
  };
  window.addEventListener('message', function (e) {
    if (e.source === $('#preview').contentWindow && e.data && e.data.sianPage) ED.goPage(e.data.sianPage, e.data.hash);
  });

  /* PC: 1440px 화면을 칸 폭에 맞춰 줄여 보인다. 휴대폰: 375px 그대로 */
  function fit() {
    var stage = $('#stage'), frame = $('#preview');
    if (ED.device === 'pc') {
      var w = stage.clientWidth, h = stage.clientHeight;
      var k = Math.min(1, w / 1440);
      frame.style.width = '1440px';
      frame.style.height = Math.ceil(h / k) + 'px';
      frame.style.transform = 'scale(' + k + ')';
      $('#view-note').textContent = 'PC 1440px' + (k < 1 ? ' · ' + Math.round(k * 100) + '%로 줄여 보임' : '');
    } else {
      frame.style.width = ''; frame.style.height = ''; frame.style.transform = '';
      $('#view-note').textContent = '휴대폰 375px';
    }
  }
  function setDevice(d) {
    ED.device = d;
    $('#btn-pc').setAttribute('aria-pressed', String(d === 'pc'));
    $('#btn-m').setAttribute('aria-pressed', String(d === 'm'));
    $('#stage').className = 'stage ' + (d === 'pc' ? 'stage--pc' : 'stage--m');
    fit();
  }
  window.addEventListener('resize', fit);

  /* ---------- 알림 줄 ---------- */
  ED.statusOverride = null;   // { text, kind } — 잠깐 보여 줄 문구(저장됨, 오류)
  ED.refreshStatus = function () {
    var box = $('#status'), msg = $('#status-msg');
    var text, kind = '';
    if (ED.statusOverride) { text = ED.statusOverride.text; kind = ED.statusOverride.kind; }
    else if (!ED.cur) { text = '불러오는 중…'; }
    else if (ED.lastBuildError) { text = '미리보기 오류: ' + ED.lastBuildError.split('\n')[0]; kind = 'err'; }
    else if (ED.isBase()) { text = '기본판 — 보기만 합니다. 시안을 만들려면 + 새 시안을 누르세요.'; }
    else if (ED.isDirty()) {
      var n = ED.countDiff(ED.cur.savedState, ED.cur.state);
      text = ED.cur.isNew && !n ? '새 시안 — 아직 저장하지 않았습니다' : '저장 안 된 바뀐 것 ' + n + '개';
      kind = 'dirty';
    }
    else if (ED.cur.savedAt) { text = ED.savedMessage ? ED.savedMessage(ED.cur.savedAt) : '저장됨'; kind = 'ok'; }
    else { text = ED.cur.label + ' — 바뀐 것 없음'; }
    box.className = 'status' + (kind ? ' status--' + kind : '');
    msg.textContent = text;
  };
  ED.flash = function (text, kind) { ED.statusOverride = { text: text, kind: kind || '' }; ED.refreshStatus(); };
  ED.clearFlash = function () { ED.statusOverride = null; ED.refreshStatus(); };

  window.addEventListener('beforeunload', function (e) {
    if (ED.isDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- 페이지 고르기 ---------- */
  var PAGE_NAMES = { 'index.html': '메인', 'services.html': '사업분야', 'projects.html': '수행 이력', 'process.html': '현장 진행 방식', 'technology.html': '장비·로봇', 'company.html': '회사 소개', 'contact.html': '문의' };
  function renderPages() {
    var sel = $('#page');
    sel.innerHTML = '';
    var svcName = {};
    (ED.info.services || []).forEach(function (s) { svcName[s.file] = '사업분야 › ' + s.title; });
    ED.info.pages.filter(function (p) { return p !== '404.html'; }).forEach(function (p) {
      var o = document.createElement('option');
      o.value = p; o.textContent = PAGE_NAMES[p] || svcName[p] || p;
      sel.appendChild(o);
    });
    sel.value = ED.page;
    sel.addEventListener('change', function () { ED.goPage(sel.value); });
  }

  /* ---------- 시작 ---------- */
  ED.loadVariants = function () {
    return ED.getJson('__api/variants').then(function (names) {
      ED.variants = {};
      return Promise.all(names.map(function (n) {
        return ED.getText('tools/variants/' + n + '.js').then(function (text) {
          var over = ED.evalModule(text);
          var o = {};
          Object.keys(over).forEach(function (k) { if (k !== 'label') o[k] = over[k]; });
          ED.variants[n] = { label: over.label || n, state: ED.merge(ED.base, o), text: text };
        });
      }));
    });
  };
  ED.ready = Promise.all([ED.getText('tools/build.js'), ED.getText('tools/site.config.js'), ED.getText('tools/tokens.head.css')])
    .then(function (t) {
      T.build = t[0]; T.config = t[1]; T.head = t[2];
      buildFn = new Function('require', '__dirname', 'process', 'console', 'module', T.build);
      ED.base = ED.evalModule(T.config);
      var r = ED.runBuild(null);
      if (!r.ok) throw new Error(r.error);
      ED.info = r.info;
      return ED.loadVariants();
    })
    .then(function () {
      renderPages();
      $('#btn-pc').addEventListener('click', function () { setDevice('pc'); });
      $('#btn-m').addEventListener('click', function () { setDevice('m'); });
      setDevice('pc');
      ED.emit('ready');
      var first = Object.keys(ED.variants).sort()[0];
      if (first) ED.openTab({ name: first, label: ED.variants[first].label, state: clone(ED.variants[first].state), isNew: false });
      else ED.openTab({ name: 'base', label: '기본판', state: clone(ED.base), isNew: false });
    })
    .catch(function (e) {
      $('#panel').innerHTML = '';
      ED.flash('편집기를 시작하지 못했습니다: ' + e.message, 'err');
    });
})();
