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
      setBad(name, nameBad, 'Please enter your name or company.');
      if (nameBad && !bad) bad = name;

      var emailVal = email.value.trim();
      var emailBad = !emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
      setBad(email, emailBad, emailVal ? 'Please check the email address format.' : 'Please enter an email address for our reply.');
      if (emailBad && !bad) bad = email;

      var bodyBad = body.value.trim().length < 5;
      setBad(body, bodyBad, 'Please tell us a little more in the message.');
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
      var subject = '[Inquiry] ' + (service || 'Inquiry') + ' — ' + get('name');

      var lines = [
        '■ Name / company: ' + get('name'),
        '■ Reply email: ' + get('email'),
        '■ Phone: ' + (get('phone') || '-'),
        '■ Service: ' + (service || '-'),
        '■ Target equipment: ' + (get('target') || '-'),
        '■ Site location: ' + (get('place') || '-'),
        '■ Preferred schedule: ' + (get('when') || '-'),
        '',
        '■ Message',
        get('body'),
        '',
        '— Written with the inquiry form on the Shinjeong Development website (English)'
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
        say('Some fields are missing. Please check the marked fields.');
        bad.focus();
        return;
      }

      var m = compose();
      var href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(m.subject) +
        '&body=' + encodeURIComponent(m.text);

      if (box) box.textContent = 'To: ' + MAIL + '\nSubject: ' + m.subject + '\n\n' + m.text;

      if (href.length > MAILTO_LIMIT) {
        if (boxWrap) boxWrap.hidden = false;
        say('The message is too long to pass to your email app. Please copy the text below and send it to ' + MAIL + '.');
        if (box) box.focus && box.focus();
        return;
      }

      if (boxWrap) boxWrap.hidden = false;
      say('Your email app has been opened. If no window appears, copy the text below and send it to ' + MAIL + '.');
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
        say('There is nothing to copy yet. Please press [Send by email] first.');
        return;
      }

      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old; }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          say('Automatic copy did not work. Please select the text and copy it yourself.');
        });
      } else {
        say('Automatic copy did not work. Please select the text and copy it yourself.');
      }
    });
  });
})();
