# 신정개발 홈페이지 — Claude Code 작업 규칙

이 폴더는 (주)신정개발 홈페이지(정적 사이트)의 원본입니다. 배포 주소: https://idagyeol-bit.github.io/shinjeong-site-b/

## 절대 규칙 (클라이언트 요구사항)
1. **사실만 쓴다.** 새 문장·수치·명칭은 `회사소개서(출력-240304-신정개발-카달로그.pdf)` 또는 `기술소개서(…Cleaning-시스템2025.pdf)`에 있는 내용만 쓴다. 자료에 없는 것은 "상담 시 안내"로 처리한다. 발주처 실명, 장비 모델·세대·성능 수치, 사진 속 장비의 세대는 확인 전까지 쓰지 않는다.
2. **사진은 클라이언트 사진 ZIP 3개(홈페이지 메인 / 홈페이지사진모음 / 로봇)에서만** 쓴다. PDF 안의 사진·로고·도표를 잘라 쓰지 않는다. 사진 편집은 크롭·축소·완만한 보정·번호판/얼굴 흐림까지만 하고 합성·요소 삭제는 하지 않는다.
   - **예외 (11차, 2026-10-02 이다결 님 결정):** `assets/photos/P01·P03·P06·P08·P10·P11` 6장(파일 12개)은 회사소개서·기술소개서 PDF의 작업 사진이다. 이 6장만 허용하며, 출처 쪽은 `tools/photo-plan.json`에 있다. 다시 만들거나 크기를 바꾸지 않는다. 그 밖의 PDF 사진은 여전히 쓰지 않는다.
   - **예외 (50차, 2026-10-14 이다결 님 결정):** `assets/photos/U01-*.jpg`(원본 사본 `tools/photo-src/U01-original.png`)는 이다결 님이 준 '푸른 하늘·흰 저장 탱크' 사진이다(클라이언트 ZIP·PDF 사진 아님, 출처·사용권은 이다결 님 확인). 시안 A 첫 화면 '산업설비 클리닝' 배경에만 쓰고, 신정개발의 설비·실적처럼 설명하지 않는다. 출처 기록은 `tools/photo-plan.json`.
3. 사진 설명(alt/캡션)은 사진에 보이는 것만 적는다. 특정 발주처나 실적의 증거처럼 쓰지 않는다.
4. 대표자명은 두 자료가 서로 달라(2024 김만식 / 2025 김영삼) 확인 전까지 표기하지 않는다.
   - **예외 (33차, 2026-10-03 이다결 님 결정):** 내려받기용 기술소개서 공개용 PDF(`assets/docs/shinjeong-robot-cleaning-system-2025-public.pdf`) 3쪽의 대표자 표기는 그대로 둔다. 사이트 본문(HTML)에는 여전히 대표자명을 쓰지 않는다.
5. **원본 소개서 PDF는 사이트에 올리지 않는다.** 내려받기용 파일은 `assets/docs/`의 공개용 두 개뿐이다(33차, 개인정보·발주처 실명이 있는 쪽을 뺀 판). 파일을 바꿀 때는 이다결 님이 준 공개용 파일만 쓴다.

## 구조
- `tools/build.js` 가 **원본**이다. 회사 정보(C), 사업분야(SERVICES), 기술(TECH/RECOVERY/PROCESS), 수행이력(PROJECTS), 사진 목록(PHOTOS), 신뢰 정보(CREDS), 장비(EQUIP), FAQ 를 여기서 고친 뒤 `node tools/build.js` 를 실행하면 13개 HTML + sitemap + robots 가 다시 생성된다.
- HTML 파일을 직접 고치면 다음 생성 때 덮어써진다. 반드시 build.js 를 고친다.
- 디자인 토큰은 `tools/site.config.js`의 `tokens`에서 고친다(`css/tokens.css`는 생성 결과), 구성 요소 스타일은 `css/site.css`.
- 사진: `assets/photos/<ID>-<가로폭>.jpg`. ID ↔ 원본 ZIP 파일 ↔ 크롭 좌표는 `tools/photo-plan.json`.
- 자세한 사용법은 `README.md`, 디자인 규칙은 `가이드_대기업사이트_분석과_적용원칙.md`.

## 영어판 (34차)
- 영어 페이지는 `en/` 아래에 있고, `tools/build-en.js`가 한국어 HTML을 읽어 만든다. `en/` 안의 파일은 직접 고치지 않는다.
- 번역은 `tools/i18n/en.json` 한 곳에 있다. 한국어 문구를 바꾸거나 더하면 `node tools/build-en.js --list`로 빠진 문장을 보고, 같은 뜻의 영어를 이 파일에 넣는다. 영어 문장에는 한국어 원문에 없는 수치·표현을 더하지 않는다(절대 규칙 1과 같다).
- 재생성은 항상 두 줄이다: `node tools/build.js` → `node tools/build-en.js`. 둘째 줄이 오류로 끝나면 번역이 빠진 것이므로 커밋하지 않는다.
- 영어판에만 필요한 모양은 `css/site.css`의 `html[lang="en"]` 규칙에만 둔다. 색·여백·구성은 한국어판과 같게 둔다.
- 용어: 진공흡입차 = vacuum truck, 제어 차량 = control vehicle, 분리장치 = separator, 잔류물 = residue, 퇴적물 = sediment, 충진물 = packing media, 준설 = dredging, 단가계약 = unit-price contract, 정기보수 = scheduled maintenance, 대정비 = major turnaround, 밀폐공간 = confined space.

## 시안 표시 (36차)
- 이 주소는 지금 **검토용 시안**이다. 공식 홈페이지는 다른 업체가 만든 sjdevel.com 이다. `tools/build.js` 맨 위의 `PREVIEW = true` 인 동안 모든 페이지에 검색 제외(`noindex`), 제목 앞 `[시안]`(영어판 `[Draft]`), 맨 위 안내 한 줄(`.pvbar`)이 들어가고, 검색엔진용 회사 정보와 `sitemap.xml`은 만들지 않는다.
- 시안 표시와 관계된 것은 모두 `PREVIEW`에 걸어 둔다. 본문은 `PREVIEW`와 상관없이 같아야 한다.
- `robots.txt`로 읽기를 막지 않는다(막으면 검색엔진이 `noindex`를 읽지 못한다).
- 영어판 생성 때 `쓰이지 않은 번역 8개`가 나오는 것은 정상이다(검색엔진용 회사 정보의 문장). 사전에서 지우지 않는다.
- **정식 오픈 때:** `PREVIEW`를 `false`로 바꾸고 `node tools/build.js` → `node tools/build-en.js`. 이다결 님이 말하기 전에는 `false`로 바꾸지 않는다.

## 검토 자료 (38차)
- `guide/`는 클라이언트 검토 자료의 웹 페이지 판이다(주소 `…/guide/`). 생성기(`tools/build.js`, `tools/build-en.js`)가 만들지 않는 정적 폴더이고, 재생성해도 바뀌지 않아야 한다.
- 이 폴더의 파일은 Cowork에서 만든 것을 그대로 넣는다. 직접 고치지 않는다(고칠 일이 있으면 이다결 님이 새 파일을 준다).
- `guide/index.html`은 `assets/fonts/sub/PretendardVariable-0~7.woff2`와 `assets/logo/shinjeong-symbol.svg`를 빌려 쓴다. 이 파일들의 이름이나 자리를 바꾸면 `guide/`도 함께 확인한다.
- 항상 검색 제외(`noindex, nofollow`)다. `PREVIEW`와 상관없다.
- `guide/img/`의 그림은 이 사이트 화면을 찍은 것이고, `guide/shinjeong-homepage-review.pdf`는 검토 자료다(절대 규칙 2·5의 대상이 아니다).
- **정식 오픈 때:** 이다결 님에게 확인한 뒤 `guide/` 폴더를 지운다.

## 작업 방법 (39차)
- 갈래가 두 개다. `main` = 클라이언트에게 보낸 공개본(깃허브 Pages가 보여 주는 판). `dev` = 작업용.
- **모든 수정은 `dev`에서 한다.** 작업을 시작하기 전에 `git branch --show-current`로 `dev`인지 확인하고, 아니면 멈추고 알린다.
- `dev`에서 커밋하고 `git push origin dev`로 올려도 공개 주소는 바뀌지 않는다(백업만 된다). 고친 모습은 미리보기(`serve.ps1`)로 본다.
- **`main`에 합치거나 `main`을 푸시하는 것은 이다결 님이 "main에 합쳐 줘"처럼 분명히 말할 때만** 한다. 순서: `git switch main` → `git pull --ff-only origin main` → `git merge --no-ff dev` → 재생성 두 줄로 결과가 같은지 확인 → 보고하고 확인받기 → `git push origin main` → `git switch dev`.
- 급하게 공개본만 고쳐야 할 때(틀린 숫자 등)도 이다결 님이 말할 때만 `main`에서 고친다. 끝나면 `git switch dev` → `git merge main`으로 같은 수정을 `dev`에도 가져온다.
- `review-2026-10` 태그는 2026-10-03 클라이언트에게 보낸 판이다. 지우거나 옮기지 않는다. 비교: `git diff review-2026-10 dev --stat`.
- `dev`에서 사이트를 크게 바꾼 뒤 합치면 검토 자료(`guide/`)와 PDF 속 화면이 실제 사이트와 달라진다. 합치기 전에 이다결 님에게 알린다.

## 설정 파일 (40차)
- 바꾸는 손잡이는 `tools/site.config.js` 한 곳이다: 색·글꼴·모양·여백(tokens), 첫 화면(hero), 메인 구역 순서와 바탕(home.sections), 메인 문구(home.copy), 메뉴와 공통 문구(nav, common), 큰 틀(frame).
- `css/tokens.css`는 직접 고치지 않는다. 설정을 고치고 `node tools/build.js`로 다시 만든다.
- 사실(회사 정보, 업무, 실적, 면허·인증, 장비, 자주 묻는 질문, 숫자, 사진 목록)은 `tools/build.js`에 있다. 설정 파일로 옮기지 않는다. 문구를 바꿀 때도 사실은 바꾸지 않는다.
- 시안은 한국어만 만든다. 영어판은 기본판에만 있다. 기본판의 메인 문구를 바꾸면 `node tools/build-en.js --list`로 번역을 맞춘다.
- 큰 틀(`frame`)은 지금 `base`만 있다. 새 큰 틀은 그림 시안으로 고른 뒤 지시서로 `FRAMES`에 추가한다.

## 시안 (41차)
- 시안은 `tools/variants/<시안이름>.js`에 기본 설정과 **다른 점만** 적는다. 파일 이름이 주소가 된다(`a.js` → `/a/`). 이름은 영어 소문자·숫자·`-`만, `assets` `css` `en` `guide` `js` `tools`는 쓸 수 없다. `_`로 시작하는 파일은 만들지 않는다.
- `node tools/build.js` 한 번이면 기본판과 모든 시안이 함께 만들어진다. 사실(build.js)을 고치면 모든 시안에 같이 반영된다.
- 시안 결과: `<시안이름>/` 폴더(한국어 12쪽, 404 없음)와 `css/tokens.<시안이름>.css`. 둘 다 생성 결과이므로 직접 고치지 않는다.
- 시안은 한국어만, 항상 검색 제외, 언어 선택 없음, 맨 위 안내 줄에 시안 이름과 `기본판 보기`.
- 문의 띠 문구: 메인은 `home.copy.cta`, 메인 밖은 `common.cta`(41차, 이다결 님 "가"). 시안에서 메인 문구를 바꿔도 다른 페이지는 바뀌지 않는다.
- 시안을 없앨 때는 설정 파일, `<시안이름>/` 폴더, `css/tokens.<시안이름>.css` 세 가지를 함께 지운다.
- 시안 폴더도 `main`에 합치면 공개 주소에 올라간다. 합치기 전에 어떤 시안을 남길지 이다결 님에게 묻는다(`test`는 합치기 전에 지우는 것이 기본).

## 시안 편집기 (42차)
- 켜기: 홈페이지 폴더의 `시안편집기.bat` 더블클릭 → http://localhost:4174/tools/editor/ . 검은 창을 닫으면 꺼진다. 설치하는 프로그램은 없다(PowerShell 서버 `tools/editor/editor.ps1` + 브라우저 안 생성).
- 편집기는 `tools/variants/<시안>.js`, `<시안>/` 폴더, `css/tokens.<시안>.css`만 쓴다. 기본판·사실·다른 파일은 쓰지 못한다. 기본판은 지시서로만 바꾼다.
- 편집기와 `node tools/build.js`는 같은 `tools/build.js`를 쓴다. 페이지 틀을 고치면 편집기 미리보기도 같이 바뀌어야 한다. 편집기 안에 페이지 틀을 따로 만들지 않는다.
- 저장할 때마다 이전 판이 `tools/variants/_보관/`에 남는다(시안마다 30개, 커밋하지 않음).
- 이다결 님이 "시안 저장한 것 커밋하고 푸시해 줘"라고 하면: `git status`로 바뀐 시안 파일(`tools/variants/<시안>.js`, `<시안>/`, `css/tokens.<시안>.css`)만 확인해 보여 주고 `dev`에 커밋·푸시한다. 맨 위 HTML이나 `css/tokens.css`가 바뀌어 있으면 멈추고 알린다.
- 숫자를 새로 넣는 것, `{n}` 같은 자리표시를 지우는 것, `<br>` 밖의 태그는 편집기가 막는다. 이 규칙을 풀지 않는다.
- 나중에 붙일 것: `비교 보기` 탭(그림 시안 "다", 시안이 여러 개 생긴 뒤).

## 시안 갈래 (43차)
- 갈래: `main` = 최종본(그대로 둔다) · `dev` = 공통 작업(사실·도구) · `sian-a`, `sian-b` = 시안(모양 공사). 시안은 동시에 2개까지.
- 지시서 맨 위의 `작업 갈래`와 `git branch --show-current`가 다르면 **멈추고 알린다.** 갈래를 마음대로 바꾸지 않는다.
- 시안 갈래의 지시서는 그 갈래에만 커밋·푸시한다. 시안을 `dev`나 `main`에 합치는 것은 이다결 님이 분명히 말할 때만 한다.
- 회사 사실(숫자·업무·실적·연락처)은 `dev`에서만 고친다. 이다결 님이 "시안에 dev 받아 와 줘"라고 하면 시안 갈래마다 `git merge dev`를 하고, 충돌이 나면 멈추고 알린다.
- "sian-a 미리보기 켜 줘" = 바뀐 것이 없는지 확인 → `git switch sian-a` → 미리보기(`serve.ps1`). 끝나면 "지금 갈래"를 알려 준다.
- 시안 띠(`CFG.sian`)는 시안 갈래에서만 채운다. `dev`·`main`에서는 비워 둔다.
- **시안 A는 원본과 다른 저장소에 올린다(2026-10-13 이다결 님 결정).** 저장소 `idagyeol-bit/shinjeong-site-sian-a`(원격 이름 `sian`), 주소 https://idagyeol-bit.github.io/shinjeong-site-sian-a/ . 올리기: `sian-a` 갈래에서 `git push sian sian-a:main`. 원본 저장소(`origin`)에는 시안 A를 올리지 않는다. 설정 `sian.url`에 이 주소를 넣어 링크 미리보기 주소가 시안 A를 가리키게 한다.
- 지시서는 `홈페이지_구역지도.md`의 구역 번호로 고칠 곳을 정한다. 지시서에 없는 구역은 고치지 않는다.
- **시안 A 전용 폴더(2026-10-14, 이다결 님 요청):** 시안 A 는 `…\신정개발-홈페이지-새디자인_1\시안A` 폴더(git worktree, 갈래 `sian-a`)에서 고치고 커밋·푸시한다. 원래 폴더 `shinjeong-site` 는 `dev`(원본 작업용)로 둔다. 한 갈래는 두 폴더에서 동시에 열 수 없으므로 `shinjeong-site` 에서 `git switch sian-a` 하지 않는다. 시안 A 미리보기는 시안A 폴더의 `serve.ps1`(4173), 비교 보기는 시안A 폴더의 `비교보기.bat`.

## 비교 보기 (44차)
- `비교보기.bat`(또는 바탕화면 `신정개발 비교보기`) → http://localhost:4180/ : 왼쪽 최종본(`../_최종본_보기`, origin/main), 오른쪽 작업 폴더(지금 갈래).
- `../_최종본_보기`는 읽기 전용 사본이다. 그 안에서 고치거나 커밋하지 않는다. 지우지 않는다.
- 시안 작업 중에는 작업 폴더를 `sian-a`에 두어야 오른쪽이 시안 A를 보여 준다(2026-10-14부터는 시안A 폴더의 `비교보기.bat`을 쓴다). 시안 지시서를 끝내면 다시 만든 뒤 그대로 둔다(이다결 님이 비교 화면으로 본다).

## 자주 하는 작업
- 미리보기: `powershell -ExecutionPolicy Bypass -File serve.ps1` → http://localhost:4173/ (또는 `python -m http.server 4173`)
- 재생성: `node tools/build.js` 다음에 `node tools/build-en.js` (영어판)
- 저장: `git add <바뀐 파일> && git commit -m "메시지" && git push origin dev` → 공개 주소는 바뀌지 않는다. 공개본 반영은 위 "작업 방법 (39차)"의 합치는 순서대로, 이다결 님이 말할 때만 한다
- 검증: 재생성 후 모든 `<a href>`가 존재하는 파일을 가리키는지, `<img>`의 width/height 비율이 실제 파일과 같은지 확인한다.

## 도메인 확정 후 바꿀 것
`tools/build.js` 맨 위 `SITE_URL`, 그리고 재생성되는 `robots.txt`·`sitemap.xml`·`og:url`·`og:image`. 그리고 `PREVIEW`를 `false`로 바꾼다(36차).
