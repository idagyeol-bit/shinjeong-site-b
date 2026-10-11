/* 신정개발 홈페이지 — 시안 편집기 저장·되돌리기·저장한 판으로 돌아가기 (42차)
   - 저장: 글 칸 확인 → 같은 생성기(tools/build.js)로 만들기(틀리면 한국어 오류, 아무것도 쓰지 않음)
           → tools/variants/<시안>.js → <시안>/ 12쪽 → css/tokens.<시안>.css. 직전 판은 서버가 _보관/ 에 남긴다.
   - 되돌리기: 바꾼 것을 한 단계씩(최대 200단계, Ctrl+Z), 다시 하기(Ctrl+Y). 창을 닫기 전까지 저장한 뒤에도 된다. */
(function () {
  'use strict';
  var ED = window.ED;
  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var hhmm = function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

  /* ---------- 대화 상자 (가져오기·새 시안도 쓴다) ---------- */
  ED.dialog = function (title, build) {
    var d = el('dialog');
    var box = el('form', 'dlg'); box.method = 'dialog';
    box.appendChild(el('h2', null, title));
    d.appendChild(box);
    document.body.appendChild(d);
    var close = function () { d.close(); };
    d.addEventListener('close', function () { d.remove(); });
    build(box, close);
    d.showModal();
    return d;
  };

  /* ---------- 되돌리기 ---------- */
  var undo = [], redo = [];
  var LIMIT = 200;
  ED.on('change', function (c) {
    var last = undo[undo.length - 1];
    var now = Date.now();
    /* 같은 글 칸에 이어 친 글자는 한 단계로 묶는다 */
    if (c.coalesce && last && last.coalesce === c.coalesce && now - last.t < 1500) { last.t = now; }
    else { undo.push({ state: c.before, coalesce: c.coalesce, t: now }); if (undo.length > LIMIT) undo.shift(); }
    redo = [];
  });
  ED.on('tab', function () { undo = []; redo = []; });
  function doUndo() {
    if (ED.isBase() || !undo.length) return;
    redo.push(ED.clone(ED.cur.state));
    ED.replaceState(undo.pop().state, false);
  }
  function doRedo() {
    if (ED.isBase() || !redo.length) return;
    undo.push({ state: ED.clone(ED.cur.state), coalesce: null, t: 0 });
    ED.replaceState(redo.pop(), false);
  }
  ED.undo = doUndo; ED.redo = doRedo;
  ED.on('sync', function () {
    $('#btn-undo').disabled = ED.isBase() || !undo.length;
    $('#btn-redo').disabled = ED.isBase() || !redo.length;
    $('#btn-undo').title = '되돌리기 (Ctrl+Z) — ' + undo.length + '단계';
  });
  $('#btn-undo').addEventListener('click', doUndo);
  $('#btn-redo').addEventListener('click', doRedo);
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); }
    else if (k === 's') { e.preventDefault(); ED.save(); }
  });

  /* ---------- 저장 ---------- */
  function put(url, body) {
    return fetch('/' + url, { method: 'PUT', headers: { 'X-Sian-Editor': '1', 'Content-Type': 'text/plain; charset=utf-8' }, body: body })
      .then(function (r) { return r.text().then(function (t) { if (!r.ok) throw new Error(t || ('쓰기 실패 ' + r.status)); }); });
  }
  ED.savedMessage = function (d) {
    return '저장됨 ' + hhmm(d) + ' · 저장소에 올리려면 Claude Code에 "시안 저장한 것 커밋하고 푸시해 줘"라고 말하세요';
  };
  var saving = false;
  ED.save = function () {
    if (ED.isBase() || saving) return Promise.resolve(false);
    var cur = ED.cur;
    var problems = ED.validate ? ED.validate() : [];
    if (problems.length) {
      ED.flash('저장하지 못했습니다 — ' + problems[0].label + ': ' + problems[0].msg, 'err');
      var bad = document.querySelector('.ctl--bad');
      if (bad) { var g = bad.closest('details'); while (g) { g.open = true; g = g.parentElement && g.parentElement.closest('details'); } bad.scrollIntoView({ block: 'center' }); }
      return Promise.resolve(false);
    }
    var text = ED.textOf(cur);
    var r = ED.runBuild(cur.name, text);
    if (!r.ok) { ED.flash('저장하지 못했습니다 — ' + r.error.split('\n')[0], 'err'); return Promise.resolve(false); }
    var name = cur.name;
    var pre = '/R/' + name + '/';
    var outs = Object.keys(r.writes).filter(function (k) { return k.indexOf(pre) === 0 && /^[a-z0-9-]+\.html$/.test(k.slice(pre.length)); });
    var tok = r.writes['/R/css/tokens.' + name + '.css'];
    if (outs.length < 1 || !tok) { ED.flash('저장하지 못했습니다 — 시안 결과를 만들지 못했습니다.', 'err'); return Promise.resolve(false); }
    saving = true;
    ED.flash('저장하는 중…');
    return put('__api/variant/' + name, text)
      .then(function () { return outs.reduce(function (p, k) { return p.then(function () { return put('__api/out/' + name + '/' + k.slice(pre.length), r.writes[k]); }); }, Promise.resolve()); })
      .then(function () { return put('__api/tokens/' + name, tok); })
      .then(function () {
        ED.variants[name] = { label: cur.label, state: ED.clone(cur.state), text: text };
        cur.isNew = false;
        cur.savedState = ED.clone(cur.state);
        cur.savedText = text;
        cur.savedAt = new Date();
        ED.lastSaveCount = outs.length;
        ED.statusOverride = null;
        ED.changed();
        return true;
      })
      .catch(function (e) { ED.flash('저장하지 못했습니다 — ' + e.message, 'err'); return false; })
      .then(function (ok) { saving = false; return ok; });
  };
  $('#btn-save').addEventListener('click', function () { ED.save(); });
  $('#btn-save').dataset.ready = '1';

  /* ---------- 저장한 판으로 돌아가기 ---------- */
  function stampText(file) {
    var m = file.match(/-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.js$/);
    return m ? m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] : file;
  }
  ED.openBackups = function () {
    if (ED.isBase()) return;
    var name = ED.cur.name;
    ED.dialog('저장한 판으로 돌아가기 — ' + ED.cur.label, function (box, close) {
      box.appendChild(el('p', 'muted', '저장할 때마다 바로 전의 판이 보관됩니다(시안마다 최근 30개). 하나를 고르면 그 판을 화면에 불러옵니다. 파일은 저장을 눌러야 바뀝니다.'));
      var list = el('ul', 'baklist'); box.appendChild(list);
      var li0 = el('li'); li0.appendChild(el('p', 'muted', '불러오는 중…')); list.appendChild(li0);
      var acts = el('div', 'dlg__acts');
      var cancel = el('button', 'btn', '닫기'); cancel.type = 'button'; cancel.addEventListener('click', close);
      acts.appendChild(cancel); box.appendChild(acts);
      ED.getJson('__api/backups?name=' + encodeURIComponent(name)).then(function (files) {
        list.innerHTML = '';
        if (!files.length) { var e0 = el('li'); e0.appendChild(el('p', 'muted', '아직 보관한 판이 없습니다. 처음 저장할 때부터 쌓입니다.')); list.appendChild(e0); return; }
        files.forEach(function (f) {
          var li = el('li');
          var b = el('button'); b.type = 'button';
          b.appendChild(el('span', null, stampText(f)));
          var info = el('span', 'muted', '…'); b.appendChild(info);
          li.appendChild(b); list.appendChild(li);
          ED.getText('tools/variants/_보관/' + f).then(function (text) {
            var over = ED.evalModule(text);
            var o = {}; Object.keys(over).forEach(function (k) { if (k !== 'label') o[k] = over[k]; });
            var state = ED.merge(ED.base, o);
            info.textContent = (over.label || '') + ' · 기본판과 다른 것 ' + ED.countDiff(ED.base, state) + '개';
            b.addEventListener('click', function () {
              if (over.label) ED.cur.label = over.label;
              ED.replaceState(state, true);
              ED.flash('보관본 ' + stampText(f) + ' 을 불러왔습니다. 저장을 눌러야 파일이 바뀝니다.', 'dirty');
              setTimeout(ED.clearFlash, 4000);
              close();
            });
          }).catch(function () { info.textContent = '읽지 못함'; });
        });
      }).catch(function (e) { list.innerHTML = ''; var e1 = el('li'); e1.appendChild(el('p', 'muted', '목록을 읽지 못했습니다: ' + e.message)); list.appendChild(e1); });
    });
  };
  $('#btn-backups').addEventListener('click', function () { ED.openBackups(); });
  $('#btn-backups').dataset.ready = '1';
})();
