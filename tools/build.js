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
  brandEn: 'SHINJEONG DEVELOPMENT',
  founded: 1992,
  address: '전라남도 여수시 봉계2길 27',
  email: 'shinjeong@sjdevel.com',
  tagline: '산업설비·환경시설 클리닝',
  intro: '1992년 시작한 신정개발은 산업설비와 환경시설을 다루는 클리닝 전문기업입니다. 설비 유지보수, 촉매·충진물 작업, 준설과 시설 조사·보수의 경험을 바탕으로 현장의 작업 방법을 발전시켜 갑니다.',
  history: [
    { year: 1992, label: '설립' },
    { year: 2007, label: '법인 전환' },
    { year: 2017, label: '기업부설연구소 설립' }
  ]
};

const SERVICES = [
  {
    id: 'S01', file: 'service-equipment-cleaning.html', icon: 'tank', title: '설비 클리닝',
    summary: '탱크와 Pond, 배수로 등 산업설비의 잔류물과 퇴적물을 다루는 클리닝 작업.',
    short: '설비의 구조와 잔류물 특성을 바탕으로 작업 범위를 살펴봅니다.',
    body: '설비의 구조와 잔류물 특성을 확인하고 작업 범위를 검토합니다. 탱크·Pond 내부 클리닝부터 공장 배수로, R.T.O 유지보수·클리닝, 필터 관련 작업까지 현장에 필요한 업무를 안내합니다.',
    targets: ['Tank', 'Pond', '공장 내부 배수로', 'R.T.O', 'Filter Press 세정', 'Bag Filter 교체'],
    topTargets: ['Tank', 'Pond', '공장 내부 배수로'],
    inquiryHint: ['대상 설비', '작업 목적', '알고 있는 크기·구조·잔류물 정보'],
    projects: ['P02', 'P05'], tech: true,
    photo: { id: 'W01', w: 1000, h: 750, sizes: [640, 1000, 1600],
      alt: '산업설비 현장의 흡입차와 연결 호스',
      cap: '산업설비 현장의 흡입차와 연결 호스',
      note: '산업설비 현장에 배치된 흡입차와 연결 호스의 모습입니다.' }
  },
  {
    id: 'S02', file: 'service-catalyst-media.html', icon: 'reactor', title: '촉매·충진물 작업',
    summary: '반응기와 관련 설비의 촉매·충진물 제거 및 교체 작업.',
    short: '반응기와 관련 설비의 조건에 맞춰 요청 업무를 검토합니다.',
    body: '설비 조건과 작업 범위에 따라 촉매·충진물 관련 업무를 검토합니다. 흡입·분리·원격 모니터링 시스템의 역할과 로봇을 적용한 작업 방식을 함께 살펴보세요.',
    targets: ['촉매 제거·교체', '충진물 제거·교체', '하역·충진 관련 작업의 범위 상담'],
    topTargets: ['촉매 제거·교체', '충진물 제거·교체', '하역·충진 범위 상담'],
    inquiryHint: ['설비 종류', '충진물 특성', '요청 범위', '희망 일정'],
    projects: ['P01'], tech: true,
    concept: [
      { icon: 'suction', label: '흡입', text: '촉매·충진물을 호스로 흡입해 회수하는 역할' },
      { icon: 'separate', label: '분리', text: '회수한 물질을 작업에 맞게 분리하는 역할' },
      { icon: 'monitor', label: '원격 모니터링', text: '설비 밖에서 작업 상황을 확인하는 역할' }
    ],
    photo: { id: 'W05', w: 1000, h: 667, sizes: [640, 1000, 1600],
      alt: 'SUCTION ROBOT 표기가 보이는 궤도형 장비',
      cap: 'SUCTION ROBOT 표기가 보이는 궤도형 장비',
      eyebrow: 'EQUIPMENT', heading: '장비의 외형', scene: false,
      note: '전면 스크루와 궤도를 갖춘 장비의 외형입니다.' }
  },
  {
    id: 'S03', file: 'service-chemical-cleaning.html', icon: 'pipe', title: '화학세정',
    summary: '배관·열교환기·냉각탑 계통과 보일러 등 산업설비의 세정 업무.',
    short: '대상 설비와 오염 상태, 세정 목적을 먼저 확인합니다.',
    body: '설비 종류와 오염 상태, 작업 목적을 바탕으로 세정 범위를 검토합니다. 배관류, 열교환기, 냉각탑 계통과 보일러 튜브 등 대상 설비에 필요한 업무를 안내합니다.',
    targets: ['Plant 배관', '열교환기', 'Cooling Tower 계통', '보일러 Tube 내·외부 관련 세정'],
    topTargets: ['Plant 배관', '열교환기', 'Cooling Tower 계통'],
    inquiryHint: ['대상 설비', '오염 상태', '세정 목적', '가능한 작업 기간'],
    projects: [], tech: false, photo: null
  },
  {
    id: 'S04', file: 'service-dredging-sludge.html', icon: 'manhole', title: '준설·슬러지 회수',
    summary: '하수·오수관과 처리시설의 퇴적물 준설 및 슬러지 회수 작업.',
    short: '퇴적물의 특성과 현장 구조, 회수 범위를 함께 살펴봅니다.',
    body: '하수도 퇴적물과 폐수처리장 슬러지 등 대상 물질과 현장 구조를 확인합니다. 회수 작업과 필요한 후속 관리의 범위를 함께 검토합니다.',
    targets: ['하수도 퇴적물', '하수처리시설', '오수관', '폐수처리장 슬러지'],
    topTargets: ['하수도 퇴적물', '오수관', '폐수처리장 슬러지'],
    inquiryHint: ['시설 종류', '대상 물질', '현장 상태', '희망 작업 시기'],
    projects: ['P03', 'P06'], tech: true, recovery: true,
    photo: { id: 'W10', w: 1000, h: 563, sizes: [640, 1000, 1600],
      alt: '맨홀 주변에서 호스 작업을 하는 작업자들과 차량',
      cap: '맨홀 주변에서 호스 작업을 하는 작업자들과 차량',
      note: '맨홀 주변에서 호스를 다루는 작업 장면입니다.' },
    photo2: { id: 'W03', w: 1000, h: 1000, sizes: [600, 1000],
      alt: '맨홀 주변에서 호스 작업을 하는 두 작업자',
      cap: '맨홀 주변에서 호스 작업을 하는 두 작업자' }
  },
  {
    id: 'S05', file: 'service-inspection-repair.html', icon: 'scan', title: '관로·지하 조사 및 보수',
    summary: '관로 CCTV와 GPR 조사, 비굴착 보수 등 시설 상태 확인과 보수 업무.',
    short: '조사 대상과 목적에 따라 필요한 업무를 안내합니다.',
    body: '조사 대상과 목적에 맞춰 관로 내부 CCTV 조사, 지하매설물 GPR 조사, 비굴착 보수 관련 업무를 안내합니다. 대상 시설과 요청 범위를 알려 주시면 검토에 필요한 정보를 확인합니다.',
    targets: ['관로 CCTV 조사', '지하매설물 GPR 조사', '비굴착 보수'],
    topTargets: ['관로 CCTV 조사', '지하매설물 GPR 조사', '비굴착 보수'],
    inquiryHint: ['대상 구간', '조사·보수 목적', '보유 자료', '희망 일정'],
    projects: ['P04'], tech: false, photo: null,
    rows: [
      { icon: 'cctv', label: '관로 CCTV 조사', text: '관로 내부를 대상으로 하는 CCTV 조사 업무입니다.' },
      { icon: 'gpr', label: '지하매설물 GPR 조사', text: '지하매설물을 대상으로 하는 GPR 조사 업무입니다.' },
      { icon: 'repair', label: '비굴착 보수', text: '굴착 없이 진행하는 관로 보수 관련 업무입니다.' }
    ]
  }
];

const TECH = {
  title: '현장 조건에 맞춰 적용하는 로봇 클리닝',
  body: '로봇과 원격 모니터링을 활용해 내부 작업을 수행하고, 작업자의 위험 노출을 줄이는 방향을 검토합니다. 적용 가능성은 설비 구조와 출입구, 잔류물의 성상, 온도 및 장비 이동 조건에 따라 확인합니다.',
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
  flowNote: '기술자료를 요약한 개념 흐름입니다. 실제 진행 방식은 현장과 업무에 따라 달라집니다.'
};

const RECOVERY = {
  title: '회수한 물질의 다음 과정까지 살펴봅니다',
  body: '클리닝과 준설 이후에는 회수물의 특성에 맞는 후속 관리가 필요합니다. 원심분리 방식의 데칸타와 압착·여과 방식의 필터프레스 등 고액분리·탈수 과정을 살펴보고, 현장 조건에 맞는 적용과 처리 연계 범위를 상담할 수 있습니다.',
  steps: [
    { label: '회수물 특성', text: '클리닝과 준설로 회수한 물질의 특성을 먼저 확인합니다.' },
    { label: '탈수·고액분리 검토', text: '회수물에 맞는 고액분리·탈수 방식을 살펴봅니다.' },
    { label: '처리 연계 범위', text: '현장 조건에 맞는 적용과 처리 연계 범위를 상담합니다.' }
  ],
  methods: [
    { label: '데칸타', text: '원심분리를 이용한 고액분리' },
    { label: '필터프레스', text: '여과·압착을 이용한 탈수' }
  ]
};

const FAQ = [
  { q: '로봇이 모든 작업을 진행하나요?', a: '설비와 작업 조건에 따라 적용 범위가 달라집니다. 작업 범위에 따라 로봇 작업 이후 필요한 후속·마무리 작업을 진행합니다.' },
  { q: '어떤 정보를 보내면 상담에 도움이 되나요?', a: '대상 설비, 작업 목적, 현장 상태와 희망 일정을 알려 주세요. 크기·구조·사진·도면 등 알고 계신 정보를 함께 정리하면 검토에 도움이 됩니다.' },
  { q: '우리 설비에 적용할 수 있는지 바로 알 수 있나요?', a: '출입구와 내부 구조, 잔류물 특성 등 현장 조건을 확인해야 합니다. 관련 정보를 바탕으로 적용 범위를 검토합니다.' },
  { q: '회수한 슬러지의 후속 과정도 상담할 수 있나요?', a: '회수물의 특성과 현장 조건에 따른 탈수·분리 및 처리 연계 범위를 함께 문의할 수 있습니다.' }
];

const PROJECTS = [
  { id: 'P01', title: '반응기 로봇 촉매 Unloading', period: '2023.02~2023.04', cat: '촉매·충진물', robot: 'stated', summary: '반응기 촉매 Unloading 작업에 로봇을 적용한 이력입니다.', svc: 'S02' },
  { id: 'P02', title: '설비 내부 Cleaning — 로봇 적용', period: '2023.06', cat: '설비 클리닝', robot: 'stated', summary: '설비 내부 Cleaning 작업에 로봇을 적용한 이력입니다.', svc: 'S01' },
  { id: 'P03', title: '폐수처리장 유량조정조 슬러지 준설', period: '2023.09~2023.11', cat: '준설·슬러지', robot: 'stated', summary: '폐수처리장 유량조정조의 슬러지를 준설한 이력입니다.', svc: 'S04' },
  { id: 'P04', title: '하수관거 CCTV 조사', period: '2022.01~2022.12', cat: '관로·지하 조사', robot: 'na', summary: '하수관거를 대상으로 CCTV 조사를 수행한 이력입니다.', svc: 'S05' },
  { id: 'P05', title: '정기보수 APH·열교환기 튜브 Cleaning', period: '2022.05~2022.06', cat: '설비 세정', robot: 'unknown', summary: '정기보수 기간에 APH와 열교환기 튜브의 Cleaning을 수행한 이력입니다.', svc: 'S01' },
  { id: 'P06', title: '공정 내 배수로 슬러지 준설', period: '2023.07', cat: '준설·슬러지', robot: 'unknown', summary: '공정 내 배수로의 슬러지를 준설한 이력입니다.', svc: 'S04' }
];
const PROJECT_CATS = ['촉매·충진물', '설비 클리닝', '설비 세정', '준설·슬러지', '관로·지하 조사'];
const FEATURED = ['P01', 'P02', 'P04'];

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
  { href: 'technology.html', label: '로봇·작업 시스템', key: 'technology' },
  { href: 'projects.html', label: '수행 이력', key: 'projects' },
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
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230e2e4a'/%3E%3Ctext x='16' y='22' font-family='sans-serif' font-size='16' font-weight='700' fill='%23fff' text-anchor='middle'%3E신%3C/text%3E%3C/svg%3E">
<link rel="preload" href="assets/fonts/PretendardVariable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/site.css">
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>\n` : ''}</head>
<body data-page="${o.page}">
<a class="skip-link" href="#main">본문 바로가기</a>
`;
}

function header(page) {
  const nav = NAV.map((n) =>
    `      <a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`
  ).join('\n');
  const dnav = NAV.concat([{ href: 'contact.html', label: '현장 문의', key: 'contact' }])
    .map((n, i) =>
      `    <a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${esc(n.label)}<span>0${i + 1}</span></a>`
    ).join('\n');

  return `<header class="hdr">
  <a class="hdr__brand" href="index.html" aria-label="${esc(C.brand)} 홈">
    <b>${esc(C.brand)}</b><span aria-hidden="true">${esc(C.brandEn)}</span>
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
    ${esc(C.name)} · ${C.founded}년부터<br>
    ${esc(C.address)}<br>
    <a href="mailto:${C.email}">${C.email}</a>
  </div>
</div>
`;
}

function phero(o) {
  return `  <section class="phero">
    <div class="phero__grid" aria-hidden="true"></div>
    <div class="wrap">
      <span class="eyebrow">${esc(o.eyebrow)}</span>
      <h1>${o.h1}</h1>
      ${o.lead ? `<p class="phero__lead">${esc(o.lead)}</p>` : ''}
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
      <h2 data-reveal>${t.h2 || '검토가 필요한 현장을<br>알려 주세요.'}</h2>
      <p data-reveal data-delay="80">${esc(t.p || '대상 설비와 작업 목적, 희망 일정을 보내 주시면 검토에 필요한 정보를 함께 확인하겠습니다.')}</p>
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
    { h: '기술', items: [{ href: 'technology.html', label: '로봇·작업 시스템' }, { href: 'technology.html#recovery', label: '회수 이후의 과정' }] },
    { h: '회사', items: [{ href: 'company.html', label: '회사 소개' }, { href: 'projects.html', label: '수행 이력' }] },
    { h: '문의', items: [{ href: 'contact.html', label: '현장 문의' }, { href: `mailto:${C.email}`, label: '이메일로 문의' }] }
  ];
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr__top">
      <div class="ftr__brand">
        <b>${esc(C.brand)}</b><span aria-hidden="true">${esc(C.brandEn)}</span>
        <p class="ftr__info">
          ${esc(C.name)} · ${C.founded}년부터<br>
          ${esc(C.address)}<br>
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
    <div class="ftr__bot">
      <p>&copy; <span data-year>2026</span> ${esc(C.name)}. All rights reserved.</p>
      <button class="totop" type="button" data-totop>맨 위로 ${icon('up', 13)}</button>
    </div>
  </div>
</footer>

<a class="mcta" href="contact.html">현장 문의하기 ${arrow(17)}</a>
`;
}

/* 문의 띠(.cta)까지 본문(main)에 포함한 뒤 닫는다 */
const MAIN_END = '</main>\n\n';

function foot(extraJs) {
  return `<script src="js/site.js"></script>
${(extraJs || []).map((f) => `<script src="js/${f}"></script>`).join('\n')}${extraJs && extraJs.length ? '\n' : ''}</body>
</html>
`;
}

/* ===================== 공통 블록 ===================== */
function serviceCards(reveal) {
  return SERVICES.map((s, i) => `      <a class="scard" href="${s.file}"${reveal ? ` data-reveal data-delay="${i * 70}"` : ''}>
        <span class="scard__no">0${i + 1}</span>
        <span class="scard__ico">${icon(s.icon, 40)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.short)}</p>
        <span class="scard__tags">${s.topTargets.map((t) => `<span>${esc(t)}</span>`).join('')}</span>
        <span class="scard__go">자세히 보기 ${arrow(14)}</span>
      </a>`).join('\n');
}

function recRow(p, withSummary) {
  const chip = p.robot === 'stated' ? ' <span class="chip">로봇 적용</span>' : '';
  return `        <li class="rec__row" data-cat="${esc(p.cat)}" data-robot="${p.robot}" data-search="${esc(p.title + ' ' + p.cat + ' ' + p.summary)}">
          <span class="rec__date">${esc(p.period)}</span>
          <span class="rec__name">${esc(p.title)}${chip}</span>
          <span class="rec__cat">${esc(p.cat)}</span>
          ${withSummary
    ? `<a class="rec__go" href="${svc(p.svc).file}">관련 업무 ${upArrow(13)}</a>`
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
    title: `${C.brand} | ${C.tagline}`,
    desc: '산업설비 클리닝, 촉매·충진물 작업, 화학세정, 준설·슬러지 회수, 관로·지하 조사 및 보수. 1992년부터 현장을 다뤄 온 신정개발의 다섯 가지 업무와 로봇·작업 시스템을 소개합니다.',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: C.name, alternateName: C.brandEn, foundingDate: String(C.founded),
      url: SITE_URL, email: C.email,
      address: { '@type': 'PostalAddress', addressCountry: 'KR', addressRegion: '전라남도', addressLocality: '여수시', streetAddress: '봉계2길 27' },
      description: C.intro
    }
  }) + header('home') + `
<main id="main">

  <!-- ===== 히어로 ===== -->
  <section class="hero">
    <div class="hero__media">${photo(heroPhoto, '100vw', true)}</div>
    <div class="wrap hero__inner">
      <span class="eyebrow">INDUSTRIAL CLEANING · SINCE ${C.founded}</span>
      <h1>현장을 이해하고,<br>기술로 답합니다.</h1>
      <p class="hero__lead">산업설비 클리닝부터 로봇을 활용한 작업까지, 신정개발은 현장의 조건에서 작업의 답을 찾습니다.</p>
      <div class="hero__act">
        <a class="btn btn--ghost" href="services.html">사업분야 보기 ${arrow(18)}</a>
        <a class="btn btn--ghost" href="contact.html">현장 문의 ${arrow(18)}</a>
      </div>
    </div>
    <div class="hero__bar">
      <ul>
        <li><b>${C.founded}년 설립</b><span>2007 법인 전환 · 2017 기업부설연구소 설립</span></li>
        <li><b>다섯 가지 업무</b><span>클리닝 · 촉매 · 세정 · 준설 · 조사</span></li>
        <li><b>로봇·원격 작업</b><span>작업자의 위험 노출을 줄이는 방향</span></li>
        <li><b>회수 이후까지</b><span>탈수·분리와 처리 연계 범위 상담</span></li>
      </ul>
    </div>
  </section>

  <!-- ===== 사업분야 ===== -->
  <section class="section" id="what">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">WHAT WE DO</span>
          <h2>산업설비와 환경시설,<br>다섯 가지 업무로 다룹니다.</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">${esc(C.tagline)}. 설비의 구조와 잔류물 특성을 먼저 확인하고, 현장 조건에 맞는 작업 범위를 검토합니다.</p>
          <a class="tlink" href="services.html">사업분야 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="grid grid--5">
${serviceCards(true)}
      </div>
    </div>
  </section>

  <!-- ===== 로봇·작업 시스템 (다크) ===== -->
  <section class="section section--navy">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">ROBOT &amp; SYSTEM</span>
          <h2>설비 안의 작업을,<br>설비 밖에서 지켜봅니다.</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">${esc(TECH.body)}</p>
          <a class="tlink" href="technology.html">로봇·작업 시스템 자세히 보기 ${upArrow(14)}</a>
        </div>
      </div>

      <div class="split split--top" data-reveal>
        <figure class="split__media">
          <div class="split__fig">${photo({ id: 'R27', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '야외에서 호스로 연결된 차량과 궤도형 장비' }, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">연결 구성 · 야외에서 호스로 연결된 차량과 궤도형 장비</figcaption>
        </figure>
        <div class="roles">
${TECH.system.map((r) => `          <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
        </div>
      </div>
    </div>
  </section>

  <!-- ===== 현장의 장면 ===== -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">ON SITE</span>
          <h2>현장의 장면</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">맨홀 주변 작업, 궤도형 장비, 차량의 모니터·제어장치를 사진으로 소개합니다.</p>
        </div>
      </div>
      <div class="grid grid--3">
        <figure class="pcard" data-reveal>
          <div class="pcard__fig">${photo({ id: 'W10', w: 1000, h: 563, sizes: [640, 1000, 1600], alt: '맨홀 주변에서 호스 작업을 하는 작업자들과 차량' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>맨홀 주변 작업</b><span>맨홀 주변에서 호스 작업을 하는 작업자들과 차량</span></figcaption>
        </figure>
        <figure class="pcard" data-reveal data-delay="80">
          <div class="pcard__fig">${photo({ id: 'W05', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: 'SUCTION ROBOT 표기가 보이는 궤도형 장비' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>궤도형 장비</b><span>SUCTION ROBOT 표기가 보이는 궤도형 장비</span></figcaption>
        </figure>
        <figure class="pcard" data-reveal data-delay="160">
          <div class="pcard__fig">${photo({ id: 'R07', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '작업장 내 차량에 설치된 모니터·제어장치와 조작자' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>모니터와 조작자</b><span>작업장 내 차량에 설치된 모니터·제어장치와 조작자</span></figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- ===== 수행 이력 ===== -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">EXPERIENCE</span>
          <h2>주요 수행 이력</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">회사 자료에 수록된 수행 이력 가운데 일부입니다.</p>
          <a class="tlink" href="projects.html">수행 이력 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <ul class="rec" data-reveal>
${feat.map((p) => recRow(p, true)).join('\n')}
      </ul>
    </div>
  </section>

  <!-- ===== 회사 소개 ===== -->
  <section class="section">
    <div class="wrap">
      <div class="split">
        <div data-reveal>
          <span class="eyebrow">ABOUT US</span>
          <h2>${C.founded}년부터<br>쌓아 온 현장 경험.</h2>
          <p class="lead mt-20">${esc(C.intro)}</p>
          <div class="mt-28"><a class="btn btn--line" href="company.html">회사 소개 ${arrow(18)}</a></div>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo({ id: 'M02', w: 1200, h: 816, sizes: [720, 1200], alt: '신정개발 상호가 보이는 건물 전경' }, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">신정개발 상호가 보이는 건물 전경</figcaption>
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
  eyebrow: 'OUR BUSINESS',
  h1: '사업분야',
  lead: '산업설비와 환경시설에서 필요한 다섯 가지 업무입니다. 업무를 고르면 대상 설비와 상담 시 필요한 정보를 확인할 수 있습니다.',
  crumbs: [{ label: '사업분야' }]
}) + tabs(null) + `
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">WHAT WE DO</span>
          <h2>다섯 가지 업무</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">각 업무마다 다루는 설비와 상담 시 알려 주시면 좋은 정보를 정리해 두었습니다. 업무를 눌러 확인하세요.</p>
        </div>
      </div>
      <div class="grid grid--3">
${serviceCards(true)}
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal>
          <span class="eyebrow">ROBOT &amp; SYSTEM</span>
          <h2>업무와 함께 살펴볼<br>작업 시스템</h2>
        </div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">로봇과 원격 모니터링을 활용한 작업 방식, 그리고 회수 이후의 과정은 사업분야와 구분해 따로 정리했습니다.</p>
          <a class="tlink" href="technology.html">로봇·작업 시스템 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="roles" data-reveal>
${TECH.system.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>

` + cta({
  h2: '어떤 업무에 해당하는지<br>모르셔도 괜찮습니다.',
  p: '대상 설비와 작업 목적을 알려 주시면 검토에 필요한 정보를 함께 확인하겠습니다.'
}) + MAIN_END + footer() + foot();

/* ---------- 3. 사업분야 상세 5개 ---------- */
SERVICES.forEach((s, idx) => {
  pages[s.file] = () => {
    const rel = s.projects.map(prj).filter(Boolean);
    const prev = SERVICES[idx - 1];
    const next = SERVICES[idx + 1];

    let body = '';

    /* 개요 + 대상 설비 */
    body += `  <section class="section">
    <div class="wrap">
      <div class="split split--top">
        <div data-reveal>
          <span class="eyebrow">OVERVIEW</span>
          <h2>${esc(s.short)}</h2>
          <p class="lead mt-20">${esc(s.body)}</p>
        </div>
        <div data-reveal data-delay="90">
          <h3 class="mb-16">대상 설비·업무</h3>
          <ul class="targets">
${s.targets.map((t) => `            <li>${esc(t)}</li>`).join('\n')}
          </ul>
        </div>
      </div>
    </div>
  </section>
`;

    /* 사진 */
    if (s.photo) {
      body += `  <section class="section section--sm section--soft">
    <div class="wrap">
      <div class="split">
        <figure class="split__media" data-reveal>
          <div class="split__fig">${photo(s.photo, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">${esc(s.photo.cap)}</figcaption>
        </figure>
        <div data-reveal data-delay="90">
          <span class="eyebrow">${esc(s.photo.eyebrow || 'FIELD')}</span>
          <h2>${esc(s.photo.heading || '현장의 모습')}</h2>
          <p class="lead mt-18">${esc(s.photo.note)}</p>
          <p class="note mt-18">사진은 업무의 맥락을 보여 주기 위한 ${s.photo.scene === false ? '장비 사진' : '현장 장면'}입니다. 특정 발주처나 수행 실적을 가리키지 않습니다.</p>
        </div>
      </div>
    </div>
  </section>
`;
    }

    /* 개념(S02) */
    if (s.concept) {
      body += `  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">CONCEPT</span><h2>작업 시스템의 역할</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">촉매·충진물 작업에서 살펴보는 시스템의 역할을 개념으로 정리했습니다.</p></div>
      </div>
      <div class="roles" data-reveal>
${s.concept.map((c) => `        <div>${icon(c.icon, 30)}<b>${esc(c.label)}</b><p>${esc(c.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>
`;
    }

    /* 업무 구성(S05) */
    if (s.rows) {
      body += `  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">SCOPE</span><h2>업무 구성</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">조사 대상과 목적에 따라 필요한 업무를 안내합니다.</p></div>
      </div>
      <div class="roles" data-reveal>
${s.rows.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>
`;
    }

    /* 회수 이후(S04) */
    if (s.recovery) {
      body += `  <section class="section">
    <div class="wrap">
      <div class="split split--top split--rev">
${s.photo2 ? `        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo(s.photo2, '(max-width:960px) 92vw, 560px')}</div>
          <figcaption class="split__cap">${esc(s.photo2.cap)}</figcaption>
        </figure>` : '        <div></div>'}
        <div data-reveal>
          <span class="eyebrow">AFTER RECOVERY</span>
          <h2>회수 이후의 과정</h2>
          <p class="lead mt-18">${esc(RECOVERY.body)}</p>
          <ul class="numlist mt-26">
${RECOVERY.steps.map((st, i) => `            <li><em>0${i + 1}</em><b>${esc(st.label)}</b><p>${esc(st.text)}</p></li>`).join('\n')}
          </ul>
          <div class="mt-24"><a class="tlink" href="technology.html#recovery">회수 이후의 과정 자세히 보기 ${upArrow(14)}</a></div>
        </div>
      </div>
    </div>
  </section>
`;
    }

    /* 바로 앞 섹션이 옅은 배경이면 흰색으로, 흰색이면 옅은 배경으로 — 같은 배경이 연달아 나오지 않게 한다 */
    const prevSoft = s.recovery ? false : s.rows ? true : s.concept ? false : !!s.photo;

    /* 상담 정보 + 관련 기술·이력 */
    body += `  <section class="section${prevSoft ? '' : ' section--soft'}">
    <div class="wrap">
      <div class="split split--top">
        <div data-reveal>
          <span class="eyebrow">BEFORE YOU ASK</span>
          <h2>문의하실 때<br>알려 주시면 좋은 정보</h2>
          <ul class="numlist mt-28">
${s.inquiryHint.map((h, i) => `            <li><em>0${i + 1}</em><b>${esc(h)}</b></li>`).join('\n')}
          </ul>
          <div class="mt-28"><a class="btn btn--fill" href="contact.html?service=${s.id}">이 업무로 문의하기 ${arrow(18)}</a></div>
        </div>
        <div data-reveal data-delay="90">
${s.tech ? `          <div class="panel panel--line mb-16">
            <h3>관련 기술</h3>
            <p class="note mt-10">${esc(TECH.title)}</p>
            <div class="mt-14"><a class="tlink" href="technology.html">로봇·작업 시스템 보기 ${upArrow(14)}</a></div>
          </div>` : ''}
${rel.length ? `          <div class="panel panel--line">
            <h3>관련 수행 이력</h3>
            <ul class="rlist mt-14">
${rel.map((p) => `              <li><b>${esc(p.title)}</b><span class="note">${esc(p.period)} · ${esc(p.cat)}</span></li>`).join('\n')}
            </ul>
            <div class="mt-16"><a class="tlink" href="projects.html">수행 이력 전체 보기 ${upArrow(14)}</a></div>
          </div>` : `          <div class="panel">
            <h3>이 업무의 수행 이력</h3>
            <p class="note mt-10">이 홈페이지의 수행 이력에는 이 업무로 분류된 항목이 없습니다. 전체 수행 이력은 아래에서 확인하실 수 있습니다.</p>
            <div class="mt-14"><a class="tlink" href="projects.html">수행 이력 전체 보기 ${upArrow(14)}</a></div>
          </div>`}
        </div>
      </div>

      <nav class="head pnav" aria-label="다른 사업분야">
        <div>${prev ? `<a class="tlink" href="${prev.file}">${icon('arrow', 14)} 이전 · ${esc(prev.title)}</a>` : `<a class="tlink" href="services.html">${icon('arrow', 14)} 사업분야 전체</a>`}</div>
        <div class="head__aside pnav__next">${next ? `<a class="tlink" href="${next.file}">다음 · ${esc(next.title)} ${arrow(14)}</a>` : `<a class="tlink" href="services.html">사업분야 전체 ${arrow(14)}</a>`}</div>
      </nav>
    </div>
  </section>
`;

    return head({
      file: s.file, page: 'services',
      title: `${s.title} | 사업분야 | ${C.brand}`,
      desc: s.summary,
      jsonld: {
        '@context': 'https://schema.org', '@type': 'Service',
        name: s.title, description: s.summary,
        provider: { '@type': 'Organization', name: C.name, url: SITE_URL }
      }
    }) + header('services') + `
<main id="main">
` + phero({
      eyebrow: `BUSINESS 0${idx + 1}`,
      h1: esc(s.title),
      lead: s.summary,
      crumbs: [{ label: '사업분야', href: 'services.html' }, { label: s.title }]
    }) + tabs(s.id) + '\n' + body + `
` + cta({
      h2: `${esc(s.title)},<br>어디까지 가능한지 물어보세요.`,
      p: s.inquiryHint.join(' · ') + ' 등을 알려 주시면 검토에 필요한 정보를 함께 확인하겠습니다.'
    }) + MAIN_END + footer() + foot();
  };
});

/* ---------- 4. 로봇·작업 시스템 ---------- */
pages['technology.html'] = () => head({
  file: 'technology.html', page: 'technology',
  title: `로봇·작업 시스템 | ${C.brand}`,
  desc: TECH.body
}) + header('technology') + `
<main id="main">
` + phero({
  eyebrow: 'ROBOT & SYSTEM',
  h1: '로봇·작업 시스템',
  lead: TECH.title,
  crumbs: [{ label: '로봇·작업 시스템' }]
}) + `
  <!-- 01 장비의 역할 -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">01 · ROLE</span><h2>장비 하나가 아니라,<br>역할이 나뉜 구성.</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">${esc(TECH.body)}</p></div>
      </div>
      <div class="roles" data-reveal>
${TECH.system.map((r) => `        <div>${icon(r.icon, 30)}<b>${esc(r.label)}</b><p>${esc(r.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- 02 연결 구성 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">02 · CONNECTION</span><h2>연결 구성</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">로봇과 흡입차는 호스로 연결해 구성합니다. 아래는 야외에서 차량과 궤도형 장비를 호스로 연결해 둔 모습입니다.</p></div>
      </div>
      <div class="grid grid--3" data-reveal>
        <figure class="pcard">
          <div class="pcard__fig">${photo({ id: 'R27', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '야외에서 호스로 연결된 차량과 궤도형 장비' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>연결 · 차량과 궤도형 장비</b><span>야외에서 호스로 연결된 차량과 궤도형 장비</span></figcaption>
        </figure>
        <figure class="pcard">
          <div class="pcard__fig">${photo({ id: 'W05', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: 'SUCTION ROBOT 표기가 보이는 궤도형 장비' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>장비 · 궤도형 장비의 외형</b><span>SUCTION ROBOT 표기가 보이는 궤도형 장비</span></figcaption>
        </figure>
        <figure class="pcard">
          <div class="pcard__fig">${photo({ id: 'R07', w: 1000, h: 667, sizes: [640, 1000, 1600], alt: '작업장 내 차량에 설치된 모니터·제어장치와 조작자' }, '(max-width:720px) 92vw, 420px')}</div>
          <figcaption><b>제어 · 모니터와 조작자</b><span>작업장 내 차량에 설치된 모니터·제어장치와 조작자</span></figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- 03 적용 조건 -->
  <section class="section">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">03 · APPLICABILITY</span><h2>적용의 출발점은<br>현장의 조건입니다.</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">적용 가능성은 아래 조건을 확인한 뒤 판단합니다. 알고 계신 정보를 보내 주시면 검토에 도움이 됩니다.</p></div>
      </div>
      <ul class="numlist" data-reveal>
${TECH.conditions.map((c, i) => `        <li><em>0${i + 1}</em><b>${esc(c.label)}</b><p>${esc(c.text)}</p></li>`).join('\n')}
      </ul>
    </div>
  </section>

  <!-- 04 작업의 흐름 -->
  <section class="section section--navy">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">04 · FLOW</span><h2>작업의 흐름과<br>후속 작업</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">${esc(TECH.followUp)}</p></div>
      </div>
      <ul class="flow" data-reveal>
${TECH.flow.map((f, i) => `        <li><em>0${i + 1}</em><b>${esc(f)}</b></li>`).join('\n')}
      </ul>
      <p class="note note--on-navy mt-22" data-reveal>${esc(TECH.flowNote)}</p>
    </div>
  </section>

  <!-- 05 회수 이후 -->
  <section class="section" id="recovery">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">05 · AFTER RECOVERY</span><h2>회수한 물질의<br>다음 과정까지.</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">${esc(RECOVERY.body)}</p></div>
      </div>
      <ul class="numlist" data-reveal>
${RECOVERY.steps.map((s, i) => `        <li><em>0${i + 1}</em><b>${esc(s.label)}</b><p>${esc(s.text)}</p></li>`).join('\n')}
      </ul>
      <div class="roles mt-28" data-reveal>
${RECOVERY.methods.map((m, i) => `        <div>${icon(i === 0 ? 'drop' : 'filter', 30)}<b>${esc(m.label)}</b><p>${esc(m.text)}</p></div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- 관련 업무 -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">RELATED</span><h2>관련 업무</h2></div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">로봇·작업 시스템과 함께 살펴볼 업무입니다. 업무별 대상과 상담 조건은 상세 화면에서 확인하세요.</p>
          <a class="tlink" href="services.html">사업분야 전체 보기 ${upArrow(14)}</a>
        </div>
      </div>
      <div class="grid grid--3">
${SERVICES.filter((s) => s.tech).map((s, i) => `        <a class="scard" href="${s.file}" data-reveal data-delay="${i * 70}">
          <span class="scard__ico">${icon(s.icon, 40)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.short)}</p>
          <span class="scard__go">자세히 보기 ${arrow(14)}</span>
        </a>`).join('\n')}
      </div>
    </div>
  </section>

` + cta({
  h2: '우리 현장에 적용할 수 있을지<br>함께 검토합니다.',
  p: '출입구와 내부 구조, 잔류물 특성 등 알고 계신 정보를 보내 주세요.'
}) + MAIN_END + footer() + foot();

/* ---------- 5. 수행 이력 ---------- */
pages['projects.html'] = () => head({
  file: 'projects.html', page: 'projects',
  title: `수행 이력 | ${C.brand}`,
  desc: '회사 자료에 수록된 신정개발의 과거 수행 이력입니다. 분야를 선택하거나 검색해 살펴볼 수 있습니다.'
}) + header('projects') + `
<main id="main">
` + phero({
  eyebrow: 'EXPERIENCE',
  h1: '수행 이력',
  lead: '회사 자료에 수록된 과거 수행 이력입니다. 각 이력은 회사 자료에 기재된 기간과 업무를 기준으로 안내합니다.',
  crumbs: [{ label: '수행 이력' }]
}) + `
  <section class="section">
    <div class="wrap">

      <div class="filters" role="group" aria-label="분야 선택" data-reveal>
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

      <p class="note" data-reveal>표시 중인 이력 <b id="recCount" class="ink">${PROJECTS.length}</b>건</p>

      <ul class="rec mt-10" id="recList" data-reveal>
${PROJECTS.slice().sort((a, b) => (a.period < b.period ? 1 : -1)).map((p) => `        <li class="rec__row" data-cat="${esc(p.cat)}" data-robot="${p.robot}" data-search="${esc(p.title + ' ' + p.cat + ' ' + p.summary)}">
          <span class="rec__date">${esc(p.period)}</span>
          <span class="rec__name">${esc(p.title)}${p.robot === 'stated' ? ' <span class="chip">로봇 적용</span>' : ''}</span>
          <span class="rec__cat">${esc(p.cat)}</span>
          <a class="rec__go" href="${svc(p.svc).file}">관련 업무 ${upArrow(13)}</a>
        </li>`).join('\n')}
      </ul>

      <p class="note rec__empty" id="recEmpty" hidden>조건에 맞는 이력이 없습니다. 다른 분야를 선택하거나 검색어를 지워 보세요.</p>

      <p class="note mt-22">각 이력은 회사 자료에 기재된 기간과 업무를 기준으로 안내합니다. ‘로봇 적용’ 표시는 자료에 로봇 적용이 명시된 이력에만 붙였습니다.</p>
    </div>
  </section>

` + cta({
  h2: '비슷한 현장을<br>검토하고 계신가요?',
  p: '참고하신 이력과 대상 설비를 알려 주시면 검토에 필요한 정보를 함께 확인하겠습니다.'
}) + MAIN_END + footer() + foot(['projects.js']);

/* ---------- 6. 회사 소개 ---------- */
pages['company.html'] = () => head({
  file: 'company.html', page: 'company',
  title: `회사 소개 | ${C.brand}`,
  desc: C.intro
}) + header('company') + `
<main id="main">
` + phero({
  eyebrow: 'ABOUT US',
  h1: `${C.founded}년부터<br>쌓아 온 현장 경험.`,
  lead: C.intro,
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
      <div class="split split--top">
        <div data-reveal>
          <span class="eyebrow">HISTORY</span>
          <h2>연혁</h2>
          <ul class="hist mt-28">
${C.history.map((h) => `            <li><b>${h.year}</b><span>${esc(h.label)}</span></li>`).join('\n')}
          </ul>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo({ id: 'M02', w: 1200, h: 816, sizes: [720, 1200], alt: '신정개발 상호가 보이는 건물 전경' }, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">신정개발 상호가 보이는 건물 전경</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split split--rev">
        <div data-reveal>
          <span class="eyebrow">ON SITE</span>
          <h2>설비와 작업 환경을<br>함께 살핍니다.</h2>
          <p class="lead mt-20">시설의 구조와 작업 목적, 잔류물의 특성을 확인하는 것에서 업무 검토가 시작됩니다.</p>
          <div class="mt-28"><a class="btn btn--line" href="services.html">사업분야 보기 ${arrow(18)}</a></div>
        </div>
        <figure class="split__media" data-reveal data-delay="90">
          <div class="split__fig">${photo({ id: 'M05', w: 1400, h: 804, sizes: [800, 1400], alt: '산업설비 현장의 차량과 안전구획' }, '(max-width:960px) 92vw, 620px')}</div>
          <figcaption class="split__cap">산업설비 현장의 차량과 안전구획</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">WHAT WE DO</span><h2>다루는 업무</h2></div>
        <div class="head__aside" data-reveal data-delay="90">
          <p class="lead">${esc(C.tagline)}. 다섯 가지 업무로 산업설비와 환경시설의 현장을 다룹니다.</p>
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
      <div class="head head--solo" data-reveal><div><span class="eyebrow">CONTACT</span><h2>연락처</h2></div></div>
      <dl class="dtable" data-reveal>
        <div><dt>회사명</dt><dd>${esc(C.name)}</dd></div>
        <div><dt>설립</dt><dd>${C.founded}년</dd></div>
        <div><dt>주소</dt><dd>${icon('pin', 17)} ${esc(C.address)}</dd></div>
        <div><dt>이메일</dt><dd>${icon('mail', 17)} <a href="mailto:${C.email}">${C.email}</a></dd></div>
        <div><dt>사업 범위</dt><dd>${SERVICES.map((s) => esc(s.title)).join(' · ')}</dd></div>
      </dl>
    </div>
  </section>

` + cta() + MAIN_END + footer() + foot();

/* ---------- 7. 현장 문의 ---------- */
pages['contact.html'] = () => head({
  file: 'contact.html', page: 'contact',
  title: `현장 문의 | ${C.brand}`,
  desc: '대상 설비와 작업 목적, 희망 일정을 보내 주시면 검토에 필요한 정보를 함께 확인합니다.'
}) + header('contact') + `
<main id="main">
` + phero({
  eyebrow: 'CONTACT',
  h1: '검토가 필요한 현장을<br>알려 주세요.',
  lead: '대상 설비와 작업 목적, 희망 일정을 보내 주시면 검토에 필요한 정보를 함께 확인하겠습니다.',
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
                  <option value="T01">로봇·작업 시스템</option>
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
              <div><dt>이메일</dt><dd><a href="mailto:${C.email}">${C.email}</a></dd></div>
              <div><dt>주소</dt><dd>${esc(C.address)}</dd></div>
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

          <div class="panel panel--line mt-16">
            <h3>알아 두실 점</h3>
            <p class="note mt-10">이 홈페이지에는 문의 접수 서버가 없습니다. 위 양식은 입력하신 내용을 정리해 <b class="ink">방문자의 메일 앱</b>으로 넘기는 방식이며, 홈페이지가 내용을 저장하거나 대신 발송하지 않습니다.</p>
          </div>
        </div>

      </div>
    </div>
  </section>

  <section class="section section--soft">
    <div class="wrap">
      <div class="head">
        <div data-reveal><span class="eyebrow">FAQ</span><h2>궁금한 점</h2></div>
        <div class="head__aside" data-reveal data-delay="90"><p class="lead">상담 전에 자주 묻는 내용을 정리했습니다.</p></div>
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
  eyebrow: 'ERROR 404',
  h1: '페이지를 찾을 수<br>없습니다.',
  lead: '주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래에서 찾으시는 내용을 골라 보세요.',
  crumbs: [{ label: '페이지를 찾을 수 없습니다' }]
}) + `
  <section class="section">
    <div class="wrap">
      <div class="head head--solo"><div><span class="eyebrow">WHERE TO GO</span><h2>이쪽으로 가 보세요</h2></div></div>
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
