# 신정개발 홈페이지 — Claude Code 작업 규칙

이 폴더는 (주)신정개발 홈페이지(정적 사이트)의 원본입니다. 배포 주소: https://idagyeol-bit.github.io/shinjeong-site-b/

## 절대 규칙 (클라이언트 요구사항)
1. **사실만 쓴다.** 새 문장·수치·명칭은 `회사소개서(출력-240304-신정개발-카달로그.pdf)` 또는 `기술소개서(…Cleaning-시스템2025.pdf)`에 있는 내용만 쓴다. 자료에 없는 것은 "상담 시 안내"로 처리한다. 발주처 실명, 장비 모델·세대·성능 수치, 사진 속 장비의 세대는 확인 전까지 쓰지 않는다.
2. **사진은 클라이언트 사진 ZIP 3개(홈페이지 메인 / 홈페이지사진모음 / 로봇)에서만** 쓴다. PDF 안의 사진·로고·도표를 잘라 쓰지 않는다. 사진 편집은 크롭·축소·완만한 보정·번호판/얼굴 흐림까지만 하고 합성·요소 삭제는 하지 않는다.
3. 사진 설명(alt/캡션)은 사진에 보이는 것만 적는다. 특정 발주처나 실적의 증거처럼 쓰지 않는다.
4. 대표자명은 두 자료가 서로 달라(2024 김만식 / 2025 김영삼) 확인 전까지 표기하지 않는다.

## 구조
- `tools/build.js` 가 **원본**이다. 회사 정보(C), 사업분야(SERVICES), 기술(TECH/RECOVERY/PROCESS), 수행이력(PROJECTS), 사진 목록(PHOTOS), 신뢰 정보(CREDS), 장비(EQUIP), FAQ 를 여기서 고친 뒤 `node tools/build.js` 를 실행하면 13개 HTML + sitemap + robots 가 다시 생성된다.
- HTML 파일을 직접 고치면 다음 생성 때 덮어써진다. 반드시 build.js 를 고친다.
- 디자인 토큰(색·글자·여백)은 `css/tokens.css`, 구성 요소 스타일은 `css/site.css`.
- 사진: `assets/photos/<ID>-<가로폭>.jpg`. ID ↔ 원본 ZIP 파일 ↔ 크롭 좌표는 `tools/photo-plan.json`.
- 자세한 사용법은 `README.md`, 디자인 규칙은 `가이드_대기업사이트_분석과_적용원칙.md`.

## 자주 하는 작업
- 미리보기: `powershell -ExecutionPolicy Bypass -File serve.ps1` → http://localhost:4173/ (또는 `python -m http.server 4173`)
- 재생성: `node tools/build.js`
- 배포: `git add -A && git commit -m "메시지" && git push origin main` → 1~2분 뒤 GitHub Pages 반영
- 검증: 재생성 후 모든 `<a href>`가 존재하는 파일을 가리키는지, `<img>`의 width/height 비율이 실제 파일과 같은지 확인한다.

## 도메인 확정 후 바꿀 것
`tools/build.js` 맨 위 `SITE_URL`, 그리고 재생성되는 `robots.txt`·`sitemap.xml`·`og:url`·`og:image`.
