/* ============================================================
   신정개발 홈페이지 — 영어판 생성기 (34차, 36차에서 prefix 추가)
   node tools/build-en.js          → 루트의 한국어 HTML을 읽어 en/ 아래에 영어 HTML을 만든다.
   node tools/build-en.js --list   → 번역이 없는 문장만 목록으로 보여 준다(파일을 쓰지 않는다).

   - 반드시 `node tools/build.js` 다음에 실행한다(한국어 HTML이 원본이다).
   - 번역은 tools/i18n/en.json 한 곳에 있다. 한국어 문구를 고치면 여기에도 같은 문장을 넣어야 한다.
   - 번역이 없는 문장이 하나라도 있으면 오류로 끝나고 en/ 을 고치지 않는다(반쯤 번역된 페이지를 내보내지 않는다).
   - 외부 패키지를 쓰지 않는다.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'en');
const DICT_FILE = path.join(__dirname, 'i18n', 'en.json');
const LIST_ONLY = process.argv.includes('--list');

const HANGUL = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/;
const SKIP_PAGES = ['404.html'];           // 404는 루트 하나만 쓴다(GitHub Pages)
const JS_FILES = ['site.js', 'contact.js', 'projects.js', 'process-scene.js', 'process-scene-2d.js'];
/* 글자를 옮겨야 하는 속성. 여기에 없는 속성에 한글이 있으면 오류로 알려 준다 */
const TEXT_ATTRS = ['alt', 'aria-label', 'placeholder', 'title', 'content', 'data-search', 'data-cat', 'data-filter', 'data-label', 'data-h', 'value', 'label'];
/* 주소를 ../ 로 고쳐야 하는 속성 */
const URL_ATTRS = ['href', 'src', 'srcset', 'poster', 'data-fallback'];

const dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf8'));
const T = dict.text || {};         // 한국어 → 영어 (모든 페이지 공통)
const TP = dict.page || {};        // 페이지별로 다르게 옮길 문장 { 'company.html': { 한국어: 영어 } }
const PLAIN = dict.plain || {};    // 한글이 없지만 영어판에서 바꿀 글자 (전화번호 등)
const HREF = dict.href || {};      // 영어판에서 바꿀 링크 (tel: 등)
const JS = dict.js || {};          // JS 파일 안에만 있는 한국어 문구 → 영어 (없으면 text 에서 찾는다)
const LD = dict.jsonld || {};      // 검색엔진용 정보(JSON-LD)에서만 다르게 옮길 값
const PREFIX = dict.prefix || {};  // 문장 앞에 붙는 표시 (예: "[시안] " → "[Draft] "). 표시를 떼고 나머지를 사전에서 찾는다

const missing = [];                // { page, where, ko }
const used = new Set();

function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
/* 사전의 영어 문장을 HTML에 넣을 때: &amp; 처럼 이미 적힌 것은 그대로 두고 나머지 & < > 만 바꾼다 */
function escHtml(s) { return s.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function lookup(key, page) {
  if (TP[page] && Object.prototype.hasOwnProperty.call(TP[page], key)) { used.add(page + '::' + key); return TP[page][key]; }
  if (Object.prototype.hasOwnProperty.call(T, key)) { used.add(key); return T[key]; }
  for (const p of Object.keys(PREFIX)) {
    if (key.startsWith(p)) { const rest = lookup(key.slice(p.length), page); if (rest !== undefined) return PREFIX[p] + rest; }
  }
  return undefined;
}

/* 글자 노드 하나를 옮긴다. 앞뒤 공백은 그대로 둔다 */
function trText(raw, page, where) {
  const key = norm(raw);
  if (!key) return raw;
  const lead = raw.match(/^\s*/)[0];
  const tail = raw.match(/\s*$/)[0];
  if (!HANGUL.test(key)) {
    return Object.prototype.hasOwnProperty.call(PLAIN, key) ? lead + escHtml(PLAIN[key]) + tail : raw;
  }
  const en = lookup(key, page);
  if (en === undefined) { missing.push({ page, where, ko: key }); return raw; }
  return lead + escHtml(en) + tail;
}

function isRelative(u) {
  return u && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(u);
}

/* 영어판은 en/ 아래에 있으므로 그림·스타일·문서 주소 앞에 ../ 를 붙인다. 페이지(.html)와 js/ 는 en/ 안의 것을 쓴다 */
function fixUrl(u) {
  if (!isRelative(u)) return u;
  if (/^[^?#]*\.html(?:[?#].*)?$/.test(u)) return u;
  if (/^js\//.test(u)) return u;
  return '../' + u;
}

function trTag(tag, page, file) {
  if (/^<\//.test(tag)) return tag;
  let out = tag;

  // <html lang="ko"> → en
  if (/^<html\b/i.test(out)) out = out.replace(/\blang="ko"/, 'lang="en"');

  // 속성 하나씩
  out = out.replace(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)="([^"]*)"/g, (m, name, val) => {
    const n = name.toLowerCase();
    let v = val;
    if (URL_ATTRS.includes(n)) {
      if (n === 'srcset') v = v.split(',').map((p) => { const t = p.trim().split(/\s+/); t[0] = fixUrl(t[0]); return t.join(' '); }).join(', ');
      else if (Object.prototype.hasOwnProperty.call(HREF, v)) v = HREF[v];
      else v = fixUrl(v);
    } else if (HANGUL.test(v)) {
      if (!TEXT_ATTRS.includes(n)) { missing.push({ page, where: 'attr(' + n + ') — 목록에 없는 속성', ko: v }); return m; }
      const key = norm(v);
      const en = lookup(key, page);
      if (en === undefined) { missing.push({ page, where: 'attr(' + n + ')', ko: key }); return m; }
      v = escHtml(en).replace(/"/g, '&quot;');
    } else if (n === 'content' && Object.prototype.hasOwnProperty.call(PLAIN, v)) {
      v = escHtml(PLAIN[v]).replace(/"/g, '&quot;');
    }
    return name + '="' + v + '"';
  });

  // 대표 주소·공유 주소는 영어판 주소로
  if (/^<link\b[^>]*rel="canonical"/.test(out) || /^<meta\b[^>]*property="og:url"/.test(out)) {
    out = out.replace(/((?:href|content)=")(https?:\/\/[^"]*?\/)((?:[^"\/]*\.html)?)"/, (m, a, base, f) => a + base + 'en/' + f + '"');
  }
  if (/^<meta\b[^>]*property="og:locale"/.test(out)) out = out.replace('ko_KR', 'en_US');

  // 언어 전환: 한국어판과 반대로
  if (/\bdata-lang="ko"/.test(out)) {
    out = out.replace(/\bhref="[^"]*"/, 'href="../' + file + '"').replace(/\s*class="is-on"/, '').replace(/\s*aria-current="true"/, '');
  } else if (/\bdata-lang="en"/.test(out)) {
    out = out.replace(/\bhref="[^"]*"/, 'href="' + file + '" class="is-on" aria-current="true"');
  }
  return out;
}

function trJsonLd(body, page) {
  let data;
  try { data = JSON.parse(body); } catch (e) { missing.push({ page, where: 'json-ld', ko: '(JSON을 읽지 못함)' }); return body; }
  const walk = (v) => {
    if (typeof v === 'string') {
      if (Object.prototype.hasOwnProperty.call(LD, v)) return LD[v];
      if (!HANGUL.test(v)) return v;
      const en = lookup(norm(v), page);
      if (en === undefined) { missing.push({ page, where: 'json-ld', ko: norm(v) }); return v; }
      return en.replace(/&amp;/g, '&');
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach((k) => { o[k] = walk(v[k]); }); return o; }
    return v;
  };
  return JSON.stringify(walk(data));
}

function trHtml(html, file) {
  const page = file;
  const re = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>|[^<]+/g;
  let out = '';
  let m;
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;                                   // 주석은 영어판에 싣지 않는다
    if (/^<script\b/i.test(tok)) {
      const open = tok.match(/^<script\b[^>]*>/i)[0];
      const body = tok.slice(open.length, tok.length - '</script>'.length);
      if (/type="application\/ld\+json"/.test(open)) out += open + trJsonLd(body, page) + '</script>';
      else out += trTag(open, page, file) + body + '</script>';
      continue;
    }
    if (/^<style\b/i.test(tok)) { out += tok; continue; }
    if (tok[0] === '<') { out += trTag(tok, page, file); continue; }
    out += trText(tok, page, 'text');
  }
  return out;
}

/* JS 파일: 따옴표 안의 글자만 옮긴다(주석과 코드는 그대로).
   - 따옴표 안 전체가 사전에 있으면 그대로 바꾼다. 앞뒤 공백·줄바꿈(\n)은 남긴다.
   - 따옴표 안에 태그가 들어 있으면(2D 그림의 SVG) 태그 사이 글자를 하나씩 옮기고 <!-- 주석 --> 은 지운다.
   - 옮긴 뒤 문법 검사를 한다(따옴표가 깨지면 여기서 걸린다). */
function jsLookup(key) {
  if (Object.prototype.hasOwnProperty.call(JS, key)) { used.add('js::' + key); return JS[key]; }
  if (Object.prototype.hasOwnProperty.call(T, key)) { used.add(key); return T[key]; }
  return undefined;
}
function jsEsc(s, q) { return s.replace(/\\/g, '\\\\').split(q).join('\\' + q).replace(/\n/g, '\\n'); }
function trJsString(body, q, name) {
  if (!HANGUL.test(body)) return body;
  const whole = jsLookup(body);                                   // 앞뒤 공백까지 똑같은 것이 있으면 먼저
  if (whole !== undefined) return jsEsc(whole.replace(/&amp;/g, '&'), q);
  if (/<[a-zA-Z!\/]/.test(body)) {                                // 태그가 든 글자
    return body.replace(/<!--[\s\S]*?-->/g, '').replace(/>([^<>]*)</g, (m, t) => {
      if (!HANGUL.test(t)) return m;
      const lead = t.match(/^(?:\s|\\n)*/)[0];
      const tail = t.match(/(?:\s|\\n)*$/)[0];
      const key = norm(t.slice(lead.length, t.length - tail.length));
      const en = jsLookup(key);
      if (en === undefined) { missing.push({ page: 'js/' + name, where: 'js', ko: key }); return m; }
      return '>' + lead + jsEsc(escHtml(en), q) + tail + '<';
    });
  }
  const lead = body.match(/^(?:\s|\\n)*/)[0];
  const tail = body.match(/(?:\s|\\n)*$/)[0];
  const key = body.slice(lead.length, body.length - tail.length);
  const en = jsLookup(key);
  if (en === undefined) { missing.push({ page: 'js/' + name, where: 'js', ko: body }); return body; }
  return lead + jsEsc(en.replace(/&amp;/g, '&'), q) + tail;
}
function trJs(src, name) {
  let out = '';
  let i = 0;
  let prev = '';                                                  // 바로 앞의 뜻 있는 글자(정규식인지 나눗셈인지 가리는 데 쓴다)
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const j = e < 0 ? n : e; out += src.slice(i, j); i = j; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const j = e < 0 ? n : e + 2; out += src.slice(i, j); i = j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out += c + trJsString(src.slice(i + 1, j), c, name) + c;
      i = j + 1; prev = c; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\breturn$/.test(out.trimEnd()))) {   // 정규식
      let j = i + 1; let cls = false;
      while (j < n && (src[j] !== '/' || cls)) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
      out += src.slice(i, j + 1); i = j + 1; prev = '/'; continue;
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  try { new vm.Script(out, { filename: 'en/js/' + name }); } catch (e) { missing.push({ page: 'js/' + name, where: '옮긴 뒤 문법 오류', ko: String(e.message) }); }
  return out;
}

/* ---------- 실행 ---------- */
const pages = fs.readdirSync(ROOT).filter((f) => /\.html$/.test(f) && !SKIP_PAGES.includes(f)).sort();
const results = {};
pages.forEach((file) => { results[file] = trHtml(fs.readFileSync(path.join(ROOT, file), 'utf8'), file); });
const jsResults = {};
JS_FILES.forEach((name) => {
  const p = path.join(ROOT, 'js', name);
  if (fs.existsSync(p)) jsResults[name] = trJs(fs.readFileSync(p, 'utf8'), name);
});

/* 옮긴 뒤에도 한글이 남았는지 한 번 더 본다(사전의 영어 칸에 한글을 일부러 넣은 경우는 allow 에 적는다) */
const ALLOW = dict.allow || [];
Object.keys(results).forEach((file) => {
  let body = results[file].replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (s) => (/ld\+json/.test(s) ? s : ''));
  ALLOW.forEach((a) => { body = body.split(a).join(''); });
  const left = body.match(/[^<>"\n]*[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3][^<>"\n]*/g) || [];
  Array.from(new Set(left.map(norm))).forEach((ko) => {
    if (!missing.some((x) => x.page === file && x.ko === ko)) missing.push({ page: file, where: '옮긴 뒤에도 남은 한글', ko });
  });
});

if (missing.length) {
  const seen = new Set();
  const uniq = missing.filter((x) => { const k = x.ko; if (seen.has(k)) return false; seen.add(k); return true; });
  if (LIST_ONLY) {
    const o = {};
    uniq.forEach((x) => { (o[x.page] = o[x.page] || []).push(x.where === 'text' ? x.ko : x.ko + '   ⟵ ' + x.where); });
    console.log(JSON.stringify(o, null, 1));
  }
  console.error(`번역이 없는 문장 ${uniq.length}개 — tools/i18n/en.json 에 넣어야 합니다.` + (LIST_ONLY ? '' : ' (목록: node tools/build-en.js --list)'));
  if (!LIST_ONLY) uniq.slice(0, 20).forEach((x) => console.error(`  [${x.page}] ${x.where}: ${x.ko}`));
  process.exit(LIST_ONLY ? 0 : 1);
}
if (LIST_ONLY) { console.log('번역이 없는 문장 0개'); process.exit(0); }

fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
/* 예전에 만든 영어 페이지 가운데 이제 없는 것은 지운다 */
fs.readdirSync(OUT).filter((f) => /\.html$/.test(f) && !results[f]).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
Object.keys(results).forEach((file) => fs.writeFileSync(path.join(OUT, file), results[file], 'utf8'));
Object.keys(jsResults).forEach((name) => fs.writeFileSync(path.join(OUT, 'js', name), jsResults[name], 'utf8'));

/* sitemap.xml 에 영어 주소를 더한다(build.js 가 매번 새로 쓰므로 여기서 매번 더한다) */
const smFile = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(smFile)) {
  let sm = fs.readFileSync(smFile, 'utf8');
  if (!/\/en\//.test(sm)) {
    const urls = (sm.match(/<url>[\s\S]*?<\/url>/g) || []).map((u) =>
      u.replace(/<loc>(https?:\/\/[^<]*?\/)((?:[^<\/]*\.html)?)<\/loc>/, (m, base, f) => '<loc>' + base + 'en/' + f + '</loc>')
        .replace(/<priority>[^<]*<\/priority>/, '<priority>0.5</priority>'));
    sm = sm.replace(/\n<\/urlset>/, '\n' + urls.map((u) => '  ' + u.trim()).join('\n') + '\n</urlset>');
    fs.writeFileSync(smFile, sm, 'utf8');
  }
}

/* 쓰이지 않은 번역은 알려만 준다(지워도 된다) */
const unused = Object.keys(T).filter((k) => !used.has(k));
console.log(`영어판 생성 완료: HTML ${Object.keys(results).length}개 + JS ${Object.keys(jsResults).length}개 → en/`);
if (unused.length) console.log(`지금 페이지에 쓰이지 않은 번역 ${unused.length}개(시안 표시를 켜 둔 동안에는 검색엔진용 회사 정보 문장이 여기에 나온다 — 그 문장은 지우지 않는다): ` + unused.slice(0, 10).join(' / ') + (unused.length > 10 ? ' …' : ''));
