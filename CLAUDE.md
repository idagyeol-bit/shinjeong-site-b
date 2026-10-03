# 신정개발 홈페이지 — Claude Code 작업 규칙

이 폴더는 (주)신정개발 홈페이지(정적 사이트)의 원본입니다. 배포 주소: https://idagyeol-bit.github.io/shinjeong-site-b/

## 절대 규칙 (클라이언트 요구사항)
1. **사실만 쓴다.** 새 문장·수치·명칭은 `회사소개서(출력-240304-신정개발-카달로그.pdf)` 또는 `기술소개서(…Cleaning-시스템2025.pdf)`에 있는 내용만 쓴다. 자료에 없는 것은 "상담 시 안내"로 처리한다. 발주처 실명, 장비 모델·세대·성능 수치, 사진 속 장비의 세대는 확인 전까지 쓰지 않는다.
2. **사진은 클라이언트 사진 ZIP 3개(홈페이지 메인 / 홈페이지사진모음 / 로봇)에서만** 쓴다. PDF 안의 사진·로고·도표를 잘라 쓰지 않는다. 사진 편집은 크롭·축소·완만한 보정·번호판/얼굴 흐림까지만 하고 합성·요소 삭제는 하지 않는다.
   - **예외 (11차, 2026-10-02 이다결 님 결정):** `assets/photos/P01·P03·P06·P08·P10·P11` 6장(파일 12개)은 회사소개서·기술소개서 PDF의 작업 사진이다. 이 6장만 허용하며, 출처 쪽은 `tools/photo-plan.json`에 있다. 다시 만들거나 크기를 바꾸지 않는다. 그 밖의 PDF 사진은 여전히 쓰지 않는다.
3. 사진 설명(alt/캡션)은 사진에 보이는 것만 적는다. 특정 발주처나 실적의 증거처럼 쓰지 않는다.
4. 대표자명은 두 자료가 서로 달라(2024 김만식 / 2025 김영삼) 확인 전까지 표기하지 않는다.
   - **예외 (33차, 2026-10-03 이다결 님 결정):** 내려받기용 기술소개서 공개용 PDF(`assets/docs/shinjeong-robot-cleaning-system-2025-public.pdf`) 3쪽의 대표자 표기는 그대로 둔다. 사이트 본문(HTML)에는 여전히 대표자명을 쓰지 않는다.
5. **원본 소개서 PDF는 사이트에 올리지 않는다.** 내려받기용 파일은 `assets/docs/`의 공개용 두 개뿐이다(33차, 개인정보·발주처 실명이 있는 쪽을 뺀 판). 파일을 바꿀 때는 이다결 님이 준 공개용 파일만 쓴다.

## 구조
- `tools/build.js` 가 **원본**이다. 회사 정보(C), 사업분야(SERVICES), 기술(TECH/RECOVERY/PROCESS), 수행이력(PROJECTS), 사진 목록(PHOTOS), 신뢰 정보(CREDS), 장비(EQUIP), FAQ 를 여기서 고친 뒤 `node tools/build.js` 를 실행하면 13개 HTML + sitemap + robots 가 다시 생성된다.
- HTML 파일을 직접 고치면 다음 생성 때 덮어써진다. 반드시 build.js 를 고친다.
- 디자인 토큰(색·글자·여백)은 `css/tokens.css`, 구성 요소 스타일은 `css/site.css`.
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

## 자주 하는 작업
- 미리보기: `powershell -ExecutionPolicy Bypass -File serve.ps1` → http://localhost:4173/ (또는 `python -m http.server 4173`)
- 재생성: `node tools/build.js` 다음에 `node tools/build-en.js` (영어판)
- 배포: `git add -A && git commit -m "메시지" && git push origin main` → 1~2분 뒤 GitHub Pages 반영
- 검증: 재생성 후 모든 `<a href>`가 존재하는 파일을 가리키는지, `<img>`의 width/height 비율이 실제 파일과 같은지 확인한다.

## 도메인 확정 후 바꿀 것
`tools/build.js` 맨 위 `SITE_URL`, 그리고 재생성되는 `robots.txt`·`sitemap.xml`·`og:url`·`og:image`. 그리고 `PREVIEW`를 `false`로 바꾼다(36차).
