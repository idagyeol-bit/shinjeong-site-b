/* ============================================================
   현장 문의 — 입력 확인 후 방문자의 메일 앱을 여는 방식
   ※ 접수 서버가 없습니다. 홈페이지가 메일을 대신 보내거나 저장하지 않습니다.
      접수 서버(또는 폼 서비스)를 붙이려면 README의 안내를 보세요.
   ============================================================ */
(function () {
  'use strict';

  var MAIL = 'shinjeong@sjdevel.com';
  var MAILTO_LIMIT = 1800; // 주소가 너무 길면 메일 앱이 본문을 자르므로 복사로 안내한다

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('inquiryForm');
    if (!form) return;

    var out = document.getElementById('formMsg');
    var box = document.getElementById('copyBox');
    var boxWrap = document.getElementById('copyWrap');

    /* 주소로 넘어온 맥락(#/contact?service=S04 형태)을 업무 선택에 반영 */
    (function preset() {
      var sel = form.querySelector('[name="service"]');
      if (!sel) return;
      var params = new URLSearchParams(window.location.search);
      var v = params.get('service');
      if (!v && window.location.hash.indexOf('?') !== -1) {
        v = new URLSearchParams(window.location.hash.split('?')[1]).get('service');
      }
      if (!v) return;
      var opt = sel.querySelector('option[value="' + v.replace(/"/g, '') + '"]');
      if (opt) sel.value = opt.value;
    })();

    function setBad(field, bad, msg) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.toggle('is-bad', bad);
      var err = wrap.querySelector('.field__err');
      if (err) {
        err.textContent = bad ? msg : '';
        err.hidden = !bad;
      }
      field.setAttribute('aria-invalid', String(bad));
    }

    function validate() {
      var bad = null;

      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var body = form.querySelector('[name="body"]');

      var nameBad = !name.value.trim();
      setBad(name, nameBad, '이름 또는 회사명을 입력해 주세요.');
      if (nameBad && !bad) bad = name;

      var emailVal = email.value.trim();
      var emailBad = !emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
      setBad(email, emailBad, emailVal ? '이메일 주소 형식을 확인해 주세요.' : '회신받으실 이메일을 입력해 주세요.');
      if (emailBad && !bad) bad = email;

      var bodyBad = body.value.trim().length < 5;
      setBad(body, bodyBad, '문의 내용을 조금 더 적어 주세요.');
      if (bodyBad && !bad) bad = body;

      return bad;
    }

    function compose() {
      var get = function (n) {
        var el = form.querySelector('[name="' + n + '"]');
        if (!el) return '';
        if (el.tagName === 'SELECT') {
          var o = el.options[el.selectedIndex];
          return o && o.value ? o.textContent.trim() : '';
        }
        return el.value.trim();
      };

      var service = get('service');
      var subject = '[현장 문의] ' + (service || '문의') + ' — ' + get('name');

      var lines = [
        '■ 이름 / 회사명: ' + get('name'),
        '■ 회신 이메일: ' + get('email'),
        '■ 연락처: ' + (get('phone') || '-'),
        '■ 문의 업무: ' + (service || '-'),
        '■ 현장 위치: ' + (get('place') || '-'),
        '■ 희망 일정: ' + (get('when') || '-'),
        '',
        '■ 문의 내용',
        get('body'),
        '',
        '— 신정개발 홈페이지 문의 양식에서 작성'
      ];

      return { subject: subject, text: lines.join('\n') };
    }

    function say(msg) {
      if (out) out.textContent = msg;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var bad = validate();
      if (bad) {
        say('입력하지 않은 항목이 있습니다. 표시된 곳을 확인해 주세요.');
        bad.focus();
        return;
      }

      var m = compose();
      var href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(m.subject) +
        '&body=' + encodeURIComponent(m.text);

      if (box) box.textContent = '받는 사람: ' + MAIL + '\n제목: ' + m.subject + '\n\n' + m.text;

      if (href.length > MAILTO_LIMIT) {
        if (boxWrap) boxWrap.hidden = false;
        say('문의 내용이 길어 메일 앱으로 바로 넘기지 못했습니다. 아래 내용을 복사해 ' + MAIL + ' 으로 보내 주세요.');
        if (box) box.focus && box.focus();
        return;
      }

      if (boxWrap) boxWrap.hidden = false;
      say('메일 앱을 열었습니다. 창이 열리지 않으면 아래 내용을 복사해 ' + MAIL + ' 으로 보내 주세요.');
      window.location.href = href;
    });

    /* 복사 버튼 */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) return;
      e.preventDefault();

      var what = btn.getAttribute('data-copy');
      var text = what === 'mail' ? MAIL : (box ? box.textContent : '');
      if (!text) {
        say('복사할 내용이 아직 없습니다. 먼저 [문의 내용 만들기]를 눌러 주세요.');
        return;
      }

      var done = function () {
        var old = btn.textContent;
        btn.textContent = '복사했습니다';
        setTimeout(function () { btn.textContent = old; }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          say('자동 복사가 되지 않았습니다. 내용을 직접 선택해 복사해 주세요.');
        });
      } else {
        say('자동 복사가 되지 않았습니다. 내용을 직접 선택해 복사해 주세요.');
      }
    });
  });
})();
