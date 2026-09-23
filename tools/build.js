/* ============================================================
   신정개발 홈페이지 — 정적 페이지 생성기
   node tools/build.js  →  루트에 HTML 파일들을 다시 만듭니다.
   헤더·푸터·배너를 한 곳에서 관리하므로 11개 페이지가 절대 어긋나지 않습니다.
   ※ 평소에는 생성된 HTML을 직접 고쳐도 됩니다. 공통 부분(헤더·푸터)을
     한 번에 바꾸고 싶을 때만 이 파일을 고치고 다시 실행하세요.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..');
const SITE_URL = 'https://idagyeol-bit.github.io/shinjeong-site-b/'; // 배포 주소가 정해지면 이 줄만 바꾸세요

/* ===================== 콘텐츠 데이터 =====================
   원본 js/data.js의 사실관계를 그대로 옮겼습니다.
   문구·기간·대상 설비를 고치려면 이 부분만 수정하세요. */
const C = {
  name: '(주)신정개발',
  brand: '신정개발',
  brandEn: 'SHINJEONG DEVELOPMENT',          // 기술소개서(2025) 로고 표기: Shinjeong Development Co.,Ltd.
  /* 심벌(assets/logo/shinjeong-symbol.svg)은 클라이언트 사진 ZIP의 차량 도장(로봇/517A5324.JPG)에서 추출·벡터화한 것. 색상은 5차 지시서 기준 #47A948(초록) / #29398A(남색) — 받은 이미지에서 뽑은 값, 공식 CI 값 확인 전. 정식 원본(AI/SVG) 수령 시 교체 */
  founded: 1992,
  address: '전라남도 여수시 봉계2길 27',      // 본사 — 회사소개서(2024)·기술소개서(2025) 공통
  branch: '충청남도 서산시 지곡면 충의로 1106', // 지사 — 기술소개서(2025) 마지막 장
  tel: '061-682-5537',                       // 대표 전화 — 회사소개서(2024)·기술소개서(2025) 공통
  fax: '061-683-5567',                       // 팩스 — 회사소개서(2024)·기술소개서(2025) 공통
  hours: '09:00 ~ 17:30',                    // 문의 가능 시간 — 기술소개서(2025)
  email: 'shinjeong@sjdevel.com',
  tagline: '산업설비·환경시설 클리닝',
  seoTitle: '신정개발 | 여수 산업설비 클리닝·준설 전문기업',
  seoDesc: '전남 여수 (주)신정개발 — 1992년부터 탱크·반응기·관로의 산업설비 클리닝, 촉매·충진물 작업, 화학세정, 준설·슬러지 회수, 관로 조사·보수를 해 온 전문기업입니다. 위험한 내부 작업에는 자체 개발 로봇을 투입합니다.', // 메인 검색·공유 설명과 JSON-LD description
  intro: '1992년 시작한 신정개발은 산업설비와 환경시설을 다루는 클리닝 전문기업입니다. 설비 유지보수, 촉매·충진물 작업, 준설과 시설 조사·보수의 경험을 바탕으로 현장의 작업 방법을 발전시켜 갑니다.',
  /* 연혁 — 회사소개서(2024.03) 6쪽 "연혁"을 그대로 옮겼습니다. 항목을 더하거나 뺄 때는 이 목록만 고치세요. */
  history: [
    { year: 2023, items: [{ m: '05', label: '신용등급 우수기업 인증 (신용등급 BBB-)' }] },
    { year: 2021, items: [{ m: '11', label: '표창장 — 산업통상자원부' }] },
    { year: 2020, items: [
      { m: '12', label: '기술혁신형 중소기업 인증 (INNOBIZ)' },
      { m: '11', label: '중소기업 경영혁신 공모전 우수상' },
      { m: '11', label: '지역사회 공헌 인정기업 승인' }
    ] },
    { year: 2018, items: [
      { m: '07', label: '서비스분야 안전보건활동 우수사례 대상' },
      { m: '07', label: '위험성평가 인증 — 산업안전보건공단' }
    ] },
    { year: 2017, items: [
      { m: '11', label: '기업부설연구소 설립' },
      { m: '07', label: '경영혁신형 중소기업 인증 (MAINBIZ)' },
      { m: '06', label: '전남형 강소기업 인증' },
      { m: '05', label: 'ISO 14001 인증' }
    ] },
    { year: 2016, items: [{ m: '05', label: 'KOSHA 18001 인증' }] },
    { year: 2015, items: [{ m: '09', label: '기계설비공사업 면허 취득' }] },
    { year: 2012, items: [{ m: '12', label: '자본금 3억 원 증자' }] },
    { year: 2009, items: [{ m: '03', label: '난방시공업 1종 면허 취득' }] },
    { year: 2007, items: [
      { m: '10', label: '환경부장관상 수상' },
      { m: '09', label: '법인 전환 — ㈜신정개발' }
    ] },
    { year: 2006, items: [{ m: '05', label: '지정폐기물 수집·운반 면허 취득' }] },
    { year: 2004, items: [{ m: '10', label: '일반폐기물 수집·운반 면허 취득' }] },
    { year: 2002, items: [{ m: '03', label: '상·하수도 설비시공업 면허 취득' }] },
    { year: 2000, items: [{ m: '04', label: '저수조청소업 등록' }] },
    { year: 1995, items: [{ m: '10', label: '상호 변경 — 신정개발' }] },
    { year: 1992, items: [{ m: '03', label: '신학상사 설립' }] }
  ]
};

/* ===================== 사진 목록 =====================
   전부 클라이언트가 보내 준 사진 ZIP 3개(홈페이지 메인 / 홈페이지사진모음 / 로봇)에서 골랐습니다.
   회사소개서·기술소개서 PDF 안의 사진은 쓰지 않습니다.
   M = 홈페이지 메인.zip, W = 홈페이지사진모음.zip, R = 로봇.zip (번호는 폴더 안 정렬 순서)
   설명(alt/cap)은 사진에 보이는 것만 적습니다. 모델명·세대·성능·발주처는 적지 않습니다. */
const PHOTOS = {
  /* 모든 사진은 3:2로 크롭했고, 크롭·번호판/얼굴 흐림 외의 합성은 없습니다. 원본 대응: tools/photo-plan.json */
  M02: { id: 'M02', w: 1200, h: 800, sizes: [720, 1200], alt: '신정개발 상호가 보이는 본사 건물과 차량', cap: '신정개발 상호가 보이는 본사 건물' },
  M04: { id: 'M04', w: 980, h: 653, sizes: [640, 980], alt: '해질녘 산업단지 전경', cap: '산업단지 전경' },
  M05: { id: 'M05', w: 1400, h: 933, sizes: [800, 1400], alt: '산업설비 현장에 설치된 안전 구획과 차량', cap: '산업설비 현장의 안전 구획과 차량' },
  M06: { id: 'M06', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '안전제일 표시가 있는 작업자의 안전모', cap: '작업자의 안전모' },
  M08: { id: 'M08', w: 1600, h: 1067, sizes: [960, 1600, 2400], alt: '산업설비 야간 전경' },
  M10: { id: 'M10', w: 1000, h: 667, sizes: [640, 1000, 1351], alt: '안전 구획을 설치한 산업설비 현장에 배치된 진공흡입차', cap: '안전 구획을 설치한 현장의 진공흡입차' },
  W01: { id: 'W01', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '산업설비 현장에 배치된 진공흡입차와 연결 호스', cap: '산업설비 현장의 진공흡입차와 연결 호스' },
  W03: { id: 'W03', w: 1000, h: 667, sizes: [640, 1000, 1496], alt: '맨홀에 호스를 넣어 작업하는 두 작업자', cap: '맨홀에 호스를 넣어 작업하는 두 작업자' },
  W04: { id: 'W04', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '도로 위 맨홀 교체 공사 현장에서 작업하는 작업자들', cap: '맨홀 교체 공사 현장' },
  W05: { id: 'W05', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '스크루 궤도형 흡입 로봇', cap: '스크루 궤도형 흡입 로봇' },
  W06: { id: 'W06', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '전면에 파쇄 장치를 갖춘 궤도형 장비와 흡입 호스', cap: '전면에 파쇄 장치를 갖춘 궤도형 장비' },
  W07: { id: 'W07', w: 1000, h: 667, sizes: [640, 1000, 1263], alt: '산업설비 현장에 배치된 신정개발 진공흡입차', cap: '산업설비 현장의 진공흡입차' },
  W09: { id: 'W09', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '산업설비 현장의 작업 차량과 보호구를 착용한 작업자들', cap: '산업설비 현장의 작업 차량과 작업자' },
  W10: { id: 'W10', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '진공흡입차 옆에서 맨홀에 호스를 연결해 작업하는 작업자들', cap: '진공흡입차와 맨홀 호스 작업' },
  R01: { id: 'R01', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '차고에 정렬된 신정개발 차량 두 대와 로봇 장비들', cap: '차고의 차량과 로봇 장비' },
  R07: { id: 'R07', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '차량에 설치된 모니터·제어 장치 앞에 선 조작자', cap: '차량의 모니터·제어 장치와 조작자' },
  R10: { id: 'R10', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '전면에 작업 헤드를 갖춘 주황색 궤도형 장비', cap: '전면 작업 헤드를 갖춘 궤도형 장비' },
  R13: { id: 'R13', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '소형 주행 장비, 흡입 헤드 유닛, 유압 호스 묶음', cap: '소형 주행 장비와 흡입 헤드, 호스' },
  R15: { id: 'R15', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '본사 앞에 세워 둔 스키드 로더와 소형 굴삭기', cap: '스키드 로더와 소형 굴삭기' },
  R20: { id: 'R20', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '작업 장치를 장착한 스키드 로더', cap: '스키드 로더' },
  R25: { id: 'R25', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '본사 앞에서 제어 차량과 호스로 연결된 궤도형 장비', cap: '본사 앞 — 제어 차량과 호스로 연결된 궤도형 장비' },
  R27: { id: 'R27', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '야외에서 흡입차와 호스로 연결된 궤도형 장비', cap: '흡입차와 호스로 연결된 궤도형 장비' },
  R34: { id: 'R34', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '차량에 실린 제어 장치를 다루는 작업자와 발밑의 소형 주행 장비', cap: '차량의 제어 장치와 소형 주행 장비' },
  R42: { id: 'R42', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '카메라 헤드와 바퀴를 갖춘 소형 주행 장비', cap: '카메라 헤드를 갖춘 소형 주행 장비' }
};
const P = (id) => PHOTOS[id];

const SERVICES = [
  {
    id: 'S01', file: 'service-equipment-cleaning.html', icon: 'tank', title: '설비 클리닝', en: 'EQUIPMENT CLEANING',
    summary: '탱크와 Pond, 배수로 등 산업설비의 잔류물과 퇴적물을 다루는 클리닝 작업.',
    short: '탱크·Pond부터 배수로·R.T.O까지, 설비 안의 잔류물을 걷어냅니다',
    card: '탱크·Pond·배수로·R.T.O 내부의 잔류물과 퇴적물을 제거합니다.',
    body: '탱크·Pond 내부 클리닝, 공장 배수로, R.T.O 유지보수·클리닝, Filter Press 세정과 Bag Filter 교체까지 수행합니다. 필요한 현장에는 로봇을 먼저 투입해 작업자가 위험 물질에 노출되는 시간을 줄입니다.',
    desc: '탱크·Pond 내부 클리닝, 공장 배수로, R.T.O 유지보수·클리닝, Filter Press 세정과 Bag Filter 교체까지 수행합니다. 전남 여수 (주)신정개발.', // 검색 설명: 도입 문단 첫 문장(80자 미만이면 둘째 문장까지) + 지역·회사명, 80~120자
    equip: ['진공흡입차', '흡입 로봇', '제어 차량'], // 한눈에 보기 표의 '주요 장비'
    targets: ['Tank', 'Pond', '공장 내부 배수로', 'R.T.O', 'Filter Press 세정', 'Bag Filter 교체'],
    topTargets: ['Tank', 'Pond', '공장 내부 배수로'],
    inquiryHint: ['대상 설비', '작업 목적', '알고 있는 크기·구조·잔류물 정보'],
    projects: ['P02'], tech: true,
    photo: Object.assign({}, P('W01'), { note: '산업설비 현장에 배치된 흡입차와 연결 호스의 모습입니다.' }),
    gallery: { ids: ['W07', 'W09', 'R25'], titles: ['진공흡입차', '현장의 작업 차량과 작업자', '제어 차량과 궤도형 장비의 연결'],
      lead: '설비 클리닝에 쓰는 진공흡입차와 호스, 그리고 로봇을 호스로 연결한 구성을 사진으로 보여 드립니다.' }
  },
  {
    id: 'S02', file: 'service-catalyst-media.html', icon: 'reactor', title: '촉매·충진물 작업', en: 'EQUIPMENT CLEANING · CATALYST',
    summary: '반응기와 관련 설비의 촉매·충진물 제거 및 교체 작업.',
    short: '반응기 안의 촉매·충진물을 로봇으로 꺼내고 교체합니다',
    card: '반응기의 촉매·충진물을 제거하고 교체합니다.',
    body: 'Reactor·Tank 내부의 촉매·충진물을 제거하고 교체합니다. 질소 분위기와 방폭 지역 조건에 맞춘 장비를 운용하고, 흡입·분리·원격 모니터링 시스템을 함께 구성합니다.',
    desc: 'Reactor·Tank 내부의 촉매·충진물을 제거하고 교체합니다. 질소 분위기와 방폭 지역 조건에 맞춘 장비를 운용하고, 흡입·분리·원격 모니터링 시스템을 함께 구성합니다. 전남 여수 (주)신정개발.', // 검색 설명: 도입 문단 첫 문장(80자 미만이면 둘째 문장까지) + 지역·회사명, 80~120자
    equip: ['흡입 로봇', '흡입차', '분리장치', '제어 차량'], // 한눈에 보기 표의 '주요 장비'
    targets: ['촉매 제거·교체', '충진물 제거·교체', '하역·충진 관련 작업의 범위 상담'],
    topTargets: ['촉매 제거·교체', '충진물 제거·교체', '하역·충진 범위 상담'],
    inquiryHint: ['설비 종류', '충진물 특성', '요청 범위', '희망 일정'],
    projects: ['P01'], tech: true,
    concept: [
      { icon: 'suction', label: '흡입', text: '촉매·충진물을 호스로 흡입해 회수하는 역할' },
      { icon: 'separate', label: '분리', text: '회수한 물질을 작업에 맞게 분리하는 역할' },
      { icon: 'monitor', label: '원격 모니터링', text: '설비 밖에서 작업 상황을 확인하는 역할' }
    ],
    photo: Object.assign({}, P('W05'), {
      note: '전면 스크루와 궤도를 갖춘 장비의 외형입니다.' }),
    gallery: { ids: ['R10', 'R13', 'R01'], titles: ['전면 작업 헤드를 갖춘 궤도형 장비', '소형 주행 장비와 흡입 헤드', '차량과 로봇 장비'],
      lead: '회사소개서의 촉매 처리 작업 구성(Robot · Vacuum Car · Separator · Control Car)에 쓰이는 장비의 외형과 차량 구성입니다.' }
  },
  {
    id: 'S03', file: 'service-chemical-cleaning.html', icon: 'pipe', title: '화학세정', en: 'CHEMICAL CLEANING',
    summary: '배관·열교환기·냉각탑 계통과 보일러 등 산업설비의 세정 업무.',
    short: '배관부터 보일러 튜브까지, 설비 계통별로 세정합니다',
    card: '배관·열교환기·냉각탑·보일러를 세정합니다.',
    body: '배관류, 열교환기, 냉각탑 계통과 보일러 튜브를 세정합니다. 화학세정용 내산장비(50HP/20HP)를 보유하고 있으며, 정기보수 기간에 APH·열교환기 튜브 Cleaning을 수행했습니다.',
    desc: '배관류, 열교환기, 냉각탑 계통과 보일러 튜브를 세정합니다. 화학세정용 내산장비(50HP/20HP)를 보유하고 있으며, 정기보수 기간에 APH·열교환기 튜브 Cleaning을 수행했습니다. 전남 여수 (주)신정개발.', // 검색 설명: 도입 문단 첫 문장(80자 미만이면 둘째 문장까지) + 지역·회사명, 80~120자
    equip: ['화학세정용 내산장비(50HP/20HP)'], // 한눈에 보기 표의 '주요 장비'
    targets: ['Plant 배관', '열교환기', 'Cooling Tower 계통', '보일러 Tube 내·외부 관련 세정'],
    topTargets: ['Plant 배관', '열교환기', 'Cooling Tower 계통'],
    inquiryHint: ['대상 설비', '오염 상태', '세정 목적', '가능한 작업 기간'],
    projects: ['P05'], tech: false,
    photo: Object.assign({}, P('M10'), { note: '안전 구획을 설치하고 차량을 배치한 산업설비 현장의 모습입니다.' })
  },
  {
    id: 'S04', file: 'service-dredging-sludge.html', icon: 'manhole', title: '준설·슬러지 회수', en: 'SEWER CLEANING · DREDGING',
    summary: '하수·오수관과 처리시설의 퇴적물 준설 및 슬러지 회수 작업.',
    short: '하수관로부터 폐수처리장까지, 퇴적물을 준설하고 슬러지를 회수합니다',
    card: '하수·오수관과 처리시설의 퇴적물을 준설하고 슬러지를 회수합니다.',
    body: '하수도 퇴적물, 하수처리시설, 오수관, 폐수처리장 슬러지를 다룹니다. 무인준설로봇으로 회수하고, 데칸타·필터프레스로 탈수해 처리량을 줄입니다.',
    desc: '하수도 퇴적물, 하수처리시설, 오수관, 폐수처리장 슬러지를 다룹니다. 무인준설로봇으로 회수하고, 데칸타·필터프레스로 탈수해 처리량을 줄입니다. 전남 여수 (주)신정개발.', // 검색 설명: 도입 문단 첫 문장(80자 미만이면 둘째 문장까지) + 지역·회사명, 80~120자
    equip: ['무인준설로봇(파쇄형·흡입형)', '무인로더', '스키드 로더', '소형 굴삭기', '데칸타'], // 한눈에 보기 표의 '주요 장비'
    targets: ['하수도 퇴적물', '하수처리시설', '오수관', '폐수처리장 슬러지'],
    topTargets: ['하수도 퇴적물', '오수관', '폐수처리장 슬러지'],
    inquiryHint: ['시설 종류', '대상 물질', '현장 상태', '희망 작업 시기'],
    projects: ['P03', 'P06'], tech: true, recovery: true,
    photo: Object.assign({}, P('W10'), { note: '맨홀 주변에서 호스를 다루는 작업 장면입니다.' }),
    gallery: { ids: ['W03', 'W06', 'R15'], titles: ['맨홀 호스 작업', '파쇄 장치를 갖춘 궤도형 장비', '스키드 로더와 소형 굴삭기'],
      lead: '무인준설로봇(파쇄형·흡입형), 무인로더, 스키드 로더, 소형 굴삭기 등 준설 장비를 보유하고 있습니다.' }
  },
  {
    id: 'S05', file: 'service-inspection-repair.html', icon: 'scan', title: '관로·지하 조사 및 보수', en: 'CCTV · GPR · REPAIR',
    summary: '관로 CCTV와 GPR 조사, 비굴착 보수 등 시설 상태 확인과 보수 업무.',
    short: '관로 속은 CCTV로, 땅속은 GPR로 확인하고 보수합니다',
    card: '관로 CCTV·GPR로 조사하고, 비굴착으로 보수합니다.',
    body: '관로 내부 CCTV 조사, 지하매설물 GPR 조사, 비굴착 보수를 수행합니다. CCTV 조사차량(D=250~600mm)과 관로 CCTV 로봇을 보유하고 있으며, 하수관거 CCTV 조사를 1년간(2022.01~2022.12) 수행했습니다.',
    desc: '관로 내부 CCTV 조사, 지하매설물 GPR 조사, 비굴착 보수를 수행합니다. CCTV 조사차량(D=250~600mm)과 관로 CCTV 로봇을 보유하고 있습니다. 전남 여수 (주)신정개발.', // 검색 설명: 도입 문단 첫 문장(80자 미만이면 둘째 문장까지) + 지역·회사명, 80~120자
    equip: ['CCTV 조사차량(D=250~600mm)', '관로 CCTV 로봇', '스키드 로더'], // 한눈에 보기 표의 '주요 장비'
    targets: ['관로 CCTV 조사', '지하매설물 GPR 조사', '비굴착 보수'],
    topTargets: ['관로 CCTV 조사', '지하매설물 GPR 조사', '비굴착 보수'],
    inquiryHint: ['대상 구간', '조사·보수 목적', '보유 자료', '희망 일정'],
    projects: ['P04'], tech: false,
    photo: Object.assign({}, P('W04'), { note: '도로 위 맨홀 주변에서 진행한 맨홀 교체 공사의 현장 장면입니다.' }),
    gallery: { ids: ['R42', 'R34', 'R20'], titles: ['카메라 헤드를 갖춘 소형 주행 장비', '차량의 제어 장치와 소형 주행 장비', '스키드 로더'],
      lead: 'CCTV 조사차량, 관로 CCTV 로봇, 맨홀 보수 작업용 스키드 로더를 보유하고 있습니다.' },
    rows: [
      { icon: 'cctv', label: '관로 CCTV 조사', text: '관로 내부를 대상으로 하는 CCTV 조사 업무입니다.' },
      { icon: 'gpr', label: '지하매설물 GPR 조사', text: '지하매설물을 대상으로 하는 GPR 조사 업무입니다.' },
      { icon: 'repair', label: '비굴착 보수', text: '굴착 없이 진행하는 관로 보수 관련 업무입니다.' }
    ]
  }
];

const TECH = {
  title: '현장 조건에 맞춰 적용하는 로봇 클리닝',
  body: '작업자가 들어가기 전에 로봇이 위험 물질을 먼저 제거하고, 작업자는 설비 밖 제어 차량에서 CCTV로 내부를 보며 조작합니다. 방폭 지역용 장비(유압 구동 · 방폭 카메라 · Non-spark 재질)로 Reactor·Tank 내부의 질소 분위기 작업까지 수행합니다. 적용 범위는 설비 구조와 잔류물 조건을 확인해 정합니다.',
  followUp: '작업 범위에 따라 로봇 작업 이후 필요한 후속·마무리 작업을 진행합니다.',
  system: [
    { icon: 'robot', label: '로봇', text: '설비 내부에서 작업을 수행합니다.' },
    { icon: 'monitor', label: '모니터링·제어', text: '설비 밖에서 작업 상황을 확인하고 조작합니다.' },
    { icon: 'truck', label: '흡입차', text: '호스로 연결해 회수물을 흡입합니다.' },
    { icon: 'separate', label: '분리장치', text: '해당 작업에 필요한 경우 회수물을 분리합니다.' }
  ],
  conditions: [
    { label: '출입구·이동 경로', text: '장비가 드나들 출입구의 크기와 내부 이동 경로' },
    { label: '내부 코일·장애물', text: '설비 내부의 코일과 구조물 등 장애 요소' },
    { label: '잔류물 성상', text: '잔류물의 상태와 특성' },
    { label: '온도', text: '설비 내부와 잔류물의 온도 조건' },
    { label: '호스 간섭', text: '장비 이동 중 호스가 걸리거나 얽히는 구간' }
  ],
  flow: ['현장 검토', '장비 구성', '로봇 작업', '필요한 후속 작업', '회수물 관리'],
  flowNote: '세부 진행은 현장과 업무에 맞춰 조정합니다.'
};

const RECOVERY = {
  title: '회수한 물질의 다음 과정까지 살펴봅니다',
  body: '클리닝과 준설 이후에는 회수물의 특성에 맞는 후속 관리가 필요합니다. 원심분리 방식의 데칸타와 압착·여과 방식의 필터프레스 등 고액분리·탈수 과정을 살펴보고, 현장 조건에 맞는 적용과 처리 연계 범위를 상담할 수 있습니다.',
  steps: [
    { label: '회수물 특성', text: '클리닝과 준설로 회수한 물질의 특성을 먼저 확인합니다.' },
    { label: '탈수·고액분리 검토', text: '회수물에 맞는 고액분리·탈수 방식을 정합니다.' },
    { label: '처리 연계 범위', text: '현장 조건에 맞는 적용과 처리 연계 범위를 상담합니다.' }
  ],
  methods: [
    { label: '데칸타', text: '원심분리를 이용한 고액분리' },
    { label: '필터프레스', text: '여과·압착을 이용한 탈수' }
  ]
};


/* ===================== 현장 진행 방식 (기술소개서 2025 기준) ===================== */
const PROCESS = {
  /* 기술소개서 p.17 '무인 Cleaning System' + p.19 'Robot-Tank Cleaning System' 절차를 순서대로 옮김 */
  steps: [
    { k: 'STEP 01', t: '현장 검토·사전 Test', d: '현장 적용 가능성을 검토하고 사전 Test를 실시합니다. 출입구·내부 구조·잔류물 성상·온도를 확인합니다.', photo: 'M05', src: '기술소개서 p.17·19' },
    { k: 'STEP 02', t: 'System 설치', d: '제어 차량과 흡입차를 배치하고 로봇을 호스로 연결합니다. CCTV와 원격 조정 장치를 설치합니다.', photo: 'R25', src: '기술소개서 p.18·20' },
    { k: 'STEP 03', t: '1차 Washing', d: '흡입차(Vacuum Car)를 이용해 설비 외부에서 잔여 물질을 먼저 제거합니다.', photo: 'W07', src: '기술소개서 p.19' },
    { k: 'STEP 04', t: '로봇 투입 · 내부 Cleaning', d: '로봇을 투입해 내부 잔여 위험 물질을 1차 회수하고, 전면부 Jet Nozzle로 내부를 세척합니다(2차 Washing).', photo: 'W06', src: '기술소개서 p.19' },
    { k: 'STEP 05', t: '원격 모니터링', d: '작업자는 설비 밖 제어 차량에서 CCTV로 내부를 보며 로봇을 조작합니다.', photo: 'R07', src: '기술소개서 p.18·20' },
    { k: 'STEP 06', t: 'Final Cleaning', d: '위험 물질이 줄어든 뒤 작업자가 투입되어 내부 최종 잔여물을 제거합니다.', photo: 'W03', src: '기술소개서 p.19' },
    { k: 'STEP 07', t: '회수물·폐기물 처리', d: '회수물은 데칸타·필터프레스로 탈수해 폐기물량을 줄이고 처리 기간을 단축합니다.', icon: 'filter', src: '기술소개서 p.19·31' }
  ],
  /* p.4 개발 배경 — 출처를 그대로 표기 */
  facts: [
    { n: '200회', l: '연간 밀폐공간 작업' },
    { n: '800명', l: '연간 밀폐공간 투입 인원' },
    { n: '1,200시간', l: '연간 밀폐공간 작업시간' }
  ],
  factsNote: '고용노동부 산업재해조사(2014~2023)에 따르면 밀폐공간 질식 재해자 100명 중 50명이 사망했고, 설비 관련 사고의 23.7%가 청소 작업 중 일어났습니다. 신정개발의 로봇 시스템은 이 위험을 줄이기 위해 개발했습니다.',
  factsSrc: '기술소개서(2025) 인용',
  /* p.23 위험성 비교 */
  risk: [
    { r: '유독가스에 의한 질식', m: '위험물질 사전 제거' },
    { r: '고위험 물질 접촉', m: '위험물질 사전 제거' },
    { r: '공기 공급 중단에 의한 질식', m: '작업자 안전 확보' },
    { r: '줄 걸림에 의한 넘어짐', m: '내부 작업시간 최소화' },
    { r: '협소 공간에 따른 근골격 부상', m: '협소공간 대체 투입' }
  ],
  /* p.24 효율성 비교 */
  eff: [
    { r: '일반 작업 허가서로 진행', m: '준비시간 감소' },
    { r: '1시간 이상 연속 작업', m: '유효 작업시간 확보' },
    { r: 'Jet · 흡입 동시 작업', m: '작업 효율 증가' },
    { r: 'CCTV 내부 감시', m: '실시간 내부 확인' },
    { r: '위험구역(방폭·가스) 긴급 작업', m: '위험지역 내 즉시 투입' }
  ],
  /* p.9~12 용도별 적용 예시 — 장점·유의점·적용 범위 */
  cases: [
    { t: 'Tank / Pond Cleaning', pros: ['질식·매몰·협착·넘어짐 등 인명사고 위험 감소', '조작자 교대·장비 연속 가동으로 연속 작업'], cons: ['유해성 감소 후 Final Cleaning 인력 작업 필요'], scope: ['방폭지역(고위험가스 설비) 작업 — 유압 구동, 궤도부 고무 재질, 파쇄·접촉부 Non-spark 재질', '수중 작업 및 Water Jet-Cleaning 동시 작업', 'CCTV·Jet 등 추가 장비 장착'] },
    { t: 'Pond Cleaning (로더)', pros: ['연속 작업 가능', '신체·근골격계·넘어짐 위험에서 작업자 안전 확보'], cons: ['배터리 교체·충전에 따른 작업 시간 제한', '비방폭 지역 사용'], scope: ['Open Ditch · Pond 하부 퇴적물 처리', '작동 설비 하부 퇴적물 처리', '오염 지역 진입로 확보', '인력 작업이 힘든 고착 Sludge 제거'] },
    { t: 'Jet Cleaning', pros: ['연속 작업 가능', '협소 공간 무인 작업'], cons: ['복잡한 내부 공간에서는 간섭·부분 Cleaning', '세정수 비산에 따른 시야 저하 — CCTV 연동으로 확보'], scope: ['협소 공간 Water Jet Cleaning', '오염지역 무인 방제(유해물질 제거)', '협소 공간 Inspection'] },
    { t: '폐기물(충진물) 제거 작업', pros: ['질식 위험·위험물질 노출에서 작업자 안전 확보', '질소 공간 무인 작업'], cons: ['비산물에 따른 시야 저하 — CCTV 연동으로 확보', 'Manway 한계: 최소 18인치'], scope: ['Reactor / Tank 내부(질소 분위기 포함) 충진물 제거', '방폭 지역 작업', '기타 설비 Sludge 및 고형 폐기물 제거'] }
  ],
  /* p.32 · p.35 회수물 탈수 절차 */
  decanter: ['원액 투입', '세정수 투입', '원심분리', 'Cake 배출', '분리액 배출'],
  filterpress: ['원액 투입', '여과판 압착', '여과액 배출', 'Cake 탈거', '여과판 세척'],
  dewaterEffect: ['폐기물 처리량 감량', '폐기물 처리비용 감소', '폐기물 처리시간 단축'],
  /* p.7~8 로봇 세대·기타 장비 */
  generations: [
    { g: '1세대', d: '흡입형 · Pond, Tank(관로) · 수중 작업 가능 · 유압 구동' },
    { g: '2세대', d: '파쇄 흡입형 · Pond, Open Ditch · 수중 작업 불가 · 전기·유압 구동' },
    { g: '3세대', d: '파쇄 흡입형 · Pond, Tank · 수중 작업 가능 · 유압 구동' },
    { g: '4세대', d: '흡입형 · Pond, Tank · 수중 작업 가능 · 유압 구동 · 소형화' },
    { g: '5세대', d: '파쇄형 · Pond, Reactor · 수중 작업 가능 · 유압 구동 · 소형화' }
  ],
  gen5: ['방폭 지역 작업 조건 적용 — 방폭 카메라로 원격 감시, 알루미늄 본체, 비철(Non-steel) 스크류, 유압 구동', '전면부 Jet Nozzle 장착', '원격 조종', '스크류형·체인형 바퀴로 유동체 위 작업', 'Tank·Reactor 내부의 액체·슬러지 제거'],
  others: ['무인 로더(大·小) — 원격 조종, 토사·Sludge(실외·협소 공간), 전기·유압 구동', '무인 Jet Cleaner — 원격 조종, 설비 고압 세척(8+ Nozzle), 구동부 수중 작업 가능, 전기 구동']
};

/* ===================== 회사 신뢰 정보 (회사소개서 2024 기준) ===================== */
const CREDS = {
  licenses: ['상·하수도설비공사업', '난방시공업 제1종', '기계설비공사업'],
  permits: ['일반폐기물 수집·운반업 허가', '지정폐기물 수집·운반업 허가', '저수조청소업 등록'],
  certs: ['ISO 9001:2015 (품질경영)', 'ISO 14001:2015 (환경경영)', 'KOSHA-MS 안전보건경영시스템 인증', '위험성평가 인정 (산업안전보건공단)', '기업부설연구소 인정', '벤처기업 확인', 'INNOBIZ 기술혁신형 중소기업', 'MAINBIZ 경영혁신형 중소기업', '전남형 강소기업'],
  awards: ['환경부장관상 (2007)', '서비스분야 안전보건활동 우수사례 대상 (2018)', '중소기업 경영혁신 공모전 우수상 (2020)', '지역사회 공헌 인정기업 (2020)', '산업통상자원부 표창 (2021)', '신용등급 우수기업 인증 (2023)'],
  patents: '등록 특허 8건 · 출원 4건 (회사소개서 수록). 대표 특허: 정합식 맨홀(2017), 관내부 무인 준설 처리 시스템(2017), 스크류 바퀴를 구비한 수륙양용 준설로봇(2020), 소형관로 준설로봇 및 그 운전방법(2020), 워터젯 유닛을 구비한 세정로봇 장치(2020)',
  teams: ['경영지원팀', '안전 · 공무', '기업부설연구소', 'C&M 1팀 · 2팀', 'C&S 1팀 · 2팀', 'SAP팀'],
  quals: ['산업안전기사 · 산업안전산업기사 · 위험물산업기사', '토목기사 · 토목 중급/초급기술자 · 기계 중급기술자', '가스시설시공관리자 · 난방시공업 인정기능사', '용접기능사 · 특수용접기능사 · 설비보전기능사', '화학분석기능사 · 건설재료시험기능사 · 전기기능사', '굴삭기운전기능사 · 지게차운전기능사 · 건설기계조종사']
};

/* ===================== 보유 장비 구성 (회사소개서 p.21~24, 수량은 상담 시 안내) ===================== */
const EQUIP = [
  { g: '흡입 · 운반 차량', d: '진공흡입차(습식 7.5/12㎥ · 건식 12㎥), 고압 살수차, 카고크레인, 지게차' },
  { g: '고압 세척', d: '고압 JET-CLEANER 1,000bar, 소형 JET-CLEANER 200~400bar, 온수·스팀 JET-CLEANER, 고압세척유닛' },
  { g: '촉매 · 충진물 작업', d: 'AUTO SEPARATOR(5㎥/3㎥), 원형·다단 선별기, 집진기, 백필터 집진기' },
  { g: '무인 로봇 · 준설', d: '무인준설로봇(파쇄형·흡입형), 박스무인준설로봇, 무인로더, 무인궤도로더, 스키드 로더, 미니 포크레인, 소형 굴삭기, 유압 트래시 펌프, 오수 배수 펌프' },
  { g: '관로 조사', d: 'CCTV 조사차량(D=250~600mm), 관로 CCTV 로봇, 탈취제거 SYSTEM' },
  { g: '화학세정 · 탈수', d: '화학세정용 내산장비(50HP/20HP), 데칸타(슬러지 탈수용), HYDRONIC PUMP' }
];

const FAQ = [
  { q: '로봇이 모든 작업을 진행하나요?', a: '설비와 작업 조건에 따라 적용 범위가 달라집니다. 작업 범위에 따라 로봇 작업 이후 필요한 후속·마무리 작업을 진행합니다.' },
  { q: '어떤 정보를 보내면 상담에 도움이 되나요?', a: '대상 설비, 작업 목적, 현장 상태와 희망 일정을 알려 주세요. 크기·구조·사진·도면 등 알고 계신 정보를 함께 정리하면 검토에 도움이 됩니다.' },
  { q: '우리 설비에 적용할 수 있는지 바로 알 수 있나요?', a: '출입구와 내부 구조, 잔류물 특성 등 현장 조건을 확인해야 합니다. 관련 정보를 바탕으로 적용 범위를 검토합니다.' },
  { q: '회수한 슬러지의 후속 과정도 상담할 수 있나요?', a: '회수물의 특성과 현장 조건에 따른 탈수·분리 및 처리 연계 범위를 함께 문의할 수 있습니다.' },
  { q: '밀폐공간 작업에서 로봇 투입이 왜 더 안전한가요?', a: '작업자가 들어가기 전에 로봇이 위험 물질을 먼저 제거하고, 작업자는 설비 밖 제어 차량에서 CCTV로 내부를 확인하며 조작합니다. 유독가스 질식, 고위험 물질 접촉, 협소 공간 부상 같은 위험에 노출되는 시간이 줄어듭니다.' },
  { q: '방폭 지역이나 질소 분위기의 설비에도 적용할 수 있나요?', a: '기술소개서 기준으로 방폭 지역 작업 조건에 맞춘 장비(유압 구동, 방폭 카메라, Non-spark 재질)를 운용하며, Reactor·Tank 내부의 질소 분위기 충진물 제거 작업도 적용 범위에 포함됩니다.' }
];

const PROJECTS = [
  { id: 'P01', title: '반응기 로봇 촉매 Unloading', period: '2023.02~2023.04', cat: '촉매·충진물', robot: 'stated', summary: '반응기 촉매 Unloading 작업에 로봇을 적용한 이력입니다.', svc: 'S02' },
  { id: 'P02', title: '설비 내부 Cleaning', period: '2023.06', cat: '설비 클리닝', robot: 'stated', summary: '설비 내부 Cleaning 작업에 로봇을 적용한 이력입니다.', svc: 'S01' },
  { id: 'P03', title: '폐수처리장 유량조정조 슬러지 준설', period: '2023.09~2023.11', cat: '준설·슬러지', robot: 'stated', summary: '폐수처리장 유량조정조의 슬러지를 준설한 이력입니다.', svc: 'S04' },
  { id: 'P04', title: '하수관거 CCTV 조사', period: '2022.01~2022.12', cat: '관로·지하 조사', robot: 'na', summary: '하수관거를 대상으로 CCTV 조사를 수행한 이력입니다.', svc: 'S05' },
  /* P05 분류: 회사소개서 9쪽 사업분야 표에서 열교환기(HEATER EXCHANGERS)·보일러 TUBE는 "화학세정" 항목에 속하므로 그 기준을 따랐습니다.
     (원본 실적표에는 세정 방식이 적혀 있지 않으므로 발주처 확인 후 '설비 클리닝'으로 바꿀 수 있습니다.) */
  { id: 'P05', title: '정기보수 APH·열교환기 튜브 Cleaning', period: '2022.05~2022.06', cat: '화학세정', robot: 'unknown', summary: '정기보수 기간에 APH와 열교환기 튜브의 Cleaning을 수행한 이력입니다.', svc: 'S03' },
  { id: 'P06', title: '공정 내 배수로 슬러지 준설', period: '2023.07', cat: '준설·슬러지', robot: 'unknown', summary: '공정 내 배수로의 슬러지를 준설한 이력입니다.', svc: 'S04' }
];
/* 필터 분류는 사업분야 5개와 1:1로 맞춥니다. (예전의 '설비 세정'은 사업분야에 없는 여섯 번째 분류였음) */
const PROJECT_CATS = ['설비 클리닝', '촉매·충진물', '화학세정', '준설·슬러지', '관로·지하 조사'];
/* 메인 신뢰 숫자 띠 — 200회: 기술소개서(2025) p.4 · 170여 건: 회사소개서(2024) 2020~2023 실적표
   · 등록 특허 8건, ISO 9001 · 14001 · KOSHA-MS: 회사소개서(2024) (CREDS 참고) */
const TRUST = [
  { n: 200, unit: '회', l: '연간 밀폐공간 작업' },
  { n: 170, unit: '여 건', l: '수행 실적 (2020~2023)' },
  { n: 8, unit: '건', l: '등록 특허' },
  { t: 'ISO 9001 · 14001 · KOSHA-MS', l: '품질·환경·안전보건 인증' }
];
const TRUST_SRC = '회사소개서(2024) · 기술소개서(2025)';

/* 수행 이력 요약 띠 — 회사소개서(2024) 2020~2023 실적표 */
const PROJECT_SUMMARY = {
  n: 170, unit: '여 건', l: '2020~2023년 수행 실적 (회사소개서 2024)',
  sectors: ['석유화학·정유·산업가스 플랜트', '발전 설비', '지자체·공공기관 상·하수도', '건설 현장']
};
/* 이력이 10건을 넘을 때만 분야 탭·로봇 적용 체크·검색창을 보여 준다 */
const SHOW_FILTERS = PROJECTS.length > 10;

const FEATURED = ['P01', 'P02', 'P04'];

/* 메인 첫 화면 제목 — 하는 일 다섯 가지. 표시 글자만 여기서 정하고, 연결 주소는 SERVICES에서 가져온다.
   br: true 인 항목 뒤에서 PC 줄을 나눈다(휴대폰에서는 자연 줄바꿈). */
const HERO_SERVICES = [
  { svc: 'S01', label: '탱크 클리닝' },
  { svc: 'S02', label: '촉매 교체' },
  { svc: 'S03', label: '화학세정', br: true },
  { svc: 'S04', label: '준설' },
  { svc: 'S05', label: '관로 조사' }
];

/* 업무 카드의 설비 칩 — 방문자가 쓰는 설비 이름(한국어 우선). 칩마다 그 카드의 분야 페이지로 연결한다.
   4차 '설비로 찾기' 데이터를 옮겨 쓴 것이고, 이름은 모두 분야 상세의 대상 설비에 있는 것이다. */
const CARD_CHIPS = {
  S01: ['탱크', 'Pond', '공장 배수로', 'R.T.O', 'Filter Press', 'Bag Filter'],
  S02: ['반응기 촉매', '충진물'],
  S03: ['배관', '열교환기', '냉각탑', '보일러 튜브'],
  S04: ['하수관', '오수관', '하수·폐수처리시설 슬러지'],
  S05: ['관로 CCTV 조사', '지하매설물 GPR 조사', '비굴착 보수']
};



/* ===================== 도우미 ===================== */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const svc = (id) => SERVICES.find((s) => s.id === id);
const prj = (id) => PROJECTS.find((p) => p.id === id);

/* 선 아이콘 (24×24, 현재 글자색을 따라감) */
const ICONS = {
  tank: '<path d="M5 8.5c0-1.6 3.1-2.5 7-2.5s7 .9 7 2.5v9c0 1.6-3.1 2.5-7 2.5s-7-.9-7-2.5z"/><path d="M5 8.5c0 1.6 3.1 2.5 7 2.5s7-.9 7-2.5"/><path d="M12 3v3"/><path d="M8.5 16.5h7"/>',
  reactor: '<rect x="6" y="4" width="12" height="16" rx="3"/><path d="M6 9h12"/><circle cx="10" cy="13.5" r="1.1"/><circle cx="14" cy="16" r="1.1"/><circle cx="14.2" cy="12" r="1.1"/><path d="M9.5 1.8v2.2M14.5 1.8v2.2"/>',
  pipe: '<path d="M3 7h7a3 3 0 0 1 3 3v4a3 3 0 0 0 3 3h5"/><rect x="2" y="4.6" width="2.6" height="4.8" rx="1"/><rect x="19.4" y="14.6" width="2.6" height="4.8" rx="1"/><path d="M9 4.8v4.4M15.5 12.4v4.4"/>',
  manhole: '<ellipse cx="12" cy="17.5" rx="7.5" ry="3.5"/><path d="M4.5 17.5c0-1.9 3.4-3.5 7.5-3.5"/><path d="M12 14V8.5a3 3 0 0 1 3-3h2.5"/><path d="M17.5 3.5h3.5v4h-3.5z"/>',
  scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/><circle cx="12" cy="12" r="3.2"/><path d="M12 6.3v2.5M12 15.2v2.5"/>',
  robot: '<rect x="4" y="8" width="16" height="10" rx="2.5"/><path d="M12 4.5V8"/><circle cx="12" cy="3.4" r="1.4"/><circle cx="9" cy="12.6" r="1.2"/><circle cx="15" cy="12.6" r="1.2"/><path d="M2 12v3M22 12v3"/>',
  monitor: '<rect x="2.5" y="4.5" width="19" height="12" rx="2"/><path d="M9 20.5h6M12 16.5v4"/><path d="M6.5 9.5l2.5 3 2.5-4 2.5 3 2.5-2"/>',
  truck: '<path d="M2.5 16V7.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V16"/><path d="M13.5 10h3.4a2 2 0 0 1 1.7 1l2.2 3.4a2 2 0 0 1 .2.9V16"/><circle cx="7" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/><path d="M9 17.5h6.5M2.5 17.5H5"/>',
  suction: '<path d="M3 18c0-5 3-8 7-8 3.2 0 5 1.8 5 4.2 0 1.9-1.3 3.3-3 3.3-1.4 0-2.4-.9-2.4-2.1 0-1 .7-1.7 1.6-1.7"/><path d="M15 14.2h6"/><path d="M19 11.5l2.6 2.7-2.6 2.7"/>',
  separate: '<path d="M12 3v5"/><path d="M12 8 6 13.5v5.5M12 8l6 5.5V19"/><circle cx="6" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M8.5 5.5h7"/>',
  cctv: '<path d="M3 9.5 16.5 6l1.6 4.6L4.6 14.1z"/><path d="M6.5 14v3a2 2 0 0 0 2 2h1"/><path d="M18.1 10.6 21 9.8"/><circle cx="12" cy="20" r="1.5"/>',
  gpr: '<path d="M3 15h18"/><path d="M12 3a6 6 0 0 1 6 6M12 6.5a2.5 2.5 0 0 1 2.5 2.5"/><circle cx="12" cy="18.5" r="1.4"/><path d="M6 19h2.5M15.5 19H18"/>',
  repair: '<path d="M14.5 6.5a3.8 3.8 0 0 0 5 5l-8 8a2.1 2.1 0 0 1-3-3z"/><path d="M4 4.5 8 8.5"/><path d="M3.2 8.8 7 5"/>',
  drop: '<path d="M12 3.5c3.5 4.2 5.5 7 5.5 9.5A5.5 5.5 0 0 1 12 18.5 5.5 5.5 0 0 1 6.5 13c0-2.5 2-5.3 5.5-9.5z"/><path d="M9.5 13.2a2.6 2.6 0 0 0 2.6 2.6"/>',
  filter: '<path d="M3.5 5h17l-6.5 7.5V20l-4-2.2v-5.3z"/>',
  link: '<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  arrow: '<path d="M5 12h13M13 6.5l5.5 5.5L13 17.5"/>',
  up: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  down: '<path d="M12 5v13M6.5 12.5 12 18l5.5-5.5"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>'
};
const icon = (n, size = 24, cls = '') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${ICONS[n] || ''}</svg>`;

const arrow = (s = 18) => icon('arrow', s);
const upArrow = (s = 15) => icon('up', s);

/* 사진 태그 (여러 크기를 준비해 필요한 것만 내려받게 한다) */
function photo(p, sizesAttr, eager) {
  if (!p) return '';
  const srcset = p.sizes.map((w) => `assets/photos/${p.id}-${w}.jpg ${w}w`).join(', ');
  const fallback = `assets/photos/${p.id}-${p.sizes[p.sizes.length - 1]}.jpg`;
  return `<img src="${fallback}" srcset="${srcset}" sizes="${sizesAttr}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}"${eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"'}>`;
}

/* ===================== 공통 뼈대 ===================== */
const NAV = [
  { href: 'services.html', label: '사업분야', key: 'services' },
  { href: 'projects.html', label: '수행 이력', key: 'projects' },
  { href: 'process.html', label: '현장 진행 방식', key: 'process' },
  { href: 'technology.html', label: '장비·로봇', key: 'technology' },
  { href: 'company.html', label: '회사 소개', key: 'company' }
];

function head(o) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#0e2e4a">
<link rel="canonical" href="${SITE_URL}${o.file === 'index.html' ? '' : o.file}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(C.brand)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${SITE_URL}${o.file === 'index.html' ? '' : o.file}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${SITE_URL}assets/photos/M08-1600.jpg">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="1067">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/logo/shinjeong-symbol.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/logo/shinjeong-symbol.png">
<link rel="preload" href="assets/fonts/sub/PretendardVariable-0.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/site.css">
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>\n` : ''}</head>
<body data-page="${o.page}">
<a class="skip-link" href="#main">본문 바로가기</a>
`;
}

/* activeSvc: 분야 상세 페이지에서 하위 메뉴의 현재 분야를 표시하기 위한 id (S01-S05) */
function header(page, activeSvc) {
  const cur = (id) => (id === activeSvc ? ' class="is-current"' : '');
  /* PC 하위 메뉴 패널 — 업무 이름·한 줄 설명·링크는 SERVICES에서 가져온다 */
  const svcPanel = `
        <div class="gnb__drop">
          <div class="gnb__box">
            <ul>
${SERVICES.map((s) => `              <li><a href="${s.file}"${cur(s.id)}><b>${esc(s.title)}</b><span>${esc(s.card)}</span></a></li>`).join('\n')}
            </ul>
            <a class="gnb__all" href="services.html">사업분야 전체 보기 ${arrow(14)}</a>
          </div>
        </div>`;
  const nav = NAV.map((n) => {
    const a = `<a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`;
    return n.key === 'services'
      ? `      <div class="gnb__item" data-sub>\n        ${a}${svcPanel}\n      </div>`
      : `      ${a}`;
  }).join('\n');
  const dnav = NAV.concat([{ href: 'contact.html', label: '현장 문의', key: 'contact' }])
    .map((n, i) => {
      const a = `    <a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${esc(n.label)}<span>0${i + 1}</span></a>`;
      return n.key === 'services'
        ? a + `\n    <div class="drawer__sub">\n${SERVICES.map((s) => `      <a href="${s.file}"${cur(s.id)}>${esc(s.title)}</a>`).join('\n')}\n    </div>`
        : a;
    }).join('\n');

  return `<header class="hdr">
  <a class="hdr__brand" href="index.html" aria-label="${esc(C.name)} 홈">
    <img class="hdr__logo" src="assets/logo/shinjeong-symbol.svg" width="36" height="44" alt="" aria-hidden="true">
    <span class="hdr__brandtext"><b>${esc(C.name)}</b><span aria-hidden="true">${esc(C.brandEn)}</span></span>
  </a>
  <nav class="gnb" aria-label="주요 메뉴">
${nav}
  </nav>
  <div class="hdr__act">
    <a class="hdr__cta" href="contact.html"${page === 'contact' ? ' aria-current="page"' : ''}>현장 문의 ${upArrow(14)}</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="메뉴 열기"><i></i><i></i><i></i></button>
  </div>
</header>

<div class="drawer" id="drawer" aria-hidden="true">
  <nav aria-label="전체 메뉴">
${dnav}
  </nav>
  <div class="drawer__foot">
    ${esc(C.name)} · ${esc(C.tagline)} 전문기업 · ${C.founded}년부터<br>
    ${esc(C.address)}<br>
    <a href="tel:${C.tel.replace(/-/g, '')}">${C.tel}</a><br>
    <a href="mailto:${C.email}">${C.email}</a>
  </div>
</div>
`;
}

function phero(o) {
  return `  <section class="phero">
    <div class="phero__grid" aria-hidden="true"></div>
    <div class="wrap">
      <h1>${o.h1}</h1>
      ${o.keepLead ? `<p class="phero__lead">${esc(o.keepLead)}</p>` : ''}
    </div>
  </section>

  <nav class="crumb" aria-label="현재 위치">
    <div class="wrap">
      <ol>
        <li><a href="index.html">홈</a></li>
${o.crumbs.map((c) => c.href
    ? `        <li><a href="${c.href}">${esc(c.label)}</a></li>`
    : `        <li><span aria-current="page">${esc(c.label)}</span></li>`).join('\n')}
      </ol>
    </div>
  </nav>
`;
}

function tabs(activeId) {
  return `  <nav class="tabs" aria-label="사업분야 메뉴">
    <div class="wrap tabs__in">
      <a href="services.html">전체</a>
${SERVICES.map((s) => `      <a href="${s.file}"${s.id === activeId ? ' aria-current="page"' : ''}>${esc(s.title)}</a>`).join('\n')}
    </div>
  </nav>
`;
}

function cta(o) {
  const t = o || {};
  return `  <section class="cta">
    <div class="wrap">
      <h2 data-reveal>${t.h2 || '검토가 필요한 현장을<br>알려 주세요'}</h2>
      <p data-reveal data-delay="80">${esc(t.p || '대상 설비와 작업 목적, 희망 일정을 보내 주시면 가능한 작업 범위와 진행 방법을 안내해 드립니다.')}</p>
      <div class="cta__act" data-reveal data-delay="160">
        <a class="btn btn--ghost" href="contact.html">현장 문의하기 ${arrow(18)}</a>
        <a class="btn btn--ghost" href="mailto:${C.email}">${C.email}</a>
      </div>
    </div>
  </section>
`;
}

function footer() {
  const map = [
    { h: '사업분야', items: SERVICES.map((s) => ({ href: s.file, label: s.title })) },
    { h: '기술', items: [{ href: 'process.html', label: '현장 진행 방식' }, { href: 'technology.html', label: '장비·로봇' }, { href: 'technology.html#recovery', label: '회수 이후의 과정' }] },
    { h: '회사', items: [{ href: 'projects.html', label: '수행 이력' }, { href: 'company.html', label: '회사 소개' }] },
    { h: '문의', items: [{ href: 'contact.html', label: '현장 문의' }, { href: `mailto:${C.email}`, label: '이메일로 문의' }] }
  ];
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr__top">
      <div class="ftr__brand">
        <img class="ftr__logo" src="assets/logo/shinjeong-symbol.svg" width="30" height="37" alt="" aria-hidden="true">
        <b>${esc(C.name)}</b><span aria-hidden="true">${esc(C.brandEn)}</span>
        <p class="ftr__info">
          ${esc(C.name)} · ${esc(C.tagline)} 전문기업 · ${C.founded}년부터<br>
          본사 ${esc(C.address)}<br>
          지사 ${esc(C.branch)}<br>
          TEL <a href="tel:${C.tel.replace(/-/g, '')}">${C.tel}</a> · FAX ${C.fax}<br>
          <a href="mailto:${C.email}">${C.email}</a>
        </p>
      </div>
      <nav class="ftr__map" aria-label="사이트맵">
${map.map((g) => `        <div>
          <h4>${esc(g.h)}</h4>
          <ul>
${g.items.map((i) => `            <li><a href="${i.href}">${esc(i.label)}</a></li>`).join('\n')}
          </ul>
        </div>`).join('\n')}
      </nav>
    </div>
    <p class="ftr__note">사이트의 사진은 모두 신정개발이 제공한 현장·장비 사진입니다.</p>
    <div class="ftr__bot">
      <p>&copy; <span data-year>2026</span> ${esc(C.name)}. All rights reserved.</p>
      <button class="totop" type="button" data-totop>맨 위로 ${icon('up', 13)}</button>
    </div>
  </div>
</footer>

<nav class="mcta" aria-label="빠른 문의">
  <a class="mcta__tel" href="tel:${C.tel.replace(/-/g, '')}">전화 문의</a>
  <a class="mcta__go" href="contact.html">현장 문의 ${arrow(17)}</a>
</nav>
`;
}

/* 문의 띠(.cta)까지 본문(main)에 포함한 뒤 닫는다 */
/* 현장 진행 방식·장비·로봇·회사 소개 본문 맨 아래에 넣는 출처 한 줄 */
const SRC_LINE = '      <p class="note mt-block">출처: (주)신정개발 회사소개서(2024) · 기술소개서(2025)</p>\n';

/* 업무 카드 바로 아래 한 줄 — 어느 업무인지 모를 때 (메인·사업분야 공통) */
const SVC_HELP = '      <p class="svc-help mt-28" data-reveal>어느 업무인지 모르시면 → <a href="contact.html">현장 문의</a></p>';


const MAIN_END = '</main>\n\n';

function foot(extraJs) {
  return `<script src="js/site.js"></script>
${(extraJs || []).map((f) => `<script src="js/${f}"></script>`).join('\n')}${extraJs && extraJs.length ? '\n' : ''}</body>
</html>
`;
}


/* ===================== 도식 (자체 제작, 회사 자료의 구성을 선으로만 표현) ===================== */
/* 회수물 탈수 절차 — 기술소개서 p.32(데칸타) · p.35(필터프레스) */
const DEWATER_NOTE = '처리량·함수율 등 사양은 대상 물질의 응집 상태에 따라 달라지므로 상담 시 안내합니다.';
function dewaterDiagram() {
  const col = (title, sub, steps) => `          <div class="panel panel--line">
            <h3>${esc(title)}</h3>
            <p class="note mt-6">${esc(sub)}</p>
            <ol class="steps steps--tight mt-18">
${steps.map((st, i) => `              <li><em>${i + 1}</em><b>${esc(st)}</b></li>`).join('\n')}
            </ol>
          </div>`;
  return `          <div class="grid grid--2">
${col('데칸타 (Screw Decanter)', '원심분리를 이용한 고액분리', PROCESS.decanter)}
${col('필터프레스 (Filter-Press)', '여과·압착을 이용한 탈수', PROCESS.filterpress)}
          </div>
          <p class="note mt-14">${esc(DEWATER_NOTE)}</p>`;
}

/* 현장 배치 도식 — 회사소개서 p.33 · 기술소개서 p.18·20의 구성(Control Car · CCTV · Robot · Vacuum Car · Separator) */
function siteDiagram() {
  return `      <div class="diagram" data-reveal>
        <svg viewBox="0 0 980 340" role="img" aria-label="현장 배치 도식: 설비 밖 제어 차량에서 CCTV로 보며 설비 안의 로봇을 원격 조정하고, 로봇은 호스로 흡입차·분리장치와 연결됩니다" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink)">
          <!-- 설비(탱크) -->
          <rect x="380" y="52" width="220" height="228" rx="26"/>
          <path d="M380 92h220M380 240h220" stroke-dasharray="4 6" style="color:var(--muted)"/>
          <text x="490" y="40" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" stroke="none">설비 (Tank · Reactor · Pond)</text>
          <!-- 로봇 -->
          <g transform="translate(445 186)">
            <rect x="0" y="0" width="90" height="34" rx="6" style="color:var(--brand)"/>
            <rect x="-6" y="34" width="102" height="12" rx="6" style="color:var(--brand)"/>
            <circle cx="10" cy="40" r="3" style="color:var(--brand)"/><circle cx="45" cy="40" r="3" style="color:var(--brand)"/><circle cx="80" cy="40" r="3" style="color:var(--brand)"/>
            <path d="M0 10h-22a8 8 0 0 0-8 8v6" style="color:var(--brand)"/>
            <text x="45" y="-8" text-anchor="middle" font-size="12" font-weight="700" fill="var(--brand)" stroke="none">Robot</text>
          </g>
          <!-- CCTV -->
          <g transform="translate(400 108)">
            <path d="M0 0h26l8 8-8 8H0z"/><circle cx="40" cy="8" r="3"/>
            <text x="-8" y="-10" font-size="11" fill="var(--muted)" stroke="none">CCTV</text>
          </g>
          <!-- 제어 차량 -->
          <g transform="translate(60 150)">
            <rect x="0" y="0" width="190" height="90" rx="10"/>
            <rect x="18" y="18" width="70" height="44" rx="4"/><path d="M28 36l10 10 12-16 10 12 12-8" style="color:var(--brand)"/>
            <circle cx="40" cy="104" r="12"/><circle cx="150" cy="104" r="12"/>
            <text x="95" y="-14" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" stroke="none">Control Car (제어 차량)</text>
            <text x="140" y="50" text-anchor="middle" font-size="11" fill="var(--muted)" stroke="none">원격 조정 · 모니터</text>
          </g>
          <!-- 제어 신호선 -->
          <path d="M250 195C300 195 330 195 380 195" stroke-dasharray="6 6" style="color:var(--brand)"/>
          <text x="315" y="184" text-anchor="middle" font-size="11" fill="var(--brand)" stroke="none">원격 조정 · CCTV 신호</text>
          <!-- 흡입차 -->
          <g transform="translate(680 150)">
            <rect x="0" y="0" width="150" height="90" rx="10"/><rect x="150" y="34" width="60" height="56" rx="8"/>
            <ellipse cx="75" cy="40" rx="55" ry="26"/>
            <circle cx="40" cy="104" r="12"/><circle cx="120" cy="104" r="12"/><circle cx="185" cy="104" r="12"/>
            <text x="105" y="-14" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" stroke="none">Vacuum Car (흡입차)</text>
          </g>
          <!-- 호스 -->
          <path d="M600 220C640 220 650 195 680 195" stroke-width="5" style="color:var(--brand)"/>
          <text x="640" y="248" text-anchor="middle" font-size="11" fill="var(--brand)" stroke="none">호스</text>
          <!-- 분리장치 -->
          <g transform="translate(860 40)">
            <rect x="0" y="0" width="90" height="70" rx="8"/><path d="M10 20h70M10 36h70M10 52h70" style="color:var(--muted)"/>
            <text x="45" y="-12" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" stroke="none">Separator</text>
            <text x="45" y="92" text-anchor="middle" font-size="11" fill="var(--muted)" stroke="none">분리장치 (필요 시)</text>
          </g>
          <path d="M840 150C840 120 870 120 880 110" stroke-dasharray="4 6" style="color:var(--muted)"/>
          <!-- 지면 -->
          <path d="M40 300h900" style="color:var(--line)"/>
          <text x="40" y="326" font-size="11" fill="var(--muted)" stroke="none">작업자는 설비 밖에서 조작 · 로봇만 설비 안으로 들어갑니다</text>
        </svg>
        <p class="diagram__note">실제 배치는 현장 조건에 맞춰 정합니다.</p>
      </div>`;
}

/* 비교표 — 기술소개서 p.23·24 (인원 투입 ↔ Robot 투입) */
function cmpTable(rows, head, humanLabel, robotLabel) {
  return `      <table class="cmp" data-reveal>
        <thead><tr><th>${esc(head)}</th><th>인원 투입 작업</th><th>로봇 투입 작업</th><th>비고</th></tr></thead>
        <tbody>
${rows.map((r) => `          <tr><td>${esc(r.r)}</td><td data-h="인원 투입"><span class="no">${esc(humanLabel)}</span></td><td data-h="로봇 투입"><span class="yes">${esc(robotLabel)}</span></td><td data-h="비고">${esc(r.m)}</td></tr>`).join('\n')}
        </tbody>
      </table>`;
}

/* ===================== 공통 블록 ===================== */
/* chips: true 이면(메인·사업분야) 카드 전체 링크 대신 제목·설비 칩·"자세히 보기"만 링크로 두고, 위쪽 번호는 뺀다 */
function serviceCards(reveal, chips) {
  if (chips) {
    return SERVICES.map((s, i) => `      <article class="scard scard--chips"${reveal ? ` data-reveal data-delay="${i * 70}"` : ''}>
        <span class="scard__ico">${icon(s.icon, 40)}</span>
        <h3><a href="${s.file}">${esc(s.title)}</a></h3>
        <p>${esc(s.card)}</p>
        <ul class="scard__chips" aria-label="${esc(s.title)} 대상 설비">${CARD_CHIPS[s.id].map((c) => `<li><a href="${s.file}">${esc(c)}</a></li>`).join('')}</ul>
        <a class="scard__go" href="${s.file}">자세히 보기 ${arrow(14)}</a>
      </article>`).join('\n');
  }
  return SERVICES.map((s, i) => `      <a class="scard" href="${s.file}"${reveal ? ` data-reveal data-delay="${i * 70}"` : ''}>
        <span class="scard__no">0${i + 1}</span>
        <span class="scard__ico">${icon(s.icon, 40)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.card)}</p>
        <span class="scard__tags">${s.topTargets.map((t) => `<span>${esc(t)}</span>`).join('')}</span>
        <span class="scard__go">자세히 보기 ${arrow(14)}</span>
      </a>`).join('\n');
}

/* 사진 카드 묶음 (3열). titles[i]가 있으면 굵은 제목으로, 없으면 사진 설명을 제목으로 쓴다 */
function pcards(ids, titles, sizesAttr) {
  const sz = sizesAttr || '(max-width:720px) 92vw, 420px';
  return ids.map((id, i) => {
    const p = P(id);
    const t = titles && titles[i] ? titles[i] : p.cap;
    return `        <figure class="pcard" data-reveal${i ? ` data-delay="${i * 80}"` : ''}>
          <div class="pcard__fig">${photo(p, sz)}</div>
          <figcaption><b>${esc(t)}</b></figcaption>
        </figure>`;
  }).join('\n');
}

function recRow(p, withSummary) {
  const chip = p.robot === 'stated' ? ' <span class="chip">로봇 적용</span>' : '';
  return `        <li class="rec__row" data-cat="${esc(p.cat)}" data-robot="${p.robot}" data-search="${esc(p.title + ' ' + p.cat + ' ' + p.summary)}">
          <span class="rec__date">${esc(p.period)}</span>
          <span class="rec__name">${esc(p.title)}${chip}</span>
          <span class="rec__cat">${esc(p.cat)}</span>
          ${withSummary
    ? `<a class="rec__go" href="${svc(p.svc).file}" aria-label="${esc(svc(p.svc).title)} 업무 보기">${upArrow(13)}</a>`
    : `<a class="rec__go" href="projects.html">이력 보기 ${upArrow(13)}</a>`}
        </li>`;
}

function faqBlock() {
  return `      <div class="faq" data-reveal>
${FAQ.map((f, i) => `        <details${i === 0 ? ' open' : ''}>
          <summary>${esc(f.q)}<i aria-hidden="true"></i></summary>
          <p class="faq__a">${esc(f.a)}</p>
        </details>`).join('\n')}
      </div>`;
}

/* ===================== 페이지 ===================== */
const pages = {};

/* ---------- 1. 메인 ---------- */
pages['index.html'] = () => {
  const heroPhoto = { id: 'M08', w: 1600, h: 1067, sizes: [960, 1600, 2400], alt: '산업설비 야간 전경' };
  const feat = FEATURED.map(prj);

  return head({
    file: 'index.html', page: 'home',
    title: C.seoTitle,
    desc: C.seoDesc,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: C.name, alternateName: C.brandEn, foundingDate: String(C.founded),
      url: SITE_URL, email: C.email, telephone: '+82-' + C.tel.replace(/^0/, ''), faxNumber: '+82-' + C.fax.replace(/^0/, ''),
      address: { '@type': 'PostalAddress', addressCountry: 'KR', addressRegion: '전라남도', addressLocality: '여수시', streetAddress: '봉계2길 27' },
      description: C.seoDesc
    }
  }) + header('home') + `
<main id="main">

  <!-- ===== 히어로 ===== -->
  <section class="hero">
    <div class="hero__media">${photo(heroPhoto, '100vw', true)}</div>
    <div class="wrap hero__inner">
      <span class="eyebrow">여수 · ${C.founded}년 설립</span>
      <h1 class="hero__svc" aria-label="${esc(HERO_SERVICES.map((h) => h.label).join(', '))}">${HERO_SERVICES.map((h, i) =>
        /* 가운뎃점을 앞 이름과 한 덩어리(줄바꿈 금지)로 묶어 줄 맨 앞에 오지 않게 한다 */
        `<span class="hero__svcitem"><a href="${svc(h.svc).file}">${esc(h.label)}</a>${i < HERO_SERVICES.length - 1 ? `<span class="hero__dot${h.br ? ' hero__dot--brk' : ''}" aria-hidden="true"> ·</span>` : ''}</span>${h.br ? '<br class="hero__br">' : ''}`
      ).join(' ')}</h1>
      <p class="hero__lead hero__lead--strong">산업설비 클리닝 전문기업, 신정개발</p>
      <div class="hero__act">
        <a class="btn btn--light" href="services.html">사업분야 보기 ${arrow(18)}</a>
        <a class="btn btn--ghost" href="contact.html">현장 문의 ${arrow(18)}</a>
      </div>
    </div>
  </section>

  <!-- ===== 신뢰 숫자 ===== -->
  <section class="section section--sm trust" aria-label="숫자로 보는 신정개발">
    <div class="wrap">
      <div class="stats" data-reveal>
${TRUST.map((t) => t.t
    ? `        <div class="stat stat--text"><b>${t.t.split(' · ').map(esc).join('&nbsp;· ')}</b><span>${esc(t.l)}</span></div>`
    : `        <div class="stat"><b><span data-count="${t.n}">${t.n}</span><i>${esc(t.unit)}</i></b><span>${esc(t.l)}</span></div>`).join('\n')}
      </div>
      <p class="note mt-14" data-reveal><b class="ink">주요 현장</b> — 석유화학·정유 플랜트 · 발전 설비 · 상·하수도</p>
      <p class="note mt-6" data-reveal>${esc(TRUST_SRC)}</p>
    </div>
  </section>

  <!-- ===== 사업분야 ===== -->
  <section class="section" id="what">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>사업분야</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="services.html">사업분야 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="grid grid--5">
${serviceCards(true, true)}
      </div>
${SVC_HELP}

    </div>
  </section>

  <!-- ===== 수행 이력 ===== -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>주요 수행 이력</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="projects.html">수행 이력 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <ul class="rec" data-reveal>
${feat.map((p) => recRow(p, true)).join('\n')}
      </ul>
    </div>
  </section>

  <!-- ===== 작업 방식 (다크) ===== -->
  <section class="section section--navy">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>설비 안의 작업을,<br>설비 밖에서 지켜봅니다</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="technology.html">장비·로봇 자세히 보기 ${upArrow(14)}</a>
          <a class="tlink ml-16" href="process.html">현장 진행 방식 보기 ${upArrow(14)}</a>
        </div>
      </div>

      <div class="split split--top" data-reveal>
        <figure class="split__media">
          <div class="split__fig">${photo(P('R27'), '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">연결 구성 · ${esc(P('R27').cap)}</figcaption>
        </figure>
        <div class="roles">
${TECH.system.map((r) => `          <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
        </div>
      </div>
    </div>
  </section>

  <!-- ===== 현장의 장면 ===== -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>현장의 장면</h2>
        </div>
      </div>
      <div class="grid grid--3">
${pcards(['W10', 'W05', 'R07', 'W07', 'W06', 'R01'], ['맨홀 호스 작업', '스크루 궤도형 장비', '모니터와 조작자', '진공흡입차', '파쇄 장치를 갖춘 장비', '차량과 로봇 장비'])}
      </div>
    </div>
  </section>

  <!-- ===== 회사 소개 ===== -->
  <section class="section">
    <div class="wrap">
      <div class="split">
        <div data-reveal>
          <h2>${C.founded}년부터<br>쌓아 온 현장 경험</h2>
          <p class="lead mt-20">${esc(C.intro)}</p>
          <div class="mt-28"><a class="btn btn--line" href="company.html">회사 소개 ${arrow(18)}</a></div>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo(P('M02'), '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">${esc(P('M02').cap)}</figcaption>
        </figure>
      </div>

      <div class="stats mt-block" data-reveal>
        <div class="stat"><b><span data-count="${C.founded}">${C.founded}</span></b><span>설립</span></div>
        <div class="stat"><b><span data-count="2007">2007</span></b><span>법인 전환</span></div>
        <div class="stat"><b><span data-count="2017">2017</span></b><span>기업부설연구소 설립</span></div>
        <div class="stat"><b><span data-count="5">5</span><i>개 분야</i></b><span>다루는 업무</span></div>
      </div>
    </div>
  </section>

` + cta() + MAIN_END + footer() + foot();
};

/* ---------- 2. 사업분야 ---------- */
pages['services.html'] = () => head({
  file: 'services.html', page: 'services',
  title: `사업분야 | ${C.brand}`,
  desc: '설비 클리닝, 촉매·충진물 작업, 화학세정, 준설·슬러지 회수, 관로·지하 조사 및 보수 — 신정개발이 다루는 다섯 가지 업무를 소개합니다.'
}) + header('services') + `
<main id="main">
` + phero({
  h1: '사업분야',
  crumbs: [{ label: '사업분야' }]
}) + tabs(null) + `
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>다섯 가지 업무</h2>
        </div>
      </div>
      <div class="grid grid--3">
${serviceCards(true, true)}
      </div>
${SVC_HELP}
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <h2>업무와 함께 살펴볼<br>작업 시스템</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="technology.html">장비·로봇 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="roles" data-reveal>
${TECH.system.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>

` + cta({
  h2: '어떤 업무에 해당하는지<br>모르셔도 괜찮습니다',
  p: '대상 설비와 작업 목적을 알려 주시면 맞는 업무와 진행 방법을 안내해 드립니다.'
}) + MAIN_END + footer() + foot();

/* ---------- 3. 사업분야 상세 5개 ---------- */
SERVICES.forEach((s, idx) => {
  pages[s.file] = () => {
    const rel = s.projects.map(prj).filter(Boolean);
    const prev = SERVICES[idx - 1];
    const next = SERVICES[idx + 1];

    /* 섹션 배경을 흰색 ↔ 옅은 회색으로 번갈아 쓴다 (같은 배경이 연달아 나오지 않게) */
    let lastSoft = false;                       // 첫 섹션은 흰색
    const sec = (extra) => { lastSoft = !lastSoft; return `section${lastSoft ? ' section--soft' : ''}${extra ? ' ' + extra : ''}`; };
    const sections = [];

    /* 한눈에 보기 — 사진 1장 + 4줄 표. 표 내용은 모두 분야 데이터(targets·equip·projects·inquiryHint)에서 가져온다 */
    const links = [];
    if (s.concept) links.push(`<a class="tlink" href="technology.html">작업 시스템 자세히 보기 ${arrow(14)}</a>`);   // 촉매: '작업 시스템의 역할' 섹션 대신
    else if (s.tech) links.push(`<a class="tlink" href="technology.html">장비·로봇 보기 ${upArrow(14)}</a>`);     // 관련 기술
    if (s.recovery) links.push(`<a class="tlink" href="process.html#dewater">탈수 과정 자세히 보기 ${arrow(14)}</a>`); // 준설: '회수 이후의 과정' 섹션 대신
    sections.push(`  <section class="section">
    <div class="wrap">
      <div class="head head--solo" data-reveal><div><h2>${esc(s.short)}</h2></div></div>
      <div class="split split--top glance">
        <figure class="split__media" data-reveal>
          <div class="split__fig">${photo(s.photo, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">${esc(s.photo.cap)}</figcaption>
        </figure>
        <div data-reveal data-delay="90">
          <dl class="glance__tbl">
            <div><dt>대상 설비</dt><dd>${s.targets.map(esc).join(' · ')}</dd></div>
            <div><dt>주요 장비</dt><dd>${s.equip.map(esc).join(' · ')}</dd></div>
            <div><dt>관련 이력</dt><dd>${rel.length ? rel.map((p) => `${esc(p.title)} (${esc(p.period)})`).join(' · ') : '이 홈페이지의 수행 이력에는 이 업무로 분류된 항목이 없습니다.'}</dd></div>
            <div><dt>문의 시 필요한 정보</dt><dd>${s.inquiryHint.map(esc).join(' · ')}</dd></div>
          </dl>
${links.length ? `          <p class="glance__links mt-18">${links.join('')}</p>\n` : ''}          <div class="mt-24"><a class="btn btn--fill" href="contact.html?service=${s.id}">이 업무로 문의하기 ${arrow(18)}</a></div>
        </div>
      </div>
    </div>
  </section>
`);

    /* 업무 구성(S05) */
    if (s.rows) {
      sections.push(`  <section class="${sec()}">
    <div class="wrap">
      <div class="head head--solo" data-reveal><div><h2>업무 구성</h2></div></div>
      <div class="roles" data-reveal>
${s.rows.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>
`);
    }

    /* 장비·현장 사진 묶음 (사진 ZIP에서 고른 3장) */
    if (s.gallery) {
      sections.push(`  <section class="${sec()}">
    <div class="wrap">
      <div class="head head--solo" data-reveal><div><h2>장비와 현장</h2></div></div>
      <div class="grid grid--3">
${pcards(s.gallery.ids, s.gallery.titles)}
      </div>
    </div>
  </section>
`);
    }

    /* 이전·다음 분야 — 마지막 섹션 끝에 붙인다 */
    const pnav = `
      <nav class="head pnav" aria-label="다른 사업분야">
        <div>${prev ? `<a class="tlink" href="${prev.file}">${icon('arrow', 14)} 이전 · ${esc(prev.title)}</a>` : `<a class="tlink" href="services.html">${icon('arrow', 14)} 사업분야 전체</a>`}</div>
        <div class="head__aside pnav__next">${next ? `<a class="tlink" href="${next.file}">다음 · ${esc(next.title)} ${arrow(14)}</a>` : `<a class="tlink" href="services.html">사업분야 전체 ${arrow(14)}</a>`}</div>
      </nav>
`;
    const last = sections.length - 1;
    sections[last] = sections[last].replace(/    <\/div>\n  <\/section>\n$/, pnav + '    </div>\n  </section>\n');
    const body = sections.join('');

    return head({
      file: s.file, page: 'services',
      title: `${s.title} | 여수 산업설비 클리닝 ${C.brand}`,
      desc: s.desc,
      jsonld: {
        '@context': 'https://schema.org', '@type': 'Service',
        name: s.title, description: s.summary,
        provider: { '@type': 'Organization', name: C.name, url: SITE_URL }
      }
    }) + header('services', s.id) + `
<main id="main">
` + phero({
      h1: esc(s.title),
      crumbs: [{ label: '사업분야', href: 'services.html' }, { label: s.title }]
    }) + tabs(s.id) + '\n' + body + `
` + cta({
      h2: `${esc(s.title)},<br>어디까지 가능한지 물어보세요`,
      p: s.inquiryHint.join(' · ') + ' 등을 알려 주시면 가능한 작업 범위와 진행 방법을 안내해 드립니다.'
    }) + MAIN_END + footer() + foot();
  };
});

/* ---------- 4. 장비·로봇 (technology.html) ---------- */
pages['technology.html'] = () => head({
  file: 'technology.html', page: 'technology',
  title: `장비·로봇 | ${C.brand}`,
  desc: TECH.body
}) + header('technology') + `
<main id="main">
` + phero({
  h1: '장비·로봇',
  crumbs: [{ label: '장비·로봇' }]
}) + `
  <!-- 01 보유 장비 (차량·장비 사진 + 용도별 장비 목록) -->
  <section class="section" id="equipment">
    <div class="wrap">
      <div class="head head--solo" data-reveal><div><h2>보유 장비</h2></div></div>
      <div class="grid grid--3">
${pcards(['R01', 'R25', 'R10', 'R13', 'R20', 'R42'], ['차량과 로봇 장비', '제어 차량과 궤도형 장비의 연결', '전면 작업 헤드를 갖춘 궤도형 장비', '소형 주행 장비와 흡입 헤드', '스키드 로더', '카메라 헤드를 갖춘 소형 주행 장비'])}
      </div>
      <div class="eqgrid mt-block" data-reveal>
${EQUIP.map((e) => `        <div><b>${esc(e.g)}</b><ul class="chips">${e.d.split(', ').map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('\n')}
      </div>
      <p class="note mt-14">보유 수량과 가동 상태는 문의 시 안내합니다.</p>
    </div>
  </section>


  <!-- 02 자체 개발 · 세대별 발전 · 5세대 특징 -->
  <section class="section section--soft" id="rnd">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>자체 개발해 온<br>무인 로봇 시스템</h2></div>
      </div>
      <div class="roles" data-reveal>
        <div>${icon('doc', 30)}<b>기업부설연구소</b><p>2017년 11월 설립. 로봇 시스템의 개발과 시제품 제작을 맡습니다.</p></div>
        <div>${icon('shield', 30)}<b>등록 특허</b><p>정합식 맨홀(2017) · 관내부 무인 준설 처리 시스템(2017) · 스크류 바퀴를 구비한 수륙양용 준설로봇(2020) · 소형관로 준설로봇 및 그 운전방법(2020) · 워터젯 유닛을 구비한 세정로봇 장치(2020)</p></div>
        <div>${icon('robot', 30)}<b>연구개발 과제</b><p>능동형 촉매 적재장치 · 석유화학 저장탱크 협업형 클리닝 시스템 · 수중 슬러지 수거 무인 자율 이동 로봇 시스템</p></div>
        <div>${icon('scan', 30)}<b>시제품과 성능시험</b><p>벽면/천장 부착형 · 흡입/준설 · 파쇄 무인 로봇 시제품을 제작하고, 공인시험기관(KCL) 입회 성능시험을 거쳤습니다.</p></div>
      </div>
      <div class="grid grid--2 mt-24">
        <div class="panel panel--line" data-reveal>
          <h3>무인 Vacuum 로봇의 세대별 발전</h3>
          <ol class="steps steps--tight mt-16">
${PROCESS.generations.map((g, i) => `            <li><em>${i + 1}</em><b>${esc(g.g)}</b><p>${esc(g.d)}</p></li>`).join('\n')}
          </ol>
        </div>
        <div class="panel panel--line" data-reveal data-delay="80">
          <h3>5세대 무인 Cleaning 로봇의 주요 특징</h3>
          <ul class="targets mt-16">${PROCESS.gen5.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="note mt-14"><b class="ink">기타 Cleaning 로봇</b> · ${PROCESS.others.map(esc).join(' / ')}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 03 장비의 역할 -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>장비 하나가 아니라,<br>역할이 나뉜 구성</h2></div>
      </div>
      <div class="roles" data-reveal>
${TECH.system.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- 04 적용 조건 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>적용의 출발점은<br>현장의 조건입니다</h2></div>
      </div>
      <ul class="numlist" data-reveal>
${TECH.conditions.map((c, i) => `        <li><em>0${i + 1}</em><b>${esc(c.label)}</b><p>${esc(c.text)}</p></li>`).join('\n')}
      </ul>
    </div>
  </section>

  <!-- 05 작업의 흐름 -->
  <section class="section section--navy">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>작업의 흐름과<br>후속 작업</h2></div>
      </div>
      <ul class="flow" data-reveal>
${TECH.flow.map((f, i) => `        <li><em>0${i + 1}</em><b>${esc(f)}</b></li>`).join('\n')}
      </ul>
      <p class="note note--on-navy mt-22" data-reveal>${esc(TECH.flowNote)} <a class="tlink tlink--on-navy" href="process.html">현장 진행 방식 자세히 보기 ${upArrow(14)}</a></p>
    </div>
  </section>

  <!-- 06 회수 이후 -->
  <section class="section" id="recovery">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>회수한 물질의<br>다음 과정까지</h2></div>
      </div>
      <ul class="numlist" data-reveal>
${RECOVERY.steps.map((s, i) => `        <li><em>0${i + 1}</em><b>${esc(s.label)}</b><p>${esc(s.text)}</p></li>`).join('\n')}
      </ul>
      <div class="roles mt-28" data-reveal>
${RECOVERY.methods.map((m, i) => `        <div>${icon(i === 0 ? 'drop' : 'filter', 30)}<b>${esc(m.label)}</b><p>${esc(m.text)}</p></div>`).join('\n')}
      </div>
      <p class="note mt-14" data-reveal>${esc(DEWATER_NOTE)}</p>
      <p class="mt-14" data-reveal><a class="tlink" href="process.html#dewater">탈수 과정 자세히 보기 ${upArrow(14)}</a></p>
    </div>
  </section>

  <!-- 관련 업무 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>관련 업무</h2></div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="services.html">사업분야 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="grid grid--3">
${SERVICES.filter((s) => s.tech).map((s, i) => `        <a class="scard" href="${s.file}" data-reveal data-delay="${i * 70}">
          <span class="scard__ico">${icon(s.icon, 40)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.card)}</p>
          <span class="scard__go">자세히 보기 ${arrow(14)}</span>
        </a>`).join('\n')}
      </div>
${SRC_LINE}    </div>
  </section>

` + cta({
  h2: '우리 현장에도 적용할 수 있는지<br>물어보세요',
  p: '출입구와 내부 구조, 잔류물 특성 등 알고 계신 정보를 보내 주세요.'
}) + MAIN_END + footer() + foot();


/* ---------- 4-B. 현장 진행 방식 ---------- */
pages['process.html'] = () => head({
  file: 'process.html', page: 'process',
  title: `현장 진행 방식 | ${C.brand}`,
  desc: '문의부터 현장 검토, 시스템 설치, 로봇 투입, 원격 모니터링, Final Cleaning, 회수물 처리까지 — 신정개발이 현장에서 작업을 진행하는 순서를 기술소개서 기준으로 소개합니다.'
}) + header('process') + `
<main id="main">
` + phero({
  h1: '현장에서는<br>이렇게 진행합니다',
  crumbs: [{ label: '현장 진행 방식' }]
}) + `
  <!-- 01 진행 순서 -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>문의부터 폐기물 처리까지,<br>일곱 단계</h2></div>
      </div>
      <div class="proc">
${PROCESS.steps.map((st, i) => `        <article data-reveal${i ? ` data-delay="${(i % 3) * 80}"` : ''}>
          ${st.photo ? `<div class="proc__fig">${photo(P(st.photo), '(max-width:720px) 92vw, 420px')}</div>` : `<div class="proc__ico">${icon(st.icon, 56)}</div>`}
          <div class="proc__body">
            <em>${esc(st.k)}</em>
            <h3>${esc(st.t)}</h3>
            <p>${esc(st.d)}</p>
          </div>
        </article>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- 02 현장 배치 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>작업자는 밖에,<br>로봇은 안에</h2></div>
      </div>
${siteDiagram()}
      <div class="grid grid--3 mt-24">
${pcards(['R25', 'R07', 'R27'], ['제어 차량과 궤도형 장비의 연결', '설비 밖의 모니터와 조작자', '흡입차와 호스로 연결된 궤도형 장비'])}
      </div>
    </div>
  </section>

  <!-- 03 왜 로봇인가 -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>사람이 없는 곳에<br>인명 사고도 없다</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">${esc(PROCESS.factsNote)}</p><p class="note">${esc(PROCESS.factsSrc)}</p></div>
      </div>
      <div class="facts" data-reveal>
${PROCESS.facts.map((f) => `        <div><b>${esc(f.n)}</b><span>${esc(f.l)}</span></div>`).join('\n')}
      </div>
      <p class="note mt-14" data-reveal>신정개발 연간 작업 기준 · 기술소개서(2025)</p>
      <h3 class="mt-block mb-16">밀폐공간 작업 위험성 비교</h3>
${cmpTable(PROCESS.risk, '주요 위험성', '위험 노출', '위험 회피')}
      <details class="fold mt-block">
        <summary>효율성 비교 표 보기</summary>
        <h3 class="mt-18 mb-16">밀폐공간 작업 효율성 비교</h3>
${cmpTable(PROCESS.eff, '주요 효율성', '제한', '가능')}
      </details>
    </div>
  </section>

  <!-- 04 용도별 적용 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>용도별 적용 범위와<br>유의점</h2></div>
      </div>
      <div class="creds creds--4">
${PROCESS.cases.map((c, i) => `        <div data-reveal${i ? ` data-delay="${i * 70}"` : ''}>
          <h3>${esc(c.t)}</h3>
          <ul>${c.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="creds__sub"><b>적용 조건</b> · ${c.cons.map(esc).join(' · ')}</p>
          <p class="creds__sub"><b>적용 범위</b> · ${c.scope.map(esc).join(' · ')}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- 05 회수물 처리 -->
  <section class="section" id="dewater">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>회수물은 탈수해<br>양을 줄입니다</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">데칸타(원심분리)·필터프레스(여과·압착)로 탈수해 폐기물 처리량·비용·시간을 줄입니다.</p></div>
      </div>
      <div data-reveal>
${dewaterDiagram()}
      </div>
${SRC_LINE}    </div>
  </section>

` + cta({
  h2: '우리 현장은 어떤 순서로<br>진행될지 물어보세요',
  p: '대상 설비·작업 목적·희망 일정을 알려 주시면 현장 검토부터 안내하겠습니다.'
}) + MAIN_END + footer() + foot();

/* ---------- 5. 수행 이력 ---------- */
pages['projects.html'] = () => head({
  file: 'projects.html', page: 'projects',
  title: `수행 이력 | ${C.brand}`,
  desc: '회사 자료에 수록된 신정개발의 과거 수행 이력입니다.' + (SHOW_FILTERS ? ' 분야를 선택하거나 검색해 살펴볼 수 있습니다.' : '') // 필터를 숨기면 안내 문장도 뺀다
}) + header('projects') + `
<main id="main">
` + phero({
  h1: '수행 이력',
  crumbs: [{ label: '수행 이력' }]
}) + `
  <section class="section">
    <div class="wrap">

      <div class="psum" data-reveal>
        <div class="stat"><b><span data-count="${PROJECT_SUMMARY.n}">${PROJECT_SUMMARY.n}</span><i>${esc(PROJECT_SUMMARY.unit)}</i></b><span>${esc(PROJECT_SUMMARY.l)}</span></div>
        <ul class="psum__chips" aria-label="주요 발주처 업종">
${PROJECT_SUMMARY.sectors.map((x) => `          <li class="chip">${esc(x)}</li>`).join('\n')}
        </ul>
      </div>

${SHOW_FILTERS ? `      <div class="filters" role="group" aria-label="분야 선택" data-reveal>
        <button type="button" data-filter="전체" aria-pressed="true">전체</button>
${PROJECT_CATS.map((c) => `        <button type="button" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('\n')}
      </div>

      <div class="toolbar" data-reveal>
        <label class="check"><input type="checkbox" id="recRobot"> 로봇 적용이 명시된 이력만</label>
        <div class="field toolbar__search">
          <label class="sr-only" for="recSearch">이력 검색</label>
          <input type="search" id="recSearch" placeholder="예: 준설, CCTV, 촉매" autocomplete="off">
        </div>
      </div>

` : ''}      <p class="note" data-reveal>표시 중인 이력 <b id="recCount" class="ink">${PROJECTS.length}</b>건</p>
      <p class="note mt-6" data-reveal>회사소개서(2024)에는 2020~2023년 수행 실적 170여 건이 수록되어 있으며, 발주처는 석유화학·정유·산업가스 플랜트, 발전 설비, 지방자치단체·공공기관의 상·하수도 사업, 건설 현장 등입니다. 아래는 그중 대표 이력이며 전체 목록은 문의 시 안내합니다.</p>

      <ul class="rec mt-10" id="recList" data-reveal>
${PROJECTS.slice().sort((a, b) => (a.period < b.period ? 1 : -1)).map((p) => `        <li class="rec__row" data-cat="${esc(p.cat)}" data-robot="${p.robot}" data-search="${esc(p.title + ' ' + p.cat + ' ' + p.summary)}">
          <span class="rec__date">${esc(p.period)}</span>
          <span class="rec__name">${esc(p.title)}${p.robot === 'stated' ? ' <span class="chip">로봇 적용</span>' : ''}</span>
          <span class="rec__cat">${esc(p.cat)}</span>
          <a class="rec__go" href="${svc(p.svc).file}" aria-label="${esc(svc(p.svc).title)} 업무 보기">${upArrow(13)}</a>
        </li>`).join('\n')}
      </ul>

      <p class="note rec__empty" id="recEmpty" hidden>조건에 맞는 이력이 없습니다. 다른 분야를 선택하거나 검색어를 지워 보세요.</p>

    </div>
  </section>

` + cta({
  h2: '비슷한 현장을<br>검토하고 계신가요?',
  p: '참고하신 이력과 대상 설비를 알려 주시면 비슷한 현장의 진행 방법을 안내해 드립니다.'
}) + MAIN_END + footer() + foot(['projects.js']);

/* ---------- 6. 회사 소개 ---------- */
pages['company.html'] = () => head({
  file: 'company.html', page: 'company',
  title: `회사 소개 | ${C.brand}`,
  desc: C.intro
}) + header('company') + `
<main id="main">
` + phero({
  h1: `${C.founded}년부터<br>쌓아 온 현장 경험`,
  crumbs: [{ label: '회사 소개' }]
}) + `
  <section class="section">
    <div class="wrap">
      <div class="stats" data-reveal>
        <div class="stat"><b><span data-count="${C.founded}">${C.founded}</span></b><span>설립</span></div>
        <div class="stat"><b><span data-count="2007">2007</span></b><span>법인 전환</span></div>
        <div class="stat"><b><span data-count="2017">2017</span></b><span>기업부설연구소 설립</span></div>
        <div class="stat"><b><span data-count="5">5</span><i>개 분야</i></b><span>다루는 업무</span></div>
      </div>
    </div>
  </section>

  <section class="section section--sm section--soft">
    <div class="wrap">
      <div class="split split--top split--sticky">
        <div data-reveal>
          <h2>연혁</h2>
          <p class="note mt-14">1992년 신학상사로 출발해 1995년 신정개발로 상호를 바꾸고, 2007년 법인으로 전환했습니다.</p>
          <ul class="hist mt-28">
${C.history.map((h) => `            <li><b>${h.year}</b><ul class="hist__items">
${h.items.map((it) => `              <li><em>${it.m}</em><span>${esc(it.label)}</span></li>`).join('\n')}
            </ul></li>`).join('\n')}
          </ul>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo(P('M02'), '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">${esc(P('M02').cap)}</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="section" id="credentials">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>면허·인증과<br>조직</h2></div>
      </div>
      <div class="creds">
        <div data-reveal>
          <h3>건설업 면허 · 허가</h3>
          <ul>${CREDS.licenses.map((x) => `<li>${esc(x)}</li>`).join('')}${CREDS.permits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>
        <div data-reveal data-delay="70">
          <h3>경영시스템 · 기업 인증</h3>
          <ul>${CREDS.certs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>
        <div data-reveal data-delay="140">
          <h3>수상 · 특허</h3>
          <ul>${CREDS.awards.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="creds__sub">${esc(CREDS.patents)}</p>
        </div>
      </div>
      <div class="grid grid--2 mt-24">
        <div class="panel panel--line" data-reveal>
          <h3>조직 구성</h3>
          <p class="note mt-10">대표이사 아래 ${CREDS.teams.map(esc).join(' · ')}으로 구성됩니다. 안전·공무 담당과 기업부설연구소를 별도로 둡니다.</p>
        </div>
        <div class="panel panel--line" data-reveal data-delay="80">
          <h3>보유 기술자격 (종류)</h3>
          <ul class="numlist mt-10">${CREDS.quals.map((q, i) => `<li><em>0${i + 1}</em><b class="fs-body">${esc(q)}</b></li>`).join('')}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="split split--rev">
        <div data-reveal>
          <h2>설비와 작업 환경을<br>함께 살핍니다</h2>
          <p class="lead mt-20">시설의 구조와 작업 목적, 잔류물의 특성을 확인하는 것에서 업무 검토가 시작됩니다.</p>
          <div class="mt-28"><a class="btn btn--line" href="services.html">사업분야 보기 ${arrow(18)}</a></div>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo(P('M05'), '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">${esc(P('M05').cap)}</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>현장과 안전</h2></div>
      </div>
      <div class="grid grid--3">
${pcards(['M10', 'M06', 'M04'], ['현장의 차량과 안전 구획', '안전모', '산업단지 전경'])}
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>다루는 업무</h2></div>
        <div class="head__aside" data-reveal data-delay="90">
          <a class="tlink" href="services.html">사업분야 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="grid grid--5">
${serviceCards(true)}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="head head--solo" data-reveal><div><h2>연락처</h2></div></div>
      <dl class="dtable" data-reveal>
        <div><dt>회사명</dt><dd>${esc(C.name)} <span class="note">${esc(C.brandEn)} CO., LTD.</span></dd></div>
        <div><dt>설립</dt><dd>${C.founded}년</dd></div>
        <div><dt>본사</dt><dd>${icon('pin', 17)} ${esc(C.address)} <a href="https://map.naver.com/p/search/${encodeURIComponent(C.address)}" target="_blank" rel="noopener">네이버 지도</a> <a href="https://map.kakao.com/link/search/${encodeURIComponent(C.address)}" target="_blank" rel="noopener">카카오맵</a></dd></div>
        <div><dt>지사</dt><dd>${icon('pin', 17)} ${esc(C.branch)} <a href="https://map.naver.com/p/search/${encodeURIComponent(C.branch)}" target="_blank" rel="noopener">네이버 지도</a></dd></div>
        <div><dt>대표 전화</dt><dd><a href="tel:${C.tel.replace(/-/g, '')}">${C.tel}</a> <span class="note">문의 가능 시간 ${esc(C.hours)}</span></dd></div>
        <div><dt>팩스</dt><dd>${C.fax}</dd></div>
        <div><dt>이메일</dt><dd>${icon('mail', 17)} <a href="mailto:${C.email}">${C.email}</a></dd></div>
        <div><dt>사업 범위</dt><dd>${SERVICES.map((s) => esc(s.title)).join(' · ')}</dd></div>
      </dl>
${SRC_LINE}    </div>
  </section>

` + cta() + MAIN_END + footer() + foot();

/* ---------- 7. 현장 문의 ---------- */
pages['contact.html'] = () => head({
  file: 'contact.html', page: 'contact',
  title: `현장 문의 | ${C.brand}`,
  desc: '대상 설비와 작업 목적, 희망 일정을 보내 주시면 가능한 작업 범위와 진행 방법을 안내해 드립니다.'
}) + header('contact') + `
<main id="main">
` + phero({
  h1: '검토가 필요한 현장을<br>알려 주세요',
  keepLead: '대상 설비 · 작업 목적 · 희망 일정을 알려 주세요.',
  crumbs: [{ label: '현장 문의' }]
}) + `
  <section class="section">
    <div class="wrap">
      <div class="split split--top split--wide">

        <div data-reveal>
          <h2>문의 내용 작성</h2>
          <p class="note mt-14">아래를 채우고 <b class="ink">문의 내용 만들기</b>를 누르면 사용하시는 메일 앱이 열립니다.</p>

          <form class="form mt-28" id="inquiryForm" novalidate>
            <div class="form__row">
              <div class="field">
                <label for="f-name">이름 또는 회사명 <em aria-hidden="true">*</em><span class="sr-only">(필수)</span></label>
                <input type="text" id="f-name" name="name" autocomplete="organization" required>
                <p class="field__err" hidden></p>
              </div>
              <div class="field">
                <label for="f-email">회신 이메일 <em aria-hidden="true">*</em><span class="sr-only">(필수)</span></label>
                <input type="email" id="f-email" name="email" autocomplete="email" required>
                <p class="field__err" hidden></p>
              </div>
            </div>

            <div class="form__row">
              <div class="field">
                <label for="f-phone">연락처</label>
                <input type="tel" id="f-phone" name="phone" autocomplete="tel" inputmode="tel">
              </div>
              <div class="field">
                <label for="f-service">문의 업무</label>
                <select id="f-service" name="service">
                  <option value="">선택하지 않음</option>
${SERVICES.map((s) => `                  <option value="${s.id}">${esc(s.title)}</option>`).join('\n')}
                  <option value="T01">장비·로봇</option>
                  <option value="E01">회수 이후의 과정</option>
                </select>
              </div>
            </div>

            <div class="form__row">
              <div class="field">
                <label for="f-place">현장 위치</label>
                <input type="text" id="f-place" name="place" placeholder="예: 전남 여수">
              </div>
              <div class="field">
                <label for="f-when">희망 일정</label>
                <input type="text" id="f-when" name="when" placeholder="예: 2027년 상반기 정기보수">
              </div>
            </div>

            <div class="field">
              <label for="f-body">문의 내용 <em aria-hidden="true">*</em><span class="sr-only">(필수)</span></label>
              <textarea id="f-body" name="body" required placeholder="대상 설비, 작업 목적, 현장 상태를 적어 주세요. 크기·구조·잔류물 정보를 알고 계시면 함께 적어 주시면 검토에 도움이 됩니다."></textarea>
              <p class="field__err" hidden></p>
            </div>

            <p class="note">입력하신 이름·연락처·이메일은 문의 답변에만 사용합니다.</p>
            <div class="form__act">
              <button class="btn btn--fill" type="submit">문의 내용 만들기 ${arrow(18)}</button>
              <button class="btn btn--line" type="button" data-copy="mail">이메일 주소 복사</button>
            </div>
            <p class="form__msg" id="formMsg" role="status" aria-live="polite"></p>

            <div id="copyWrap" hidden>
              <p class="note mt-6">메일 앱이 열리지 않으면 아래 내용을 복사해 보내 주세요.</p>
              <pre class="copybox" id="copyBox" tabindex="0"></pre>
              <div class="mt-12"><button class="btn btn--line btn--sm" type="button" data-copy="body">문의 내용 복사</button></div>
            </div>
          </form>
        </div>

        <div data-reveal data-delay="90">
          <div class="panel">
            <h3>연락처</h3>
            <dl class="dtable dtable--soft mt-18">
              <div><dt>대표 전화</dt><dd><a href="tel:${C.tel.replace(/-/g, '')}">${C.tel}</a></dd></div>
              <div><dt>문의 가능 시간</dt><dd>${esc(C.hours)}</dd></div>
              <div><dt>팩스</dt><dd>${C.fax}</dd></div>
              <div><dt>이메일</dt><dd><a href="mailto:${C.email}">${C.email}</a></dd></div>
              <div><dt>본사</dt><dd>${esc(C.address)} <a href="https://map.naver.com/p/search/${encodeURIComponent(C.address)}" target="_blank" rel="noopener">지도</a></dd></div>
              <div><dt>지사</dt><dd>${esc(C.branch)}</dd></div>
              <div><dt>회사명</dt><dd>${esc(C.name)}</dd></div>
            </dl>
          </div>

          <div class="panel panel--line mt-16">
            <h3>이렇게 알려 주시면 좋습니다</h3>
            <ul class="numlist mt-16">
              <li><em>01</em><b>대상 설비</b><p>탱크·반응기·관로 등 작업 대상</p></li>
              <li><em>02</em><b>작업 목적</b><p>클리닝·제거·교체·조사 등</p></li>
              <li><em>03</em><b>현장 상태</b><p>크기·구조·잔류물 정보, 사진·도면</p></li>
              <li><em>04</em><b>희망 일정</b><p>정기보수 기간 등 가능한 시기</p></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><h2>궁금한 점</h2></div>
      </div>
${faqBlock()}
    </div>
  </section>

</main>

` + footer() + foot(['contact.js']);

/* ---------- 8. 404 ---------- */
pages['404.html'] = () => head({
  file: '404.html', page: 'error',
  title: `페이지를 찾을 수 없습니다 | ${C.brand}`,
  desc: '요청하신 주소의 페이지가 없습니다.'
}) + header('') + `
<main id="main">
` + phero({
  h1: '페이지를 찾을 수 없습니다',
  crumbs: [{ label: '페이지를 찾을 수 없습니다' }]
}) + `
  <section class="section">
    <div class="wrap">
      <div class="head head--solo"><div><h2>이쪽으로 가 보세요</h2></div></div>
      <div class="grid grid--3">
        <a class="scard" href="index.html"><span class="scard__ico">${icon('shield', 40)}</span><h3>홈</h3><p>첫 화면으로 이동합니다.</p><span class="scard__go">이동 ${arrow(14)}</span></a>
        <a class="scard" href="services.html"><span class="scard__ico">${icon('tank', 40)}</span><h3>사업분야</h3><p>다섯 가지 업무를 확인합니다.</p><span class="scard__go">이동 ${arrow(14)}</span></a>
        <a class="scard" href="contact.html"><span class="scard__ico">${icon('mail', 40)}</span><h3>현장 문의</h3><p>검토가 필요한 현장을 알려 주세요.</p><span class="scard__go">이동 ${arrow(14)}</span></a>
      </div>
    </div>
  </section>
</main>

` + footer() + foot();

/* ===================== 기록 ===================== */
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let n = 0;
Object.keys(pages).forEach((file) => {
  fs.writeFileSync(path.join(OUT, file), pages[file](), 'utf8');
  n++;
});

/* sitemap · robots */
const urls = Object.keys(pages).filter((f) => f !== '404.html');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((f) => `  <url><loc>${SITE_URL}${f === 'index.html' ? '' : f}</loc><changefreq>monthly</changefreq><priority>${f === 'index.html' ? '1.0' : '0.7'}</priority></url>`).join('\n') +
  `\n</urlset>\n`, 'utf8');

fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`, 'utf8');

console.log(`생성 완료: HTML ${n}개 + sitemap.xml + robots.txt → ${OUT}`);
